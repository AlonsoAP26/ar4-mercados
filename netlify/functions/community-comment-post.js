const crypto = require('crypto');
const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');
const { awardPoints } = require('./_gamification');

const ALLOWED_TARGET_TYPES = ['idea', 'noticia', 'post'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]{1,80}$/i;
const COMMENT_REWARD = 3;
const MENTION_RE = /@([a-z0-9_]{3,24})/gi;
const ALLOWED_IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function uploadCommentImage(base64, mimeType) {
  const ext = ALLOWED_IMAGE_TYPES[mimeType];
  if (!ext) throw Object.assign(new Error('Formato de imagen no soportado.'), { statusCode: 400 });

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error('La imagen no puede pesar más de 4 MB.'), { statusCode: 400 });
  }

  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;

  const res = await fetch(url + '/storage/v1/object/comment-images/' + path, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'apikey': key, 'Content-Type': mimeType },
    body: buffer
  });

  if (!res.ok) {
    const errText = await res.text();
    throw Object.assign(new Error('No se pudo subir la imagen: ' + errText), { statusCode: 502 });
  }

  return url + '/storage/v1/object/public/comment-images/' + path;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const targetType = ALLOWED_TARGET_TYPES.includes(body.targetType) ? body.targetType : null;
    const targetId = (body.targetId || '').trim();
    const text = (body.body || '').trim().slice(0, 600);
    const imageBase64 = body.imageBase64 || null;
    const imageType = body.imageType || null;

    if (!targetType) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Tipo de contenido inválido.' }) };
    if (!targetId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el contenido a comentar.' }) };
    if (targetType === 'post' ? !UUID_RE.test(targetId) : !SLUG_RE.test(targetId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Identificador de contenido inválido.' }) };
    }
    if (text.length < 2 && !imageBase64) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El comentario es demasiado corto.' }) };

    const parentCommentId = body.parentCommentId && UUID_RE.test(body.parentCommentId) ? body.parentCommentId : null;

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recent = await supabaseRequest(
      'comments?profile_id=eq.' + profile.id + '&created_at=gte.' + oneMinuteAgo + '&select=id',
      { method: 'GET' }
    );
    if (recent.length >= 8) {
      return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Estás comentando muy rápido. Espera un momento.' }) };
    }

    if (text && await isFlagged(text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu comentario no pasó la moderación automática (spam, enlaces externos, o lenguaje inapropiado). Reformúlalo e inténtalo de nuevo.' }) };
    }

    let imageUrl = null;
    if (imageBase64) {
      imageUrl = await uploadCommentImage(imageBase64, imageType);
    }

    const created = await supabaseRequest('comments', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, profile_id: profile.id, body: text, parent_comment_id: parentCommentId, image_url: imageUrl })
    });
    const newComment = created[0];

    await awardPoints(profile.id, profile.points, COMMENT_REWARD, 'comment_posted');

    try {
      const notifiedProfileIds = new Set();

      if (parentCommentId) {
        const parentRows = await supabaseRequest('comments?id=eq.' + parentCommentId + '&select=profile_id', { method: 'GET' });
        if (parentRows.length && parentRows[0].profile_id !== profile.id) {
          notifiedProfileIds.add(parentRows[0].profile_id);
          await supabaseRequest('notifications', {
            method: 'POST',
            body: JSON.stringify({ profile_id: parentRows[0].profile_id, type: 'reply', actor_profile_id: profile.id, comment_id: newComment.id, post_id: targetType === 'post' ? targetId : null })
          });
        }
      }

      const mentionedUsernames = [...new Set([...text.matchAll(MENTION_RE)].map((m) => m[1].toLowerCase()))].slice(0, 5);
      if (mentionedUsernames.length) {
        const filter = mentionedUsernames.map((u) => 'username.ilike.' + encodeURIComponent(u)).join(',');
        const mentioned = await supabaseRequest('profiles?or=(' + filter + ')&select=id', { method: 'GET' });
        for (const m of mentioned) {
          if (m.id === profile.id || notifiedProfileIds.has(m.id)) continue;
          await supabaseRequest('notifications', {
            method: 'POST',
            body: JSON.stringify({ profile_id: m.id, type: 'mention', actor_profile_id: profile.id, comment_id: newComment.id, post_id: targetType === 'post' ? targetId : null })
          });
        }
      }
    } catch (e) {
      // Las notificaciones son "best effort": nunca deben romper la publicación del comentario.
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, comment: newComment }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
