const crypto = require('crypto');
const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');

const ALLOWED_MEDIA_TYPES = {
  'image/png': { ext: 'png', kind: 'image' }, 'image/jpeg': { ext: 'jpg', kind: 'image' },
  'image/gif': { ext: 'gif', kind: 'image' }, 'image/webp': { ext: 'webp', kind: 'image' },
  'video/mp4': { ext: 'mp4', kind: 'video' }, 'video/webm': { ext: 'webm', kind: 'video' }
};
const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

async function uploadStoryMedia(profileId, base64, mimeType) {
  const meta = ALLOWED_MEDIA_TYPES[mimeType];
  if (!meta) throw Object.assign(new Error('Formato de archivo no soportado. Usa imagen o video.'), { statusCode: 400 });

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_MEDIA_BYTES) {
    throw Object.assign(new Error('El archivo no puede pesar más de 8 MB.'), { statusCode: 400 });
  }

  const path = `${profileId}/${Date.now()}-${crypto.randomUUID()}.${meta.ext}`;
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(url + '/storage/v1/object/story-media/' + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'apikey': key, 'Content-Type': mimeType },
    body: buffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw Object.assign(new Error('No se pudo subir el archivo: ' + errText), { statusCode: 502 });
  }

  return { url: url + '/storage/v1/object/public/story-media/' + path, kind: meta.kind };
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const mediaBase64 = body.mediaBase64;
    const mediaType = body.mediaType;
    const caption = (body.caption || '').trim().slice(0, 140);

    if (!mediaBase64) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el archivo.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recent = await supabaseRequest(
      'stories?profile_id=eq.' + profile.id + '&created_at=gte.' + oneMinuteAgo + '&select=id',
      { method: 'GET' }
    );
    if (recent.length >= 3) {
      return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Estás publicando historias muy rápido. Espera un momento.' }) };
    }

    if (caption && await isFlagged(caption)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu descripción no pasó la moderación automática.' }) };
    }

    const uploaded = await uploadStoryMedia(profile.id, mediaBase64, mediaType);

    const created = await supabaseRequest('stories', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profile.id, media_url: uploaded.url, media_type: uploaded.kind, caption: caption || null })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, story: created[0] }) };
  } catch (e) {
    return { statusCode: e.statusCode || 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
