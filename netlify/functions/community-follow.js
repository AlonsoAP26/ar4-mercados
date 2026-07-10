const { supabaseRequest } = require('./_supabase');

exports.handler = async (event, context) => {
  const user = context.clientContext && context.clientContext.user;

  try {
    if (event.httpMethod === 'GET') {
      const targetId = (event.queryStringParameters || {}).profileId;
      if (!targetId) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Falta profileId.' }) };

      const [followers, following] = await Promise.all([
        supabaseRequest('follows?following_id=eq.' + targetId + '&select=id', { method: 'GET' }),
        supabaseRequest('follows?follower_id=eq.' + targetId + '&select=id', { method: 'GET' })
      ]);

      let amIFollowing = false;
      if (user) {
        const myProfile = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
        if (myProfile.length) {
          const rel = await supabaseRequest(
            'follows?follower_id=eq.' + myProfile[0].id + '&following_id=eq.' + targetId + '&select=id',
            { method: 'GET' }
          );
          amIFollowing = rel.length > 0;
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, followersCount: followers.length, followingCount: following.length, amIFollowing })
      };
    }

    if (event.httpMethod === 'POST') {
      if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

      const body = JSON.parse(event.body || '{}');
      const targetId = body.targetProfileId;
      const action = body.action;
      if (!targetId || !['follow', 'unfollow'].includes(action)) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Parámetros inválidos.' }) };
      }

      const myProfileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id', { method: 'GET' });
      if (!myProfileRows.length) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
      }
      const myProfile = myProfileRows[0];

      if (myProfile.id === targetId) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: 'No puedes seguirte a ti mismo.' }) };
      }

      if (action === 'follow') {
        try {
          await supabaseRequest('follows', {
            method: 'POST',
            body: JSON.stringify({ follower_id: myProfile.id, following_id: targetId })
          });
          await supabaseRequest('notifications', {
            method: 'POST',
            body: JSON.stringify({ profile_id: targetId, type: 'follow', actor_profile_id: myProfile.id })
          });
        } catch (e) {
          if (e.statusCode !== 409) throw e;
        }
      } else {
        await supabaseRequest('follows?follower_id=eq.' + myProfile.id + '&following_id=eq.' + targetId, { method: 'DELETE' });
      }

      const followers = await supabaseRequest('follows?following_id=eq.' + targetId + '&select=id', { method: 'GET' });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, following: action === 'follow', followersCount: followers.length })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
