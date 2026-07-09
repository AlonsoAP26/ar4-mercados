exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secretKey = process.env.CULQI_SECRET_KEY;
  const planId = process.env.CULQI_PLAN_ID_PREMIUM;

  if (!secretKey || !planId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Culqi no está configurado todavía (faltan CULQI_SECRET_KEY o CULQI_PLAN_ID_PREMIUM).' })
    };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión para suscribirte.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'JSON inválido' }) };
  }

  const { token, email } = body;
  if (!token || !email) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el token de la tarjeta o el email' }) };
  }

  const culqiHeaders = {
    'Authorization': 'Bearer ' + secretKey,
    'Content-Type': 'application/json'
  };

  try {
    const custRes = await fetch('https://api.culqi.com/v2/customers', {
      method: 'POST',
      headers: culqiHeaders,
      body: JSON.stringify({
        first_name: (user.user_metadata && user.user_metadata.full_name) || 'Miembro',
        last_name: 'AR4 Mercados',
        email: email,
        address: 'N/A',
        address_city: 'Lima',
        country_code: 'PE',
        phone_number: '999999999'
      })
    });
    const customer = await custRes.json();
    if (!custRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'Error creando cliente en Culqi', detail: customer }) };
    }

    const cardRes = await fetch('https://api.culqi.com/v2/cards', {
      method: 'POST',
      headers: culqiHeaders,
      body: JSON.stringify({ customer_id: customer.id, token_id: token })
    });
    const card = await cardRes.json();
    if (!cardRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'Error validando la tarjeta en Culqi', detail: card }) };
    }

    const subRes = await fetch('https://api.culqi.com/v2/subscriptions', {
      method: 'POST',
      headers: culqiHeaders,
      body: JSON.stringify({ card_id: card.id, plan_id: planId, tyc: true })
    });
    const subscription = await subRes.json();
    if (!subRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'Error creando la suscripción en Culqi', detail: subscription }) };
    }

    const identity = context.clientContext.identity;
    if (identity) {
      await fetch(identity.url + '/admin/users/' + user.sub, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + identity.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_metadata: {
            premium: true,
            culqi_customer_id: customer.id,
            culqi_subscription_id: subscription.id
          }
        })
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Error interno', detail: String(e) }) };
  }
};
