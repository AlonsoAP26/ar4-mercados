-- AR4 Mercados — Hilos en comentarios (respuestas encadenadas)

alter table comments add column if not exists parent_comment_id uuid references comments(id) on delete cascade;
create index if not exists comments_parent_idx on comments (parent_comment_id);
