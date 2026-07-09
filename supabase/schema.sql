-- AR4 Mercados — Esquema de Comunidad
-- Ejecutar completo en el SQL Editor de Supabase

create extension if not exists "pgcrypto";

-- Perfiles de usuario, vinculados al usuario de Netlify Identity (no se usa Supabase Auth)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  netlify_user_id text unique not null,
  username text unique not null,
  avatar_color text not null default '#d4af37',
  bio text,
  points integer not null default 0,
  created_at timestamptz not null default now()
);

-- Ideas/publicaciones de la comunidad (distintas de las Ideas oficiales de AR4)
create table community_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  symbol text,
  upvotes integer not null default 0,
  created_at timestamptz not null default now()
);

-- Registro de votos para evitar votos duplicados
create table post_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

-- Historial de puntos (auditoría, no se expone directo al cliente)
create table points_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Salas de chat
create table chat_rooms (
  id text primary key,
  name text not null
);
insert into chat_rooms (id, name) values
  ('forex', 'Forex'),
  ('acciones', 'Acciones e Índices'),
  ('cripto', 'Criptomonedas');

-- Mensajes de chat
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references chat_rooms(id),
  profile_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row Level Security: todas las escrituras pasan por Netlify Functions con la Secret Key
-- (que ignora RLS), así que aquí solo habilitamos LECTURA pública.
alter table profiles enable row level security;
alter table community_posts enable row level security;
alter table post_votes enable row level security;
alter table points_ledger enable row level security;
alter table chat_rooms enable row level security;
alter table chat_messages enable row level security;

create policy "profiles_public_read" on profiles for select using (true);
create policy "posts_public_read" on community_posts for select using (true);
create policy "rooms_public_read" on chat_rooms for select using (true);
create policy "messages_public_read" on chat_messages for select using (not flagged);

-- post_votes y points_ledger quedan sin política de lectura pública (solo accesibles vía Secret Key).

-- Habilitar Realtime para el chat
alter publication supabase_realtime add table chat_messages;
