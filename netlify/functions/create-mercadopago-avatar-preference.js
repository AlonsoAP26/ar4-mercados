const { findAvatar, isPremiumAvatar } = require('./_avatars');

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

  const avatarId = body.avatarId;
  const avatar = findAvatar(avatarId);
  if (!avatar || !isPremiumAvatar(avatarId)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Avatar inválido.' }) };
  }

  const siteUrl = process.env.URL || 'https://ar4mercados.com';

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ title: 'Avatar AR4 Mercados: ' + avatar.name, quantity: 1, unit_price: avatar.priceSoles, currency_id: 'PEN' }],
        payer: { email: user.email },
        external_reference: user.sub + ':' + avatarId,
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
