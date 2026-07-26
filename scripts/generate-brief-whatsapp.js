// AR4 Mercados — Brief diario para la Comunidad de WhatsApp.
// Cada mañana arma, a partir del contenido REAL del sitio (titulares del Flash
// de las últimas 24 h + la noticia del día), un mensaje listo para pegar en la
// Comunidad/Canal de WhatsApp. Se publica en data/brief-whatsapp.json y el
// dueño lo copia desde su panel admin (mismo flujo que el guion del Reel).
// Reglas de la casa: sin señales, sin promesas, todo con fuente real.
const fs = require('fs');
const path = require('path');
const { callApi, makeFail } = require('./_anthropic');

const fail = makeFail('Brief de WhatsApp');
const OUT = path.join(__dirname, '..', 'data', 'brief-whatsapp.json');

function leer(p) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', p), 'utf8')); } catch (e) { return null; }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) fail('Falta ANTHROPIC_API_KEY');

  const hoy = new Date().toISOString().slice(0, 10);
  const previo = leer('brief-whatsapp.json');
  if (previo && previo.fecha === hoy) { console.log('El brief de hoy ya existe. Fin.'); return; }

  const flash = (leer('flash.json') || {}).items || [];
  const hace24h = Date.now() - 24 * 3600000;
  const titulares = flash
    .filter((it) => new Date(it.actualizado || it.fecha).getTime() > hace24h && (it.importancia || 0) >= 6)
    .slice(0, 5)
    .map((it) => '- (' + (it.importancia || '?') + '/10) ' + it.titulo + ' — ' + String(it.resumen || '').slice(0, 160))
    .join('\n');

  const noticias = leer('noticias.json') || [];
  noticias.sort((a, b) => new Date(b.date) - new Date(a.date));
  const noticia = noticias[0] || {};

  const prompt = `Eres el editor del brief diario de WhatsApp de AR4 Mercados (comunidad latina de trading, marca seria "sin humo"). Hoy es ${hoy}.

CONTENIDO REAL DEL SITIO (no inventes nada fuera de esto):
Titulares del Flash de las últimas 24 h:
${titulares || '(sin titulares fuertes hoy)'}
Noticia del día: "${noticia.title || 'sin noticia'}" — ${String(noticia.excerpt || '').slice(0, 200)}

GENERA el mensaje del día para la Comunidad de WhatsApp:
- Formato WhatsApp: *asteriscos* para negritas, emojis sobrios (📊 🟡 🔴 ⚠️), líneas cortas.
- Estructura: saludo breve con fecha → "☀️ *EL BRIEF DE HOY — AR4 MERCADOS*" → 3 titulares clave (una línea cada uno, con su dato) → "👀 *Qué vigilar hoy*" (1-2 líneas sobre qué suelen observar los traders, SIN recomendar nada) → cierre con enlace: "📲 Análisis completo: ar4mercados.com/noticias.html"
- Máximo ~120 palabras. PROHIBIDO: señales, predicciones de precio, promesas de ganancia.

Responde SOLO este JSON: {"mensaje":"el mensaje completo con sus saltos de linea \\n"}`;

  let out = null;
  for (let intento = 1; intento <= 2 && !out; intento++) {
    const data = await callApi(apiKey, { model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    const blocks = (data.content || []).filter((b) => b.type === 'text' && b.text);
    if (!blocks.length) { if (intento === 2) fail('Sin texto'); continue; }
    let raw = blocks[blocks.length - 1].text.trim();
    const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) raw = fence[1].trim();
    if (!raw.startsWith('{')) { const a = raw.indexOf('{'); const b = raw.lastIndexOf('}'); if (a !== -1 && b > a) raw = raw.slice(a, b + 1); }
    try { out = JSON.parse(raw); } catch (e) { if (intento === 2) fail('JSON inválido. stop=' + data.stop_reason); }
  }
  if (!out.mensaje || out.mensaje.length < 60) fail('Mensaje demasiado corto');

  fs.writeFileSync(OUT, JSON.stringify({ fecha: hoy, mensaje: out.mensaje }, null, 2) + '\n');
  console.log('Brief de WhatsApp de hoy listo (' + out.mensaje.length + ' caracteres).');
}

main().catch((err) => { console.error(err); fail(String(err && err.message || err)); });
