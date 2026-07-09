const crypto = require('crypto');
const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');
const { effectiveRank, atLeast } = require('./_rank');

const ALLOWED_ROOMS = ['forex', 'commodities', 'acciones', 'cripto', 'elite'];
const MAX_MESSAGES_PER_MINUTE = 8;
const ALLOWED_IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function uploadChatImage(roomId, base64, mimeType) {
  const ext = ALLOWED_IMAGE_TYPES[mimeType];
  if (!ext) throw Object.assign(new Error('Formato de imagen no soportado.'), { statusCode: 400 });

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error('La imagen no puede pesar más de 4 MB.'), { statusCode: 400 });
  }

  const path = `${roomId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(url + '/storage/v1/object/chat-images/' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'apikey': key,
      'Content-Type': mimeType
    },
    body: buffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw Object.assign(new Error('No se pudo subir la imagen: ' + errText), { statusCode: 502 });
  }

  return url + '/storage/v1/object/public/chat-images/' + path;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const roomId = ALLOWED_ROOMS.includes(body.roomId) ? body.roomId : null;
    const text = (body.body || '').trim();
    const imageBase64 = body.imageBase64 || null;
    const imageType = body.imageType || null;

    if (!roomId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Sala inválida.' }) };
    if (!text && !imageBase64) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El mensaje está vacío.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];
    const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
    const rank = effectiveRank(profile.rank, isPremiumPaid);

    if (roomId === 'elite' && !atLeast(rank, 'elite')) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'La sala Elite Traders es exclusiva para rango Élite o Administrador.' }) };
    }

    if (imageBase64 && !atLeast(rank, 'vip')) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Enviar imágenes requiere rango VIP o superior.' }) };
    }

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recent = await supabaseRequest(
      'chat_messages?profile_id=eq.' + profile.id + '&created_at=gte.' + oneMinuteAgo + '&select=id',
      { method: 'GET' }
    );
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Estás enviando mensajes muy rápido. Espera un momento.' }) };
    }

    if (text && await isFlagged(text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu mensaje no pasó la moderación automática (spam, enlaces externos, o lenguaje inapropiado). Reformúlalo e inténtalo de nuevo.' }) };
    }

    let imageUrl = null;
    if (imageBase64) {
      imageUrl = await uploadChatImage(roomId, imageBase64, imageType);
    }

    const created = await supabaseRequest('chat_messages', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, profile_id: profile.id, body: text.slice(0, 500), image_url: imageUrl })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: created[0] }) };
  } catch (e) {
    return { statusCode: e.statusCode || 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
