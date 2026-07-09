const { supabaseRequest } = require('./_supabase');
const { findAvatar } = require('./_avatars');

exports.handler = async (event, context) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return { statusCode: 200, body: 'ok' };

  const params = event.queryStringParameters || {};
  let type = params.type || params.topic;
  let id = params['data.id'] || params.id;

  if (!type || !id) {
    try {
      const body = JSON.parse(event.body || '{}');
      type = type || body.type;
      id = id || (body.data && body.data.id);
    } catch (e) { /* notificación sin body JSON, se ignora */ }
  }

  if (!type || !id) return { statusCode: 200, body: 'ok' };

  try {
    if (type === 'payment') {
      const payRes = await fetch('https://api.mercadopago.com/v1/payments/' + id, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const payment = await payRes.json();
      if (payRes.ok && payment.status === 'approved' && payment.external_reference) {
        const [netlifyUserId, avatarId] = payment.external_reference.split(':');
        const avatar = findAvatar(avatarId);
        if (avatar) {
          const profileRows = await supabaseRequest(
            'profiles?netlify_user_id=eq.' + encodeURIComponent(netlifyUserId) + '&select=id',
            { method: 'GET' }
          );
          if (profileRows.length) {
            const profileId = profileRows[0].id;
            const existing = await supabaseRequest(
              'avatar_purchases?profile_id=eq.' + profileId + '&avatar_id=eq.' + encodeURIComponent(avatarId) + '&select=id',
              { method: 'GET' }
            );
            if (!existing.length) {
              await supabaseRequest('avatar_purchases', {
                method: 'POST',
                body: JSON.stringify({
                  profile_id: profileId,
                  avatar_id: avatarId,
                  amount_soles: avatar.priceSoles,
                  mercadopago_payment_id: String(id)
                })
              });
            }
          }
        }
      }
    } else if (type === 'preapproval') {
      const preRes = await fetch('https://api.mercadopago.com/preapproval/' + id, {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });
      const preapproval = await preRes.json();
      if (preRes.ok && preapproval.status === 'authorized' && preapproval.external_reference) {
        const identity = context.clientContext && context.clientContext.identity;
        if (identity) {
          await fetch(identity.url + '/admin/users/' + preapproval.external_reference, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app_metadata: { premium: true, mercadopago_preapproval_id: id }
            })
          });
        }
      }
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e) {
    return { statusCode: 200, body: 'ok' };
  }
};
