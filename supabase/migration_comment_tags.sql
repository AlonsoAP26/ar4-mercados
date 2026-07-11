-- Etiquetas opcionales en comentarios (Buen análisis, Aporta datos, Riesgo detectado, Destacado)
alter table comments add column if not exists tag text;

alter table comments drop constraint if exists comments_tag_check;
alter table comments add constraint comments_tag_check
  check (tag is null or tag in ('buen_analisis', 'aporta_datos', 'riesgo', 'destacado'));
