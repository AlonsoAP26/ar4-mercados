// AR4 Mercados — Gestión de diplomas (solo dueño del sitio).
// GET: lista perfiles con sus módulos completados (= diplomas emitidos).
// POST { action: 'revoke'|'grant', profileId, slug }: quita o añade un módulo
// completado a un perfil (edición manual de diplomas desde el panel admin).
const { supabaseRequest } = require('./_supabase');

const VALID_SLUGS = new Set([
  'que-es-el-trading','tipos-de-mercados-y-activos','como-funciona-un-broker','el-spread-y-los-costos','apalancamiento-y-margen','pips-lotes-y-valor','plataformas-y-tipos-de-orden','velas-japonesas','patrones-de-velas-basicos','demo-antes-que-real',
  'soporte-y-resistencia','tendencias-y-estructura-de-mercado','lineas-de-tendencia-y-canales','medias-moviles-a-fondo','rsi-y-divergencias','macd-y-momentum','indicadores-basicos','figuras-geometricas-chartismo','fibonacci-retrocesos','gestion-de-riesgo-tamano-posicion',
  'ratio-riesgo-beneficio','multiples-temporalidades','volumen-y-order-flow','smart-money-concepts-intro','price-action-sin-indicadores','correlaciones-y-diversificacion','sesiones-de-mercado-horarios','plan-de-trading-y-bitacora','psicologia-del-trading-introduccion','backtesting-y-mejora-continua',
  'mesa-institucional-como-opera','microestructura-libro-de-ordenes','liquidez-institucional-stop-hunts','order-blocks-validacion','fair-value-gaps-ineficiencias','estructura-avanzada-bos-choch','volume-profile-poc-va','market-profile-subastas','vwap-institucional','order-flow-delta-lectura',
  'informe-cot-posicionamiento','sesiones-killzones-liquidez','intermercado-dxy-bonos','macro-tasas-flujos','riesgo-institucional-var-correlacion','ejecucion-profesional-twap-vwap','dark-pools-bloques','opciones-gamma-dealers','backtesting-walk-forward','proceso-desk-playbook-metricas'
]);

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event, context) => {
  const ownerEmail = (process.env.OWNER_EMAIL || '').toLowerCase().trim();
  const user = context.clientContext && context.clientContext.user;
  if (!user) return json(401, { success: false, error: 'Debes iniciar sesión.' });
  if (!ownerEmail || (user.email || '').toLowerCase().trim() !== ownerEmail) {
    return json(403, { success: false, error: 'Esta sección es solo para el dueño del sitio.' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const rows = await supabaseRequest('profiles?select=id,username,rank,points,completed_modules&order=points.desc&limit=500', { method: 'GET' });
      const profiles = (rows || [])
        .map((p) => ({ id: p.id, username: p.username, rank: p.rank, points: p.points, modules: p.completed_modules || [] }))
        .sort((a, b) => b.modules.length - a.modules.length);
      return json(200, { success: true, profiles });
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { action, profileId, slug } = body;
      if (!profileId || !slug || !VALID_SLUGS.has(slug)) return json(400, { success: false, error: 'Datos inválidos.' });
      const rows = await supabaseRequest('profiles?id=eq.' + encodeURIComponent(profileId) + '&select=id,completed_modules', { method: 'GET' });
      if (!rows.length) return json(404, { success: false, error: 'Perfil no encontrado.' });
      let mods = rows[0].completed_modules || [];
      if (action === 'revoke') mods = mods.filter((s) => s !== slug);
      else if (action === 'grant') { if (!mods.includes(slug)) mods = [...mods, slug]; }
      else return json(400, { success: false, error: 'Acción inválida.' });
      await supabaseRequest('profiles?id=eq.' + encodeURIComponent(profileId), {
        method: 'PATCH',
        body: JSON.stringify({ completed_modules: mods })
      });
      return json(200, { success: true, modules: mods });
    }

    return json(405, { success: false, error: 'Método no permitido.' });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};
