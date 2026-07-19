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
          <strong>¿Y después de cientos de operaciones?</strong>
          <span>Esta tabla es matemática de una caída. El <b>Simulador de Supervivencia</b> repite tu vida de trading miles de
          veces y te dice si tu método aguanta: probabilidad de ruina, drawdown esperado, rachas y curvas de capital.</span>
        </div>
        <a href="membresia.html" class="btn btn-gold">Ver el simulador</a>
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
  function initProLab() {
    const el = $('riskLabPro');
    if (!el) return;

    const FREE_SIMS = 200;      // el plan gratis puede probarlo, con potencia limitada
    const PRO_SIMS_MAX = 5000;  // Premium: simulación completa
    const RUIN_LEVEL = 0.5;     // "ruina práctica": perder la mitad de la cuenta
    let isPro = false;

    // Una vida completa de trading según TUS supuestos, con interés compuesto.
    function simulate(capital, riskPct, winRate, rr, trades, keepCurve) {
      let eq = capital, peak = capital, maxDD = 0, streak = 0, maxStreak = 0, ruined = false;
      const curve = keepCurve ? [eq] : null;
      for (let i = 0; i < trades; i++) {
        const risk = eq * (riskPct / 100);
        if (Math.random() * 100 < winRate) { eq += risk * rr; streak = 0; }
        else { eq -= risk; streak++; if (streak > maxStreak) maxStreak = streak; }
        if (eq > peak) peak = eq;
        const dd = ((peak - eq) / peak) * 100;
        if (dd > maxDD) maxDD = dd;
        if (!ruined && eq <= capital * RUIN_LEVEL) ruined = true;
        if (keepCurve) curve.push(eq);
      }
      return { final: eq, maxDD, maxStreak, ruined, curve };
    }

    const pct = (arr, p) => {
      const s = arr.slice().sort((a, b) => a - b);
      return s[Math.min(s.length - 1, Math.max(0, Math.floor((p / 100) * s.length)))];
    };

    el.innerHTML = `
      <div class="section-head" style="margin-bottom:14px;">
        <h2 class="h2-ic gold" style="font-size:1.3rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l4.5 3.5L12 4l4.5 6.5L21 7l-1.8 11H4.8L3 7z"/></svg>
          Simulador de Supervivencia
        </h2>
        <span class="rl-tier-badge rl-tier-pro" id="rlProTier">★ NIVEL PREMIUM</span>
      </div>
      <p style="color:var(--text-mid);font-size:0.9rem;margin-bottom:18px;max-width:78ch;">
        La calculadora de arriba te dice qué pasa en <b>una</b> operación. Este simulador te dice qué le pasa a tu cuenta
        después de <b>cientos</b>, repitiendo tu vida de trading miles de veces. Es la diferencia entre saber cuánto arriesgas
        y saber si tu método <b>sobrevive</b>.
      </p>

      <details class="rl-help">
        <summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> ¿Cómo se usa? Ábrelo si es tu primera vez</summary>
        <div class="rl-help-body">
          <p><b>Qué hace:</b> repite tu forma de operar cientos de veces "lanzando los dados", para ver no lo que pasa una vez, sino lo que le pasa a tu cuenta a la larga. Los números salen de <b>tus</b> supuestos, no del mercado.</p>
          <ol>
            <li><b>% de aciertos</b> — de cada 100 operaciones, cuántas ganas. Sé honesto: míralo en tu diario o en tu backtest.</li>
            <li><b>Ratio R:R</b> — cuánto ganas cuando aciertas frente a lo que arriesgas. R:R 2 significa que ganas el doble de lo que arriesgas.</li>
            <li><b>Riesgo por operación</b> — qué porcentaje de la cuenta pones en juego cada vez.</li>
            <li>Pulsa <b>Ejecutar simulación</b> y lee el panel "Qué le pasa a tu cuenta".</li>
          </ol>
          <p><b>Cómo leer el resultado:</b> si la <b>Expectativa por operación</b> es positiva, tu método tiene ventaja; si es 0 o negativa, pierde por matemática (ningún tamaño de posición lo arregla). La <b>Prob. de perder la mitad</b> te dice cuántas de esas "vidas" se hunden.</p>
          <p><b>Las curvas de capital</b> de abajo son 45 versiones de tu cuenta: cada línea es una vida distinta con los mismos supuestos. <span style="color:#2ecc71;">Verdes</span> = terminan arriba, <span style="color:#e13a4b;">rojas</span> = terminan abajo. Cuantas más rojas veas, más frágil es el plan.</p>
        </div>
      </details>

      <div class="rl-pro-banner" id="rlProBanner" hidden></div>

      <div class="rl-grid">
        <div class="rl-panel rl-panel-pro">
          <h3 class="rl-h">Tus supuestos</h3>
          <label class="rl-label" for="rpCapital">Capital inicial (USD)</label>
          <input class="rl-input" type="number" id="rpCapital" value="5000" min="1" step="100">

          <label class="rl-label" for="rpRisk">Riesgo por operación: <b id="rpRiskVal">1%</b></label>
          <input class="rl-range" type="range" id="rpRisk" value="1" min="0.25" max="10" step="0.25">

          <div class="rl-lockwrap" id="rlLockWrap">
            <label class="rl-label" for="rpWin">% de aciertos: <b id="rpWinVal">40%</b></label>
            <input class="rl-range" type="range" id="rpWin" value="40" min="10" max="90" step="1">

            <label class="rl-label" for="rpRR">Ratio R:R (ganas × lo que arriesgas): <b id="rpRRVal">1.5</b></label>
            <input class="rl-range" type="range" id="rpRR" value="1.5" min="0.25" max="6" step="0.25">

            <label class="rl-label" for="rpTrades">Operaciones a simular: <b id="rpTradesVal">200</b></label>
            <input class="rl-range" type="range" id="rpTrades" value="200" min="20" max="1000" step="10">

            <label class="rl-label" for="rpSims">Simulaciones: <b id="rpSimsVal">200</b></label>
            <input class="rl-range" type="range" id="rpSims" value="200" min="100" max="${PRO_SIMS_MAX}" step="100">
            <div class="rl-lock-overlay" id="rlLockOverlay" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <strong>Parámetros bloqueados</strong>
              <span>En Premium ajustas tu % de aciertos, tu R:R, cuántas operaciones y hasta ${PRO_SIMS_MAX.toLocaleString('es-PE')} simulaciones.</span>
              <a href="membresia.html#subscribeBtn" class="btn btn-gold">Desbloquear</a>
            </div>
          </div>

          <button class="btn btn-gold btn-block" id="rpRun" style="margin-top:14px;">Ejecutar simulación</button>
          <div class="rl-msg" id="rpMsg"></div>
        </div>

        <div class="rl-panel rl-panel-out rl-panel-pro-out">
          <h3 class="rl-h">Qué le pasa a tu cuenta</h3>
          <div class="rl-out-main">
            <span class="rl-out-label">Capital final (mediana)</span>
            <strong id="rpMedian">—</strong>
            <span class="rl-out-sub" id="rpRange">—</span>
          </div>
          <div class="rl-stats rl-stats-3">
            <div class="rl-stat"><span>Terminan en ganancia</span><strong id="rpProfitable">—</strong></div>
            <div class="rl-stat"><span>Expectativa / operación</span><strong id="rpExpectancy">—</strong></div>
            <div class="rl-stat"><span>Drawdown máx. (mediana)</span><strong id="rpDD" class="rl-neg">—</strong></div>
            <div class="rl-stat rl-stat-pro"><span>Prob. de perder la mitad</span><strong id="rpRuin">—</strong></div>
            <div class="rl-stat rl-stat-pro"><span>Racha perdedora máx.</span><strong id="rpStreak">—</strong></div>
            <div class="rl-stat rl-stat-pro"><span>Kelly óptimo</span><strong id="rpKelly">—</strong></div>
          </div>
          <div class="rl-verdict" id="rpVerdict">Ejecuta la simulación para ver el resultado.</div>
        </div>
      </div>

      <div class="rl-curves-wrap">
        <div class="rl-curves-head">
          <h3 class="rl-h" style="margin:0;">Curvas de capital</h3>
          <span id="rpCurvesNote">—</span>
        </div>
        <div class="rl-curves" id="rpCurves"></div>
        <div class="rl-curves-lock" id="rlCurvesLock" hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          <div>
            <strong>Las curvas de capital son Premium</strong>
            <span>Aquí se ve, camino por camino, cuántas versiones de tu cuenta sobreviven y cuántas se hunden.</span>
          </div>
          <a href="membresia.html#subscribeBtn" class="btn btn-gold">Ver Premium</a>
        </div>
      </div>

      <div class="rl-hist-wrap" id="rpHistWrap" hidden>
        <div class="rl-hist-head">
          <h3 class="rl-h" style="margin:0;">Distribución de finales: ¿dónde acaba tu cuenta?</h3>
          <span id="rpHistNote">—</span>
        </div>
        <div class="rl-hist" id="rpHist"></div>
      </div>

      <p class="rl-disclaimer">
        <b>Esto no predice el mercado.</b> Proyecta la matemática de los supuestos que tú introduces: si tu % de aciertos real
        es distinto al que pones aquí, el resultado será distinto. No es una señal, ni una promesa de rentabilidad.
      </p>

      <div class="rl-cta rl-cta-pro" id="rlProCta">
        <div>
          <strong>¿Quieres más capacidad y más profundidad?</strong>
          <span>El plan gratis ejecuta ${FREE_SIMS} simulaciones con parámetros fijos. <b>Premium</b> desbloquea tus propios supuestos,
          hasta ${PRO_SIMS_MAX.toLocaleString('es-PE')} simulaciones, las curvas de capital, la probabilidad de ruina y el Kelly —
          y Aria te explica qué hacer con esos números.</span>
        </div>
        <a href="membresia.html#subscribeBtn" class="btn btn-gold">Actualizar a Premium</a>
      </div>
    `;

    const capEl = $('rpCapital'), riskEl = $('rpRisk'), winEl = $('rpWin'),
          rrEl = $('rpRR'), tradesEl = $('rpTrades'), simsEl = $('rpSims');

    function syncLabels() {
      $('rpRiskVal').textContent = clean(parseFloat(riskEl.value), 2) + '%';
      $('rpWinVal').textContent = winEl.value + '%';
      $('rpRRVal').textContent = num(parseFloat(rrEl.value), 2);
      $('rpTradesVal').textContent = tradesEl.value;
      $('rpSimsVal').textContent = parseInt(simsEl.value, 10).toLocaleString('es-PE');
    }

    function drawCurves(curves, capital) {
      const W = 720, H = 220, PAD = 4;
      let max = capital, min = capital;
      curves.forEach((c) => c.forEach((v) => { if (v > max) max = v; if (v < min) min = v; }));
      if (max === min) max = min + 1;
      const n = curves[0].length - 1;
      const x = (i) => PAD + (i / n) * (W - PAD * 2);
      const y = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
      const paths = curves.map((c) => {
        const up = c[c.length - 1] >= capital;
        const d = c.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
        return `<path d="${d}" fill="none" stroke="${up ? 'rgba(46,204,113,0.35)' : 'rgba(225,58,75,0.35)'}" stroke-width="1"/>`;
      }).join('');
      // Banda P10–P90 + mediana por paso: el "camino esperado" de tu cuenta.
      const steps = curves[0].length;
      const bandTop = [], bandBot = [], medPath = [];
      for (let i = 0; i < steps; i++) {
        const col = curves.map((c) => c[i]).sort((a, b) => a - b);
        bandBot.push(col[Math.floor(col.length * 0.10)]);
        bandTop.push(col[Math.min(col.length - 1, Math.floor(col.length * 0.90))]);
        medPath.push(col[Math.floor(col.length * 0.50)]);
      }
      const bandD = bandTop.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ') +
        bandBot.slice().reverse().map((v, idx) => ' L' + x(steps - 1 - idx).toFixed(1) + ' ' + y(v).toFixed(1)).join('') + ' Z';
      const medD = medPath.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
      const band = `<path d="${bandD}" fill="rgba(212,175,55,0.10)" stroke="none"/>` +
        `<path d="${medD}" fill="none" stroke="rgba(240,199,94,0.95)" stroke-width="2"/>`;
      const base = `<line x1="${PAD}" y1="${y(capital).toFixed(1)}" x2="${W - PAD}" y2="${y(capital).toFixed(1)}" stroke="rgba(240,199,94,0.55)" stroke-width="1.2" stroke-dasharray="5 4"/>`;
      $('rpCurves').innerHTML =
        `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Curvas de capital simuladas">${paths}${band}${base}</svg>` +
        `<span class="rl-curves-legend"><i class="rl-lg-gold"></i>Mediana y banda 10–90% <i class="rl-lg-up"></i>Termina arriba <i class="rl-lg-dn"></i>Termina abajo</span>`;
    }

    // Histograma de capitales finales: dónde cae cada "vida" simulada.
    function drawHist(finals, capital, median) {
      const W = 720, H = 150, PADX = 6, PADB = 22;
      const lo = Math.min.apply(null, finals), hi = Math.max.apply(null, finals);
      const span = (hi - lo) || 1;
      const BINS = 28;
      const counts = new Array(BINS).fill(0);
      finals.forEach((v) => { counts[Math.min(BINS - 1, Math.floor(((v - lo) / span) * BINS))]++; });
      const maxC = Math.max.apply(null, counts) || 1;
      const bw = (W - PADX * 2) / BINS;
      const bars = counts.map((c, i) => {
        const h = (c / maxC) * (H - PADB - 8);
        const bx = PADX + i * bw;
        const binMid = lo + ((i + 0.5) / BINS) * span;
        const up = binMid >= capital;
        return `<rect x="${(bx + 1).toFixed(1)}" y="${(H - PADB - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${up ? 'rgba(212,175,55,0.75)' : 'rgba(225,58,75,0.55)'}"/>`;
      }).join('');
      const xOf = (v) => PADX + ((v - lo) / span) * (W - PADX * 2);
      const markers =
        `<line x1="${xOf(capital).toFixed(1)}" y1="4" x2="${xOf(capital).toFixed(1)}" y2="${H - PADB}" stroke="rgba(200,210,230,0.8)" stroke-width="1.4" stroke-dasharray="4 3"/>` +
        `<text x="${xOf(capital).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" font-family="JetBrains Mono, monospace" fill="rgba(200,210,230,0.85)">inicio</text>` +
        `<line x1="${xOf(median).toFixed(1)}" y1="4" x2="${xOf(median).toFixed(1)}" y2="${H - PADB}" stroke="rgba(240,199,94,0.95)" stroke-width="2"/>` +
        `<text x="${xOf(median).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" font-family="JetBrains Mono, monospace" fill="#f0c75e">mediana</text>`;
      $('rpHist').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribución de capitales finales">${bars}${markers}</svg>`;
    }

    function run() {
      const capital = parseFloat(capEl.value);
      const riskPct = parseFloat(riskEl.value);
      const winRate = parseFloat(winEl.value);
      const rr = parseFloat(rrEl.value);
      const trades = parseInt(tradesEl.value, 10);
      let sims = parseInt(simsEl.value, 10);
      if (!isPro) sims = FREE_SIMS;

      const msg = $('rpMsg');
      if (!Number.isFinite(capital) || capital <= 0) {
        msg.textContent = 'Introduce un capital inicial válido.';
        msg.className = 'rl-msg rl-msg-error';
        return;
      }
      msg.textContent = ''; msg.className = 'rl-msg';

      const KEEP = isPro ? 60 : 0;
      const finals = [], dds = [], streaks = [], curves = [];
      let ruined = 0, profitable = 0;
      for (let s = 0; s < sims; s++) {
        const keep = s < KEEP;
        const r = simulate(capital, riskPct, winRate, rr, trades, keep);
        finals.push(r.final); dds.push(r.maxDD); streaks.push(r.maxStreak);
        if (r.ruined) ruined++;
        if (r.final > capital) profitable++;
        if (keep) curves.push(r.curve);
      }

      const median = pct(finals, 50);
      const p10 = pct(finals, 10), p90 = pct(finals, 90);
      const p = winRate / 100, q = 1 - p;
      const expectancyR = p * rr - q;                 // en múltiplos de R
      const kelly = rr > 0 ? (p - q / rr) * 100 : 0;  // fracción óptima de Kelly

      $('rpMedian').textContent = money0(median);
      $('rpMedian').className = median >= capital ? 'rl-pos' : 'rl-neg';
      $('rpRange').textContent = `De cada 10 simulaciones, la peor acaba en ${money0(p10)} y la mejor en ${money0(p90)}`;
      $('rpProfitable').textContent = num((profitable / sims) * 100, 1) + '%';
      $('rpExpectancy').textContent = (expectancyR >= 0 ? '+' : '') + num(expectancyR, 3) + ' R';
      $('rpExpectancy').className = expectancyR >= 0 ? 'rl-pos' : 'rl-neg';
      $('rpDD').textContent = '-' + num(pct(dds, 50), 1) + '%';

      if (isPro) {
        $('rpRuin').textContent = num((ruined / sims) * 100, 1) + '%';
        $('rpRuin').className = (ruined / sims) > 0.1 ? 'rl-neg' : '';
        $('rpStreak').textContent = pct(streaks, 90) + ' seguidas';
        $('rpKelly').textContent = kelly > 0 ? clean(kelly, 2) + '%' : 'Negativo';
        $('rpKelly').className = kelly > 0 ? '' : 'rl-neg';
      }

      let cls, txt;
      if (Math.abs(expectancyR) < 0.005) {
        // El filo de la navaja: sin ventaja, y en el mundo real las comisiones lo vuelven negativo.
        cls = 'rl-verdict-mid';
        txt = `Con un ${clean(winRate, 0)}% de aciertos y un R:R de ${num(rr, 2)} tu expectativa es <b>0.00 R</b>: exactamente el filo de la navaja. Ni ganas ni pierdes por matemática — pero en el mundo real están el spread, las comisiones y los deslizamientos, así que un método así <b>pierde dinero despacio</b>. Aquí se ve la verdad incómoda del trading: la ventaja hay que ganársela, no se asume.`;
      } else if (expectancyR < 0) {
        cls = 'rl-verdict-bad';
        txt = `Con un ${clean(winRate, 0)}% de aciertos y un R:R de ${num(rr, 2)}, tu expectativa es <b>${num(expectancyR, 3)} R por operación</b>: el método pierde dinero por matemática, no por mala suerte. Ningún tamaño de posición arregla eso — hay que subir el % de aciertos o el R:R.`;
      } else if ((ruined / sims) > 0.15) {
        cls = 'rl-verdict-mid';
        txt = `Tu método tiene ventaja (<b>+${num(expectancyR, 3)} R</b> por operación), pero arriesgando <b>${clean(riskPct, 2)}%</b> ${isPro ? num((ruined / sims) * 100, 0) + ' de cada 100 simulaciones pierden la mitad de la cuenta' : 'muchas simulaciones se hunden'} antes de llegar al final. La ventaja no sirve si te quedas sin cuenta: baja el riesgo por operación.`;
      } else {
        cls = 'rl-verdict-good';
        txt = `Ventaja positiva (<b>+${num(expectancyR, 3)} R</b> por operación) y un riesgo que la cuenta aguanta. Ojo con el drawdown mediano de <b>-${num(pct(dds, 50), 1)}%</b>: ese es el dolor que tendrías que soportar sin abandonar el plan.`;
      }
      $('rpVerdict').className = 'rl-verdict ' + cls;
      $('rpVerdict').innerHTML = txt;

      if (isPro && curves.length) {
        drawCurves(curves, capital);
        $('rpCurvesNote').textContent = `${curves.length} caminos de ${sims.toLocaleString('es-PE')} simulados · ${trades} operaciones cada uno · banda dorada = zona donde cae el 80% de los caminos`;
        drawHist(finals, capital, median);
        $('rpHistWrap').hidden = false;
        $('rpHistNote').textContent = `${sims.toLocaleString('es-PE')} finales · dorado = acaba en ganancia, rojo = en pérdida`;
      }
    }

    async function detectPremium() {
      try {
        if (typeof window.AR4_checkPremium === 'function') isPro = await window.AR4_checkPremium();
      } catch (e) { isPro = false; }

      el.classList.toggle('rl-pro-on', isPro);
      const banner = $('rlProBanner');
      if (isPro) {
        $('rlProTier').textContent = '★ PREMIUM ACTIVO';
        banner.hidden = false;
        banner.className = 'rl-pro-banner rl-pro-banner-on';
        banner.innerHTML = 'Simulación completa desbloqueada: tus propios supuestos, hasta ' + PRO_SIMS_MAX.toLocaleString('es-PE') + ' simulaciones y curvas de capital.';
        $('rlProCta').hidden = true;
      } else {
        // Gratis: puede probarlo, pero con potencia y parámetros limitados.
        [winEl, rrEl, tradesEl, simsEl].forEach((i) => { i.disabled = true; });
        $('rlLockOverlay').hidden = false;
        $('rlCurvesLock').hidden = false;
        $('rlProTier').textContent = '★ PREMIUM · versión limitada';
        banner.hidden = false;
        banner.innerHTML = 'Estás viendo la <b>versión limitada</b>: ' + FREE_SIMS + ' simulaciones con supuestos fijos (40% de aciertos, R:R 1.5, 200 operaciones). Solo puedes mover tu capital y tu riesgo. En <b>Premium</b> pones tus propios números.';
        ['rpRuin', 'rpStreak', 'rpKelly'].forEach((i) => { $(i).textContent = '★ Premium'; $(i).className = 'rl-locked-val'; });
      }
      run();
    }

    [capEl, riskEl, winEl, rrEl, tradesEl, simsEl].forEach((i) => i.addEventListener('input', syncLabels));
    [capEl, riskEl].forEach((i) => i.addEventListener('change', run));
    $('rpRun').addEventListener('click', run);
    syncLabels();
    detectPremium();
  }

  /* ══════════════ PLUS PREMIUM — Probador de Estrategias / EAs ══════════════
     Pegas los resultados de tu bot, EA de MetaTrader o backtest (la ganancia/
     pérdida de cada operación) y calcula las métricas REALES de ESE historial:
     profit factor, expectativa, drawdown, rachas y curva de capital.
     No ejecuta el EA — analiza los resultados que tú le das. Es honesto y es la
     contraparte del simulador: aquí son datos reales, no supuestos. */
  function initEaTester() {
    const el = $('eaTester');
    if (!el) return;
    let isPro = false;

    const SAMPLE = '120\n-50\n85\n-50\n-50\n210\n-50\n95\n-50\n140\n-50\n-50\n180\n70\n-50\n-50\n-50\n260\n90\n-50';

    // Extrae todos los números (con signo y decimales) de un texto pegado.
    function parseTrades(text) {
      const m = (text || '').match(/-?\d+(?:[.,]\d+)?/g);
      if (!m) return [];
      return m.map((s) => parseFloat(s.replace(',', '.'))).filter((n) => Number.isFinite(n));
    }

    el.innerHTML = `
      <div class="section-head" style="margin-bottom:14px;">
        <h2 class="h2-ic gold" style="font-size:1.3rem;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v4H4zM4 12h16v8H4z"/><path d="M8 16h4"/></svg>
          Probador de Estrategias y EAs
        </h2>
        <span class="rl-tier-badge rl-tier-pro" id="eaTier">★ PLUS PREMIUM</span>
      </div>
      <p style="color:var(--text-mid);font-size:0.9rem;margin-bottom:14px;max-width:80ch;">
        El simulador de arriba usa <b>supuestos</b>. Esto usa <b>datos reales</b>: pega los resultados de tu robot de MetaTrader,
        tu EA, tu bot o tu backtest — la ganancia o pérdida de cada operación — y te dice si esa estrategia de verdad tiene ventaja,
        con las mismas métricas que mira un fondo.
      </p>

      <details class="rl-help">
        <summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> ¿Cómo se usa?</summary>
        <div class="rl-help-body">
          <ol>
            <li>En MetaTrader abre el <b>Probador de estrategias</b>, corre tu EA y ve a la pestaña de resultados/operaciones.</li>
            <li>Copia la columna de <b>beneficio</b> de cada operación (los números con + y −). También sirve un backtest de TradingView o tu propio diario.</li>
            <li>Pégalos abajo, uno por línea o separados por comas. Da igual el formato: el probador saca los números solo.</li>
            <li>Pulsa <b>Analizar historial</b>.</li>
          </ol>
          <p><b>La métrica clave es el Profit Factor:</b> cuánto ganas por cada $1 que pierdes. Por encima de <b>1.5</b> es una estrategia sólida; en <b>1.0</b> estás empatando; por debajo, pierde dinero.</p>
        </div>
      </details>

      <div class="ea-pro-banner" id="eaBanner" hidden></div>

      <div class="rl-grid">
        <div class="rl-panel rl-panel-pro">
          <h3 class="rl-h">Resultados de tus operaciones</h3>
          <label class="rl-label" for="eaCapital">Capital inicial (USD)</label>
          <input class="rl-input" type="number" id="eaCapital" value="1000" min="1" step="100">
          <div class="ea-lockwrap" id="eaLockWrap">
            <label class="rl-label" for="eaInput" style="margin-top:12px;">Ganancia/pérdida de cada operación</label>
            <textarea class="rl-input ea-textarea" id="eaInput" rows="7" placeholder="Pega aquí, ej:&#10;120&#10;-50&#10;85&#10;-50&#10;210">${SAMPLE}</textarea>
            <div class="ea-lock-overlay" id="eaLockOverlay" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <strong>Probador exclusivo Premium</strong>
              <span>Analiza tu propio EA, bot o backtest con métricas de nivel profesional. Abajo tienes un ejemplo ya calculado.</span>
              <a href="membresia.html#subscribeBtn" class="btn btn-gold">Desbloquear</a>
            </div>
          </div>
          <button class="btn btn-gold btn-block" id="eaRun" style="margin-top:14px;">Analizar historial</button>
          <div class="rl-msg" id="eaMsg"></div>
        </div>

        <div class="rl-panel rl-panel-out rl-panel-pro-out">
          <h3 class="rl-h">Veredicto de la estrategia</h3>
          <div class="rl-out-main">
            <span class="rl-out-label">Profit Factor</span>
            <strong id="eaPF">—</strong>
            <span class="rl-out-sub" id="eaPFsub">—</span>
          </div>
          <div class="rl-stats rl-stats-3">
            <div class="rl-stat"><span>Operaciones</span><strong id="eaN">—</strong></div>
            <div class="rl-stat"><span>% de aciertos</span><strong id="eaWR">—</strong></div>
            <div class="rl-stat"><span>Resultado neto</span><strong id="eaNet">—</strong></div>
            <div class="rl-stat"><span>Expectativa / operación</span><strong id="eaExp">—</strong></div>
            <div class="rl-stat"><span>Drawdown máximo</span><strong id="eaDD" class="rl-neg">—</strong></div>
            <div class="rl-stat"><span>Racha perdedora máx.</span><strong id="eaStreak">—</strong></div>
          </div>
          <div class="rl-verdict" id="eaVerdict">Pega tus resultados y pulsa "Analizar historial".</div>
        </div>
      </div>

      <div class="rl-curves-wrap">
        <div class="rl-curves-head"><h3 class="rl-h" style="margin:0;">Curva de capital real</h3><span id="eaCurveNote">—</span></div>
        <div class="rl-curves" id="eaCurve"></div>
      </div>

      <p class="rl-disclaimer"><b>Resultados pasados no garantizan resultados futuros.</b> Este probador mide lo que ya ocurrió en el historial que pegas; que una estrategia haya funcionado no significa que vaya a repetirse. No es una señal ni una recomendación.</p>

      <div class="rl-cta rl-cta-pro" id="eaCta">
        <div>
          <strong>Analiza cualquier EA, bot o estrategia antes de arriesgar dinero real</strong>
          <span>Exclusivo Premium: profit factor, expectativa, drawdown y curva de capital de tu propio historial. Y Aria te ayuda a interpretarlo.</span>
        </div>
        <a href="membresia.html#subscribeBtn" class="btn btn-gold">Actualizar a Premium</a>
      </div>
    `;

    const capEl = $('eaCapital'), inputEl = $('eaInput');

    function drawCurve(equity, capital) {
      const W = 720, H = 220, PAD = 6;
      let max = Math.max.apply(null, equity), min = Math.min.apply(null, equity);
      if (max === min) max = min + 1;
      const n = equity.length - 1;
      const x = (i) => PAD + (i / Math.max(1, n)) * (W - PAD * 2);
      const y = (v) => H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
      const up = equity[equity.length - 1] >= capital;
      const d = equity.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' ');
      const area = d + ' L' + x(n).toFixed(1) + ' ' + y(min).toFixed(1) + ' L' + x(0).toFixed(1) + ' ' + y(min).toFixed(1) + ' Z';
      const col = up ? '46,204,113' : '225,58,75';
      $('eaCurve').innerHTML =
        `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Curva de capital del historial">` +
        `<path d="${area}" fill="rgba(${col},0.12)"/>` +
        `<line x1="${PAD}" y1="${y(capital).toFixed(1)}" x2="${W - PAD}" y2="${y(capital).toFixed(1)}" stroke="rgba(240,199,94,0.7)" stroke-width="1.2" stroke-dasharray="5 4"/>` +
        `<path d="${d}" fill="none" stroke="rgb(${col})" stroke-width="1.8"/></svg>`;
    }

    function analyze() {
      const capital = parseFloat(capEl.value);
      const trades = parseTrades(inputEl.value);
      const msg = $('eaMsg');
      if (!Number.isFinite(capital) || capital <= 0) { msg.textContent = 'Introduce un capital inicial válido.'; msg.className = 'rl-msg rl-msg-error'; return; }
      if (trades.length < 2) { msg.textContent = 'Pega al menos 2 resultados de operaciones (números con + y −).'; msg.className = 'rl-msg rl-msg-error'; return; }
      msg.textContent = ''; msg.className = 'rl-msg';

      let gp = 0, gl = 0, wins = 0, streak = 0, maxStreak = 0;
      let eq = capital, peak = capital, maxDD = 0;
      const curve = [eq];
      trades.forEach((t) => {
        if (t >= 0) { gp += t; wins++; streak = 0; } else { gl += -t; streak++; if (streak > maxStreak) maxStreak = streak; }
        eq += t; curve.push(eq);
        if (eq > peak) peak = eq;
        const dd = ((peak - eq) / peak) * 100; if (dd > maxDD) maxDD = dd;
      });
      const n = trades.length;
      const net = eq - capital;
      const pf = gl > 0 ? gp / gl : Infinity;
      const wr = (wins / n) * 100;
      const exp = net / n;

      $('eaPF').textContent = gl > 0 ? num(pf, 2) : '∞';
      $('eaPF').className = pf >= 1 ? 'rl-pos' : 'rl-neg';
      $('eaPFsub').textContent = gl > 0 ? `Ganas ${money(pf)} por cada $1 que pierdes` : 'No hubo operaciones perdedoras en este historial';
      $('eaN').textContent = n;
      $('eaWR').textContent = num(wr, 1) + '%';
      $('eaNet').textContent = (net >= 0 ? '+' : '') + money(net);
      $('eaNet').className = net >= 0 ? 'rl-pos' : 'rl-neg';
      $('eaExp').textContent = (exp >= 0 ? '+' : '') + money(exp);
      $('eaExp').className = exp >= 0 ? 'rl-pos' : 'rl-neg';
      $('eaDD').textContent = '-' + num(maxDD, 1) + '%';
      $('eaStreak').textContent = maxStreak + ' seguidas';

      let cls, txt;
      if (pf < 1) { cls = 'rl-verdict-bad'; txt = `Profit factor <b>${num(pf, 2)}</b>: por cada dólar que gana, pierde más. Esta estrategia, tal cual, <b>destruye capital</b>. Antes de ponerle dinero real hay que arreglar el método (mejores entradas o mejor R:R), no el tamaño de posición.`; }
      else if (pf < 1.5) { cls = 'rl-verdict-mid'; txt = `Profit factor <b>${num(pf, 2)}</b>: gana algo más de lo que pierde, pero el margen es fino. Con spread y comisiones reales puede quedar en nada. Ojo con la racha perdedora de <b>${maxStreak}</b> seguidas: ¿la aguantarías sin apagar el bot?`; }
      else { cls = 'rl-verdict-good'; txt = `Profit factor <b>${num(pf, 2)}</b>: sólido — gana bastante más de lo que pierde. El drawdown máximo fue de <b>-${num(maxDD, 1)}%</b>: ese es el bache que tu EA tuvo que atravesar. Recuerda que este es el pasado; vigílalo en real antes de subir el tamaño.`; }
      $('eaVerdict').className = 'rl-verdict ' + cls;
      $('eaVerdict').innerHTML = txt;

      drawCurve(curve, capital);
      $('eaCurveNote').textContent = `${n} operaciones · de ${money(Math.min.apply(null, curve))} a ${money(Math.max.apply(null, curve))}`;
    }

    async function detect() {
      try { if (typeof window.AR4_checkPremium === 'function') isPro = await window.AR4_checkPremium(); } catch (e) { isPro = false; }
      el.classList.toggle('rl-pro-on', isPro);
      const banner = $('eaBanner');
      if (isPro) {
        $('eaTier').textContent = '★ PREMIUM ACTIVO';
        banner.hidden = false; banner.className = 'ea-pro-banner ea-pro-banner-on';
        banner.innerHTML = 'Probador desbloqueado: pega los resultados de tu EA, bot o backtest y analízalos.';
        $('eaCta').hidden = true;
      } else {
        inputEl.readOnly = true;
        $('eaLockOverlay').hidden = false;
        $('eaTier').textContent = '★ PREMIUM · ejemplo';
        banner.hidden = false; banner.className = 'ea-pro-banner';
        banner.innerHTML = 'Estás viendo un <b>ejemplo ya calculado</b>. Con Premium pegas tu propio historial y lo analizas.';
      }
      analyze();
    }

    capEl.addEventListener('change', analyze);
    $('eaRun').addEventListener('click', analyze);
    inputEl.addEventListener('input', function () { if (isPro) analyze(); });
    detect();
  }

  // ============================================================
  // Planificador de reto de fondeo (gratis): matemática honesta del reto.
  // ============================================================
  function initPropPlanner() {
    const mount = $('propPlanner');
    if (!mount) return;
    mount.innerHTML = `
      <div class="rs-howto" style="margin-bottom:16px;">
        <div class="rs-howto-head"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='9'/><path d='M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5M12 17h.01'/></svg><strong>¿Cómo se usa?</strong></div>
        <ol class="rs-howto-steps">
          <li><b>1.</b> Escribe las reglas de tu reto (objetivo, límite diario, riesgo por operación).</li>
          <li><b>2.</b> Añade tu relación R:R media y tu % de aciertos realista.</li>
          <li><b>3.</b> El planificador calcula cuántas operaciones necesitas y qué margen de error tienes.</li>
          <li><b>4.</b> Si el plan exige perfección, el reto está mal planteado: ajústalo antes de pagar.</li>
        </ol>
      </div>
      <div class="rl-grid">
        <div class="rl-field"><label>Tamaño de la cuenta (USD)</label><input type="number" id="ppAccount" value="10000" step="any"></div>
        <div class="rl-field"><label>Objetivo de ganancia (%)</label><input type="number" id="ppTarget" value="8" step="0.5"></div>
        <div class="rl-field"><label>Límite de pérdida diaria (%)</label><input type="number" id="ppDaily" value="5" step="0.5"></div>
        <div class="rl-field"><label>Límite de pérdida total (%)</label><input type="number" id="ppMax" value="10" step="0.5"></div>
        <div class="rl-field"><label>Riesgo por operación (%)</label><input type="number" id="ppRisk" value="0.5" step="0.1"></div>
        <div class="rl-field"><label>R:R medio de tu sistema</label><input type="number" id="ppRR" value="2" step="0.1"></div>
        <div class="rl-field"><label>% de aciertos realista</label><input type="number" id="ppWin" value="45" step="1"></div>
      </div>
      <button class="btn btn-gold" id="ppRun" style="margin-top:14px;">Calcular mi plan</button>
      <div id="ppOut" style="margin-top:16px;"></div>`;

    function run() {
      const acc = parseFloat($('ppAccount').value) || 0;
      const target = parseFloat($('ppTarget').value) || 0;
      const daily = parseFloat($('ppDaily').value) || 0;
      const maxdd = parseFloat($('ppMax').value) || 0;
      const risk = parseFloat($('ppRisk').value) || 0;
      const rr = parseFloat($('ppRR').value) || 0;
      const win = (parseFloat($('ppWin').value) || 0) / 100;
      const out = $('ppOut');
      if (!acc || !target || !risk || !rr) { out.innerHTML = '<div class="community-form-msg error">Completa los campos con valores válidos.</div>'; return; }

      const targetR = target / risk;                       // R netos que exige el reto
      const expectancyR = win * rr - (1 - win);            // R esperado por operación
      const lossesToDaily = Math.floor(daily / risk);      // pérdidas seguidas que rompen el límite diario
      const lossesToMax = Math.floor(maxdd / risk);        // pérdidas netas que rompen el reto
      const tradesNeeded = expectancyR > 0 ? Math.ceil(targetR / expectancyR) : null;
      const rows = [
        ['Necesitas ganar', clean(targetR, 1) + ' R netos', 'objetivo ÷ riesgo por operación'],
        ['Esperanza de tu sistema', (expectancyR >= 0 ? '+' : '') + num(expectancyR, 2) + ' R por operación', '(' + Math.round(win * 100) + '% × ' + rr + ') − ' + Math.round((1 - win) * 100) + '%'],
        ['Operaciones estimadas', tradesNeeded ? '~' + tradesNeeded : '—', tradesNeeded ? 'para llegar al objetivo si se cumple tu estadística' : 'tu esperanza es negativa: no llegas nunca'],
        ['Colchón diario', lossesToDaily + ' pérdidas seguidas', 'antes de romper el límite del día'],
        ['Colchón total', lossesToMax + ' R de margen', 'antes de perder el reto']
      ];
      let verdict, cls;
      if (expectancyR <= 0) { verdict = 'Con esa estadística el reto es matemáticamente imposible: la esperanza es negativa. Sube tu R:R o tu tasa de acierto antes de pagar un reto.'; cls = 'error'; }
      else if (lossesToDaily < 3) { verdict = 'Peligro: con ese riesgo por operación, ' + lossesToDaily + ' pérdidas seguidas (algo estadísticamente normal) rompen tu límite diario. Baja el riesgo por operación.'; cls = 'error'; }
      else if (tradesNeeded > 200) { verdict = 'El plan es viable pero lento (~' + tradesNeeded + ' operaciones). Considera un objetivo por fases o revisa si el reto tiene límite de tiempo.'; cls = ''; }
      else { verdict = 'Plan razonable: objetivo alcanzable en ~' + tradesNeeded + ' operaciones con ' + lossesToDaily + ' pérdidas de colchón diario. Recuerda: la estadística solo se cumple si ejecutas SIEMPRE igual.'; cls = 'success'; }
      out.innerHTML = `
        <div class="rl-results">${rows.map((r) => `<div class="rl-card"><span>${r[0]}</span><strong>${r[1]}</strong><em>${r[2]}</em></div>`).join('')}</div>
        <div class="community-form-msg ${cls}" style="margin-top:12px;">${verdict}</div>
        <p style="color:var(--text-low);font-size:0.76rem;margin-top:8px;">Cálculo determinista sobre tus propios supuestos; no predice resultados ni garantiza pasar ningún reto. Las reglas exactas varían según la empresa de fondeo.</p>`;
    }
    $('ppRun').addEventListener('click', run);
    run();
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

  initFreeLab();
  initDdLab();
  initProLab();
  initPropPlanner();
  initAtrStop();
})();
