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
      const done = CHECKLIST_ITEMS.filter((_, i) => state[i]).length;
      const total = CHECKLIST_ITEMS.length;
      const pct = Math.round((done / total) * 100);
      const ready = done === total;

      container.innerHTML = `
        <div class="chk-progress${ready ? ' chk-ready' : ''}">
          <div class="chk-progress-bar"><div class="chk-progress-fill" style="width:${pct}%"></div></div>
          <span class="chk-progress-label">${ready ? '✓ Todo listo — puedes operar con la cabeza tranquila' : done + ' de ' + total + ' verificados'}</span>
        </div>
        <div class="chk-list">
        ${CHECKLIST_ITEMS.map((item, i) => `
          <label class="chk-item${state[i] ? ' chk-on' : ''}">
            <input type="checkbox" data-idx="${i}" ${state[i] ? 'checked' : ''}>
            <span class="chk-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
            <span class="chk-text">${item}</span>
          </label>
        `).join('')}
        </div>`;

      container.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const s = loadState();
          s[cb.dataset.idx] = cb.checked;
          saveState(s);
          render();
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

  const WATCHLIST_SYMBOL_MAP = {
    'EURUSD': 'FX:EURUSD', 'EUR/USD': 'FX:EURUSD',
    'GBPUSD': 'FX:GBPUSD', 'GBP/USD': 'FX:GBPUSD',
    'USDJPY': 'FX:USDJPY', 'USD/JPY': 'FX:USDJPY',
    'USDMXN': 'FX_IDC:USDMXN', 'USD/MXN': 'FX_IDC:USDMXN',
    'USDCOP': 'FX_IDC:USDCOP', 'USD/COP': 'FX_IDC:USDCOP',
    'USDCLP': 'FX_IDC:USDCLP', 'USD/CLP': 'FX_IDC:USDCLP',
    'USDARS': 'FX_IDC:USDARS', 'USD/ARS': 'FX_IDC:USDARS',
    'USDBRL': 'FX_IDC:USDBRL', 'USD/BRL': 'FX_IDC:USDBRL',
    'USDPEN': 'FX_IDC:USDPEN', 'USD/PEN': 'FX_IDC:USDPEN',
    'ORO': 'OANDA:XAUUSD', 'GOLD': 'OANDA:XAUUSD', 'XAUUSD': 'OANDA:XAUUSD', 'XAU/USD': 'OANDA:XAUUSD',
    'PLATA': 'OANDA:XAGUSD', 'SILVER': 'OANDA:XAGUSD', 'XAGUSD': 'OANDA:XAGUSD', 'XAG/USD': 'OANDA:XAGUSD',
    'PETROLEO': 'TVC:USOIL', 'WTI': 'TVC:USOIL', 'OIL': 'TVC:USOIL', 'USOIL': 'TVC:USOIL',
    'BRENT': 'TVC:UKOIL', 'UKOIL': 'TVC:UKOIL',
    'BTC': 'BITSTAMP:BTCUSD', 'BTCUSD': 'BITSTAMP:BTCUSD', 'BTC/USD': 'BITSTAMP:BTCUSD', 'BITCOIN': 'BITSTAMP:BTCUSD',
    'ETH': 'COINBASE:ETHUSD', 'ETHUSD': 'COINBASE:ETHUSD', 'ETH/USD': 'COINBASE:ETHUSD', 'ETHEREUM': 'COINBASE:ETHUSD',
    'SP500': 'FOREXCOM:SPXUSD', 'S&P500': 'FOREXCOM:SPXUSD', 'US500': 'FOREXCOM:SPXUSD', 'SPX': 'FOREXCOM:SPXUSD',
    'NASDAQ': 'FOREXCOM:NSXUSD', 'NAS100': 'FOREXCOM:NSXUSD', 'US100': 'FOREXCOM:NSXUSD',
    'DXY': 'CAPITALCOM:DXY'
  };

  function resolveWatchlistSymbol(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim().toUpperCase();
    if (/^[A-Z0-9_]+:[A-Z0-9]+$/.test(trimmed)) return trimmed;
    return WATCHLIST_SYMBOL_MAP[trimmed.replace(/\s+/g, '')] || null;
  }

  function mountWatchlistTicker(container, items) {
    if (!container) return;
    if (!items || !items.length) { container.innerHTML = ''; return; }
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.text = JSON.stringify({
      symbols: items.map((it) => ({ proName: it.symbol, title: it.label })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'compact',
      colorTheme: 'dark',
      locale: 'es'
    });
    container.appendChild(script);
  }

  function watchlistItemRowHTML(item, editable) {
    return `
      <div class="community-post-card" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div><strong>${item.label}</strong> <span class="news-meta">${item.symbol}</span></div>
        ${editable ? `<button class="btn btn-outline watchlist-remove-btn" data-symbol="${item.symbol}" style="padding:6px 12px;font-size:0.78rem;">Quitar</button>` : ''}
      </div>
    `;
  }

  async function initWatchlist() {
    const section = document.getElementById('watchlistSection');
    const titleEl = document.getElementById('watchlistTitle');
    const shareBtn = document.getElementById('watchlistShareBtn');
    if (!section) return;

    const params = new URLSearchParams(window.location.search);
    const sharedProfileId = params.get('watchlist');

    if (sharedProfileId) {
      if (shareBtn) shareBtn.hidden = true;
      if (typeof supabase === 'undefined' || !window.AR4_supabase) {
        section.innerHTML = '<p class="footer-text">No se pudo cargar la watchlist compartida.</p>';
        return;
      }
      const sb = window.AR4_supabase;
      const [itemsRes, profileRes] = await Promise.all([
        sb.from('watchlists').select('*').eq('profile_id', sharedProfileId).order('created_at', { ascending: true }),
        sb.from('profiles').select('username').eq('id', sharedProfileId)
      ]);
      if (itemsRes.error || !itemsRes.data) {
        section.innerHTML = '<p class="footer-text">No se pudo cargar esta watchlist.</p>';
        return;
      }
      const username = profileRes.data && profileRes.data[0] ? profileRes.data[0].username : null;
      if (titleEl) titleEl.textContent = username ? `📌 Watchlist de @${username}` : '📌 Watchlist compartida';
      if (!itemsRes.data.length) {
        section.innerHTML = '<p class="footer-text">Esta watchlist está vacía por ahora.</p><a href="herramientas.html" class="btn btn-outline" style="margin-top:14px;">Ver mi propia Watchlist</a>';
        return;
      }
      section.innerHTML = `
        <div id="watchlistTickerContainer" class="tradingview-widget-container" style="margin-bottom:16px;"></div>
        <div id="watchlistItemsList"></div>
        <a href="herramientas.html" class="btn btn-outline" style="margin-top:14px;">Ver mi propia Watchlist</a>
      `;
      document.getElementById('watchlistItemsList').innerHTML = itemsRes.data.map((it) => watchlistItemRowHTML(it, false)).join('');
      mountWatchlistTicker(document.getElementById('watchlistTickerContainer'), itemsRes.data);
      return;
    }

    if (titleEl) titleEl.textContent = '📌 Mi Watchlist';
    if (typeof netlifyIdentity === 'undefined') return;
    const user = netlifyIdentity.currentUser();

    if (!user) {
      if (shareBtn) shareBtn.hidden = true;
      section.innerHTML = `<div class="community-form"><p style="color:var(--text-mid);">Inicia sesión y crea tu perfil de comunidad para armar tu watchlist y compartirla con un enlace.</p><a href="comunidad.html" class="btn btn-outline" style="margin-top:10px;">Ir a Comunidad</a></div>`;
      return;
    }

    let myProfileId = null;

    section.innerHTML = `
      <div class="community-form">
        <label for="wSymbol">Instrumento (ej. EUR/USD, ORO, BTC, DXY o EXCHANGE:TICKER)</label>
        <input type="text" id="wSymbol" maxlength="40" placeholder="ej. EUR/USD">
        <label for="wLabel">Etiqueta (opcional)</label>
        <input type="text" id="wLabel" maxlength="40" placeholder="ej. EUR/USD">
        <button class="btn btn-gold" id="wAddBtn" style="margin-top:14px;">Agregar a mi watchlist</button>
        <div class="community-form-msg" id="wMsg"></div>
      </div>
      <div id="watchlistTickerContainer" class="tradingview-widget-container" style="margin:16px 0;"></div>
      <div id="watchlistItemsList"><p class="footer-text">Cargando...</p></div>
    `;

    async function loadItems() {
      const listEl = document.getElementById('watchlistItemsList');
      const tickerEl = document.getElementById('watchlistTickerContainer');
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-watchlist', { headers: { 'Authorization': 'Bearer ' + jwt } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        myProfileId = data.profileId;
        if (shareBtn) shareBtn.hidden = false;
        listEl.innerHTML = data.items.map((it) => watchlistItemRowHTML(it, true)).join('') || '<p class="footer-text">Todavía no agregaste ningún instrumento.</p>';
        mountWatchlistTicker(tickerEl, data.items);
        listEl.querySelectorAll('.watchlist-remove-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
              const jwt2 = await user.jwt();
              await fetch('/.netlify/functions/community-watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt2 },
                body: JSON.stringify({ action: 'remove', symbol: btn.dataset.symbol })
              });
              loadItems();
            } catch (e) {
              btn.disabled = false;
            }
          });
        });
      } catch (e) {
        listEl.innerHTML = `<p class="footer-text">${e.message}</p>`;
      }
    }

    document.getElementById('wAddBtn').addEventListener('click', async () => {
      const btn = document.getElementById('wAddBtn');
      const msgEl = document.getElementById('wMsg');
      const rawSymbol = document.getElementById('wSymbol').value.trim();
      const rawLabel = document.getElementById('wLabel').value.trim();
      const resolved = resolveWatchlistSymbol(rawSymbol);
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      if (!resolved) {
        msgEl.textContent = 'No reconocemos ese instrumento. Prueba con EUR/USD, ORO, BTC, DXY, SP500... o el formato EXCHANGE:TICKER de TradingView.';
        msgEl.className = 'community-form-msg error';
        return;
      }
      btn.disabled = true;
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ symbol: resolved, label: rawLabel || rawSymbol.toUpperCase() })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        msgEl.textContent = 'Instrumento agregado.';
        msgEl.className = 'community-form-msg success';
        document.getElementById('wSymbol').value = '';
        document.getElementById('wLabel').value = '';
        loadItems();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      } finally {
        btn.disabled = false;
      }
    });

    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        if (!myProfileId) return;
        const url = window.location.origin + window.location.pathname + '?watchlist=' + myProfileId;
        try {
          await navigator.clipboard.writeText(url);
          const original = shareBtn.textContent;
          shareBtn.textContent = '✔ Enlace copiado';
          setTimeout(() => { shareBtn.textContent = original; }, 2000);
        } catch (e) {
          prompt('Copia este enlace:', url);
        }
      });
    }

    loadItems();
  }

  wirePositionCalculator();
  wireRRCalculator();
  wireChecklist();
  initJournal();
  initWatchlist();
})();
