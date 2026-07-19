// AR4 Mercados — Gestión de diplomas (solo dueño del sitio).
// GET: perfiles con progreso, notas, nombre verificado y diplomas de programa.
// POST { action: 'revoke'|'grant', profileId, slug }   -> edita módulos completados.
// POST { action: 'reset-name', userId }                -> permite re-confirmar el nombre.
// POST { action: 'revoke-diploma', userId, curso }     -> retira un diploma emitido.
const { supabaseRequest } = require('./_supabase');
const {
  FREE_SLUGS, PREMIUM_SLUGS, computeStatus,
  getIdentity, identityGetUser, identityUpdateAppMeta, identityListUsers
} = require('./_diplomas');

const VALID_SLUGS = new Set([...FREE_SLUGS, ...PREMIUM_SLUGS]);

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event, context) => {
  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return json(403, { success: false, error: 'Esta sección es solo para el dueño del sitio.' });
  }
  const identity = getIdentity(context);

  try {
    if (event.httpMethod === 'GET') {
      const rows = await supabaseRequest('profiles?select=id,username,rank,points,completed_modules,netlify_user_id&order=points.desc&limit=500', { method: 'GET' });
      let identityById = {};
      if (identity) {
        try {
          const users = await identityListUsers(identity);
          users.forEach((u) => { identityById[u.id] = u; });
        } catch (e) { /* seguimos solo con Supabase */ }
      }
      const profiles = (rows || []).map((p) => {
        const iu = identityById[p.netlify_user_id];
        const am = (iu && iu.app_metadata) || {};
        const status = computeStatus(am, p.completed_modules || []);
        return {
          id: p.id, userId: p.netlify_user_id, username: p.username, rank: p.rank, points: p.points,
          modules: p.completed_modules || [],
          nombre: am.diploma_name || null,
          promedioBasico: status.notas.promedioBasico,
          promedioInstitucional: status.notas.promedioInstitucional,
          notasRegistradas: status.notas.registradasAll,
          progreso: status.progreso,
          elegible: status.elegible,
          diplomas: am.diplomas || {}
        };
      }).sort((a, b) => b.modules.length - a.modules.length);
      return json(200, { success: true, profiles });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action } = body;

      if (action === 'revoke' || action === 'grant') {
        const { profileId, slug } = body;
        if (!profileId || !slug || !VALID_SLUGS.has(slug)) return json(400, { success: false, error: 'Datos inválidos.' });
        const rows = await supabaseRequest('profiles?id=eq.' + encodeURIComponent(profileId) + '&select=id,completed_modules', { method: 'GET' });
        if (!rows.length) return json(404, { success: false, error: 'Perfil no encontrado.' });
        let mods = rows[0].completed_modules || [];
        if (action === 'revoke') mods = mods.filter((s) => s !== slug);
        else if (!mods.includes(slug)) mods = [...mods, slug];
        await supabaseRequest('profiles?id=eq.' + encodeURIComponent(profileId), {
          method: 'PATCH',
          body: JSON.stringify({ completed_modules: mods })
        });
        return json(200, { success: true, modules: mods });
      }

      if (action === 'reset-name') {
        if (!identity || !body.userId) return json(400, { success: false, error: 'Datos inválidos.' });
        await identityUpdateAppMeta(identity, body.userId, { diploma_name: '' });
        return json(200, { success: true });
      }

      if (action === 'revoke-diploma') {
        if (!identity || !body.userId || !body.curso) return json(400, { success: false, error: 'Datos inválidos.' });
        const iu = await identityGetUser(identity, body.userId);
        const dips = { ...((iu.app_metadata && iu.app_metadata.diplomas) || {}) };
        delete dips[body.curso];
        await identityUpdateAppMeta(identity, body.userId, { diplomas: dips });
        return json(200, { success: true });
      }

      return json(400, { success: false, error: 'Acción inválida.' });
    }

    return json(405, { success: false, error: 'Método no permitido.' });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};
