-- AR4 Mercados — Contenido semilla para la Comunidad
-- Ejecutar en el SQL Editor de Supabase, DESPUÉS de migration_community_v2.sql
-- Crea 6 perfiles de ejemplo con analisis publicados, para que la comunidad no arranque vacia.
-- Estos perfiles no corresponden a cuentas reales de Netlify Identity (netlify_user_id es un valor ficticio).

insert into profiles (id, netlify_user_id, username, avatar_color, bio, points, rank, trading_style) values
  ('a0000000-0000-4000-8000-000000000001', 'seed-elnorteno', 'ElNorteno_FX', '#7aa8ff', 'Trader de USD/MXN desde Monterrey. Swing trading, cero drama.', 340, 'vip', 'Swing trader'),
  ('a0000000-0000-4000-8000-000000000002', 'seed-limatrader', 'LimaTrader', '#22c07a', 'Sol peruano, cobre y USD/COP. Aprendiendo gestion de riesgo a las malas.', 180, 'basico', 'Day trader'),
  ('a0000000-0000-4000-8000-000000000003', 'seed-cafetalero', 'CafetaleroBTC', '#f7931a', 'Cripto desde Medellin. Bitcoin es mi reserva de valor, el resto es especulacion.', 610, 'elite', 'HODLer'),
  ('a0000000-0000-4000-8000-000000000004', 'seed-pesochileno', 'PesoChileno_', '#f0c75e', 'IPC, cobre y USD/CLP. Vivo pegado al Banco Central de Chile.', 275, 'vip', 'Swing trader'),
  ('a0000000-0000-4000-8000-000000000005', 'seed-bsasbull', 'BuenosAiresBull', '#e2001a', 'Argentina, inflacion cronica, dolar y algo de acciones. Sobreviviendo el carry trade.', 150, 'basico', 'Macro / posicional'),
  ('a0000000-0000-4000-8000-000000000006', 'seed-goldscalper', 'GoldScalperPE', '#ff8a5c', 'Oro y petroleo en marcos temporales cortos. Cafe, grafico, repetir.', 420, 'premium', 'Scalper')
on conflict (id) do nothing;

insert into community_posts (profile_id, category, title, body, symbol, upvotes, created_at) values
  ('a0000000-0000-4000-8000-000000000001', 'LatAm', 'USD/MXN reacciona justo en la zona de 17.40 otra vez',
   'Tercera vez en el mes que el par respeta esta zona casi al pip. No es casualidad, hay bastante interes de compra ahi. Mientras no cierre un diario por debajo, sigo viendo al peso fuerte pero respetando esta referencia. Ojo con las minutas de la Fed esta semana, pueden mover todo el tablero.',
   'FX_IDC:USDMXN', 14, now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000002', 'LatAm', 'Alguien mas viendo el USD/COP tan tranquilo?',
   'Llevo dias viendo el USD/COP moverse en un rango super estrecho, casi sin volatilidad. Da la sensacion de que el mercado esta esperando el dato de inflacion de esta semana para definir direccion. Mientras tanto practico con tamanos de posicion chicos, la volatilidad baja tambien es una trampa para el aburrimiento.',
   'FX_IDC:USDCOP', 6, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000003', 'Criptomonedas', 'Por que dejo de mirar el precio de Bitcoin todos los dias',
   'Despues de tres ciclos, aprendi que revisar el precio cada hora solo me hace tomar peores decisiones. Los flujos de los ETF spot me dicen mas sobre hacia donde va la demanda institucional que la vela de las ultimas 4 horas. Bitcoin sigue siendo mi posicion de largo plazo, el resto es ruido.',
   'BITSTAMP:BTCUSD', 22, now() - interval '3 days'),
  ('a0000000-0000-4000-8000-000000000004', 'LatAm', 'Chile: si el IPC sale negativo esta semana, esto es lo que espero',
   'Si se confirma una lectura mensual negativa, no seria raro ver al USD/CLP probar la parte baja de su rango reciente con fuerza. El mercado ya viene descontando parte del escenario, pero una sorpresa siempre mueve mas de lo que uno espera. Vigilando 915 como primer soporte relevante.',
   'FX_IDC:USDCLP', 9, now() - interval '18 hours'),
  ('a0000000-0000-4000-8000-000000000005', 'Índices', 'El Merval sigue sin parar y nadie habla de eso',
   'Mientras todos miran el S&P 500 y el Nasdaq, el Merval lleva semanas con una fortaleza relativa que pocos comentan. No digo que sea sostenible para siempre, pero ignorar lo que pasa en Buenos Aires cuando uno opera activos LatAm me parece un error.',
   'BMFBOVESPA:IBOV', 5, now() - interval '4 days'),
  ('a0000000-0000-4000-8000-000000000006', 'Materias Primas', 'Oro: dejando pasar el ruido geopolitico de la semana',
   'Con toda la tension EE.UU.-Iran, el oro deberia estar volando mucho mas de lo que esta. Eso me dice que buena parte de la prima de riesgo ya esta metida en el precio. Sigo operando en marcos cortos, pero sin perseguir velas verdes solo porque hay una noticia en el titular.',
   'OANDA:XAUUSD', 11, now() - interval '6 hours'),
  ('a0000000-0000-4000-8000-000000000003', 'Criptomonedas', 'ETH/BTC en minimos: mi lectura despues de dos anos operando ambos',
   'Cada vez que la ratio ETH/BTC toca minimos como ahora, aparecen los mismos dos bandos: los que dicen que Ethereum esta muerto y los que dicen que es la oportunidad de la decada. La verdad esta en el medio. Mientras la ratio no muestre una divergencia clara, prefiero no anticiparme.',
   'COINBASE:ETHUSD', 17, now() - interval '10 hours'),
  ('a0000000-0000-4000-8000-000000000001', 'Forex', 'EUR/USD: lo que me ensenaron los ultimos tres choques de petroleo',
   'No es la primera vez que veo al euro sufrir mas que el dolar cada vez que el petroleo se dispara por tension en Medio Oriente. La dependencia energetica de Europa pesa, y el mercado lo sabe. Mientras el Brent siga con sesgo alcista, prefiero ser paciente antes de buscar largos en el euro.',
   'FX:EURUSD', 8, now() - interval '5 hours')
on conflict do nothing;
