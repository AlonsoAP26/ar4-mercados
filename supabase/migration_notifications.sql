-- AR4 Mercados — Notificaciones (nuevo seguidor, mención, respuesta)

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('follow', 'mention', 'reply')),
  actor_profile_id uuid references profiles(id) on delete set null,
  post_id uuid references community_posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_profile_idx on notifications (profile_id, created_at desc);

alter table notifications enable row level security;
-- Sin lectura pública: son datos privados del destinatario, se sirven via Netlify Function.
