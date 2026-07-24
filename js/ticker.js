// AR4 Mercados — Ticker propio (marquesina CSS) con precios reales de Yahoo.
// Se desplaza de forma continua siempre, en cualquier ancho de pantalla.
(function () {
  var mount = document.getElementById('ar4Ticker');
  if (!mount || mount.dataset.ready) return;
  mount.dataset.ready = '1';

  // { label, yahoo (símbolo Yahoo), dec (decimales) }
  var ITEMS = [
    { label: 'EUR/USD', y: 'EURUSD=X', dec: 5 },
    { label: 'BTC/USD', y: 'BTC-USD', dec: 0 },
    { label: 'ORO', y: 'GC=F', dec: 2 },
    { label: 'Apple', y: 'AAPL', dec: 2 },
    { label: 'USD/MXN', y: 'USDMXN=X', dec: 4 },
    { label: 'NASDAQ 100', y: '^NDX', dec: 2 },
    { label: 'ETH/USD', y: 'ETH-USD', dec: 2 },
    { label: 'Tesla', y: 'TSLA', dec: 2 },
    { label: 'GBP/USD', y: 'GBPUSD=X', dec: 5 },
    { label: 'S&P 500', y: '^GSPC', dec: 2 },
    { label: 'PETRÓLEO', y: 'CL=F', dec: 2 },
    { label: 'NVIDIA', y: 'NVDA', dec: 2 },
    { label: 'USD/JPY', y: 'USDJPY=X', dec: 3 },
    { label: 'SOL/USD', y: 'SOL-USD', dec: 2 },
    { label: 'PLATA', y: 'SI=F', dec: 2 },
    { label: 'USD/BRL', y: 'USDBRL=X', dec: 4 },
    { label: 'Amazon', y: 'AMZN', dec: 2 },
    { label: 'Dow Jones', y: '^DJI', dec: 2 },
    { label: 'USD/COP', y: 'USDCOP=X', dec: 2 },
    { label: 'XRP/USD', y: 'XRP-USD', dec: 4 },
    { label: 'USD/CLP', y: 'USDCLP=X', dec: 2 },
    { label: 'Microsoft', y: 'MSFT', dec: 2 },
    { label: 'USD/PEN', y: 'USDPEN=X', dec: 4 },
    { label: 'DOGE/USD', y: 'DOGE-USD', dec: 5 },
    { label: 'Meta', y: 'META', dec: 2 },
    { label: 'USD/ARS', y: 'USDARS=X', dec: 2 },
    { label: 'Google', y: 'GOOGL', dec: 2 },
    { label: 'AUD/USD', y: 'AUDUSD=X', dec: 5 }
  ];

  function fmt(n, dec) {
    if (n == null || !isFinite(n)) return '—';
    return Number(n).toLocaleString('es', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function itemHTML(it, q) {
    var price = q && q.price != null ? fmt(q.price, it.dec) : '—';
    var chg = q && q.changePct != null ? q.changePct : null;
    var chgCls = chg == null ? '' : (chg >= 0 ? 'ar4-tk-up' : 'ar4-tk-down');
    var chgTxt = chg == null ? '' : (chg >= 0 ? '▲ ' : '▼ ') + Math.abs(chg).toFixed(2) + '%';
    return '<span class="ar4-tk-item">' +
      '<span class="ar4-tk-name">' + it.label + '</span>' +
      '<span class="ar4-tk-price">' + price + '</span>' +
      '<span class="ar4-tk-chg ' + chgCls + '">' + chgTxt + '</span>' +
      '</span>';
  }

  function render(quotes) {
    var map = {};
    (quotes || []).forEach(function (q) { map[q.symbol] = q; });
    var strip = ITEMS.map(function (it) { return itemHTML(it, map[it.y]); }).join('');
    // Duplicamos el contenido para un bucle sin cortes (la animación va de 0 a -50%).
    mount.innerHTML = '<div class="ar4-ticker"><div class="ar4-ticker-track">' + strip + strip + '</div></div>';
  }

  // Refresco de precios SIN reconstruir la cinta: reconstruirla reiniciaba la
  // animación y la marquesina pegaba un salto al inicio cada minuto. Se
  // actualizan precio y variación dentro de los elementos ya existentes
  // (la pista tiene los items duplicados: índice módulo ITEMS.length).
  function update(quotes) {
    var track = mount.querySelector('.ar4-ticker-track');
    if (!track) { render(quotes); return; }
    var map = {};
    (quotes || []).forEach(function (q) { map[q.symbol] = q; });
    var nodes = track.querySelectorAll('.ar4-tk-item');
    for (var i = 0; i < nodes.length; i++) {
      var it = ITEMS[i % ITEMS.length];
      var q = map[it.y];
      if (!q) continue;
      var priceEl = nodes[i].querySelector('.ar4-tk-price');
      var chgEl = nodes[i].querySelector('.ar4-tk-chg');
      if (priceEl) priceEl.textContent = q.price != null ? fmt(q.price, it.dec) : '—';
      if (chgEl) {
        var chg = q.changePct != null ? q.changePct : null;
        chgEl.className = 'ar4-tk-chg ' + (chg == null ? '' : (chg >= 0 ? 'ar4-tk-up' : 'ar4-tk-down'));
        chgEl.textContent = chg == null ? '' : (chg >= 0 ? '▲ ' : '▼ ') + Math.abs(chg).toFixed(2) + '%';
      }
    }
  }

  function load() {
    var symbols = ITEMS.map(function (it) { return it.y; }).join(',');
    fetch('/.netlify/functions/market-prices?symbols=' + encodeURIComponent(symbols))
      .then(function (r) { return r.json(); })
      .then(function (data) { update(data && data.success ? data.quotes : []); })
      .catch(function () { update([]); });
  }

  // Primer render inmediato (sin precios) para que la cinta ya se vea moviéndose,
  // y luego se rellenan los precios reales.
  render([]);
  load();
  setInterval(load, 60000);
})();
