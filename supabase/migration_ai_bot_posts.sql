-- AR4 Mercados — Cuenta 'IA AR4' transparente para publicaciones automáticas en el Foro
insert into profiles (netlify_user_id, username, avatar_color, bio, points)
values ('ar4-ai-system-bot', 'IA AR4', '#4f8cff', 'Cuenta oficial de contenido generado automáticamente por inteligencia artificial. Cada publicación está claramente etiquetada como tal.', 0)
on conflict (netlify_user_id) do nothing;

alter table community_posts add column if not exists is_ai_generated boolean not null default false;
