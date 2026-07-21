// AR4 Mercados — Agente Flash: inteligencia financiera en tiempo casi real.
// Lee los titulares institucionales de Walter Bloomberg (@DeItaone) desde su
// canal PUBLICO de Telegram (t.me/s/walterbloomberg — sin API de pago, sin
// scraping prohibido), selecciona los relevantes con IA y genera la noticia
// profesional en español con el formato editorial completo de AR4:
// impacto, activos, sesgos, volatilidad, categoria, resumenes por red y push.
//
// Honestidad (regla de la casa): nada inventado; rumor vs confirmado siempre
// diferenciado; los sesgos son lectura editorial de IA, no señales de trading.
//
// Dedupe: si un titular continua una noticia ya publicada, NO crea otra —
// marca "Nueva información disponible" y agrega solo lo nuevo.
//
// Salidas: data/flash.json (web). Opcionales si existen secretos:
//   TG_FLASH_TOKEN + TG_FLASH_CHAT  -> publica en tu canal de Telegram
//   DISCORD_FLASH_WEBHOOK           -> publica en tu Discord
const fs = require('fs');
const path = require('path');
const { callApi: apiCall, makeFail } = require('./_anthropic');

const DATA_PATH = path.join(__dirname, '..', 'data', 'flash.json');
const fail = makeFail('Agente Flash');
const CHANNEL = 'walterbloomberg';
const MAX_NEW_PER_RUN = 6;      // techo de noticias nuevas por corrida (control de costos y de ruido)
const MAX_ITEMS_STORED = 120;   // historico visible en la web

function decodeEntities(t) {
  return t
    .replace(/&#0?36;/g, '$').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

async function fetchChannelPosts() {
  const res = await fetch('https://t.me/s/' + CHANNEL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  if (!res.ok) throw new Error('Canal de Telegram HTTP ' + res.status);
  const html = await res.text();
  const blocks = html.split(/data-post="WalterBloomberg\//i).slice(1);
  const posts = [];
  for (const block of blocks) {
    const id = parseInt(block, 10);
    if (!Number.isFinite(id)) continue;
    const tm = block.match(/datetime="([^"]+)"/);
    const mm = block.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    if (!mm) continue;
    let text = mm[1].replace(/<br\s*\/?\s*>/gi, ' ');
    text = decodeEntities(text.replace(/<[^>]+>/g, ''));
    text = text.replace(/\(@WalterBloomberg\)\s*$/i, '').replace(/\s+/g, ' ').trim();
    if (text.length < 12) continue;
    posts.push({ id, fecha: tm ? tm[1] : new Date().toISOString(), texto: text });
  }
  posts.sort((a, b) => a.id - b.id);
  return posts;
}

// callApi hace streaming (evita el timeout de 300s del fetch de Node) y
// reintenta 429/5xx/cortes de red — todo en el modulo compartido _anthropic.js.
async function callApi(apiKey, prompt) {
  return apiCall(apiKey, {
    model: 'claude-sonnet-5',
    // 24000: el pensamiento de Sonnet 5 sale de este mismo tope; con 9000 los
    // lunes de muchos titulares la respuesta llegaba cortada (stop max_tokens).
    max_tokens: 24000,
    messages: [{ role: 'user', content: prompt }]
  });
}

function buildPrompt(nuevos, recientes) {
  const lista = nuevos.map((p) => `[${p.id}] (${p.fecha}) ${p.texto}`).join('\n');
  const previas = recientes.map((it) => `[${it.id}] ${it.titulo}`).join('\n') || '(ninguna)';
  return `Eres el agente de inteligencia financiera en tiempo real de AR4 Mercados (sitio de trading en español para Latinoamérica). Analizas titulares institucionales republicados por Walter Bloomberg (@DeItaone) — agregador reconocido de Bloomberg, Reuters, FT, CNBC y fuentes oficiales.

TITULARES NUEVOS (id, hora UTC, texto tal como llegó):
${lista}

NOTICIAS YA PUBLICADAS RECIENTEMENTE EN AR4 (para no duplicar):
${previas}

TAREA:
1) SELECCIONA solo los titulares con relevancia real para los mercados (importancia >= 5 sobre 10). Ignora deportes, curiosidades y ruido sin ángulo de mercado. Máximo ${MAX_NEW_PER_RUN} noticias nuevas.
2) DEDUPE: si un titular es continuación/actualización de una noticia ya publicada (lista de arriba), NO crees una nueva: devuélvelo con "updateOf" = id de la existente y solo el contenido nuevo en "resumen".
3) Para cada seleccionado genera la noticia profesional EN ESPAÑOL. No traduzcas literal: analiza el contexto y el impacto real.

REGLAS INNEGOCIABLES (marca editorial de AR4):
- NADA inventado: usa solo lo que dice el titular. Si falta contexto, dilo ("el titular no especifica...").
- Diferencia SIEMPRE: "confirmado" (dato/anuncio oficial citado por una fuente institucional) vs "rumor" (fuentes anónimas, "según personas familiarizadas", medios estatales no verificados) vs "no-verificable".
- Los sesgos e impactos son LECTURA EDITORIAL DE IA sobre el mecanismo típico de mercado, no predicciones ni señales. En "escenarios" describe qué suelen vigilar los traders, nunca recomendaciones de compra/venta.
- Lenguaje profesional tipo agencia (Reuters/Bloomberg), sin muletillas de IA ni sensacionalismo. En español con coma decimal.
- "fuenteOriginal": el medio que el titular cita (Bloomberg, Reuters, FARS, comunicado oficial, etc.) o "no indicada".

Responde EXCLUSIVAMENTE un JSON válido (sin markdown) con esta forma:
{"items":[{
  "id": <id numérico del titular>,
  "updateOf": <id de noticia existente si es actualización, o null>,
  "titulo": "titular periodístico atractivo y honesto, máx 110 caracteres",
  "resumen": "máx 120 palabras",
  "analisis": {
    "porque": "por qué importa para los mercados",
    "queOcurrio": "qué ocurrió realmente según el titular",
    "estado": "confirmado|rumor|no-verificable",
    "fuenteOriginal": "Bloomberg|Reuters|CNBC|..."
  },
  "impacto": "bajo|medio|alto",
  "breaking": true|false,   // true solo si puede mover el mercado de forma inmediata
  "activos": ["NASDAQ","S&P500","DXY","EURUSD","Oro","Petróleo","Bitcoin","Bonos","Rendimientos USA","<acciones específicas>"...],
  "sesgos": [{"activo":"...","sesgo":"alcista|bajista|neutral"}],   // solo activos importantes
  "volatilidad": "baja|media|alta|muy alta",
  "categoria": "Inflación|FED|BCE|Bancos Centrales|Empleo|Geopolítica|Empresas|Criptomonedas|Materias Primas|Datos Económicos|Emergencia|Breaking News",
  "keywords": ["etiqueta-seo", ...],
  "tgText": "máx 250 caracteres, para Telegram",
  "xText": "máx 280 caracteres, para X",
  "discordText": "versión corta en Markdown de Discord (**negritas**, viñetas)",
  "pushText": "una frase muy corta para notificación",
  "importancia": 1-10,
  "reaccion": {           // si afecta mercados; null si no aplica
    "primero": "qué activo suele reaccionar primero y por qué",
    "despues": "qué activos podrían reaccionar después",
    "escenarios": "qué escenarios suelen vigilar los traders (NO recomendaciones)",
    "riesgos": "qué riesgos existen (incluido que el titular sea rumor)"
  },
  "macro": {              // solo si es noticia macroeconómica; null si no
    "dolar":"...","oro":"...","nasdaq":"...","dow":"...","sp500":"...","bitcoin":"...","ethereum":"...","bonos":"...","petroleo":"..."
  }
}]}
Si NINGÚN titular es relevante, responde {"items":[]}.`;
}

async function postTelegram(item) {
  const token = process.env.TG_FLASH_TOKEN, chat = process.env.TG_FLASH_CHAT;
  if (!token || !chat) return;
  const emoji = item.impacto === 'alto' ? '🔴' : item.impacto === 'medio' ? '🟡' : '🟢';
  const pre = item.breaking ? '🚨 BREAKING · ' : '';
  const text = pre + emoji + ' ' + item.tgText + '\n\n📊 ar4mercados.com/noticias.html#flash';
  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true })
    });
  } catch (e) { console.warn('Telegram fallo (no fatal):', e.message); }
}

async function postDiscord(item) {
  const hook = process.env.DISCORD_FLASH_WEBHOOK;
  if (!hook) return;
  const pre = item.breaking ? '🚨 **BREAKING NEWS**\n' : '';
  try {
    await fetch(hook, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: pre + item.discordText + '\n<https://ar4mercados.com/noticias.html#flash>' })
    });
  } catch (e) { console.warn('Discord fallo (no fatal):', e.message); }
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { fail('Falta ANTHROPIC_API_KEY'); }

  let store = { lastId: 0, items: [] };
  try { store = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch (e) { /* primer arranque */ }

  const posts = await fetchChannelPosts();
  if (!posts.length) { fail('El canal de Telegram no devolvió posts.'); }
  const nuevos = posts.filter((p) => p.id > (store.lastId || 0));
  console.log('Posts nuevos desde id ' + store.lastId + ': ' + nuevos.length);
  if (!nuevos.length) { console.log('Sin titulares nuevos. Fin.'); return; }

  const recientes = store.items.slice(0, 20).map((it) => ({ id: it.id, titulo: it.titulo }));
  // Hasta 2 pasadas completas: a veces el modelo emite un JSON inválido por
  // puro azar (fallos del 20-jul con stop_reason=end_turn) y reintentar basta.
  let out = null;
  for (let intento = 1; intento <= 2 && !out; intento++) {
    const data = await callApi(apiKey, buildPrompt(nuevos.slice(-18), recientes));
    const blocks = (data.content || []).filter((b) => b.type === 'text' && b.text);
    if (!blocks.length) { if (intento === 2) fail('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason); continue; }
    let raw = blocks[blocks.length - 1].text.trim();
    const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) raw = fence[1].trim();
    if (!raw.startsWith('{')) { const a = raw.indexOf('{'); const b = raw.lastIndexOf('}'); if (a !== -1 && b > a) raw = raw.slice(a, b + 1); }
    try { out = JSON.parse(raw); } catch (e) {
      console.error('Intento ' + intento + ': JSON inválido. ' + raw.slice(0, 600));
      if (intento === 2) fail('La IA no devolvió un JSON válido tras 2 intentos. stop_reason=' + data.stop_reason);
    }
  }

  const byId = {}; nuevos.forEach((p) => { byId[p.id] = p; });
  let publicadas = 0, actualizadas = 0;
  const paraRedes = [];
  for (const item of (out.items || []).slice(0, MAX_NEW_PER_RUN)) {
    const src = byId[item.id];
    if (!src) continue;
    if (item.updateOf) {
      const existente = store.items.find((x) => x.id === item.updateOf);
      if (existente) {
        existente.updates = existente.updates || [];
        existente.updates.unshift({ fecha: src.fecha, id: item.id, texto: item.resumen, tgUrl: 'https://t.me/' + CHANNEL + '/' + item.id });
        existente.actualizado = src.fecha;
        actualizadas++;
        continue;
      }
    }
    const nuevo = {
      id: item.id,
      fecha: src.fecha,
      tgUrl: 'https://t.me/' + CHANNEL + '/' + item.id,
      original: src.texto.slice(0, 400),
      titulo: item.titulo, resumen: item.resumen, analisis: item.analisis,
      impacto: item.impacto, breaking: !!item.breaking, activos: item.activos || [],
      sesgos: item.sesgos || [], volatilidad: item.volatilidad, categoria: item.categoria,
      keywords: item.keywords || [], tgText: item.tgText, xText: item.xText,
      discordText: item.discordText, pushText: item.pushText,
      importancia: item.importancia, reaccion: item.reaccion || null, macro: item.macro || null,
      updates: []
    };
    store.items.unshift(nuevo);
    paraRedes.push(nuevo);
    publicadas++;
  }

  store.lastId = posts[posts.length - 1].id; // no re-analizar lo ya visto, publique o no
  // Orden cronológico estricto (lo más reciente primero): cuando una corrida
  // procesa varios titulares acumulados, sin esto quedaban desordenados.
  store.items.sort((a, b) => new Date(b.actualizado || b.fecha) - new Date(a.actualizado || a.fecha));
  store.items = store.items.slice(0, MAX_ITEMS_STORED);
  store.actualizado = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 1));
  console.log('Flash: ' + publicadas + ' nueva(s), ' + actualizadas + ' actualizada(s). lastId=' + store.lastId);

  for (const item of paraRedes) { await postTelegram(item); await postDiscord(item); }
}

main().catch((err) => { console.error(err); fail(err && err.message ? err.message : String(err)); });
