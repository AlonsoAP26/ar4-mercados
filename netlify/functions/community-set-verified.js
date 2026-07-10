const { supabaseRequest } = require('./_supabase');
const { effectiveRank, atLeast } = require('./_rank');

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
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Solo un administrador puede verificar perfiles.' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const targetUsername = (body.username || '').trim();
    const verified = !!body.verified;

    if (!targetUsername) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el nombre de usuario.' }) };

    const targetRows = await supabaseRequest('profiles?username=eq.' + encodeURIComponent(targetUsername) + '&select=id,username', { method: 'GET' });
    if (!targetRows.length) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'No existe ningún usuario con ese nombre.' }) };
    }

    const updated = await supabaseRequest('profiles?id=eq.' + targetRows[0].id, {
      method: 'PATCH',
      body: JSON.stringify({ verified })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: updated[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
