-- AR4 Mercados — Migración: imágenes en el chat
-- Ejecutar en el SQL Editor de Supabase

alter table chat_messages add column image_url text;

insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;
