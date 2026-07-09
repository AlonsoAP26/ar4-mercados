const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');
const { effectiveRank, atLeast } = require('./_rank');

const ALLOWED_ROOMS = ['forex', 'acciones', 'cripto', 'elite'];
const MAX_MESSAGES_PER_MINUTE = 8;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const roomId = ALLOWED_ROOMS.includes(body.roomId) ? body.roomId : null;
    const text = (body.body || '').trim();

    if (!roomId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Sala inválida.' }) };
    if (!text) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El mensaje está vacío.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,username,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if (roomId === 'elite') {
      const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
      const rank = effectiveRank(profile.rank, isPremiumPaid);
      if (!atLeast(rank, 'elite')) {
        return { statusCode: 403, body: JSON.stringify({ success: false, error: 'La sala Elite Traders es exclusiva para rango Élite o Administrador.' }) };
      }
    }

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const recent = await supabaseRequest(
      'chat_messages?profile_id=eq.' + profile.id + '&created_at=gte.' + oneMinuteAgo + '&select=id',
      { method: 'GET' }
    );
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Estás enviando mensajes muy rápido. Espera un momento.' }) };
    }

    if (await isFlagged(text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu mensaje no pasó la moderación automática (spam, enlaces externos, o lenguaje inapropiado). Reformúlalo e inténtalo de nuevo.' }) };
    }

    const created = await supabaseRequest('chat_messages', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, profile_id: profile.id, body: text.slice(0, 500) })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, message: created[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
