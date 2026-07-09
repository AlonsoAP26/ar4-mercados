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

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 100 caracteres",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "symbol": "uno de los códigos de instrumento listados arriba, EXACTO",
  "body": "string HTML con 3-4 secciones <h3 style=\\"margin:20px 0 10px;font-size:1.15rem;\\">[subtítulo específico]</h3><p>...</p>, cifras concretas",
  "bodyPremium": "string HTML con 2 secciones, la última titulada exactamente 'Conclusión y análisis final', terminando con el disclaimer indicado",
  "trend": "'up' si el sesgo es alcista para el activo, 'down' si es bajista, 'neutral' si es mixto o sin dirección clara"
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
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Error de la API de Anthropic:', errText);
    process.exit(1);
  }

  const data = await res.json();
  const textBlock = Array.isArray(data.content) ? data.content.find(b => b.type === 'text') : null;
  if (!textBlock) {
    console.error('Respuesta inesperada de la API:', JSON.stringify(data));
    process.exit(1);
  }
  const rawText = textBlock.text.trim();

  let nueva;
  try {
    nueva = JSON.parse(rawText);
  } catch (e) {
    console.error('La IA no devolvió un JSON válido:', rawText);
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
