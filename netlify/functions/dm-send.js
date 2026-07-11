const crypto = require('crypto');
const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function getMyProfile(user) {
  if (!user) return null;
  const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
  return rows.length ? rows[0] : null;
}

async function uploadDmImage(base64, mimeType) {
  const ext = ALLOWED_IMAGE_TYPES[mimeType];
  if (!ext) throw Object.assign(new Error('Formato de imagen no soportado.'), { statusCode: 400 });
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) throw Object.assign(new Error('La imagen no puede pesar más de 4 MB.'), { statusCode: 400 });

  const path = 'dm-' + Date.now() + '-' + crypto.randomUUID() + '.' + ext;
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;
  const res = await fetch(url + '/storage/v1/object/comment-images/' + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'apikey': key, 'Content-Type': mimeType },
    body: buffer
  });
  if (!res.ok) throw Object.assign(new Error('No se pudo subir la imagen: ' + (await res.text())), { statusCode: 502 });
  return url + '/storage/v1/object/public/comment-images/' + path;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const me = await getMyProfile(user);
    if (!me) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };

    const body = JSON.parse(event.body || '{}');
    const toProfileId = (body.toProfileId || '').trim();
    const text = (body.body || '').trim().slice(0, 1000);
    const imageBase64 = body.imageBase64 || null;
    const imageType = body.imageType || null;

    if (!UUID_RE.test(toProfileId)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Destinatario inválido.' }) };
    if (toProfileId === me.id) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No puedes enviarte mensajes a ti mismo.' }) };
    if (text.length < 1 && !imageBase64) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El mensaje está vacío.' }) };

    const blockFilter = '(blocker_id.eq.' + me.id + ',blocked_id.eq.' + toProfileId + '),(blocker_id.eq.' + toProfileId + ',blocked_id.eq.' + me.id + ')';
    const blocks = await supabaseRequest('blocked_users?or=' + blockFilter, { method: 'GET' });
    if (blocks.length) return { statusCode: 403, body: JSON.stringify({ success: false, error: 'No puedes enviar mensajes a este usuario.' }) };

    const a = me.id < toProfileId ? me.id : toProfileId;
    const b = me.id < toProfileId ? toProfileId : me.id;

    let thread;
    const existing = await supabaseRequest('dm_threads?participant_a=eq.' + a + '&participant_b=eq.' + b + '&select=*', { method: 'GET' });
    if (existing.length) {
      thread = existing[0];
    } else {
      const created = await supabaseRequest('dm_threads', { method: 'POST', body: JSON.stringify({ participant_a: a, participant_b: b }) });
      thread = created[0];
    }

    let imageUrl = null;
    if (imageBase64) imageUrl = await uploadDmImage(imageBase64, imageType);

    const createdMsg = await supabaseRequest('dm_messages', {
      method: 'POST',
      body: JSON.stringify({ thread_id: thread.id, sender_id: me.id, body: text, image_url: imageUrl })
    });

    await supabaseRequest('dm_threads?id=eq.' + thread.id, { method: 'PATCH', body: JSON.stringify({ last_message_at: new Date().toISOString() }) });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: createdMsg[0], threadId: thread.id }) };
  } catch (e) {
    return { statusCode: e.statusCode || 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
