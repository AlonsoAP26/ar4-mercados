const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;

  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Esta acción solo está disponible para el dueño del sitio.' }) };
  }

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad (Editar perfil) antes de activar esto.' }) };
    }
    const profile = profileRows[0];

    await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ rank: 'administrador' })
    });

    const identity = context.clientContext && context.clientContext.identity;
    if (identity) {
      await fetch(identity.url + '/admin/users/' + user.sub, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_metadata: { premium: true, bootstrap_admin: true } })
      });
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
