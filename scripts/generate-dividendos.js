// Calendario mensual de dividendos.
//
// Por que existe y por que NO es "un ranking de los mejores earnings":
//  - Resultados trimestrales y dividendos son dos cosas distintas: las empresas
//    que mas crecen suelen repartir poco, y las de dividendo alto suelen tener
//    crecimiento plano. Mezclarlos da un ranking que no se sostiene con cifras.
//  - Un calendario del mes QUE VIENE es accionable (fechas que aun no pasaron)
//    y ademas es mucho mas seguro de generar: fechas y montos ya declarados son
//    datos duros publicados, no estimaciones que el modelo pueda inventar.
//  - El lector de AR4 opera CFDs, donde el dividendo NO se cobra como
//    accionista sino que el broker lo ajusta (te lo acredita en largo y te lo
//    cobra en corto). Sin esa seccion la pieza desinforma; por eso el script
//    se niega a publicar si falta (ver verificaciones al final).
//
// Se publica en el MISMO feed de noticias con category 'Dividendos', asi que
// reutiliza el listado, la ficha, el filtro por categoria y el SEO que ya
// existen. El chip del filtro sale solo (js/noticias.js lo construye desde los
// datos). El generador diario ignora esta categoria en su candado.

const fs = require('fs');
const path = require('path');
const { buildDossier } = require('./_market-data');
const { callApi, makeFail, extraerJson, ultimoTexto } = require('./_anthropic');

const DATA_PATH = path.join(__dirname, '..', 'data', 'noticias.json');
const fail = makeFail('Generador de dividendos');

// Pagadoras de dividendo dentro de los simbolos que el sitio sabe cotizar.
// VALE y PBR van primero a proposito: son las dos grandes brasilenas de
// dividendo alto y son las que de verdad le importan al lector de la region.
const PANEL = ['NYSE:VALE', 'NYSE:PBR', 'NASDAQ:AAPL', 'NASDAQ:MSFT', 'NYSE:JPM'];
const ALLOWED_SYMBOLS = [...PANEL, 'FOREXCOM:SPXUSD', 'FX_IDC:USDBRL'];

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function normUrl(u) {
  try {
    const x = new URL(String(u));
    return (x.hostname.replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + x.search).toLowerCase();
  } catch (e) {
    return String(u).toLowerCase().replace(/\/+$/, '');
  }
}

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
        searchErrors.push(b.content.error_code);
      }
    }
  }
  return { urls, searchErrors, searchBlocks };
}

function hostOf(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return null; }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    fail('Falta la variable de entorno ANTHROPIC_API_KEY');
  }

  const noticias = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // El calendario cubre el mes SIGUIENTE: se publica a finales de mes para que
  // las fechas ex-dividendo que lista sigan por delante del lector.
  const ahora = new Date();
  const objetivo = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1));
  const mesKey = objetivo.toISOString().slice(0, 7);
  const mesNombre = MESES[objetivo.getUTCMonth()] + ' de ' + objetivo.getUTCFullYear();

  // Candado anti-duplicados por MES (no por dia, como en el diario): si el
  // calendario de ese mes ya salio, una re-corrida no publica otro.
  if (noticias.some((x) => x.category === 'Dividendos' && x.dividendMonth === mesKey)) {
    console.log('El calendario de dividendos de ' + mesNombre + ' ya está publicado; nada que generar.');
    process.exit(0);
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const dossiers = [];
  for (const sym of PANEL) {
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
    ', variación del mes ' + d.variacionMesPct + '%' +
    ', máximo 52sem ' + d.maximo52sem + ' / mínimo 52sem ' + d.minimo52sem
  ).join('\n');

  const prompt = `Eres redactor de mercados de AR4 Mercados, un sitio de trading en español para Latinoamérica. Hoy es ${hoy}.

TAREA: redacta el CALENDARIO DE DIVIDENDOS DE ${mesNombre.toUpperCase()}: qué empresas cotizadas grandes pagan dividendo ese mes, con sus fechas ex-dividendo confirmadas, fechas de pago y montos por acción ya declarados.

PASO 1 — INVESTIGA. Localiza dividendos YA DECLARADOS (anunciados oficialmente) cuya FECHA EX-DIVIDENDO caiga dentro de ${mesNombre}.

EMPIEZA POR CALENDARIOS AGREGADOS, no empresa por empresa: una sola página de calendario de dividendos lista decenas de empresas con sus fechas, y es mucho más eficiente que buscar de una en una. Prueba consultas del tipo "dividend calendar ${mesNombre} ex-dividend date large cap", "ex-dividend date agosto 2026 acciones", "calendário de dividendos ${MESES[objetivo.getUTCMonth()]} 2026 B3". Luego confirma los casos concretos que vayas a publicar.

EL UNIVERSO ES AMPLIO — la tabla NO se limita a las cinco empresas del panel de precios de abajo (ese panel solo te da cotizaciones verificadas para comentar, no es la lista de candidatas). Incluye las grandes pagadoras de dividendo que el lector reconozca: tecnológicas y financieras estadounidenses (Microsoft, Apple, JPMorgan, Coca-Cola, Johnson & Johnson, Procter & Gamble, Exxon, Chevron, Verizon, AbbVie y similares) y los nombres latinoamericanos de referencia (Vale, Petrobras, Itaú, Bradesco, Ambev, América Móvil y similares).

APUNTA A UNA TABLA DE 6 A 12 EMPRESAS. Si tras buscar en serio solo puedes confirmar menos, publica solo las confirmadas — pero no te quedes corto por no haber buscado lo suficiente: agota primero los calendarios agregados.

PASO 2 — ESCRIBE solo con lo que verificaste.

═══════════════════════════════════════════════
DATOS DE MERCADO REALES (medidos, no estimados)
═══════════════════════════════════════════════
Cotizaciones reales desde el histórico de precios (Yahoo Finance), al ${hoy}:
${panel}

Puedes citar estas cifras con total confianza: son reales y verificables.

═══════════════════════════════════════════════
REGLA NÚMERO UNO, INNEGOCIABLE — NADA INVENTADO
═══════════════════════════════════════════════
Esta pieza la usarán traders reales para decidir cuándo entrar o salir de una posición. Una fecha inventada les cuesta dinero de verdad.

- Cada fecha, cada monto y cada rendimiento debe venir de (a) el panel real de arriba, o (b) un resultado concreto de tu búsqueda web. NO HAY TERCERA OPCIÓN.
- PROHIBIDO estimar, proyectar o "asumir que repetirá el del trimestre pasado". Si un dividendo aún no está declarado oficialmente, NO va en el calendario.
- Si tras agotar la búsqueda solo puedes confirmar unas pocas empresas, publica solo esas. Un calendario corto y correcto vale; uno largo a base de inventar, no. Pero que sea corto por falta de datos reales, nunca por haber buscado poco.
- "sources" debe contener SOLO URLs que aparezcan literalmente en tus resultados de búsqueda. Si citas una URL que no salió de la búsqueda, la pieza se descarta automáticamente.
- Usa coma decimal (formato español): 0,25 / 1.234,50. Los montos en su moneda original, indicando cuál (USD, BRL...).

═══════════════════════════════════════════════
ESTRUCTURA OBLIGATORIA DEL "body" (contenido abierto)
═══════════════════════════════════════════════
1. Un párrafo de entrada con lo más relevante del mes (cuántas empresas, cuál destaca y por qué).

2. LA TABLA DEL CALENDARIO, con exactamente este marcado (el sitio ya lo estiliza y le da scroll en móvil):
<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Empresa</th><th>Fecha ex-dividendo</th><th>Fecha de pago</th><th>Monto por acción</th></tr></thead><tbody><tr><td>Nombre (TICKER)</td><td>...</td><td>...</td><td>...</td></tr></tbody></table></div>
Ordena las filas por fecha ex-dividendo, de la más próxima a la más lejana.

3. Una o dos secciones <h3> comentando las 2-3 empresas más relevantes para el lector latinoamericano: qué dividendo reparten, qué representa frente a su cotización actual y qué contexto lo explica.

4. UNA SECCIÓN FINAL OBLIGATORIA titulada exactamente "Si operas CFDs, esto no es lo que cobras", que explique con claridad:
   - Que operando CFDs no eres accionista y no tienes derecho al dividendo.
   - Que el broker aplica un AJUSTE por dividendo: te lo acredita si estás largo y TE LO COBRA si estás corto.
   - Que en la apertura del día ex-dividendo el precio de la acción cae de forma aproximada al importe del dividendo, así que "cobrar el dividendo" no es dinero gratis: el ajuste compensa la caída del precio, no la supera.
   - Que las fechas de la tabla son las que marcan cuándo ocurre ese ajuste en la cuenta.
   Esta sección es el motivo por el que publicamos esta pieza: escríbela con cuidado y sin adornos.

REGLAS DE ESTILO:
- Registro serio y profesional, tipo agencia financiera. Frases declarativas.
- Nada de emojis.
- Evita muletillas de IA ("es importante destacar que", "cabe mencionar que") y ganchos retóricos ("ojo con", "aquí es donde se pone interesante").
- Subtítulos <h3 style="margin:20px 0 10px;font-size:1.15rem;"> específicos al tema.
- "bodyPremium": contenido exclusivo Premium, 2 secciones — una con la lectura de qué hacer con este calendario (cómo encaja el ajuste por dividendo en la gestión de una posición abierta, qué vigilar alrededor de la fecha ex-dividendo) y una final titulada exactamente "Conclusión y análisis final".
- Termina el "bodyPremium" (no el "body") con este disclaimer exacto como último párrafo: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es informativo y de contexto de mercado, no constituye asesoría financiera ni una recomendación de inversión.</em></p>"

El instrumento principal ("symbol") debe ser EXACTAMENTE uno de: ${ALLOWED_SYMBOLS.join(', ')}. Elige la empresa que más protagonismo tenga en el calendario.

Bloques adicionales:
- "aiSummary": resumen rápido (qué trae el mes, por qué importa, qué activos toca, qué vigilar). No repitas el titular.
- "timeline": 3-4 hitos con las fechas clave del mes en orden ("2 de ${MESES[objetivo.getUTCMonth()]}", etc.). Solo fechas verificadas.
- "faq": 3-4 preguntas breves y educativas (ej. "¿Qué es la fecha ex-dividendo?", "¿Cobro el dividendo si compro el mismo día?").
- "impactScore": del 1 al 10, relevancia del mes en términos de dividendos.
- "relatedSymbols": 2-5 códigos EXACTOS de la lista permitida, sin repetir el principal.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 100 caracteres, debe mencionar ${MESES[objetivo.getUTCMonth()]}",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "symbol": "uno de los códigos permitidos, EXACTO",
  "body": "string HTML con la estructura obligatoria de 4 partes descrita arriba",
  "bodyPremium": "string HTML con 2 secciones, la última 'Conclusión y análisis final', terminando con el disclaimer",
  "trend": "'up' | 'down' | 'neutral'",
  "sources": [{ "name": "nombre del medio", "url": "URL exacta salida de tu búsqueda web" }],
  "aiSummary": { "que": "string", "porque": "string", "activos": ["string"], "siguiente": "string" },
  "timeline": [{ "cuando": "string", "texto": "string" }],
  "faq": [{ "q": "string", "a": "string" }],
  "impactScore": number,
  "relatedSymbols": ["string"]
}`;

  const messages = [{ role: 'user', content: prompt }];
  const allContent = [];
  let data = null;
  for (let intento = 0; intento < 8; intento++) {
    data = await callApi(apiKey, {
      model: 'claude-sonnet-5',
      // max_tokens cubre PENSAMIENTO + RESPUESTA juntos y el pensamiento se
      // sirve primero; effort es el unico lever que lo acota en sonnet-5
      // (budget_tokens ya no existe). Su default silencioso es "high" y fue lo
      // que tumbo al generador de noticias el 28/jul.
      max_tokens: 32000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      // Mas cupo que en la noticia diaria: aqui hay que barrer calendarios
      // agregados y luego confirmar cada empresa que entra en la tabla.
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 15 }],
      messages
    });
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

  const nueva = extraerJson(allContent, ['title', 'body']);
  if (!nueva) {
    console.error(ultimoTexto(allContent).slice(0, 1500));
    fail('La IA no devolvió un JSON válido (ni suelto ni concatenado). stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
  }

  // VERIFICACION DE FUENTES: igual que en noticias, solo sobreviven las URLs
  // que la busqueda devolvio de verdad.
  const citadas = Array.isArray(nueva.sources) ? nueva.sources : [];
  const verificadas = citadas.filter((s) => s && s.url && searchUrls.has(normUrl(s.url)));
  const inventadas = citadas.filter((s) => s && s.url && !searchUrls.has(normUrl(s.url)));
  if (inventadas.length) {
    console.warn('Se descartan ' + inventadas.length + ' fuente(s) que no salieron de la búsqueda:');
    inventadas.forEach((s) => console.warn('  - ' + s.url));
  }
  if (!verificadas.length) {
    console.error('No se publica: un calendario de fechas sin fuente verificable no debe salir firmado.');
    fail('Ninguna fuente citada pudo verificarse. Citadas: ' + citadas.length +
      ', URLs de búsqueda: ' + searchUrls.size +
      ', bloques de búsqueda: ' + searchBlocks +
      (searchErrors.length ? ', errores de búsqueda: ' + searchErrors.join(',') : ''));
  }

  // Las dos cosas que justifican publicar esta pieza. Si falta cualquiera de
  // las dos, es preferible no publicar que publicar algo a medias: sin tabla no
  // es un calendario, y sin la parte de CFDs desinforma al lector que opera por
  // broker (creeria que va a cobrar un dividendo que en realidad se le ajusta).
  if (!/compare-table/.test(String(nueva.body))) {
    fail('El cuerpo no trae la tabla del calendario (falta class="compare-table"). No se publica.');
  }
  if (!/CFD/i.test(String(nueva.body))) {
    fail('El cuerpo no trae la sección de ajuste por dividendo en CFDs. Es el motivo de la pieza; no se publica sin ella.');
  }

  if (!ALLOWED_SYMBOLS.includes(nueva.symbol)) {
    console.warn('Symbol no reconocido, se omite el gráfico:', nueva.symbol);
    delete nueva.symbol;
  }

  nueva.category = 'Dividendos';
  nueva.heroType = 'index';
  nueva.dividendMonth = mesKey;
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

  // Un calendario de dividendos no es una pieza direccional: no lleva escenarios
  // alcista/bajista ni probabilidad de continuidad. La ficha ya los oculta
  // cuando vienen en null.
  nueva.aiScenarios = null;
  nueva.aiDetects = null;

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
  nueva.date = hoy;

  nueva.sources = verificadas.slice(0, 4).map((s) => ({ name: String(s.name || hostOf(s.url) || 'Fuente'), url: String(s.url) }));
  nueva.sourceName = nueva.sources[0].name;
  nueva.sourceUrl = nueva.sources[0].url;

  nueva.marketPanel = dossiers;
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

  console.log('Calendario de dividendos generado (' + mesKey + '): ' + nueva.title);
  console.log('  Fuentes verificadas: ' + nueva.sources.map((s) => s.name + ' <' + s.url + '>').join(' | '));
}

main().catch((err) => {
  console.error(err);
  fail(err && err.message ? err.message : String(err));
});
