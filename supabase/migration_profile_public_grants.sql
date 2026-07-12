-- AR4 Mercados — Otorgar lectura pública a columnas de perfil que faltaban
-- (badges, social_links y streak_days nunca se hicieron públicas al agregarlas,
-- lo cual rompía la nueva página de perfil público al consultar a otros usuarios).
-- Ejecutar en el SQL Editor de Supabase.

grant select (badges, social_links, streak_days) on public.profiles to anon;
