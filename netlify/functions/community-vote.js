const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const postId = body.postId;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!postId || !UUID_RE.test(postId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'postId inválido' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const postRows = await supabaseRequest('community_posts?id=eq.' + postId + '&select=id,profile_id,upvotes', { method: 'GET' });
    if (!postRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Publicación no encontrada.' }) };
    const post = postRows[0];

    if (post.profile_id === profile.id) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No puedes votar tu propia publicación.' }) };
    }

    try {
      await supabaseRequest('post_votes', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId, profile_id: profile.id })
      });
    } catch (e) {
      if (e.statusCode === 409) {
        return { statusCode: 409, body: JSON.stringify({ success: false, error: 'Ya votaste esta publicación.' }) };
      }
      throw e;
    }

    await supabaseRequest('community_posts?id=eq.' + postId, {
      method: 'PATCH',
      body: JSON.stringify({ upvotes: (post.upvotes || 0) + 1 })
    });

    const authorRows = await supabaseRequest('profiles?id=eq.' + post.profile_id + '&select=id,points', { method: 'GET' });
    if (authorRows.length) {
      const author = authorRows[0];
      await supabaseRequest('points_ledger', {
        method: 'POST',
        body: JSON.stringify({ profile_id: author.id, amount: 2, reason: 'post_upvoted' })
      });
      await supabaseRequest('profiles?id=eq.' + author.id, {
        method: 'PATCH',
        body: JSON.stringify({ points: (author.points || 0) + 2 })
      });
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, upvotes: (post.upvotes || 0) + 1 }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
