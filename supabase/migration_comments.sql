-- AR4 Mercados — Comentarios en Ideas, Noticias y publicaciones del Foro
-- target_type: 'idea' o 'noticia' usan el slug del artículo como target_id;
-- 'post' usa el uuid de community_posts como target_id.

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('idea', 'noticia', 'post')),
  target_id text not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_target_idx on comments (target_type, target_id, created_at);

alter table comments enable row level security;
create policy "comments_public_read" on comments for select using (not flagged);
