const { supabaseRequest } = require('./_supabase');
const { isFlagged } = require('./_moderation');
const { effectiveRank } = require('./_rank');
const { incrementMissionCounter } = require('./_gamification');

const ALLOWED_CATEGORIES = ['Forex', 'LatAm', 'Materias Primas', 'Índices', 'Criptomonedas'];

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const title = (body.title || '').trim().slice(0, 120);
    const text = (body.body || '').trim().slice(0, 2000);
    const category = ALLOWED_CATEGORIES.includes(body.category) ? body.category : 'Forex';
    const symbol = body.symbol ? String(body.symbol).trim().slice(0, 40) : null;

    let pollOptions = null;
    if (Array.isArray(body.pollOptions)) {
      const cleaned = body.pollOptions.map((o) => String(o || '').trim().slice(0, 60)).filter(Boolean);
      if (cleaned.length >= 2 && cleaned.length <= 4) pollOptions = cleaned;
    }

    if (title.length < 8 || text.length < 20) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'El título y el contenido son demasiado cortos.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points,rank', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];
    const isPremiumPaid = !!(user.app_metadata && user.app_metadata.premium);
    const rank = effectiveRank(profile.rank, isPremiumPaid);

    if (rank === 'basico') {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const todayPosts = await supabaseRequest(
        'community_posts?profile_id=eq.' + profile.id + '&created_at=gte.' + since + '&select=id',
        { method: 'GET' }
      );
      if (todayPosts.length >= 1) {
        return { statusCode: 429, body: JSON.stringify({ success: false, error: 'Los usuarios de rango Básico pueden publicar 1 idea cada 24 horas. Sube a VIP para publicar sin límite.' }) };
      }
    }

    if (await isFlagged(title + '\n' + text)) {
      return { statusCode: 422, body: JSON.stringify({ success: false, error: 'Tu publicación no pasó la revisión automática (posible spam, promesas de rentabilidad garantizada o lenguaje inapropiado). Ajústala e inténtalo de nuevo.' }) };
    }

    const created = await supabaseRequest('community_posts', {
      method: 'POST',
      body: JSON.stringify({
        profile_id: profile.id,
        category,
        title,
        body: text,
        symbol,
        poll_options: pollOptions,
        poll_votes_count: pollOptions ? pollOptions.map(() => 0) : null
      })
    });

    await supabaseRequest('points_ledger', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profile.id, amount: 10, reason: 'post_created' })
    });
    await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ points: (profile.points || 0) + 10 })
    });

    await incrementMissionCounter(profile.id, 'posted');

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, post: created[0] }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
