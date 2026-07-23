// AR4 Mercados — Flash del mercado, servido en vivo.
// El bot de GitHub Actions commitea data/flash.json en cuanto detecta un
// titular nuevo, pero netlify.toml ignora el rebuild completo del sitio para
// esos commits (ver [build].ignore) para no gastar minutos de build en cada
// titular. Esta funcion lee el archivo directo desde la API de contenidos de
// GitHub (cache de 60s, a diferencia de raw.githubusercontent.com que cachea
// hasta 5 min sin purgarse al hacer push) para que el flash llegue al
// navegador sin esperar un deploy de Netlify.
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.github.com/repos/AlonsoAP26/ar4-mercados/contents/data/flash.json?ref=master';
let lastGood = null; // ultima copia buena en memoria (sobrevive entre invocaciones "calientes")

exports.handler = async () => {
  try {
    const res = await fetch(API_URL, {
      headers: { 'Accept': 'application/vnd.github.raw', 'User-Agent': 'ar4mercados-flash-live' }
    });
    if (!res.ok) throw new Error('GitHub respondio ' + res.status);
    const text = await res.text();
    JSON.parse(text); // valida que sea JSON antes de servirlo y cachearlo
    lastGood = text;
    return respond(text);
  } catch (e) {
    if (lastGood) return respond(lastGood);
    try {
      const fallback = fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'flash.json'), 'utf8');
      return respond(fallback);
    } catch (e2) {
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: String(e.message || e) })
      };
    }
  }
};

function respond(body) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=15, stale-while-revalidate=60'
    },
    body
  };
}
