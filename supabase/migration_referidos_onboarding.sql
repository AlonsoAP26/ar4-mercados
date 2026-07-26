-- AR4 Mercados — Referidos (boletos del sorteo) + checklist de bienvenida
-- Ejecutar en el SQL Editor de Supabase.

-- Quién invitó a este usuario (username público del padrino). Cada perfil
-- referido = 1 boleto extra para el padrino en el sorteo del 25 de octubre.
alter table profiles add column if not exists referred_by_username text;
create index if not exists profiles_referred_by_idx on profiles(referred_by_username);

-- Checklist de bienvenida: cuándo reclamó sus +50 pts (null = aún no).
alter table profiles add column if not exists onboarding_claimed_at timestamptz;
