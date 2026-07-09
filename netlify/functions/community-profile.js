const { supabaseRequest } = require('./_supabase');
const { effectiveRank } = require('./_rank');
const { STREAK_MILESTONES, awardPoints, computeBadges } = require('./_gamification');

const AVATAR_COLORS = ['#f0c75e', '#7aa8ff', '#4fd18a', '#ff8a5c', '#f7931a', '#e2001a', '#22c07a'];
const TRADING_STYLES = ['Day trader', 'Swing trader', 'Scalper', 'Macro / posicional', 'HODLer', 'Recién empezando'];

function withEffectiveRank(profile, user) {
  if (!profile) return profile;
  const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
  return { ...profile, effectiveRank: effectiveRank(profile.rank, isPremiumPaid) };
}

async function updateStreakAndBadges(profile) {
  const today = new Date().toISOString().slice(0, 10);
  let working = profile;

  if (profile.last_active_date !== today) {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const newStreak = profile.last_active_date === yesterday ? (profile.streak_days || 0) + 1 : 1;

    let points = profile.points;
    if (STREAK_MILESTONES[newStreak]) {
      points = await awardPoints(profile.id, profile.points, STREAK_MILESTONES[newStreak], 'streak_bonus_' + newStreak);
    }

    const patched = await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ streak_days: newStreak, last_active_date: today, points })
    });
    working = patched[0];
  }

  const newBadges = await computeBadges(working);
  const badgesChanged = newBadges.length !== (working.badges || []).length;
  if (badgesChanged) {
    const patched = await supabaseRequest('profiles?id=eq.' + working.id, {
      method: 'PATCH',
      body: JSON.stringify({ badges: newBadges })
    });
    working = patched[0];
  }

  return working;
}

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=*', { method: 'GET' });
      let profile = rows[0] || null;
      if (profile) {
        try { profile = await updateStreakAndBadges(profile); } catch (e) { /* racha/badges son best-effort, no deben romper el login */ }
      }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: withEffectiveRank(profile, user) }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const username = (body.username || '').trim().slice(0, 24);
      const bio = (body.bio || '').trim().slice(0, 160);
      const tradingStyle = TRADING_STYLES.includes(body.tradingStyle) ? body.tradingStyle : null;
      const requestedColor = AVATAR_COLORS.includes(body.avatarColor) ? body.avatarColor : null;
      const phoneRaw = (body.phone || '').trim().slice(0, 20);
      if (phoneRaw && !/^[0-9+\-\s()]{6,20}$/.test(phoneRaw)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El número de teléfono no es válido.' }) };
      }
      const phone = phoneRaw || null;

      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El nombre de usuario debe tener 3-24 caracteres: letras, números o guion bajo.' }) };
      }

      const existing = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });

      if (existing.length > 0) {
        const patch = { username, bio, trading_style: tradingStyle, phone };
        if (requestedColor) patch.avatar_color = requestedColor;
        const updated = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub), {
          method: 'PATCH',
          body: JSON.stringify(patch)
        });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: withEffectiveRank(updated[0], user) }) };
      }

      const color = requestedColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      let created;
      try {
        created = await supabaseRequest('profiles', {
          method: 'POST',
          body: JSON.stringify({ netlify_user_id: user.sub, username, bio, avatar_color: color, trading_style: tradingStyle, phone })
        });
      } catch (e) {
        if (e.statusCode === 409) {
          return { statusCode: 409, body: JSON.stringify({ success: false, error: 'Ese nombre de usuario ya está en uso.' }) };
        }
        throw e;
      }

      await supabaseRequest('points_ledger', {
        method: 'POST',
        body: JSON.stringify({ profile_id: created[0].id, amount: 20, reason: 'signup_bonus' })
      });
      await supabaseRequest('profiles?id=eq.' + created[0].id, {
        method: 'PATCH',
        body: JSON.stringify({ points: 20 })
      });

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: withEffectiveRank({ ...created[0], points: 20 }, user) }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
