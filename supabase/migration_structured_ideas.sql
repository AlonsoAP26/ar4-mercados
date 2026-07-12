-- AR4 Mercados — Formato estructurado de Idea de Trading dentro de Comunidad
-- Ejecutar en el SQL Editor de Supabase

alter table community_posts add column if not exists is_structured_idea boolean not null default false;
alter table community_posts add column if not exists idea_direction text check (idea_direction in ('long', 'short'));
alter table community_posts add column if not exists idea_entry numeric(14,5);
alter table community_posts add column if not exists idea_sl numeric(14,5);
alter table community_posts add column if not exists idea_tp numeric(14,5);
alter table community_posts add column if not exists idea_rr numeric(6,2);
alter table community_posts add column if not exists idea_timeframe text;
alter table community_posts add column if not exists idea_status text not null default 'abierta' check (idea_status in ('abierta', 'ganadora', 'perdedora', 'cancelada'));
alter table community_posts add column if not exists idea_status_updated_at timestamptz;
