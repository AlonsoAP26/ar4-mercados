const { supabaseRequest } = require('./_supabase');

const MAX_ITEMS = 25;

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];

    if (event.httpMethod === 'GET') {
      const items = await supabaseRequest('watchlists?profile_id=eq.' + profile.id + '&select=*&order=created_at.asc', { method: 'GET' });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, items, profileId: profile.id }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (body.action === 'remove') {
        const symbol = (body.symbol || '').trim();
        if (!symbol) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el símbolo.' }) };
        await supabaseRequest('watchlists?profile_id=eq.' + profile.id + '&symbol=eq.' + encodeURIComponent(symbol), { method: 'DELETE' });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
      }

      const symbol = (body.symbol || '').trim().slice(0, 40);
      const label = (body.label || '').trim().slice(0, 40) || symbol;
      if (!symbol) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta el símbolo.' }) };

      const existing = await supabaseRequest('watchlists?profile_id=eq.' + profile.id + '&select=id', { method: 'GET' });
      if (existing.length >= MAX_ITEMS) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: `Tu watchlist ya tiene el máximo de ${MAX_ITEMS} instrumentos.` }) };
      }

      try {
        await supabaseRequest('watchlists', {
          method: 'POST',
          body: JSON.stringify({ profile_id: profile.id, symbol, label })
        });
      } catch (e) {
        if (e.statusCode === 409) {
          return { statusCode: 409, body: JSON.stringify({ success: false, error: 'Ese instrumento ya está en tu watchlist.' }) };
        }
        throw e;
      }

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
