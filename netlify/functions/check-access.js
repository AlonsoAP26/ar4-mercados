exports.handler = async (event) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const email = event.queryStringParameters && event.queryStringParameters.email;

  if (!email) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ premium: false, error: 'Falta el email' }) };
  }

  if (!secretKey) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ premium: false }) };
  }

  try {
    const custRes = await fetch('https://api.stripe.com/v1/customers?email=' + encodeURIComponent(email) + '&limit=1', {
      headers: { 'Authorization': 'Bearer ' + secretKey }
    });
    const custData = await custRes.json();

    if (!custData.data || custData.data.length === 0) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ premium: false }) };
    }

    const customerId = custData.data[0].id;

    const subRes = await fetch('https://api.stripe.com/v1/subscriptions?customer=' + customerId + '&status=active&limit=1', {
      headers: { 'Authorization': 'Bearer ' + secretKey }
    });
    const subData = await subRes.json();
    const premium = !!(subData.data && subData.data.length > 0);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ premium }) };
  } catch (e) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ premium: false }) };
  }
};
