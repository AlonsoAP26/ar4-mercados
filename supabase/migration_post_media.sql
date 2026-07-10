-- AR4 Mercados — Video/PDF/imagen adjunta en publicaciones del Foro
alter table community_posts add column if not exists media_url text;
alter table community_posts add column if not exists media_type text;

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;
