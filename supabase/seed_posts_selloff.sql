-- AR4 Mercados — 3 publicaciones de la comunidad sobre la apertura de semana en rojo
-- Ejecutar en el SQL Editor de Supabase (los perfiles semilla ya deben existir:
-- seed_community.sql y seed_chat_messages.sql). Los mensajes se fechan hoy.
-- Contenido de contexto y escenarios, sin señales de compra/venta.

insert into community_posts (profile_id, category, title, body, symbol, sentiment, upvotes, created_at) values
  (
    'a0000000-0000-4000-8000-000000000007',
    'Índices',
    'La semana abrió en rojo y ya veo a medio grupo en pánico, vamos con calma',
    'Ojo con leer el primer día rojo como si fuera el fin del mundo. El detonante fue el dato de empleo del viernes, salió fuerte, subieron los rendimientos de los bonos y el mercado descartó recortes de la Fed. Eso golpea a las valoraciones más caras, sobre todo tecnología. Mi lectura: mientras el bono de 10 años siga subiendo, la presión sigue; si el dato de inflación de esta semana sale suave, cambia el cuento. No es un consejo de comprar ni vender, es entender qué mueve la ficha antes de reaccionar en caliente. ¿Ustedes cómo lo están viendo?',
    'FOREXCOM:SPXUSD',
    'bajista',
    0,
    now() - interval '3 hours'
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'Criptomonedas',
    'Bitcoin cayó con las bolsas otra vez: la descorrelación es un mito de corto plazo',
    'Cada vez que hay aversión al riesgo global pasa lo mismo: sube el dólar, suben las tasas y el cripto cae de la mano de las tecnológicas. La narrativa de refugio descorrelacionado suena bonita pero en el corto plazo BTC respira al ritmo de la macro. No cambia mi tesis de largo, pero sí me recuerda que estos días miden temperamento, no convicción. Dos escenarios que estoy mirando: si respeta su estructura de mínimos crecientes en soporte con volumen bajando, es una pausa; si rompe mínimos relevantes con volumen alto, la lectura de fondo cambia. Nada de esto es señal de entrada, es para pensar dos veces antes de mover fichas con miedo.',
    'BITSTAMP:BTCUSD',
    'neutral',
    0,
    now() - interval '2 hours'
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'LatAm',
    'El peso y el real cediendo por el dólar fuerte: cuidado con el carry en semanas así',
    'La región abrió cediendo terreno, pero no por algo local sino por el humor global. El dólar se fortaleció tras el empleo de EE.UU. y el carry trade que sostenía al real y al peso mexicano se vuelve frágil justo cuando el diferencial de tasas se estrecha. Los fundamentos de varias economías siguen sólidos, pero en aversión al riesgo eso pasa a segundo plano y el capital reduce exposición a todo lo emergente. No estoy diciendo compren dólares ni vendan pesos: estoy diciendo que la fortaleza basada en carry es real pero sensible, y que en semanas así conviene dimensionar el riesgo asumiendo que el ciclo se puede revertir rápido. ¿Alguien más operando pares latam esta semana?',
    'FX_IDC:USDMXN',
    'bajista',
    0,
    now() - interval '1 hour'
  )
on conflict do nothing;
