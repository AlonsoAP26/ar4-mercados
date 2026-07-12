-- AR4 Mercados — Colección de Avatares Exclusivos (500 piezas) + fotos personalizadas
-- Ejecutar en el SQL Editor de Supabase

create table avatar_catalog (
  id uuid primary key default gen_random_uuid(),
  seq integer not null unique,
  name text not null,
  rarity text not null check (rarity in ('comun', 'raro', 'legendario')),
  svg_markup text not null,
  price_points integer,
  price_soles numeric(6,2),
  created_at timestamptz not null default now()
);

alter table avatar_catalog enable row level security;
create policy "avatar_catalog_public_read" on avatar_catalog for select using (true);
grant select on avatar_catalog to anon, authenticated;

create table avatar_catalog_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  catalog_id uuid not null references avatar_catalog(id) on delete cascade,
  method text not null check (method in ('points', 'soles')),
  amount_points integer,
  amount_soles numeric(6,2),
  mercadopago_payment_id text,
  created_at timestamptz not null default now(),
  unique (profile_id, catalog_id)
);

alter table avatar_catalog_purchases enable row level security;
-- Sin politica de lectura publica: solo se consulta via Secret Key (Netlify Functions).

insert into storage.buckets (id, name, public)
values ('avatar-uploads', 'avatar-uploads', true)
on conflict (id) do nothing;
