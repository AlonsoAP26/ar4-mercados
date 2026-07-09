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

function ideaCardHTML(a, isPremiumUser) {
  const badge = a.symbol ? `<span class="instrument-badge">${symbolLabel(a.symbol)}</span>` : '';
  const premiumBadge = a.premium ? '<span class="badge-premium">★ Premium</span>' : '';
  const locked = a.premium && !isPremiumUser;

  if (locked) {
    return `
      <article class="broker-card premium-lock">
        ${finHeroHTML(a.heroType, a.trend, 'size-mini')}
        <span class="news-tag">${a.category}</span>${badge}${premiumBadge}
        <h3 style="margin-top:10px;">${a.title}</h3>
        <div class="premium-lock-overlay">
          <span class="lock-icon">🔒</span>
          <p>Este análisis es exclusivo para miembros Premium.</p>
          <a href="membresia.html" class="btn btn-gold">Ver membresía</a>
        </div>
      </article>
    `;
  }

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

  const isPremiumUser = await getPremiumStatus();

  const categories = ['all', ...new Set(ideas.map(a => a.category))];
  filterBar.innerHTML = categories.map(c =>
    `<button class="filter-chip ${c === 'all' ? 'active' : ''}" data-filter="${c}">${c === 'all' ? 'Todas' : c}</button>`
  ).join('');

  function render(filter) {
    const filtered = filter === 'all' ? ideas : ideas.filter(a => a.category === filter);
    grid.innerHTML = filtered.map(a => ideaCardHTML(a, isPremiumUser)).join('') || '<p class="footer-text">No hay análisis en esta categoría todavía.</p>';
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
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
  script.async = true;
  script.text = JSON.stringify({
    symbol: symbol,
    width: '100%',
    height: 240,
    locale: 'es',
    dateRange: '3M',
    colorTheme: 'dark',
    isTransparent: true,
    autosize: false
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
  if (techContainer) renderTechnicalAnalysis(techContainer, idea.symbol);

  if (idea.symbol2) {
    wrap.querySelectorAll('.idea-chart-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.idea-chart-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTVMiniChart(chartContainer, btn.dataset.symbol);
        if (techContainer) renderTechnicalAnalysis(techContainer, btn.dataset.symbol);
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
  const locked = idea.premium && !isPremiumUser;

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
    const premiumBadge = idea.premium ? '<span class="badge-premium">★ Premium</span>' : '';
    metaEl.innerHTML = `
      <span class="badge-impact medium">${idea.category}</span>${badge}${premiumBadge}
      <h1 style="margin:14px 0 10px;">${idea.title}</h1>
      <span class="news-meta">${idea.author} · ${formatFechaIdea(idea.date)}</span>
    `;
  }

  if (locked) {
    body.innerHTML = `
      <div class="premium-lock" style="border-radius:var(--radius);">
        <p style="color:var(--text-mid);font-size:1rem;margin-bottom:20px;">${idea.excerpt}</p>
        <div class="promo-banner">
          <div class="promo-banner-text">
            <span class="lock-icon">🔒</span>
            <h3 style="margin-top:8px;">Este análisis es exclusivo para miembros Premium</h3>
            <p>Suscríbete para desbloquear este y todos los análisis avanzados de AR4 Mercados.</p>
          </div>
          <a href="membresia.html" class="btn btn-gold">Ver membresía Premium</a>
        </div>
      </div>
    `;
  } else {
    initIdeaChart(idea);
    body.innerHTML = idea.body;
  }

  const relatedGrid = document.getElementById('relatedIdeasGrid');
  if (relatedGrid) {
    const related = ideas.filter(a => a.slug !== slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
    relatedGrid.innerHTML = related.map(a => ideaCardHTML(a, isPremiumUser)).join('');
  }
}

initIdeasListing();
initIdeaDetail();
