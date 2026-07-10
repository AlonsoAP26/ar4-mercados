const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const allTime = await supabaseRequest(
      'profiles?select=id,username,avatar_color,avatar_url,rank,points,streak_days,verified&order=points.desc&limit=10',
      { method: 'GET' }
    );

    async function topByWindow(days) {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
      const ledgerRows = await supabaseRequest(
        'points_ledger?created_at=gte.' + since + '&select=profile_id,amount',
        { method: 'GET' }
      );
      const totals = {};
      ledgerRows.forEach((r) => { totals[r.profile_id] = (totals[r.profile_id] || 0) + r.amount; });
      const topIds = Object.entries(totals)
        .filter(([, total]) => total > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);
      if (!topIds.length) return [];
      const filter = topIds.map((id) => `"${id}"`).join(',');
      const profiles = await supabaseRequest(
        'profiles?id=in.(' + filter + ')&select=id,username,avatar_color,avatar_url,rank,points,streak_days,verified',
        { method: 'GET' }
      );
      const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
      return topIds.map((id) => byId[id] && { ...byId[id], periodPoints: totals[id] }).filter(Boolean);
    }

    const [weeklyRaw, monthlyRaw] = await Promise.all([topByWindow(7), topByWindow(30)]);
    const weekly = weeklyRaw.map((p) => ({ ...p, weeklyPoints: p.periodPoints }));
    const monthly = monthlyRaw.map((p) => ({ ...p, monthlyPoints: p.periodPoints }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, allTime, weekly, monthly })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
