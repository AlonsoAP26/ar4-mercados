const { supabaseRequest } = require('./_supabase');
const {
  certId, validName, computeStatus,
  getIdentity, identityGetUser, identityUpdateAppMeta
} = require('./_diplomas');

// Estado y emisión de los diplomas por programa.
// GET  -> progreso, notas, elegibilidad, nombre verificado y diplomas emitidos.
// POST { action: 'set-name', name }  -> fija el nombre real UNA sola vez.
// POST { action: 'claim', curso }    -> emite el diploma si el programa está aprobado.
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });
  const identity = getIdentity(context);
  if (!identity) return json(503, { success: false, error: 'Servicio de identidad no disponible. Intenta de nuevo.' });

  try {
    const fresh = await identityGetUser(identity, user.sub);
    const am = fresh.app_metadata || {};
    const um = fresh.user_metadata || {};

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=completed_modules', { method: 'GET' });
    const completed = profileRows.length ? (profileRows[0].completed_modules || []) : [];
    const status = computeStatus(am, completed);
    const nombre = am.diploma_name || null;
    const diplomas = am.diplomas || {};

    if (event.httpMethod === 'GET') {
      return json(200, {
        success: true, ...status, nombre, diplomas,
        // Sugerencia para el modal de confirmación: el nombre dado al registrarse.
        nombreSugerido: um.full_name || um.name || null,
        scores: am.quiz_scores || {}
      });
    }

    if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Método no permitido.' });
    const body = JSON.parse(event.body || '{}');

    if (body.action === 'set-name') {
      if (nombre) return json(400, { success: false, error: 'Tu nombre ya fue confirmado y no puede cambiarse desde la web. Si hay un error real, escríbenos y lo corregimos.' });
      const clean = validName(body.name);
      if (!clean) return json(400, { success: false, error: 'Escribe tu nombre y apellidos reales (solo letras, entre 2 y 6 palabras).' });
      await identityUpdateAppMeta(identity, user.sub, { diploma_name: clean });
      return json(200, { success: true, nombre: clean });
    }

    if (body.action === 'claim') {
      const curso = body.curso === 'institucional' ? 'institucional' : 'basico';
      if (diplomas[curso]) return json(200, { success: true, diploma: diplomas[curso], curso });
      if (!status.elegible[curso]) {
        return json(400, { success: false, error: 'Aún no cumples los requisitos de este programa (todos los módulos completados y promedio aprobatorio).', ...status });
      }
      if (!nombre) return json(400, { success: false, error: 'Primero confirma tu nombre real.', needName: true });
      const nota = curso === 'institucional' ? status.notas.promedioInstitucional : status.notas.promedioBasico;
      const record = {
        cert: certId(user.sub, curso),
        fecha: new Date().toISOString(),
        nota,
        nombre
      };
      await identityUpdateAppMeta(identity, user.sub, { diplomas: { ...diplomas, [curso]: record } });
      return json(200, { success: true, diploma: record, curso });
    }

    return json(400, { success: false, error: 'Acción inválida.' });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};
