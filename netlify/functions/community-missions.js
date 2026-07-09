const { supabaseRequest } = require('./_supabase');
const { MISSION_DEFS, getOrCreateTodayMission } = require('./_gamification');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }

    const mission = await getOrCreateTodayMission(profileRows[0].id);

    const missions = {
      post: { ...MISSION_DEFS.post, progress: mission.posted ? 1 : 0, claimed: mission.claimed_post },
      votes: { ...MISSION_DEFS.votes, progress: Math.min(mission.votes_count, MISSION_DEFS.votes.target), claimed: mission.claimed_votes },
      chat: { ...MISSION_DEFS.chat, progress: Math.min(mission.chat_count, MISSION_DEFS.chat.target), claimed: mission.claimed_chat }
    };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, missions }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
