/* AR4 Mercados — Laboratorio de Riesgo (2 niveles).
   ---------------------------------------------------------------------------
   NIVEL GRATIS  (#riskLab)    : calculadora de tamaño de posición + tabla de
                                 recuperación de drawdown.
   NIVEL PREMIUM (#riskLabPro) : simulador Monte Carlo de supervivencia —
                                 expectativa, Kelly, probabilidad de ruina,
                                 drawdown esperado, rachas y curvas de capital.

   Todo es matemática exacta calculada en el navegador. NO predice el mercado:
   proyecta las consecuencias de los supuestos que el propio usuario introduce.
   Sin datos inventados, sin señales, sin promesas de rentabilidad. */
(function () {
  const money = (n) => '$' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (n) => '$' + n.toLocaleString('es-PE', { maximumFractionDigits: 0 });
  const num = (n, d) => n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clean = (n, d) => num(n, d).replace(/[.,]00$/, '');
  const $ = (id) => document.getElementById(id);

  /* ══════════════ NIVEL GRATIS ══════════════ */
  function initFreeLab() {
    const el = $('riskLab');
    if (!el) return;

    const recoveryPct = (ddPct) => {
      const dd = ddPct / 100;
      return dd >= 1 ? Infinity : ((1 / (1 - dd)) - 1) * 100;
    };
    const lossesToDrawdown = (riskPct, ddPct) => {
      const r = riskPct / 100, dd = ddPct / 100;
      if (r <= 0 || r >= 1 || dd >= 1) return null;
      return Math.ceil(Math.log(1 - dd) / Math.log(1 - r));
    };
    const DRAWDOWNS = [5, 10, 20, 30, 50, 70];

    el.innerHTML = `
      <div class="section-head" style="margin-bottom:14px;">
        <h2 class="h2-ic" style="font-size:1.3rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8.5V3"/><path d="M7 15h10"/></svg>
          Laboratorio de Riesgo
        </h2>
        <span class="rl-tier-badge">NIVEL GRATIS · PARA TODOS</span>
      </div>
      <p style="color:var(--text-mid);font-size:0.9rem;margin-bottom:18px;max-width:70ch;">
        La diferencia entre un trader que dura y uno que no casi nunca está en el análisis: está en el tamaño de la posición.
        Mueve los números y mira qué pasa de verdad con tu cuenta. Es matemática pura, no una opinión.
      </p>

      <div class="rl-grid">
        <div class="rl-panel">
          <h3 class="rl-h">Tu operación</h3>
          <div class="rl-dir" id="rlDir">
            <button type="button" class="rl-dir-btn rl-dir-long active" data-dir="long">▲ Compra (Long)</button>
            <button type="button" class="rl-dir-btn rl-dir-short" data-dir="short">▼ Venta (Short)</button>
          </div>
          <label class="rl-label" for="rlCapital">Capital de la cuenta (USD)</label>
          <input class="rl-input" type="number" id="rlCapital" value="5000" min="1" step="100">
          <label class="rl-label" for="rlRisk">Riesgo por operación: <b id="rlRiskVal">1%</b></label>
          <input class="rl-range" type="range" id="rlRisk" value="1" min="0.25" max="10" step="0.25">
          <div class="rl-range-hint"><span>Conservador</span><span>Agresivo</span></div>
          <div class="rl-row">
            <div>
              <label class="rl-label" for="rlEntry">Entrada</label>
              <input class="rl-input" type="number" id="rlEntry" value="100" min="0" step="any">
            </div>
            <div>
              <label class="rl-label" for="rlStop">Stop loss</label>
              <input class="rl-input" type="number" id="rlStop" value="97" min="0" step="any">
            </div>
            <div>
              <label class="rl-label" for="rlTarget">Objetivo</label>
              <input class="rl-input" type="number" id="rlTarget" value="109" min="0" step="any">
            </div>
          </div>
          <div class="rl-msg" id="rlMsg"></div>
        </div>

        <div class="rl-panel rl-panel-out">
          <h3 class="rl-h">Lo que eso significa</h3>
          <div class="rl-out-main">
            <span class="rl-out-label">Tamaño de posición</span>
            <strong id="rlUnits">—</strong>
            <span class="rl-out-sub" id="rlNotional">—</span>
          </div>
          <div class="rl-bar" id="rlBar"></div>
          <div class="rl-stats">
            <div class="rl-stat"><span>Arriesgas</span><strong id="rlRiskMoney" class="rl-neg">—</strong></div>
            <div class="rl-stat"><span>Puedes ganar</span><strong id="rlWinMoney" class="rl-pos">—</strong></div>
            <div class="rl-stat"><span>Ratio R:R</span><strong id="rlRR">—</strong></div>
            <div class="rl-stat"><span>Aciertos para no perder</span><strong id="rlBE">—</strong></div>
          </div>
          <div class="rl-verdict" id="rlVerdict"></div>
        </div>
      </div>

      <div class="rl-dd">
        <h3 class="rl-h" style="margin-bottom:4px;">El agujero del que nadie habla</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:14px;max-width:75ch;">
          Perder no es simétrico. Si pierdes un 50%, no necesitas ganar un 50% para volver a empezar: necesitas ganar un <b>100%</b>.
          Esta tabla se recalcula con <b>tu</b> riesgo por operación.
        </p>
        <div class="rl-dd-table" id="rlDdTable"></div>
        <p class="rl-dd-note" id="rlDdNote"></p>
      </div>
    `;

    const capitalEl = $('rlCapital'), riskEl = $('rlRisk'), entryEl = $('rlEntry'),
          stopEl = $('rlStop'), targetEl = $('rlTarget');
    let dir = 'long';

    // Diagrama visual: [stop]—riesgo—[entrada]—beneficio—[objetivo], proporcional.
    function drawBar(entry, stop, target, hasTarget) {
      const bar = $('rlBar');
      const risk = Math.abs(entry - stop);
      const reward = hasTarget ? Math.abs(target - entry) : risk; // sin objetivo, dibuja simétrico tenue
      const total = risk + reward || 1;
      const entryPct = (risk / total) * 100;
      const low = dir === 'long' ? 'Stop' : 'Objetivo';
      const high = dir === 'long' ? 'Objetivo' : 'Stop';
      const lowVal = dir === 'long' ? stop : (hasTarget ? target : null);
      const highVal = dir === 'long' ? (hasTarget ? target : null) : stop;
      const dec = Math.abs(entry) < 10 ? 4 : 2;
      const fmtP = (v) => (v == null ? '—' : num(v, dec));
      bar.innerHTML = `
        <div class="rl-bar-track">
          <div class="rl-bar-risk" style="width:${entryPct}%"></div>
          <div class="rl-bar-reward" style="width:${100 - entryPct}%${hasTarget ? '' : ';opacity:.35'}"></div>
          <span class="rl-bar-marker rl-bar-entry" style="left:${entryPct}%"><b>${fmtP(entry)}</b><i>Entrada</i></span>
        </div>
        <div class="rl-bar-ends">
          <span class="rl-bar-end rl-neg">${low} · ${fmtP(lowVal)}</span>
          <span class="rl-bar-end rl-pos">${high} · ${fmtP(highVal)}${!hasTarget ? ' (falta)' : ''}</span>
        </div>`;
    }

    function render() {
      const capital = parseFloat(capitalEl.value), riskPct = parseFloat(riskEl.value);
      const entry = parseFloat(entryEl.value), stop = parseFloat(stopEl.value), target = parseFloat(targetEl.value);
      $('rlRiskVal').textContent = clean(riskPct, 2) + '%';

      const msg = $('rlMsg');
      const dist = Math.abs(entry - stop);
      const valid = Number.isFinite(capital) && capital > 0 && Number.isFinite(entry) && entry > 0 &&
                    Number.isFinite(stop) && stop > 0 && dist > 0;
      if (!valid) {
        msg.textContent = dist === 0 ? 'El stop no puede ser igual a la entrada: sin distancia no hay riesgo que medir.' : 'Completa capital, entrada y stop con números válidos.';
        msg.className = 'rl-msg rl-msg-error';
        ['rlUnits', 'rlNotional', 'rlRiskMoney', 'rlWinMoney', 'rlRR', 'rlBE'].forEach((i) => { $(i).textContent = '—'; });
        $('rlBar').innerHTML = ''; $('rlVerdict').innerHTML = '';
        return;
      }

      // Coherencia de la dirección: en Long el stop va debajo; en Short, encima.
      const dirOk = dir === 'long' ? stop < entry : stop > entry;
      if (!dirOk) {
        msg.textContent = dir === 'long'
          ? 'En una compra (Long) el stop va POR DEBAJO de la entrada. Revisa tus precios.'
          : 'En una venta (Short) el stop va POR ENCIMA de la entrada. Revisa tus precios.';
        msg.className = 'rl-msg rl-msg-warn';
      } else { msg.textContent = ''; msg.className = 'rl-msg'; }

      const riskMoney = capital * (riskPct / 100);
      const units = riskMoney / dist;
      const notional = units * entry;
      const leverage = notional / capital;

      $('rlUnits').textContent = num(units, units < 10 ? 4 : 2) + ' unidades';
      $('rlNotional').textContent = 'Cantidad del activo (acciones/contratos, no dólares) · valor total: ' + money(notional) +
        (leverage > 1.05 ? ' · ' + num(leverage, 1) + '× tu capital' : '');
      $('rlRiskMoney').textContent = '-' + money(riskMoney);

      // Objetivo válido: coherente con la dirección
      const tgtOk = Number.isFinite(target) && target > 0 &&
        (dir === 'long' ? target > entry : target < entry);
      drawBar(entry, stop, target, tgtOk);

      if (tgtOk) {
        const winMoney = Math.abs(target - entry) * units;
        const rr = winMoney / riskMoney;
        $('rlWinMoney').textContent = '+' + money(winMoney);
        $('rlRR').textContent = '1 : ' + num(rr, 2);
        const breakeven = (1 / (1 + rr)) * 100;
        $('rlBE').textContent = '> ' + num(breakeven, 0) + '%';
        let cls = 'rl-verdict-bad', txt;
        if (rr >= 2) { cls = 'rl-verdict-good'; txt = 'Relación sólida. Con este R:R te basta con acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces para no perder dinero.'; }
        else if (rr >= 1) { cls = 'rl-verdict-mid'; txt = 'Relación ajustada. Necesitas acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces solo para quedar en cero.'; }
        else { txt = 'Arriesgas más de lo que buscas ganar: necesitarías acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces solo para empatar. Muy pocos sostienen eso.'; }
        $('rlVerdict').className = 'rl-verdict ' + cls;
        $('rlVerdict').innerHTML = txt;
      } else {
        $('rlWinMoney').textContent = '—'; $('rlRR').textContent = '—'; $('rlBE').textContent = '—';
        $('rlVerdict').className = 'rl-verdict';
        $('rlVerdict').innerHTML = 'Añade un objetivo ' + (dir === 'long' ? 'por encima' : 'por debajo') + ' de la entrada para ver tu relación riesgo/beneficio.';
      }

      const rows = DRAWDOWNS.map((dd) => {
        const need = recoveryPct(dd), n = lossesToDrawdown(riskPct, dd), hot = need >= 100;
        return `<div class="rl-dd-row${hot ? ' rl-dd-hot' : ''}">
            <span class="rl-dd-loss">-${dd}%</span>
            <div class="rl-dd-bar"><div class="rl-dd-fill" style="width:${Math.min(100, need)}%"></div></div>
            <span class="rl-dd-need">+${num(need, need >= 100 ? 0 : 1)}%</span>
            <span class="rl-dd-streak">${n ? n + ' pérdidas seguidas' : '—'}</span>
          </div>`;
      }).join('');
      $('rlDdTable').innerHTML =
        '<div class="rl-dd-row rl-dd-head"><span>Si caes</span><span></span><span>Para volver</span><span>A tu riesgo actual</span></div>' + rows;

      const n20 = lossesToDrawdown(riskPct, 20);
      $('rlDdNote').innerHTML = n20
        ? `Con un riesgo del <b>${clean(riskPct, 2)}%</b> por operación, te bastan <b>${n20} pérdidas seguidas</b> para caer un 20% — y una mala racha así le pasa a cualquiera. Por eso el tamaño de la posición importa más que la entrada.`
        : '';
    }

    [capitalEl, riskEl, entryEl, stopEl, targetEl].forEach((i) => i.addEventListener('input', render));
    $('rlDir').querySelectorAll('.rl-dir-btn').forEach((b) => {
      b.addEventListener('click', () => {
        dir = b.dataset.dir;
        $('rlDir').querySelectorAll('.rl-dir-btn').forEach((x) => x.classList.toggle('active', x === b));
        render();
      });
    });
    render();
  }

  /* ══════════════ MÓDULO SUELTO: recuperación de drawdown ══════════════
     Para Herramientas, que ya tiene su propia suite de gestión de riesgo con
     instrumentos, lotes y pips (mejor que la calculadora genérica de arriba).
     Aquí solo aportamos lo que esa suite no cubre: qué cuesta recuperarse. */
  function initDdLab() {
    const el = $('riskLabDd');
    if (!el) return;

    const recoveryPct = (ddPct) => {
      const dd = ddPct / 100;
      return dd >= 1 ? Infinity : ((1 / (1 - dd)) - 1) * 100;
    };
    const lossesToDrawdown = (riskPct, ddPct) => {
      const r = riskPct / 100, dd = ddPct / 100;
      if (r <= 0 || r >= 1 || dd >= 1) return null;
      return Math.ceil(Math.log(1 - dd) / Math.log(1 - r));
    };
    const DRAWDOWNS = [5, 10, 20, 30, 50, 70];

    el.innerHTML = `
      <div class="rl-dd" style="border-top:none;padding-top:0;">
        <p style="color:var(--text-mid);font-size:0.88rem;margin-bottom:14px;max-width:75ch;">
          Tu suite de arriba te dice cuánto arriesgar en la próxima operación. Esto te dice el precio de equivocarte:
          perder no es simétrico. Si caes un 50%, no necesitas ganar un 50% para volver — necesitas ganar un <b>100%</b>.
        </p>
        <label class="rl-label" for="rdRisk" style="max-width:340px;">Riesgo por operación: <b id="rdRiskVal">1%</b></label>
        <input class="rl-range" type="range" id="rdRisk" value="1" min="0.25" max="10" step="0.25" style="max-width:340px;">
        <div class="rl-range-hint" style="max-width:340px;margin-bottom:16px;"><span>Conservador</span><span>Agresivo</span></div>
        <div class="rl-dd-table" id="rdTable"></div>
        <p class="rl-dd-note" id="rdNote"></p>
      </div>
      <div class="rl-cta rl-cta-pro">
        <div>
          <strong>¿Y qué mercado merece tu atención hoy?</strong>
          <span>La <b>Mesa de Mercado AR4</b> escanea hasta 8 instrumentos con datos reales — tendencia, RSI, volatilidad,
          soportes y resistencias — y dimensiona tu posición por volatilidad, como en una mesa profesional.</span>
        </div>
        <a href="membresia.html" class="btn btn-gold">Ver la Mesa de Mercado</a>
      </div>
    `;

    const riskEl = $('rdRisk');
    function render() {
      const riskPct = parseFloat(riskEl.value);
      $('rdRiskVal').textContent = clean(riskPct, 2) + '%';
      const rows = DRAWDOWNS.map((dd) => {
        const need = recoveryPct(dd), n = lossesToDrawdown(riskPct, dd), hot = need >= 100;
        return `<div class="rl-dd-row${hot ? ' rl-dd-hot' : ''}">
            <span class="rl-dd-loss">-${dd}%</span>
            <div class="rl-dd-bar"><div class="rl-dd-fill" style="width:${Math.min(100, need)}%"></div></div>
            <span class="rl-dd-need">+${num(need, need >= 100 ? 0 : 1)}%</span>
            <span class="rl-dd-streak">${n ? n + ' pérdidas seguidas' : '—'}</span>
          </div>`;
      }).join('');
      $('rdTable').innerHTML =
        '<div class="rl-dd-row rl-dd-head"><span>Si caes</span><span></span><span>Para volver</span><span>A tu riesgo actual</span></div>' + rows;
      const n20 = lossesToDrawdown(riskPct, 20);
      $('rdNote').innerHTML = n20
        ? `Con un riesgo del <b>${clean(riskPct, 2)}%</b> por operación, te bastan <b>${n20} pérdidas seguidas</b> para caer un 20% — y una mala racha así le pasa a cualquiera.`
        : '';
    }
    riskEl.addEventListener('input', render);
    render();
  }

  /* ══════════════ NIVEL PREMIUM — Simulador Monte Carlo ══════════════ */
  // ===== Mesa de Mercado AR4 — terminal profesional multi-activo =====
  // Datos 100% reales del dossier (Yahoo Finance, velas diarias): precio,
  // tendencia vs medias, RSI, ATR, soportes/resistencias, order blocks y 52s.
  // Lecturas tecnicas DESCRIPTIVAS: nunca seniales ni recomendaciones.
  function initMarketDesk() {
    const el = document.getElementById('riskLabPro');
    if (!el) return;

    const DEMO_WATCH = [
      { s: 'EURUSD=X', n: 'EUR/USD' },
      { s: 'GC=F', n: 'Oro' },
      { s: 'BTC-USD', n: 'Bitcoin' }
    ];
    const DEFAULT_WATCH = [
      { s: 'EURUSD=X', n: 'EUR/USD' },
      { s: 'GC=F', n: 'Oro' },
      { s: 'BTC-USD', n: 'Bitcoin' },
      { s: '^GSPC', n: 'S&P 500' },
      { s: '^IXIC', n: 'Nasdaq' },
      { s: 'USDJPY=X', n: 'USD/JPY' },
      { s: 'CL=F', n: 'Petróleo WTI' },
      { s: 'ETH-USD', n: 'Ethereum' }
    ];
    const MAX_WATCH = 8;
    let premium = false;
    let watch = DEMO_WATCH;
    let dossiers = {};
    let timer = null;
    let scanning = false;

    function loadWatch() {
      try {
        const raw = JSON.parse(localStorage.getItem('ar4DeskWatchV1') || 'null');
        if (Array.isArray(raw) && raw.length && raw.every((x) => x && x.s)) return raw.slice(0, MAX_WATCH);
      } catch (e) {}
      return DEFAULT_WATCH.slice();
    }
    function saveWatch() { try { localStorage.setItem('ar4DeskWatchV1', JSON.stringify(watch)); } catch (e) {} }

    function esc(t) { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }
    function fmt(v) {
      if (v == null || !isFinite(v)) return '—';
      const a = Math.abs(v);
      const dec = a >= 1000 ? 2 : a >= 10 ? 2 : a >= 1 ? 4 : 5;
      return v.toLocaleString('es-PE', { minimumFractionDigits: Math.min(dec, 2), maximumFractionDigits: dec });
    }

    // Sesiones Forex de referencia (UTC, horario de verano aproximado).
    const SESSIONS = [
      { n: 'Sídney', o: 21, c: 6 },
      { n: 'Tokio', o: 23, c: 8 },
      { n: 'Londres', o: 7, c: 16 },
      { n: 'Nueva York', o: 12, c: 21 }
    ];
    function sessionsHTML() {
      const h = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
      const wd = new Date().getUTCDay();
      const weekend = (wd === 6) || (wd === 0 && h < 21) || (wd === 5 && h >= 21);
      return SESSIONS.map((s) => {
        const open = !weekend && (s.o < s.c ? (h >= s.o && h < s.c) : (h >= s.o || h < s.c));
        return `<span class="dk-sess${open ? ' dk-on' : ''}"><span class="dk-dot"></span>${s.n}</span>`;
      }).join('');
    }

    function nearestSR(d) {
      const sup = (d.supports || []).filter((x) => x < d.price).sort((a, b) => b - a)[0];
      const res = (d.resistances || []).filter((x) => x > d.price).sort((a, b) => a - b)[0];
      return {
        sup, res,
        supDist: sup ? ((d.price - sup) / d.price) * 100 : null,
        resDist: res ? ((res - d.price) / d.price) * 100 : null
      };
    }

    function sizing(d) {
      const cap = parseFloat(($('dkCapital') || {}).value) || 0;
      const rk = parseFloat(($('dkRisk') || {}).value) || 0;
      if (!cap || !rk || !d.atr14) return null;
      const riskUsd = cap * (rk / 100);
      const stopDist = 1.5 * d.atr14;
      return { riskUsd, stopDist, units: riskUsd / stopDist };
    }

    function trendChip(d) {
      const t = (d.trend || '').toLowerCase();
      const cls = t === 'alcista' ? 'dk-up' : t === 'bajista' ? 'dk-dn' : 'dk-nt';
      return `<span class="dk-chip ${cls}" title="${esc(d.trendWhy || '')}">${esc(d.trend || '—')}</span>`;
    }
    function rsiChip(d) {
      if (d.rsi14 == null) return '—';
      const r = d.rsi14;
      const cls = r >= 70 ? 'dk-dn' : r <= 30 ? 'dk-up' : 'dk-nt';
      return `<span class="dk-chip ${cls}">${r} · ${esc(d.rsiRead || (r >= 70 ? 'sobrecompra' : r <= 30 ? 'sobreventa' : 'neutral'))}</span>`;
    }

    function rowHTML(w) {
      const d = dossiers[w.s];
      if (d === undefined) return `<tr data-sym="${esc(w.s)}"><td class="dk-name">${esc(w.n)}<span>${esc(w.s)}</span></td><td colspan="7" class="dk-wait">consultando…</td></tr>`;
      if (d === null) return `<tr data-sym="${esc(w.s)}"><td class="dk-name">${esc(w.n)}<span>${esc(w.s)}</span></td><td colspan="7" class="dk-wait">sin datos ahora mismo — reintenta en el próximo escaneo</td></tr>`;
      const sr = nearestSR(d);
      const sz = premium ? sizing(d) : null;
      const chg = d.changePct == null ? '—' : (d.changePct > 0 ? '+' : '') + d.changePct.toFixed(2) + '%';
      const chgCls = d.changePct > 0 ? 'dk-up' : d.changePct < 0 ? 'dk-dn' : 'dk-nt';
      return `
      <tr class="dk-row" data-sym="${esc(w.s)}" title="Toca para ver el detalle completo">
        <td class="dk-name">${esc(w.n)}<span>${esc(w.s)}</span></td>
        <td class="dk-num"><b>${fmt(d.price)}</b><span class="dk-chip ${chgCls}">${chg}</span></td>
        <td>${trendChip(d)}</td>
        <td>${rsiChip(d)}</td>
        <td class="dk-num">${d.atrPct != null ? d.atrPct.toFixed(2) + '%' : '—'}<span class="dk-sub">ATR ${fmt(d.atr14)}</span></td>
        <td class="dk-num">${sr.sup ? fmt(sr.sup) + `<span class="dk-sub">a ${sr.supDist.toFixed(1)}%</span>` : '—'}</td>
        <td class="dk-num">${sr.res ? fmt(sr.res) + `<span class="dk-sub">a ${sr.resDist.toFixed(1)}%</span>` : '—'}</td>
        <td class="dk-num">${sz ? sz.units.toLocaleString('es-PE', { maximumFractionDigits: sz.units >= 100 ? 0 : 2 }) + `<span class="dk-sub">unid. · riesgo $${sz.riskUsd.toFixed(0)}</span>` : '<span class="dk-lockcell" title="Dimensionador: solo Premium">🔒</span>'}</td>
      </tr>
      <tr class="dk-detail" data-detail="${esc(w.s)}" hidden><td colspan="8">
        <div class="dk-detail-grid">
          <div><span>Por qué la tendencia</span>${esc(d.trendWhy || '—')}</div>
          <div><span>Soportes del dossier</span>${(d.supports || []).map(fmt).join(' · ') || '—'}</div>
          <div><span>Resistencias del dossier</span>${(d.resistances || []).map(fmt).join(' · ') || '—'}</div>
          <div><span>Rango 52 semanas</span>${fmt(d.lo52)} — ${fmt(d.hi52)} (a ${d.distHi52pct != null ? d.distHi52pct + '%' : '—'} del máximo, ${d.distLo52pct != null ? d.distLo52pct + '%' : '—'} del mínimo)</div>
          <div><span>Zonas de order block</span>${d.orderBlocks && d.orderBlocks.bull ? 'Alcista ' + fmt(d.orderBlocks.bull.low) + '–' + fmt(d.orderBlocks.bull.high) : ''}${d.orderBlocks && d.orderBlocks.bear ? (d.orderBlocks.bull ? ' · ' : '') + 'Bajista ' + fmt(d.orderBlocks.bear.low) + '–' + fmt(d.orderBlocks.bear.high) : ''}${d.orderBlocks && !d.orderBlocks.bull && !d.orderBlocks.bear ? '—' : ''}</div>
          <div><span>Media 50 / 200</span>${fmt(d.sma50)} (${esc(d.slope50 || '—')}) / ${fmt(d.sma200)}</div>
          <div><span>Fuente</span>${esc(d.fuente || 'Yahoo Finance')} · ${d.fecha ? new Date(d.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
        </div>
      </td></tr>`;
    }

    function chipsHTML() {
      return watch.map((w, i) => `<span class="dk-watchchip">${esc(w.n)}${premium ? `<button data-rm="${i}" title="Quitar de la mesa">✕</button>` : ''}</span>`).join('');
    }

    function renderTable() {
      const tb = $('dkBody');
      if (tb) {
        // Conservar los detalles que el trader tenía expandidos: el escaneo
        // automático (cada 60 s) reconstruye la tabla y sin esto se cerraban.
        const abiertos = Array.from(tb.querySelectorAll('tr[data-detail]:not([hidden])')).map((tr) => tr.dataset.detail);
        tb.innerHTML = watch.map(rowHTML).join('');
        abiertos.forEach((sym) => {
          const det = tb.querySelector(`tr[data-detail="${sym.replace(/"/g, '\\"')}"]`);
          if (det) det.hidden = false;
        });
      }
      const st = $('dkStamp');
      if (st) st.textContent = 'Último escaneo: ' + new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const ch = $('dkChips');
      if (ch) ch.innerHTML = chipsHTML();
      const se = $('dkSessions');
      if (se) se.innerHTML = sessionsHTML();
    }

    async function scan() {
      if (scanning) return;
      scanning = true;
      const btn = $('dkScan');
      if (btn) { btn.disabled = true; btn.textContent = 'Escaneando…'; }
      await Promise.allSettled(watch.map(async (w) => {
        try {
          const res = await fetch('/.netlify/functions/market-dossier?symbol=' + encodeURIComponent(w.s));
          const d = await res.json();
          dossiers[w.s] = d && d.success ? d : null;
        } catch (e) { dossiers[w.s] = null; }
      }));
      renderTable();
      if (btn) { btn.disabled = false; btn.textContent = 'Escanear la mesa'; }
      scanning = false;
    }

    function briefingText() {
      const lines = ['MESA DE MERCADO AR4 · ' + new Date().toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })];
      watch.forEach((w) => {
        const d = dossiers[w.s];
        if (!d) return;
        const sr = nearestSR(d);
        lines.push(`${w.n}: ${fmt(d.price)} (${d.changePct > 0 ? '+' : ''}${(d.changePct || 0).toFixed(2)}%) | tendencia ${d.trend || '—'} | RSI ${d.rsi14} ${d.rsiRead || ''} | ATR ${d.atrPct != null ? d.atrPct.toFixed(2) + '%' : '—'}${sr.sup ? ' | S ' + fmt(sr.sup) : ''}${sr.res ? ' | R ' + fmt(sr.res) : ''}`);
      });
      lines.push('Lecturas técnicas descriptivas con datos de Yahoo Finance — no son señales ni recomendaciones. ar4mercados.com');
      return lines.join('\n');
    }

    el.innerHTML = `
      <div class="section-head" style="margin-bottom:10px;">
        <h2 class="h2-ic gold" style="font-size:1.3rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M6 12l3-3 3 2 4-5"/><path d="M8 22h8M12 18v4"/></svg>
          Mesa de Mercado AR4
        </h2>
        <span class="rl-tier-badge rl-tier-pro">★ PREMIUM · DATOS EN VIVO</span>
      </div>
      <p style="color:var(--text-mid);font-size:0.9rem;margin-bottom:12px;max-width:80ch;">
        Tu terminal de análisis: hasta ${MAX_WATCH} instrumentos a la vez con <b>datos reales</b> — precio y variación,
        régimen de tendencia contra las medias de 50 y 200, RSI, volatilidad ATR, soportes y resistencias del dossier,
        zonas de order block y rango de 52 semanas. Con dimensionador de posición por volatilidad y briefing copiable.
      </p>
      <details class="rl-help">
        <summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> ¿Cómo se usa? Ábrelo si es tu primera vez</summary>
        <div class="rl-help-body">
          <p><b>Qué es:</b> el vistazo que un operador profesional da a su pantalla antes de decidir en qué mercado enfocarse hoy. Todo sale de datos reales de Yahoo Finance (velas diarias), nada es inventado.</p>
          <ol>
            <li><b>Arma tu mesa</b>: busca cualquier instrumento (acciones, forex, cripto, índices, materias primas) y agrégalo. Se guarda para tu próxima visita.</li>
            <li><b>Escanea</b>: cada fila resume el estado técnico del activo. Toca una fila para abrir el detalle completo.</li>
            <li><b>Dimensiona</b>: pon tu capital y % de riesgo, y la última columna te calcula cuántas unidades puedes operar usando un stop de 1,5 × ATR (volatilidad real del activo).</li>
            <li><b>Comparte</b>: "Copiar briefing" te da el resumen en texto para tu diario, Telegram o notas.</li>
          </ol>
          <p><b>Importante:</b> son lecturas técnicas descriptivas (dónde está el precio respecto a sus medias, niveles del dossier). No son señales ni recomendaciones de compra o venta — la decisión siempre es tuya.</p>
        </div>
      </details>

      <div class="dk-topbar">
        <div class="dk-sessions" id="dkSessions">${sessionsHTML()}</div>
        <span class="footer-text" id="dkStamp">Aún sin escanear</span>
      </div>

      <div class="dk-controls" id="dkControls">
        <div class="dk-ctrl-left">
          <label class="rl-label" for="dkAdd">Agregar instrumento (máx. ${MAX_WATCH})</label>
          <input class="rl-input" type="text" id="dkAdd" placeholder="Busca: oro, EUR/USD, Apple, BTC…" autocomplete="off">
          <div class="dk-chips" id="dkChips">${chipsHTML()}</div>
        </div>
        <div class="dk-ctrl-right">
          <label class="rl-label" for="dkCapital">Capital (USD)</label>
          <input class="rl-input" type="number" id="dkCapital" value="5000" min="1" step="100">
          <label class="rl-label" for="dkRisk">Riesgo por operación (%)</label>
          <input class="rl-input" type="number" id="dkRisk" value="1" min="0.1" max="10" step="0.1">
          <label class="dk-auto"><input type="checkbox" id="dkAuto" checked> Auto-actualizar cada 60 s</label>
        </div>
        <div class="dk-lock" id="dkLock" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          <strong>Modo muestra: 3 activos en vivo</strong>
          <span>Con Premium armas tu mesa con hasta ${MAX_WATCH} instrumentos a tu elección, desbloqueas el dimensionador por volatilidad, el briefing copiable y la auto-actualización.</span>
          <a href="membresia.html#subscribeBtn" class="btn btn-gold">Desbloquear la mesa completa</a>
        </div>
      </div>

      <div class="dk-actions">
        <button class="btn btn-gold" id="dkScan">Escanear la mesa</button>
        <button class="btn btn-outline" id="dkBrief">Copiar briefing</button>
      </div>

      <div class="dk-tablewrap">
        <table class="dk-table">
          <thead><tr>
            <th>Instrumento</th><th>Precio</th><th>Tendencia</th><th>RSI (14)</th><th>Volatilidad</th><th>Soporte</th><th>Resistencia</th><th>Tamaño sug.</th>
          </tr></thead>
          <tbody id="dkBody"></tbody>
        </table>
      </div>
      <p class="footer-text" style="margin-top:10px;">Datos: Yahoo Finance, velas diarias · Lecturas técnicas descriptivas, no señales ni recomendaciones · El tamaño sugerido usa stop de 1,5 × ATR: ajústalo a tu plan.</p>
    `;

    function wire() {
      $('dkScan').addEventListener('click', scan);
      $('dkBrief').addEventListener('click', async () => {
        if (!premium) { window.location.href = 'membresia.html#subscribeBtn'; return; }
        try { await navigator.clipboard.writeText(briefingText()); $('dkBrief').textContent = '✔ Copiado'; setTimeout(() => { $('dkBrief').textContent = 'Copiar briefing'; }, 1600); }
        catch (e) { prompt('Copia tu briefing:', briefingText()); }
      });
      ['dkCapital', 'dkRisk'].forEach((id) => { $(id).addEventListener('input', renderTable); });
      $('dkAuto').addEventListener('change', () => {
        if (timer) { clearInterval(timer); timer = null; }
        if ($('dkAuto').checked && premium) timer = setInterval(scan, 60000);
      });
      $('dkChips').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-rm]');
        if (!b || !premium) return;
        watch.splice(parseInt(b.dataset.rm, 10), 1);
        saveWatch(); renderTable();
      });
      const tb = $('dkBody');
      tb.addEventListener('click', (e) => {
        const tr = e.target.closest('tr.dk-row');
        if (!tr) return;
        const det = tb.querySelector(`tr[data-detail="${tr.dataset.sym.replace(/"/g, '\\"')}"]`);
        if (det) det.hidden = !det.hidden;
      });
      if (window.AR4_attachSymbolSearch) {
        window.AR4_attachSymbolSearch($('dkAdd'), {
          onPick: (item) => {
            if (!premium) return;
            if (watch.length >= MAX_WATCH) { $('dkAdd').value = ''; return; }
            if (!watch.some((w) => w.s === item.symbol)) {
              watch.push({ s: item.symbol, n: item.name ? item.name.split(' - ')[0].slice(0, 18) : item.symbol });
              saveWatch();
            }
            $('dkAdd').value = '';
            renderTable(); scan();
          }
        });
      }
      setInterval(() => { const se = $('dkSessions'); if (se) se.innerHTML = sessionsHTML(); }, 30000);
    }

    (async () => {
      premium = window.AR4_checkPremium ? await window.AR4_checkPremium() : false;
      if (premium) {
        watch = loadWatch();
      } else {
        watch = DEMO_WATCH.slice();
        const lock = document.getElementById('dkLock');
        if (lock) lock.hidden = false;
        const ctr = document.getElementById('dkControls');
        if (ctr) ctr.classList.add('dk-locked');
        ['dkAdd', 'dkCapital', 'dkRisk', 'dkAuto'].forEach((id) => { const n = $(id); if (n) n.disabled = true; });
      }
      wire();
      renderTable();
      scan();
      if (premium && $('dkAuto').checked) timer = setInterval(scan, 60000);
    })();
  }

  function initPropPlanner() {
    const mount = $('propPlanner');
    if (!mount) return;
    // Dos modos: reto de fondeo (reglas de la empresa) o capital propio (tu meta).
    let mode = 'prop';
    mount.innerHTML = `
      <div class="rs-howto" style="margin-bottom:16px;">
        <div class="rs-howto-head"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5M12 17h.01'/></svg><strong>¿Cómo se usa?</strong></div>
        <ol class="rs-howto-steps">
          <li><b>1.</b> Elige tu modo: reto de una empresa de fondeo o tu propia cuenta.</li>
          <li><b>2.</b> Escribe tus reglas o tu meta, tu R:R medio y tu % de aciertos realista.</li>
          <li><b>3.</b> El plan te dice cuántas operaciones necesitas, tu margen de error y la racha perdedora que deberías esperar.</li>
          <li><b>4.</b> Si el plan exige perfección, está mal planteado: ajústalo antes de arriesgar dinero.</li>
        </ol>
      </div>
      <div class="pp-mode" id="ppMode">
        <button type="button" class="pp-mode-btn active" data-mode="prop"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z'/></svg> Reto de fondeo</button>
        <button type="button" class="pp-mode-btn" data-mode="own"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><circle cx='12' cy='8' r='3.5'/><path d='M5 20c0-3.5 3-6 7-6s7 2.5 7 6'/></svg> Capital propio</button>
      </div>
      <div class="rl-grid" id="ppFields"></div>
      <button class="btn btn-gold" id="ppRun" style="margin-top:14px;">Calcular mi plan</button>
      <div id="ppOut" style="margin-top:16px;"></div>`;

    function fieldsHTML() {
      if (mode === 'prop') return `
        <div class="rl-field"><label>Tamaño de la cuenta (USD)</label><input type="number" id="ppAccount" value="10000" step="any"></div>
        <div class="rl-field"><label>Objetivo de ganancia (%)</label><input type="number" id="ppTarget" value="8" step="0.5"></div>
        <div class="rl-field"><label>Límite de pérdida diaria (%)</label><input type="number" id="ppDaily" value="5" step="0.5"></div>
        <div class="rl-field"><label>Límite de pérdida total (%)</label><input type="number" id="ppMax" value="10" step="0.5"></div>
        <div class="rl-field"><label>Riesgo por operación (%)</label><input type="number" id="ppRisk" value="0.5" step="0.1"></div>
        <div class="rl-field"><label>R:R medio de tu sistema</label><input type="number" id="ppRR" value="2" step="0.1"></div>
        <div class="rl-field"><label>% de aciertos realista</label><input type="number" id="ppWin" value="45" step="1"></div>`;
      return `
        <div class="rl-field"><label>Tu capital (USD)</label><input type="number" id="ppAccount" value="2000" step="any"></div>
        <div class="rl-field"><label>Meta de crecimiento (%)</label><input type="number" id="ppTarget" value="10" step="0.5"></div>
        <div class="rl-field"><label>Riesgo por operación (%)</label><input type="number" id="ppRisk" value="1" step="0.1"></div>
        <div class="rl-field"><label>R:R medio de tu sistema</label><input type="number" id="ppRR" value="2" step="0.1"></div>
        <div class="rl-field"><label>% de aciertos realista</label><input type="number" id="ppWin" value="45" step="1"></div>
        <div class="rl-field"><label>Operaciones por semana</label><input type="number" id="ppOps" value="10" step="1"></div>`;
    }

    function run() {
      const acc = parseFloat($('ppAccount').value) || 0;
      const target = parseFloat($('ppTarget').value) || 0;
      const risk = parseFloat($('ppRisk').value) || 0;
      const rr = parseFloat($('ppRR').value) || 0;
      const win = (parseFloat($('ppWin').value) || 0) / 100;
      const out = $('ppOut');
      if (!acc || !target || !risk || !rr) { out.innerHTML = '<div class="community-form-msg error">Completa los campos con valores válidos.</div>'; return; }

      const q = 1 - win;
      const targetR = target / risk;
      const expectancyR = win * rr - q;
      const tradesNeeded = expectancyR > 0 ? Math.ceil(targetR / expectancyR) : null;
      // Racha perdedora esperada en N operaciones: log(N) / log(1/q) — estadística clásica.
      const streak = (tradesNeeded && q > 0 && q < 1) ? Math.max(1, Math.round(Math.log(tradesNeeded) / Math.log(1 / q))) : null;

      const rows = [];
      let verdict, cls;

      if (mode === 'prop') {
        const daily = parseFloat($('ppDaily').value) || 0;
        const maxdd = parseFloat($('ppMax').value) || 0;
        const lossesToDaily = Math.floor(daily / risk);
        const lossesToMax = Math.floor(maxdd / risk);
        rows.push(
          ['Necesitas ganar', clean(targetR, 1) + ' R netos', 'objetivo ÷ riesgo por operación'],
          ['Esperanza de tu sistema', (expectancyR >= 0 ? '+' : '') + num(expectancyR, 2) + ' R por operación', '(' + Math.round(win * 100) + '% × ' + rr + ') − ' + Math.round(q * 100) + '%'],
          ['Operaciones estimadas', tradesNeeded ? '~' + tradesNeeded : '—', tradesNeeded ? 'si se cumple tu estadística' : 'esperanza negativa: no llegas nunca'],
          ['Racha perdedora esperada', streak ? streak + ' seguidas' : '—', 'lo estadísticamente normal en ese camino'],
          ['Colchón diario', lossesToDaily + ' pérdidas seguidas', 'antes de romper el límite del día'],
          ['Colchón total', lossesToMax + ' R de margen', 'antes de perder el reto']
        );
        if (expectancyR <= 0) { verdict = 'Con esa estadística el reto es matemáticamente imposible: la esperanza es negativa. Sube tu R:R o tu tasa de acierto antes de pagar un reto.'; cls = 'error'; }
        else if (streak && streak >= lossesToDaily) { verdict = 'Alerta clave: tu racha perdedora esperada (' + streak + ') alcanza o supera tu colchón diario (' + lossesToDaily + '). Una mala tarde estadísticamente NORMAL te saca del reto. Baja el riesgo por operación.'; cls = 'error'; }
        else if (lossesToDaily < 3) { verdict = 'Peligro: con ese riesgo por operación, ' + lossesToDaily + ' pérdidas seguidas rompen tu límite diario. Baja el riesgo.'; cls = 'error'; }
        else if (tradesNeeded > 200) { verdict = 'Viable pero lento (~' + tradesNeeded + ' operaciones). Revisa si el reto tiene límite de tiempo.'; cls = ''; }
        else { verdict = 'Plan razonable: ~' + tradesNeeded + ' operaciones, racha perdedora esperada de ' + streak + ' frente a un colchón diario de ' + lossesToDaily + '. La estadística solo se cumple si ejecutas SIEMPRE igual.'; cls = 'success'; }
      } else {
        const ops = Math.max(1, parseFloat($('ppOps').value) || 1);
        const weeks = tradesNeeded ? Math.ceil(tradesNeeded / ops) : null;
        const typicalDD = streak ? streak * risk : null; // aproximación simple y transparente
        rows.push(
          ['Necesitas ganar', clean(targetR, 1) + ' R netos', 'meta ÷ riesgo por operación'],
          ['Esperanza de tu sistema', (expectancyR >= 0 ? '+' : '') + num(expectancyR, 2) + ' R por operación', '(' + Math.round(win * 100) + '% × ' + rr + ') − ' + Math.round(q * 100) + '%'],
          ['Operaciones estimadas', tradesNeeded ? '~' + tradesNeeded : '—', tradesNeeded ? 'si se cumple tu estadística' : 'esperanza negativa: no llegas nunca'],
          ['Tiempo estimado', weeks ? (weeks < 5 ? '~' + weeks + ' semana' + (weeks === 1 ? '' : 's') : '~' + Math.round(weeks / 4.3) + ' meses') : '—', 'a ' + ops + ' operaciones/semana'],
          ['Racha perdedora esperada', streak ? streak + ' seguidas' : '—', 'prepárate mentalmente para esto'],
          ['Retroceso típico en el camino', typicalDD ? '≈ −' + clean(typicalDD, 1) + '%' : '—', 'racha esperada × tu riesgo (aproximación)']
        );
        if (expectancyR <= 0) { verdict = 'Con esa estadística tu cuenta pierde por matemática, no por mala suerte. Antes de la meta, trabaja el sistema: sube el R:R o el % de aciertos.'; cls = 'error'; }
        else if (typicalDD && typicalDD > 15) { verdict = 'Tu meta es alcanzable, pero por el camino deberías esperar retrocesos de ≈' + clean(typicalDD, 1) + '%. Si ese número te haría abandonar, baja el riesgo por operación: llegar más lento es mejor que no llegar.'; cls = ''; }
        else if (target > 20) { verdict = 'Meta ambiciosa (' + clean(target, 0) + '% con ' + clean(risk, 1) + '% de riesgo). Es matemáticamente posible en ~' + tradesNeeded + ' operaciones, pero metas mensuales altas sostenidas no son lo normal ni siquiera entre profesionales. Considera una meta por fases.'; cls = ''; }
        else { verdict = 'Plan sólido: ~' + tradesNeeded + ' operaciones para tu meta, con una racha perdedora esperada de ' + streak + ' y retrocesos normales de ≈' + clean(typicalDD, 1) + '%. Conocer estos números ANTES es lo que evita abandonar en medio del plan.'; cls = 'success'; }
      }

      out.innerHTML = `
        <div class="rl-results">${rows.map((r) => `<div class="rl-card"><span>${r[0]}</span><strong>${r[1]}</strong><em>${r[2]}</em></div>`).join('')}</div>
        <div class="community-form-msg ${cls}" style="margin-top:12px;">${verdict}</div>
        <p style="color:var(--text-low);font-size:0.76rem;margin-top:8px;">Cálculo determinista sobre tus propios supuestos; no predice resultados ni garantiza rentabilidad alguna.${mode === 'prop' ? ' Las reglas exactas varían según la empresa de fondeo.' : ''}</p>`;
    }

    function renderFields() { $('ppFields').innerHTML = fieldsHTML(); run(); }
    document.getElementById('ppMode').querySelectorAll('.pp-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        document.querySelectorAll('.pp-mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderFields();
      });
    });
    $('ppRun').addEventListener('click', run);
    renderFields();
  }
  // ============================================================
  // Stop inteligente por volatilidad (Premium): ATR real del instrumento
  // vía nuestra función de datos (Yahoo). Estructura, no señal.
  // ============================================================
  function initAtrStop() {
    const mount = $('atrStopTool');
    if (!mount) return;
    const ATR_SYMBOLS = [
      ['EURUSD=X', 'EUR/USD'], ['GBPUSD=X', 'GBP/USD'], ['USDJPY=X', 'USD/JPY'], ['GC=F', 'Oro'], ['SI=F', 'Plata'], ['CL=F', 'Petróleo WTI'],
      ['^NDX', 'Nasdaq 100'], ['^GSPC', 'S&P 500'], ['^DJI', 'Dow Jones'], ['BTC-USD', 'Bitcoin'], ['ETH-USD', 'Ethereum'],
      ['AAPL', 'Apple'], ['TSLA', 'Tesla'], ['NVDA', 'NVIDIA']
    ];
    mount.innerHTML = `
      <div class="rl-lock-wrap">
        <div class="rs-howto" style="margin-bottom:16px;">
          <div class="rs-howto-head"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5M12 17h.01'/></svg><strong>¿Cómo se usa?</strong></div>
          <ol class="rs-howto-steps">
            <li><b>1.</b> Elige el instrumento: traemos su precio y su ATR(14) diario reales.</li>
            <li><b>2.</b> El ATR mide cuánto se mueve "normalmente" al día: un stop menor a eso es ruido.</li>
            <li><b>3.</b> Te mostramos stops de 1×, 1.5× y 2× ATR con el tamaño de posición para tu riesgo.</li>
            <li><b>4.</b> Es estructura de volatilidad, no una señal: la dirección la decides tú.</li>
          </ol>
        </div>
        <div class="rl-grid">
          <div class="rl-field"><label>Instrumento — busca cualquiera del mundo</label><input type="text" id="atrSym" value="EUR/USD" placeholder="EUR/USD, oro, Ferrari, SAP, Nikkei…" autocomplete="off"></div>
          <div class="rl-field"><label>Capital (USD)</label><input type="number" id="atrCap" value="1000" step="any"></div>
          <div class="rl-field"><label>Riesgo por operación (%)</label><input type="number" id="atrRisk" value="1" step="0.1"></div>
        </div>
        <button class="btn btn-gold" id="atrRun" style="margin-top:14px;">Calcular con datos reales</button>
        <div id="atrOut" style="margin-top:16px;"></div>
        <div class="rl-lock-overlay" id="atrLock" hidden>
          <div class="rl-lock-card">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            <h3>Herramienta Premium</h3>
            <p>Usa el ATR real de cada instrumento para dimensionar stops que respetan la volatilidad — la técnica que el nivel institucional enseña en el módulo de riesgo.</p>
            <a href="membresia.html" class="btn btn-gold">Ver AR4 Premium</a>
          </div>
        </div>
      </div>`;

    let atrSel = { y: 'EURUSD=X', label: 'EUR/USD' };
    function resolveAtr(typed) {
      const t = (typed || '').trim();
      const local = ATR_SYMBOLS.find((s) => s[1].toLowerCase() === t.toLowerCase() || s[0].toUpperCase() === t.toUpperCase());
      if (local) return { y: local[0], label: local[1] };
      if (atrSel && (t === atrSel.y || t === atrSel.label)) return atrSel;
      if (t) return { y: t, label: t }; // símbolo Yahoo directo
      return atrSel;
    }
    async function run() {
      const out = $('atrOut');
      const sel = resolveAtr($('atrSym').value);
      const sym = sel.y;
      const cap = parseFloat($('atrCap').value) || 0;
      const riskPct = parseFloat($('atrRisk').value) || 0;
      if (!cap || !riskPct) { out.innerHTML = '<div class="community-form-msg error">Completa capital y riesgo.</div>'; return; }
      out.innerHTML = '<p class="footer-text">Consultando datos reales del mercado...</p>';
      try {
        const res = await fetch('/.netlify/functions/market-dossier?symbol=' + encodeURIComponent(sym));
        const d = await res.json();
        if (!d.success || !d.atr14 || !d.price) throw new Error(d.error || 'Sin datos para este instrumento ahora.');
        const riskUSD = cap * (riskPct / 100);
        const dec = Math.abs(d.price) < 10 ? 5 : 2;
        const mult = [1, 1.5, 2];
        out.innerHTML = `
          <div class="rl-results">
            <div class="rl-card"><span>Precio actual</span><strong>${num(d.price, dec)}</strong><em>dato real de mercado</em></div>
            <div class="rl-card"><span>ATR(14) diario</span><strong>${num(d.atr14, dec)}</strong><em>movimiento diario típico</em></div>
            ${mult.map((k) => {
              const dist = d.atr14 * k;
              const units = riskUSD / dist;
              return `<div class="rl-card"><span>Stop ${k}× ATR</span><strong>${num(dist, dec)}</strong><em>≈ ${num(units, 2)} unidades para arriesgar ${money(riskUSD)}</em></div>`;
            }).join('')}
          </div>
          <div class="community-form-msg" style="margin-top:12px;">Un stop por debajo de 1× ATR queda dentro del ruido diario normal de ${sel.label}: es probable que salte sin que tu tesis esté equivocada. 1.5× es el punto medio clásico; 2× da más aire a cambio de menos tamaño.</div>
          <p style="color:var(--text-low);font-size:0.76rem;margin-top:8px;">ATR calculado sobre datos históricos reales (Yahoo Finance). Describe volatilidad, no dirección: no constituye una señal de compra o venta.</p>`;
      } catch (e) {
        out.innerHTML = '<div class="community-form-msg error">' + (e.message || 'No se pudieron cargar los datos.') + '</div>';
      }
    }

    (async () => {
      const isPro = window.AR4_checkPremium ? await window.AR4_checkPremium() : false;
      if (!isPro) {
        $('atrLock').hidden = false;
        ['atrSym', 'atrCap', 'atrRisk', 'atrRun'].forEach((id) => { const el = $(id); if (el) el.disabled = true; });
        return;
      }
      $('atrRun').addEventListener('click', run);
      if (window.AR4_attachSymbolSearch) {
        window.AR4_attachSymbolSearch($('atrSym'), {
          onPick: (item) => { atrSel = { y: item.symbol, label: item.name }; $('atrSym').value = item.symbol; run(); }
        });
      }
      run();
    })();
  }


  // ============================================================
  // Matriz de correlaciones en vivo (Premium · nivel mesa).
  // Datos reales: cierres diarios de Yahoo por instrumento; correlación de
  // Pearson sobre los retornos de la ventana elegida. Describe co-movimiento
  // histórico reciente — no predice, y las correlaciones cambian de régimen.
  // ============================================================
  function initCorrelationLab() {
    const mount = $('correlationLab');
    if (!mount) return;
    const DEFAULT_BASKET = [
      { sym: 'DX-Y.NYB', label: 'DXY' },
      { sym: 'EURUSD=X', label: 'EUR/USD' },
      { sym: 'GC=F', label: 'Oro' },
      { sym: '^GSPC', label: 'S&P 500' },
      { sym: 'BTC-USD', label: 'Bitcoin' },
      { sym: 'CL=F', label: 'WTI' }
    ];
    let windowDays = 90;
    mount.innerHTML = `
      <div class="rl-lock-wrap">
        <div class="rs-howto" style="margin-bottom:16px;">
          <div class="rs-howto-head"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5M12 17h.01'/></svg><strong>¿Cómo se usa?</strong></div>
          <ol class="rs-howto-steps">
            <li><b>1.</b> Elige hasta 6 instrumentos (cualquiera del mundo, con el buscador) y la ventana de días.</li>
            <li><b>2.</b> Calculamos la correlación real de sus retornos diarios (datos de Yahoo Finance).</li>
            <li><b>3.</b> Verde fuerte = se mueven juntos; rojo fuerte = se mueven al revés; cerca de 0 = independientes.</li>
            <li><b>4.</b> El uso de mesa: si tus posiciones están en celdas verdes fuertes, no estás diversificado — es UNA apuesta repetida.</li>
          </ol>
        </div>
        <div class="corr-slots" id="corrSlots">
          ${DEFAULT_BASKET.map((b, i) => `<div class="rl-field"><label>Instrumento ${i + 1}</label><input type="text" class="corr-sym" data-i="${i}" value="${b.sym}" data-label="${b.label}" autocomplete="off"></div>`).join('')}
        </div>
        <div class="corr-controls">
          <div class="pp-mode" style="margin:0;">
            <button type="button" class="pp-mode-btn corr-win" data-d="30">30 días</button>
            <button type="button" class="pp-mode-btn corr-win active" data-d="90">90 días</button>
            <button type="button" class="pp-mode-btn corr-win" data-d="180">180 días</button>
          </div>
          <button class="btn btn-gold" id="corrRun">Calcular con datos reales</button>
        </div>
        <div id="corrOut" style="margin-top:16px;"></div>
        <div class="rl-lock-overlay" id="corrLock" hidden>
          <div class="rl-lock-card">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            <h3>Herramienta Premium · nivel mesa</h3>
            <p>La matriz que usan los profesionales para no repetir la misma apuesta sin saberlo: correlaciones reales entre tus mercados, con la ventana que elijas.</p>
            <a href="membresia.html" class="btn btn-gold">Ver AR4 Premium</a>
          </div>
        </div>
      </div>`;

    function labelOf(inp) {
      const v = (inp.value || '').trim();
      return (inp.dataset.label && (v === inp.dataset.sym || v === inp.dataset.label || v === inp.defaultValue)) ? inp.dataset.label : (inp.dataset.label && v === inp.dataset.pick ? inp.dataset.label : v);
    }

    async function fetchCloses(sym) {
      const range = windowDays <= 30 ? '3mo' : (windowDays <= 90 ? '6mo' : '1y');
      const r = await fetch('/.netlify/functions/market-candles?symbol=' + encodeURIComponent(sym) + '&interval=1d&range=' + range);
      const d = await r.json();
      if (!d.success || !d.candles || d.candles.length < 20) throw new Error('Sin datos para ' + sym);
      const map = {};
      d.candles.forEach((c) => { if (c.close != null) map[Math.floor(c.time / 86400)] = c.close; });
      return map;
    }
    function pearson(a, b) {
      const n = a.length;
      let sa = 0, sb = 0;
      for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
      const ma = sa / n, mb = sb / n;
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < n; i++) { const xa = a[i] - ma, xb = b[i] - mb; num += xa * xb; da += xa * xa; db += xb * xb; }
      const den = Math.sqrt(da * db);
      return den ? num / den : 0;
    }

    async function run() {
      const out = $('corrOut');
      const inputs = [...mount.querySelectorAll('.corr-sym')];
      const syms = inputs.map((i) => i.value.trim()).filter(Boolean);
      const labels = inputs.filter((i) => i.value.trim()).map((i) => i.dataset.pick === i.value.trim() && i.dataset.label ? i.dataset.label : (i.dataset.label && i.value.trim() === i.getAttribute('value') ? i.dataset.label : i.value.trim()));
      if (syms.length < 2) { out.innerHTML = '<div class="community-form-msg error">Necesitas al menos 2 instrumentos.</div>'; return; }
      out.innerHTML = '<p class="footer-text">Descargando cierres reales de ' + syms.length + ' instrumentos…</p>';
      try {
        const maps = await Promise.all(syms.map(fetchCloses));
        // días comunes a todos
        let days = Object.keys(maps[0]);
        for (let i = 1; i < maps.length; i++) days = days.filter((d) => maps[i][d] != null);
        days = days.map(Number).sort((a, b) => a - b).slice(-(windowDays + 1));
        if (days.length < 15) throw new Error('Muy pocos días comunes entre estos instrumentos para la ventana elegida.');
        // retornos diarios alineados
        const rets = maps.map((m) => {
          const r = [];
          for (let i = 1; i < days.length; i++) r.push(Math.log(m[days[i]] / m[days[i - 1]]));
          return r;
        });
        const n = syms.length;
        const M = [];
        for (let i = 0; i < n; i++) { M[i] = []; for (let j = 0; j < n; j++) M[i][j] = i === j ? 1 : pearson(rets[i], rets[j]); }
        // pares extremos (sin diagonal)
        let hi = { v: -2 }, lo = { v: 2 };
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          if (M[i][j] > hi.v) hi = { v: M[i][j], a: labels[i], b: labels[j] };
          if (M[i][j] < lo.v) lo = { v: M[i][j], a: labels[i], b: labels[j] };
        }
        const cell = (v) => {
          if (v === 1) return '<td class="corr-diag">—</td>';
          const g = v > 0;
          const alpha = Math.min(0.85, Math.abs(v) * 0.85);
          const bg = g ? 'rgba(46,204,113,' + alpha * 0.45 + ')' : 'rgba(225,58,75,' + alpha * 0.45 + ')';
          return '<td style="background:' + bg + ';">' + v.toFixed(2) + '</td>';
        };
        out.innerHTML = `
          <div class="corr-table-wrap"><table class="corr-table">
            <tr><th></th>${labels.map((l) => '<th>' + l + '</th>').join('')}</tr>
            ${M.map((row, i) => '<tr><th>' + labels[i] + '</th>' + row.map(cell).join('') + '</tr>').join('')}
          </table></div>
          <div class="rl-results" style="margin-top:12px;">
            <div class="rl-card"><span>Más correlacionados</span><strong>${hi.a} + ${hi.b}</strong><em>${hi.v.toFixed(2)} — en la práctica son la misma apuesta</em></div>
            <div class="rl-card"><span>Más inversos</span><strong>${lo.a} vs ${lo.b}</strong><em>${lo.v.toFixed(2)} — tienden a moverse al revés</em></div>
            <div class="rl-card"><span>Ventana analizada</span><strong>${days.length - 1} días</strong><em>retornos diarios reales comunes a todos</em></div>
          </div>
          <p style="color:var(--text-low);font-size:0.76rem;margin-top:10px;">Correlación de Pearson sobre retornos diarios (Yahoo Finance). Es una foto histórica de la ventana elegida: los regímenes cambian y en crisis las correlaciones tienden a subir de golpe. No constituye una recomendación.</p>`;
      } catch (e) {
        out.innerHTML = '<div class="community-form-msg error">' + (e.message || 'No se pudieron cargar los datos.') + '</div>';
      }
    }

    mount.querySelectorAll('.corr-win').forEach((b) => b.addEventListener('click', () => {
      windowDays = parseInt(b.dataset.d, 10);
      mount.querySelectorAll('.corr-win').forEach((x) => x.classList.toggle('active', x === b));
    }));

    (async () => {
      const isProUser = window.AR4_checkPremium ? await window.AR4_checkPremium() : false;
      if (!isProUser) {
        $('corrLock').hidden = false;
        mount.querySelectorAll('input,button').forEach((el2) => { if (!el2.closest('.rl-lock-overlay')) el2.disabled = true; });
        return;
      }
      if (window.AR4_attachSymbolSearch) {
        mount.querySelectorAll('.corr-sym').forEach((inp) => {
          window.AR4_attachSymbolSearch(inp, { onPick: (item) => { inp.value = item.symbol; inp.dataset.pick = item.symbol; inp.dataset.label = item.name.split(' ')[0]; } });
        });
      }
      $('corrRun').addEventListener('click', run);
      run();
    })();
  }

  initFreeLab();
  initDdLab();
  initMarketDesk();
  initPropPlanner();
  initAtrStop();
  initCorrelationLab();
})();
