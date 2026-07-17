/* AR4 Mercados — Laboratorio de Riesgo.
   Calculadora interactiva de tamaño de posición + tabla de recuperación de
   drawdown. Todo es matemática exacta calculada en el navegador: no hay datos
   inventados, ni predicciones, ni señales. Es la misma cuenta que Aria Premium
   hace por ti dentro del chat.
   Renderiza en #riskLab. */
(function () {
  const el = document.getElementById('riskLab');
  if (!el) return;

  const money = (n) => '$' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n, d) => n.toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });

  // Cuánto hay que ganar para recuperar una caída dada: 1/(1-dd) - 1.
  function recoveryPct(ddPct) {
    const dd = ddPct / 100;
    if (dd >= 1) return Infinity;
    return ((1 / (1 - dd)) - 1) * 100;
  }

  // Pérdidas seguidas al riesgo r% necesarias para llegar a una caída dd%.
  function lossesToDrawdown(riskPct, ddPct) {
    const r = riskPct / 100;
    const dd = ddPct / 100;
    if (r <= 0 || r >= 1 || dd >= 1) return null;
    return Math.ceil(Math.log(1 - dd) / Math.log(1 - r));
  }

  const DRAWDOWNS = [5, 10, 20, 30, 50, 70];

  el.innerHTML = `
    <div class="section-head" style="margin-bottom:14px;">
      <h2 class="h2-ic" style="font-size:1.3rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v5.5L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 8.5V3"/><path d="M7 15h10"/></svg>
        Laboratorio de Riesgo
      </h2>
      <span class="badge-live">CÁLCULO EXACTO · GRATIS</span>
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

    <div class="rl-cta">
      <div>
        <strong>Esta cuenta la hace Aria por ti, con tus números</strong>
        <span>En Premium le describes tu operación y calcula el tamaño, el R:R y el impacto en tu cuenta — y te explica qué significa. Aquí tienes la calculadora; allí tienes el criterio.</span>
      </div>
      <a href="#subscribeBtn" class="btn btn-gold">Ver Premium</a>
    </div>
  `;

  const $ = (id) => document.getElementById(id);
  const capitalEl = $('rlCapital'), riskEl = $('rlRisk'), entryEl = $('rlEntry'),
        stopEl = $('rlStop'), targetEl = $('rlTarget');

  function render() {
    const capital = parseFloat(capitalEl.value);
    const riskPct = parseFloat(riskEl.value);
    const entry = parseFloat(entryEl.value);
    const stop = parseFloat(stopEl.value);
    const target = parseFloat(targetEl.value);

    $('rlRiskVal').textContent = num(riskPct, 2).replace(/[.,]00$/, '') + '%';

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
    msg.textContent = '';
    msg.className = 'rl-msg';

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
      $('rlWinMoney').textContent = '—';
      $('rlRR').textContent = '—';
      $('rlVerdict').className = 'rl-verdict';
      $('rlVerdict').innerHTML = 'Añade un objetivo para ver tu relación riesgo/beneficio y qué porcentaje de aciertos necesitarías.';
    }

    // Tabla de recuperación
    const rows = DRAWDOWNS.map((dd) => {
      const need = recoveryPct(dd);
      const n = lossesToDrawdown(riskPct, dd);
      const hot = need >= 100;
      return `
        <div class="rl-dd-row${hot ? ' rl-dd-hot' : ''}">
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
      ? `Con un riesgo del <b>${num(riskPct, 2).replace(/[.,]00$/, '')}%</b> por operación, te bastan <b>${n20} pérdidas seguidas</b> para caer un 20% — y una mala racha así le pasa a cualquiera. Por eso el tamaño de la posición importa más que la entrada.`
      : '';
  }

  [capitalEl, riskEl, entryEl, stopEl, targetEl].forEach((i) => {
    i.addEventListener('input', render);
  });
  render();
})();
