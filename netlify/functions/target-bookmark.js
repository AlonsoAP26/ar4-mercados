const { supabaseRequest } = require('./_supabase');

const ALLOWED_TYPES = ['idea', 'noticia'];
const SLUG_RE = /^[a-z0-9-]{1,80}$/i;

async function getMyProfileId(user) {
  if (!user) return null;
  const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
  return rows.length ? rows[0].id : null;
}

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
      const myProfileId = await getMyProfileId(user);
      let bookmarked = false;
      if (myProfileId) {
        const rows = await supabaseRequest(
          'target_bookmarks?target_type=eq.' + targetType + '&target_id=eq.' + encodeURIComponent(targetId) + '&profile_id=eq.' + myProfileId + '&select=id',
          { method: 'GET' }
        );
        bookmarked = rows.length > 0;
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, bookmarked }) };
    }

    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

    const body = JSON.parse(event.body || '{}');
    const targetType = ALLOWED_TYPES.includes(body.targetType) ? body.targetType : null;
    const targetId = (body.targetId || '').trim();
    if (!targetType || !SLUG_RE.test(targetId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Parámetros inválidos.' }) };
    }

    const myProfileId = await getMyProfileId(user);
    if (!myProfileId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };

    const existing = await supabaseRequest(
      'target_bookmarks?target_type=eq.' + targetType + '&target_id=eq.' + encodeURIComponent(targetId) + '&profile_id=eq.' + myProfileId + '&select=id',
      { method: 'GET' }
    );

    let bookmarked;
    if (existing.length) {
      await supabaseRequest('target_bookmarks?id=eq.' + existing[0].id, { method: 'DELETE' });
      bookmarked = false;
    } else {
      await supabaseRequest('target_bookmarks', {
        method: 'POST',
        body: JSON.stringify({ profile_id: myProfileId, target_type: targetType, target_id: targetId })
      });
      bookmarked = true;
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, bookmarked }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
