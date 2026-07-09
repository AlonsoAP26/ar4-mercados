-- AR4 Mercados — Migración: tienda de avatares
-- Ejecutar en el SQL Editor de Supabase

alter table profiles add column avatar_url text;

create table avatar_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  avatar_id text not null,
  amount_soles numeric(6,2) not null default 0,
  culqi_charge_id text,
  created_at timestamptz not null default now(),
  unique (profile_id, avatar_id)
);

alter table avatar_purchases enable row level security;
-- Sin politica de lectura publica: solo se consulta via Secret Key (Netlify Functions).

-- avatar_url ya quedo incluido en la lista de columnas publicas de profiles
-- (profiles_public_read via el GRANT de migration_community_v2.sql cubre toda la fila,
--  y avatar_url no es informacion sensible, asi que se agrega al grant explicito).
grant select (id, netlify_user_id, username, avatar_color, avatar_url, bio, points, rank, trading_style, created_at) on profiles to anon, authenticated;
