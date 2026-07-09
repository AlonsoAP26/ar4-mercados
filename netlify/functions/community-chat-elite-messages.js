const { supabaseRequest } = require('./_supabase');
const { effectiveRank, atLeast } = require('./_rank');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
    const rank = effectiveRank(profileRows[0].rank, isPremiumPaid);
    if (!atLeast(rank, 'elite')) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'La sala Elite Traders es exclusiva para rango Élite o Administrador.' }) };
    }

    const messages = await supabaseRequest(
      'chat_messages?room_id=eq.elite&flagged=eq.false&select=*&order=created_at.asc&limit=50',
      { method: 'GET' }
    );

    const profileIds = [...new Set(messages.map((m) => m.profile_id))];
    let profilesById = {};
    if (profileIds.length) {
      const filter = profileIds.map((id) => `"${id}"`).join(',');
      const profiles = await supabaseRequest('profiles?id=in.(' + filter + ')&select=id,username,avatar_color', { method: 'GET' });
      profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, messages, profiles: profilesById })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
