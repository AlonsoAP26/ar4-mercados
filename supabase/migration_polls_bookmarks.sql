-- AR4 Mercados — Encuestas y guardados en publicaciones del Foro
alter table community_posts add column if not exists poll_options jsonb;
alter table community_posts add column if not exists poll_votes_count integer[];

create table if not exists post_poll_votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  option_index integer not null,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create table if not exists post_bookmarks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, post_id)
);

-- Los votos de encuesta se necesitan agregados (conteos), no fila por fila -> lectura pública
-- de conteos ya la sirve la función; no se expone la tabla de votos directamente.
alter table post_poll_votes enable row level security;
alter table post_bookmarks enable row level security;
