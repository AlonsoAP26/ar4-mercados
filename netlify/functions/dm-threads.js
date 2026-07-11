const { supabaseRequest } = require('./_supabase');

async function getMyProfile(user) {
  if (!user) return null;
  const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,avatar_color,avatar_url', { method: 'GET' });
  return rows.length ? rows[0] : null;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const me = await getMyProfile(user);
    if (!me) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, threads: [] }) };

    const threads = await supabaseRequest(
      'dm_threads?or=(participant_a.eq.' + me.id + ',participant_b.eq.' + me.id + ')&select=*&order=last_message_at.desc&limit=50',
      { method: 'GET' }
    );
    if (!threads.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, threads: [] }) };
    }

    const threadIds = threads.map((t) => t.id);
    const otherIds = [...new Set(threads.map((t) => (t.participant_a === me.id ? t.participant_b : t.participant_a)))];

    const profilesFilter = otherIds.map((id) => 'id.eq.' + id).join(',');
    const otherProfiles = await supabaseRequest('profiles?or=(' + profilesFilter + ')&select=id,username,avatar_color,avatar_url,rank,verified', { method: 'GET' });
    const profilesById = Object.fromEntries(otherProfiles.map((p) => [p.id, p]));

    const threadIdsFilter = threadIds.map((id) => 'thread_id.eq.' + id).join(',');
    const recentMessages = await supabaseRequest(
      'dm_messages?or=(' + threadIdsFilter + ')&select=id,thread_id,sender_id,body,image_url,created_at,read_at&order=created_at.desc&limit=300',
      { method: 'GET' }
    );

    const lastByThread = {};
    const unreadByThread = {};
    recentMessages.forEach((m) => {
      if (!lastByThread[m.thread_id]) lastByThread[m.thread_id] = m;
      if (m.sender_id !== me.id && !m.read_at) unreadByThread[m.thread_id] = (unreadByThread[m.thread_id] || 0) + 1;
    });

    const result = threads.map((t) => {
      const otherId = t.participant_a === me.id ? t.participant_b : t.participant_a;
      return {
        threadId: t.id,
        otherProfile: profilesById[otherId] || { id: otherId, username: 'Usuario' },
        lastMessage: lastByThread[t.id] || null,
        unreadCount: unreadByThread[t.id] || 0,
        lastMessageAt: t.last_message_at
      };
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, threads: result, myProfileId: me.id }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
