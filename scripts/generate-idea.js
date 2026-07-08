const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ideas.json');
const CATEGORIES = ['Forex', 'LatAm', 'Materias Primas', 'Índices'];

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

REGLAS ESTRICTAS DE CONTENIDO (muy importantes):
- Este es un análisis de CONTEXTO, no una señal de trading. NUNCA digas "compra", "vende", "entra en", ni des niveles específicos de entrada/stop loss/take profit como instrucción.
- Describe qué está moviendo el activo (catalizadores, datos económicos, contexto), qué niveles técnicos son relevantes de VIGILAR (no de operar), y qué podría cambiar el escenario.
- Termina siempre con este disclaimer exacto como último párrafo dentro del HTML: "<p style=\\"color:var(--text-low);font-size:0.82rem;margin-top:10px;\\"><em>Este contenido es un análisis informativo del contexto de mercado, no constituye una recomendación de inversión ni una señal de compra/venta.</em></p>"

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 90 caracteres",
  "category": "una de las categorías listadas",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres",
  "body": "string HTML con secciones <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\">Contexto</h3>, párrafos <p>, listas <ul style=\\"color:var(--text-mid);padding-left:20px;margin-bottom:16px;\\"><li> para niveles a vigilar, terminando con el disclaimer indicado arriba."
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
      max_tokens: 1500,
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
