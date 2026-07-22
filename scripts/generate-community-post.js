const { callApi, makeFail } = require('./_anthropic');

const CATEGORIES = ['Forex', 'LatAm', 'Materias Primas', 'Índices', 'Criptomonedas', 'Acciones'];
const BOT_NETLIFY_USER_ID = 'ar4-ai-system-bot';
const fail = makeFail('Generador del foro');

const POST_TYPES = [
  { key: 'idea_trading', instruction: 'Escribe una IDEA DE TRADING breve: contexto de un activo, qué lo está moviendo, y niveles técnicos a vigilar (soporte/resistencia). Nunca des una señal de compra/venta.' },
  { key: 'flash_news', instruction: 'Escribe una FLASH NEWS corta: un dato o movimiento de mercado reciente y por qué importa, en 2-3 frases de contexto.' },
  { key: 'curiosidad', instruction: 'Escribe una CURIOSIDAD ECONÓMICA o dato histórico de mercados que sea interesante y educativo, conectado a algo relevante hoy.' },
  { key: 'perspectiva', instruction: 'Escribe una PERSPECTIVA DE MERCADO breve: qué está mirando el mercado esta semana y qué escenarios son posibles (sin predecir con certeza).' },
  { key: 'educativo', instruction: 'Explica un CONCEPTO TÉCNICO O FUNDAMENTAL de trading/inversión de forma clara y breve, con un ejemplo aplicado a un activo real.' }
];
const BRIEFING_DIARIO = {
  key: 'briefing_diario',
  instruction: 'Escribe el BRIEFING DIARIO DE MERCADO: un resumen breve de cómo van los mercados hoy (sesión asiática/europea si ya cerraron, qué se espera en la sesión americana), 2-3 activos con movimientos relevantes, y un dato macro del día si lo hay. Formato de resumen rápido tipo "así está el mercado hoy", no un análisis profundo de un solo activo.'
};

async function supabaseRequest(supabaseUrl, supabaseKey, path, options) {
  const res = await fetch(supabaseUrl + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options && options.headers)
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error('Error de Supabase: ' + (data && data.message ? data.message : res.status));
  return data;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.SUPABASE_KEY;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!apiKey || !supabaseUrl || !supabaseSecret) {
    fail('Faltan variables de entorno: ANTHROPIC_API_KEY, SUPABASE_KEY o SUPABASE_SECRET_KEY');
  }

  const botRows = await supabaseRequest(supabaseUrl, supabaseSecret, 'profiles?netlify_user_id=eq.' + BOT_NETLIFY_USER_ID + '&select=id');
  if (!botRows.length) {
    fail('No existe el perfil bot "IA AR4". Corre supabase/migration_ai_bot_posts.sql primero.');
  }
  const botProfileId = botRows[0].id;

  const recentPosts = await supabaseRequest(supabaseUrl, supabaseSecret, 'community_posts?profile_id=eq.' + botProfileId + '&select=title&order=created_at.desc&limit=15');
  const existingTitles = recentPosts.map((p) => `- ${p.title}`).join('\n');

  const utcHour = new Date().getUTCHours();
  const isFirstDailyRun = utcHour === 14;
  const postType = isFirstDailyRun ? BRIEFING_DIARIO : POST_TYPES[Math.floor(Math.random() * POST_TYPES.length)];
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `Eres la cuenta "IA AR4" de AR4 Mercados, un sitio de trading en español para Latinoamérica. Hoy es ${today}. Vas a publicar en el Foro de la Comunidad (no en Noticias ni en Ideas de Trading oficiales, es un post más informal del foro).

TIPO DE PUBLICACIÓN: ${postType.instruction}

No repitas ninguno de estos temas ya publicados por ti recientemente:
${existingTitles || '(sin publicaciones previas)'}

REGLAS ESTRICTAS:
- NUNCA dás señales de compra/venta ni predices con certeza hacia dónde va el precio.
- Tono cercano pero profesional, como un post real de foro de trading, no un artículo formal.
- Máximo 3-4 frases en el cuerpo, breve y directo (esto es un post de foro, no un artículo largo).
- No inventes cifras absurdas; usa niveles/datos ilustrativos razonables si mencionas números.
- Termina siempre el "body" con este disclaimer exacto: " *Contenido generado automáticamente por IA AR4, con revisión editorial. No es asesoría financiera.*"

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "title": "string, máximo 100 caracteres",
  "category": "una de: ${CATEGORIES.join(', ')}",
  "symbol": "opcional, ej. EUR/USD, ORO, BTC/USD, USD/MXN — o null si no aplica",
  "body": "el texto del post, breve, terminando con el disclaimer indicado",
  "sentiment": "'alcista', 'bajista' o 'neutral' si aplica, o null"
}`;

  // callApi hace streaming (evita el timeout de 300s del fetch de Node) y
  // reintenta 429/5xx/cortes de red — un fallo transitorio no tumba el post.
  const data = await callApi(apiKey, {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });
  const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === 'text') : null;
  if (!textBlock) { fail('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage)); }

  // Haiku a veces envuelve el JSON en ```json ... ``` o añade texto antes/después
  // pese a las instrucciones. Limpiamos las comillas de markdown y nos quedamos
  // con lo que va del primer { al último } antes de parsear.
  function limpiarJson(txt) {
    let t = txt.trim();
    const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fence) t = fence[1].trim();
    const ini = t.indexOf('{');
    const fin = t.lastIndexOf('}');
    if (ini !== -1 && fin !== -1 && fin > ini) t = t.slice(ini, fin + 1);
    return t;
  }

  let nuevo;
  try {
    nuevo = JSON.parse(limpiarJson(textBlock.text));
  } catch (e) {
    console.error(textBlock.text.slice(0, 1200));
    fail('La IA no devolvió un JSON válido. stop_reason=' + data.stop_reason);
  }

  if (!CATEGORIES.includes(nuevo.category)) nuevo.category = 'Forex';
  if (!['alcista', 'bajista', 'neutral'].includes(nuevo.sentiment)) nuevo.sentiment = null;

  const created = await supabaseRequest(supabaseUrl, supabaseSecret, 'community_posts', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: botProfileId,
      category: nuevo.category,
      title: nuevo.title,
      body: nuevo.body,
      symbol: nuevo.symbol || null,
      sentiment: nuevo.sentiment,
      is_ai_generated: true
    })
  });

  console.log('Publicación de IA AR4 creada (' + postType.key + '):', created[0] && created[0].title);
}

main().catch((err) => {
  console.error(err);
  fail(err && err.message ? err.message : String(err));
});
