// AR4 Mercados — Búsqueda universal de símbolos (Yahoo Finance Search).
// Permite autocompletar cualquier instrumento del mercado (acciones, divisas,
// cripto, futuros, índices) en los cuadros del sitio. Devuelve los 8 mejores.
exports.handler = async (event) => {
  const q = ((event.queryStringParameters && event.queryStringParameters.q) || '').trim();
  const json = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    body: JSON.stringify(body)
  });
  if (q.length < 2 || q.length > 40) return json(200, { success: true, results: [] });

  try {
    const url = 'https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) +
      '&quotesCount=10&newsCount=0&listsCount=0&enableFuzzyQuery=false';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!res.ok) return json(200, { success: true, results: [] });
    const data = await res.json();
    const TYPE_LABEL = {
      EQUITY: 'Acción', ETF: 'ETF', CURRENCY: 'Divisa', CRYPTOCURRENCY: 'Cripto',
      FUTURE: 'Futuro', INDEX: 'Índice', MUTUALFUND: 'Fondo'
    };
    const results = (data.quotes || [])
      .filter((it) => it.symbol && TYPE_LABEL[it.quoteType])
      .slice(0, 8)
      .map((it) => ({
        symbol: it.symbol,
        name: it.shortname || it.longname || it.symbol,
        type: it.quoteType,
        typeLabel: TYPE_LABEL[it.quoteType],
        exchange: it.exchDisp || it.exchange || ''
      }));
    return json(200, { success: true, results });
  } catch (e) {
    return json(200, { success: true, results: [] });
  }
};
