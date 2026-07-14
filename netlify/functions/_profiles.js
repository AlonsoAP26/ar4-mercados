// AR4 Mercados — Helper para asegurar que cada usuario registrado tenga un
// perfil de comunidad en Supabase. Así el contador "Traders registrados"
// crece con cada registro real (antes solo se creaba si el usuario editaba
// su perfil manualmente).
const { supabaseRequest } = require('./_supabase');

const COLORS = ['#7aa8ff', '#e13a4b', '#2ecc71', '#d4af37', '#9b59b6', '#e67e22', '#1abc9c', '#f39c12', '#3498db', '#e84393'];

function baseUsername(user) {
  const meta = (user && user.user_metadata) || {};
  let s = meta.full_name || meta.name || ((user && user.email) || '').split('@')[0] || 'trader';
  try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
  s = s.replace(/[^a-zA-Z0-9_]/g, '');
  if (s.length < 3) s = 'trader' + s;
  return s.slice(0, 18) || 'trader';
}

async function usernameTaken(u) {
  const rows = await supabaseRequest('profiles?username=eq.' + encodeURIComponent(u) + '&select=id', { method: 'GET' });
  return Array.isArray(rows) && rows.length > 0;
}

// Crea el perfil si no existe. Idempotente. Devuelve { created, username }.
async function ensureProfile(user) {
  const id = (user && (user.id || user.sub)) || null;
  if (!id) return { created: false, reason: 'no-id' };

  const existing = await supabaseRequest('profiles?netlify_user_id=eq.' + encodeURIComponent(id) + '&select=id', { method: 'GET' });
  if (Array.isArray(existing) && existing.length) return { created: false, reason: 'exists' };

  const base = baseUsername(user);
  let username = base;
  let tries = 0;
  while (tries < 6 && await usernameTaken(username)) {
    username = base.slice(0, 14) + Math.floor(1000 + Math.random() * 9000);
    tries++;
  }
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const created = await supabaseRequest('profiles', {
    method: 'POST',
    body: JSON.stringify({ netlify_user_id: id, username: username, bio: '', avatar_color: color })
  });
  return { created: true, username: username, id: (created && created[0] && created[0].id) || null };
}

module.exports = { ensureProfile };
