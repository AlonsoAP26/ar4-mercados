// AR4 Mercados — Dossier de mercado (datos reales de Yahoo Finance).
// Descarga velas diarias y calcula, con matemática estándar y verificable:
// tendencia (precio vs medias), RSI(14) Wilder, ATR(14), soportes/resistencias
// reales (pivotes) y máximos/mínimos de 52 semanas. NO predice ni da señales:
// solo describe lo que el precio ha hecho. Lo consume el AR4 AI Market Copilot.

exports.handler = async (event) => {
  const symbol = (event.queryStringParameters && event.queryStringParameters.symbol || '').trim();
  if (!symbol) return json(400, { success: false, error: 'Falta el símbolo.' });

  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(symbol) + '?interval=1d&range=1y';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return json(502, { success: false, error: 'Fuente no disponible (' + res.status + ').' });
    const data = await res.json();
    const r = data && data.chart && data.chart.result && data.chart.result[0];
    const meta = r && r.meta;
    const q = r && r.indicators && r.indicators.quote && r.indicators.quote[0];
    if (!meta || !q) return json(404, { success: false, error: 'Sin datos para ese símbolo.' });

    // Series limpias (Yahoo mete nulls en días sin negociación)
    const rows = [];
    const n = (q.close || []).length;
    for (let i = 0; i < n; i++) {
      const c = q.close[i], h = q.high[i], l = q.low[i], o = q.open[i], v = q.volume ? q.volume[i] : null;
      if (c == null || h == null || l == null) continue;
      rows.push({ o: o == null ? c : o, h, l, c, v: (v == null ? 0 : v) });
    }
    if (rows.length < 30) return json(422, { success: false, error: 'Historial insuficiente para el análisis.' });

    const round = (v) => (v == null ? null : Number(v.toFixed(6)));
    const closes = rows.map((x) => x.c);
    const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : closes[closes.length - 1];
    const prevClose = closes.length >= 2 ? closes[closes.length - 2] : null; // penúltima vela (no chartPreviousClose)
    const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : null;

    const sma = (arr, p) => { if (arr.length < p) return null; let s = 0; for (let i = arr.length - p; i < arr.length; i++) s += arr[i]; return s / p; };
    const sma50 = sma(closes, 50);
    const sma200 = sma(closes, 200);
    const sma50_prev = closes.length > 55 ? sma(closes.slice(0, -5), 50) : null;

    // RSI(14) de Wilder
    let rsi = null;
    if (closes.length > 15) {
      let gain = 0, loss = 0;
      for (let i = 1; i <= 14; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) gain += d; else loss -= d; }
      let ag = gain / 14, al = loss / 14;
      for (let i = 15; i < closes.length; i++) {
        const d = closes[i] - closes[i - 1];
        ag = (ag * 13 + (d > 0 ? d : 0)) / 14;
        al = (al * 13 + (d < 0 ? -d : 0)) / 14;
      }
      rsi = al === 0 ? 100 : 100 - (100 / (1 + ag / al));
    }

    // ATR(14) de Wilder
    let atr = null;
    if (rows.length > 15) {
      const trs = [];
      for (let i = 1; i < rows.length; i++) {
        const cur = rows[i], prev = rows[i - 1];
        trs.push(Math.max(cur.h - cur.l, Math.abs(cur.h - prev.c), Math.abs(cur.l - prev.c)));
      }
      let a = 0; for (let i = 0; i < 14; i++) a += trs[i]; a /= 14;
      for (let i = 14; i < trs.length; i++) a = (a * 13 + trs[i]) / 14;
      atr = a;
    }

    // Máx/mín de 52 semanas
    const hi52 = Math.max.apply(null, rows.map((x) => x.h));
    const lo52 = Math.min.apply(null, rows.map((x) => x.l));

    // Soportes / resistencias: pivotes de 3 barras sobre las últimas ~90 velas
    const look = rows.slice(-90);
    const pivHigh = [], pivLow = [];
    for (let i = 2; i < look.length - 2; i++) {
      const h = look[i].h, l = look[i].l;
      if (h > look[i - 1].h && h > look[i - 2].h && h > look[i + 1].h && h > look[i + 2].h) pivHigh.push(h);
      if (l < look[i - 1].l && l < look[i - 2].l && l < look[i + 1].l && l < look[i + 2].l) pivLow.push(l);
    }
    const uniqClose = (arr, tol) => { // agrupa niveles cercanos
      const s = arr.slice().sort((a, b) => a - b), out = [];
      s.forEach((v) => { if (!out.length || Math.abs(v - out[out.length - 1]) / v > tol) out.push(v); });
      return out;
    };
    const supports = uniqClose(pivLow.filter((v) => v < price), 0.004).slice(-3).reverse(); // los más cercanos por debajo
    const resistances = uniqClose(pivHigh.filter((v) => v > price), 0.004).slice(0, 3);

    // Clasificación de tendencia (descriptiva, no predictiva)
    let trend = 'lateral', trendWhy = '';
    if (sma50 && sma200) {
      if (price > sma50 && sma50 > sma200) { trend = 'alcista'; trendWhy = 'El precio está por encima de la media de 50 y esta por encima de la de 200.'; }
      else if (price < sma50 && sma50 < sma200) { trend = 'bajista'; trendWhy = 'El precio está por debajo de la media de 50 y esta por debajo de la de 200.'; }
      else { trend = 'mixta'; trendWhy = 'El precio y las medias no están alineados: sin dirección clara.'; }
    } else if (sma50) {
      trend = price > sma50 ? 'alcista' : 'bajista';
      trendWhy = 'Respecto a la media de 50 sesiones (aún no hay 200 sesiones de histórico).';
    }
    const slope50 = (sma50 && sma50_prev) ? (sma50 > sma50_prev ? 'subiendo' : 'bajando') : null;

    // ── Volumen ──────────────────────────────────────────────────────────
    // (Forex e índices spot suelen NO traer volumen en Yahoo: se marca sin datos.)
    const vols = rows.map((x) => x.v);
    const hasVol = vols.filter((v) => v > 0).length >= 20;
    let volume = { hasData: false };
    if (hasVol) {
      const last20 = vols.slice(-20);
      const avg20 = last20.reduce((a, b) => a + b, 0) / last20.length;
      const cur = vols[vols.length - 1];
      volume = {
        hasData: true,
        current: Math.round(cur),
        avg20: Math.round(avg20),
        relPct: avg20 > 0 ? Number(((cur / avg20) * 100).toFixed(0)) : null
      };
    }

    // ── Presión de volumen (aproximación de flujo, NO order flow real) ─────
    // Reparte el volumen de las últimas 20 velas entre alcistas (cierre≥apertura)
    // y bajistas. Es un proxy de acumulación/distribución, no datos de tick/DOM.
    let flow = { hasData: false };
    if (hasVol) {
      let up = 0, dn = 0;
      rows.slice(-20).forEach((r) => { if (r.c >= r.o) up += r.v; else dn += r.v; });
      const tot = up + dn;
      if (tot > 0) {
        const buyPct = (up / tot) * 100;
        flow = {
          hasData: true,
          buyPct: Number(buyPct.toFixed(0)),
          bias: buyPct >= 58 ? 'compradora' : buyPct <= 42 ? 'vendedora' : 'equilibrada'
        };
      }
    }

    // ── Bloques de órdenes (Order Blocks) ──────────────────────────────────
    // La última vela contraria justo antes de un movimiento fuerte (> 1.2 ATR en
    // 3 velas). Es un patrón definido sobre velas reales, no una predicción: marca
    // la ZONA de precio donde se originó el impulso, que suele actuar como imán.
    let ob = { bull: null, bear: null };
    if (atr) {
      for (let i = rows.length - 4; i >= Math.max(2, rows.length - 45); i--) {
        const c = rows[i], after = rows[i + 3];
        if (!ob.bull && c.c < c.o && (after.c - c.c) > atr * 1.2 && c.l < price) {
          ob.bull = { low: round(c.l), high: round(c.h) };
        }
        if (!ob.bear && c.c > c.o && (c.c - after.c) > atr * 1.2 && c.h > price) {
          ob.bear = { low: round(c.l), high: round(c.h) };
        }
        if (ob.bull && ob.bear) break;
      }
    }

    // Lectura de momentum (descriptiva)
    let rsiRead = 'neutral';
    if (rsi != null) rsiRead = rsi >= 70 ? 'sobrecompra' : rsi <= 30 ? 'sobreventa' : 'neutral';

    return json(200, {
      success: true,
      symbol,
      fuente: 'Yahoo Finance · velas diarias (1 año)',
      fecha: new Date().toISOString(),
      price: round(price),
      prevClose: round(prevClose),
      changePct: changePct == null ? null : Number(changePct.toFixed(2)),
      sma50: round(sma50),
      sma200: round(sma200),
      slope50,
      rsi14: rsi == null ? null : Number(rsi.toFixed(1)),
      rsiRead,
      atr14: round(atr),
      atrPct: (atr && price) ? Number(((atr / price) * 100).toFixed(2)) : null,
      hi52: round(hi52),
      lo52: round(lo52),
      distHi52pct: Number((((hi52 - price) / price) * 100).toFixed(1)),
      distLo52pct: Number((((price - lo52) / price) * 100).toFixed(1)),
      supports: supports.map(round),
      resistances: resistances.map(round),
      trend,
      trendWhy,
      volume,
      flow,
      orderBlocks: ob
    }, { 'Cache-Control': 'public, max-age=300' });
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
