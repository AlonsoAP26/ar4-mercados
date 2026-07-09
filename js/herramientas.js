(function () {
  function fmt(n, decimals) {
    return Number(n).toLocaleString('es', { maximumFractionDigits: decimals != null ? decimals : 5 });
  }

  function wirePositionCalculator() {
    const btn = document.getElementById('calcPositionBtn');
    const resultEl = document.getElementById('calcPositionResult');
    if (!btn || !resultEl) return;
    btn.addEventListener('click', () => {
      const capital = parseFloat(document.getElementById('calcCapital').value);
      const riskPct = parseFloat(document.getElementById('calcRiskPct').value);
      const entry = parseFloat(document.getElementById('calcEntry').value);
      const stop = parseFloat(document.getElementById('calcStop').value);

      if (!capital || !riskPct || !entry || !stop || entry === stop) {
        resultEl.innerHTML = '<div class="community-form-msg error" style="margin-top:14px;">Completa todos los campos con números válidos (entrada y stop deben ser distintos).</div>';
        return;
      }

      const riskAmount = capital * (riskPct / 100);
      const distance = Math.abs(entry - stop);
      const units = riskAmount / distance;

      resultEl.innerHTML = `
        <div class="community-form-msg success" style="margin-top:14px;">
          Arriesgando <strong>$${fmt(riskAmount, 2)}</strong> (${riskPct}% de $${fmt(capital, 2)}) con una distancia al stop de <strong>${fmt(distance)}</strong>, tu tamaño de posición máximo es de aproximadamente <strong>${fmt(units, 2)}</strong> unidades del activo.
        </div>
        <p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Convierte "unidades" al tamaño de lote/contrato específico de tu broker antes de operar — el valor por pip o punto varía según el instrumento y el bróker.</p>
      `;
    });
  }

  function wireRRCalculator() {
    const btn = document.getElementById('calcRRBtn');
    const resultEl = document.getElementById('calcRRResult');
    if (!btn || !resultEl) return;
    btn.addEventListener('click', () => {
      const entry = parseFloat(document.getElementById('rrEntry').value);
      const stop = parseFloat(document.getElementById('rrStop').value);
      const target = parseFloat(document.getElementById('rrTarget').value);

      if (!entry || !stop || !target || entry === stop) {
        resultEl.innerHTML = '<div class="community-form-msg error" style="margin-top:14px;">Completa los tres precios con números válidos.</div>';
        return;
      }

      const risk = Math.abs(entry - stop);
      const reward = Math.abs(target - entry);
      const ratio = reward / risk;

      let msg = `Relación riesgo/beneficio de <strong>1:${ratio.toFixed(2)}</strong>. Por cada $1 que arriesgas, tu objetivo busca ganar $${ratio.toFixed(2)}.`;
      let cls = 'success';
      if (ratio < 1) {
        msg += ' Esta relación es menor a 1:1 — necesitarías acertar más de la mitad de tus operaciones solo para no perder dinero en el tiempo.';
        cls = 'error';
      } else if (ratio >= 2) {
        msg += ' Con esta relación, ni siquiera necesitas acertar la mayoría de tus operaciones para ser rentable en el tiempo.';
      }

      resultEl.innerHTML = `<div class="community-form-msg ${cls}" style="margin-top:14px;">${msg}</div>`;
    });
  }

  const CHECKLIST_ITEMS = [
    '¿Esta operación cumple con tu plan de trading escrito?',
    '¿Ya definiste tu stop loss antes de entrar, no después?',
    '¿El tamaño de tu posición respeta tu % de riesgo habitual?',
    '¿Revisaste el calendario económico por eventos de alto impacto próximos?',
    '¿Estás entrando por un setup válido, no por FOMO o impulso?',
    '¿Vas a aceptar el resultado de esta operación sea cual sea, sin buscar "vengarte" del mercado después?'
  ];
  const CHECKLIST_KEY = 'ar4ChecklistState';

  function wireChecklist() {
    const container = document.getElementById('checklistContainer');
    const resetBtn = document.getElementById('checklistResetBtn');
    if (!container) return;

    function loadState() {
      try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {}; } catch (e) { return {}; }
    }
    function saveState(state) {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(state));
    }

    function render() {
      const state = loadState();
      container.innerHTML = CHECKLIST_ITEMS.map((item, i) => `
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-top:${i === 0 ? 'none' : '1px dashed rgba(255,255,255,0.08)'};cursor:pointer;font-weight:400;">
          <input type="checkbox" data-idx="${i}" ${state[i] ? 'checked' : ''} style="width:18px;height:18px;flex-shrink:0;">
          <span style="font-size:0.9rem;color:var(--text-mid);">${item}</span>
        </label>
      `).join('');

      container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const s = loadState();
          s[cb.dataset.idx] = cb.checked;
          saveState(s);
        });
      });
    }

    render();

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem(CHECKLIST_KEY);
        render();
      });
    }
  }

  function journalEntryRowHTML(entry) {
    const resultLabel = { ganadora: '✅ Ganadora', perdedora: '❌ Perdedora', abierta: '🔵 Abierta' }[entry.result] || entry.result;
    const priceParts = [];
    if (entry.entry_price != null) priceParts.push('Entrada: ' + entry.entry_price);
    if (entry.exit_price != null) priceParts.push('Salida: ' + entry.exit_price);
    if (entry.stop_loss != null) priceParts.push('SL: ' + entry.stop_loss);
    if (entry.take_profit != null) priceParts.push('TP: ' + entry.take_profit);
    return `
      <div class="community-post-card" style="margin-bottom:12px;">
        <div class="community-post-head" style="justify-content:space-between;">
          <div><strong>${entry.symbol}</strong> <span class="instrument-badge">${entry.direction === 'long' ? '📈 Long' : '📉 Short'}</span></div>
          <span class="news-meta">${resultLabel}</span>
        </div>
        ${priceParts.length ? `<p style="color:var(--text-mid);font-size:0.82rem;">${priceParts.join(' · ')}</p>` : ''}
        ${entry.emotion ? `<p style="color:var(--text-low);font-size:0.78rem;">Estado emocional: ${entry.emotion}</p>` : ''}
        ${entry.notes ? `<p style="font-size:0.86rem;">${entry.notes}</p>` : ''}
      </div>
    `;
  }

  async function initJournal() {
    const section = document.getElementById('journalSection');
    if (!section) return;
    if (typeof netlifyIdentity === 'undefined') return;
    const user = netlifyIdentity.currentUser();

    if (!user) {
      section.innerHTML = `<div class="community-form"><p style="color:var(--text-mid);">Inicia sesión y crea tu perfil de comunidad para llevar tu diario de trading privado.</p><a href="comunidad.html" class="btn btn-outline" style="margin-top:10px;">Ir a Comunidad</a></div>`;
      return;
    }

    section.innerHTML = `
      <div class="community-form">
        <h3 style="margin-bottom:14px;">Nueva operación</h3>
        <label for="jSymbol">Instrumento</label>
        <input type="text" id="jSymbol" maxlength="40" placeholder="ej. EUR/USD">
        <label for="jDirection">Dirección</label>
        <select id="jDirection">
          <option value="long">Long (compra)</option>
          <option value="short">Short (venta)</option>
        </select>
        <label for="jEntry">Precio de entrada (opcional)</label>
        <input type="number" id="jEntry" step="any">
        <label for="jExit">Precio de salida (opcional)</label>
        <input type="number" id="jExit" step="any">
        <label for="jStop">Stop loss (opcional)</label>
        <input type="number" id="jStop" step="any">
        <label for="jTarget">Take profit (opcional)</label>
        <input type="number" id="jTarget" step="any">
        <label for="jResult">Resultado</label>
        <select id="jResult">
          <option value="abierta">Abierta</option>
          <option value="ganadora">Ganadora</option>
          <option value="perdedora">Perdedora</option>
        </select>
        <label for="jEmotion">Estado emocional (opcional)</label>
        <input type="text" id="jEmotion" maxlength="40" placeholder="ej. tranquilo, ansioso, con FOMO...">
        <label for="jNotes">Notas (opcional)</label>
        <textarea id="jNotes" maxlength="1000"></textarea>
        <button class="btn btn-gold" id="jSubmitBtn" style="margin-top:14px;">Guardar entrada (+2 pts)</button>
        <div class="community-form-msg" id="jMsg"></div>
      </div>
      <div class="section-head" style="margin-top:28px;"><h2 style="font-size:1.05rem;">Tus últimas operaciones</h2></div>
      <div id="journalList"><p class="footer-text">Cargando...</p></div>
    `;

    async function loadEntries() {
      const listEl = document.getElementById('journalList');
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-journal', { headers: { 'Authorization': 'Bearer ' + jwt } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        listEl.innerHTML = data.entries.map(journalEntryRowHTML).join('') || '<p class="footer-text">Todavía no has registrado ninguna operación.</p>';
      } catch (e) {
        listEl.innerHTML = `<p class="footer-text">${e.message}</p>`;
      }
    }

    document.getElementById('jSubmitBtn').addEventListener('click', async () => {
      const btn = document.getElementById('jSubmitBtn');
      const msgEl = document.getElementById('jMsg');
      const payload = {
        symbol: document.getElementById('jSymbol').value.trim(),
        direction: document.getElementById('jDirection').value,
        entryPrice: document.getElementById('jEntry').value,
        exitPrice: document.getElementById('jExit').value,
        stopLoss: document.getElementById('jStop').value,
        takeProfit: document.getElementById('jTarget').value,
        result: document.getElementById('jResult').value,
        emotion: document.getElementById('jEmotion').value.trim(),
        notes: document.getElementById('jNotes').value.trim()
      };
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        msgEl.textContent = '¡Entrada guardada! Ganaste 2 puntos.';
        msgEl.className = 'community-form-msg success';
        document.getElementById('jSymbol').value = '';
        document.getElementById('jEntry').value = '';
        document.getElementById('jExit').value = '';
        document.getElementById('jStop').value = '';
        document.getElementById('jTarget').value = '';
        document.getElementById('jEmotion').value = '';
        document.getElementById('jNotes').value = '';
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
        loadEntries();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      } finally {
        btn.disabled = false;
      }
    });

    loadEntries();
  }

  wirePositionCalculator();
  wireRRCalculator();
  wireChecklist();
  initJournal();
})();
