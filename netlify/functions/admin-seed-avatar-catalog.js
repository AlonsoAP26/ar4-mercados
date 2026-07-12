const { supabaseRequest } = require('./_supabase');
const { generateAll } = require('./_avatar-catalog-gen');

// Función de un solo uso: siembra los 500 avatares de la colección.
// Es segura de visitar más de una vez: si la tabla ya tiene filas, no hace nada.
exports.handler = async (event, context) => {
  try {
    const existing = await supabaseRequest('avatar_catalog?select=seq&limit=1', { method: 'GET' });
    if (existing.length) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, alreadySeeded: true }) };
    }

    const all = generateAll();
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < all.length; i += batchSize) {
      const batch = all.slice(i, i + batchSize).map((a) => ({
        seq: a.seq,
        name: a.name,
        rarity: a.rarity,
        svg_markup: a.svg,
        price_points: a.pricePoints,
        price_soles: a.priceSoles
      }));
      await supabaseRequest('avatar_catalog', { method: 'POST', body: JSON.stringify(batch) });
      inserted += batch.length;
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, inserted }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.detail) || e.message || e) }) };
  }
};
