// AR4 Mercados — Tareas interactivas para los módulos de Educación.
//
// Convierte cada módulo en algo para HACER, no solo leer: gráficos de velas
// donde el usuario hace clic para identificar un patrón, marcar un soporte,
// leer una tendencia o calcular el tamaño de una posición, con feedback
// inmediato. Todo es SVG autocontenido: no depende de ningún widget externo y
// no puede quedarse sin datos.
//
// Expone window.AR4_renderModuleTasks(container, slug).

(function () {
  'use strict';

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // ── Dibujo de velas ──────────────────────────────────────────────────────
  // candles: [{o,h,l,c}]. Devuelve un SVG con cada vela como grupo clicable.
  function drawCandles(candles, opts) {
    opts = opts || {};
    const W = 100, H = 62, padY = 6;
    const highs = candles.map((c) => c.h), lows = candles.map((c) => c.l);
    const max = Math.max.apply(null, highs), min = Math.min.apply(null, lows);
    const range = (max - min) || 1;
    const y = (v) => padY + (H - padY * 2) * (1 - (v - min) / range);
    const n = candles.length;
    const slot = W / n;
    const bw = Math.min(slot * 0.6, 7);
    let s = '';
    // banda objetivo (para tareas de zona), opcional
    if (opts.band) {
      const y1 = y(opts.band[1]), y2 = y(opts.band[0]);
      s += '<rect class="mt-band" x="0" y="' + y1.toFixed(1) + '" width="' + W + '" height="' + (y2 - y1).toFixed(1) + '"/>';
    }
    for (let i = 0; i < n; i++) {
      const c = candles[i];
      const cx = slot * i + slot / 2;
      const up = c.c >= c.o;
      const bodyTop = y(Math.max(c.o, c.c));
      const bodyBot = y(Math.min(c.o, c.c));
      const bodyH = Math.max(bodyBot - bodyTop, 0.6);
      const cls = 'mt-candle ' + (up ? 'up' : 'down') + (opts.clickable ? ' clickable' : '');
      s += '<g class="' + cls + '"' + (opts.clickable ? ' data-i="' + i + '" tabindex="0" role="button"' : '') + '>';
      // area de clic amplia (transparente) para que sea facil acertar en movil
      if (opts.clickable) s += '<rect class="mt-hit" x="' + (slot * i).toFixed(1) + '" y="0" width="' + slot.toFixed(1) + '" height="' + H + '"/>';
      s += '<line class="mt-wick" x1="' + cx.toFixed(1) + '" y1="' + y(c.h).toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + y(c.l).toFixed(1) + '"/>';
      s += '<rect class="mt-body" x="' + (cx - bw / 2).toFixed(1) + '" y="' + bodyTop.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bodyH.toFixed(1) + '" rx="0.6"/>';
      s += '</g>';
    }
    return '<svg class="mt-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + s + '</svg>';
  }

  // Generadores de velas deterministas para construir escenas concretas.
  function bull(o, size, wickU, wickD) { return { o: o, c: o + size, h: o + size + (wickU || 0), l: o - (wickD || 0) }; }
  function bear(o, size, wickU, wickD) { return { o: o, c: o - size, h: o + (wickU || 0), l: o - size - (wickD || 0) }; }
  function doji(o, wick) { return { o: o, c: o + 0.05, h: o + wick, l: o - wick }; }
  function hammer(o, body, lowWick) { return { o: o, c: o + body, h: o + body + 0.3, l: o - lowWick }; }
  function shooting(o, body, upWick) { return { o: o, c: o - body, h: o + upWick, l: o - body - 0.3 }; }

  // ── Definición de tareas por módulo ──────────────────────────────────────
  const TASKS = {
    'velas-japonesas': [
      {
        type: 'clickCandle',
        prompt: 'En una vela alcista el cierre queda por encima de la apertura y se dibuja en verde. Haz clic en la <strong>única vela alcista</strong> del gráfico.',
        candles: [bear(10, 2, 0.4, 0.4), bear(9, 1.5, 0.3, 0.6), bull(7.5, 2.4, 0.3, 0.4), bear(9.5, 1.2, 0.5, 0.3)],
        answer: 2,
        ok: 'Correcto. Cuerpo verde = el precio cerró más arriba de donde abrió: compradores al mando en esa sesión.',
        no: 'Esa es bajista (cuerpo rojo, cierra por debajo de la apertura). La alcista es la verde, con el cierre arriba.'
      },
      {
        type: 'clickCandle',
        prompt: 'La <strong>mecha</strong> (la línea fina) marca el máximo y el mínimo que tocó el precio. Haz clic en la vela con la <strong>mecha inferior más larga</strong> — muestra un rechazo fuerte de los precios bajos.',
        candles: [bull(8, 1.5, 0.4, 0.4), hammer(8.5, 1.2, 3), bear(9, 1.4, 0.3, 0.3), bull(8.2, 1, 0.5, 0.5)],
        answer: 1,
        ok: 'Exacto. Esa mecha inferior larga dice que los vendedores empujaron el precio abajo pero los compradores lo recuperaron: rechazo.',
        no: 'Fíjate en la línea fina que baja más: la segunda vela tiene una mecha inferior mucho más larga que el resto.'
      }
    ],
    'patrones-de-velas-basicos': [
      {
        type: 'clickCandle',
        prompt: 'Un <strong>doji</strong> es una vela donde apertura y cierre casi coinciden (cuerpo mínimo): señal de indecisión. Haz clic en el doji.',
        candles: [bull(8, 2, 0.3, 0.4), doji(9.8, 1.6), bear(9.7, 1.8, 0.3, 0.3), bull(8.5, 1.5, 0.4, 0.4)],
        answer: 1,
        ok: 'Ese es. Cuerpo casi inexistente y mechas a ambos lados: ni compradores ni vendedores ganaron la sesión.',
        no: 'Un doji casi no tiene cuerpo. Busca la vela que parece una cruz o un signo más, no una con cuerpo amplio.'
      },
      {
        type: 'clickCandle',
        prompt: 'Un <strong>martillo</strong> aparece tras una caída: cuerpo pequeño arriba y una mecha inferior larga. Haz clic en el martillo.',
        candles: [bear(11, 1.6, 0.3, 0.3), bear(9.6, 1.4, 0.3, 0.3), hammer(8, 0.9, 2.8), bull(8.6, 1.2, 0.4, 0.4)],
        answer: 2,
        ok: 'Correcto. El martillo tras la caída avisa de un posible agotamiento vendedor y giro al alza.',
        no: 'El martillo tiene el cuerpo pequeño arriba y una mecha inferior larga, y aparece después de velas bajistas.'
      },
      {
        type: 'clickCandle',
        prompt: 'Una <strong>estrella fugaz</strong> es lo opuesto: cuerpo pequeño abajo y mecha superior larga, tras una subida. Haz clic en ella.',
        candles: [bull(7.5, 1.4, 0.3, 0.3), bull(9, 1.3, 0.3, 0.3), shooting(10.5, 0.9, 2.8), bear(10, 1.5, 0.3, 0.4)],
        answer: 2,
        ok: 'Ese es. Mecha superior larga tras subir: los compradores empujaron pero el precio fue rechazado arriba.',
        no: 'La estrella fugaz tiene la mecha larga hacia ARRIBA y aparece después de velas alcistas.'
      }
    ],
    'soporte-y-resistencia': [
      {
        type: 'clickZone',
        prompt: 'El <strong>soporte</strong> es la zona por debajo del precio donde antes frenó las caídas. Haz clic en la <strong>zona de soporte</strong> (abajo, donde los mínimos hacen suelo).',
        candles: [bear(11, 2, 0.3, 0.5), bull(9, 2.4, 0.4, 1.2), bear(11.2, 2, 0.3, 0.4), bull(9.1, 2.2, 0.4, 1.1), bear(11, 1.8, 0.3, 0.5)],
        band: [8.4, 9.4],
        ok: 'Ahí es. El precio bajó varias veces a esa zona y rebotó: los compradores aparecen ahí. Eso es un soporte.',
        no: 'El soporte está ABAJO, donde los mínimos forman un suelo y el precio rebota. Haz clic en esa franja inferior.'
      },
      {
        type: 'clickZone',
        prompt: 'La <strong>resistencia</strong> es lo contrario: la zona por arriba donde el precio frena sus subidas. Haz clic en la <strong>zona de resistencia</strong>.',
        candles: [bull(8, 2, 0.5, 0.3), bear(10, 2.2, 1.2, 0.4), bull(8.1, 2, 0.5, 0.3), bear(10.1, 2.1, 1.1, 0.4), bull(8.2, 1.9, 0.5, 0.3)],
        band: [9.9, 10.9],
        ok: 'Correcto. El precio tocó esa zona superior varias veces y fue rechazado: ahí aparecen vendedores. Es resistencia.',
        no: 'La resistencia está ARRIBA, donde los máximos forman un techo. Haz clic en esa franja superior.'
      }
    ],
    'tendencias-y-estructura-de-mercado': [
      {
        type: 'chooseButtons',
        prompt: 'Una tendencia alcista se reconoce por máximos y mínimos cada vez más altos. Mira el gráfico: ¿qué tendencia muestra?',
        candles: [bull(6, 1.5, 0.3, 0.3), bear(7, 0.8, 0.3, 0.3), bull(6.6, 1.8, 0.3, 0.3), bear(8, 0.9, 0.3, 0.3), bull(7.4, 2, 0.3, 0.3), bull(9, 1.4, 0.3, 0.3)],
        options: ['Alcista', 'Bajista', 'Lateral'],
        answer: 0,
        ok: 'Correcto: cada máximo y cada mínimo es más alto que el anterior. Esa es la definición de tendencia alcista.',
        no: 'Fíjate en los máximos y mínimos: van subiendo escalón a escalón. Eso es una tendencia alcista.'
      },
      {
        type: 'chooseButtons',
        prompt: 'Ahora este otro: los máximos y mínimos van bajando. ¿Qué tendencia es?',
        candles: [bear(11, 1.6, 0.3, 0.3), bull(10, 0.8, 0.3, 0.3), bear(10.6, 1.8, 0.3, 0.3), bull(8.9, 0.9, 0.3, 0.3), bear(9.4, 1.9, 0.3, 0.3), bear(7.6, 1.3, 0.3, 0.3)],
        options: ['Alcista', 'Bajista', 'Lateral'],
        answer: 1,
        ok: 'Correcto. Máximos y mínimos descendentes = tendencia bajista. El precio hace escalones hacia abajo.',
        no: 'Los máximos y mínimos van cayendo escalón a escalón: eso es una tendencia bajista.'
      }
    ],
    'indicadores-basicos': [
      {
        type: 'readRsi',
        prompt: 'El <strong>RSI</strong> va de 0 a 100. Por encima de 70 se considera sobrecompra; por debajo de 30, sobreventa; en medio, neutral. El RSI marca <strong>76</strong>. ¿Cómo lo lees?',
        value: 76,
        options: ['Sobreventa', 'Neutral', 'Sobrecompra'],
        answer: 2,
        ok: 'Correcto. 76 está por encima de 70: sobrecompra. Ojo, no es señal de venta automática — solo dice que subió mucho y rápido.',
        no: '76 está por encima de 70, en la zona alta: eso es sobrecompra.'
      },
      {
        type: 'readRsi',
        prompt: 'Ahora el RSI marca <strong>24</strong>. ¿Cómo lo lees?',
        value: 24,
        options: ['Sobreventa', 'Neutral', 'Sobrecompra'],
        answer: 0,
        ok: 'Correcto. 24 está por debajo de 30: sobreventa. El precio cayó mucho; puede haber rebote, pero no es garantía.',
        no: '24 está por debajo de 30, en la zona baja: eso es sobreventa.'
      }
    ],
    'figuras-geometricas-chartismo': [
      {
        type: 'chooseButtons',
        prompt: 'Un <strong>doble techo</strong> son dos máximos a un nivel parecido, con un valle en medio: suele avisar de agotamiento alcista. Mira la figura: ¿qué es?',
        candles: [bull(7, 2.4, 0.3, 0.3), bear(9.6, 2, 0.3, 0.3), bull(7.5, 2.3, 0.3, 0.3), bear(9.7, 2.2, 0.3, 0.3), bear(7.4, 1.3, 0.3, 0.3)],
        options: ['Doble techo', 'Doble suelo', 'Triángulo'],
        answer: 0,
        ok: 'Correcto. Dos máximos a la misma altura y un valle en medio: doble techo, señal de posible giro a la baja.',
        no: 'Fíjate: hay dos máximos a un nivel parecido con un valle entre ellos. Eso es un doble techo.'
      }
    ],
    'gestion-de-riesgo-tamano-posicion': [
      {
        type: 'calcInput',
        prompt: 'Regla de oro: arriesga poco por operación. Tienes una cuenta de <strong>$1.000</strong> y decides arriesgar el <strong>2%</strong>. ¿Cuántos dólares es ese riesgo máximo por operación?',
        answer: 20, tolerance: 0.5, unit: '$',
        hint: '2% de 1.000 = 1.000 × 0,02',
        ok: 'Exacto: $20. Con ese tope, necesitarías muchísimas operaciones perdedoras seguidas para vaciar la cuenta. Así se sobrevive.',
        no: 'El 2% de $1.000 es 1.000 × 0,02 = $20. Ese es tu riesgo máximo por operación.'
      },
      {
        type: 'calcInput',
        prompt: 'Si arriesgas <strong>$20</strong> y tu stop loss está a <strong>10 pips</strong> de distancia, ¿cuánto puedes arriesgar por pip? (dólares por pip)',
        answer: 2, tolerance: 0.1, unit: '$',
        hint: 'Riesgo total ÷ distancia del stop = 20 ÷ 10',
        ok: 'Correcto: $2 por pip. Así el tamaño de la posición sale del riesgo y del stop, no al revés. Primero defines cuánto pierdes, luego el tamaño.',
        no: '$20 de riesgo ÷ 10 pips de stop = $2 por pip. El tamaño se calcula desde el riesgo, no desde las ganas.'
      }
    ]
  };

  // Módulos conceptuales: reflexión con una escena visual, mismo motor de botones.
  TASKS['que-es-el-trading'] = [{
    type: 'chooseButtons',
    prompt: 'Trading es intentar sacar provecho del <strong>movimiento del precio</strong>, suba o baje, sin necesidad de poseer el activo a largo plazo. Con eso en mente: si crees que un precio va a <strong>bajar</strong>, ¿qué operación te permitiría beneficiarte de esa caída?',
    candles: [bull(7, 1.4, 0.3, 0.3), bear(8, 1.6, 0.3, 0.3), bear(6.6, 1.8, 0.3, 0.3), bear(5, 1.4, 0.3, 0.3)],
    options: ['Ponerte largo (comprar)', 'Ponerte corto (vender)', 'No se puede'],
    answer: 1,
    ok: 'Correcto. Ponerte corto (vender en corto) te permite beneficiarte de una caída. Es lo que distingue al trading de solo "comprar y esperar".',
    no: 'Para beneficiarte de una caída te pones corto (vendes). Comprar (largo) gana si el precio sube.'
  }];
  TASKS['volumen-y-order-flow'] = [{
    type: 'chooseButtons',
    prompt: 'El <strong>volumen</strong> mide cuánta actividad hubo en un movimiento. Una ruptura de resistencia acompañada de <strong>volumen alto</strong> es más fiable que una con volumen bajo. Si ves una ruptura con volumen muy bajo, ¿qué es más prudente pensar?',
    candles: [bull(8, 1.4, 0.3, 0.3), bull(9, 1.2, 0.3, 0.3), bull(9.8, 0.7, 0.3, 0.3)],
    options: ['Ruptura muy confiable', 'Puede ser una ruptura falsa', 'Da igual el volumen'],
    answer: 1,
    ok: 'Correcto. Sin volumen que la respalde, una ruptura tiene más probabilidad de ser falsa (el precio vuelve dentro del rango).',
    no: 'Poco volumen resta convicción a la ruptura: conviene sospechar que puede ser falsa antes de confiarte.'
  }];
  TASKS['plan-de-trading-y-bitacora'] = [{
    type: 'chooseButtons',
    prompt: 'Un plan de trading define de antemano cuándo entras, cuánto arriesgas y cuándo sales. ¿Cuál es la mayor ventaja de tenerlo por escrito ANTES de operar?',
    options: ['Garantiza ganancias', 'Quita la decisión emocional del calor del momento', 'Predice el mercado'],
    answer: 1,
    ok: 'Exacto. Un plan escrito te saca de decidir con miedo o euforia en pleno movimiento: ya decidiste en frío. Ningún plan garantiza ganar.',
    no: 'Ningún plan garantiza ganar ni predice el mercado. Su valor es quitarte la decisión emocional en el momento.'
  }];
  TASKS['psicologia-del-trading-introduccion'] = [{
    type: 'chooseButtons',
    prompt: 'Acabas de perder dos operaciones seguidas y sientes el impulso de "recuperarlo ya" con una operación más grande. Eso tiene nombre. ¿Qué es lo más sano?',
    options: ['Doblar el tamaño para recuperar', 'Parar, respirar y respetar tu plan', 'Operar sin stop esta vez'],
    answer: 1,
    ok: 'Correcto. Ese impulso es "revenge trading" y vacía cuentas. Parar y respetar el plan es lo que separa a quien dura de quien no.',
    no: 'Doblar el tamaño o quitar el stop tras perder es revenge trading: el error más caro. Lo sano es parar y respetar tu plan.'
  }];
  TASKS['tipos-de-mercados-y-activos'] = [{
    type: 'chooseButtons',
    prompt: 'El par <strong>EUR/USD</strong> pertenece a un mercado concreto. ¿A cuál?',
    options: ['Acciones', 'Forex (divisas)', 'Materias primas'],
    answer: 1,
    ok: 'Correcto. EUR/USD es un par de divisas: pertenece al mercado forex, el más líquido del mundo.',
    no: 'EUR/USD enfrenta dos monedas (euro y dólar): es forex, el mercado de divisas.'
  }];

  // ── Tareas de los módulos nuevos ────────────────────────────────────────
  TASKS['pips-lotes-y-valor'] = [{
    type: 'calcInput',
    prompt: 'EUR/USD pasa de <strong>1,1000</strong> a <strong>1,1035</strong>. ¿Cuántos pips se movió? (el pip es el cuarto decimal)',
    answer: 35, tolerance: 0.5, unit: 'pips',
    hint: 'Resta y cuenta el cuarto decimal: 1,1035 − 1,1000',
    ok: 'Exacto: 35 pips. El cuarto decimal es la unidad de medida habitual en forex.',
    no: 'De 1,1000 a 1,1035 hay 35 milésimas del cuarto decimal = 35 pips.'
  }, {
    type: 'calcInput',
    prompt: 'Tu stop está a <strong>25 pips</strong> y quieres arriesgar <strong>$50</strong>. ¿Cuánto puedes arriesgar por pip? (dólares por pip)',
    answer: 2, tolerance: 0.1, unit: '$',
    hint: 'Riesgo total ÷ distancia del stop = 50 ÷ 25',
    ok: 'Correcto: $2 por pip. El tamaño de la posición sale del riesgo y del stop, nunca al revés.',
    no: '$50 ÷ 25 pips = $2 por pip. Primero fijas el riesgo, luego el tamaño.'
  }];

  TASKS['apalancamiento-y-margen'] = [{
    type: 'calcInput',
    prompt: 'Con apalancamiento <strong>1:100</strong> y <strong>$200</strong> de margen, ¿cuánto valor de mercado puedes controlar?',
    answer: 20000, tolerance: 1, unit: '$',
    hint: '200 × 100',
    ok: 'Correcto: $20.000. Ese es el poder del apalancamiento — y también su peligro: un 1% en contra sobre $20.000 son $200, toda tu garantía.',
    no: '1:100 significa multiplicar tu margen por 100: 200 × 100 = $20.000.'
  }];

  TASKS['medias-moviles-a-fondo'] = [{
    type: 'chooseButtons',
    prompt: 'La línea suave es la media móvil de 50. El precio cotiza claramente <strong>por encima</strong> de ella y la media apunta al alza. ¿Qué sesgo sugiere?',
    candles: [bull(6, 1.4, 0.3, 0.3), bull(7, 1.2, 0.3, 0.3), bear(8, 0.7, 0.3, 0.3), bull(7.6, 1.5, 0.3, 0.3), bull(9, 1.2, 0.3, 0.3)],
    options: ['Alcista', 'Bajista', 'Imposible saber'],
    answer: 0,
    ok: 'Correcto. Precio sobre una media ascendente = sesgo alcista, y la media suele actuar como soporte dinámico.',
    no: 'Precio por encima de una media que sube es un sesgo alcista clásico.'
  }];

  TASKS['rsi-y-divergencias'] = [{
    type: 'readRsi',
    prompt: 'El precio acaba de hacer un nuevo máximo, pero el RSI marca <strong>62</strong> cuando en el máximo anterior marcaba 78. El precio sube y el RSI baja: ¿qué nombre recibe eso?',
    value: 62,
    options: ['Divergencia bajista', 'Sobreventa', 'Golden cross'],
    answer: 0,
    ok: 'Correcto. Precio con máximo más alto pero RSI con máximo más bajo = divergencia bajista: el impulso se debilita aunque el precio suba.',
    no: 'Precio arriba, RSI abajo: eso es una divergencia bajista, señal de que el impulso pierde fuerza.'
  }, {
    type: 'readRsi',
    prompt: 'Ahora el RSI marca <strong>28</strong>. Según la lectura básica, ¿en qué zona está?',
    value: 28,
    options: ['Sobreventa', 'Neutral', 'Sobrecompra'],
    answer: 0,
    ok: 'Correcto: 28 está por debajo de 30, en sobreventa. Ojo, no es señal de compra automática.',
    no: '28 está por debajo de 30: zona de sobreventa.'
  }];

  TASKS['fibonacci-retrocesos'] = [{
    type: 'calcInput',
    prompt: 'Un impulso sube de <strong>100</strong> a <strong>200</strong>. ¿A qué precio está el retroceso del <strong>50%</strong> (el nivel de Fibonacci más vigilado del medio)?',
    answer: 150, tolerance: 1, unit: '',
    hint: 'El 50% del recorrido 100→200 está justo en el medio.',
    ok: 'Correcto: 150. El 50% marca la mitad del impulso; si el precio retrocede ahí y reacciona, muchos lo miran como zona de posible continuación.',
    no: 'La mitad de un movimiento de 100 a 200 es 150: ese es el retroceso del 50%.'
  }];

  TASKS['ratio-riesgo-beneficio'] = [{
    type: 'calcInput',
    prompt: 'Haces 10 operaciones arriesgando <strong>$50</strong> para ganar <strong>$150</strong> (ratio 1:3). Aciertas solo 4 y fallas 6. ¿Cuál es tu resultado neto en dólares?',
    answer: 300, tolerance: 1, unit: '$',
    hint: '(4 × 150) − (6 × 50)',
    ok: 'Exacto: +$300. Fallaste MÁS de las que acertaste y aun así ganaste, gracias al ratio. Eso es lo que casi nadie entiende al empezar.',
    no: 'Ganancias 4 × $150 = $600. Pérdidas 6 × $50 = $300. Neto: 600 − 300 = +$300.'
  }];

  TASKS['multiples-temporalidades'] = [{
    type: 'chooseButtons',
    prompt: 'En el gráfico <strong>diario</strong> la tendencia es claramente bajista. Bajas al de 5 minutos buscando una entrada. ¿En qué dirección tiene más sentido buscar operaciones?',
    options: ['Compras (a favor del diario alcista)', 'Ventas (a favor del diario bajista)', 'Da igual la temporalidad alta'],
    answer: 1,
    ok: 'Correcto. Se opera a favor de la temporalidad alta. Si el diario es bajista, buscas ventas y usas el 5m solo para afinar la entrada.',
    no: 'La temporalidad alta manda: si el diario es bajista, buscas ventas. Comprar sería remar contra la corriente.'
  }];

  TASKS['sesiones-de-mercado-horarios'] = [{
    type: 'chooseButtons',
    prompt: 'Buscas los movimientos más limpios y con más liquidez del día. ¿En qué franja es más probable encontrarlos?',
    options: ['Madrugada (sesión asiática tranquila)', 'Solapamiento Londres–Nueva York', 'Domingo por la noche'],
    answer: 1,
    ok: 'Correcto. El solapamiento Londres–NY concentra la mayor liquidez: movimientos más limpios y spreads más ajustados.',
    no: 'La máxima liquidez está en el solapamiento Londres–Nueva York, no en las horas muertas.'
  }];

  TASKS['correlaciones-y-diversificacion'] = [{
    type: 'chooseButtons',
    prompt: 'Abres a la vez compras en EUR/USD, GBP/USD y AUD/USD pensando que "diversificas". En realidad, ¿qué estás haciendo?',
    options: ['Repartiendo el riesgo en tres apuestas distintas', 'Repitiendo la misma apuesta contra el dólar tres veces', 'Eliminando el riesgo'],
    answer: 1,
    ok: 'Correcto. Los tres pares dependen del dólar: si el dólar se fortalece pierdes en los tres. Es el mismo riesgo triplicado, no diversificación.',
    no: 'Esos tres pares se mueven parecido frente al dólar: es la misma apuesta tres veces, no diversificar.'
  }];

  TASKS['el-spread-y-los-costos'] = [{
    type: 'chooseButtons',
    prompt: 'Abres una operación y, sin que el precio se mueva, ya apareces ligeramente en negativo. ¿Por qué?',
    options: ['El broker se equivocó', 'Por el spread: compraste al ask y venderías al bid', 'Porque perdiste'],
    answer: 1,
    ok: 'Correcto. El spread es la diferencia entre comprar y vender: el precio debe moverse a tu favor al menos esa diferencia para empezar a ganar.',
    no: 'Es normal: es el spread. Entras al precio de compra (ask) pero saldrías al de venta (bid), y esa diferencia juega en tu contra al inicio.'
  }];

  // ── Render de una tarea ──────────────────────────────────────────────────
  function renderTask(task, idx) {
    let inner = '';
    if (task.type === 'clickCandle' || task.type === 'clickZone' || task.type === 'chooseButtons') {
      if (task.candles) inner += '<div class="mt-chart-wrap">' + drawCandles(task.candles, {
        clickable: task.type === 'clickCandle',
        band: task.type === 'clickZone' ? task.band : null
      }) + (task.type === 'clickZone' ? '<div class="mt-zone-hint">Haz clic en el gráfico, en la zona correcta</div>' : '') + '</div>';
    } else if (task.type === 'readRsi') {
      const v = task.value;
      inner += '<div class="mt-rsi"><div class="mt-rsi-bar">' +
        '<span class="mt-rsi-zone os"></span><span class="mt-rsi-zone ob"></span>' +
        '<span class="mt-rsi-marker" style="left:' + v + '%"><b>' + v + '</b></span></div>' +
        '<div class="mt-rsi-scale"><span>0</span><span>30</span><span>70</span><span>100</span></div></div>';
    } else if (task.type === 'calcInput') {
      inner += '<div class="mt-calc"><input type="number" class="mt-calc-input" inputmode="decimal" placeholder="Tu respuesta">' +
        '<span class="mt-calc-unit">' + esc(task.unit || '') + '</span>' +
        '<button class="btn btn-outline mt-calc-btn" type="button">Comprobar</button></div>' +
        (task.hint ? '<button type="button" class="mt-hint-btn">💡 Ver pista</button><div class="mt-hint" hidden>' + esc(task.hint) + '</div>' : '');
    }
    let btns = '';
    if (task.type === 'chooseButtons' || task.type === 'readRsi') {
      btns = '<div class="mt-options">' + task.options.map((o, i) =>
        '<button type="button" class="mt-opt" data-i="' + i + '">' + esc(o) + '</button>').join('') + '</div>';
    }
    return '<div class="mt-task" data-idx="' + idx + '">' +
      '<div class="mt-prompt"><span class="mt-badge">Tarea ' + (idx + 1) + '</span>' + task.prompt + '</div>' +
      inner + btns +
      '<div class="mt-feedback" hidden></div>' +
      '</div>';
  }

  function feedback(taskEl, ok, msg) {
    const fb = taskEl.querySelector('.mt-feedback');
    fb.className = 'mt-feedback ' + (ok ? 'ok' : 'no');
    fb.innerHTML = (ok ? '✓ ' : '✕ ') + msg;
    fb.hidden = false;
  }

  function wireTask(taskEl, task) {
    let done = false;
    const lock = () => { done = true; };

    if (task.type === 'clickCandle') {
      taskEl.querySelectorAll('.mt-candle.clickable').forEach((g) => {
        const answer = () => {
          if (done) return;
          const i = parseInt(g.dataset.i, 10);
          const correct = i === task.answer;
          taskEl.querySelectorAll('.mt-candle').forEach((x) => x.classList.remove('picked', 'is-correct'));
          g.classList.add('picked');
          const right = taskEl.querySelector('.mt-candle[data-i="' + task.answer + '"]');
          if (right) right.classList.add('is-correct');
          feedback(taskEl, correct, correct ? task.ok : task.no);
          lock();
        };
        g.addEventListener('click', answer);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); answer(); } });
      });
    } else if (task.type === 'clickZone') {
      const svg = taskEl.querySelector('.mt-chart');
      svg.classList.add('clickable-zone');
      svg.addEventListener('click', (e) => {
        if (done) return;
        const r = svg.getBoundingClientRect();
        const yPct = (e.clientY - r.top) / r.height; // 0 arriba, 1 abajo
        // La banda objetivo, en coordenadas del viewBox (H=62, padY=6).
        const candles = task.candles;
        const highs = candles.map((c) => c.h), lows = candles.map((c) => c.l);
        const max = Math.max.apply(null, highs), min = Math.min.apply(null, lows);
        const range = (max - min) || 1;
        const yv = (v) => 6 + (62 - 12) * (1 - (v - min) / range);
        const yTop = yv(task.band[1]) / 62, yBot = yv(task.band[0]) / 62;
        const correct = yPct >= yTop - 0.04 && yPct <= yBot + 0.04;
        taskEl.querySelector('.mt-band').classList.add('reveal');
        feedback(taskEl, correct, correct ? task.ok : task.no);
        lock();
      });
    } else if (task.type === 'chooseButtons' || task.type === 'readRsi') {
      taskEl.querySelectorAll('.mt-opt').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (done) return;
          const i = parseInt(btn.dataset.i, 10);
          const correct = i === task.answer;
          taskEl.querySelectorAll('.mt-opt').forEach((b, bi) => {
            b.disabled = true;
            if (bi === task.answer) b.classList.add('correct');
            else if (bi === i) b.classList.add('wrong');
          });
          feedback(taskEl, correct, correct ? task.ok : task.no);
          lock();
        });
      });
    } else if (task.type === 'calcInput') {
      const input = taskEl.querySelector('.mt-calc-input');
      const check = () => {
        if (done) return;
        const v = parseFloat(String(input.value).replace(',', '.'));
        if (!isFinite(v)) { feedback(taskEl, false, 'Escribe un número para comprobar.'); return; }
        const correct = Math.abs(v - task.answer) <= (task.tolerance || 0);
        feedback(taskEl, correct, correct ? task.ok : task.no);
        if (correct) { input.disabled = true; lock(); }
      };
      taskEl.querySelector('.mt-calc-btn').addEventListener('click', check);
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
      const hintBtn = taskEl.querySelector('.mt-hint-btn');
      if (hintBtn) hintBtn.addEventListener('click', () => {
        const h = taskEl.querySelector('.mt-hint'); h.hidden = !h.hidden;
      });
    }
  }

  window.AR4_renderModuleTasks = function (container, slug) {
    if (!container) return;
    const tasks = TASKS[slug];
    if (!tasks || !tasks.length) { container.innerHTML = ''; return; }
    container.innerHTML =
      '<div class="mt-head"><span class="mt-head-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-7"/><circle cx="12" cy="5" r="1.4"/></svg></span>' +
      '<div><h3>Practica lo que acabas de leer</h3><p>Tareas interactivas sobre gráficos reales. Haz clic y recibe explicación al instante — no afecta tu progreso si te equivocas.</p></div></div>' +
      '<div class="mt-tasks">' + tasks.map(renderTask).join('') + '</div>';
    container.querySelectorAll('.mt-task').forEach((el, i) => wireTask(el, tasks[i]));
  };
})();
