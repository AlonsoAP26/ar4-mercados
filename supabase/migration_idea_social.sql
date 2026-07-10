-- AR4 Mercados — Interacción social en Ideas y Noticias
-- Reacciones y guardados genéricos (idea/noticia), likes/edición/borrado/reporte de comentarios, imágenes en comentarios.

create table if not exists target_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('idea', 'noticia')),
  target_id text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, profile_id, emoji)
);
create index if not exists target_reactions_idx on target_reactions (target_type, target_id);
alter table target_reactions enable row level security;
create policy "target_reactions_public_read" on target_reactions for select using (true);

create table if not exists target_bookmarks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  target_type text not null check (target_type in ('idea', 'noticia')),
  target_id text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, target_type, target_id)
);
alter table target_bookmarks enable row level security;

create table if not exists comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, profile_id)
);
alter table comment_likes enable row level security;
create policy "comment_likes_public_read" on comment_likes for select using (true);

alter table comments add column if not exists image_url text;
alter table comments add column if not exists edited_at timestamptz;
alter table comments add column if not exists reported_count integer not null default 0;

insert into storage.buckets (id, name, public)
values ('comment-images', 'comment-images', true)
on conflict (id) do nothing;
