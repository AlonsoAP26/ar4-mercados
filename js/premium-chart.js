/* AR4 Mercados — Gráfico Premium institucional (compartido).
   Un solo punto de verdad para el gráfico avanzado que se usa en Ideas, Noticias
   y cualquier análisis futuro.

   Criterio: NADA de indicadores básicos (medias simples/exponenciales, RSI suelto).
   Solo sistemas avanzados de lectura institucional: Ichimoku, perfil de volumen
   por rango visible, VWAP, flujo de dinero, acumulación/distribución y fuerza de
   tendencia (DMI/ADX). El panel de información de TradingView va desactivado:
   la lectura la escribimos nosotros, en español y en nuestro formato.
   Uso: window.AR4_renderPremiumChart(containerEl, tvSymbol) */
(function () {
  // Estudios avanzados (IDs del embed de TradingView). Sin medias básicas.
  var ADV_STUDIES = [
    'IchimokuCloud@tv-basicstudies', // Sistema Ichimoku completo (nube, Tenkan/Kijun, Chikou)
    'VbPVisible@tv-volumebyprice',   // Perfil de volumen por rango visible (POC / área de valor)
    'VWAP@tv-basicstudies',          // Precio medio ponderado por volumen (referencia institucional)
    'MoneyFlow@tv-basicstudies',     // Índice de flujo de dinero (presión compradora/vendedora)
    'ACCD@tv-basicstudies',          // Acumulación / Distribución (huella de manos fuertes)
    'DM@tv-basicstudies'             // Movimiento direccional DMI/ADX (fuerza de la tendencia)
  ];

  // Lectura escrita por AR4: qué es, cómo se lee y qué buscar. Formato propio.
  var LEGEND = [
    {
      t: 'Nube de Ichimoku',
      d: 'M3 14c4-6 8 2 12-3s4-1 6-2',
      q: 'Sistema completo, no una media.',
      p: 'La nube proyecta soporte y resistencia hacia el futuro. Si el precio va POR ENCIMA de la nube el régimen es alcista; por debajo, bajista; dentro, sin dirección (zona de trampa). Cuanto más gruesa es la nube, más difícil es atravesarla. El cruce de las líneas Tenkan y Kijun avisa del cambio de momentum antes que el precio.'
    },
    {
      t: 'Perfil de Volumen (rango visible)',
      d: 'M3 12h6l2-5 3 9 2-4h5',
      q: 'Dónde se negoció de verdad.',
      p: 'Las barras horizontales miden CUÁNTO volumen se cruzó en cada precio, no en cada momento. El pico más largo es el POC (punto de control): el precio justo donde más contratos cambiaron de manos, y actúa como imán. Las zonas delgadas son huecos de liquidez: el precio suele atravesarlas rápido.'
    },
    {
      t: 'VWAP institucional',
      d: 'M3 18c4 0 4-12 8-12s4 12 8 12',
      q: 'La referencia de los fondos.',
      p: 'Precio medio ponderado por volumen. Los algoritmos y las mesas institucionales lo usan para juzgar si están ejecutando caro o barato. Por encima del VWAP, el comprador domina y las caídas suelen buscarlo como soporte; por debajo, manda el vendedor y los rebotes suelen frenar ahí.'
    },
    {
      t: 'Flujo de dinero (MFI)',
      d: 'M12 3v18M7 8l5-5 5 5',
      q: 'Order flow sin ver cada orden.',
      p: 'Pondera cada movimiento por su volumen: mide si el dinero ENTRA o SALE, no solo si el precio sube. Es la forma práctica de leer el flujo de órdenes en un gráfico. La señal más valiosa es la divergencia: precio marcando máximos mientras el flujo cae significa que la subida se está quedando sin dinero detrás.'
    },
    {
      t: 'Acumulación / Distribución',
      d: 'M4 19h16M7 16V9M12 16V5M17 16v-4',
      q: 'La huella de las manos fuertes.',
      p: 'Revela si alguien está construyendo posición en silencio (acumulación) o repartiéndola al mercado (distribución) mientras el precio parece plano. Cuando esta línea sube y el precio no, suele haber compra institucional absorbiendo oferta: el movimiento aún no se ve, pero se está preparando.'
    },
    {
      t: 'DMI / ADX — fuerza de tendencia',
      d: 'M3 17l5-5 3 3 7-8M14 4h4v4',
      q: 'Mide la fuerza, no la dirección.',
      p: 'El ADX no dice si sube o baja: dice si el movimiento tiene convicción. Por debajo de 20 el mercado está en rango y las rupturas suelen fallar; por encima de 25 hay tendencia real y vale seguirla. Las líneas +DI y −DI muestran qué lado (comprador o vendedor) tiene el control.'
    }
  ];

  function legendHTML() {
    var cards = LEGEND.map(function (i) {
      return '' +
        '<div class="pfx-item">' +
          '<span class="pfx-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="' + i.d + '"/></svg></span>' +
          '<div class="pfx-body"><strong>' + i.t + '</strong><em class="pfx-q">' + i.q + '</em><p>' + i.p + '</p></div>' +
        '</div>';
    }).join('');
    return '' +
      '<div class="pfx-legend">' +
        '<div class="pfx-legend-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 2"/></svg>' +
          '<div><span>Cómo leer este gráfico</span><small>Lectura de AR4 Mercados — seis sistemas avanzados, explicados en simple</small></div>' +
        '</div>' +
        '<div class="pfx-grid">' + cards + '</div>' +
        '<p class="pfx-note">Estos seis sistemas describen el flujo de volumen y la huella de las manos fuertes: son la lectura que un trader profesional hace antes de arriesgar capital. Ninguno es una señal de compra o venta — te dan el contexto para decidir tú, con criterio.</p>' +
      '</div>';
  }

  function renderChart(chartEl, symbol) {
    chartEl.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    s.async = true;
    s.text = JSON.stringify({
      symbol: symbol,
      width: '100%',
      height: 560,
      interval: '60',
      locale: 'es',
      timezone: 'America/Lima',
      theme: 'dark',
      style: '1',
      withdateranges: true,
      details: false,   // sin el panel de perfil/datos de TradingView: la lectura la escribimos nosotros
      hotlist: false,
      calendar: false,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      studies: ADV_STUDIES,
      support_host: 'https://www.tradingview.com'
    });
    chartEl.appendChild(s);
  }

  window.AR4_renderPremiumChart = function (container, symbol) {
    if (!container) return;
    container.classList.add('pfx-wrap');
    container.innerHTML =
      '<div class="pfx-badge"><span class="pfx-dot"></span>Gráfico institucional · flujo de órdenes y volumen</div>' +
      '<div class="tradingview-widget-container pfx-chart"></div>' +
      legendHTML();
    renderChart(container.querySelector('.pfx-chart'), symbol);
  };
})();
