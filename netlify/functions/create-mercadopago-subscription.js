exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const priceSoles = Number(process.env.MERCADOPAGO_PREMIUM_PRICE_PEN || '37');
  if (!accessToken) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Mercado Pago no está configurado todavía (falta MERCADOPAGO_ACCESS_TOKEN).' }) };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión para suscribirte.' }) };

  const siteUrl = process.env.URL || 'https://ar4mercados.com';

  try {
    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'AR4 Mercados Premium',
        external_reference: user.sub,
        payer_email: user.email,
        back_url: siteUrl + '/membresia.html?mp_status=success',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: priceSoles,
          currency_id: 'PEN'
        },
        status: 'pending'
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'No se pudo crear la suscripción en Mercado Pago.', detail: data }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, initPoint: data.init_point }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Error interno', detail: String(e) }) };
  }
};
