-- AR4 Mercados — Migración: reacciones + personalización de perfil
-- Ejecutar en el SQL Editor de Supabase, DESPUÉS de migration_ranks.sql

alter table profiles add column trading_style text;
alter table profiles add column phone text;

-- El telefono es dato sensible: aunque la fila es de lectura publica (RLS),
-- se revoca el acceso a esa columna especifica para las claves publicas.
-- Solo las Netlify Functions (Secret Key, que ignora estos permisos) pueden leerlo/escribirlo.
revoke select on profiles from anon, authenticated;
grant select (id, netlify_user_id, username, avatar_color, bio, points, rank, trading_style, created_at) on profiles to anon, authenticated;

create table post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references community_posts(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '🚀', '💡', '🤔')),
  created_at timestamptz not null default now(),
  unique (post_id, profile_id, emoji)
);

alter table post_reactions enable row level security;
create policy "reactions_public_read" on post_reactions for select using (true);
