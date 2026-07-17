/* AR4 Mercados — Gráfico Premium institucional (compartido).
   Un solo punto de verdad para el gráfico avanzado que se usa en Ideas, Noticias
   y cualquier análisis futuro: carga estudios de nivel profesional (VWAP, perfil
   de volumen de rango visible, flujo de dinero, acumulación/distribución) y añade
   un panel que EXPLICA en simple cómo leer el flujo de órdenes y el volumen.
   Uso: window.AR4_renderPremiumChart(containerEl, tvSymbol) */
(function () {
  // IDs clásicos del embed de TradingView (si alguno no existe, el widget lo ignora sin romper).
  var ADV_STUDIES = [
    'MASimple@tv-basicstudies',      // Media 200
    'MAExp@tv-basicstudies',         // Media exponencial 50
    'VWAP@tv-basicstudies',          // Precio medio ponderado por volumen (referencia institucional)
    'Volume@tv-basicstudies',        // Volumen
    'VbPVisible@tv-volumebyprice',   // Perfil de volumen (rango visible) — dónde se negoció de verdad
    'MoneyFlow@tv-basicstudies',     // Índice de flujo de dinero (presión compradora/vendedora)
    'ACCD@tv-basicstudies'           // Acumulación / Distribución (manos fuertes)
  ];

  var LEGEND = [
    ['Perfil de Volumen (VbP)', 'M3 12h7l2-5 3 9 2-4h4',
      'La barra horizontal muestra a qué PRECIOS se negoció más volumen. El pico (POC) es el nivel donde más contratos cambiaron de manos: suele funcionar como imán del precio y como zona que las instituciones defienden.'],
    ['VWAP institucional', 'M3 18c4 0 4-12 8-12s4 12 8 12',
      'Precio medio ponderado por volumen de la sesión. Es la referencia que usan fondos y algoritmos: por encima del VWAP domina la compra, por debajo domina la venta.'],
    ['Flujo de dinero (MFI)', 'M12 3v18M7 8l5-5 5 5',
      'Combina precio y volumen para medir la presión compradora frente a la vendedora. Alto = entra dinero con fuerza; bajo = está saliendo. Es la forma de leer el "order flow" sin mirar orden por orden.'],
    ['Acumulación / Distribución', 'M4 19h16M7 16V9M12 16V5M17 16v-4',
      'Revela si las manos fuertes están ACUMULANDO (comprando en silencio) o DISTRIBUYENDO (soltando posición) aunque el precio todavía no se mueva. Suele anticipar el giro.'],
    ['Medias 50 / 200', 'M3 15c5 0 6-8 10-8s4 5 8 4',
      'La pendiente y el cruce de las medias marcan la tendencia de fondo; el volumen confirma si el movimiento tiene respaldo real o es una trampa de liquidez.']
  ];

  function legendHTML() {
    var cards = LEGEND.map(function (i) {
      return '' +
        '<div class="pfx-item">' +
          '<span class="pfx-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="' + i[1] + '"/></svg></span>' +
          '<div><strong>' + i[0] + '</strong><p>' + i[2] + '</p></div>' +
        '</div>';
    }).join('');
    return '' +
      '<div class="pfx-legend">' +
        '<div class="pfx-legend-head">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 2"/></svg>' +
          '<span>Cómo leer este gráfico institucional</span>' +
        '</div>' +
        '<div class="pfx-grid">' + cards + '</div>' +
        '<p class="pfx-note">Estos indicadores describen el flujo de volumen y la huella de las manos fuertes. No son una señal de compra o venta: te dan el contexto para decidir con criterio.</p>' +
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
      height: 520,
      interval: '60',
      locale: 'es',
      timezone: 'America/Lima',
      theme: 'dark',
      style: '1',
      withdateranges: true,
      details: true,
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
