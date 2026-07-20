// AR4 Mercados — Lista de usuarios registrados (solo para el dueño del sitio).
// Usa el token de administrador que Netlify Identity inyecta en el contexto de la
// función (el mismo mecanismo que bootstrap-admin.js), así no hace falta ningún
// token manual ni tabla extra: consulta la API de Identity directamente.
// De paso, rellena los perfiles de comunidad que falten para que el contador
// "Traders registrados" coincida con los registros reales.
const { supabaseRequest } = require('./_supabase');
const { ensureProfile } = require('./_profiles');

exports.handler = async (event, context) => {
  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return json(401, { success: false, error: 'Debes iniciar sesión.' });
  }
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return json(403, { success: false, error: 'Esta información solo está disponible para el dueño del sitio.' });
  }

  const identity = context.clientContext && context.clientContext.identity;
  if (!identity || !identity.url || !identity.token) {
    return json(500, { success: false, error: 'No se pudo acceder al contexto de Identity en esta función.' });
  }

  try {
    const all = [];
    let page = 1;
    const perPage = 100;
    // Paginamos hasta traer todos los usuarios (con un tope de seguridad).
    while (page <= 50) {
      const res = await fetch(identity.url + '/admin/users?per_page=' + perPage + '&page=' + page, {
        headers: { Authorization: 'Bearer ' + identity.token }
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        return json(502, { success: false, error: 'Netlify Identity rechazó la consulta (' + res.status + ').', detail });
      }
      const data = await res.json();
      const users = (data && data.users) || [];
      all.push.apply(all, users);
      if (users.length < perPage) break;
      page++;
    }

    // Backfill: crear perfiles de comunidad para los registrados que no lo tengan,
    // para que "Traders registrados" (que cuenta perfiles) refleje los registros reales.
    let profilesCreated = 0;
    try {
      const existing = await supabaseRequest('profiles?select=netlify_user_id', { method: 'GET' });
      const have = new Set((existing || []).map((r) => r.netlify_user_id));
      const missing = all.filter((u) => u.id && !have.has(u.id));
      for (const u of missing) {
        try { const r = await ensureProfile(u); if (r && r.created) profilesCreated++; } catch (e) {}
      }
    } catch (e) { /* si Supabase falla, seguimos mostrando la lista igual */ }

    const now = Date.now();
    const DAY = 86400000;
    const simplified = all.map((u) => {
      const meta = u.user_metadata || {};
      const am = u.app_metadata || {};
      const premiumActivo = !!(am.premium && (!am.premium_until || new Date(am.premium_until).getTime() > now));
      return {
        id: u.id,
        email: u.email || '',
        name: meta.full_name || meta.name || '',
        created_at: u.created_at || null,
        confirmed: !!(u.confirmed_at || u.email_confirmed_at),
        last_login: u.last_signin_at || null,
        premium: premiumActivo,
        premium_until: am.premium_until || null,
        premium_source: am.premium_source || null
      };
    }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const within = (u, ms) => u.created_at && (now - new Date(u.created_at).getTime()) < ms;

    return json(200, {
      success: true,
      profilesCreated: profilesCreated,
      total: simplified.length,
      today: simplified.filter((u) => within(u, DAY)).length,
      week: simplified.filter((u) => within(u, 7 * DAY)).length,
      confirmed: simplified.filter((u) => u.confirmed).length,
      users: simplified
    });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}
