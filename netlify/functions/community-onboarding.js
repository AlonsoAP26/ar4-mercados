// AR4 Mercados — checklist de bienvenida.
// GET: estado de los primeros pasos. POST: reclama los +50 pts (una sola vez,
// y solo si ya publicó su primer análisis — eso es lo que de verdad engancha).
const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

const JSON_HEAD = { 'Content-Type': 'application/json' };
const RECOMPENSA = 50;

function respuesta(statusCode, datos) {
  return { statusCode, headers: JSON_HEAD, body: JSON.stringify(datos) };
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return respuesta(401, { success: false, error: 'Debes iniciar sesión.' });

  try {
    const mios = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points,onboarding_claimed_at', { method: 'GET' });
    if (!mios.length) return respuesta(400, { success: false, error: 'Primero crea tu perfil de comunidad.' });
    const yo = mios[0];

    const posts = await supabaseRequest('community_posts?profile_id=eq.' + yo.id + '&select=id&limit=1', { method: 'GET' });
    const yaPublico = posts.length > 0;
    const yaReclamado = !!yo.onboarding_claimed_at;

    if (event.httpMethod === 'GET') {
      return respuesta(200, { success: true, perfil: true, publico: yaPublico, reclamado: yaReclamado, recompensa: RECOMPENSA });
    }

    if (event.httpMethod === 'POST') {
      if (yaReclamado) return respuesta(400, { success: false, error: 'Ya reclamaste tu bono de bienvenida.' });
      if (!yaPublico) return respuesta(400, { success: false, error: 'Publica tu primer análisis en el Foro para reclamar el bono.' });

      // Marcar ANTES de pagar, con guardia de nulidad: si dos clics llegan a la
      // vez, solo el que consiga marcar el campo (aún null) paga los puntos.
      const marcado = await supabaseRequest(
        'profiles?id=eq.' + yo.id + '&onboarding_claimed_at=is.null',
        { method: 'PATCH', body: JSON.stringify({ onboarding_claimed_at: new Date().toISOString() }) }
      );
      if (!marcado || !marcado.length) {
        return respuesta(400, { success: false, error: 'Ya reclamaste tu bono de bienvenida.' });
      }

      const nuevoTotal = await awardPoints(yo.id, yo.points, RECOMPENSA, 'onboarding_bienvenida');
      return respuesta(200, { success: true, puntos: nuevoTotal, recompensa: RECOMPENSA });
    }

    return respuesta(405, { success: false, error: 'Method Not Allowed' });
  } catch (e) {
    return respuesta(500, { success: false, error: String(e.message || e) });
  }
};
