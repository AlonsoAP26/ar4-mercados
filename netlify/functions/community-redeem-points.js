const { supabaseRequest } = require('./_supabase');

const REDEEM_COST = 500;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  const identity = context.clientContext.identity;
  if (!identity) return { statusCode: 500, body: JSON.stringify({ success: false, error: 'No se pudo verificar tu identidad.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if ((profile.points || 0) < REDEEM_COST) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: `Necesitas ${REDEEM_COST} puntos para canjear. Tienes ${profile.points || 0}.` }) };
    }

    await fetch(identity.url + '/admin/users/' + user.sub, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + identity.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_metadata: { ...(user.app_metadata || {}), premium: true, premium_source: 'community_points' }
      })
    });

    await supabaseRequest('points_ledger', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profile.id, amount: -REDEEM_COST, reason: 'redeemed_premium_month' })
    });
    await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ points: profile.points - REDEEM_COST })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, remainingPoints: profile.points - REDEEM_COST }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
