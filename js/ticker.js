// AR4 Mercados — Ticker superior unificado (una sola lista para todas las páginas).
// Forex mayores + LatAm, metales, petróleo, índices, cripto y acciones. Se desplaza
// automáticamente de derecha a izquierda mostrando muchos símbolos, sin repetir.
(function () {
  var mount = document.getElementById('ar4Ticker');
  if (!mount || mount.dataset.ready) return;
  mount.dataset.ready = '1';

  var symbols = [
    { proName: 'FX:EURUSD', title: 'EUR/USD' },
    { proName: 'BITSTAMP:BTCUSD', title: 'BTC/USD' },
    { proName: 'OANDA:XAUUSD', title: 'ORO' },
    { proName: 'NASDAQ:AAPL', title: 'Apple' },
    { proName: 'FX_IDC:USDMXN', title: 'USD/MXN' },
    { proName: 'FOREXCOM:NSXUSD', title: 'NASDAQ 100' },
    { proName: 'COINBASE:ETHUSD', title: 'ETH/USD' },
    { proName: 'NASDAQ:TSLA', title: 'Tesla' },
    { proName: 'FX:GBPUSD', title: 'GBP/USD' },
    { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
    { proName: 'TVC:USOIL', title: 'PETRÓLEO' },
    { proName: 'NASDAQ:NVDA', title: 'NVIDIA' },
    { proName: 'FX:USDJPY', title: 'USD/JPY' },
    { proName: 'COINBASE:SOLUSD', title: 'SOL/USD' },
    { proName: 'OANDA:XAGUSD', title: 'PLATA' },
    { proName: 'FX_IDC:USDBRL', title: 'USD/BRL' },
    { proName: 'NASDAQ:AMZN', title: 'Amazon' },
    { proName: 'FX_IDC:USDCOP', title: 'USD/COP' },
    { proName: 'BITSTAMP:XRPUSD', title: 'XRP/USD' },
    { proName: 'FX_IDC:USDCLP', title: 'USD/CLP' },
    { proName: 'NASDAQ:MSFT', title: 'Microsoft' },
    { proName: 'FX_IDC:USDPEN', title: 'USD/PEN' },
    { proName: 'NASDAQ:META', title: 'Meta' },
    { proName: 'FX_IDC:USDARS', title: 'USD/ARS' },
    { proName: 'NASDAQ:GOOGL', title: 'Google' },
    { proName: 'BINANCE:BNBUSD', title: 'BNB/USD' },
    { proName: 'FX:AUDUSD', title: 'AUD/USD' },
    { proName: 'NASDAQ:AMD', title: 'AMD' },
    { proName: 'FX:USDCAD', title: 'USD/CAD' },
    { proName: 'COINBASE:DOGEUSD', title: 'DOGE/USD' },
    { proName: 'NYSE:KO', title: 'Coca-Cola' }
  ];

  mount.innerHTML = '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
  script.text = JSON.stringify({
    symbols: symbols,
    showSymbolLogo: true,
    isTransparent: true,
    displayMode: 'regular',
    colorTheme: 'dark',
    locale: 'es'
  });
  mount.querySelector('.tradingview-widget-container').appendChild(script);
})();
