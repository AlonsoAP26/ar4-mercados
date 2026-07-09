-- AR4 Mercados — Watchlists colaborativas (públicas, compartibles por enlace)
create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  label text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, symbol)
);

alter table watchlists enable row level security;
create policy "watchlists_public_read" on watchlists for select using (true);
