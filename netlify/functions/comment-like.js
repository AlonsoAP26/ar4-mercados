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

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profile = profileRows[0];

    const existing = await supabaseRequest(
      'comment_likes?comment_id=eq.' + commentId + '&profile_id=eq.' + profile.id + '&select=id',
      { method: 'GET' }
    );

    let liked;
    if (existing.length) {
      await supabaseRequest('comment_likes?id=eq.' + existing[0].id, { method: 'DELETE' });
      liked = false;
    } else {
      await supabaseRequest('comment_likes', { method: 'POST', body: JSON.stringify({ comment_id: commentId, profile_id: profile.id }) });
      liked = true;
    }

    const all = await supabaseRequest('comment_likes?comment_id=eq.' + commentId + '&select=id', { method: 'GET' });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, liked, count: all.length }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
