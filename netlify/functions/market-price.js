// AR4 Mercados — Precio de mercado (proxy a Yahoo Finance).
// Cubre forex, cripto, índices, acciones y metales con una sola fuente gratuita.
// Se hace del lado del servidor para evitar CORS y poder cachear.

exports.handler = async (event) => {
  const symbol = (event.queryStringParameters && event.queryStringParameters.symbol || '').trim();
  if (!symbol) {
    return json(400, { success: false, error: 'Falta el símbolo (Yahoo).' });
  }
  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?interval=1m&range=1d';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return json(502, { success: false, error: 'Fuente de precio no disponible (' + res.status + ').' });
    const data = await res.json();
    const result = data && data.chart && data.chart.result && data.chart.result[0];
    const meta = result && result.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      return json(404, { success: false, error: 'Sin precio para ese símbolo.' });
    }
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose || null;
    const changePct = (prev && prev !== 0) ? ((price - prev) / prev) * 100 : null;
    return json(200, {
      success: true,
      price,
      previousClose: prev,
      changePct,
      currency: meta.currency || null,
      marketState: meta.marketState || null,
      time: meta.regularMarketTime || null
    }, { 'Cache-Control': 'public, max-age=30' });
  } catch (e) {
    return json(500, { success: false, error: String(e.message || e) });
  }
};

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...(extraHeaders || {}) },
    body: JSON.stringify(body)
  };
}
