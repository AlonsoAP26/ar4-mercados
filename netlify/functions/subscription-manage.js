// AR4 Mercados — Estado y cancelación de la suscripción Premium (Mercado Pago).
// GET  -> estado real de la preaprobación: próxima fecha de cobro, monto, estado.
// POST { action: 'cancel' } -> cancela la preaprobación en Mercado Pago y retira
// el acceso Premium. La cancelación es honesta y en un paso confirmado por el
// usuario: sin cobros futuros a partir de ese momento.
exports.handler = async (event, context) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const user = context.clientContext && context.clientContext.user;
  const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });

  const meta = user.app_metadata || {};
  const isPremium = !!meta.premium;
  const preapprovalId = meta.mercadopago_preapproval_id || null;

  if (event.httpMethod === 'GET') {
    if (!isPremium) return json(200, { success: true, premium: false });
    if (!preapprovalId || !accessToken) {
      // Premium otorgado manualmente (sin suscripción de MP asociada).
      return json(200, { success: true, premium: true, managed: false });
    }
    try {
      const res = await fetch('https://api.mercadopago.com/preapproval/' + preapprovalId, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const p = await res.json();
      if (!res.ok) return json(200, { success: true, premium: true, managed: false });
      return json(200, {
        success: true,
        premium: true,
        managed: true,
        status: p.status,
        nextPaymentDate: p.next_payment_date || (p.auto_recurring && p.auto_recurring.end_date) || null,
        amount: p.auto_recurring ? p.auto_recurring.transaction_amount : null,
        currency: p.auto_recurring ? p.auto_recurring.currency_id : null
      });
    } catch (e) {
      return json(200, { success: true, premium: true, managed: false });
    }
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');
    if (body.action !== 'cancel') return json(400, { success: false, error: 'Acción inválida.' });
    if (!isPremium) return json(400, { success: false, error: 'No tienes una suscripción activa.' });
    if (!preapprovalId || !accessToken) {
      return json(400, { success: false, error: 'Tu Premium fue activado manualmente; escríbenos desde Nosotros/Contacto para gestionarlo.' });
    }
    try {
      const res = await fetch('https://api.mercadopago.com/preapproval/' + preapprovalId, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const p = await res.json();
      if (!res.ok) return json(502, { success: false, error: 'Mercado Pago no aceptó la cancelación (' + (p.message || res.status) + '). Intenta de nuevo o contáctanos.' });

      // Retirar el acceso Premium en Identity (el usuario fue advertido antes de confirmar).
      const identity = context.clientContext && context.clientContext.identity;
      if (identity && identity.url && identity.token) {
        await fetch(identity.url + '/admin/users/' + user.sub, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_metadata: { premium: false, mercadopago_preapproval_id: null } })
        });
      }
      return json(200, { success: true, cancelled: true });
    } catch (e) {
      return json(500, { success: false, error: String(e.message || e) });
    }
  }

  return json(405, { success: false, error: 'Método no permitido.' });
};
