const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

// Espejo de data/educacion.json (slug -> puntos), para no confiar en el valor que mande el cliente.
const MODULE_POINTS = {
  // Básico (1-10)
  'que-es-el-trading': 10,
  'tipos-de-mercados-y-activos': 10,
  'como-funciona-un-broker': 10,
  'el-spread-y-los-costos': 10,
  'apalancamiento-y-margen': 10,
  'pips-lotes-y-valor': 10,
  'plataformas-y-tipos-de-orden': 10,
  'velas-japonesas': 10,
  'patrones-de-velas-basicos': 10,
  'demo-antes-que-real': 10,
  // Intermedio (11-20)
  'soporte-y-resistencia': 15,
  'tendencias-y-estructura-de-mercado': 15,
  'lineas-de-tendencia-y-canales': 15,
  'medias-moviles-a-fondo': 15,
  'rsi-y-divergencias': 15,
  'macd-y-momentum': 15,
  'indicadores-basicos': 15,
  'figuras-geometricas-chartismo': 15,
  'fibonacci-retrocesos': 15,
  'gestion-de-riesgo-tamano-posicion': 15,
  // Avanzado (21-30)
  'ratio-riesgo-beneficio': 20,
  'multiples-temporalidades': 20,
  'volumen-y-order-flow': 20,
  'smart-money-concepts-intro': 20,
  'price-action-sin-indicadores': 20,
  'correlaciones-y-diversificacion': 20,
  'sesiones-de-mercado-horarios': 20,
  'plan-de-trading-y-bitacora': 20,
  'psicologia-del-trading-introduccion': 20,
  'backtesting-y-mejora-continua': 20
};

// Espejo de data/educacion-premium.json — ruta institucional, requiere Premium activo.
const PREMIUM_MODULE_POINTS = {
  'mesa-institucional-como-opera': 30,
  'microestructura-libro-de-ordenes': 30,
  'liquidez-institucional-stop-hunts': 30,
  'order-blocks-validacion': 30,
  'fair-value-gaps-ineficiencias': 30,
  'estructura-avanzada-bos-choch': 30,
  'volume-profile-poc-va': 30,
  'market-profile-subastas': 30,
  'vwap-institucional': 30,
  'order-flow-delta-lectura': 30,
  'informe-cot-posicionamiento': 30,
  'sesiones-killzones-liquidez': 30,
  'intermercado-dxy-bonos': 30,
  'macro-tasas-flujos': 30,
  'riesgo-institucional-var-correlacion': 30,
  'ejecucion-profesional-twap-vwap': 30,
  'dark-pools-bloques': 30,
  'opciones-gamma-dealers': 30,
  'backtesting-walk-forward': 30,
  'proceso-desk-playbook-metricas': 30
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const slug = (body.slug || '').trim();
    let reward = MODULE_POINTS[slug];
    if (!reward && PREMIUM_MODULE_POINTS[slug]) {
      // Módulo de la ruta institucional: exige Premium activo en el servidor,
      // para que el diploma y los puntos solo se otorguen a quien tiene acceso real.
      const isPremium = !!(user.app_metadata && user.app_metadata.premium);
      if (!isPremium) return { statusCode: 403, body: JSON.stringify({ success: false, error: 'Este módulo pertenece a la ruta institucional Premium.' }) };
      reward = PREMIUM_MODULE_POINTS[slug];
    }
    if (!reward) return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Módulo inválido.' }) };

    const profileRows = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(user.sub) + '&select=id,points,completed_modules', { method: 'GET' });
    if (!profileRows.length) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Primero crea tu perfil de comunidad.' }) };
    }
    const profile = profileRows[0];
    const completed = profile.completed_modules || [];

    if (completed.includes(slug)) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadyCompleted: true, points: profile.points }) };
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
      body: JSON.stringify({ success: true, alreadyCompleted: false, reward, points: newTotal, completedModules: updatedModules })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};
