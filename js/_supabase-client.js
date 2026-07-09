(function () {
  if (typeof supabase === 'undefined' || window.AR4_supabase) return;
  const SUPABASE_URL = 'https://gxiybgirkjsqnagcabnz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uqWQ2hoarxuLrKi816sfzw_ngOFppYx';
  window.AR4_supabase = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})();
