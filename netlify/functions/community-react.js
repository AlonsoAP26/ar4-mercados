const { supabaseRequest } = require('./_supabase');

const ALLOWED_EMOJI = ['🔥', '🚀', '💡', '🤔'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const postId = body.postId;
    const emoji = body.emoji;

    if (!postId || !UUID_RE.test(postId)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'postId inválido' }) };
    if (!ALLOWED_EMOJI.includes(emoji)) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Emoji inválido' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const existing = await supabaseRequest(
      'post_reactions?post_id=eq.' + postId + '&profile_id=eq.' + profile.id + '&emoji=eq.' + encodeURIComponent(emoji) + '&select=id',
      { method: 'GET' }
    );

    let active;
    if (existing.length) {
      await supabaseRequest('post_reactions?id=eq.' + existing[0].id, { method: 'DELETE' });
      active = false;
    } else {
      await supabaseRequest('post_reactions', {
        method: 'POST',
        body: JSON.stringify({ post_id: postId, profile_id: profile.id, emoji })
      });
      active = true;
    }

    const counts = await supabaseRequest('post_reactions?post_id=eq.' + postId + '&select=emoji', { method: 'GET' });
    const tally = {};
    ALLOWED_EMOJI.forEach((e) => { tally[e] = 0; });
    counts.forEach((r) => { tally[r.emoji] = (tally[r.emoji] || 0) + 1; });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, active, counts: tally }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
