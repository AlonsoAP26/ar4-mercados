const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AUTO_HIDE_THRESHOLD = 3;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const commentId = body.commentId;
    if (!UUID_RE.test(commentId || '')) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Comentario inválido.' }) };

    const commentRows = await supabaseRequest('comments?id=eq.' + commentId + '&select=id,reported_count', { method: 'GET' });
    if (!commentRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Comentario no encontrado.' }) };

    const newCount = (commentRows[0].reported_count || 0) + 1;
    const patch = { reported_count: newCount };
    if (newCount >= AUTO_HIDE_THRESHOLD) patch.flagged = true;

    await supabaseRequest('comments?id=eq.' + commentId, { method: 'PATCH', body: JSON.stringify(patch) });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
