const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if (event.httpMethod === 'GET') {
      const rows = await supabaseRequest('post_bookmarks?profile_id=eq.' + profile.id + '&select=post_id', { method: 'GET' });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, postIds: rows.map((r) => r.post_id) }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const postId = body.postId;
      if (!postId || !UUID_RE.test(postId)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'postId inválido' }) };
      }

      const existing = await supabaseRequest(
        'post_bookmarks?profile_id=eq.' + profile.id + '&post_id=eq.' + postId + '&select=id',
        { method: 'GET' }
      );

      if (existing.length) {
        await supabaseRequest('post_bookmarks?id=eq.' + existing[0].id, { method: 'DELETE' });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, bookmarked: false }) };
      }

      await supabaseRequest('post_bookmarks', {
        method: 'POST',
        body: JSON.stringify({ profile_id: profile.id, post_id: postId })
      });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, bookmarked: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
