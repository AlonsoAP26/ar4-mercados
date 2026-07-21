// AR4 Mercados — Metricas de la red de agentes IA (solo dueño).
// GET: por cada agente, cuantas publicaciones y comentarios lleva en el foro.
const { supabaseRequest } = require('./_supabase');

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event, context) => {
  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return json(403, { success: false, error: 'Solo para el dueño del sitio.' });
  }

  try {
    const ids = JSON.parse(event.queryStringParameters && event.queryStringParameters.ids || '[]');
    if (!Array.isArray(ids) || !ids.length || ids.length > 100) return json(400, { success: false, error: 'ids inválidos' });
    const filtro = 'profile_id=in.(' + ids.map((i) => '"' + String(i).replace(/[^a-f0-9-]/gi, '') + '"').join(',') + ')';

    const [posts, comments] = await Promise.all([
      supabaseRequest('community_posts?select=profile_id&' + filtro + '&limit=5000', { method: 'GET' }),
      supabaseRequest('comments?select=profile_id&' + filtro + '&limit=10000', { method: 'GET' })
    ]);
    const counts = {};
    ids.forEach((i) => { counts[i] = { posts: 0, comments: 0 }; });
    posts.forEach((p) => { if (counts[p.profile_id]) counts[p.profile_id].posts++; });
    comments.forEach((c) => { if (counts[c.profile_id]) counts[c.profile_id].comments++; });
    return json(200, { success: true, counts });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};
