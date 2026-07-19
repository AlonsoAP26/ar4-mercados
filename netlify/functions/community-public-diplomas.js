const { supabaseRequest } = require('./_supabase');
const { getIdentity, identityGetUser } = require('./_diplomas');

// Vitrina pública de un perfil: avance de módulos + diplomas de programa
// emitidos (curso, certificado y fecha; el nombre real solo aparece en la
// página de verificación, que es el documento oficial).
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const username = ((event.queryStringParameters && event.queryStringParameters.username) || '').trim();
  if (!username || username.length > 40) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el usuario.' }) };
  }
  try {
    const rows = await supabaseRequest('profiles?username=ilike.' + encodeURIComponent(username) + '&select=completed_modules,netlify_user_id&limit=1', { method: 'GET' });
    const slugs = rows.length ? (rows[0].completed_modules || []) : [];
    let diplomas = [];
    const identity = getIdentity(context);
    if (identity && rows.length && rows[0].netlify_user_id) {
      try {
        const u = await identityGetUser(identity, rows[0].netlify_user_id);
        const dips = (u.app_metadata && u.app_metadata.diplomas) || {};
        diplomas = Object.keys(dips).map((curso) => ({ curso, cert: dips[curso].cert, fecha: dips[curso].fecha }));
      } catch (e) { /* la vitrina sigue con los módulos */ }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ success: true, slugs, diplomas })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
