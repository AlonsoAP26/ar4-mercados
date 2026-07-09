exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID_PREMIUM;

  if (!secretKey || !priceId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe no está configurado todavía (faltan STRIPE_SECRET_KEY o STRIPE_PRICE_ID_PREMIUM).' })
    };
  }

  let email;
  try {
    const body = JSON.parse(event.body || '{}');
    email = body.email;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta el email del usuario' }) };
  }

  const origin = event.headers.origin || ('https://' + event.headers.host);

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  params.append('customer_email', email);
  params.append('success_url', origin + '/membresia.html?checkout=success');
  params.append('cancel_url', origin + '/membresia.html?checkout=cancel');

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + secretKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Error de Stripe', detail: errText }) };
    }

    const session = await res.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno', detail: String(e) }) };
  }
};
