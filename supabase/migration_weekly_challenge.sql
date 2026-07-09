-- AR4 Mercados — Reto semanal (Weekly Challenge)
-- Ejecutar en el SQL Editor de Supabase, DESPUES de migration_gamification.sql

create table if not exists weekly_challenges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  week_start date not null,
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, week_start)
);

alter table weekly_challenges enable row level security;
-- Sin politica de lectura publica: se sirve via Netlify Function con la Secret Key.
