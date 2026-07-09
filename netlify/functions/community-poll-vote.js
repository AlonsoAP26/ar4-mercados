const { supabaseRequest } = require('./_supabase');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const postId = body.postId;
    const optionIndex = parseInt(body.optionIndex, 10);

    if (!postId || !UUID_RE.test(postId)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'postId inválido' }) };
    }
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Opción inválida.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const postRows = await supabaseRequest('community_posts?id=eq.' + postId + '&select=id,poll_options,poll_votes_count', { method: 'GET' });
    if (!postRows.length || !postRows[0].poll_options) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Esta publicación no tiene encuesta.' }) };
    }
    const post = postRows[0];
    if (optionIndex >= post.poll_options.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Opción inválida.' }) };
    }

    try {
      await supabaseRequest('post_poll_votes', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId, profile_id: profile.id, option_index: optionIndex })
      });
    } catch (e) {
      if (e.statusCode === 409) {
        return { statusCode: 409, body: JSON.stringify({ success: false, error: 'Ya votaste en esta encuesta.' }) };
      }
      throw e;
    }

    const counts = (post.poll_votes_count || post.poll_options.map(() => 0)).slice();
    counts[optionIndex] = (counts[optionIndex] || 0) + 1;

    await supabaseRequest('community_posts?id=eq.' + postId, {
      method: 'PATCH',
      body: JSON.stringify({ poll_votes_count: counts })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, counts, myVote: optionIndex }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
