-- AR4 Mercados — Progreso de módulos de Educación
alter table profiles add column if not exists completed_modules text[] not null default '{}';
