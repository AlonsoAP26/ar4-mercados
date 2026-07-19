const fs = require('fs');
const path = require('path');
const { buildDossier, dossierToPrompt, TV_NAMES } = require('./_market-data');

const DATA_PATH = path.join(__dirname, '..', 'data', 'noticias.json');

// El paso corre con continue-on-error, asi que el log del fallo queda oculto
// tras un check verde. Una anotacion ::error:: si es visible (incluso sin
// iniciar sesion en GitHub), y es la unica forma de diagnosticar en remoto.
function fail(msg) {
  console.error(msg);
  console.log('::error title=Generador de noticias::' + String(msg).replace(/\r?\n/g, ' | ').slice(0, 600));
  process.exit(1);
}

const ALLOWED_SYMBOLS = [
  'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY',
  'FX_IDC:USDMXN', 'FX_IDC:USDCOP', 'FX_IDC:USDCLP', 'FX_IDC:USDARS', 'FX_IDC:USDBRL', 'FX_IDC:USDPEN',
  'OANDA:XAUUSD', 'OANDA:XAGUSD', 'TVC:USOIL', 'TVC:UKOIL', 'CAPITALCOM:DXY',
  'FOREXCOM:SPXUSD', 'FOREXCOM:NSXUSD', 'BMFBOVESPA:IBOV',
  'BITSTAMP:BTCUSD', 'COINBASE:ETHUSD',
  'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:NVDA', 'NASDAQ:AMZN', 'NASDAQ:GOOGL', 'NASDAQ:META',
  'NYSE:JPM', 'NYSE:VALE', 'NYSE:PBR', 'NYSE:MELI'
];

// Cada tipo de noticia trae su propia consulta de busqueda y su panel de
// instrumentos reales, para que el redactor tenga hechos y cifras verificables.
const STORY_TYPES = [
  {
    key: 'cierre_sesion',
    category: 'Índices',
    panel: ['FOREXCOM:SPXUSD', 'FOREXCOM:NSXUSD', 'BMFBOVESPA:IBOV', 'CAPITALCOM:DXY'],
    busqueda: 'cierre de Wall Street hoy S&P 500 Nasdaq resumen sesión mercados',
    instruction: 'Redacta un RESUMEN DE CIERRE DE SESIÓN: cómo terminó la jornada en los principales índices, qué la explicó y qué implica para Latinoamérica. Estilo "market wrap" de un desk de research.'
  },
  {
    key: 'resultados_empresa',
    category: 'Empresas',
    panel: ['NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:NVDA', 'NYSE:VALE', 'NYSE:PBR', 'NYSE:MELI'],
    busqueda: 'resultados trimestrales earnings report empresa cotizada esta semana ingresos EPS',
    instruction: 'Redacta una noticia sobre RESULTADOS TRIMESTRALES (earnings) recién publicados de una empresa cotizada grande. Usa las cifras REALES que encuentres en la búsqueda (ingresos, EPS, comparación con el consenso) y explica qué implica para el sector o para inversionistas de la región.'
  },
  {
    key: 'dato_macro',
    category: 'Forex',
    panel: ['FX:EURUSD', 'CAPITALCOM:DXY', 'OANDA:XAUUSD', 'FX_IDC:USDMXN', 'FX_IDC:USDBRL'],
    busqueda: 'dato macroeconómico publicado hoy inflación IPC empleo tasas banco central mercados reacción',
    instruction: 'Redacta una noticia sobre un DATO MACROECONÓMICO recién publicado (inflación, empleo, tasas, PIB, PMI). Usa la cifra REAL publicada y la esperada por el consenso según la búsqueda, y describe la reacción del mercado.'
  }
];

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

// Normaliza para comparar: la misma URL puede volver con/sin barra final, con
// www o en otro caso. Sin esto descartariamos fuentes legitimas por una barra.
// Una URL inventada sigue sin coincidir con ninguna real, que es lo que importa.
function normUrl(u) {
  try {
    const x = new URL(String(u));
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + x.search).toLowerCase();
  } catch (e) {
    return String(u).toLowerCase().replace(/\/+$/, '');
  }
}

// Todas las URLs que la busqueda web devolvio de verdad. Sirven para comprobar
// que el modelo no se invente una fuente.
function collectSearchUrls(allContent) {
  const urls = new Set();
  const searchErrors = [];
  let searchBlocks = 0;
  for (const b of allContent) {
    if (b && b.type === 'web_search_tool_result') {
      searchBlocks++;
      if (Array.isArray(b.content)) {
        for (const r of b.content) if (r && r.url) urls.add(normUrl(r.url));
      } else if (b.content && b.content.error_code) {
        // OJO: un error de busqueda web NO lanza excepcion — llega como HTTP 200
        // con content = objeto {error_code} en vez de lista. Sin esto, el fallo
        // se disfraza de "ninguna fuente verificable" sin explicar la causa.
        searchErrors.push(b.content.error_code);
      }
    }
  }
  return { urls, searchErrors, searchBlocks };
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return null; }
}

// Reconstruye el mensaje completo desde el flujo SSE de la API. CAUSA RAIZ del
// "fetch failed" que tumbo la noticia del 17 al 19/jul: sin streaming, una
// peticion con busqueda web tarda mas de 5 minutos en devolver el primer byte
// y el fetch de Node la aborta a los 300s. Con stream:true los datos fluyen
// cada pocos segundos y el tope de inactividad nunca se alcanza.
async function readSse(res) {
  const decoder = new TextDecoder();
  let buf = '';
  const content = [];
  const partialJson = {};
  let stopReason = null;
  let stopDetails = null;
  let usage = null;

  const handle = (ev) => {
    if (ev.type === 'error') {
      throw new Error('Error en el stream de la API: ' + JSON.stringify(ev.error || {}).slice(0, 300));
    } else if (ev.type === 'content_block_start') {
      content[ev.index] = ev.content_block;
      partialJson[ev.index] = '';
    } else if (ev.type === 'content_block_delta') {
      const b = content[ev.index];
      const d = ev.delta || {};
      if (d.type === 'text_delta') b.text = (b.text || '') + d.text;
      else if (d.type === 'thinking_delta') b.thinking = (b.thinking || '') + d.thinking;
      else if (d.type === 'signature_delta') b.signature = (b.signature || '') + d.signature;
      else if (d.type === 'input_json_delta') partialJson[ev.index] += d.partial_json;
      else if (d.type === 'citations_delta') { b.citations = b.citations || []; b.citations.push(d.citation); }
    } else if (ev.type === 'content_block_stop') {
      const b = content[ev.index];
      // El input de los tool_use llega como JSON parcial; se arma al cerrar el bloque.
      if (b && (b.type === 'tool_use' || b.type === 'server_tool_use')) {
        b.input = partialJson[ev.index] ? JSON.parse(partialJson[ev.index]) : (b.input || {});
      }
    } else if (ev.type === 'message_delta') {
      if (ev.delta && ev.delta.stop_reason) stopReason = ev.delta.stop_reason;
      if (ev.delta && ev.delta.stop_details) stopDetails = ev.delta.stop_details;
      if (ev.usage) usage = ev.usage;
    }
  };

  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of raw.split('\n')) {
        if (line.startsWith('data: ')) handle(JSON.parse(line.slice(6)));
      }
    }
  }
  return { content: content.filter(Boolean), stop_reason: stopReason, stop_details: stopDetails, usage };
}

async function callApi(apiKey, messages) {
  // Reintentos con espera ante errores transitorios (429/5xx/cortes de red):
  // el cron corre en hora pico de la API y un fallo puntual no debe tumbar la noticia.
  let lastErr = null;
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 16000,
          thinking: { type: 'adaptive' },
          stream: true,
          // Busqueda web del lado del servidor: el modelo lee noticias reales y
          // devuelve las URLs de donde salieron. Sin esto escribiria de memoria.
          tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6 }],
          messages
        })
      });
      if (res.ok) return await readSse(res);
      const errText = await res.text();
      lastErr = 'API de Anthropic (HTTP ' + res.status + '): ' + errText.slice(0, 400);
      console.warn('Intento ' + intento + ' fallido: ' + lastErr);
      if (res.status !== 429 && res.status < 500) {
        break; // errores 4xx no transitorios: no insistir
      }
    } catch (e) {
      // "fetch failed" y cortes a mitad de stream son transitorios: reintentar.
      lastErr = 'Red/stream: ' + (e && e.message ? e.message : String(e));
      console.warn('Intento ' + intento + ' fallido: ' + lastErr);
    }
    if (intento < 4) await new Promise((r) => setTimeout(r, intento * 20000));
  }
  throw new Error(lastErr);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    fail('Falta la variable de entorno ANTHROPIC_API_KEY');
  }

  const noticias = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  // Candado anti-duplicados: si ya hay contenido de hoy (re-corrida manual o
  // relanzamiento del watchdog), no se genera otro. Salida 0 = corrida verde.
  const hoyGuard = new Date().toISOString().slice(0, 10);
  if (noticias.some((x) => String(x.date || x.fecha || '').slice(0, 10) === hoyGuard)) {
    console.log('Ya hay contenido publicado hoy (' + hoyGuard + '); nada que generar.');
    process.exit(0);
  }

  const existingTitles = noticias.slice(-25).map((n) => `- ${n.title}`).join('\n');
  const storyType = STORY_TYPES[Math.floor(Math.random() * STORY_TYPES.length)];
  const today = new Date().toISOString().slice(0, 10);

  // Panel de datos reales de los instrumentos que toca este tipo de noticia.
  const dossiers = [];
  for (const sym of storyType.panel) {
    try {
      dossiers.push(await buildDossier(sym));
    } catch (e) {
      console.warn('Sin datos para ' + sym + ': ' + e.message);
    }
  }
  if (!dossiers.length) {
    fail('No se pudo obtener ningún dato real de mercado. No se publica nada.');
  }
  const panel = dossiers.map((d) =>
    '- ' + d.nombre + ' (' + d.symbol + '): precio ' + d.precio +
    ', variación del día ' + d.variacionDiaPct + '%' +
    ', semana ' + d.variacionSemanaPct + '%' +
    ', mes ' + d.variacionMesPct + '%' +
    ', RSI(14) ' + d.rsi14 + ' (' + d.lecturaRsi + ')' +
    ', precio ' + d.posicionVsMedia200 + ' de la media de 200' +
    ', máximo 52sem ' + d.maximo52sem + ' / mínimo 52sem ' + d.minimo52sem
  ).join('\n');

  const prompt = `Eres periodista de mercados de AR4 Mercados, un sitio de trading en español para Latinoamérica. Hoy es ${today}.

TAREA: ${storyType.instruction}

PASO 1 — INVESTIGA. Usa la herramienta de búsqueda web (varias veces si hace falta) para averiguar qué pasó DE VERDAD hoy o en las últimas 24-48 horas. Sugerencia de punto de partida: "${storyType.busqueda}". Busca la cifra concreta, la fuente y el contexto. No escribas nada hasta tener hechos reales localizados.

PASO 2 — ESCRIBE usando solo lo que verificaste.

═══════════════════════════════════════════════
DATOS DE MERCADO REALES (medidos, no estimados)
═══════════════════════════════════════════════
Cotizaciones y variaciones reales calculadas desde el histórico de precios (Yahoo Finance), al ${today}:
${panel}

Puedes citar estas cifras con total confianza: son reales y verificables.

═══════════════════════════════════════════════
REGLA NÚMERO UNO, INNEGOCIABLE — NADA INVENTADO
═══════════════════════════════════════════════
Esta pieza va firmada como noticia de mercado y la leerán traders reales que pueden tomar decisiones con ella.

- Cada cifra debe venir de (a) el panel de datos reales de arriba, o (b) un resultado concreto de tu búsqueda web. NO HAY TERCERA OPCIÓN.
- PROHIBIDO inventar o "estimar de forma plausible" cifras de resultados, datos macro, precios o niveles. Una cifra inventada que parece razonable es peor que ninguna cifra: es información falsa firmada por una mesa de research.
- Si la búsqueda no te da un dato concreto, NO lo inventes: escribe la noticia con lo que sí verificaste, o enfoca la pieza en lo que sí puedes sostener con el panel de datos reales.
- "sources" debe contener SOLO URLs que aparezcan literalmente en tus resultados de búsqueda. Si citas una URL que no salió de la búsqueda, la pieza se descarta automáticamente. No inventes URLs ni las reconstruyas de memoria.
- Usa coma decimal (formato español): 1,1435 / 4.067,9.

REGLAS DE ESTILO (mantén este estándar):
- REGISTRO SERIO Y PROFESIONAL, tipo agencia financiera (Reuters, Bloomberg). Frases declarativas.
- Evita muletillas de IA ("es importante destacar que", "cabe mencionar que", "en resumen") y ganchos retóricos ("aquí es donde se pone interesante", "ojo con").
- Cada noticia debe sentirse distinta en estructura a las anteriores: varía el orden (a veces abre con la cifra, a veces con la reacción del mercado, a veces con el contexto) y cuántas secciones usas (3-4).
- SUBTÍTULOS ESPECÍFICOS AL TEMA, nunca genéricos como "Contexto" o "Qué pasó".
- Dos bloques de contenido:
  1. "body": la noticia principal, visible para todos, 3-4 secciones <h3>/<p>, con las cifras reales.
  2. "bodyPremium": contenido exclusivo Premium, 2 secciones: una con más datos de respaldo (usa el panel real y lo que hayas verificado en la búsqueda) y una final titulada exactamente "Conclusión y análisis final" con la lectura de hacia dónde podría ir esto y qué vigilar.
- Termina el "bodyPremium" (no el "body") con este disclaimer exacto como último párrafo: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es informativo y de contexto de mercado, no constituye asesoría financiera ni una recomendación de inversión.</em></p>"

No repitas estos temas ya publicados:
${existingTitles}

El instrumento principal ("symbol") debe ser EXACTAMENTE uno de estos códigos: ${ALLOWED_SYMBOLS.join(', ')}.

Bloques de análisis IA (se muestran etiquetados como generados por IA, pueden ser interpretativos, pero SIN inventar cifras):
- "aiSummary": resumen ultra rápido (qué pasó, por qué importa, qué activos toca, qué vigilar). NO repitas el titular textualmente.
- "aiScenarios": tres probabilidades (alcista/lateral/bajista) que SUMEN EXACTAMENTE 100. Es una lectura cualitativa de IA, no un cálculo estadístico.
- "aiDetects": probabilidad de continuidad del sesgo (0-100), riesgo (Bajo/Medio/Alto) y una frase de lectura. Sin niveles de precio exactos aquí (para eso está el gráfico en vivo en la página).
- "timeline": 3-4 hitos reales y verificados que construyen el contexto de ESTA noticia ("Hace 2 días", "Ayer", "Hoy", "Próxima semana"). Si no verificaste un hito, no lo pongas.
- "faq": 3-4 preguntas frecuentes breves y educativas relacionadas con el tema (ej. "¿Qué es la Fed?", "¿Por qué sube el oro?").
- "impactScore": número del 1 al 10 con tu estimación editorial de relevancia para los mercados.
- "relatedSymbols": 2-5 códigos EXACTOS de la lista permitida (sin repetir el principal) genuinamente relacionados; se usan para mostrar cotizaciones en vivo reales.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 100 caracteres",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "symbol": "uno de los códigos permitidos, EXACTO",
  "body": "string HTML con 3-4 secciones <h3 style=\\"margin:20px 0 10px;font-size:1.15rem;\\">[subtítulo específico]</h3><p>...</p>, con cifras reales",
  "bodyPremium": "string HTML con 2 secciones, la última titulada exactamente 'Conclusión y análisis final', terminando con el disclaimer indicado",
  "trend": "'up' | 'down' | 'neutral'",
  "sources": [{ "name": "nombre del medio", "url": "URL exacta salida de tu búsqueda web" }],
  "aiSummary": { "que": "string", "porque": "string", "activos": ["string"], "siguiente": "string" },
  "aiScenarios": { "alcista": number, "lateral": number, "bajista": number },
  "aiDetects": { "probabilidad": number, "riesgo": "Bajo|Medio|Alto", "lectura": "string" },
  "timeline": [{ "cuando": "string", "texto": "string" }],
  "faq": [{ "q": "string", "a": "string" }],
  "impactScore": number,
  "relatedSymbols": ["string"]
}`;

  // La busqueda web puede pausar el turno si agota sus iteraciones; se reanuda
  // reenviando la conversacion tal cual.
  const messages = [{ role: 'user', content: prompt }];
  const allContent = [];
  let data = null;
  for (let intento = 0; intento < 8; intento++) {
    data = await callApi(apiKey, messages);
    allContent.push(...(data.content || []));
    if (data.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: data.content });
      continue;
    }
    break;
  }

  if (data.stop_reason === 'pause_turn') {
    fail('La búsqueda web no terminó tras 8 rondas de reanudación. Uso: ' + JSON.stringify(data.usage));
  }
  if (data.stop_reason === 'max_tokens') {
    fail('Respuesta cortada por max_tokens. Uso: ' + JSON.stringify(data.usage));
  }
  if (data.stop_reason === 'refusal') {
    fail('El modelo rechazó la petición. ' + JSON.stringify(data.stop_details || {}));
  }

  const { urls: searchUrls, searchErrors, searchBlocks } = collectSearchUrls(allContent);
  console.log('Bloques de búsqueda web: ' + searchBlocks + ', URLs reales recibidas: ' + searchUrls.size);
  if (searchErrors.length) {
    console.warn('Errores de búsqueda web: ' + searchErrors.join(', '));
  }
  if (!searchBlocks) {
    console.warn('El modelo no ejecutó ninguna búsqueda web (stop_reason=' + data.stop_reason + ').');
  }

  // OJO: con busqueda web el modelo suele escribir texto ANTES de buscar
  // ("voy a consultar..."), asi que la respuesta trae varios bloques de texto.
  // El JSON es siempre el ULTIMO; coger el primero rompia el JSON.parse.
  const textBlocks = (data.content || []).filter((b) => b.type === 'text' && b.text);
  if (!textBlocks.length) {
    fail('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
  }
  let rawText = textBlocks[textBlocks.length - 1].text.trim();
  const fence = rawText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) rawText = fence[1].trim();
  // Ultimo recurso: si aun asi no empieza por '{', rescata el objeto JSON.
  if (!rawText.startsWith('{')) {
    const a = rawText.indexOf('{');
    const b = rawText.lastIndexOf('}');
    if (a !== -1 && b > a) rawText = rawText.slice(a, b + 1);
  }

  let nueva = null;
  try {
    nueva = JSON.parse(rawText);
  } catch (e) {
    // Rescate: con búsqueda web el JSON a veces queda en un bloque anterior
    // (el modelo añade texto de cierre después). Probar todos, del último al primero.
    const allTexts = allContent.filter((b) => b.type === 'text' && b.text).map((b) => b.text);
    for (let i = allTexts.length - 1; i >= 0 && !nueva; i--) {
      let t = allTexts[i].trim();
      const f = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
      if (f) t = f[1].trim();
      const a = t.indexOf('{');
      const b2 = t.lastIndexOf('}');
      if (a === -1 || b2 <= a) continue;
      try { nueva = JSON.parse(t.slice(a, b2 + 1)); } catch (e2) { /* siguiente bloque */ }
    }
    if (!nueva) {
      console.error(rawText.slice(0, 1500));
      fail('La IA no devolvió un JSON válido en ningún bloque. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
    }
    console.warn('JSON rescatado de un bloque anterior de la respuesta.');
  }

  if (!nueva.title || !nueva.body) {
    fail('Faltan campos obligatorios (title/body).');
  }

  // VERIFICACION DE FUENTES: solo sobreviven las URLs que la busqueda devolvio
  // de verdad. Asi una fuente inventada no llega a publicarse.
  const citadas = Array.isArray(nueva.sources) ? nueva.sources : [];
  const verificadas = citadas.filter((s) => s && s.url && searchUrls.has(normUrl(s.url)));
  const inventadas = citadas.filter((s) => s && s.url && !searchUrls.has(normUrl(s.url)));
  if (inventadas.length) {
    console.warn('Se descartan ' + inventadas.length + ' fuente(s) que no salieron de la búsqueda:');
    inventadas.forEach((s) => console.warn('  - ' + s.url));
  }
  if (!verificadas.length) {
    console.error('No se publica: una noticia sin fuente verificable no debe salir firmada como research.');
    fail('Ninguna fuente citada pudo verificarse. Citadas: ' + citadas.length +
      ', URLs de búsqueda: ' + searchUrls.size +
      ', bloques de búsqueda: ' + searchBlocks +
      (searchErrors.length ? ', errores de búsqueda: ' + searchErrors.join(',') : ''));
  }

  if (!ALLOWED_SYMBOLS.includes(nueva.symbol)) {
    console.warn('Symbol no reconocido, se omite el gráfico:', nueva.symbol);
    delete nueva.symbol;
  }

  const CATEGORY_HERO = { Forex: 'forex', 'Índices': 'index', Empresas: 'index' };
  nueva.category = storyType.category;
  nueva.heroType = CATEGORY_HERO[nueva.category] || 'index';
  if (!['up', 'down', 'neutral'].includes(nueva.trend)) nueva.trend = 'neutral';

  if (!nueva.aiSummary || typeof nueva.aiSummary !== 'object') nueva.aiSummary = null;
  else {
    nueva.aiSummary = {
      que: String(nueva.aiSummary.que || '').slice(0, 300),
      porque: String(nueva.aiSummary.porque || '').slice(0, 300),
      activos: Array.isArray(nueva.aiSummary.activos) ? nueva.aiSummary.activos.slice(0, 5).map(String) : [],
      siguiente: String(nueva.aiSummary.siguiente || '').slice(0, 300)
    };
  }

  if (nueva.aiScenarios && typeof nueva.aiScenarios === 'object') {
    let { alcista, lateral, bajista } = nueva.aiScenarios;
    alcista = Number(alcista) || 0; lateral = Number(lateral) || 0; bajista = Number(bajista) || 0;
    const total = alcista + lateral + bajista;
    if (total > 0) {
      nueva.aiScenarios = {
        alcista: Math.round((alcista / total) * 100),
        lateral: Math.round((lateral / total) * 100),
        bajista: Math.round((bajista / total) * 100)
      };
      const sum = nueva.aiScenarios.alcista + nueva.aiScenarios.lateral + nueva.aiScenarios.bajista;
      nueva.aiScenarios.lateral += 100 - sum;
    } else {
      nueva.aiScenarios = null;
    }
  } else {
    nueva.aiScenarios = null;
  }

  if (nueva.aiDetects && typeof nueva.aiDetects === 'object') {
    const riesgo = ['Bajo', 'Medio', 'Alto'].includes(nueva.aiDetects.riesgo) ? nueva.aiDetects.riesgo : 'Medio';
    let probabilidad = Number(nueva.aiDetects.probabilidad);
    if (!Number.isFinite(probabilidad)) probabilidad = 50;
    probabilidad = Math.max(0, Math.min(100, Math.round(probabilidad)));
    nueva.aiDetects = { probabilidad, riesgo, lectura: String(nueva.aiDetects.lectura || '').slice(0, 300) };
  } else {
    nueva.aiDetects = null;
  }

  nueva.timeline = Array.isArray(nueva.timeline)
    ? nueva.timeline.slice(0, 4).filter((t) => t && t.cuando && t.texto).map((t) => ({ cuando: String(t.cuando).slice(0, 40), texto: String(t.texto).slice(0, 200) }))
    : [];

  nueva.faq = Array.isArray(nueva.faq)
    ? nueva.faq.slice(0, 4).filter((f) => f && f.q && f.a).map((f) => ({ q: String(f.q).slice(0, 150), a: String(f.a).slice(0, 400) }))
    : [];

  const impactScore = Number(nueva.impactScore);
  nueva.impactScore = Number.isFinite(impactScore) ? Math.max(1, Math.min(10, Math.round(impactScore))) : null;

  nueva.relatedSymbols = Array.isArray(nueva.relatedSymbols)
    ? [...new Set(nueva.relatedSymbols.filter((s) => ALLOWED_SYMBOLS.includes(s) && s !== nueva.symbol))].slice(0, 5)
    : [];

  nueva.slug = slugify(nueva.title) + '-' + Date.now().toString(36);
  nueva.author = 'AR4 Mercados';
  nueva.date = today;

  // La fuente ahora es real y verificada, no un enlace a nosotros mismos.
  nueva.sources = verificadas.slice(0, 4).map((s) => ({ name: String(s.name || hostOf(s.url) || 'Fuente'), url: String(s.url) }));
  nueva.sourceName = nueva.sources[0].name;
  nueva.sourceUrl = nueva.sources[0].url;

  // Panel completo usado al redactar: permite auditar cualquier cifra del texto.
  nueva.marketPanel = dossiers;

  // Dossier del instrumento principal, con la MISMA forma que en las ideas, para
  // que el panel de indicadores del sitio sea identico en noticias y analisis.
  // El modelo elige el symbol despues de escribir, asi que se trae aqui.
  if (nueva.symbol) {
    const yaTraido = dossiers.find((d) => d.symbol === nueva.symbol);
    if (yaTraido) {
      nueva.marketData = yaTraido;
    } else {
      try {
        nueva.marketData = await buildDossier(nueva.symbol);
      } catch (e) {
        console.warn('Sin datos del instrumento principal ' + nueva.symbol + ': ' + e.message);
        nueva.marketData = null;
      }
    }
  }

  noticias.push(nueva);
  fs.writeFileSync(DATA_PATH, JSON.stringify(noticias, null, 2) + '\n');

  console.log('Noticia generada (' + storyType.key + '): ' + nueva.title);
  console.log('  Fuentes verificadas: ' + nueva.sources.map((s) => s.name + ' <' + s.url + '>').join(' | '));
}

main().catch((err) => {
  console.error(err);
  fail(err && err.message ? err.message : String(err));
});
