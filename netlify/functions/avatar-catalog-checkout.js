const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Mercado Pago no está configurado todavía (falta MERCADOPAGO_ACCESS_TOKEN).' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'JSON inválido' }) };
  }

  const catalogId = body.catalogId;
  if (!catalogId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el avatar.' }) };

  try {
    const catalogRows = await supabaseRequest('avatar_catalog?id=eq.' + encodeURIComponent(catalogId) + '&select=id,name,rarity,price_soles', { method: 'GET' });
    if (!catalogRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Avatar no encontrado.' }) };
    const avatar = catalogRows[0];
    if (!avatar.price_soles || (avatar.rarity !== 'raro' && avatar.rarity !== 'legendario')) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Este avatar no se compra con soles.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };

    const existing = await supabaseRequest(
      'avatar_catalog_purchases?profile_id=eq.' + profileRows[0].id + '&catalog_id=eq.' + encodeURIComponent(catalogId) + '&select=id',
      { method: 'GET' }
    );
    if (existing.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadyOwned: true }) };
    }

    const siteUrl = process.env.URL || 'https://ar4mercados.com';
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ title: 'Avatar AR4 Mercados: ' + avatar.name, quantity: 1, unit_price: avatar.price_soles, currency_id: 'PEN' }],
        payer: { email: user.email },
        external_reference: 'catalog:' + user.sub + ':' + catalogId,
        back_urls: {
          success: siteUrl + '/comunidad.html?mp_status=success',
          failure: siteUrl + '/comunidad.html?mp_status=failure',
          pending: siteUrl + '/comunidad.html?mp_status=pending'
        },
        auto_return: 'approved'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'No se pudo crear el pago en Mercado Pago.', detail: data }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, initPoint: data.init_point }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Error interno', detail: String(e) }) };
  }
};
