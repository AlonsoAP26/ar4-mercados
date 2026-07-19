const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');
const {
  MODULE_POINTS, PREMIUM_MODULE_POINTS, APROBADO_MIN,
  getIdentity, identityGetUser, identityUpdateAppMeta
} = require('./_diplomas');

// Completar módulos y registrar notas de cuestionario.
// POST { slug, correct, total, scoreOnly }
//  - Con scoreOnly: solo registra la nota (0-100) en app_metadata.quiz_scores.
//  - Sin scoreOnly: marca el módulo como completado (+ puntos). Requiere haber
//    rendido el cuestionario antes (nota registrada) — el diploma del programa
//    se calcula con esas notas, así que no hay completado sin evaluación.
// Regla de nota: se conserva la primera nota aprobatoria (>= APROBADO_MIN);
// mientras la nota sea menor, cada nuevo intento la reemplaza (recuperación).
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const slug = (body.slug || '').trim();
    let reward = MODULE_POINTS[slug];
    if (!reward && PREMIUM_MODULE_POINTS[slug]) {
      // Módulo de la ruta institucional: exige Premium activo en el servidor.
      const am = user.app_metadata || {};
      const isPremium = !!(am.premium && (!am.premium_until || new Date(am.premium_until).getTime() > Date.now()));
      if (!isPremium) return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Este módulo pertenece a la ruta institucional Premium.' }) };
      reward = PREMIUM_MODULE_POINTS[slug];
    }
    if (!reward) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Módulo inválido.' }) };

    // --- Nota del cuestionario (si viene en la petición) ---
    const identity = getIdentity(context);
    let scores = {};
    if (identity) {
      try {
        const fresh = await identityGetUser(identity, user.sub);
        scores = (fresh.app_metadata && fresh.app_metadata.quiz_scores) || {};
      } catch (e) { scores = (user.app_metadata && user.app_metadata.quiz_scores) || {}; }
    }
    const correct = Number(body.correct), total = Number(body.total);
    if (Number.isFinite(correct) && Number.isFinite(total) && total >= 3 && total <= 15 && correct >= 0 && correct <= total) {
      const pct = Math.round((correct / total) * 100);
      const prev = scores[slug];
      if (identity && (typeof prev !== 'number' || prev < APROBADO_MIN)) {
        scores = { ...scores, [slug]: pct };
        await identityUpdateAppMeta(identity, user.sub, { quiz_scores: scores });
      }
    }
    const nota = typeof scores[slug] === 'number' ? scores[slug] : null;

    if (body.scoreOnly) {
      return {
        statusCode: 200, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, nota, aprobada: nota != null && nota >= APROBADO_MIN })
      };
    }

    if (nota == null) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero rinde el cuestionario del módulo: tu nota cuenta para el diploma del programa.' }) };
    }

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points,completed_modules', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];
    const completed = profile.completed_modules || [];

    if (completed.includes(slug)) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadyCompleted: true, points: profile.points, nota }) };
    }

    const newTotal = await awardPoints(profile.id, profile.points, reward, 'module_completed_' + slug);
    const updatedModules = [...completed, slug];
    await supabaseRequest('profiles?id=eq.' + profile.id, {
      method: 'PATCH',
      body: JSON.stringify({ completed_modules: updatedModules })
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, alreadyCompleted: false, reward, points: newTotal, completedModules: updatedModules, nota })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
