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
    if (!avatar || !isPremiumAvatar(avatarId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Avatar inválido.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];
    const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
    const rank = effectiveRank(profile.rank, isPremiumPaid);

    const existing = await supabaseRequest(
      'avatar_purchases?profile_id=eq.' + profile.id + '&avatar_id=eq.' + encodeURIComponent(avatarId) + '&select=id',
      { method: 'GET' }
    );
    if (existing.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadyOwned: true }) };
    }

    if (rank === 'administrador') {
      await supabaseRequest('avatar_purchases', {
        method: 'POST',
        body: JSON.stringify({ profile_id: profile.id, avatar_id: avatarId, amount_soles: 0 })
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, free: true }) };
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, needsPayment: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
