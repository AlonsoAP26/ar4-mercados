const { supabaseRequest } = require('./_supabase');

async function getMyProfile(user) {
  if (!user) return null;
  const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,avatar_color,avatar_url', { method: 'GET' });
  return rows.length ? rows[0] : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const me = await getMyProfile(user);
    if (!me) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };

    const threadId = (event.queryStringParameters || {}).threadId || '';
    if (!UUID_RE.test(threadId)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Conversación inválida.' }) };

    const threadRows = await supabaseRequest('dm_threads?id=eq.' + threadId + '&select=*', { method: 'GET' });
    if (!threadRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Conversación no encontrada.' }) };
    const thread = threadRows[0];
    if (thread.participant_a !== me.id && thread.participant_b !== me.id) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'No tienes acceso a esta conversación.' }) };
    }
    const otherId = thread.participant_a === me.id ? thread.participant_b : thread.participant_a;

    const [messages, otherProfileRows] = await Promise.all([
      supabaseRequest('dm_messages?thread_id=eq.' + threadId + '&select=*&order=created_at.asc&limit=200', { method: 'GET' }),
      supabaseRequest('profiles?id=eq.' + otherId + '&select=id,username,avatar_color,avatar_url,rank,verified', { method: 'GET' })
    ]);

    const unreadIds = messages.filter((m) => m.sender_id !== me.id && !m.read_at).map((m) => m.id);
    if (unreadIds.length) {
      const filter = unreadIds.map((id) => 'id.eq.' + id).join(',');
      await supabaseRequest('dm_messages?or=(' + filter + ')', { method: 'PATCH', body: JSON.stringify({ read_at: new Date().toISOString() }) });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, messages, otherProfile: otherProfileRows[0] || { id: otherId, username: 'Usuario' }, myProfileId: me.id })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
