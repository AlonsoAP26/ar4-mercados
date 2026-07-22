// AR4 Mercados — Guion diario para el Reel de Facebook.
// Cada mañana genera, a partir del contenido REAL del sitio (la noticia del
// dia anterior y los titulares del Flash), un paquete listo para HeyGen:
// guion de ~30s + caption con hashtags + primer comentario. Se publica en
// data/guion-reel.json y el dueño lo copia desde su panel admin.
// Reglas de la casa: sin promesas de ganancias, sin señales, sin humo.
const fs = require('fs');
const path = require('path');
const { callApi, makeFail } = require('./_anthropic');

const fail = makeFail('Guion del Reel');
const OUT = path.join(__dirname, '..', 'data', 'guion-reel.json');

function leer(p) {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', p), 'utf8')); } catch (e) { return null; }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) fail('Falta ANTHROPIC_API_KEY');

  const hoy = new Date().toISOString().slice(0, 10);
  const previo = leer('guion-reel.json');
  if (previo && previo.fecha === hoy) { console.log('El guion de hoy ya existe. Fin.'); return; }

  const noticias = leer('noticias.json') || [];
  const flash = (leer('flash.json') || {}).items || [];
  const ultimaNoticia = noticias[noticias.length - 1] || {};
  const titulares = flash.slice(0, 3).map((it) => '- ' + it.titulo).join('\n');

  const prompt = `Eres el guionista de Reels de Facebook de AR4 Mercados (comunidad latina de trading con agentes de IA, educación gratis con diploma y herramientas pro — marca seria, "sin humo"). Hoy es ${hoy}.

CONTENIDO REAL DEL SITIO PARA INSPIRAR EL REEL DE HOY (elige UN angulo, el más jugoso):
Noticia más reciente: "${ultimaNoticia.titulo || ultimaNoticia.title || 'sin noticia'}" — ${String(ultimaNoticia.resumen || ultimaNoticia.excerpt || '').slice(0, 300)}
Titulares del agente Flash:
${titulares || '(ninguno)'}

GENERA el paquete del Reel de hoy:
1. "guion": 60-85 palabras (~30 segundos hablados). Estructura: gancho impactante en la primera frase (sin clickbait mentiroso), desarrollo del ángulo del día conectándolo con lo que AR4 ofrece (noticias al instante con IA / comunidad / clases gratis con diploma — rota el enfoque según el día), cierre con "Entra gratis: A R cuatro mercados punto com. El enlace está en la descripción." Tono: analista de TV serio y cercano. PROHIBIDO: prometer ganancias, dar señales, decir "invierte en X".
2. "titulo": título del post, máx 70 caracteres.
3. "caption": descripción del post con 2-3 líneas + bullets de valor con emojis sobrios + "Video generado con IA 🤖" + 8-10 hashtags (#trading #traderslatinos #forex #bitcoin #inversiones #tradingenespañol y afines al tema del día).
4. "gancho": la primera frase sola (para que el dueño evalúe rápido).

Responde SOLO este JSON: {"gancho":"...","titulo":"...","guion":"...","caption":"..."}`;

  let out = null;
  for (let intento = 1; intento <= 2 && !out; intento++) {
    const data = await callApi(apiKey, { model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    const blocks = (data.content || []).filter((b) => b.type === 'text' && b.text);
    if (!blocks.length) { if (intento === 2) fail('Sin texto'); continue; }
    let raw = blocks[blocks.length - 1].text.trim();
    const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) raw = fence[1].trim();
    if (!raw.startsWith('{')) { const a = raw.indexOf('{'); const b = raw.lastIndexOf('}'); if (a !== -1 && b > a) raw = raw.slice(a, b + 1); }
    try { out = JSON.parse(raw); } catch (e) { if (intento === 2) fail('JSON inválido. stop=' + data.stop_reason); }
  }
  if (!out.guion || !out.caption) fail('Paquete incompleto');

  const paquete = {
    fecha: hoy,
    gancho: out.gancho,
    titulo: out.titulo,
    guion: out.guion,
    caption: out.caption,
    comentario: '🔗 Crea tu cuenta gratis aquí (menos de 1 minuto): https://ar4mercados.com'
  };
  fs.writeFileSync(OUT, JSON.stringify(paquete, null, 2) + '\n');
  console.log('Guion del Reel de hoy listo: ' + out.gancho);
}

main().catch((err) => { console.error(err); fail(String(err && err.message || err)); });
