const { supabaseRequest } = require('./_supabase');
const { awardPoints, WEEKLY_CHALLENGE_DEFS, getWeekStart, getISOWeekNumber } = require('./_gamification');

async function computeProgress(profileId, weekStartISO, type) {
  const createdFilter = 'created_at=gte.' + weekStartISO + 'T00:00:00Z';

  if (type === 'posts') {
    const rows = await supabaseRequest('community_posts?profile_id=eq.' + profileId + '&' + createdFilter + '&select=id', { method: 'GET' });
    return rows.length;
  }
  if (type === 'journal') {
    const rows = await supabaseRequest('trade_journal?profile_id=eq.' + profileId + '&' + createdFilter + '&select=id', { method: 'GET' });
    return rows.length;
  }

  const rows = await supabaseRequest('daily_missions?profile_id=eq.' + profileId + '&mission_date=gte.' + weekStartISO + '&select=votes_count,chat_count', { method: 'GET' });
  if (type === 'votes') return rows.reduce((a, r) => a + (r.votes_count || 0), 0);
  if (type === 'chat') return rows.reduce((a, r) => a + (r.chat_count || 0), 0);
  return 0;
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekNum = getISOWeekNumber(now);
    const def = WEEKLY_CHALLENGE_DEFS[weekNum % WEEKLY_CHALLENGE_DEFS.length];

    let rows = await supabaseRequest('weekly_challenges?profile_id=eq.' + profile.id + '&week_start=eq.' + weekStart + '&select=*', { method: 'GET' });
    let record = rows[0];
    if (!record) {
      const created = await supabaseRequest('weekly_challenges', {
        method: 'POST',
        body: JSON.stringify({ profile_id: profile.id, week_start: weekStart })
      });
      record = created[0];
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      if (body.action === 'claim') {
        const progress = await computeProgress(profile.id, weekStart, def.key);
        if (record.claimed) {
          return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Ya reclamaste la recompensa de esta semana.' }) };
        }
        if (progress < def.target) {
          return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Todavía no completas el reto de esta semana.' }) };
        }
        await awardPoints(profile.id, profile.points, def.reward, 'weekly_challenge:' + def.key);
        await supabaseRequest('weekly_challenges?id=eq.' + record.id, {
          method: 'PATCH',
          body: JSON.stringify({ claimed: true })
        });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, claimed: true, reward: def.reward }) };
      }
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Acción no reconocida.' }) };
    }

    const progress = await computeProgress(profile.id, weekStart, def.key);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, label: def.label, target: def.target, reward: def.reward, progress, claimed: record.claimed, weekStart })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
