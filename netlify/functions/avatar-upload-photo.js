const crypto = require('crypto');
const { supabaseRequest } = require('./_supabase');

const ALLOWED_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profileId = profileRows[0].id;

    if (body.remove) {
      const updated = await supabaseRequest('profiles?id=eq.' + profileId, { method: 'PATCH', body: JSON.stringify({ avatar_url: null }) });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: updated[0] }) };
    }

    const ext = ALLOWED_TYPES[body.mimeType];
    if (!ext) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Formato no soportado. Usa JPG, PNG o WEBP.' }) };

    const buffer = Buffer.from(body.imageBase64 || '', 'base64');
    if (!buffer.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Imagen vacía.' }) };
    if (buffer.length > MAX_BYTES) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'La foto no puede pesar más de 4 MB.' }) };

    const path = `${profileId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const url = process.env.SUPABASE_KEY;
    const key = process.env.SUPABASE_SECRET_KEY;

    const uploadRes = await fetch(url + '/storage/v1/object/avatar-uploads/' + path, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'apikey': key, 'Content-Type': body.mimeType },
      body: buffer
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return { statusCode: 502, body: JSON.stringify({ success: false, error: 'No se pudo subir la foto.', detail: errText }) };
    }

    const publicUrl = url + '/storage/v1/object/public/avatar-uploads/' + path;
    const updated = await supabaseRequest('profiles?id=eq.' + profileId, { method: 'PATCH', body: JSON.stringify({ avatar_url: publicUrl }) });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: updated[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.detail) || e.message || e) }) };
  }
};
