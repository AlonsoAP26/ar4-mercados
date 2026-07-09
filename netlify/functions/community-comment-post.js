const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');
const { awardPoints } = require('./_gamification');

const ALLOWED_TARGET_TYPES = ['idea', 'noticia', 'post'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9-]{1,80}$/i;
const COMMENT_REWARD = 3;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const targetType = ALLOWED_TARGET_TYPES.includes(body.targetType) ? body.targetType : null;
    const targetId = (body.targetId || '').trim();
    const text = (body.body || '').trim().slice(0, 600);

    if (!targetType) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Tipo de contenido inválido.' }) };
    if (!targetId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el contenido a comentar.' }) };
    if (targetType === 'post' ? !UUID_RE.test(targetId) : !SLUG_RE.test(targetId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Identificador de contenido inválido.' }) };
    }
    if (text.length < 2) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El comentario es demasiado corto.' }) };

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

    if (await isFlagged(text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu comentario no pasó la moderación automática (spam, enlaces externos, o lenguaje inapropiado). Reformúlalo e inténtalo de nuevo.' }) };
    }

    const created = await supabaseRequest('comments', {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType, target_id: targetId, profile_id: profile.id, body: text })
    });

    await awardPoints(profile.id, profile.points, COMMENT_REWARD, 'comment_posted');

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, comment: created[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
