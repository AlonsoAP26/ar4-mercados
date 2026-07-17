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
          <label class="rl-label" for="rlCapital">Capital de la cuenta (USD)</label>
          <input class="rl-input" type="number" id="rlCapital" value="5000" min="1" step="100">
          <label class="rl-label" for="rlRisk">Riesgo por operación: <b id="rlRiskVal">1%</b></label>
          <input class="rl-range" type="range" id="rlRisk" value="1" min="0.25" max="10" step="0.25">
          <div class="rl-range-hint"><span>Conservador</span><span>Agresivo</span></div>
          <div class="rl-row">
            <div>
              <label class="rl-label" for="rlEntry">Precio de entrada</label>
              <input class="rl-input" type="number" id="rlEntry" value="100" min="0" step="any">
            </div>
            <div>
              <label class="rl-label" for="rlStop">Stop loss</label>
              <input class="rl-input" type="number" id="rlStop" value="97" min="0" step="any">
            </div>
            <div>
              <label class="rl-label" for="rlTarget">Objetivo (opcional)</label>
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
          <div class="rl-stats">
            <div class="rl-stat"><span>Arriesgas</span><strong id="rlRiskMoney" class="rl-neg">—</strong></div>
            <div class="rl-stat"><span>Puedes ganar</span><strong id="rlWinMoney" class="rl-pos">—</strong></div>
            <div class="rl-stat"><span>Ratio R:R</span><strong id="rlRR">—</strong></div>
            <div class="rl-stat"><span>Distancia al stop</span><strong id="rlDist">—</strong></div>
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
        ['rlUnits', 'rlNotional', 'rlRiskMoney', 'rlWinMoney', 'rlRR', 'rlDist'].forEach((i) => { $(i).textContent = '—'; });
        $('rlVerdict').innerHTML = '';
        return;
      }
      msg.textContent = ''; msg.className = 'rl-msg';

      const riskMoney = capital * (riskPct / 100);
      const units = riskMoney / dist;
      const notional = units * entry;
      const leverage = notional / capital;

      $('rlUnits').textContent = num(units, units < 10 ? 4 : 2) + ' u.';
      $('rlNotional').textContent = 'Valor de la posición: ' + money(notional) +
        (leverage > 1.05 ? ' · equivale a ' + num(leverage, 1) + '× tu capital' : '');
      $('rlRiskMoney').textContent = '-' + money(riskMoney);
      $('rlDist').textContent = num(dist, dist < 1 ? 4 : 2) + ' (' + num((dist / entry) * 100, 2) + '%)';

      const hasTarget = Number.isFinite(target) && target > 0 && Math.abs(target - entry) > 0;
      if (hasTarget) {
        const winMoney = Math.abs(target - entry) * units;
        const rr = winMoney / riskMoney;
        $('rlWinMoney').textContent = '+' + money(winMoney);
        $('rlRR').textContent = '1 : ' + num(rr, 2);
        const breakeven = (1 / (1 + rr)) * 100;
        let cls = 'rl-verdict-bad', txt;
        if (rr >= 2) { cls = 'rl-verdict-good'; txt = 'Relación sólida. Con este R:R te basta con acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces para no perder dinero.'; }
        else if (rr >= 1) { cls = 'rl-verdict-mid'; txt = 'Relación ajustada. Necesitas acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces solo para quedar en cero.'; }
        else { txt = 'Arriesgas más de lo que buscas ganar: necesitarías acertar más del <b>' + num(breakeven, 0) + '%</b> de las veces solo para empatar. Muy pocos sostienen eso.'; }
        $('rlVerdict').className = 'rl-verdict ' + cls;
        $('rlVerdict').innerHTML = txt;
      } else {
        $('rlWinMoney').textContent = '—'; $('rlRR').textContent = '—';
        $('rlVerdict').className = 'rl-verdict';
        $('rlVerdict').innerHTML = 'Añade un objetivo para ver tu relación riesgo/beneficio y qué porcentaje de aciertos necesitarías.';
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

      <div class="rl-pro-banner" id="rlProBanner" hidden></div>

      <div class="rl-grid">
        <div class="rl-panel rl-panel-pro">
          <h3 class="rl-h">Tus supuestos</h3>
          <label class="rl-label" for="rpCapital">Capital inicial (USD)</label>
          <input class="rl-input" type="number" id="rpCapital" value="5000" min="1" step="100">

          <label class="rl-label" for="rpRisk">Riesgo por operación: <b id="rpRiskVal">1%</b></label>
          <input class="rl-range" type="range" id="rpRisk" value="1" min="0.25" max="10" step="0.25">

          <div class="rl-lockwrap" id="rlLockWrap">
            <label class="rl-label" for="rpWin">% de aciertos: <b id="rpWinVal">45%</b></label>
            <input class="rl-range" type="range" id="rpWin" value="45" min="10" max="90" step="1">

            <label class="rl-label" for="rpRR">Ratio R:R (ganas × lo que arriesgas): <b id="rpRRVal">2.0</b></label>
            <input class="rl-range" type="range" id="rpRR" value="2" min="0.25" max="6" step="0.25">

            <label class="rl-label" for="rpTrades">Operaciones a simular: <b id="rpTradesVal">200</b></label>
            <input class="rl-range" type="range" id="rpTrades" value="200" min="20" max="1000" step="10">

            <label class="rl-label" for="rpSims">Simulaciones: <b id="rpSimsVal">200</b></label>
            <input class="rl-range" type="range" id="rpSims" value="200" min="100" max="${PRO_SIMS_MAX}" step="100">
            <div class="rl-lock-overlay" id="rlLockOverlay" hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <strong>Parámetros bloqueados</strong>
              <span>En Premium ajustas tu % de aciertos, tu R:R, cuántas operaciones y hasta ${PRO_SIMS_MAX.toLocaleString('es-PE')} simulaciones.</span>
              <a href="#subscribeBtn" class="btn btn-gold">Desbloquear</a>
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
          <a href="#subscribeBtn" class="btn btn-gold">Ver Premium</a>
        </div>
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
        <a href="#subscribeBtn" class="btn btn-gold">Actualizar a Premium</a>
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
        return `<path d="${d}" fill="none" stroke="${up ? 'rgba(46,204,113,0.5)' : 'rgba(225,58,75,0.5)'}" stroke-width="1"/>`;
      }).join('');
      const base = `<line x1="${PAD}" y1="${y(capital).toFixed(1)}" x2="${W - PAD}" y2="${y(capital).toFixed(1)}" stroke="rgba(240,199,94,0.8)" stroke-width="1.4" stroke-dasharray="5 4"/>`;
      $('rpCurves').innerHTML =
        `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Curvas de capital simuladas">${paths}${base}</svg>` +
        `<span class="rl-curves-legend"><i class="rl-lg-gold"></i>Capital inicial <i class="rl-lg-up"></i>Termina arriba <i class="rl-lg-dn"></i>Termina abajo</span>`;
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

      const KEEP = isPro ? 45 : 0;
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
      if (expectancyR <= 0) {
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
        $('rpCurvesNote').textContent = `${curves.length} caminos de ${sims.toLocaleString('es-PE')} simulados · ${trades} operaciones cada uno`;
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
        banner.innerHTML = 'Estás viendo la <b>versión limitada</b>: ' + FREE_SIMS + ' simulaciones con supuestos fijos (45% de aciertos, R:R 2.0, 200 operaciones). Solo puedes mover tu capital y tu riesgo.';
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

  initFreeLab();
  initProLab();
})();
