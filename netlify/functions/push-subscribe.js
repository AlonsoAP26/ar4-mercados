// AR4 Mercados — alta y baja de notificaciones push.
// No exige sesión: cualquiera que acepte recibir avisos queda registrado. Si
// además está logueado, se guarda su perfil para poder segmentar más adelante.
const { supabaseRequest } = require('./_supabase');

const JSON_HEAD = { 'Content-Type': 'application/json' };

function respuesta(statusCode, datos) {
  return { statusCode, headers: JSON_HEAD, body: JSON.stringify(datos) };
}

// Los endpoints válidos son siempre de un servicio de push conocido y por HTTPS.
function endpointValido(url) {
  if (typeof url !== 'string' || url.length > 800) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch (e) { return false; }
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return respuesta(405, { success: false, error: 'Method Not Allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return respuesta(400, { success: false, error: 'JSON inválido' }); }

  const endpoint = body.endpoint;
  if (!endpointValido(endpoint)) return respuesta(400, { success: false, error: 'Suscripción inválida.' });

  try {
    // Baja: el usuario desactivó las notificaciones desde el navegador.
    if (body.baja) {
      await supabaseRequest('push_subscriptions?endpoint=eq.' + encodeURIComponent(endpoint), { method: 'DELETE' });
      return respuesta(200, { success: true, activo: false });
    }

    if (!body.p256dh || !body.auth) return respuesta(400, { success: false, error: 'Faltan las claves de la suscripción.' });

    // Si hay sesión, enlazamos con el perfil de comunidad (opcional, no bloquea).
    let userId = null;
    const user = context.clientContext && context.clientContext.user;
    if (user) {
      try {
        const filas = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
        if (filas.length) userId = filas[0].id;
      } catch (e) { /* sin perfil todavía: la suscripción vale igual */ }
    }

    const fila = {
      endpoint,
      p256dh: String(body.p256dh).slice(0, 200),
      auth: String(body.auth).slice(0, 100),
      user_id: userId,
      user_agent: String((event.headers && event.headers['user-agent']) || '').slice(0, 300),
      fallos: 0
    };

    // Upsert por endpoint: si el navegador reenvía la misma suscripción, se
    // actualiza en vez de duplicar.
    await supabaseRequest('push_subscriptions?on_conflict=endpoint', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(fila)
    });

    return respuesta(200, { success: true, activo: true });
  } catch (e) {
    return respuesta(500, { success: false, error: String(e.message || e) });
  }
};
