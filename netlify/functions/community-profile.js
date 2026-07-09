const { supabaseRequest } = require('./_supabase');

const AVATAR_COLORS = ['#f0c75e', '#7aa8ff', '#4fd18a', '#ff8a5c', '#f7931a', '#e2001a', '#22c07a'];

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };
  }

  try {
    if (event.httpMethod === 'GET') {
      const rows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=*', { method: 'GET' });
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: rows[0] || null }) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const username = (body.username || '').trim().slice(0, 24);
      const bio = (body.bio || '').trim().slice(0, 160);

      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El nombre de usuario debe tener 3-24 caracteres: letras, números o guion bajo.' }) };
      }

      const existing = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });

      if (existing.length > 0) {
        const updated = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub), {
          method: 'PATCH',
          body: JSON.stringify({ username, bio })
        });
        return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: updated[0] }) };
      }

      const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      let created;
      try {
        created = await supabaseRequest('profiles', {
          method: 'POST',
          body: JSON.stringify({ netlify_user_id: user.sub, username, bio, avatar_color: color })
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

      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, profile: { ...created[0], points: 20 } }) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
