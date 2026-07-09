const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ideas.json');
const CATEGORIES = ['Forex', 'LatAm', 'Materias Primas', 'Índices'];
const ALLOWED_SYMBOLS = [
  'FX:EURUSD', 'FX:GBPUSD', 'FX:USDJPY',
  'FX_IDC:USDMXN', 'FX_IDC:USDCOP', 'FX_IDC:USDCLP', 'FX_IDC:USDARS', 'FX_IDC:USDBRL', 'FX_IDC:USDPEN',
  'OANDA:XAUUSD', 'TVC:USOIL', 'TVC:UKOIL',
  'FOREXCOM:SPXUSD', 'FOREXCOM:NSXUSD', 'BITSTAMP:BTCUSD'
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

  const ideas = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const existingTitles = ideas.map(a => `- ${a.title}`).join('\n');

  const prompt = `Genera UN análisis de mercado nuevo y original para un sitio de trading dirigido a Latinoamérica, en español. Puede ser sobre forex (pares mayores o USD/MXN, USD/COP, USD/CLP, USD/BRL, USD/PEN, USD/ARS), materias primas (oro, petróleo) o índices bursátiles.

Elige una categoría de esta lista: ${CATEGORIES.join(', ')}.

No repitas ninguno de estos temas ya publicados:
${existingTitles}

Elige también el instrumento principal del que trata el análisis, usando EXACTAMENTE uno de estos códigos: ${ALLOWED_SYMBOLS.join(', ')}.

REGLAS ESTRICTAS DE CONTENIDO (muy importantes):
- Este es un análisis de CONTEXTO, no una señal de trading. NUNCA digas "compra", "vende", "entra en", ni des niveles específicos de entrada/stop loss/take profit como instrucción.
- Describe qué está moviendo el activo (catalizadores, datos económicos, contexto), qué niveles técnicos son relevantes de VIGILAR (no de operar), y qué podría cambiar el escenario.
- Escribe en LENGUAJE BÁSICO Y CLARO pero TÉCNICO: evita jerga innecesaria, pero cuando uses un término técnico (soporte, resistencia, catalizador, carry trade, etc.) explica el concepto brevemente la primera vez que lo uses, en una frase corta entre paréntesis o aposición.
- REGISTRO SERIO Y PROFESIONAL, tipo desk de research institucional (Bloomberg, Reuters, informe de un banco), NO una charla informal entre colegas. Frases declarativas y precisas. NUNCA uses ganchos retóricos como "Aquí es donde se pone interesante", "eso sí", "ojo con", preguntas retóricas, ni la fórmula de falso contraste "el problema no está en X sino en Y". Evita también las muletillas típicas de IA ("es importante destacar que", "cabe mencionar que", "en resumen").
- ESTRUCTURA VARIABLE, NO REPETIR SIEMPRE EL MISMO ESQUEMA: no uses en todos los análisis el mismo arco narrativo fijo (causa → niveles a vigilar → comodín de cierre). Varía cuántas secciones usas (2 a 5), el orden en que presentas la información (a veces empieza con el nivel técnico, a veces con el dato macro, a veces comparando dos activos) y el tipo de cierre. Cada análisis debe sentirse estructurado de forma distinta a los anteriores, no como una plantilla rellenada con datos nuevos.
- SUBTÍTULOS ÚNICOS Y ESPECÍFICOS AL TEMA: nunca uses subtítulos genéricos como "Contexto", "Qué está moviendo el par", "Niveles a vigilar" o "Qué podría cambiar el escenario". Inventa subtítulos concretos y descriptivos del contenido real de esa sección, en tono de titular de análisis financiero (no de blog casual).
- Termina siempre con este disclaimer exacto como último párrafo dentro del HTML: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es un análisis informativo del contexto de mercado, no constituye una recomendación de inversión ni una señal de compra/venta.</em></p>"

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 90 caracteres",
  "category": "una de las categorías listadas",
  "symbol": "uno de los códigos de instrumento listados arriba, EXACTO",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "body": "string HTML con 3-4 secciones <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\">[subtítulo único y específico, NO genérico]</h3>, párrafos <p>, listas <ul style=\\"color:var(--text-mid);padding-left:20px;margin-bottom:16px;\\"><li> para niveles a vigilar cuando aplique, terminando con el disclaimer indicado arriba."
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
      max_tokens: 2500,
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

  nueva.slug = slugify(nueva.title) + '-' + Date.now().toString(36);
  nueva.author = 'IA · AR4 Mercados';
  nueva.date = new Date().toISOString().slice(0, 10);

  ideas.push(nueva);
  fs.writeFileSync(DATA_PATH, JSON.stringify(ideas, null, 2) + '\n');

  console.log('Análisis generado:', nueva.title);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
