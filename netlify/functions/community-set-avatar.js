const { supabaseRequest } = require('./_supabase');
const { effectiveRank } = require('./_rank');
const { findAvatar, isPremiumAvatar } = require('./_avatars');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const avatarId = body.avatarId;
    const avatar = findAvatar(avatarId);
    if (!avatar) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Avatar inválido.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if (isPremiumAvatar(avatarId)) {
      const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
      const rank = effectiveRank(profile.rank, isPremiumPaid);
      if (rank !== 'administrador') {
        const owned = await supabaseRequest(
          'avatar_purchases?profile_id=eq.' + profile.id + '&avatar_id=eq.' + encodeURIComponent(avatarId) + '&select=id',
          { method: 'GET' }
        );
        if (!owned.length) {
          return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Todavía no tienes ese avatar. Cómpralo primero.' }) };
        }
      }
    }

    const updated = await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ avatar_url: avatar.url })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: updated[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
