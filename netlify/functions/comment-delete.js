const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const commentId = body.commentId;
    if (!UUID_RE.test(commentId || '')) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Comentario inválido.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,rank', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profile = profileRows[0];

    const commentRows = await supabaseRequest('comments?id=eq.' + commentId + '&select=id,profile_id', { method: 'GET' });
    if (!commentRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Comentario no encontrado.' }) };

    const isOwner = commentRows[0].profile_id === profile.id;
    const isAdmin = profile.rank === 'administrador';
    if (!isOwner && !isAdmin) return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Solo puedes eliminar tus propios comentarios.' }) };

    await supabaseRequest('comments?id=eq.' + commentId, { method: 'DELETE' });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
