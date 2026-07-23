-- AR4 Mercados — Notificaciones push del navegador (Web Push)
-- Guarda a quién hay que avisar cuando sale un Flash importante.
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- URL única que el navegador entrega al suscribirse. Es la identidad de la
  -- suscripción: si el usuario reinstala, cambia, y la vieja queda muerta.
  endpoint text not null unique,
  -- Claves de cifrado del navegador (parte del estándar Web Push).
  p256dh text not null,
  auth text not null,
  -- Opcional: si estaba con sesión iniciada, para poder segmentar más adelante.
  user_id uuid references profiles(id) on delete set null,
  user_agent text,
  created_at timestamptz not null default now(),
  -- Última vez que el envío funcionó. Sirve para limpiar suscripciones muertas.
  last_ok_at timestamptz,
  fallos int not null default 0
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;
-- Sin acceso público: solo se escribe y se lee desde Netlify Functions y desde
-- el script de envío, ambos con la clave de servicio (mismo patrón que
-- notifications y dm_threads).
