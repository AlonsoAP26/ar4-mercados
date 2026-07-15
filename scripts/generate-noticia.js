const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'noticias.json');

const ALLOWED_SYMBOLS = [
  'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY',
  'FX_IDC:USDMXN', 'FX_IDC:USDCOP', 'FX_IDC:USDCLP', 'FX_IDC:USDARS', 'FX_IDC:USDBRL', 'FX_IDC:USDPEN',
  'OANDA:XAUUSD', 'OANDA:XAGUSD', 'TVC:USOIL', 'TVC:UKOIL', 'CAPITALCOM:DXY',
  'FOREXCOM:SPXUSD', 'FOREXCOM:NSXUSD', 'BMFBOVESPA:IBOV',
  'BITSTAMP:BTCUSD', 'COINBASE:ETHUSD',
  'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NASDAQ:NVDA', 'NASDAQ:AMZN', 'NASDAQ:GOOGL', 'NASDAQ:META',
  'NYSE:JPM', 'NYSE:VALE', 'NYSE:PBR', 'NYSE:MELI'
];

const STORY_TYPES = [
  {
    key: 'cierre_sesion',
    category: 'Índices',
    instruction: 'Redacta un RESUMEN DE CIERRE DE SESIÓN de mercado: cómo terminó la jornada en los principales índices/activos (Wall Street, algún índice o activo relevante para Latinoamérica), qué sectores o instrumentos lideraron y cuáles quedaron rezagados, y el contexto detrás del movimiento del día. Estilo "market wrap" de un desk de research.'
  },
  {
    key: 'resultados_empresa',
    category: 'Empresas',
    instruction: 'Redacta una noticia sobre RESULTADOS TRIMESTRALES (earnings) de una empresa cotizada grande (tecnológica estadounidense, banco, o una ADR relevante para Latinoamérica como Vale, Petrobras o MercadoLibre). Incluye cifras concretas plausibles: ingresos, utilidad por acción (EPS), comparación contra expectativas del consenso, y la reacción de la acción en el mercado. Explica qué implica para el sector o para inversionistas de la región.'
  },
  {
    key: 'dato_macro',
    category: 'Forex',
    instruction: 'Redacta una noticia sobre un DATO MACROECONÓMICO recién publicado (inflación/IPC, nómina no agrícola, decisión de tasas de un banco central, PIB, PMI, desempleo) de EE.UU., la eurozona, o algún país de Latinoamérica. Incluye la cifra publicada, la cifra esperada por el consenso, y cómo reaccionaron los mercados (divisas, tasas, bolsas) inmediatamente después.'
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

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Falta la variable de entorno ANTHROPIC_API_KEY');
    process.exit(1);
  }

  const noticias = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const existingTitles = noticias.slice(-25).map(n => `- ${n.title}`).join('\n');
  const storyType = STORY_TYPES[Math.floor(Math.random() * STORY_TYPES.length)];
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `Eres periodista de mercados de AR4 Mercados, un sitio de trading en español para Latinoamérica. Hoy es ${today}. Genera UNA noticia nueva y original de mercado.

TIPO DE NOTICIA A GENERAR: ${storyType.instruction}

No repitas ninguno de estos temas ya publicados recientemente:
${existingTitles}

Elige el instrumento principal usando EXACTAMENTE uno de estos códigos: ${ALLOWED_SYMBOLS.join(', ')}.

REGLAS ESTRICTAS DE CONTENIDO:
- REGISTRO SERIO Y PROFESIONAL, tipo agencia de noticias financiera (Reuters, Bloomberg), NO informal. Frases declarativas, cifras concretas y plausibles (no inventes cifras absurdas o fuera de rango realista para el activo/empresa).
- Usa datos NUMÉRICOS concretos: precios, porcentajes, cifras de resultados, tasas, fechas. Eso es lo que le da valor periodístico a la pieza.
- Evita muletillas de IA ("es importante destacar que", "cabe mencionar que", "en resumen") y ganchos retóricos ("aquí es donde se pone interesante", "ojo con").
- Cada noticia debe sentirse distinta en estructura a las anteriores: varía el orden (a veces abre con la cifra, a veces con la reacción del mercado, a veces con el contexto previo) y cuántas secciones usas (3-4).
- SUBTÍTULOS ESPECÍFICOS AL TEMA, nunca genéricos como "Contexto" o "Qué pasó".
- Debes generar DOS bloques de contenido:
  1. "body": la noticia principal, visible para todos los lectores, con 3-4 secciones <h3>/<p>.
  2. "bodyPremium": contenido adicional exclusivo para suscriptores Premium, con 2 secciones: una con MÁS DATOS MACRO/FINANCIEROS de respaldo (cifras históricas comparables, contexto de trimestres o meses anteriores), y una final titulada exactamente "Conclusión y análisis final" con la lectura more profunda de hacia dónde podría ir esto y qué vigilar.
- Termina el "bodyPremium" (no el "body") con este disclaimer exacto como último párrafo: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es informativo y de contexto de mercado, no constituye asesoría financiera ni una recomendación de inversión.</em></p>"

Además de la noticia, genera estos bloques adicionales de análisis IA (todos claramente etiquetados como generados por IA en el sitio, así que pueden ser interpretativos, pero SIN inventar niveles de precio específicos ni estadísticas históricas verificables con años y porcentajes concretos — eso sería presentar datos falsos como reales):

- "aiSummary": un resumen ultra rápido de la noticia (qué pasó, por qué importa, qué activos toca, qué vigilar después). NO repitas el titular textualmente.
- "aiScenarios": tres probabilidades (alcista/lateral/bajista) que SUMEN EXACTAMENTE 100, reflejando tu lectura del sesgo de la noticia. Es una estimación cualitativa de IA, no un cálculo estadístico real.
- "aiDetects": una lectura corta de "qué está mirando la IA" en este movimiento: probabilidad de continuidad del sesgo actual (0-100), nivel de riesgo (Bajo/Medio/Alto), y una frase de lectura. NUNCA incluyas cifras de precio o niveles técnicos exactos aquí (para eso ya existe el gráfico en vivo de TradingView en la página); mantente en el terreno narrativo/probabilístico.
- "timeline": 3 a 4 hitos que construyen el contexto de ESTA noticia dentro de su propia narrativa (ej. "Hace 2 días", "Ayer", "Hoy", "Próxima semana"), coherentes con el cuerpo de la noticia. Esto es parte del relato editorial de la pieza, no una base de datos histórica externa verificada.
- "faq": 3 a 4 preguntas frecuentes breves y sus respuestas, educativas, relacionadas con el tema de la noticia (ej. "¿Qué es la Fed?", "¿Por qué sube el oro?").
- "impactScore": un número del 1 al 10 que refleje tu estimación editorial de qué tan relevante es esta noticia para los mercados (10 = máxima relevancia).
- "relatedSymbols": entre 2 y 5 códigos de instrumento (EXACTOS, de la lista de códigos permitidos arriba, sin repetir el símbolo principal) que se ven afectados o correlacionados con esta noticia — se usarán para mostrar cotizaciones EN VIVO reales de TradingView, así que elige solo instrumentos genuinamente relacionados.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 100 caracteres",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "symbol": "uno de los códigos de instrumento listados arriba, EXACTO",
  "body": "string HTML con 3-4 secciones <h3 style=\\"margin:20px 0 10px;font-size:1.15rem;\\">[subtítulo específico]</h3><p>...</p>, cifras concretas",
  "bodyPremium": "string HTML con 2 secciones, la última titulada exactamente 'Conclusión y análisis final', terminando con el disclaimer indicado",
  "trend": "'up' si el sesgo es alcista para el activo, 'down' si es bajista, 'neutral' si es mixto o sin dirección clara",
  "aiSummary": { "que": "string", "porque": "string", "activos": ["string", "..."], "siguiente": "string" },
  "aiScenarios": { "alcista": number, "lateral": number, "bajista": number },
  "aiDetects": { "probabilidad": number, "riesgo": "Bajo|Medio|Alto", "lectura": "string" },
  "timeline": [{ "cuando": "string", "texto": "string" }],
  "faq": [{ "q": "string", "a": "string" }],
  "impactScore": number,
  "relatedSymbols": ["string", "..."]
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      // Explicitos a proposito: Sonnet 5 piensa por defecto y esos tokens salen
      // del mismo max_tokens que la respuesta. Con el limite anterior el JSON
      // salia cortado y JSON.parse fallaba. max_tokens es solo un tope: se
      // factura lo que se genera de verdad, asi que dar aire no cuesta nada.
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Error de la API de Anthropic (HTTP ' + res.status + '):', errText);
    process.exit(1);
  }

  const data = await res.json();
  if (data.stop_reason === 'max_tokens') {
    console.error('Respuesta cortada por max_tokens. Uso:', JSON.stringify(data.usage));
    process.exit(1);
  }
  const textBlock = Array.isArray(data.content) ? data.content.find(b => b.type === 'text') : null;
  if (!textBlock) {
    console.error('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason, JSON.stringify(data.usage));
    process.exit(1);
  }
  let rawText = textBlock.text.trim();
  const fence = rawText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) rawText = fence[1].trim();

  let nueva;
  try {
    nueva = JSON.parse(rawText);
  } catch (e) {
    console.error('La IA no devolvió un JSON válido. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
    console.error(rawText.slice(0, 1500));
    process.exit(1);
  }

  if (!ALLOWED_SYMBOLS.includes(nueva.symbol)) {
    console.warn('Symbol no reconocido, se omite el gráfico:', nueva.symbol);
    delete nueva.symbol;
  }

  const CATEGORY_HERO = { 'Forex': 'forex', 'Índices': 'index', 'Empresas': 'index' };
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
    ? nueva.timeline.slice(0, 4).filter(t => t && t.cuando && t.texto).map(t => ({ cuando: String(t.cuando).slice(0, 40), texto: String(t.texto).slice(0, 200) }))
    : [];

  nueva.faq = Array.isArray(nueva.faq)
    ? nueva.faq.slice(0, 4).filter(f => f && f.q && f.a).map(f => ({ q: String(f.q).slice(0, 150), a: String(f.a).slice(0, 400) }))
    : [];

  let impactScore = Number(nueva.impactScore);
  nueva.impactScore = Number.isFinite(impactScore) ? Math.max(1, Math.min(10, Math.round(impactScore))) : null;

  nueva.relatedSymbols = Array.isArray(nueva.relatedSymbols)
    ? [...new Set(nueva.relatedSymbols.filter(s => ALLOWED_SYMBOLS.includes(s) && s !== nueva.symbol))].slice(0, 5)
    : [];

  nueva.slug = slugify(nueva.title) + '-' + Date.now().toString(36);
  nueva.author = 'AR4 Mercados';
  nueva.date = today;
  nueva.sourceName = 'AR4 Mercados — Mesa de Research';
  nueva.sourceUrl = 'https://ar4mercados.com/noticias.html';

  noticias.push(nueva);
  fs.writeFileSync(DATA_PATH, JSON.stringify(noticias, null, 2) + '\n');

  console.log('Noticia generada (' + storyType.key + '):', nueva.title);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
