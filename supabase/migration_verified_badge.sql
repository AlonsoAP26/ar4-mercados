-- AR4 Mercados — Insignia de verificado (solo asignable por administrador)
alter table profiles add column if not exists verified boolean not null default false;

-- profiles usa GRANT SELECT por columnas explícitas (ver migration_community_v2.sql /
-- migration_avatars.sql); hay que sumar la columna nueva o el cliente anónimo no podrá leerla.
grant select (verified) on profiles to anon, authenticated;
