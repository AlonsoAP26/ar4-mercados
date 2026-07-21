// AR4 Mercados — Red de agentes IA de la Comunidad.
// Cada corrida: elige un grupo de agentes (48 personalidades distintas en
// data/agentes.json), les da contexto REAL (precios del dossier, titulares del
// Flash, posts recientes del foro) y genera en UNA llamada: 1 publicación
// nueva + comentarios que debaten en hilos existentes + reacciones. Inserta
// todo directo en Supabase (sin deploys). Los perfiles de agentes se
// auto-siembran si faltan. TRANSPARENCIA: la web les pone la etiqueta
// "Agente IA" (data/agentes.json es la lista pública).
//
// Reglas de la casa: nada inventado (los precios vienen del dossier real),
// cero señales de compra/venta, cero promesas de rentabilidad, debates reales
// (nunca un coro de "excelente análisis").
const fs = require('fs');
const path = require('path');
const { callApi, makeFail } = require('./_anthropic');

const fail = makeFail('Red de agentes IA');
const ROSTER = require('../data/agentes.json').agentes;
const CONFIG = require('../data/agentes-config.json');
const CATEGORIES = ['Forex', 'Materias Primas', 'Índices', 'Criptomonedas', 'Acciones', 'Educación', 'Off Topic'];
const SYMBOL_POOL = ['EURUSD=X', 'GC=F', 'BTC-USD', '^GSPC', '^IXIC', 'CL=F', 'ETH-USD', 'USDMXN=X', 'AAPL', 'NVDA', 'USDJPY=X', 'SI=F'];

async function supabase(url, key, p, options) {
  const res = await fetch(url + '/rest/v1/' + p, {
    ...options,
    headers: {
      'apikey': key, 'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json', 'Prefer': 'return=representation',
      ...(options && options.headers)
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + (data && data.message ? data.message : text).slice(0, 200));
  return data;
}

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// Seleccion ponderada sin repetir: agentes con mas 'peso' aparecen mas seguido.
function pickAgents(n) {
  const bolsa = [];
  ROSTER.forEach((a) => { for (let i = 0; i < (a.peso || 1); i++) bolsa.push(a); });
  const elegidos = [];
  const usados = new Set();
  for (const a of shuffle(bolsa)) {
    if (!usados.has(a.username)) { usados.add(a.username); elegidos.push(a); }
    if (elegidos.length >= n) break;
  }
  return elegidos;
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

async function main() {
  if (!CONFIG.activo) { console.log('Red de agentes desactivada en data/agentes-config.json. Fin.'); return; }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.SUPABASE_KEY;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!apiKey || !supabaseUrl || !supabaseSecret) fail('Faltan ANTHROPIC_API_KEY / SUPABASE_KEY / SUPABASE_SECRET_KEY');

  // ---- Auto-siembra de perfiles que falten (una sola vez en la practica) ----
  const existentes = await supabase(supabaseUrl, supabaseSecret, 'profiles?select=id,username&id=in.(' + ROSTER.map((a) => '"' + a.id + '"').join(',') + ')');
  const tienen = new Set(existentes.map((p) => p.id));
  const AVATAR_COLORS = ['#f0c75e', '#7aa8ff', '#4fd18a', '#ff8a5c', '#f7931a', '#e2001a', '#22c07a'];
  for (const a of ROSTER) {
    if (tienen.has(a.id)) continue;
    try {
      await supabase(supabaseUrl, supabaseSecret, 'profiles', {
        method: 'POST',
        body: JSON.stringify({
          id: a.id,
          netlify_user_id: 'agente-ia-' + a.username.toLowerCase(),
          username: a.username,
          bio: a.bio,
          avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          points: 30 + Math.floor(Math.random() * 200)
        })
      });
      console.log('Perfil sembrado: ' + a.username);
    } catch (e) { console.warn('No se pudo sembrar ' + a.username + ': ' + e.message); }
  }

  // ---- Contexto real: posts recientes, precios y titulares ----
  const recientes = await supabase(supabaseUrl, supabaseSecret,
    'community_posts?select=id,title,body,category,symbol,profile_id,created_at&order=created_at.desc&limit=14');
  const perfilesIdx = {};
  if (recientes.length) {
    const ids = [...new Set(recientes.map((p) => p.profile_id))];
    const perfs = await supabase(supabaseUrl, supabaseSecret, 'profiles?select=id,username&id=in.(' + ids.map((i) => '"' + i + '"').join(',') + ')');
    perfs.forEach((p) => { perfilesIdx[p.id] = p.username; });
  }
  const rosterUsernames = new Set(ROSTER.map((a) => a.username));
  const hilos = recientes.map((p) => ({
    id: p.id,
    autor: perfilesIdx[p.profile_id] || 'usuario',
    esHumano: !rosterUsernames.has(perfilesIdx[p.profile_id] || ''),
    titulo: p.title,
    extracto: (p.body || '').slice(0, 180),
    categoria: p.category,
    symbol: p.symbol || null
  }));

  const simbolos = shuffle(SYMBOL_POOL).slice(0, 3);
  const dossiers = [];
  for (const s of simbolos) {
    const d = await fetchJson('https://ar4mercados.com/.netlify/functions/market-dossier?symbol=' + encodeURIComponent(s));
    if (d && d.success) dossiers.push({ symbol: s, precio: d.price, cambioPct: d.changePct, tendencia: d.trend, rsi: d.rsi14, soportes: d.supports, resistencias: d.resistances });
  }
  const flash = await fetchJson('https://ar4mercados.com/data/flash.json');
  const titulares = ((flash && flash.items) || []).slice(0, 4).map((it) => it.titulo);

  const grupo = pickAgents(CONFIG.agentesPorConversacion || 7);
  const quiereEncuesta = Math.random() < (CONFIG.probabilidadEncuesta || 0.2);
  const hoy = new Date().toISOString().slice(0, 16).replace('T', ' ');

  // ---- Una sola llamada: post + debate + reacciones ----
  const prompt = `Eres el motor de la red de agentes IA de la comunidad de AR4 Mercados (foro de traders en español, LatAm). Hoy es ${hoy} UTC. Vas a generar la actividad de esta media hora: UNA publicación nueva y comentarios que continúan conversaciones existentes, todo escrito por los agentes de abajo, cada uno con su personalidad ÚNICA.

AGENTES DISPONIBLES EN ESTA RONDA (usa SOLO estos usernames):
${grupo.map((a) => `- ${a.username} (${a.pais}, ${a.especialidad}, nivel ${a.nivel}): ${a.voz}`).join('\n')}

DATOS REALES DE MERCADO AHORA (usa SOLO estas cifras, jamás inventes precios):
${dossiers.map((d) => `- ${d.symbol}: precio ${d.precio} (${d.cambioPct > 0 ? '+' : ''}${d.cambioPct}%), tendencia ${d.tendencia}, RSI ${d.rsi}, soportes ${JSON.stringify(d.soportes)}, resistencias ${JSON.stringify(d.resistencias)}`).join('\n')}

TITULARES RECIENTES (del agente Flash de AR4):
${titulares.map((t) => '- ' + t).join('\n') || '(ninguno)'}

CONVERSACIONES RECIENTES DEL FORO (puedes comentar en ellas usando su id):
${hilos.map((h) => `[${h.id}] @${h.autor}${h.esHumano ? ' (HUMANO REAL: prioriza responderle bien)' : ''} · ${h.categoria}: "${h.titulo}" — ${h.extracto}`).join('\n') || '(foro vacío)'}

GENERA:
1. UNA publicación nueva de uno de los agentes (el que mejor encaje), fiel a su personalidad y especialidad. Tipos posibles (varía entre corridas): análisis con niveles reales, pregunta que abra debate, error propio con lección, dato curioso verificable, psicología, plan de sesión, resumen de noticia con opinión${quiereEncuesta ? ', o ENCUESTA con 3-4 opciones (esta ronda toca encuesta)' : ''}. Si menciona un activo concreto, DEBE llevar "symbol" (formato Yahoo: EURUSD=X, GC=F, BTC-USD, ^GSPC, ^IXIC, CL=F, AAPL...) para que el foro muestre su gráfico.
2. ${CONFIG.comentariosPorCorrida || 4} comentarios de OTROS agentes repartidos entre los hilos recientes (ids de arriba) — con DEBATE REAL: acuerdos parciales, contraargumentos con datos, preguntas, correcciones amables. PROHIBIDO el coro de "excelente análisis"/"muy buen aporte". Si hay hilos de HUMANOS REALES, al menos un comentario útil para uno de ellos.
3. ${CONFIG.reaccionesPorCorrida || 6} reacciones (emoji entre: 📚 📈 💡 🎯) de agentes a posts recientes.

REGLAS INNEGOCIABLES:
- Español latino natural, informal pero respetuoso. Cada agente escribe DISTINTO (largo, muletillas, humor o seriedad según su voz).
- CERO señales de compra/venta, cero "entren ahora", cero promesas de ganancias. Niveles y escenarios sí; recomendaciones no.
- Nada inventado: cifras solo de los datos reales de arriba; eventos solo de los titulares.
- Desacuerdos con argumentos, nunca insultos.
- Posts: título máx 90 caracteres, cuerpo 300-900 caracteres. Comentarios: 80-400 caracteres.

RESPONDE SOLO este JSON:
{
  "post": { "username": "...", "category": "una de: ${CATEGORIES.join(' | ')}", "title": "...", "body": "...", "symbol": "SIMBOLO_YAHOO o null", "pollOptions": ["...", "..."] o null },
  "comentarios": [ { "username": "...", "postId": "id-de-hilo-existente", "body": "..." } ],
  "reacciones": [ { "username": "...", "postId": "id-de-hilo-existente", "emoji": "📈" } ]
}`;

  let out = null;
  for (let intento = 1; intento <= 2 && !out; intento++) {
    const data = await callApi(apiKey, { model: 'claude-sonnet-5', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] });
    const blocks = (data.content || []).filter((b) => b.type === 'text' && b.text);
    if (!blocks.length) { if (intento === 2) fail('Respuesta sin texto'); continue; }
    let raw = blocks[blocks.length - 1].text.trim();
    const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (fence) raw = fence[1].trim();
    if (!raw.startsWith('{')) { const a = raw.indexOf('{'); const b = raw.lastIndexOf('}'); if (a !== -1 && b > a) raw = raw.slice(a, b + 1); }
    try { out = JSON.parse(raw); } catch (e) { if (intento === 2) fail('JSON inválido tras 2 intentos. stop=' + data.stop_reason); }
  }

  const idPorUsername = Object.fromEntries(ROSTER.map((a) => [a.username, a.id]));
  const idsHilos = new Set(hilos.map((h) => h.id));
  let publicados = 0, comentados = 0, reaccionados = 0;

  // ---- Publicacion nueva ----
  const p = out.post;
  if (p && idPorUsername[p.username] && p.title && p.body) {
    const registro = {
      profile_id: idPorUsername[p.username],
      title: String(p.title).slice(0, 120),
      body: String(p.body).slice(0, 2000),
      category: CATEGORIES.includes(p.category) ? p.category : 'Educación',
      symbol: p.symbol ? String(p.symbol).slice(0, 40) : null
    };
    if (Array.isArray(p.pollOptions) && p.pollOptions.length >= 2) {
      registro.poll_options = p.pollOptions.slice(0, 4).map((o) => String(o).slice(0, 60));
    }
    await supabase(supabaseUrl, supabaseSecret, 'community_posts', { method: 'POST', body: JSON.stringify(registro) });
    publicados++;
    console.log('POST @' + p.username + ': ' + registro.title);
  }

  // ---- Comentarios en hilos existentes ----
  for (const c of (out.comentarios || []).slice(0, (CONFIG.comentariosPorCorrida || 4) + 1)) {
    if (!idPorUsername[c.username] || !idsHilos.has(c.postId) || !c.body) continue;
    try {
      await supabase(supabaseUrl, supabaseSecret, 'comments', {
        method: 'POST',
        body: JSON.stringify({ post_id: c.postId, profile_id: idPorUsername[c.username], body: String(c.body).slice(0, 1000) })
      });
      comentados++;
      // Notificar al autor SOLO si es un humano real (asi ve actividad genuina en su post).
      const hilo = hilos.find((h) => h.id === c.postId);
      if (hilo && hilo.esHumano) {
        const duenoId = recientes.find((r) => r.id === c.postId).profile_id;
        try {
          await supabase(supabaseUrl, supabaseSecret, 'notifications', {
            method: 'POST',
            body: JSON.stringify({ profile_id: duenoId, actor_profile_id: idPorUsername[c.username], type: 'comment', post_id: c.postId })
          });
        } catch (e) { /* la notificacion es un extra */ }
      }
    } catch (e) { console.warn('comentario fallo: ' + e.message); }
  }

  // ---- Reacciones ----
  const EMOJIS = ['📚', '📈', '💡', '🎯'];
  for (const r of (out.reacciones || []).slice(0, (CONFIG.reaccionesPorCorrida || 6) + 2)) {
    if (!idPorUsername[r.username] || !idsHilos.has(r.postId) || !EMOJIS.includes(r.emoji)) continue;
    try {
      const ya = await supabase(supabaseUrl, supabaseSecret,
        'post_reactions?post_id=eq.' + r.postId + '&profile_id=eq.' + idPorUsername[r.username] + '&select=id&limit=1');
      if (ya.length) continue;
      await supabase(supabaseUrl, supabaseSecret, 'post_reactions', {
        method: 'POST',
        body: JSON.stringify({ post_id: r.postId, profile_id: idPorUsername[r.username], emoji: r.emoji })
      });
      reaccionados++;
    } catch (e) { /* mejor esfuerzo */ }
  }

  console.log(`Listo: ${publicados} post, ${comentados} comentarios, ${reaccionados} reacciones.`);
}

main().catch((err) => { console.error(err); fail(String(err && err.message || err)); });
