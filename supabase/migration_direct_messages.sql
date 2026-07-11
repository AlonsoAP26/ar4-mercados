-- AR4 Mercados — Mensajes privados (DMs) entre usuarios
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists dm_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references profiles(id) on delete cascade,
  participant_b uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint dm_threads_ordered check (participant_a < participant_b),
  unique (participant_a, participant_b)
);

create index if not exists dm_threads_a_idx on dm_threads (participant_a, last_message_at desc);
create index if not exists dm_threads_b_idx on dm_threads (participant_b, last_message_at desc);

create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references dm_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text,
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists dm_messages_thread_idx on dm_messages (thread_id, created_at asc);

create table if not exists blocked_users (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table dm_threads enable row level security;
alter table dm_messages enable row level security;
alter table blocked_users enable row level security;
-- Sin lectura pública: son datos privados, se sirven exclusivamente via Netlify Functions
-- (igual patrón que "notifications"), que validan la identidad con Netlify Identity.
