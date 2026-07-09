const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

const MIN_DONATION = 5;
const MAX_DONATION = 500;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const toUsername = (body.toUsername || '').trim();
    const amount = parseInt(body.amount, 10);

    if (!toUsername) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el nombre de usuario del destinatario.' }) };
    if (!Number.isInteger(amount) || amount < MIN_DONATION || amount > MAX_DONATION) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: `El monto debe ser un número entero entre ${MIN_DONATION} y ${MAX_DONATION} puntos.` }) };
    }

    const senderRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,points', { method: 'GET' });
    if (!senderRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const sender = senderRows[0];

    if (sender.username.toLowerCase() === toUsername.toLowerCase()) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No puedes donarte puntos a ti mismo.' }) };
    }
    if ((sender.points || 0) < amount) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No tienes suficientes puntos para esa donación.' }) };
    }

    const recipientRows = await supabaseRequest('profiles?username=eq.' + encodeURIComponent(toUsername) + '&select=id,username,points', { method: 'GET' });
    if (!recipientRows.length) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'No existe ningún usuario con ese nombre.' }) };
    }
    const recipient = recipientRows[0];

    const senderNewTotal = await awardPoints(sender.id, sender.points, -amount, 'donation_sent');
    const recipientNewTotal = await awardPoints(recipient.id, recipient.points, amount, 'donation_received');

    await supabaseRequest('point_donations', {
      method: 'POST',
      body: JSON.stringify({ from_profile_id: sender.id, to_profile_id: recipient.id, amount })
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, points: senderNewTotal, recipientUsername: recipient.username })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
