const { supabaseRequest } = require('./_supabase');

// Devuelve los módulos completados de un perfil (vitrina pública de diplomas).
// Necesario porque la clave anónima no tiene permiso de lectura sobre la columna
// completed_modules; aquí se lee con la service key, solo ese dato y nada más.
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const username = ((event.queryStringParameters && event.queryStringParameters.username) || '').trim();
  if (!username || username.length > 40) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el usuario.' }) };
  }
  try {
    const rows = await supabaseRequest('profiles?username=ilike.' + encodeURIComponent(username) + '&select=completed_modules&limit=1', { method: 'GET' });
    const slugs = rows.length ? (rows[0].completed_modules || []) : [];
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ success: true, slugs })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
