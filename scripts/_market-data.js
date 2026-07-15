// AR4 Mercados — Datos de mercado reales para los generadores de contenido.
//
// Por que existe: los generadores escribian cifras "plausibles" inventadas por
// el modelo (precios, RSI, soportes, resultados). Este modulo trae datos reales
// de Yahoo (endpoint v8, sin autenticacion) y CALCULA los indicadores, para que
// el prompt reciba numeros verificables en vez de pedirle al modelo que los
// invente. Sin dependencias: Node 20 ya trae fetch.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

// Verificado 2026-07-15: los 29 simbolos devuelven datos reales.
const TV_TO_YAHOO = {
  'FX:EURUSD': 'EURUSD=X',
  'FX:GBPUSD': 'GBPUSD=X',
  'FX:USDJPY': 'USDJPY=X',
  'FX_IDC:USDMXN': 'USDMXN=X',
  'FX_IDC:USDCOP': 'USDCOP=X',
  'FX_IDC:USDCLP': 'USDCLP=X',
  'FX_IDC:USDARS': 'USDARS=X',
  'FX_IDC:USDBRL': 'USDBRL=X',
  'FX_IDC:USDPEN': 'USDPEN=X',
  'OANDA:XAUUSD': 'GC=F',
  'OANDA:XAGUSD': 'SI=F',
  'TVC:USOIL': 'CL=F',
  'TVC:UKOIL': 'BZ=F',
  'CAPITALCOM:DXY': 'DX-Y.NYB',
  'FOREXCOM:SPXUSD': '^GSPC',
  'FOREXCOM:NSXUSD': '^NDX',
  'BMFBOVESPA:IBOV': '^BVSP',
  'BITSTAMP:BTCUSD': 'BTC-USD',
  'COINBASE:ETHUSD': 'ETH-USD',
  'NASDAQ:AAPL': 'AAPL',
  'NASDAQ:MSFT': 'MSFT',
  'NASDAQ:NVDA': 'NVDA',
  'NASDAQ:AMZN': 'AMZN',
  'NASDAQ:GOOGL': 'GOOGL',
  'NASDAQ:META': 'META',
  'NYSE:JPM': 'JPM',
  'NYSE:VALE': 'VALE',
  'NYSE:PBR': 'PBR',
  'NYSE:MELI': 'MELI'
};

// Nombre legible para que el redactor no escriba "FX_IDC:USDPEN".
const TV_NAMES = {
  'FX:EURUSD': 'EUR/USD', 'FX:GBPUSD': 'GBP/USD', 'FX:USDJPY': 'USD/JPY',
  'FX_IDC:USDMXN': 'USD/MXN (peso mexicano)', 'FX_IDC:USDCOP': 'USD/COP (peso colombiano)',
  'FX_IDC:USDCLP': 'USD/CLP (peso chileno)', 'FX_IDC:USDARS': 'USD/ARS (peso argentino)',
  'FX_IDC:USDBRL': 'USD/BRL (real brasileno)', 'FX_IDC:USDPEN': 'USD/PEN (sol peruano)',
  'OANDA:XAUUSD': 'Oro (XAU/USD, futuro COMEX)', 'OANDA:XAGUSD': 'Plata (XAG/USD, futuro COMEX)',
  'TVC:USOIL': 'Petroleo WTI', 'TVC:UKOIL': 'Petroleo Brent',
  'CAPITALCOM:DXY': 'Indice dolar (DXY)',
  'FOREXCOM:SPXUSD': 'S&P 500', 'FOREXCOM:NSXUSD': 'Nasdaq 100', 'BMFBOVESPA:IBOV': 'Ibovespa (Brasil)',
  'BITSTAMP:BTCUSD': 'Bitcoin (BTC/USD)', 'COINBASE:ETHUSD': 'Ethereum (ETH/USD)',
  'NASDAQ:AAPL': 'Apple (AAPL)', 'NASDAQ:MSFT': 'Microsoft (MSFT)', 'NASDAQ:NVDA': 'NVIDIA (NVDA)',
  'NASDAQ:AMZN': 'Amazon (AMZN)', 'NASDAQ:GOOGL': 'Alphabet (GOOGL)', 'NASDAQ:META': 'Meta (META)',
  'NYSE:JPM': 'JPMorgan (JPM)', 'NYSE:VALE': 'Vale (VALE)', 'NYSE:PBR': 'Petrobras (PBR)',
  'NYSE:MELI': 'MercadoLibre (MELI)'
};

function decimalsFor(price) {
  const p = Math.abs(price);
  if (p < 10) return 4;
  if (p < 1000) return 2;
  return 2;
}

function fmt(price) {
  if (!Number.isFinite(price)) return null;
  return Number(price.toFixed(decimalsFor(price)));
}

async function fetchCandles(yahooSymbol, interval, range) {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(yahooSymbol) +
    '?interval=' + interval + '&range=' + range;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error('Yahoo respondio ' + res.status + ' para ' + yahooSymbol);
  const data = await res.json();
  const result = data && data.chart && data.chart.result && data.chart.result[0];
  if (!result || !result.timestamp) throw new Error('Sin datos para ' + yahooSymbol);
  const q = result.indicators.quote[0];
  const candles = [];
  for (let i = 0; i < result.timestamp.length; i++) {
    if (q.open[i] == null || q.high[i] == null || q.low[i] == null || q.close[i] == null) continue;
    candles.push({
      time: result.timestamp[i], open: q.open[i], high: q.high[i], low: q.low[i], close: q.close[i]
    });
  }
  if (candles.length < 30) throw new Error('Muy pocas velas para ' + yahooSymbol);
  return { candles, meta: result.meta };
}

// RSI de Wilder (14) — el estandar, el mismo que usa TradingView por defecto.
function rsi(closes, period) {
  if (closes.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  let avgGain = gain / period, avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

function sma(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// ATR de Wilder (14): volatilidad real, util para hablar de rango diario.
function atr(candles, period) {
  if (candles.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  let a = trs.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < trs.length; i++) a = (a * (period - 1) + trs[i]) / period;
  return a;
}

// Soportes/resistencias desde pivotes REALES del grafico (no inventados):
// un pivote alto es una vela cuyo maximo supera al de las `k` velas de cada lado.
function pivots(candles, k) {
  const highs = [], lows = [];
  for (let i = k; i < candles.length - k; i++) {
    let isHigh = true, isLow = true;
    for (let j = i - k; j <= i + k; j++) {
      if (j === i) continue;
      if (candles[j].high >= candles[i].high) isHigh = false;
      if (candles[j].low <= candles[i].low) isLow = false;
    }
    if (isHigh) highs.push(candles[i].high);
    if (isLow) lows.push(candles[i].low);
  }
  return { highs, lows };
}

// Agrupa niveles cercanos (dentro de tol%) para no listar tres veces el mismo.
function cluster(levels, tolPct) {
  const sorted = [...levels].sort((a, b) => a - b);
  const out = [];
  for (const lv of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(lv - last) / last * 100 < tolPct) {
      out[out.length - 1] = (last + lv) / 2;
    } else {
      out.push(lv);
    }
  }
  return out;
}

function supportsResistances(candles, price) {
  const { highs, lows } = pivots(candles, 3);
  const sup = cluster(lows, 0.4).filter((l) => l < price).sort((a, b) => b - a).slice(0, 3);
  const res = cluster(highs, 0.4).filter((l) => l > price).sort((a, b) => a - b).slice(0, 3);
  return { soportes: sup.map(fmt), resistencias: res.map(fmt) };
}

// Patron de la ultima vela, detectado de verdad sobre los OHLC reales.
function candlePattern(candles) {
  const c = candles[candles.length - 1];
  const p = candles[candles.length - 2];
  if (!c || !p) return null;
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range <= 0) return null;
  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;
  const pBody = Math.abs(p.close - p.open);

  if (body / range < 0.1) return 'doji (apertura y cierre casi iguales: indecision)';
  if (c.high < p.high && c.low > p.low) return 'inside bar (rango contenido dentro de la vela previa: compresion)';
  if (c.close > c.open && p.close < p.open && c.close >= p.open && c.open <= p.close && body > pBody) {
    return 'envolvente alcista (el cuerpo cubre por completo el de la vela bajista previa)';
  }
  if (c.close < c.open && p.close > p.open && c.close <= p.open && c.open >= p.close && body > pBody) {
    return 'envolvente bajista (el cuerpo cubre por completo el de la vela alcista previa)';
  }
  if (lower > body * 2 && upper < body) return 'martillo (mecha inferior larga: rechazo de precios bajos)';
  if (upper > body * 2 && lower < body) return 'estrella fugaz (mecha superior larga: rechazo de precios altos)';
  if (body / range > 0.7) return c.close > c.open ? 'vela alcista de cuerpo amplio' : 'vela bajista de cuerpo amplio';
  return c.close > c.open ? 'vela alcista sin patron destacable' : 'vela bajista sin patron destacable';
}

function pct(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

/**
 * Dossier de datos REALES de un instrumento. Todo lo que devuelve sale de las
 * velas de Yahoo o se calcula con ellas. Nada aqui es estimado ni inventado.
 */
async function buildDossier(tvSymbol) {
  const ysym = TV_TO_YAHOO[tvSymbol];
  if (!ysym) throw new Error('Simbolo sin mapeo a Yahoo: ' + tvSymbol);

  const { candles, meta } = await fetchCandles(ysym, '1d', '2y');
  const closes = candles.map((c) => c.close);
  const price = meta.regularMarketPrice != null ? meta.regularMarketPrice : closes[closes.length - 1];
  // OJO: meta.chartPreviousClose es el cierre ANTERIOR AL RANGO pedido (con
  // range=2y devuelve el de hace dos anios), no el de la sesion previa. Usarlo
  // daba variaciones diarias absurdas (oro +67,9%). El cierre de ayer es la
  // penultima vela diaria.
  const prevClose = closes[closes.length - 2];

  const last = candles[candles.length - 1];
  const ma50 = sma(closes, 50);
  const ma200 = sma(closes, 200);
  const a14 = atr(candles, 14);
  const y1 = candles.slice(-252);
  const hi52 = Math.max(...y1.map((c) => c.high));
  const lo52 = Math.min(...y1.map((c) => c.low));
  const sr = supportsResistances(candles.slice(-180), price);
  const r = rsi(closes, 14);

  return {
    symbol: tvSymbol,
    nombre: TV_NAMES[tvSymbol] || tvSymbol,
    fuente: 'Yahoo Finance (' + ysym + ')',
    fechaUltimaVela: new Date(last.time * 1000).toISOString().slice(0, 10),
    precio: fmt(price),
    cierreAnterior: fmt(prevClose),
    variacionDiaPct: pct(price, prevClose),
    variacionSemanaPct: closes.length > 5 ? pct(price, closes[closes.length - 6]) : null,
    variacionMesPct: closes.length > 21 ? pct(price, closes[closes.length - 22]) : null,
    variacionAnioPct: closes.length > 252 ? pct(price, closes[closes.length - 253]) : null,
    rangoDiaReal: { minimo: fmt(last.low), maximo: fmt(last.high) },
    rsi14: r,
    lecturaRsi: r == null ? null : (r >= 70 ? 'sobrecompra' : r <= 30 ? 'sobreventa' : 'neutral'),
    media50: fmt(ma50),
    media200: fmt(ma200),
    posicionVsMedia50: ma50 ? (price > ma50 ? 'por encima' : 'por debajo') : null,
    posicionVsMedia200: ma200 ? (price > ma200 ? 'por encima' : 'por debajo') : null,
    cruceMedias: (ma50 && ma200) ? (ma50 > ma200 ? 'media 50 por encima de la 200 (estructura alcista)' : 'media 50 por debajo de la 200 (estructura bajista)') : null,
    atr14: fmt(a14),
    maximo52sem: fmt(hi52),
    minimo52sem: fmt(lo52),
    distanciaAMaximo52semPct: pct(price, hi52),
    distanciaAMinimo52semPct: pct(price, lo52),
    soportes: sr.soportes,
    resistencias: sr.resistencias,
    patronUltimaVela: candlePattern(candles)
  };
}

/** Bloque de texto listo para inyectar en el prompt. */
function dossierToPrompt(d) {
  const L = [];
  L.push('DATOS REALES DE MERCADO — ' + d.nombre + ' (' + d.symbol + ')');
  L.push('Fuente: ' + d.fuente + ' | Ultima vela diaria cerrada: ' + d.fechaUltimaVela);
  L.push('');
  L.push('Precio actual: ' + d.precio);
  L.push('Cierre anterior: ' + d.cierreAnterior + ' | Variacion del dia: ' + d.variacionDiaPct + '%');
  L.push('Rango real de la ultima sesion: minimo ' + d.rangoDiaReal.minimo + ' / maximo ' + d.rangoDiaReal.maximo);
  L.push('Variacion 1 semana: ' + d.variacionSemanaPct + '% | 1 mes: ' + d.variacionMesPct + '% | 1 anio: ' + d.variacionAnioPct + '%');
  L.push('Maximo 52 semanas: ' + d.maximo52sem + ' (a ' + d.distanciaAMaximo52semPct + '% del precio)');
  L.push('Minimo 52 semanas: ' + d.minimo52sem + ' (a ' + d.distanciaAMinimo52semPct + '% del precio)');
  L.push('');
  L.push('RSI(14) diario: ' + d.rsi14 + ' -> ' + d.lecturaRsi);
  L.push('Media movil 50: ' + d.media50 + ' (precio ' + d.posicionVsMedia50 + ')');
  L.push('Media movil 200: ' + d.media200 + ' (precio ' + d.posicionVsMedia200 + ')');
  L.push('Estructura de medias: ' + d.cruceMedias);
  L.push('ATR(14) (rango medio diario): ' + d.atr14);
  L.push('Patron de la ultima vela: ' + d.patronUltimaVela);
  L.push('');
  L.push('Soportes reales (pivotes del grafico, de mas cercano a mas lejano): ' + (d.soportes.length ? d.soportes.join(' / ') : 'sin pivote claro por debajo'));
  L.push('Resistencias reales (pivotes del grafico): ' + (d.resistencias.length ? d.resistencias.join(' / ') : 'sin pivote claro por encima'));
  return L.join('\n');
}

module.exports = { TV_TO_YAHOO, TV_NAMES, buildDossier, dossierToPrompt, fetchCandles };
