-- AR4 Mercados — Redes sociales opcionales en el perfil de comunidad
alter table profiles add column if not exists social_links jsonb not null default '{}';
