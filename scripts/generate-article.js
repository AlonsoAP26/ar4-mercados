const fs = require('fs');
const path = require('path');

const { callApi, makeFail } = require('./_anthropic');

const DATA_PATH = path.join(__dirname, '..', 'data', 'articulos.json');
const fail = makeFail('Generador de psicotrading');
const CATEGORIES = ['FOMO', 'Disciplina', 'Gestión de riesgo', 'Rutinas', 'Pérdidas', 'Ansiedad', 'Confianza'];
const HISTORICAL_EXAMPLES = [
  'Jesse Livermore (varias fortunas ganadas y perdidas por completo entre 1907 y 1934, documentado en su propio libro "Reminiscences of a Stock Operator")',
  'Nick Leeson y el colapso de Barings Bank en 1995 (pérdidas ocultas de más de 800 millones de libras por no admitir una pérdida inicial pequeña)',
  'Long-Term Capital Management (LTCM) en 1998 (fondo con premios Nobel que colapsó por exceso de confianza en modelos matemáticos y apalancamiento extremo)',
  'Bill Hwang y Archegos Capital en 2021 (pérdida de unos 20 mil millones de dólares en días por concentración extrema y apalancamiento oculto)',
  'la manía de las acciones GameStop y AMC en enero de 2021 (FOMO retail masivo impulsado por redes sociales)',
  'Isaac Newton y la burbuja de los Mares del Sur en 1720 (perdió una fortuna personal después de vender temprano con ganancia y volver a comprar por FOMO al ver subir más el precio)',
  'la burbuja de las puntocom en 2000 (inversores que ignoraron señales de sobrevaloración por euforia colectiva)',
  'John Meriwether y los socios de LTCM confiando en su propio historial de éxito hasta el colapso de 1998',
  'la crisis de 2008 y la sobreconfianza de las mesas de trading de bancos de inversión en instrumentos que no comprendían del todo'
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
    fail('Falta la variable de entorno ANTHROPIC_API_KEY');
  }

  const articulos = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  // Candado anti-duplicados: si ya hay contenido de hoy (re-corrida manual o
  // relanzamiento del watchdog), no se genera otro. Salida 0 = corrida verde.
  const hoyGuard = new Date().toISOString().slice(0, 10);
  if (articulos.some((x) => String(x.date || x.fecha || '').slice(0, 10) === hoyGuard)) {
    console.log('Ya hay contenido publicado hoy (' + hoyGuard + '); nada que generar.');
    process.exit(0);
  }

  const existingTitles = articulos.map(a => `- ${a.title}`).join('\n');

  const recentExamples = new Set(articulos.slice(-5).map(a => a.historicalExample).filter(Boolean));
  const availableExamples = HISTORICAL_EXAMPLES.filter(ex => !recentExamples.has(ex));
  const pool = availableExamples.length ? availableExamples : HISTORICAL_EXAMPLES;
  const chosenExample = pool[Math.floor(Math.random() * pool.length)];

  const prompt = `Genera UN artículo nuevo y original de psicotrading (psicología del trading) para un público latinoamericano de traders retail, en español.

Elige una categoría de esta lista: ${CATEGORIES.join(', ')}.

No repitas ninguno de estos temas ya publicados:
${existingTitles}

USA ESTE CASO HISTÓRICO REAL como columna vertebral narrativa del artículo (verifica que los datos que menciones sobre él sean coherentes con lo que se sabe públicamente, no inventes cifras ni detalles adicionales no documentados):
${chosenExample}

CÓMO INTEGRAR EL CASO HISTÓRICO: no lo trates como una caja de "dato curioso" aislada. Ábrelo o entrelázalo con el hilo del artículo de forma narrativa (puede ir al inicio como gancho, en medio como punto de inflexión, o cerca del final como espejo de la lección) y conéctalo explícitamente con la categoría psicológica del artículo y con la situación de un trader retail latinoamericano hoy: qué haría distinto ese trader retail si reconociera a tiempo el mismo patrón psicológico que hundió a ese caso histórico.

PROFUNDIDAD Y AMENIDAD: el artículo debe sentirse como una buena nota de una revista financiera seria (tipo un perfil narrativo, no una lista de consejos genéricos). Evita sonar como una plantilla de blog de autoayuda. Que enganche desde la primera frase (una escena, una cifra concreta, una pregunta directa — no una definición de diccionario tipo "El FOMO es..."). Profundiza el mecanismo psicológico real (qué pasa en la cabeza del trader, por qué el cerebro cae en ese patrón) antes de pasar a la aplicación práctica.

TONO: registro serio y profesional, propio de un coach de trading con experiencia real, no una plantilla corporativa ni una charla casual entre amigos. Frases claras y directas, sin ganchos retóricos ("ojo con", "aquí viene lo interesante") ni muletillas de relleno ("es importante destacar que", "cabe mencionar que"). Varía la estructura de un artículo a otro: no repitas siempre el mismo orden de secciones. Si usas subtítulos, que sean específicos al tema del artículo, no genéricos.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 90 caracteres",
  "category": "una de las categorías listadas",
  "excerpt": "string de 1-2 frases, máximo 200 caracteres, resumen enganchante",
  "body": "string HTML con 7-9 párrafos <p> en total (incluyendo el desarrollo del caso histórico dentro del cuerpo, no aparte), 2-3 <h3 style=\\"margin:20px 0 10px;font-size:1.1rem;\\"> como subtítulos específicos del tema (no genéricos), y una lista <ul style=\\"color:var(--text-mid);padding-left:20px;margin-bottom:16px;\\"><li> con 2-4 puntos prácticos y accionables cerca del final. Contenido práctico, honesto, sin promesas de ganancias garantizadas."
}`;

  // callApi hace streaming (evita el timeout de 300s del fetch de Node con
  // pensamiento largo — el "fetch failed" del 19/jul a las 22:26) y reintenta
  // 429/5xx/cortes de red. max_tokens generoso a proposito: Sonnet 5 piensa
  // por defecto y esos tokens salen del mismo tope que la respuesta.
  const data = await callApi(apiKey, {
    model: 'claude-sonnet-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }]
  });
  if (data.stop_reason === 'max_tokens') {
    fail('Respuesta cortada por max_tokens. Uso: ' + JSON.stringify(data.usage));
  }
  const textBlock = Array.isArray(data.content) ? data.content.find(b => b.type === 'text') : null;
  if (!textBlock) {
    fail('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
  }
  let rawText = textBlock.text.trim();
  const fence = rawText.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) rawText = fence[1].trim();

  let nuevo;
  try {
    nuevo = JSON.parse(rawText);
  } catch (e) {
    console.error(rawText.slice(0, 1500));
    fail('La IA no devolvió un JSON válido. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage));
  }

  nuevo.slug = slugify(nuevo.title) + '-' + Date.now().toString(36);
  nuevo.author = 'IA · AR4 Mercados';
  nuevo.date = new Date().toISOString().slice(0, 10);
  nuevo.historicalExample = chosenExample;

  articulos.push(nuevo);
  fs.writeFileSync(DATA_PATH, JSON.stringify(articulos, null, 2) + '\n');

  console.log('Artículo generado:', nuevo.title);
}

main().catch(err => {
  console.error(err);
  fail(err && err.message ? err.message : String(err));
});
