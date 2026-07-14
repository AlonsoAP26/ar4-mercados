-- AR4 Mercados — 3 ideas para el Foro de la Comunidad.
-- Ejecuta este script UNA VEZ en Supabase (SQL Editor). Es seguro re-ejecutarlo:
-- cada inserción se salta si ya existe una publicación con el mismo título.
-- Los autores son perfiles de la comunidad ya existentes.

-- 1) ElitePeru88 — Idea estructurada (compra) en Oro
insert into community_posts
  (profile_id, category, title, body, symbol, sentiment,
   is_structured_idea, idea_direction, idea_entry, idea_sl, idea_tp, idea_rr, idea_timeframe, created_at)
select p.id, 'Oro',
  'Oro: busco continuación alcista con el riesgo bien definido',
  'El oro sigue firme y no aparecen vendedores agresivos en los retrocesos. Mi plan no es perseguir el precio, sino esperar que regrese a la zona de soporte y recién ahí entrar, con la invalidación clara por debajo. Riesgo 1% de la cuenta y R:B por encima de 1:2. Si pierde el soporte con volumen, salgo sin discutir. Comparto niveles como referencia, no como recomendación: cada quien maneja su propio riesgo.',
  'OANDA:XAUUSD', 'alcista',
  true, 'long', 4020, 3980, 4110, 2.25, 'H4', now() - interval '2 hours'
from profiles p
where p.username = 'ElitePeru88'
  and not exists (select 1 from community_posts cp where cp.title = 'Oro: busco continuación alcista con el riesgo bien definido');

-- 2) FXVeteran_CL — Idea estructurada (venta) en EUR/USD
insert into community_posts
  (profile_id, category, title, body, symbol, sentiment,
   is_structured_idea, idea_direction, idea_entry, idea_sl, idea_tp, idea_rr, idea_timeframe, created_at)
select p.id, 'Forex',
  'EUR/USD: sesgo bajista mientras el dólar siga firme',
  'Con el dólar sostenido, veo al EUR/USD con más probabilidad de continuar a la baja que de revertir en el corto plazo. La idea es vender en los rebotes hacia resistencia, no en plena caída. Stop por encima de la última resistencia relevante y objetivo en el soporte previo. Si el dólar da señales de agotamiento, anulo la idea. Es mi lectura personal, no una señal ni asesoría.',
  'FX:EURUSD', 'bajista',
  true, 'short', 1.1390, 1.1440, 1.1270, 2.4, 'H1', now() - interval '5 hours'
from profiles p
where p.username = 'FXVeteran_CL'
  and not exists (select 1 from community_posts cp where cp.title = 'EUR/USD: sesgo bajista mientras el dólar siga firme');

-- 3) CafetaleroBTC — Idea / debate (sin niveles) en Bitcoin
insert into community_posts
  (profile_id, category, title, body, symbol, sentiment,
   is_structured_idea, created_at)
select p.id, 'Criptomonedas',
  'Bitcoin en consolidación: ¿esperamos ruptura o nos adelantamos?',
  'BTC lleva días moviéndose dentro de un rango tras el rebote. Yo prefiero esperar la ruptura con volumen antes de comprometer riesgo, en vez de anticiparme dentro del rango y comerme el ruido. En cripto el mayor error no suele ser la dirección, sino el tamaño de la posición para un activo que se mueve tanto en pocas horas. ¿Ustedes cómo lo están viendo, esperan confirmación o entran antes? Lo comento para debatir, no como recomendación.',
  'BITSTAMP:BTCUSD', 'neutral',
  false, now() - interval '8 hours'
from profiles p
where p.username = 'CafetaleroBTC'
  and not exists (select 1 from community_posts cp where cp.title = 'Bitcoin en consolidación: ¿esperamos ruptura o nos adelantamos?');
