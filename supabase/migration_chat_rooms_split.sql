-- AR4 Mercados — Separar salas de chat para que coincidan con las categorías del Foro
-- Ejecutar en el SQL Editor de Supabase.

insert into chat_rooms (id, name) values
  ('indices', 'Índices'),
  ('latam', 'LatAm')
on conflict (id) do nothing;

update chat_rooms set name = 'Acciones' where id = 'acciones';
update chat_rooms set name = 'Materias Primas' where id = 'commodities';
