const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

const DIRECTIONS = ['long', 'short'];
const RESULTS = ['ganadora', 'perdedora', 'abierta'];
const JOURNAL_ENTRY_REWARD = 2;

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if (event.httpMethod === 'GET') {
      const entries = await supabaseRequest(
        'trade_journal?profile_id=eq.' + profile.id + '&select=*&order=created_at.desc&limit=50',
        { method: 'GET' }
      );
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, entries }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const symbol = (body.symbol || '').trim().slice(0, 40);
      const direction = DIRECTIONS.includes(body.direction) ? body.direction : null;
      const result = RESULTS.includes(body.result) ? body.result : 'abierta';
      const notes = (body.notes || '').trim().slice(0, 1000);
      const emotion = (body.emotion || '').trim().slice(0, 40);
      const entryPrice = body.entryPrice !== undefined && body.entryPrice !== '' ? parseFloat(body.entryPrice) : null;
      const exitPrice = body.exitPrice !== undefined && body.exitPrice !== '' ? parseFloat(body.exitPrice) : null;
      const stopLoss = body.stopLoss !== undefined && body.stopLoss !== '' ? parseFloat(body.stopLoss) : null;
      const takeProfit = body.takeProfit !== undefined && body.takeProfit !== '' ? parseFloat(body.takeProfit) : null;

      if (!symbol) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Indica el instrumento operado.' }) };
      if (!direction) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'La dirección debe ser long o short.' }) };

      const created = await supabaseRequest('trade_journal', {
        method: 'POST',
        body: JSON.stringify({
          profile_id: profile.id,
          symbol,
          direction,
          entry_price: entryPrice,
          exit_price: exitPrice,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          result,
          emotion: emotion || null,
          notes: notes || null
        })
      });

      const newTotal = await awardPoints(profile.id, profile.points, JOURNAL_ENTRY_REWARD, 'journal_entry');

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, entry: created[0], points: newTotal }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
