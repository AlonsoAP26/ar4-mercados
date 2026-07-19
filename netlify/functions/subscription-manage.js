// AR4 Mercados — Estado y cancelación de la suscripción Premium (Mercado Pago).
// GET  -> estado real de la preaprobación: próxima fecha de cobro, monto, estado.
// POST { action: 'cancel' } -> cancela la preaprobación en Mercado Pago y retira
// el acceso Premium. La cancelación es honesta y en un paso confirmado por el
// usuario: sin cobros futuros a partir de ese momento.
function premiumActive(meta) {
  if (!meta || !meta.premium) return false;
  if (meta.premium_until && new Date(meta.premium_until).getTime() < Date.now()) return false;
  return true;
}

exports.handler = async (event, context) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const user = context.clientContext && context.clientContext.user;
  const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });

  const meta = user.app_metadata || {};
  const isPremium = premiumActive(meta);
  const preapprovalId = meta.mercadopago_preapproval_id || null;

  if (event.httpMethod === 'GET') {
    if (!isPremium) return json(200, { success: true, premium: false });
    if (!preapprovalId && meta.premium_until) {
      // Suscripción ya cancelada: acceso vigente hasta el fin del periodo pagado.
      return json(200, { success: true, premium: true, managed: true, status: 'cancelled', nextPaymentDate: null, accessUntil: meta.premium_until });
    }
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
      // Capturar la fecha del periodo ya pagado ANTES de cancelar, para mantener
      // el acceso hasta esa fecha (lo prometido en el FAQ: sin cobros futuros,
      // acceso hasta el final del periodo pagado).
      let paidUntil = null;
      try {
        const preRes = await fetch('https://api.mercadopago.com/preapproval/' + preapprovalId, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        const pre = await preRes.json();
        if (preRes.ok && pre.next_payment_date) paidUntil = pre.next_payment_date;
      } catch (e) { /* si no se puede leer, se cancela igual sin fecha */ }

      const res = await fetch('https://api.mercadopago.com/preapproval/' + preapprovalId, {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const p = await res.json();
      if (!res.ok) return json(502, { success: false, error: 'Mercado Pago no aceptó la cancelación (' + (p.message || res.status) + '). Intenta de nuevo o contáctanos.' });

      // El acceso se mantiene hasta el fin del periodo pagado: premium sigue en true
      // con fecha de expiración; todas las verificaciones del sitio respetan premium_until.
      const identity = context.clientContext && context.clientContext.identity;
      if (identity && identity.url && identity.token) {
        const appMeta = paidUntil
          ? { premium: true, premium_until: paidUntil, mercadopago_preapproval_id: null }
          : { premium: false, premium_until: null, mercadopago_preapproval_id: null };
        await fetch(identity.url + '/admin/users/' + user.sub, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ app_metadata: appMeta })
        });
      }
      return json(200, { success: true, cancelled: true, accessUntil: paidUntil });
    } catch (e) {
      return json(500, { success: false, error: String(e.message || e) });
    }
  }

  return json(405, { success: false, error: 'Método no permitido.' });
};
