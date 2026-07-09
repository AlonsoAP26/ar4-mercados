-- AR4 Mercados — Segundo lote de publicaciones semilla para el Foro de la Comunidad
-- Ejecutar en el SQL Editor de Supabase, DESPUES de seed_community.sql y seed_chat_messages.sql
-- (usa perfiles creados en ambos archivos, asi que ambos deben haberse ejecutado antes).
-- Agrega analisis mas extensos y con mas variedad de instrumentos, para que el Foro
-- se sienta mas activo y cada publicacion tenga su grafico de TradingView asociado.

insert into community_posts (profile_id, category, title, body, symbol, upvotes, created_at) values
  ('a0000000-0000-4000-8000-000000000010', 'LatAm', 'USD/PEN: por que sigo operando con tamano reducido esta semana',
   'Con la cuenta fondeada ya en su tercer mes, la prioridad dejo de ser "acertar la direccion" y paso a ser "no romper la regla de drawdown diario". El USD/PEN viene lateralizando en un rango bastante comprimido, y el BCRP ha mostrado historicamente que interviene cuando detecta movimientos bruscos fuera de ese canal. Mientras no haya una ruptura confirmada con volumen real, prefiero reducir el tamano de posicion a la mitad de lo habitual. No es la operativa mas emocionante, pero es la que me ha permitido seguir fondeado mientras otros traders de mi cohorte ya perdieron su cuenta por sobre-apalancarse en un rango sin catalizador claro.',
   'FX_IDC:USDPEN', 19, now() - interval '9 hours'),

  ('a0000000-0000-4000-8000-000000000011', 'Forex', 'Lo que el indice dolar (DXY) me esta diciendo antes de las minutas de la Fed',
   'Llevo mas de una decada operando y una de las lecciones mas caras que aprendi es a no ignorar el DXY cuando se acerca a los extremos de su rango de los ultimos tres meses. Ahora mismo esta comprimido justo debajo de la resistencia que respeto desde el trimestre pasado, y el mercado de tasas ya esta descontando buena parte de un tono neutral en las minutas. Eso significa que cualquier sorpresa -hawkish o dovish- probablemente se traduzca en un movimiento amplificado, no en uno tibio. Estoy operando pares individuales en vez del dolar index directamente, pero uso el DXY como filtro de sesgo antes de entrar a cualquier cosa en la sesion americana.',
   'TVC:DXY', 15, now() - interval '13 hours'),

  ('a0000000-0000-4000-8000-000000000007', 'Forex', 'GBP/USD: la divergencia entre precio y RSI que no me gusta ignorar',
   'Desde el enfoque cuantitativo con el que suelo operar, las divergencias entre precio y osciladores no son una garantia de reversion, pero si son una señal de que el momentum se esta agotando. En las ultimas dos semanas el GBP/USD hizo un maximo mas alto mientras el RSI en el grafico de 4 horas marco un maximo mas bajo -divergencia bajista clasica-. Eso no significa vender a mercado sin mas, pero si me hace exigir mas confirmacion antes de sumar largos nuevos. Estoy vigilando si el precio pierde la media movil de 20 periodos en 4H como primera señal de que el mercado le esta dando la razon al oscilador.',
   'FX:GBPUSD', 12, now() - interval '20 hours'),

  ('a0000000-0000-4000-8000-000000000005', 'Forex', 'USD/JPY en niveles de intervencion otra vez: cuarta vez es la vencida?',
   'El USD/JPY volvio a acercarse a la zona donde el Ministerio de Finanzas de Japon ha intervenido en el pasado, y el patron ya es familiar: el par sube con fuerza por el diferencial de tasas, alguien en Tokio empieza a "verbal intervene" en declaraciones publicas, y unos dias despues aparece una vela con mecha larga que deja a mas de uno atrapado en largos tardios. No tengo forma de predecir el timing exacto de una intervencion real, asi que mi manejo es simple: reduzco el tamano cuando el par se acerca a esa zona historica y evito perseguir la tendencia con posiciones grandes justo ahi. La asimetria del riesgo no vale la pena.',
   'FX:USDJPY', 21, now() - interval '1 day 4 hours'),

  ('a0000000-0000-4000-8000-000000000006', 'Materias Primas', 'Petroleo WTI: la zona que decide si seguimos en rango o rompemos al alza',
   'Cafe, grafico, repetir -pero esta semana el WTI se puso interesante-. El precio lleva varias sesiones probando la parte alta de un rango de mediano plazo, justo donde coincide una resistencia tecnica con el nivel que históricamente ha gatillado comentarios de la OPEP+ sobre ajustes de produccion. Estoy operando en marcos de 15 y 30 minutos, buscando entradas en pullbacks hacia la media movil exponencial en vez de perseguir la ruptura en caliente. Si el precio logra cerrar con fuerza por encima de esa zona con volumen sostenido, el siguiente objetivo tecnico razonable esta bastante mas arriba. Si no, seguimos rango, y ahi tambien hay dinero para hacer con paciencia.',
   'TVC:USOIL', 10, now() - interval '7 hours'),

  ('a0000000-0000-4000-8000-000000000008', 'Materias Primas', 'Plata (XAG/USD): mi primera vez analizando este activo, ¿voy bien?',
   'Llevo poco tiempo en esto y hasta ahora solo habia mirado EUR/USD, pero un compañero de la sala de Commodities me recomendo empezar a seguir la plata porque "se mueve distinto al oro y eso enseña". Estuve trazando soporte y resistencia en el grafico diario y me parece que el precio esta respetando una media movil simple de 50 periodos como soporte dinamico desde hace varias semanas. No se si eso es relevante o coincidencia, honestamente. Publico esto mas que nada para que alguien con mas experiencia me corrija si estoy interpretando mal el grafico -prefiero equivocarme aca en el foro que en una operacion real-.',
   'OANDA:XAGUSD', 8, now() - interval '11 hours'),

  ('a0000000-0000-4000-8000-000000000009', 'Índices', 'Nasdaq 100: la resistencia que ignore la semana pasada (y me costo)',
   'Cuento esto mas como leccion que como analisis triunfal. La semana pasada vi clarisimo que el Nasdaq 100 estaba llegando a una resistencia horizontal que el propio precio habia respetado dos veces antes, y aun asi entre en largo "porque el momentum se veia fuerte". Resultado: rechazo inmediato y stop loss ejecutado en minutos. Esta semana el precio volvio a acercarse a esa misma zona, y esta vez si estoy esperando confirmacion de ruptura con cierre por encima antes de considerar cualquier entrada. A veces el analisis tecnico no falla, el que falla es no respetarlo.',
   'FOREXCOM:NSXUSD', 16, now() - interval '2 days 3 hours')
on conflict do nothing;
