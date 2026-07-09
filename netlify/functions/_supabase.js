async function supabaseRequest(path, options) {
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase no está configurado (faltan SUPABASE_KEY o SUPABASE_SECRET_KEY)');

  const res = await fetch(url + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options && options.headers)
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error('Error de Supabase: ' + (data && data.message ? data.message : res.status));
    err.detail = data;
    err.statusCode = res.status;
    throw err;
  }
  return data;
}

module.exports = { supabaseRequest };
