-- AR4 Mercados — Sistema de seguidores (follow)

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table follows enable row level security;
create policy "follows_public_read" on follows for select using (true);
-- Escrituras solo via Netlify Function (Secret Key).
