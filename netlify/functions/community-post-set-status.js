const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

const ALLOWED_STATUS = ['ganadora', 'perdedora', 'cancelada'];
const WIN_BONUS = 15;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const postId = body.postId;
    const status = body.status;
    if (!postId || !ALLOWED_STATUS.includes(status)) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Estado inválido.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    const profile = profileRows[0];

    const postRows = await supabaseRequest('community_posts?id=eq.' + encodeURIComponent(postId) + '&select=id,profile_id,is_structured_idea,idea_status', { method: 'GET' });
    if (!postRows.length) return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Publicación no encontrada.' }) };
    const post = postRows[0];

    if (post.profile_id !== profile.id) {
      return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Solo el autor puede actualizar el estado de su idea.' }) };
    }
    if (!post.is_structured_idea) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Esta publicación no es una idea estructurada.' }) };
    }
    if (post.idea_status !== 'abierta') {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Esta idea ya tiene un estado final.' }) };
    }

    const updated = await supabaseRequest('community_posts?id=eq.' + postId, {
      method: 'PATCH',
      body: JSON.stringify({ idea_status: status, idea_status_updated_at: new Date().toISOString() })
    });

    let remainingPoints = profile.points;
    if (status === 'ganadora') {
      remainingPoints = await awardPoints(profile.id, profile.points, WIN_BONUS, 'idea_won:' + postId);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, post: updated[0], points: remainingPoints }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.detail) || e.message || e) }) };
  }
};
