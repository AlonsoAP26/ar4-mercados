// AR4 Mercados — Velas OHLC para el gráfico propio del compositor (Lightweight Charts).
// Usa el endpoint de gráfico de Yahoo (v8), que funciona sin autenticación.
// Uso: /.netlify/functions/market-candles?symbol=EURUSD=X&interval=1d&range=1y
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const symbol = (q.symbol || '').trim();
  const interval = (q.interval || '1d').trim();
  const range = (q.range || '1y').trim();
  if (!symbol) return json(400, { success: false, error: 'Falta el símbolo.' });
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) +
      '?interval=' + encodeURIComponent(interval) + '&range=' + encodeURIComponent(range);
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) return json(502, { success: false, error: 'Fuente no disponible (' + res.status + ').' });
    const data = await res.json();
    const result = data && data.chart && data.chart.result && data.chart.result[0];
    if (!result || !result.timestamp) return json(404, { success: false, error: 'Sin datos para ese símbolo.' });
    const ts = result.timestamp;
    const quote = result.indicators && result.indicators.quote && result.indicators.quote[0];
    if (!quote) return json(404, { success: false, error: 'Sin datos OHLC.' });
    const candles = [];
    for (let i = 0; i < ts.length; i++) {
      const o = quote.open[i], h = quote.high[i], l = quote.low[i], c = quote.close[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({ time: ts[i], open: o, high: h, low: l, close: c });
    }
    return json(200, {
      success: true,
      symbol,
      currency: (result.meta && result.meta.currency) || null,
      candles
    }, { 'Cache-Control': 'public, max-age=60' });
  } catch (e) {
    return json(500, { success: false, error: String((e && e.message) || e) });
  }
};

function json(statusCode, body, extra) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...(extra || {}) },
    body: JSON.stringify(body)
  };
}
