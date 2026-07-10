const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, notifications: [], unreadCount: 0 }) };
    }
    const profile = profileRows[0];

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (body.action === 'markAllRead') {
        await supabaseRequest('notifications?profile_id=eq.' + profile.id + '&read=eq.false', {
          method: 'PATCH',
          body: JSON.stringify({ read: true })
        });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Acción no reconocida.' }) };
    }

    const notifications = await supabaseRequest(
      'notifications?profile_id=eq.' + profile.id + '&select=*&order=created_at.desc&limit=30',
      { method: 'GET' }
    );

    const actorIds = [...new Set(notifications.map((n) => n.actor_profile_id).filter(Boolean))];
    let actorsById = {};
    if (actorIds.length) {
      const filter = actorIds.map((id) => 'id.eq.' + id).join(',');
      const actors = await supabaseRequest('profiles?or=(' + filter + ')&select=id,username,avatar_color,avatar_url', { method: 'GET' });
      actorsById = Object.fromEntries(actors.map((a) => [a.id, a]));
    }

    const enriched = notifications.map((n) => ({ ...n, actor: n.actor_profile_id ? actorsById[n.actor_profile_id] || null : null }));
    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, notifications: enriched, unreadCount })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
