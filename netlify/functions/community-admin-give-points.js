// Panel de administrador: otorgar (o retirar) puntos a cualquier usuario.
// A diferencia de community-donate-points, esto NO descuenta del administrador:
// es una concesión administrativa (premios, correcciones, compensaciones).
const { supabaseRequest } = require('./_supabase');
const { effectiveRank, atLeast } = require('./_rank');
const { awardPoints } = require('./_gamification');

const MAX_AMOUNT = 5000;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const callerRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,rank', { method: 'GET' });
    if (!callerRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
    const callerRank = effectiveRank(callerRows[0].rank, isPremiumPaid);
    if (!atLeast(callerRank, 'administrador')) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Solo un administrador puede otorgar puntos.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const targetUsername = (body.username || '').trim();
    const amount = parseInt(body.amount, 10);
    const action = body.action === 'remove' ? 'remove' : 'give';

    if (!targetUsername) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el nombre de usuario.' }) };
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: `El monto debe ser un número entero entre 1 y ${MAX_AMOUNT} puntos.` }) };
    }

    const targetRows = await supabaseRequest('profiles?username=eq.' + encodeURIComponent(targetUsername) + '&select=id,username,points', { method: 'GET' });
    if (!targetRows.length) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'No existe ningún usuario con ese nombre.' }) };
    }
    const target = targetRows[0];
    const current = target.points || 0;

    // Al retirar, nunca dejamos el saldo en negativo.
    const delta = action === 'remove' ? -Math.min(amount, current) : amount;
    const newTotal = await awardPoints(target.id, current, delta, action === 'remove' ? 'admin_remove' : 'admin_grant');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, username: target.username, points: newTotal, delta })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
