// AR4 Mercados — reclama "quién me invitó" (una sola vez, tras registrarse).
// El visitante llega con ?ref=USUARIO, el cliente lo guarda y, ya con sesión,
// llama aquí. Cada perfil referido = 1 boleto extra del padrino en el sorteo.
//
// Blindaje (de la revisión adversarial):
// - El padrino se guarda por ID (los usernames se renombran; por texto los
//   boletos se perdían o podían heredarse renombrándose al nombre liberado).
// - El referido debe haber PUBLICADO su primer análisis: una cuenta desechable
//   ya no da boleto con solo confirmarse el correo.
// - Tope de 20 boletos extra por padrino.
// - Búsqueda del padrino insensible a mayúsculas (con eq. exacto se perdían
//   boletos legítimos por escribir "Juan" en vez de "juan").
const { supabaseRequest } = require('./_supabase');

const JSON_HEAD = { 'Content-Type': 'application/json' };
const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,40}$/;
const MAX_REFERIDOS = 20;
const DIAS_VENTANA = 30;

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
    const mios = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,referred_by_profile_id,created_at', { method: 'GET' });
    if (!mios.length) return respuesta(400, { success: false, error: 'Primero crea tu perfil de comunidad.' });
    const yo = mios[0];

    if (yo.referred_by_profile_id) return respuesta(200, { success: true, yaAsignado: true });

    // Padrino insensible a mayúsculas: ilike puede traer variantes por el
    // comodín "_", así que se confirma la igualdad exacta en JS.
    const candidatos = await supabaseRequest('profiles?username=ilike.' + encodeURIComponent(ref) + '&select=id,username&limit=10', { method: 'GET' });
    const padrino = candidatos.find((p) => p.username.toLowerCase() === ref.toLowerCase());
    if (!padrino) return respuesta(400, { success: false, error: 'Ese código de invitación no existe.' });
    if (padrino.id === yo.id) return respuesta(400, { success: false, error: 'No puedes invitarte a ti mismo.' });

    // Solo cuentas nuevas: evita boletos retroactivos de cuentas antiguas.
    const edadDias = (Date.now() - new Date(yo.created_at).getTime()) / 86400000;
    if (edadDias > DIAS_VENTANA) return respuesta(400, { success: false, error: 'El código solo aplica a cuentas recién creadas.' });

    // El referido debe ser un miembro real: su primer análisis publicado.
    // Sube el costo de las cuentas desechables de "confirmar un correo" a
    // "escribir un post público" (visible y moderable).
    const posts = await supabaseRequest('community_posts?profile_id=eq.' + yo.id + '&select=id&limit=1', { method: 'GET' });
    if (!posts.length) {
      return respuesta(400, { success: false, error: 'Publica tu primer análisis en el Foro para activar tu invitación.' });
    }

    // Tope por padrino.
    const yaTiene = await supabaseRequest('profiles?referred_by_profile_id=eq.' + padrino.id + '&select=id&limit=' + (MAX_REFERIDOS + 1), { method: 'GET' });
    if (yaTiene.length >= MAX_REFERIDOS) {
      return respuesta(400, { success: false, error: 'Ese padrino ya alcanzó el máximo de invitaciones del sorteo.' });
    }

    // Guardia de nulidad: si dos peticiones llegan a la vez, solo una escribe.
    const filas = await supabaseRequest('profiles?id=eq.' + yo.id + '&referred_by_profile_id=is.null', {
      method: 'PATCH',
      body: JSON.stringify({ referred_by_profile_id: padrino.id })
    });
    if (!filas || !filas.length) return respuesta(200, { success: true, yaAsignado: true });

    return respuesta(200, { success: true, padrino: padrino.username });
  } catch (e) {
    return respuesta(500, { success: false, error: String(e.message || e) });
  }
};
