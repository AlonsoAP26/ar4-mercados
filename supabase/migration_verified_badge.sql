-- AR4 Mercados — Insignia de verificado (solo asignable por administrador)
alter table profiles add column if not exists verified boolean not null default false;
