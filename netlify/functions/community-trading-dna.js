const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    const trades = await supabaseRequest(
      'trade_journal?profile_id=eq.' + profile.id + '&select=*&order=created_at.desc&limit=500',
      { method: 'GET' }
    );

    if (!trades.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, hasData: false }) };
    }

    const totalTrades = trades.length;
    const closed = trades.filter((t) => t.result === 'ganadora' || t.result === 'perdedora');
    const wins = closed.filter((t) => t.result === 'ganadora').length;
    const winRate = closed.length ? Math.round((wins / closed.length) * 1000) / 10 : null;

    const longCount = trades.filter((t) => t.direction === 'long').length;
    const shortCount = trades.filter((t) => t.direction === 'short').length;
    const longPct = Math.round((longCount / totalTrades) * 100);
    const shortPct = 100 - longPct;

    const symbolCounts = {};
    trades.forEach((t) => { symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1; });
    const favoriteSymbol = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0];

    const rrTrades = closed.filter((t) => t.entry_price != null && t.exit_price != null && t.stop_loss != null && t.entry_price !== t.stop_loss);
    let avgRR = null;
    if (rrTrades.length) {
      const ratios = rrTrades.map((t) => {
        const risk = Math.abs(t.entry_price - t.stop_loss);
        const reward = Math.abs(t.exit_price - t.entry_price);
        return reward / risk;
      });
      avgRR = Math.round((ratios.reduce((a, v) => a + v, 0) / ratios.length) * 100) / 100;
    }

    let currentStreak = 0;
    let streakType = null;
    for (const t of closed) {
      if (!streakType) { streakType = t.result; currentStreak = 1; }
      else if (t.result === streakType) currentStreak++;
      else break;
    }

    const emotionCounts = {};
    trades.forEach((t) => { if (t.emotion) emotionCounts[t.emotion.toLowerCase()] = (emotionCounts[t.emotion.toLowerCase()] || 0) + 1; });
    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        hasData: true,
        totalTrades,
        closedTrades: closed.length,
        openTrades: totalTrades - closed.length,
        winRate,
        longPct,
        shortPct,
        favoriteSymbol: favoriteSymbol ? { symbol: favoriteSymbol[0], count: favoriteSymbol[1] } : null,
        avgRR,
        rrSampleSize: rrTrades.length,
        currentStreak: streakType ? { type: streakType, count: currentStreak } : null,
        topEmotion: topEmotion ? { emotion: topEmotion[0], count: topEmotion[1] } : null
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
