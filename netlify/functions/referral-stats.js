// AR4 Mercados — boletos del sorteo por referidos.
// GET normal (con sesión): tus boletos, tu enlace y cuántos amigos trajiste.
// GET ?all=1 (solo el dueño): tabla completa usuario -> boletos, para el
// día del sorteo (25 de octubre).
// Los referidos se cuentan por ID del padrino (inmune a cambios de username).
const { supabaseRequest } = require('./_supabase');

const JSON_HEAD = { 'Content-Type': 'application/json' };

function respuesta(statusCode, datos) {
  return { statusCode, headers: JSON_HEAD, body: JSON.stringify(datos) };
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return respuesta(405, { success: false, error: 'Method Not Allowed' });

  const user = context.clientContext && context.clientContext.user;
  if (!user) return respuesta(401, { success: false, error: 'Debes iniciar sesión.' });

  try {
    const quiereTodo = event.queryStringParameters && event.queryStringParameters.all === '1';

    if (quiereTodo) {
      const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
      if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
        return respuesta(403, { success: false, error: 'Solo el dueño del sitio puede ver la tabla completa.' });
      }
      const perfiles = await supabaseRequest('profiles?select=id,username,referred_by_profile_id&limit=5000', { method: 'GET' });
      const referidosPor = {};
      perfiles.forEach((p) => {
        if (p.referred_by_profile_id) referidosPor[p.referred_by_profile_id] = (referidosPor[p.referred_by_profile_id] || 0) + 1;
      });
      const tabla = perfiles.map((p) => ({
        username: p.username,
        referidos: referidosPor[p.id] || 0,
        boletos: 1 + (referidosPor[p.id] || 0)
      })).sort((a, b) => b.boletos - a.boletos);
      const totalBoletos = tabla.reduce((s, r) => s + r.boletos, 0);
      return respuesta(200, { success: true, tabla, totalBoletos, participantes: tabla.length });
    }

    const mios = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username', { method: 'GET' });
    if (!mios.length) return respuesta(400, { success: false, error: 'Primero crea tu perfil de comunidad.' });
    const yo = mios[0];

    const referidos = await supabaseRequest('profiles?referred_by_profile_id=eq.' + yo.id + '&select=username,created_at&order=created_at.desc&limit=200', { method: 'GET' });

    return respuesta(200, {
      success: true,
      username: yo.username,
      enlace: 'https://ar4mercados.com/?ref=' + encodeURIComponent(yo.username),
      referidos: referidos.map((r) => r.username),
      boletos: 1 + referidos.length
    });
  } catch (e) {
    return respuesta(500, { success: false, error: String(e.message || e) });
  }
};
