-- AR4 Mercados — Pulso de Sentimiento de la Comunidad
alter table community_posts add column if not exists sentiment text check (sentiment in ('alcista', 'bajista', 'neutral'));
