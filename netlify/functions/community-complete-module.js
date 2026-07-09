const { supabaseRequest } = require('./_supabase');
const { awardPoints } = require('./_gamification');

// Espejo de data/educacion.json (slug -> puntos), para no confiar en el valor que mande el cliente.
const MODULE_POINTS = {
  'que-es-el-trading': 10,
  'tipos-de-mercados-y-activos': 10,
  'velas-japonesas': 10,
  'patrones-de-velas-basicos': 10,
  'soporte-y-resistencia': 15,
  'tendencias-y-estructura-de-mercado': 15,
  'indicadores-basicos': 15,
  'figuras-geometricas-chartismo': 15,
  'gestion-de-riesgo-tamano-posicion': 15,
  'volumen-y-order-flow': 20,
  'plan-de-trading-y-bitacora': 20,
  'psicologia-del-trading-introduccion': 20
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const user = context.clientContext && context.clientContext.user;
  if (!user) return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Debes iniciar sesión.' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const slug = (body.slug || '').trim();
    const reward = MODULE_POINTS[slug];
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
