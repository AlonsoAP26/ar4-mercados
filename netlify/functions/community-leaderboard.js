const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const allTime = await supabaseRequest(
      'profiles?select=id,username,avatar_color,avatar_url,rank,points,streak_days&order=points.desc&limit=10',
      { method: 'GET' }
    );

    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const ledgerRows = await supabaseRequest(
      'points_ledger?created_at=gte.' + since + '&select=profile_id,amount',
      { method: 'GET' }
    );

    const weeklyTotals = {};
    ledgerRows.forEach((r) => {
      weeklyTotals[r.profile_id] = (weeklyTotals[r.profile_id] || 0) + r.amount;
    });

    const topWeeklyIds = Object.entries(weeklyTotals)
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    let weekly = [];
    if (topWeeklyIds.length) {
      const filter = topWeeklyIds.map((id) => `"${id}"`).join(',');
      const profiles = await supabaseRequest(
        'profiles?id=in.(' + filter + ')&select=id,username,avatar_color,avatar_url,rank,points,streak_days',
        { method: 'GET' }
      );
      const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
      weekly = topWeeklyIds
        .map((id) => byId[id] && { ...byId[id], weeklyPoints: weeklyTotals[id] })
        .filter(Boolean);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, allTime, weekly })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
