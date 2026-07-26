// AR4 Mercados — reclama "quién me invitó" (una sola vez, tras registrarse).
// El visitante llega con ?ref=USUARIO, el cliente lo guarda y, ya con sesión,
// llama aquí. Cada perfil referido = 1 boleto extra del padrino en el sorteo.
const { supabaseRequest } = require('./_supabase');

const JSON_HEAD = { 'Content-Type': 'application/json' };
const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,40}$/;

function respuesta(statusCode, datos) {
  return { statusCode, headers: JSON_HEAD, body: JSON.stringify(datos) };
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return respuesta(405, { success: false, error: 'Method Not Allowed' });

  const user = context.clientContext && context.clientContext.user;
  if (!user) return respuesta(401, { success: false, error: 'Debes iniciar sesión.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return respuesta(400, { success: false, error: 'JSON inválido' }); }

  const ref = String(body.ref || '').trim();
  if (!USERNAME_RE.test(ref)) return respuesta(400, { success: false, error: 'Código de invitación inválido.' });

  try {
    const mios = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,referred_by_username,created_at', { method: 'GET' });
    if (!mios.length) return respuesta(400, { success: false, error: 'Primero crea tu perfil de comunidad.' });
    const yo = mios[0];

    // Reglas: solo una vez, nunca a uno mismo, y el padrino debe existir.
    if (yo.referred_by_username) return respuesta(200, { success: true, yaAsignado: true });
    if (yo.username.toLowerCase() === ref.toLowerCase()) {
      return respuesta(400, { success: false, error: 'No puedes invitarte a ti mismo.' });
    }
    const padrinos = await supabaseRequest('profiles?username=eq.' + encodeURIComponent(ref) + '&select=id,username', { method: 'GET' });
    if (!padrinos.length) return respuesta(400, { success: false, error: 'Ese código de invitación no existe.' });

    // Solo cuentas nuevas (perfil creado hace menos de 7 días): evita que
    // cuentas antiguas "regalen" boletos retroactivos.
    const edadDias = (Date.now() - new Date(yo.created_at).getTime()) / 86400000;
    if (edadDias > 7) return respuesta(400, { success: false, error: 'El código solo aplica a cuentas recién creadas.' });

    await supabaseRequest('profiles?id=eq.' + yo.id + '&referred_by_username=is.null', {
      method: 'PATCH',
      body: JSON.stringify({ referred_by_username: padrinos[0].username })
    });

    return respuesta(200, { success: true, padrino: padrinos[0].username });
  } catch (e) {
    return respuesta(500, { success: false, error: String(e.message || e) });
  }
};
