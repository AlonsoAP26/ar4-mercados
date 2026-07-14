// AR4 Mercados — Precios de varios símbolos en una sola petición (para el ticker).
// Reusa el endpoint de gráfico de Yahoo (v8), que funciona sin autenticación.
// Uso: /.netlify/functions/market-prices?symbols=EURUSD=X,BTC-USD,GC=F,...

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

async function priceFor(symbol) {
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?interval=1d&range=1d';
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    if (!res.ok) return { symbol, price: null };
    const data = await res.json();
    const meta = data && data.chart && data.chart.result && data.chart.result[0] && data.chart.result[0].meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') return { symbol, price: null };
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose || null;
    const changePct = (prev && prev !== 0) ? ((price - prev) / prev) * 100 : null;
    return { symbol, price, changePct, currency: meta.currency || null };
  } catch (e) {
    return { symbol, price: null };
  }
}

exports.handler = async (event) => {
  const raw = (event.queryStringParameters && event.queryStringParameters.symbols) || '';
  const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40);
  if (!symbols.length) {
    return json(400, { success: false, error: 'Falta la lista de símbolos.' });
  }
  const results = await Promise.all(symbols.map(priceFor));
  return json(200, { success: true, quotes: results }, { 'Cache-Control': 'public, max-age=30' });
};

function json(statusCode, body, extra) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...(extra || {}) },
    body: JSON.stringify(body)
  };
}
