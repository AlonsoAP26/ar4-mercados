-- AR4 Mercados — Testimonios reales para la página "Sobre Nosotros"
-- Ejecutar en el SQL Editor de Supabase.
-- La página los carga solo si approved = true. No se siembran testimonios falsos:
-- se agregan a mano a medida que usuarios reales compartan su experiencia.

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  time_using text,          -- ej. "3 meses usando AR4"
  comment text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  avatar_color text default '#d4af37',
  avatar_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;
create policy "testimonials_public_read_approved" on testimonials
  for select using (approved = true);
grant select on testimonials to anon, authenticated;

-- Para agregar un testimonio real más adelante, ejemplo:
-- insert into testimonials (name, country, time_using, comment, rating, approved)
-- values ('Nombre real', 'Perú', '3 meses usando AR4', 'Su comentario real aquí.', 5, true);
