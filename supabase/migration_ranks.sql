-- AR4 Mercados — Migración: sistema de rangos
-- Ejecutar en el SQL Editor de Supabase, DESPUÉS de schema.sql

alter table profiles add column rank text not null default 'basico'
  check (rank in ('basico', 'vip', 'premium', 'elite', 'administrador'));

insert into chat_rooms (id, name) values ('elite', 'Elite Traders')
  on conflict (id) do nothing;

-- La sala 'elite' deja de ser de lectura publica: solo se sirve via
-- la funcion community-chat-elite-messages.js (verificacion de rango + Secret Key).
drop policy if exists "messages_public_read" on chat_messages;
create policy "messages_public_read" on chat_messages
  for select using (not flagged and room_id <> 'elite');
