const { supabaseRequest } = require('./_supabase');

const ALLOWED_TYPES = ['idea', 'noticia'];
const ALLOWED_EMOJI = ['👍', '👎', '❤️', '🔥', '🎯', '🚀', '💡'];
const SLUG_RE = /^[a-z0-9-]{1,80}$/i;

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;

  try {
    if (event.httpMethod === 'GET') {
      const q = event.queryStringParameters || {};
      const targetType = ALLOWED_TYPES.includes(q.targetType) ? q.targetType : null;
      const targetId = (q.targetId || '').trim();
      if (!targetType || !SLUG_RE.test(targetId)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Parámetros inválidos.' }) };
      }

      const all = await supabaseRequest(
        'target_reactions?target_type=eq.' + targetType + '&target_id=eq.' + encodeURIComponent(targetId) + '&select=emoji,profile_id',
        { method: 'GET' }
      );
      const counts = {};
      ALLOWED_EMOJI.forEach((e) => { counts[e] = 0; });
      let myReactions = [];
      let myProfileId = null;
      if (user) {
        const myProfile = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
        if (myProfile.length) myProfileId = myProfile[0].id;
      }
      all.forEach((r) => {
        counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        if (myProfileId && r.profile_id === myProfileId) myReactions.push(r.emoji);
      });

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, counts, myReactions }) };
    }

    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

    const body = JSON.parse(event.body || '{}');
    const targetType = ALLOWED_TYPES.includes(body.targetType) ? body.targetType : null;
    const targetId = (body.targetId || '').trim();
    const emoji = body.emoji;

    if (!targetType) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Tipo de contenido inválido.' }) };
    if (!SLUG_RE.test(targetId)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Identificador inválido.' }) };
    if (!ALLOWED_EMOJI.includes(emoji)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Reacción inválida.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const existing = await supabaseRequest(
      'target_reactions?target_type=eq.' + targetType + '&target_id=eq.' + encodeURIComponent(targetId) + '&profile_id=eq.' + profile.id + '&emoji=eq.' + encodeURIComponent(emoji) + '&select=id',
      { method: 'GET' }
    );

    let active;
    if (existing.length) {
      await supabaseRequest('target_reactions?id=eq.' + existing[0].id, { method: 'DELETE' });
      active = false;
    } else {
      await supabaseRequest('target_reactions', {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_id: targetId, profile_id: profile.id, emoji })
      });
      active = true;
    }

    const all = await supabaseRequest(
      'target_reactions?target_type=eq.' + targetType + '&target_id=eq.' + encodeURIComponent(targetId) + '&select=emoji,profile_id',
      { method: 'GET' }
    );
    const counts = {};
    ALLOWED_EMOJI.forEach((e) => { counts[e] = 0; });
    const myReactions = [];
    all.forEach((r) => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
      if (r.profile_id === profile.id) myReactions.push(r.emoji);
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, active, counts, myReactions }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
