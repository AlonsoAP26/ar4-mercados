// AR4 Mercados — Suite profesional de gestión de riesgo.
// Arquitectura modular: base de datos de instrumentos, servicio de precios,
// motor de cálculo, estado (localStorage) y renderizado. Cálculo en vivo.
(function () {
  const mount = document.getElementById('riskSuite');
  if (!mount) return;

  // ============================ DATOS ============================
  // valuePerPointPerLot = dinero (USD) por cada movimiento de 1.0 en el precio, por 1 lote/contrato estándar.
  // pipSize = tamaño de 1 pip en precio. avgRangePips = rango diario típico (referencial) para alertas.
  const INSTRUMENTS = [
    // Forex mayores
    { id: 'EURUSD', name: 'Euro / Dólar', cat: 'Forex', yahoo: 'EURUSD=X', icon: '🇪🇺🇺🇸', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'USD', hours: '24/5', leverage: 30, spread: 0.2, avgRangePips: 80 },
    { id: 'GBPUSD', name: 'Libra / Dólar', cat: 'Forex', yahoo: 'GBPUSD=X', icon: '🇬🇧🇺🇸', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'USD', hours: '24/5', leverage: 30, spread: 0.5, avgRangePips: 100 },
    { id: 'USDJPY', name: 'Dólar / Yen', cat: 'Forex', yahoo: 'USDJPY=X', icon: '🇺🇸🇯🇵', decimals: 3, pipSize: 0.01, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'JPY', hours: '24/5', leverage: 30, spread: 0.4, avgRangePips: 90 },
    { id: 'AUDUSD', name: 'Dólar Australiano / Dólar', cat: 'Forex', yahoo: 'AUDUSD=X', icon: '🇦🇺🇺🇸', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'USD', hours: '24/5', leverage: 30, spread: 0.4, avgRangePips: 70 },
    { id: 'USDCAD', name: 'Dólar / Dólar Canadiense', cat: 'Forex', yahoo: 'USDCAD=X', icon: '🇺🇸🇨🇦', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'CAD', hours: '24/5', leverage: 30, spread: 0.6, avgRangePips: 80 },
    { id: 'USDCHF', name: 'Dólar / Franco Suizo', cat: 'Forex', yahoo: 'USDCHF=X', icon: '🇺🇸🇨🇭', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'CHF', hours: '24/5', leverage: 30, spread: 0.6, avgRangePips: 70 },
    // Forex LatAm
    { id: 'USDMXN', name: 'Dólar / Peso Mexicano', cat: 'Forex', yahoo: 'USDMXN=X', icon: '🇺🇸🇲🇽', decimals: 4, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'MXN', hours: '24/5', leverage: 20, spread: 3, avgRangePips: 1500 },
    { id: 'USDBRL', name: 'Dólar / Real Brasileño', cat: 'Forex', yahoo: 'USDBRL=X', icon: '🇺🇸🇧🇷', decimals: 4, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'BRL', hours: '24/5', leverage: 20, spread: 4, avgRangePips: 500 },
    { id: 'USDCLP', name: 'Dólar / Peso Chileno', cat: 'Forex', yahoo: 'USDCLP=X', icon: '🇺🇸🇨🇱', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 100000, contractSize: 100000, quote: 'CLP', hours: '24/5', leverage: 20, spread: 5, avgRangePips: 800 },
    // Metales
    { id: 'XAUUSD', name: 'Oro / Dólar', cat: 'Materias primas', yahoo: 'GC=F', icon: '🥇', decimals: 2, pipSize: 0.1, valuePerPointPerLot: 100, contractSize: 100, quote: 'USD', hours: '24/5', leverage: 20, spread: 0.3, avgRangePips: 250 },
    { id: 'XAGUSD', name: 'Plata / Dólar', cat: 'Materias primas', yahoo: 'SI=F', icon: '🥈', decimals: 3, pipSize: 0.01, valuePerPointPerLot: 5000, contractSize: 5000, quote: 'USD', hours: '24/5', leverage: 20, spread: 2, avgRangePips: 200 },
    { id: 'USOIL', name: 'Petróleo WTI', cat: 'Materias primas', yahoo: 'CL=F', icon: '🛢️', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1000, contractSize: 1000, quote: 'USD', hours: '24/5', leverage: 10, spread: 3, avgRangePips: 200 },
    // Índices
    { id: 'NAS100', name: 'Nasdaq 100', cat: 'Índices', yahoo: '^NDX', icon: '🇺🇸📊', decimals: 1, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/5', leverage: 20, spread: 1, avgRangePips: 250 },
    { id: 'US30', name: 'Dow Jones 30', cat: 'Índices', yahoo: '^DJI', icon: '🇺🇸📊', decimals: 1, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/5', leverage: 20, spread: 2, avgRangePips: 350 },
    { id: 'SP500', name: 'S&P 500', cat: 'Índices', yahoo: '^GSPC', icon: '🇺🇸📊', decimals: 1, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/5', leverage: 20, spread: 0.5, avgRangePips: 60 },
    { id: 'GER40', name: 'DAX 40 (Alemania)', cat: 'Índices', yahoo: '^GDAXI', icon: '🇩🇪📊', decimals: 1, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'EUR', hours: '24/5', leverage: 20, spread: 1, avgRangePips: 200 },
    { id: 'UK100', name: 'FTSE 100 (R. Unido)', cat: 'Índices', yahoo: '^FTSE', icon: '🇬🇧📊', decimals: 1, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'GBP', hours: '24/5', leverage: 20, spread: 1, avgRangePips: 90 },
    // Cripto
    { id: 'BTCUSD', name: 'Bitcoin / Dólar', cat: 'Cripto', yahoo: 'BTC-USD', icon: '₿', decimals: 2, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/7', leverage: 2, spread: 20, avgRangePips: 2500 },
    { id: 'ETHUSD', name: 'Ethereum / Dólar', cat: 'Cripto', yahoo: 'ETH-USD', icon: 'Ξ', decimals: 2, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/7', leverage: 2, spread: 2, avgRangePips: 150 },
    { id: 'SOLUSD', name: 'Solana / Dólar', cat: 'Cripto', yahoo: 'SOL-USD', icon: '◎', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: '24/7', leverage: 2, spread: 0.1, avgRangePips: 800 },
    // Acciones
    { id: 'AAPL', name: 'Apple Inc.', cat: 'Acciones', yahoo: 'AAPL', icon: '🍎', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.02, avgRangePips: 400 },
    { id: 'TSLA', name: 'Tesla Inc.', cat: 'Acciones', yahoo: 'TSLA', icon: '🚗', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.03, avgRangePips: 900 },
    { id: 'NVDA', name: 'NVIDIA Corp.', cat: 'Acciones', yahoo: 'NVDA', icon: '🎮', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.02, avgRangePips: 500 },
    { id: 'META', name: 'Meta Platforms', cat: 'Acciones', yahoo: 'META', icon: '📘', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.03, avgRangePips: 900 },
    { id: 'AMZN', name: 'Amazon.com', cat: 'Acciones', yahoo: 'AMZN', icon: '📦', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.02, avgRangePips: 300 },
    { id: 'MSFT', name: 'Microsoft', cat: 'Acciones', yahoo: 'MSFT', icon: '🪟', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, quote: 'USD', hours: 'Bolsa', leverage: 5, spread: 0.02, avgRangePips: 400 }
  ];
  const UNIT_LABEL = { Forex: 'lotes', 'Materias primas': 'lotes', 'Índices': 'contratos', Cripto: 'unidades', Acciones: 'acciones' };

  const CURRENCIES = ['USD', 'EUR', 'PEN', 'MXN', 'CLP', 'COP', 'ARS', 'BRL'];
  const CURRENCY_YAHOO = { EUR: 'EURUSD=X', PEN: 'USDPEN=X', MXN: 'USDMXN=X', CLP: 'USDCLP=X', COP: 'USDCOP=X', ARS: 'USDARS=X', BRL: 'USDBRL=X' };

  // Iconos SVG monocromáticos (trazo dorado por CSS). Sustituyen a los emojis
  // para dar una estética seria y profesional coherente en toda la suite.
  const SVG = {
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
    ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9v5M12 17h.01"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/></svg>'
  };
  // Glifo por categoría de instrumento (reemplaza banderas/emojis).
  const CAT_SVG = {
    Forex: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    'Materias primas': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 5-3 2-3-2z"/><path d="M5 10l7 4 7-4M5 15l7 4 7-4"/></svg>',
    'Índices': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M9 20V6M14 20v-8M19 20V4"/></svg>',
    Cripto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 8h4.5a2.5 2.5 0 0 1 0 5H9zM9 13h5a2.5 2.5 0 0 1 0 5H9zM9 6v12M11 5v2M11 17v2"/></svg>',
    Acciones: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V6l7-3v18M11 21V9l7 3v9M3 21h18M8 8v0M8 12v0M8 16v0"/></svg>'
  };
  function insGlyph(ins) { return `<span class="rs-glyph">${CAT_SVG[ins.cat] || CAT_SVG.Forex}</span>`; }

  const TEMPLATES = {
    scalping: { icon: SVG.bolt, label: 'Scalping', desc: 'Operaciones muy cortas · stop ajustado', risk: 0.5, slPips: 10, rr: 1.5 },
    day: { icon: SVG.sun, label: 'Day Trading', desc: 'Abrir y cerrar en el día', risk: 1, slPips: 30, rr: 2 },
    swing: { icon: SVG.wave, label: 'Swing', desc: 'Operaciones de días a semanas', risk: 2, slPips: 120, rr: 3 },
    prop: { icon: SVG.shield, label: 'Prop Firm', desc: 'Riesgo bajo para pasar el reto', risk: 0.5, slPips: 40, rr: 2 }
  };

  const PROP_FIRMS = {
    none: null,
    ftmo: { label: 'FTMO', dailyDD: 5, maxDD: 10, target: 10, minDays: 4 },
    the5ers: { label: 'The5ers', dailyDD: 5, maxDD: 6, target: 8, minDays: 3 },
    fundednext: { label: 'FundedNext', dailyDD: 5, maxDD: 10, target: 8, minDays: 5 },
    fundingpips: { label: 'FundingPips', dailyDD: 4, maxDD: 6, target: 8, minDays: 3 },
    alphacapital: { label: 'Alpha Capital', dailyDD: 5, maxDD: 10, target: 10, minDays: 0 }
  };

  // ============================ ESTADO ============================
  const STORE_KEY = 'ar4RiskSuite_v1';
  const HIST_KEY = 'ar4RiskHistory_v1';
  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; } }
  function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
  function loadHistory() { try { return JSON.parse(localStorage.getItem(HIST_KEY)) || []; } catch (e) { return []; } }
  function saveHistory(h) { try { localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 12))); } catch (e) {} }

  const saved = loadStore();
  const state = {
    instrumentId: saved.instrumentId || 'EURUSD',
    capital: saved.capital != null ? saved.capital : 1000,
    currency: saved.currency || 'USD',
    riskPct: saved.riskPct != null ? saved.riskPct : 1,
    entry: null, sl: null, tp: null,
    slMode: 'price', tpMode: 'price', // price | pips
    slPips: 30, tpPips: 60,
    direction: 'long',
    propFirm: saved.propFirm || 'none',
    pro: !!saved.pro,
    commission: saved.commission || 0, swap: saved.swap || 0,
    fxRate: 1 // USD -> currency
  };

  function currentInstrument() { return INSTRUMENTS.find((i) => i.id === state.instrumentId) || INSTRUMENTS[0]; }

  function persist() {
    saveStore({ instrumentId: state.instrumentId, capital: state.capital, currency: state.currency, riskPct: state.riskPct, propFirm: state.propFirm, pro: state.pro, commission: state.commission, swap: state.swap });
  }

  // ============================ SERVICIOS ============================
  async function fetchPrice(yahoo) {
    const res = await fetch('/.netlify/functions/market-price?symbol=' + encodeURIComponent(yahoo));
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Sin precio');
    return data;
  }
  async function refreshFxRate() {
    if (state.currency === 'USD') { state.fxRate = 1; return; }
    try { const d = await fetchPrice(CURRENCY_YAHOO[state.currency]); if (d && d.price) state.fxRate = d.price; }
    catch (e) { state.fxRate = 1; }
  }

  // ============================ MOTOR DE CÁLCULO ============================
  function num(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
  function fmt(n, d) { if (n == null || !isFinite(n)) return '—'; return Number(n).toLocaleString('es', { minimumFractionDigits: d != null ? d : 2, maximumFractionDigits: d != null ? d : 2 }); }

  function calc() {
    const ins = currentInstrument();
    const entry = num(state.entry);
    let sl = num(state.sl), tp = num(state.tp);
    // Sincronizar pips -> precio cuando el modo es pips
    if (entry != null) {
      if (state.slMode === 'pips' && state.slPips != null) {
        sl = state.direction === 'long' ? entry - state.slPips * ins.pipSize : entry + state.slPips * ins.pipSize;
      }
      if (state.tpMode === 'pips' && state.tpPips != null) {
        tp = state.direction === 'long' ? entry + state.tpPips * ins.pipSize : entry - state.tpPips * ins.pipSize;
      }
    }
    const capitalUSD = state.capital / state.fxRate; // capital en USD
    const riskAmountUSD = capitalUSD * (state.riskPct / 100);
    if (entry == null || sl == null || entry === sl) return { ins, entry, sl, tp, valid: false, riskAmountUSD };

    const stopDist = Math.abs(entry - sl);
    const lots = riskAmountUSD / (stopDist * ins.valuePerPointPerLot);
    const stopPips = stopDist / ins.pipSize;
    const pipValueUSD = lots * ins.pipSize * ins.valuePerPointPerLot; // valor por pip de la posición
    const notionalUSD = lots * ins.contractSize * entry;
    const marginUSD = notionalUSD / (ins.leverage || 1);
    const distancePct = (stopDist / entry) * 100;

    let rr = null, rewardDist = null, tpPips = null, profitUSD = null;
    if (tp != null && tp !== entry) {
      rewardDist = Math.abs(tp - entry);
      rr = rewardDist / stopDist;
      tpPips = rewardDist / ins.pipSize;
      profitUSD = lots * rewardDist * ins.valuePerPointPerLot;
    }
    const commissionUSD = state.pro ? (state.commission || 0) * lots : 0;

    return {
      ins, entry, sl, tp, valid: true, direction: state.direction,
      riskAmountUSD, riskAmount: riskAmountUSD * state.fxRate,
      lots, stopDist, stopPips, pipValueUSD, notionalUSD, marginUSD, distancePct,
      rr, rewardDist, tpPips, profitUSD, profit: profitUSD != null ? profitUSD * state.fxRate : null,
      commissionUSD, tickValueUSD: ins.pipSize * ins.valuePerPointPerLot
    };
  }

  function buildAlerts(r) {
    const a = [];
    if (state.riskPct > 2) a.push({ t: 'danger', m: `Estás arriesgando ${state.riskPct}% por operación. Lo recomendado es 1-2% máximo.` });
    if (r.valid && r.rr != null && r.rr < 1) a.push({ t: 'danger', m: `Tu relación riesgo/beneficio es 1:${r.rr.toFixed(2)} (menor a 1:1). Necesitarías acertar más de la mitad de las veces solo para no perder.` });
    if (r.valid && r.stopPips < r.ins.avgRangePips * 0.05) a.push({ t: 'warn', m: `Tu stop (${Math.round(r.stopPips)} pips) es muy corto frente al rango diario típico de ${r.ins.id} (~${r.ins.avgRangePips} pips). Podría saltar por ruido de mercado.` });
    if (r.valid && r.marginUSD > r.riskAmountUSD * 25) a.push({ t: 'warn', m: 'El tamaño de posición requiere un margen elevado frente a lo que arriesgas. Revisa tu apalancamiento.' });
    // Prop firm
    const pf = PROP_FIRMS[state.propFirm];
    if (pf && r.valid) {
      const capUSD = state.capital / state.fxRate;
      const lossPctOfAccount = (r.riskAmountUSD / capUSD) * 100;
      if (lossPctOfAccount > pf.dailyDD) a.push({ t: 'danger', m: `${pf.label}: esta operación arriesga ${lossPctOfAccount.toFixed(1)}% de la cuenta, por encima del límite de pérdida diaria (${pf.dailyDD}%).` });
      else if (lossPctOfAccount > pf.dailyDD / 2) a.push({ t: 'warn', m: `${pf.label}: cuidado, esta operación consume ${lossPctOfAccount.toFixed(1)}% de tu margen de pérdida diaria (${pf.dailyDD}%).` });
    }
    return a;
  }

  // ============================ RENDER ============================
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  function shell() {
    return `
      <div class="rs-dashboard" id="rsDashboard"></div>

      <div class="rs-howto">
        <div class="rs-howto-head">${SVG.help}<strong>¿Cómo se usa esta suite?</strong></div>
        <ol class="rs-howto-steps">
          <li><b>1.</b> Busca tu mercado (EUR, oro, BTC, Nasdaq, Apple…). El precio se detecta solo.</li>
          <li><b>2.</b> Escribe tu <b>capital</b> y el <b>% que arriesgas</b> por operación (ideal 1–2%).</li>
          <li><b>3.</b> Elige dirección y coloca <b>entrada, stop y objetivo</b> (o usa una plantilla).</li>
          <li><b>4.</b> La suite calcula tu <b>tamaño de posición</b> exacto para no pasarte de riesgo.</li>
        </ol>
      </div>

      <div class="rs-grid">
        <div class="rs-left">
          <div class="rs-panel">
            <label class="rs-lbl">1 · Selecciona el mercado</label>
            <div class="rs-search-wrap">
              <input type="text" id="rsSearch" class="rs-search" placeholder="Escribe: EUR, oro, BTC, Nasdaq, Apple..." autocomplete="off">
              <div class="rs-suggestions" id="rsSuggestions" hidden></div>
            </div>
            <div class="rs-selected" id="rsSelected"></div>
          </div>

          <div class="rs-panel">
            <div class="rs-price-row" id="rsPriceRow"><span class="rs-muted">Selecciona un instrumento para ver su precio.</span></div>
          </div>

          <div class="rs-panel">
            <div class="rs-templates">
              <span class="rs-lbl" style="margin:0;">2 · Plantillas rápidas <span class="rs-lbl-hint">— rellenan riesgo, stop y objetivo por ti</span></span>
              <div class="rs-tpl-grid">
                ${Object.keys(TEMPLATES).map((k) => `<button class="rs-tpl" data-tpl="${k}"><span class="rs-tpl-ic">${TEMPLATES[k].icon}</span><span class="rs-tpl-txt"><strong>${TEMPLATES[k].label}</strong><em>${TEMPLATES[k].desc}</em></span></button>`).join('')}
              </div>
            </div>

            <div class="rs-fields">
              <div class="rs-field rs-field-2">
                <label>Capital</label>
                <div class="rs-inline">
                  <input type="number" id="rsCapital" step="any" value="${state.capital}">
                  <select id="rsCurrency">${CURRENCIES.map((c) => `<option ${c === state.currency ? 'selected' : ''}>${c}</option>`).join('')}</select>
                </div>
              </div>
              <div class="rs-field">
                <label>Riesgo por operación <span class="rs-tip" title="El % de tu cuenta que estás dispuesto a perder si el stop se ejecuta. Recomendado: 1-2%.">?</span></label>
                <div class="rs-inline"><input type="number" id="rsRisk" step="0.1" value="${state.riskPct}"><span class="rs-suffix">%</span></div>
              </div>
              <div class="rs-field">
                <label>Dirección</label>
                <div class="rs-dir">
                  <button data-dir="long" class="${state.direction === 'long' ? 'active' : ''}"><span class="rs-dir-ic">${SVG.up}</span> Compra</button>
                  <button data-dir="short" class="${state.direction === 'short' ? 'active' : ''}"><span class="rs-dir-ic">${SVG.down}</span> Venta</button>
                </div>
              </div>
              <div class="rs-field rs-field-2">
                <label>Precio de entrada</label>
                <div class="rs-inline"><input type="number" id="rsEntry" step="any" placeholder="Usa el precio actual o escríbelo"><button class="rs-usecurrent" id="rsUseCurrent" type="button">Usar precio actual</button></div>
              </div>

              <div class="rs-field rs-field-2">
                <label>Stop Loss</label>
                <div class="rs-mode-toggle" data-target="sl"><button data-slmode="price" class="active">Precio</button><button data-slmode="pips">Pips</button></div>
                <div class="rs-inline"><input type="number" id="rsSL" step="any"><input type="range" id="rsSLRange" class="rs-range" min="1" max="300" value="${state.slPips}"></div>
              </div>
              <div class="rs-field rs-field-2">
                <label>Take Profit</label>
                <div class="rs-mode-toggle" data-target="tp"><button data-tpmode="price" class="active">Precio</button><button data-tpmode="pips">Pips</button></div>
                <div class="rs-inline"><input type="number" id="rsTP" step="any"><input type="range" id="rsTPRange" class="rs-range" min="1" max="600" value="${state.tpPips}"></div>
              </div>
            </div>

            <div class="rs-pro-toggle">
              <label class="rs-switch"><input type="checkbox" id="rsProMode" ${state.pro ? 'checked' : ''}><span></span></label>
              <span>Modo profesional (comisiones, apalancamiento, margen, valor del contrato)</span>
            </div>
            <div class="rs-pro-fields" id="rsProFields" ${state.pro ? '' : 'hidden'}>
              <div class="rs-field"><label>Comisión (USD por lote, ida y vuelta)</label><input type="number" id="rsCommission" step="any" value="${state.commission}"></div>
              <div class="rs-field"><label>Cuenta de fondeo</label><select id="rsPropFirm">${Object.keys(PROP_FIRMS).map((k) => `<option value="${k}" ${k === state.propFirm ? 'selected' : ''}>${k === 'none' ? 'Ninguna' : PROP_FIRMS[k].label}</option>`).join('')}</select></div>
            </div>
          </div>
        </div>

        <div class="rs-right">
          <div class="rs-alerts" id="rsAlerts"></div>
          <div class="rs-results" id="rsResults"></div>
          <div class="rs-visual" id="rsVisual"></div>
          <div class="rs-panel rs-news" id="rsNews" hidden></div>
        </div>
      </div>

      <div class="rs-history" id="rsHistory"></div>
    `;
  }

  function renderDashboard(r) {
    const el = document.getElementById('rsDashboard');
    if (!el) return;
    const hist = loadHistory();
    const avgRR = hist.length ? (hist.reduce((s, h) => s + (h.rr || 0), 0) / hist.filter((h) => h.rr).length) : null;
    el.innerHTML = `
      <div class="rs-dash-card"><span>Capital</span><strong>${fmt(state.capital, 0)} ${state.currency}</strong></div>
      <div class="rs-dash-card"><span>Riesgo por operación</span><strong>${state.riskPct}%</strong></div>
      <div class="rs-dash-card"><span>Instrumento</span><strong>${state.instrumentId}</strong></div>
      <div class="rs-dash-card"><span>Cálculos guardados</span><strong>${hist.length}</strong></div>
      <div class="rs-dash-card"><span>R:R promedio</span><strong>${avgRR ? '1:' + avgRR.toFixed(1) : '—'}</strong></div>
    `;
  }

  function renderSelected() {
    const ins = currentInstrument();
    const el = document.getElementById('rsSelected');
    if (!el) return;
    el.innerHTML = `
      <div class="rs-ins-head"><span class="rs-ins-icon">${insGlyph(ins)}</span><div><strong>${ins.id}</strong><span>${esc(ins.name)}</span></div><span class="rs-cat-badge">${ins.cat}</span></div>
      <div class="rs-specs">
        <div><span>Decimales</span><strong>${ins.decimals}</strong></div>
        <div><span>Tamaño de pip</span><strong>${ins.pipSize}</strong></div>
        <div><span>Valor del tick</span><strong>$${fmt(ins.pipSize * ins.valuePerPointPerLot, 2)}/${UNIT_LABEL[ins.cat].slice(0, -1)}</strong></div>
        <div><span>Contrato</span><strong>${fmt(ins.contractSize, 0)}</strong></div>
        <div><span>Apalancamiento típico</span><strong>1:${ins.leverage}</strong></div>
        <div><span>Spread típico</span><strong>${ins.spread === '—' ? '—' : ins.spread + ' pips'}</strong></div>
        <div><span>Horario</span><strong>${ins.hours}</strong></div>
        <div><span>Rango diario típico</span><strong>~${ins.avgRangePips} pips</strong></div>
      </div>
      <p class="rs-specs-note">${ins.dynamic ? 'Instrumento del buscador global: especificaciones genéricas de su categoría (el precio sí es real). Verifica el tamaño de contrato exacto con tu broker. ' : ''}Valores de referencia estándar del mercado. El spread, apalancamiento y comisiones reales dependen de tu broker.</p>
    `;
  }

  function renderResults(r) {
    const el = document.getElementById('rsResults');
    if (!el) return;
    if (!r.valid) {
      el.innerHTML = `<div class="rs-empty">Ingresa el precio de <strong>entrada</strong> y el <strong>stop loss</strong> para calcular tu gestión de riesgo.</div>`;
      return;
    }
    const unit = UNIT_LABEL[r.ins.cat];
    const cards = [
      { big: true, label: `Tamaño de posición`, val: fmt(r.lots, r.ins.cat === 'Forex' || r.ins.cat === 'Materias primas' ? 2 : 4), sub: unit },
      { label: 'Dinero que arriesgas', val: fmt(r.riskAmount, 2) + ' ' + state.currency, cls: 'red' },
      { label: 'Ganancia potencial', val: r.profit != null ? fmt(r.profit, 2) + ' ' + state.currency : '—', cls: 'green' },
      { label: 'Relación R:R', val: r.rr != null ? '1:' + r.rr.toFixed(2) : '—', cls: r.rr != null && r.rr >= 2 ? 'green' : (r.rr != null && r.rr < 1 ? 'red' : '') },
      { label: 'Distancia al stop', val: Math.round(r.stopPips) + ' pips', sub: r.distancePct.toFixed(2) + '%' },
      { label: 'Valor por pip', val: '$' + fmt(r.pipValueUSD, 2) }
    ];
    let proCards = '';
    if (state.pro) {
      proCards = `
        <div class="rs-card"><span>Margen requerido</span><strong>$${fmt(r.marginUSD, 2)}</strong></div>
        <div class="rs-card"><span>Valor nocional</span><strong>$${fmt(r.notionalUSD, 0)}</strong></div>
        <div class="rs-card"><span>Comisión estimada</span><strong>$${fmt(r.commissionUSD, 2)}</strong></div>
        <div class="rs-card"><span>Valor del tick</span><strong>$${fmt(r.tickValueUSD, 2)}</strong></div>`;
    }
    el.innerHTML = cards.map((c) => `<div class="rs-card ${c.big ? 'rs-card-big' : ''} ${c.cls || ''}"><span>${c.label}</span><strong>${c.val}</strong>${c.sub ? `<em>${c.sub}</em>` : ''}</div>`).join('') + proCards;
  }

  function renderVisual(r) {
    const el = document.getElementById('rsVisual');
    if (!el) return;
    if (!r.valid) { el.innerHTML = ''; return; }
    const long = r.direction === 'long';
    const tp = r.tp, entry = r.entry, sl = r.sl;
    // Escala vertical entre el extremo superior e inferior
    const hi = Math.max(tp != null ? tp : entry, entry, sl);
    const lo = Math.min(tp != null ? tp : entry, entry, sl);
    const range = hi - lo || 1;
    const pos = (v) => (100 - ((v - lo) / range) * 100);
    const tpPos = tp != null ? pos(tp) : null;
    const entryPos = pos(entry);
    const slPos = pos(sl);
    el.innerHTML = `
      <div class="rs-visual-title">Tu operación de un vistazo</div>
      <div class="rs-bar">
        ${tp != null ? `<div class="rs-bar-zone rs-zone-profit" style="top:${Math.min(tpPos, entryPos)}%;height:${Math.abs(entryPos - tpPos)}%;"></div>` : ''}
        <div class="rs-bar-zone rs-zone-loss" style="top:${Math.min(entryPos, slPos)}%;height:${Math.abs(slPos - entryPos)}%;"></div>
        ${tp != null ? `<div class="rs-bar-line rs-line-tp" style="top:${tpPos}%;"><span class="rs-bar-ic">${SVG.target}</span><span>TP ${fmt(tp, r.ins.decimals)} ${r.profit != null ? '(+' + fmt(r.profit, 0) + ')' : ''}</span></div>` : ''}
        <div class="rs-bar-line rs-line-entry" style="top:${entryPos}%;"><span class="rs-bar-ic">${SVG.play}</span><span>Entrada ${fmt(entry, r.ins.decimals)}</span></div>
        <div class="rs-bar-line rs-line-sl" style="top:${slPos}%;"><span class="rs-bar-ic">${SVG.stop}</span><span>SL ${fmt(sl, r.ins.decimals)} (-${fmt(r.riskAmount, 0)})</span></div>
      </div>`;
  }

  function renderAlerts(r) {
    const el = document.getElementById('rsAlerts');
    if (!el) return;
    const alerts = buildAlerts(r);
    el.innerHTML = alerts.map((a) => `<div class="rs-alert rs-alert-${a.t}"><span class="rs-alert-ic">${a.t === 'danger' ? SVG.ban : SVG.warn}</span>${esc(a.m)}</div>`).join('');
  }

  function renderHistory() {
    const el = document.getElementById('rsHistory');
    if (!el) return;
    const hist = loadHistory();
    if (!hist.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="section-head" style="margin-top:8px;"><h2 style="font-size:1.05rem;display:flex;align-items:center;gap:8px;"><span class="rs-h-ic">${SVG.clock}</span> Tus últimos cálculos</h2><button class="filter-chip" id="rsHistClear">Borrar historial</button></div>
      <div class="rs-hist-grid">
        ${hist.map((h, i) => `
          <div class="rs-hist-card" data-hist="${i}">
            <div class="rs-hist-head"><strong>${esc(h.instrumentId)}</strong><span class="rs-hist-dir ${h.dir === 'long' ? 'up' : 'down'}">${h.dir === 'long' ? '&#9650;' : '&#9660;'} ${h.rr ? '1:' + h.rr.toFixed(1) : ''}</span></div>
            <div class="rs-hist-body">Entrada ${esc(h.entry)} · SL ${esc(h.sl)}${h.tp ? ' · TP ' + esc(h.tp) : ''}</div>
            <div class="rs-hist-foot">${esc(h.date)} · <button class="rs-hist-reuse" data-hist="${i}">Reutilizar</button></div>
          </div>`).join('')}
      </div>`;
    document.getElementById('rsHistClear').addEventListener('click', () => { saveHistory([]); renderHistory(); renderDashboard(); });
    el.querySelectorAll('.rs-hist-reuse').forEach((b) => b.addEventListener('click', () => {
      const h = loadHistory()[parseInt(b.dataset.hist, 10)];
      if (!h) return;
      state.instrumentId = h.instrumentId; state.entry = h.entry; state.sl = h.sl; state.tp = h.tp; state.direction = h.dir;
      state.slMode = 'price'; state.tpMode = 'price';
      syncInputs(); onInstrumentChange(true); update();
    }));
  }

  let histTimer = null;
  function pushHistory(r) {
    if (!r.valid) return;
    if (histTimer) clearTimeout(histTimer);
    histTimer = setTimeout(() => {
      const hist = loadHistory();
      const entryStr = fmt(r.entry, r.ins.decimals), slStr = fmt(r.sl, r.ins.decimals);
      if (hist[0] && hist[0].instrumentId === r.ins.id && hist[0].entry === entryStr && hist[0].sl === slStr) return;
      hist.unshift({ instrumentId: r.ins.id, dir: r.direction, entry: entryStr, sl: slStr, tp: r.tp != null ? fmt(r.tp, r.ins.decimals) : null, rr: r.rr, date: new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }) });
      saveHistory(hist);
      renderHistory(); renderDashboard(r);
    }, 2500);
  }

  // ============================ NOTICIAS DEL ACTIVO ============================
  async function renderNews() {
    const el = document.getElementById('rsNews');
    if (!el) return;
    const ins = currentInstrument();
    const curs = [];
    if (ins.cat === 'Forex') { curs.push(ins.id.slice(0, 3), ins.id.slice(3, 6)); }
    else if (ins.quote) { curs.push('USD'); }
    if (!curs.length) { el.hidden = true; return; }
    try {
      const res = await fetch('/.netlify/functions/economic-calendar');
      const data = await res.json();
      if (!data.success) { el.hidden = true; return; }
      const now = Date.now();
      const upcoming = data.events
        .filter((e) => curs.includes(e.country) && (e.impact === 'High' || e.impact === 'Medium') && new Date(e.date).getTime() > now)
        .slice(0, 4);
      if (!upcoming.length) { el.hidden = true; return; }
      el.hidden = false;
      el.innerHTML = `<div class="rs-news-title"><span class="rs-h-ic">${SVG.cal}</span> Próximas noticias que afectan a ${ins.id}</div>` + upcoming.map((e) => {
        const dt = new Date(e.date);
        return `<div class="rs-news-row"><span class="rs-news-cur">${esc(e.country)}</span><span class="rs-news-name">${esc(e.title)}</span><span class="rs-news-time">${dt.toLocaleDateString('es', { weekday: 'short' })} ${dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</span><span class="rs-news-imp rs-imp-${e.impact === 'High' ? 'high' : 'med'}">${e.impact === 'High' ? 'Alto' : 'Medio'}</span></div>`;
      }).join('') + `<a href="calendario.html" class="rs-news-more">Ver calendario completo →</a>`;
    } catch (e) { el.hidden = true; }
  }

  // ============================ PRECIO EN VIVO ============================
  let priceState = null;
  async function loadLivePrice() {
    const ins = currentInstrument();
    const row = document.getElementById('rsPriceRow');
    if (row) row.innerHTML = `<span class="rs-price-loading">Cargando precio de ${ins.id}...</span>`;
    try {
      const d = await fetchPrice(ins.yahoo);
      priceState = d;
      const chg = d.changePct;
      row.innerHTML = `
        <div class="rs-price-main"><span class="rs-price-val">${fmt(d.price, ins.decimals)}</span><span class="rs-price-chg ${chg >= 0 ? 'up' : 'down'}">${chg != null ? (chg >= 0 ? '&#9650; ' : '&#9660; ') + Math.abs(chg).toFixed(2) + '%' : ''}</span><span class="rs-price-live">&#9679; en vivo</span></div>
        <div class="rs-price-meta">Detectado automáticamente · ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} · el precio de entrada se rellena solo; puedes editarlo. El bid/ask real depende de tu broker.</div>`;
      // Auto-rellena la entrada con el precio de mercado detectado (queda editable).
      const entryEl = document.getElementById('rsEntry');
      if (entryEl && !entryEl.value && d && d.price != null) {
        const p = Number(d.price.toFixed(ins.decimals));
        entryEl.value = p;
        state.entry = p;
        update();
      }
    } catch (e) {
      priceState = null;
      if (row) row.innerHTML = `<span class="rs-muted">No pudimos cargar el precio de ${ins.id} ahora. Puedes escribir el precio de entrada manualmente.</span>`;
    }
  }

  // ============================ ORQUESTACIÓN ============================
  function syncInputs() {
    const ins = currentInstrument();
    const cap = document.getElementById('rsCapital'); if (cap) cap.value = state.capital;
    const risk = document.getElementById('rsRisk'); if (risk) risk.value = state.riskPct;
    const entry = document.getElementById('rsEntry'); if (entry && state.entry != null) entry.value = state.entry;
    const sl = document.getElementById('rsSL'); if (sl && state.sl != null) sl.value = state.sl;
    const tp = document.getElementById('rsTP'); if (tp && state.tp != null) tp.value = state.tp;
    document.querySelectorAll('[data-dir]').forEach((b) => b.classList.toggle('active', b.dataset.dir === state.direction));
  }

  function update() {
    const r = calc();
    renderResults(r); renderVisual(r); renderAlerts(r); renderDashboard(r);
    pushHistory(r);
    persist();
  }

  function onInstrumentChange(skipPrice) {
    renderSelected();
    renderNews();
    const ins = currentInstrument();
    // Al cambiar de instrumento (no al reutilizar del historial), los precios del
    // anterior ya no aplican: se limpian para no calcular con datos mezclados.
    if (!skipPrice) {
      state.entry = null; state.sl = null; state.tp = null;
      ['rsEntry', 'rsSL', 'rsTP'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
      loadLivePrice();
    }
    // Ajustar step de los inputs de precio
    ['rsEntry', 'rsSL', 'rsTP'].forEach((id) => { const el = document.getElementById(id); if (el) el.step = ins.pipSize; });
  }

  function applyPipsToInputs() {
    const ins = currentInstrument();
    const entry = num(state.entry);
    if (entry == null) return;
    if (state.slMode === 'pips') {
      const v = state.direction === 'long' ? entry - state.slPips * ins.pipSize : entry + state.slPips * ins.pipSize;
      state.sl = +v.toFixed(ins.decimals); const el = document.getElementById('rsSL'); if (el) el.value = state.sl;
    }
    if (state.tpMode === 'pips') {
      const v = state.direction === 'long' ? entry + state.tpPips * ins.pipSize : entry - state.tpPips * ins.pipSize;
      state.tp = +v.toFixed(ins.decimals); const el = document.getElementById('rsTP'); if (el) el.value = state.tp;
    }
  }

  function wire() {
    // Buscador: primero los instrumentos con especificaciones completas; si no
    // hay match local, sugiere entre miles de símbolos reales (buscador global)
    // creando el instrumento sobre la marcha con especificaciones genéricas.
    const search = document.getElementById('rsSearch');
    const sugg = document.getElementById('rsSuggestions');
    let remoteResults = [];
    let remoteTimer = null;

    function dynFromQuote(r) {
      const sym = r.symbol.toUpperCase();
      const existing = INSTRUMENTS.find((i) => i.id === sym || i.yahoo === r.symbol);
      if (existing) return existing;
      let base;
      if (r.type === 'CRYPTOCURRENCY') base = { cat: 'Cripto', decimals: 2, pipSize: 1, valuePerPointPerLot: 1, contractSize: 1, leverage: 2, spread: '—', avgRangePips: 500, hours: '24/7' };
      else if (r.type === 'CURRENCY') base = { cat: 'Forex', decimals: 5, pipSize: 0.0001, valuePerPointPerLot: 100000, contractSize: 100000, leverage: 30, spread: '—', avgRangePips: 100, hours: '24/5' };
      else base = { cat: 'Acciones', decimals: 2, pipSize: 0.01, valuePerPointPerLot: 1, contractSize: 1, leverage: 5, spread: '—', avgRangePips: 300, hours: 'Bolsa' };
      const ins = Object.assign({ id: sym, name: r.name, yahoo: r.symbol, quote: 'USD', dynamic: true }, base);
      INSTRUMENTS.push(ins);
      return ins;
    }

    function renderSuggestions(local, remote) {
      if (!local.length && !remote.length) { sugg.hidden = true; return; }
      const localHTML = local.map((i) => `<div class="rs-sugg" data-id="${i.id}"><span class="rs-sugg-icon">${insGlyph(i)}</span><div><strong>${i.id}</strong><span>${esc(i.name)}</span></div><span class="rs-cat-badge">${i.cat}</span></div>`).join('');
      const remoteHTML = remote.length
        ? `<div class="rs-sugg-divider">Mercado global — miles de símbolos</div>` +
          remote.map((r, idx) => `<div class="rs-sugg rs-sugg-remote" data-remote="${idx}"><span class="rs-sugg-icon"><span class="rs-glyph"><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='7'/><path d='M21 21l-4.3-4.3'/></svg></span></span><div><strong>${esc(r.symbol)}</strong><span>${esc(r.name)}</span></div><span class="rs-cat-badge">${esc(r.typeLabel)}</span></div>`).join('')
        : '';
      sugg.innerHTML = localHTML + remoteHTML;
      sugg.hidden = false;
      sugg.querySelectorAll('.rs-sugg').forEach((row) => row.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (row.dataset.remote != null) {
          const ins = dynFromQuote(remoteResults[parseInt(row.dataset.remote, 10)]);
          state.instrumentId = ins.id;
        } else {
          state.instrumentId = row.dataset.id;
        }
        search.value = '';
        sugg.hidden = true;
        remoteResults = [];
        onInstrumentChange();
        update();
      }));
    }

    function showSuggestions(q) {
      const query = q.trim().toLowerCase();
      let list = INSTRUMENTS.filter((i) => !i.dynamic);
      if (query) list = list.filter((i) => i.id.toLowerCase().includes(query) || i.name.toLowerCase().includes(query) || i.cat.toLowerCase().includes(query));
      list = list.slice(0, 6);
      renderSuggestions(list, remoteResults);

      // Búsqueda global con retardo, solo si hay texto suficiente
      if (remoteTimer) clearTimeout(remoteTimer);
      if (query.length < 2) { remoteResults = []; return; }
      remoteTimer = setTimeout(async () => {
        try {
          const res = await fetch('/.netlify/functions/symbol-search?q=' + encodeURIComponent(query));
          const data = await res.json();
          if (search.value.trim().toLowerCase() !== query) return;
          const okTypes = { EQUITY: 1, ETF: 1, CRYPTOCURRENCY: 1, CURRENCY: 1 };
          remoteResults = ((data && data.results) || []).filter((r) => okTypes[r.type] && !list.find((i) => i.yahoo === r.symbol)).slice(0, 5);
          if (!sugg.hidden || remoteResults.length) renderSuggestions(list, remoteResults);
        } catch (e) { /* solo locales */ }
      }, 300);
    }
    search.addEventListener('input', () => showSuggestions(search.value));
    search.addEventListener('focus', () => showSuggestions(search.value));
    search.addEventListener('blur', () => setTimeout(() => { sugg.hidden = true; }, 150));

    // Plantillas
    document.querySelectorAll('.rs-tpl').forEach((b) => b.addEventListener('click', () => {
      const t = TEMPLATES[b.dataset.tpl];
      if (!t) return;
      state.riskPct = t.risk; state.slMode = 'pips'; state.slPips = t.slPips; state.tpMode = 'pips'; state.tpPips = Math.round(t.slPips * t.rr);
      document.getElementById('rsRisk').value = t.risk;
      document.getElementById('rsSLRange').value = t.slPips;
      document.getElementById('rsTPRange').value = state.tpPips;
      document.querySelectorAll('[data-target="sl"] [data-slmode]').forEach((x) => x.classList.toggle('active', x.dataset.slmode === 'pips'));
      document.querySelectorAll('[data-target="tp"] [data-tpmode]').forEach((x) => x.classList.toggle('active', x.dataset.tpmode === 'pips'));
      applyPipsToInputs(); update();
      b.classList.add('rs-tpl-flash'); setTimeout(() => b.classList.remove('rs-tpl-flash'), 400);
    }));

    // Campos básicos
    document.getElementById('rsCapital').addEventListener('input', (e) => { state.capital = num(e.target.value) || 0; update(); });
    document.getElementById('rsCurrency').addEventListener('change', async (e) => { state.currency = e.target.value; await refreshFxRate(); update(); });
    document.getElementById('rsRisk').addEventListener('input', (e) => { state.riskPct = num(e.target.value) || 0; update(); });
    document.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
      state.direction = b.dataset.dir;
      document.querySelectorAll('[data-dir]').forEach((x) => x.classList.toggle('active', x === b));
      applyPipsToInputs(); update();
    }));

    // Entrada + usar precio actual
    document.getElementById('rsEntry').addEventListener('input', (e) => { state.entry = num(e.target.value); applyPipsToInputs(); update(); });
    document.getElementById('rsUseCurrent').addEventListener('click', () => {
      if (priceState && priceState.price != null) {
        const ins = currentInstrument();
        state.entry = +priceState.price.toFixed(ins.decimals);
        document.getElementById('rsEntry').value = state.entry;
        applyPipsToInputs(); update();
      } else { loadLivePrice(); }
    });

    // SL / TP inputs y sliders
    document.getElementById('rsSL').addEventListener('input', (e) => { state.slMode = 'price'; state.sl = num(e.target.value); setModeUI('sl', 'price'); update(); });
    document.getElementById('rsTP').addEventListener('input', (e) => { state.tpMode = 'price'; state.tp = num(e.target.value); setModeUI('tp', 'price'); update(); });
    document.getElementById('rsSLRange').addEventListener('input', (e) => { state.slMode = 'pips'; state.slPips = parseInt(e.target.value, 10); setModeUI('sl', 'pips'); applyPipsToInputs(); update(); });
    document.getElementById('rsTPRange').addEventListener('input', (e) => { state.tpMode = 'pips'; state.tpPips = parseInt(e.target.value, 10); setModeUI('tp', 'pips'); applyPipsToInputs(); update(); });

    function setModeUI(target, mode) {
      document.querySelectorAll(`[data-target="${target}"] [data-${target}mode]`).forEach((x) => x.classList.toggle('active', x.dataset[target + 'mode'] === mode));
    }
    document.querySelectorAll('[data-target="sl"] [data-slmode]').forEach((b) => b.addEventListener('click', () => { state.slMode = b.dataset.slmode; setModeUI('sl', state.slMode); if (state.slMode === 'pips') applyPipsToInputs(); update(); }));
    document.querySelectorAll('[data-target="tp"] [data-tpmode]').forEach((b) => b.addEventListener('click', () => { state.tpMode = b.dataset.tpmode; setModeUI('tp', state.tpMode); if (state.tpMode === 'pips') applyPipsToInputs(); update(); }));

    // Modo profesional
    document.getElementById('rsProMode').addEventListener('change', (e) => {
      state.pro = e.target.checked;
      document.getElementById('rsProFields').hidden = !state.pro;
      update();
    });
    document.getElementById('rsCommission').addEventListener('input', (e) => { state.commission = num(e.target.value) || 0; update(); });
    document.getElementById('rsPropFirm').addEventListener('change', (e) => { state.propFirm = e.target.value; update(); });
  }

  // ============================ INICIO ============================
  mount.innerHTML = shell();
  wire();
  onInstrumentChange();
  refreshFxRate().then(update);
  renderHistory();
})();
