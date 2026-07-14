// AR4 Mercados — Proxy del calendario económico (feed público de faireconomy / ForexFactory).
// Se hace del lado del servidor para evitar CORS y devolver los datos con caché.
// Los eventos vienen en inglés; la traducción a español se hace en el cliente (js/calendar.js).

const FEED_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

exports.handler = async () => {
  try {
    const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (AR4 Mercados calendario)' } });
    if (!res.ok) {
      return { statusCode: 502, headers: cors(), body: JSON.stringify({ success: false, error: 'No se pudo obtener el calendario.' }) };
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: { ...cors(), 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({ success: true, events: data })
    };
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ success: false, error: String(e.message || e) }) };
  }
};

function cors() {
  return { 'Access-Control-Allow-Origin': '*' };
}
