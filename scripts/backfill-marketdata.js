// AR4 Mercados — Rellena marketData en el contenido ya publicado.
//
// Las noticias e ideas anteriores al pipeline de datos reales no traen
// marketData, asi que el panel de indicadores del sitio caia al widget de
// TradingView, que se queda sin datos en los simbolos CFD. Este script les trae
// el dossier real de su instrumento usando el MISMO modulo que los generadores
// (_market-data.js), de modo que no hay dos implementaciones que puedan diverger.
//
// Importante: los indicadores son los de HOY, no los del dia en que se escribio
// la pieza. El panel lo dice con todas las letras ("cierre de la vela del
// <fecha>"), asi que no se presenta nada como si fuera de otra fecha: es la foto
// actual del instrumento del que hablaba la pieza.

const fs = require('fs');
const path = require('path');
const { buildDossier, TV_TO_YAHOO } = require('./_market-data');

const OBJETIVOS = [
  { archivo: 'noticias.json', nombre: 'noticias' },
  { archivo: 'ideas.json', nombre: 'ideas' }
];

async function rellenar(archivo, nombre) {
  const ruta = path.join(__dirname, '..', 'data', archivo);
  const lista = JSON.parse(fs.readFileSync(ruta, 'utf8'));

  const pendientes = lista.filter((x) => x.symbol && !x.marketData);
  const sinSymbol = lista.filter((x) => !x.symbol).length;
  console.log('\n== ' + nombre + ' ==');
  console.log('total: ' + lista.length + ' | ya con datos: ' +
    lista.filter((x) => x.marketData).length + ' | por rellenar: ' + pendientes.length +
    (sinSymbol ? ' | sin symbol (no aplica): ' + sinSymbol : ''));

  // Un dossier por instrumento, no por pieza: varias piezas comparten simbolo.
  const simbolos = [...new Set(pendientes.map((x) => x.symbol))];
  const cache = {};
  for (const sym of simbolos) {
    if (!TV_TO_YAHOO[sym]) {
      console.warn('  sin mapeo a Yahoo, se omite: ' + sym);
      continue;
    }
    try {
      cache[sym] = await buildDossier(sym);
      console.log('  OK ' + sym + ' -> precio ' + cache[sym].precio + ', RSI ' + cache[sym].rsi14);
    } catch (e) {
      console.warn('  FALLA ' + sym + ': ' + e.message);
    }
  }

  let hechos = 0;
  for (const x of pendientes) {
    if (cache[x.symbol]) { x.marketData = cache[x.symbol]; hechos++; }
  }
  fs.writeFileSync(ruta, JSON.stringify(lista, null, 2) + '\n');
  console.log('  rellenados: ' + hechos + ' de ' + pendientes.length);
  return hechos;
}

async function main() {
  let total = 0;
  for (const o of OBJETIVOS) total += await rellenar(o.archivo, o.nombre);
  console.log('\nTotal de piezas con indicadores nuevos: ' + total);
  if (!total) console.log('No habia nada que rellenar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
