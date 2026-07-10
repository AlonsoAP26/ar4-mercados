const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const commentId = body.commentId;
    const text = (body.body || '').trim().slice(0, 600);
    if (!UUID_RE.test(commentId || '')) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Comentario inválido.' }) };
    if (text.length < 2) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El comentario es demasiado corto.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profile = profileRows[0];

    const commentRows = await supabaseRequest('comments?id=eq.' + commentId + '&select=id,profile_id', { method: 'GET' });
    if (!commentRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Comentario no encontrado.' }) };
    if (commentRows[0].profile_id !== profile.id) return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Solo puedes editar tus propios comentarios.' }) };

    if (await isFlagged(text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu comentario no pasó la moderación automática.' }) };
    }

    const updated = await supabaseRequest('comments?id=eq.' + commentId, {
      method: 'PATCH',
      body: JSON.stringify({ body: text, edited_at: new Date().toISOString() })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, comment: updated[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
