const fs = require('fs');
const path = require('path');
const { buildDossier, dossierToPrompt } = require('./_market-data');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ideas.json');

// El instrumento lo elige el script (no el modelo), porque necesitamos traer
// sus datos reales ANTES de escribir. La categoria se deriva del instrumento.
const SYMBOL_CATEGORY = {
  'FX:EURUSD': 'Forex',
  'FX:GBPUSD': 'Forex',
  'FX:USDJPY': 'Forex',
  'FX_IDC:USDMXN': 'LatAm',
  'FX_IDC:USDCOP': 'LatAm',
  'FX_IDC:USDCLP': 'LatAm',
  'FX_IDC:USDARS': 'LatAm',
  'FX_IDC:USDBRL': 'LatAm',
  'FX_IDC:USDPEN': 'LatAm',
  'OANDA:XAUUSD': 'Materias Primas',
  'TVC:USOIL': 'Materias Primas',
  'TVC:UKOIL': 'Materias Primas',
  'FOREXCOM:SPXUSD': 'Índices',
  'FOREXCOM:NSXUSD': 'Índices',
  'BITSTAMP:BTCUSD': 'Criptomonedas',
  'COINBASE:ETHUSD': 'Criptomonedas'
};
const ALLOWED_SYMBOLS = Object.keys(SYMBOL_CATEGORY);

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

// Rota instrumentos: evita repetir los de los ultimos 6 analisis.
function pickSymbol(ideas) {
  const recientes = new Set(ideas.slice(-6).map((i) => i.symbol).filter(Boolean));
  const frescos = ALLOWED_SYMBOLS.filter((s) => !recientes.has(s));
  const pool = frescos.length ? frescos : ALLOWED_SYMBOLS;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Falta la variable de entorno ANTHROPIC_API_KEY');
    process.exit(1);
  }

  const ideas = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const existingTitles = ideas.slice(-25).map((a) => `- ${a.title}`).join('\n');

  const symbol = pickSymbol(ideas);
  const category = SYMBOL_CATEGORY[symbol];

  // Datos reales ANTES de escribir. Si la fuente falla, no publicamos: es
  // preferible saltarse un dia a publicar cifras inventadas.
  let d;
  try {
    d = await buildDossier(symbol);
  } catch (e) {
    console.error('No se pudieron obtener datos reales de ' + symbol + ':', e.message);
    console.error('No se publica nada: preferimos no publicar antes que inventar cifras.');
    process.exit(1);
  }
  const datos = dossierToPrompt(d);

  const prompt = `Genera UN análisis de mercado nuevo y original para AR4 Mercados, un sitio de trading en español dirigido a Latinoamérica.

El análisis es sobre: ${d.nombre} (código ${symbol}), categoría "${category}".

${datos}

═══════════════════════════════════════════════
REGLA NÚMERO UNO, INNEGOCIABLE — DATOS
═══════════════════════════════════════════════
TODA cifra que escribas debe salir del bloque "DATOS REALES DE MERCADO" de arriba. Son datos verificados de mercado y los soportes/resistencias son pivotes reales del gráfico.

- PROHIBIDO inventar o estimar cualquier número: precios, niveles, RSI, medias, porcentajes, rangos. Si un dato no está arriba, NO lo menciones.
- PROHIBIDO afirmar noticias, datos macroeconómicos publicados, decisiones de bancos centrales, declaraciones o eventos concretos: no tienes acceso a noticias verificadas y afirmarlos sería inventar. Puedes hablar de lo que el PRECIO muestra y, si mencionas un factor de contexto, hazlo en términos condicionales y genéricos ("si el mercado empieza a descontar…", "un cambio en el tono de la política monetaria podría…"), nunca como hecho ocurrido.
- Este análisis es TÉCNICO y de contexto de precio. Ese es su valor: es 100% verificable contra el gráfico.
- Puedes redondear al escribir en prosa, pero sin cambiar el número (1.1435 puede ser "1,1435" o "la zona de 1,14").
- Usa coma decimal (formato español): 1,1435 / 4.067,9.

REGLAS DE CONTENIDO (mantén este estándar):
- Este es un análisis de CONTEXTO, no una señal de trading. NUNCA digas "compra", "vende", "entra en", ni des niveles de entrada/stop loss/take profit como instrucción.
- Describe qué muestra la estructura del precio, qué niveles reales son relevantes de VIGILAR (no de operar), y qué invalidaría la lectura actual.
- LENGUAJE BÁSICO Y CLARO pero TÉCNICO: cuando uses un término (soporte, RSI, media móvil, ATR) explícalo brevemente la primera vez, en una frase corta entre paréntesis o aposición.
- REGISTRO SERIO Y PROFESIONAL, tipo desk de research institucional (Bloomberg, Reuters, informe de banco), NO charla informal. Frases declarativas y precisas. NUNCA uses ganchos retóricos ("Aquí es donde se pone interesante", "eso sí", "ojo con"), preguntas retóricas, ni el falso contraste "el problema no está en X sino en Y". Evita muletillas de IA ("es importante destacar que", "cabe mencionar que", "en resumen").
- ESTRUCTURA VARIABLE: no uses siempre el mismo arco. Varía cuántas secciones usas (2 a 5), el orden (a veces abre con el nivel técnico, a veces con la estructura de medias, a veces comparando el momento actual con el rango de 52 semanas) y el tipo de cierre. Cada análisis debe sentirse distinto a los anteriores.
- SUBTÍTULOS ÚNICOS Y ESPECÍFICOS: nunca genéricos como "Contexto" o "Niveles a vigilar". Inventa subtítulos concretos que describan el contenido real de esa sección, en tono de titular de análisis financiero.
- SECCIÓN OBLIGATORIA DE NIVELES E INDICADORES, estilo desk de research: incluye SIEMPRE una sección con los soportes y resistencias REALES del bloque de datos (formato "<strong style=\\"color:var(--green);\\">Soportes:</strong> X · Y · Z" y "<strong style=\\"color:var(--crimson-bright);\\">Resistencias:</strong> X · Y · Z", con los números tal cual aparecen arriba), la lectura del RSI real con su número y su interpretación, la posición real del precio respecto a las medias de 50 y 200, y el patrón real de la última vela. Si el bloque dice que no hay pivote claro por encima o por debajo, DILO ASÍ (por ejemplo, que el precio cotiza en zona de máximos sin resistencia previa de referencia) en vez de inventar un nivel.
- Termina el "body" siempre con este disclaimer exacto como último párrafo: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es un análisis informativo del contexto de mercado, no constituye una recomendación de inversión ni una señal de compra/venta.</em></p>"

No repitas el enfoque de estos análisis ya publicados:
${existingTitles}

Además del "body", genera un "bodyPremium" (análisis exclusivo Premium, más profundo, EN TEXTO — no se dibuja nada sobre ningún gráfico):
- Una sección de LECTURA DE FLUJO INSTITUCIONAL con terminología Smart Money Concepts / ICT explicada en texto: Order Blocks (la última vela opuesta antes de un movimiento fuerte, donde suele haber órdenes institucionales pendientes), Fair Value Gaps o FVG (vacíos de precio dejados por movimientos impulsivos, que el precio tiende a rellenar), zonas de liquidez (agrupaciones de stops sobre máximos o bajo mínimos recientes), y si aplica un Break of Structure (BOS) o Change of Character (CHoCH). ANCLA esta lectura en los niveles REALES del bloque de datos (soportes, resistencias, máximo/mínimo de 52 semanas, rango de la última sesión). No inventes niveles nuevos.
- Una sección con ESCENARIO ALCISTA: qué tendría que confirmarse, el nivel real de invalidación y un objetivo razonable apoyado en las resistencias reales.
- Una sección con ESCENARIO BAJISTA: mismo formato, dirección opuesta, apoyado en los soportes reales.
- Termina el "bodyPremium" con este disclaimer exacto: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es informativo y de contexto de mercado, no constituye asesoría financiera ni una recomendación de inversión. Los escenarios descritos son posibilidades, no predicciones.</em></p>"

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 90 caracteres, específico y anclado en lo que muestran los datos reales",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "body": "string HTML con 3-4 secciones <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\">[subtítulo único y específico]</h3>, párrafos <p>, listas <ul style=\\"color:var(--text-mid);padding-left:20px;margin-bottom:16px;\\"><li> cuando aplique, terminando con el disclaimer indicado",
  "bodyPremium": "string HTML con la sección de flujo institucional y los escenarios alcista y bajista, cada uno con su <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\">[subtítulo específico]</h3>, terminando con el disclaimer de bodyPremium",
  "trend": "'up' si la lectura es alcista, 'down' si es bajista, 'neutral' si está en rango o a la espera de un catalizador"
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
      // factura lo generado, asi que dar aire no cuesta nada.
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
  const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === 'text') : null;
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

  if (!nueva.title || !nueva.body) {
    console.error('Faltan campos obligatorios (title/body) en la respuesta.');
    process.exit(1);
  }

  // El script manda en estos campos, no el modelo.
  nueva.symbol = symbol;
  nueva.category = category;
  if (!['up', 'down', 'neutral'].includes(nueva.trend)) nueva.trend = 'neutral';
  nueva.slug = slugify(nueva.title) + '-' + Date.now().toString(36);
  nueva.author = 'AR4 Mercados';
  nueva.date = new Date().toISOString().slice(0, 10);

  // Guardamos el dossier: es la prueba de que las cifras del texto son reales
  // y de que se puede auditar cualquier analisis contra los datos que lo generaron.
  nueva.marketData = d;

  ideas.push(nueva);
  fs.writeFileSync(DATA_PATH, JSON.stringify(ideas, null, 2) + '\n');

  console.log('Idea generada sobre ' + d.nombre + ' (precio real ' + d.precio + ', RSI ' + d.rsi14 + '):');
  console.log('  ' + nueva.title);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
