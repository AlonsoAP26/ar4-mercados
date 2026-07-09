const { supabaseRequest } = require('./_supabase');

const MISSION_DEFS = {
  post: { target: 1, reward: 15, label: 'Publica 1 idea en el Foro' },
  votes: { target: 3, reward: 10, label: 'Vota 3 publicaciones de otros traders' },
  chat: { target: 5, reward: 10, label: 'Manda 5 mensajes en el chat' }
};

const STREAK_MILESTONES = { 3: 10, 7: 25, 14: 50, 30: 120 };

const BADGE_DEFS = [
  { key: 'first_post', icon: '📝', name: 'Primera publicación', check: (ctx) => ctx.postsCount >= 1 },
  { key: 'century', icon: '💯', name: '100 puntos', check: (ctx) => ctx.profile.points >= 100 },
  { key: 'high_roller', icon: '💰', name: '1000 puntos', check: (ctx) => ctx.profile.points >= 1000 },
  { key: 'streak_7', icon: '🔥', name: '7 días de racha', check: (ctx) => ctx.profile.streak_days >= 7 },
  { key: 'streak_30', icon: '🌟', name: '30 días de racha', check: (ctx) => ctx.profile.streak_days >= 30 },
  { key: 'philanthropist', icon: '🎁', name: 'Donó puntos', check: (ctx) => ctx.donationsGiven >= 1 },
  { key: 'elite_member', icon: '★', name: 'Rango Élite', check: (ctx) => ctx.profile.rank === 'elite' || ctx.profile.rank === 'administrador' }
];

async function awardPoints(profileId, currentPoints, amount, reason) {
  await supabaseRequest('points_ledger', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId, amount, reason })
  });
  const newTotal = (currentPoints || 0) + amount;
  await supabaseRequest('profiles?id=eq.' + profileId, {
    method: 'PATCH',
    body: JSON.stringify({ points: newTotal })
  });
  return newTotal;
}

async function getOrCreateTodayMission(profileId) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await supabaseRequest(
    'daily_missions?profile_id=eq.' + profileId + '&mission_date=eq.' + today + '&select=*',
    { method: 'GET' }
  );
  if (rows.length) return rows[0];
  const created = await supabaseRequest('daily_missions', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId, mission_date: today })
  });
  return created[0];
}

async function incrementMissionCounter(profileId, field) {
  try {
    const mission = await getOrCreateTodayMission(profileId);
    const patch = {};
    if (field === 'votes_count' || field === 'chat_count') {
      patch[field] = (mission[field] || 0) + 1;
    } else if (field === 'posted') {
      patch.posted = true;
    }
    await supabaseRequest('daily_missions?id=eq.' + mission.id, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  } catch (e) {
    // Progreso de misiones es "best effort": nunca debe romper la acción principal.
  }
}

async function computeBadges(profile) {
  let postsCount = 0;
  let donationsGiven = 0;
  try {
    const posts = await supabaseRequest('community_posts?profile_id=eq.' + profile.id + '&select=id&limit=1', { method: 'GET' });
    postsCount = posts.length;
  } catch (e) { /* postsCount queda en 0 si falla */ }
  try {
    const donations = await supabaseRequest('point_donations?from_profile_id=eq.' + profile.id + '&select=id&limit=1', { method: 'GET' });
    donationsGiven = donations.length;
  } catch (e) { /* donationsGiven queda en 0 si falla */ }

  const ctx = { profile, postsCount, donationsGiven };
  const earned = BADGE_DEFS.filter((b) => b.check(ctx)).map((b) => b.key);
  const existing = profile.badges || [];
  const merged = Array.from(new Set([...existing, ...earned]));
  return merged;
}

const WEEKLY_CHALLENGE_DEFS = [
  { key: 'posts', label: 'Publica 3 ideas en el Foro esta semana', target: 3, reward: 40 },
  { key: 'votes', label: 'Vota 15 publicaciones esta semana', target: 15, reward: 40 },
  { key: 'chat', label: 'Manda 30 mensajes en el chat esta semana', target: 30, reward: 40 },
  { key: 'journal', label: 'Registra 3 operaciones en tu diario de trading esta semana', target: 3, reward: 40 }
];

function getWeekStart(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  MISSION_DEFS, STREAK_MILESTONES, BADGE_DEFS, awardPoints, getOrCreateTodayMission, incrementMissionCounter, computeBadges,
  WEEKLY_CHALLENGE_DEFS, getWeekStart, getISOWeekNumber
};
