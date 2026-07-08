const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'articulos.json');
const CATEGORIES = ['FOMO', 'Disciplina', 'Gestión de riesgo', 'Rutinas', 'Pérdidas', 'Ansiedad', 'Confianza'];

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

  const articulos = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const existingTitles = articulos.map(a => `- ${a.title}`).join('\n');

  const prompt = `Genera UN artículo nuevo y original de psicotrading (psicología del trading) para un público latinoamericano de traders retail, en español.

Elige una categoría de esta lista: ${CATEGORIES.join(', ')}.

No repitas ninguno de estos temas ya publicados:
${existingTitles}

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 90 caracteres",
  "category": "una de las categorías listadas",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres, resumen enganchante",
  "body": "string HTML con 4-6 párrafos <p>, puede incluir 1-2 <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\"> como subtítulos y listas <ul style=\\"color:var(--text-mid);padding-left:20px;margin-bottom:16px;\\"><li> si aplica. Contenido práctico, honesto, sin promesas de ganancias garantizadas."
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

  let nuevo;
  try {
    nuevo = JSON.parse(rawText);
  } catch (e) {
    console.error('La IA no devolvió un JSON válido:', rawText);
    process.exit(1);
  }

  nuevo.slug = slugify(nuevo.title) + '-' + Date.now().toString(36);
  nuevo.author = 'IA · AR4 Mercados';
  nuevo.date = new Date().toISOString().slice(0, 10);

  articulos.push(nuevo);
  fs.writeFileSync(DATA_PATH, JSON.stringify(articulos, null, 2) + '\n');

  console.log('Artículo generado:', nuevo.title);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
