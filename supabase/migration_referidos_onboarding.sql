-- AR4 Mercados — Referidos (boletos del sorteo) + checklist de bienvenida
-- Ejecutar en el SQL Editor de Supabase.

-- Quién invitó a este usuario. Se guarda el ID del padrino (no su username):
-- los usernames se pueden renombrar y contarían boletos mal o los perderían.
alter table profiles add column if not exists referred_by_profile_id uuid references profiles(id);
create index if not exists profiles_referred_by_id_idx on profiles(referred_by_profile_id);

-- Checklist de bienvenida: cuándo reclamó sus +50 pts (null = aún no).
alter table profiles add column if not exists onboarding_claimed_at timestamptz;
