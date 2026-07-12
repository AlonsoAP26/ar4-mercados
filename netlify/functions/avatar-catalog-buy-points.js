const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const catalogId = body.catalogId;
    if (!catalogId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el avatar.' }) };

    const catalogRows = await supabaseRequest('avatar_catalog?id=eq.' + encodeURIComponent(catalogId) + '&select=id,rarity,price_points', { method: 'GET' });
    if (!catalogRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Avatar no encontrado.' }) };
    const avatar = catalogRows[0];
    if (avatar.rarity !== 'comun' || !avatar.price_points) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Este avatar no se compra con puntos.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profile = profileRows[0];

    const existing = await supabaseRequest(
      'avatar_catalog_purchases?profile_id=eq.' + profile.id + '&catalog_id=eq.' + encodeURIComponent(catalogId) + '&select=id',
      { method: 'GET' }
    );
    if (existing.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadyOwned: true }) };
    }

    if ((profile.points || 0) < avatar.price_points) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: `Necesitas ${avatar.price_points} puntos. Tienes ${profile.points || 0}.` }) };
    }

    const remaining = await awardPoints(profile.id, profile.points, -avatar.price_points, 'avatar_catalog_purchase:' + catalogId);

    await supabaseRequest('avatar_catalog_purchases', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profile.id, catalog_id: catalogId, method: 'points', amount_points: avatar.price_points })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, remainingPoints: remaining }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.detail) || e.message || e) }) };
  }
};
