-- AR4 Mercados — Migración: separar sala de Commodities
-- Ejecutar en el SQL Editor de Supabase

insert into chat_rooms (id, name) values ('commodities', 'Commodities')
on conflict (id) do nothing;

update chat_rooms set name = 'Acciones e Índices' where id = 'acciones';
