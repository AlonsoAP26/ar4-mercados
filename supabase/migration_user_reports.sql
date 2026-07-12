-- AR4 Mercados — Reportar perfiles de usuario
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_id)
);

alter table user_reports enable row level security;
-- Sin lectura pública: solo se sirve via Netlify Function (mismo patrón que dm_threads/notifications).
