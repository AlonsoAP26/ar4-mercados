-- AR4 Mercados — Gamificación: rachas, insignias, misiones diarias y donación de puntos
-- Ejecutar en el SQL Editor de Supabase, DESPUES de migration_ranks.sql y migration_community_v2.sql

alter table profiles add column if not exists streak_days integer not null default 0;
alter table profiles add column if not exists last_active_date date;
alter table profiles add column if not exists badges text[] not null default '{}';

-- Progreso de misiones diarias por usuario (se crea una fila por usuario por dia)
create table if not exists daily_missions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  mission_date date not null default current_date,
  posted boolean not null default false,
  votes_count integer not null default 0,
  chat_count integer not null default 0,
  claimed_post boolean not null default false,
  claimed_votes boolean not null default false,
  claimed_chat boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_id, mission_date)
);

-- Registro de donaciones de puntos entre usuarios
create table if not exists point_donations (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references profiles(id) on delete cascade,
  to_profile_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  created_at timestamptz not null default now()
);

-- RLS: igual que el resto del esquema, todas las escrituras pasan por Netlify Functions
-- con la Secret Key (que ignora RLS). Estas tablas son datos semi-privados de progreso,
-- asi que no exponemos lectura publica directa; se sirven a traves de funciones dedicadas.
alter table daily_missions enable row level security;
alter table point_donations enable row level security;
