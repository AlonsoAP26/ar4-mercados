// AR4 Mercados — Activación MANUAL de Premium (solo dueño del sitio).
// Para pagos por Yape u otros canales manuales: el dueño verifica el pago por
// WhatsApp y activa Premium por N días desde el panel admin.
// POST { userId, action: 'activar'|'quitar', dias? (por defecto 31) }
function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Método no permitido.' });
  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return json(403, { success: false, error: 'Solo el dueño del sitio puede activar Premium manualmente.' });
  }
  const identity = context.clientContext && context.clientContext.identity;
  if (!identity || !identity.url || !identity.token) {
    return json(500, { success: false, error: 'Sin acceso al contexto de Identity.' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const userId = (body.userId || '').trim();
    if (!userId) return json(400, { success: false, error: 'Falta el usuario.' });

    let patch;
    if (body.action === 'activar') {
      const dias = Math.min(Math.max(parseInt(body.dias, 10) || 31, 1), 400);
      patch = {
        premium: true,
        premium_until: new Date(Date.now() + dias * 86400000).toISOString(),
        premium_source: 'manual-yape'
      };
    } else if (body.action === 'quitar') {
      patch = { premium: false, premium_until: null, premium_source: null };
    } else {
      return json(400, { success: false, error: 'Acción inválida.' });
    }

    const res = await fetch(identity.url + '/admin/users/' + userId, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_metadata: patch })
    });
    if (!res.ok) return json(502, { success: false, error: 'Identity rechazó el cambio (' + res.status + ').' });
    return json(200, { success: true, premium: patch.premium, premium_until: patch.premium_until || null });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};
