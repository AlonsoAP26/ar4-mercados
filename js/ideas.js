const SYMBOL_LABELS = {
  'FX:EURUSD': 'EUR/USD',
  'FX_IDC:USDMXN': 'USD/MXN',
  'FX_IDC:USDCOP': 'USD/COP',
  'FX_IDC:USDCLP': 'USD/CLP',
  'FX_IDC:USDARS': 'USD/ARS',
  'FX_IDC:USDBRL': 'USD/BRL',
  'FX_IDC:USDPEN': 'USD/PEN',
  'FX:GBPUSD': 'GBP/USD',
  'FX:USDJPY': 'USD/JPY',
  'OANDA:XAUUSD': 'ORO (XAU/USD)',
  'TVC:USOIL': 'PETRÓLEO WTI',
  'TVC:UKOIL': 'PETRÓLEO BRENT',
  'FOREXCOM:SPXUSD': 'S&P 500',
  'FOREXCOM:NSXUSD': 'NASDAQ 100',
  'BITSTAMP:BTCUSD': 'BTC/USD',
  'COINBASE:ETHUSD': 'ETH/USD'
};

function symbolLabel(symbol) {
  if (!symbol) return '';
  return SYMBOL_LABELS[symbol] || symbol.split(':').pop();
}

async function loadIdeas() {
  const res = await fetch('data/ideas.json');
  if (!res.ok) throw new Error('No se pudieron cargar las ideas');
  return res.json();
}

function formatFechaIdea(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ideaCardHTML(a) {
  const badge = a.symbol ? `<span class="instrument-badge">${symbolLabel(a.symbol)}</span>` : '';
  const premiumBadge = a.bodyPremium ? '<span class="badge-premium">★ Análisis Premium disponible</span>' : '';

  return `
    <article class="broker-card">
      ${finHeroHTML(a.heroType, a.trend, 'size-mini')}
      <span class="news-tag">${a.category}</span>${badge}${premiumBadge}
      <h3 style="margin-top:10px;"><a href="idea.html?slug=${encodeURIComponent(a.slug)}" style="color:inherit;">${a.title}</a></h3>
      <p style="color:var(--text-mid); font-size:0.88rem; margin-bottom:14px;">${a.excerpt}</p>
      <span class="news-meta">${a.author} · ${formatFechaIdea(a.date)}</span>
      <a href="idea.html?slug=${encodeURIComponent(a.slug)}" class="btn btn-outline btn-block" style="margin-top:16px;">Leer análisis</a>
    </article>
  `;
}

const STATUS_META = {
  activo:      { emoji: '🟢', label: 'Activo',           stage: 1 },
  esperando:   { emoji: '🟡', label: 'A la espera del catalizador', stage: 0 },
  parcial:     { emoji: '🟠', label: 'Escenario parcialmente confirmado', stage: 2 },
  breakeven:   { emoji: '🔵', label: 'Punto de equilibrio', stage: 3 },
  objetivo:    { emoji: '🏆', label: 'Objetivo de referencia alcanzado', stage: 4 },
  invalidado:  { emoji: '🔴', label: 'Escenario invalidado', stage: -1 },
  finalizado:  { emoji: '⚫', label: 'Análisis cerrado', stage: 5 }
};
const STAGE_LABELS = ['Publicado', 'Escenario activo', 'Confirmación parcial', 'Punto de equilibrio', 'Objetivo alcanzado', 'Cerrado'];

const SYMBOL_COUNTRIES = {
  'FX:EURUSD': 'us,eu', 'FX:GBPUSD': 'us,gb', 'FX:USDJPY': 'us,jp',
  'FX_IDC:USDMXN': 'us,mx', 'FX_IDC:USDCOP': 'us,co', 'FX_IDC:USDCLP': 'us,cl',
  'FX_IDC:USDARS': 'us,ar', 'FX_IDC:USDBRL': 'us,br', 'FX_IDC:USDPEN': 'us,pe',
  'OANDA:XAUUSD': 'us', 'TVC:USOIL': 'us', 'TVC:UKOIL': 'gb,us',
  'FOREXCOM:SPXUSD': 'us', 'FOREXCOM:NSXUSD': 'us',
  'BITSTAMP:BTCUSD': 'us', 'COINBASE:ETHUSD': 'us', 'BINANCE:SOLUSDT': 'us',
  'BINANCE:XRPUSDT': 'us', 'BINANCE:ADAUSDT': 'us'
};

// Divisas del feed económico que afectan a cada símbolo (para el calendario propio).
const SYMBOL_CURRENCIES = {
  'FX:EURUSD': ['USD', 'EUR'], 'FX:GBPUSD': ['USD', 'GBP'], 'FX:USDJPY': ['USD', 'JPY'],
  'FX_IDC:USDMXN': ['USD'], 'FX_IDC:USDCOP': ['USD'], 'FX_IDC:USDCLP': ['USD'],
  'FX_IDC:USDARS': ['USD'], 'FX_IDC:USDBRL': ['USD'], 'FX_IDC:USDPEN': ['USD'],
  'OANDA:XAUUSD': ['USD'], 'TVC:USOIL': ['USD'], 'TVC:UKOIL': ['USD', 'GBP'],
  'FOREXCOM:SPXUSD': ['USD'], 'FOREXCOM:NSXUSD': ['USD'],
  'BITSTAMP:BTCUSD': ['USD'], 'COINBASE:ETHUSD': ['USD'], 'BINANCE:SOLUSDT': ['USD'],
  'BINANCE:XRPUSDT': ['USD'], 'BINANCE:ADAUSDT': ['USD']
};

function renderTradeStatusCard(idea) {
  const wrap = document.getElementById('ideaStatusCard');
  if (!wrap) return;
  const meta = STATUS_META[idea.status] || STATUS_META.activo;
  const biasClass = idea.trend === 'up' ? 'bias-up' : idea.trend === 'down' ? 'bias-down' : 'bias-neutral';
  const biasLabel = idea.trend === 'up' ? 'Sesgo alcista' : idea.trend === 'down' ? 'Sesgo bajista' : 'Sesgo neutral / en rango';

  let stepperHTML = '';
  if (meta.stage >= 0) {
    stepperHTML = `
      <div class="trade-stepper">
        ${STAGE_LABELS.map((label, i) => `
          <div class="trade-step ${i <= meta.stage ? 'done' : ''} ${i === meta.stage ? 'current' : ''}">
            <span class="trade-step-dot"></span><span class="trade-step-label">${label}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    stepperHTML = `<p class="footer-text" style="margin-top:10px;">Este escenario técnico fue invalidado — el precio rompió los niveles que sostenían la lectura original.</p>`;
  }

  wrap.innerHTML = `
    <div class="glass-card trade-card ${biasClass}">
      <div class="trade-card-head">
        <span class="trade-status-badge">${meta.emoji} ${meta.label}</span>
        <span class="trade-bias-badge">${biasLabel}</span>
      </div>
      <div class="trade-card-meta">
        <div><span class="trade-card-label">Activo</span><span class="trade-card-value">${symbolLabel(idea.symbol)}</span></div>
        <div><span class="trade-card-label">Categoría</span><span class="trade-card-value">${idea.category}</span></div>
        <div><span class="trade-card-label">Tipo de contenido</span><span class="trade-card-value">Análisis de contexto</span></div>
      </div>
      ${stepperHTML}
      <p class="trade-card-note">⚠️ Esta tarjeta resume el estado del análisis, no una orden de compra/venta. Los niveles de soporte, resistencia e invalidación están descritos en el texto del análisis.</p>
    </div>
  `;
}

function computeConsistency(idea) {
  if (typeof idea.rsi !== 'number' || !idea.trendMA) return null;
  let aligned = 0;
  let total = 2;
  if (idea.trend === 'up') {
    if (idea.rsi >= 50) aligned++;
    if (idea.trendMA === 'above') aligned++;
  } else if (idea.trend === 'down') {
    if (idea.rsi < 50) aligned++;
    if (idea.trendMA === 'below') aligned++;
  } else {
    total = 1;
    if (idea.trendMA === 'mixed') aligned++;
  }
  return Math.round((aligned / total) * 100);
}

function renderAIPanel(idea) {
  const wrap = document.getElementById('ideaAIPanel');
  if (!wrap) return;
  const consistency = computeConsistency(idea);
  if (consistency === null) { wrap.innerHTML = ''; return; }

  const sentimentLabel = idea.trend === 'up' ? 'Alcista' : idea.trend === 'down' ? 'Bajista' : 'Neutral / en rango';
  const volatilityLabel = idea.volatility ? idea.volatility.charAt(0).toUpperCase() + idea.volatility.slice(1) : '—';
  const circleDeg = Math.round(consistency * 3.6);
  const strengthsHTML = (idea.strengths || []).map(s => `<li>${s}</li>`).join('');
  const weaknessesHTML = (idea.weaknesses || []).map(s => `<li>${s}</li>`).join('');

  wrap.innerHTML = `
    <div class="section-head" style="margin-top:32px;margin-bottom:14px;">
      <h2 style="font-size:1.1rem;">🤖 Análisis IA AR4</h2>
      <span class="badge-live">RESUMEN AUTOMÁTICO</span>
    </div>
    <div class="glass-card ai-panel">
      <div class="ai-panel-gauge">
        <div class="ai-gauge-circle" style="--gauge-deg:${circleDeg}deg;">
          <div class="ai-gauge-inner">
            <span class="ai-gauge-value">${consistency}%</span>
            <span class="ai-gauge-caption">Consistencia técnica</span>
          </div>
        </div>
      </div>
      <div class="ai-panel-stats">
        <div><span class="trade-card-label">Sentimiento</span><span class="trade-card-value">${sentimentLabel}</span></div>
        <div><span class="trade-card-label">Volatilidad estimada</span><span class="trade-card-value">${volatilityLabel}</span></div>
        <div><span class="trade-card-label">RSI diario</span><span class="trade-card-value">${idea.rsi}</span></div>
      </div>
      <div class="ai-panel-lists">
        ${strengthsHTML ? `<div><strong style="color:var(--green);">Fortalezas</strong><ul>${strengthsHTML}</ul></div>` : ''}
        ${weaknessesHTML ? `<div><strong style="color:var(--crimson-bright);">Debilidades</strong><ul>${weaknessesHTML}</ul></div>` : ''}
      </div>
      <p class="footer-text" style="font-size:0.76rem;margin-top:6px;">"Consistencia técnica" mide qué tan alineados están el RSI y la posición del precio frente a sus medias móviles con la tendencia descrita en este análisis. No es una predicción de resultado ni una probabilidad de éxito.</p>
    </div>
  `;
}

function renderRelatedCalendar(idea) {
  const wrap = document.getElementById('ideaRelatedCalendar');
  if (!wrap || !idea.symbol) return;
  const currencies = SYMBOL_CURRENCIES[idea.symbol] || ['USD'];
  wrap.innerHTML = '<div class="ar4-ecal-embed" style="margin-top:32px;"></div>';
  const el = wrap.querySelector('.ar4-ecal-embed');
  el.dataset.currencies = currencies.join(',');
  el.dataset.limit = '6';
  if (window.AR4ECAL && window.AR4ECAL.renderEmbed) {
    window.AR4ECAL.renderEmbed(el, { currencies: currencies, limit: 6 });
  } else if (window.AR4ECAL && window.AR4ECAL.initEmbeds) {
    window.AR4ECAL.initEmbeds(wrap);
  }
}

async function getPremiumStatus() {
  if (typeof window.AR4_checkPremium === 'function') {
    try { return await window.AR4_checkPremium(); } catch (e) { return false; }
  }
  return false;
}

async function initIdeasListing() {
  const grid = document.getElementById('ideasGrid');
  const filterBar = document.getElementById('ideasFilterBar');
  if (!grid || !filterBar) return;

  let ideas;
  try {
    ideas = await loadIdeas();
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar los análisis. Intenta recargar la página.</p>';
    return;
  }

  ideas.sort((a, b) => new Date(b.date) - new Date(a.date));

  const categories = ['all', ...new Set(ideas.map(a => a.category))];
  filterBar.innerHTML = categories.map(c =>
    `<button class="filter-chip ${c === 'all' ? 'active' : ''}" data-filter="${c}">${c === 'all' ? 'Todas' : c}</button>`
  ).join('');

  function render(filter) {
    const filtered = filter === 'all' ? ideas : ideas.filter(a => a.category === filter);
    grid.innerHTML = filtered.map(a => ideaCardHTML(a)).join('') || '<p class="footer-text">No hay análisis en esta categoría todavía.</p>';
  }

  render('all');

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    render(chip.dataset.filter);
  });
}

function renderTVMiniChart(container, symbol) {
  container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.text = JSON.stringify({
    symbol: symbol,
    width: '100%',
    height: 480,
    interval: '60',
    locale: 'es',
    timezone: 'America/Lima',
    theme: 'dark',
    style: '1',
    hide_side_toolbar: false,
    allow_symbol_change: false,
    studies: ['MASimple@tv-basicstudies', 'MAExp@tv-basicstudies'],
    support_host: 'https://www.tradingview.com'
  });
  container.appendChild(script);
}

function renderPremiumChart(container, symbol) {
  container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.text = JSON.stringify({
    symbol: symbol,
    width: '100%',
    height: 480,
    interval: '60',
    locale: 'es',
    timezone: 'America/Lima',
    theme: 'dark',
    style: '1',
    hide_side_toolbar: false,
    allow_symbol_change: false,
    studies: ['MASimple@tv-basicstudies', 'MAExp@tv-basicstudies', 'Volume@tv-basicstudies', 'VbPFixed@tv-volumebyprice'],
    support_host: 'https://www.tradingview.com'
  });
  container.appendChild(script);
}

function initIdeaChart(idea) {
  const wrap = document.getElementById('ideaChart');
  if (!wrap || !idea.symbol) return;

  let tabsHTML = '';
  if (idea.symbol2) {
    tabsHTML = `
      <div class="idea-chart-tabs">
        <button class="active" data-symbol="${idea.symbol}">${symbolLabel(idea.symbol)}</button>
        <button data-symbol="${idea.symbol2}">${symbolLabel(idea.symbol2)}</button>
      </div>
    `;
  }

  wrap.innerHTML = `
    <div class="idea-chart-wrap">
      ${tabsHTML}
      <div class="tradingview-widget-container" id="tvChartContainer"></div>
    </div>
  `;

  const chartContainer = document.getElementById('tvChartContainer');
  renderTVMiniChart(chartContainer, idea.symbol);

  const techContainer = document.getElementById('ideaTechnical');
  // Panel propio con los indicadores reales que el generador guardo en el
  // analisis: no depende de ningun widget externo y no puede quedarse sin
  // datos. El widget de TradingView queda de respaldo para los analisis
  // antiguos, que no traen marketData.
  const pintaIndicadores = (sym) => {
    if (!techContainer) return;
    if (idea.marketData && window.AR4_renderIndicators && sym === idea.symbol) {
      window.AR4_renderIndicators(techContainer, idea.marketData);
    } else {
      renderTechnicalAnalysis(techContainer, sym);
    }
  };
  pintaIndicadores(idea.symbol);

  if (idea.symbol2) {
    wrap.querySelectorAll('.idea-chart-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.idea-chart-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTVMiniChart(chartContainer, btn.dataset.symbol);
        pintaIndicadores(btn.dataset.symbol);
      });
    });
  }
}

async function initIdeaDetail() {
  const body = document.getElementById('ideaBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let ideas;
  try {
    ideas = await loadIdeas();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar el análisis.</p>';
    return;
  }

  const idea = ideas.find(a => a.slug === slug);
  if (!idea) {
    body.innerHTML = '<p class="footer-text">Análisis no encontrado. <a href="ideas.html">Volver a Ideas de Trading</a>.</p>';
    return;
  }

  const isPremiumUser = await getPremiumStatus();

  document.title = idea.title + ' — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', idea.excerpt);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = idea.title;

  const heroEl = document.getElementById('ideaHeroGraphic');
  if (heroEl) heroEl.innerHTML = finHeroHTML(idea.heroType, idea.trend, 'size-full');

  const metaEl = document.getElementById('ideaMeta');
  if (metaEl) {
    const badge = idea.symbol ? `<span class="instrument-badge">${symbolLabel(idea.symbol)}</span>` : '';
    metaEl.innerHTML = `
      <span class="badge-impact medium">${idea.category}</span>${badge}
      <h1 style="margin:14px 0 10px;">${idea.title}</h1>
      <span class="news-meta">${idea.author} · ${formatFechaIdea(idea.date)}</span>
    `;
  }

  initIdeaChart(idea);
  renderTradeStatusCard(idea);
  body.innerHTML = idea.body;

  const conclusionEl = document.getElementById('ideaConclusion');
  if (conclusionEl && idea.bodyPremium) {
    if (isPremiumUser) {
      conclusionEl.innerHTML = `
        <div class="section-head" style="margin-top:8px;">
          <h2 style="font-size:1.2rem;">Análisis Premium: volumen y flujo institucional</h2>
          <span class="badge-premium">★ Premium</span>
        </div>
        <div class="idea-chart-wrap" style="margin-bottom:24px;" id="ideaPremiumChartWrap">
          <div class="tradingview-widget-container" id="ideaPremiumChart"></div>
        </div>
        <article class="article-body">${idea.bodyPremium}</article>
      `;
      const premiumChartContainer = document.getElementById('ideaPremiumChart');
      if (premiumChartContainer && idea.symbol) renderPremiumChart(premiumChartContainer, idea.symbol);
    } else {
      conclusionEl.innerHTML = `
        <div class="premium-lock" style="border-radius:var(--radius);min-height:260px;margin-top:8px;">
          <div class="broker-card-inner-blur">
            <div class="section-head"><h2 style="font-size:1.2rem;">Análisis Premium: volumen y flujo institucional</h2></div>
            <article class="article-body">${idea.bodyPremium}</article>
          </div>
          <div class="premium-lock-overlay">
            <span class="lock-icon">🔒</span>
            <p><strong>Análisis Premium</strong><br>Gráfico con volumen y volume profile, más la lectura de flujo institucional, exclusivos para miembros Premium.</p>
            <a href="membresia.html" class="btn btn-gold">Ver membresía Premium</a>
          </div>
        </div>
      `;
    }
  }

  renderAIPanel(idea);
  renderRelatedCalendar(idea);
  if (window.AR4_initSocial) window.AR4_initSocial(idea);

  if (window.AR4_initComments) window.AR4_initComments('commentsSection', 'idea', idea.slug);

  const relatedGrid = document.getElementById('relatedIdeasGrid');
  if (relatedGrid) {
    const related = ideas.filter(a => a.slug !== slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
    relatedGrid.innerHTML = related.map(a => ideaCardHTML(a)).join('');
  }
}

initIdeasListing();
initIdeaDetail();
