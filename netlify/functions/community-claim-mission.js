const { supabaseRequest } = require('./_supabase');
const { MISSION_DEFS, getOrCreateTodayMission, awardPoints } = require('./_gamification');

const CLAIM_FIELD = { post: 'claimed_post', votes: 'claimed_votes', chat: 'claimed_chat' };
const PROGRESS_FIELD = { post: 'posted', votes: 'votes_count', chat: 'chat_count' };

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const missionKey = body.missionKey;
    if (!MISSION_DEFS[missionKey]) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Misión inválida.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const mission = await getOrCreateTodayMission(profile.id);
    const claimField = CLAIM_FIELD[missionKey];
    const progressField = PROGRESS_FIELD[missionKey];
    const def = MISSION_DEFS[missionKey];

    if (mission[claimField]) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Ya reclamaste esta misión hoy.' }) };
    }

    const progressValue = progressField === 'posted' ? (mission.posted ? 1 : 0) : mission[progressField];
    if (progressValue < def.target) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Todavía no completas esta misión.' }) };
    }

    const newTotal = await awardPoints(profile.id, profile.points, def.reward, 'mission_' + missionKey);
    await supabaseRequest('daily_missions?id=eq.' + mission.id, {
      method: 'PATCH',
      body: JSON.stringify({ [claimField]: true })
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, reward: def.reward, points: newTotal }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
