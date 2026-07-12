const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, owned: [] }) };
    }

    const rows = await supabaseRequest('avatar_catalog_purchases?profile_id=eq.' + profileRows[0].id + '&select=catalog_id', { method: 'GET' });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, owned: rows.map((r) => r.catalog_id) }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.detail) || e.message || e) }) };
  }
};
