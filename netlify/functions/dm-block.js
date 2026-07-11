const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getMyProfile(user) {
  if (!user) return null;
  const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
  return rows.length ? rows[0] : null;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const me = await getMyProfile(user);
    if (!me) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };

    const body = JSON.parse(event.body || '{}');
    const targetProfileId = (body.targetProfileId || '').trim();
    if (!UUID_RE.test(targetProfileId)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Usuario inválido.' }) };

    const existing = await supabaseRequest('blocked_users?blocker_id=eq.' + me.id + '&blocked_id=eq.' + targetProfileId, { method: 'GET' });
    let blocked;
    if (existing.length) {
      await supabaseRequest('blocked_users?blocker_id=eq.' + me.id + '&blocked_id=eq.' + targetProfileId, { method: 'DELETE' });
      blocked = false;
    } else {
      await supabaseRequest('blocked_users', { method: 'POST', body: JSON.stringify({ blocker_id: me.id, blocked_id: targetProfileId }) });
      blocked = true;
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, blocked }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
