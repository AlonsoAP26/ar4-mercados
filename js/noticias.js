const NEWS_SYMBOL_LABELS = {
  'FX:EURUSD': 'EUR/USD',
  'FX_IDC:USDMXN': 'USD/MXN',
  'FX_IDC:USDCOP': 'USD/COP',
  'FX_IDC:USDCLP': 'USD/CLP',
  'FX_IDC:USDARS': 'USD/ARS',
  'FX_IDC:USDBRL': 'USD/BRL',
  'FX_IDC:USDPEN': 'USD/PEN',
  'TVC:UKOIL': 'PETRÓLEO BRENT',
  'TVC:USOIL': 'PETRÓLEO WTI',
  'TVC:DXY': 'ÍNDICE DÓLAR (DXY)',
  'BMFBOVESPA:IBOV': 'IBOVESPA',
  'OANDA:XAUUSD': 'ORO (XAU/USD)',
  'BITSTAMP:BTCUSD': 'BTC/USD',
  'COINBASE:ETHUSD': 'ETH/USD'
};

function newsSymbolLabel(symbol) {
  if (!symbol) return '';
  return NEWS_SYMBOL_LABELS[symbol] || symbol.split(':').pop();
}

async function getPremiumStatus() {
  if (typeof window.AR4_checkPremium === 'function') {
    try { return await window.AR4_checkPremium(); } catch (e) { return false; }
  }
  return false;
}

async function loadNoticias() {
  const res = await fetch('data/noticias.json');
  if (!res.ok) throw new Error('No se pudieron cargar las noticias');
  return res.json();
}

function tiempoRelativo(iso) {
  const d = new Date(iso + 'T00:00:00');
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 1) return 'hace instantes';
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  return `hace ${diffD} d`;
}

function newsCardHTML(n) {
  return `
    <article class="broker-card" data-category="${n.category}">
      ${finHeroHTML(n.heroType, n.trend, 'size-mini')}
      <span class="news-tag">${n.category}</span>
      <h3 style="margin-top:10px;"><a href="noticia.html?slug=${encodeURIComponent(n.slug)}" style="color:inherit;">${n.title}</a></h3>
      <p style="color:var(--text-mid); font-size:0.88rem; margin-bottom:14px;">${n.excerpt}</p>
      <span class="news-meta">Fuente: ${n.sourceName} · ${tiempoRelativo(n.date)}</span>
      <a href="noticia.html?slug=${encodeURIComponent(n.slug)}" class="btn btn-outline btn-block" style="margin-top:16px;">Leer noticia completa</a>
    </article>
  `;
}

async function initNoticiasListing() {
  const grid = document.getElementById('noticiasGrid');
  const filterBar = document.getElementById('noticiasFilterBar');
  if (!grid || !filterBar) return;

  let noticias;
  try {
    noticias = await loadNoticias();
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar las noticias. Intenta recargar la página.</p>';
    return;
  }

  noticias.sort((a, b) => new Date(b.date) - new Date(a.date));

  const categories = ['all', ...new Set(noticias.map(n => n.category))];
  filterBar.innerHTML = categories.map(c =>
    `<button class="filter-chip ${c === 'all' ? 'active' : ''}" data-filter="${c}">${c === 'all' ? 'Todas' : c}</button>`
  ).join('');

  function render(filter) {
    const filtered = filter === 'all' ? noticias : noticias.filter(n => n.category === filter);
    grid.innerHTML = filtered.map(newsCardHTML).join('') || '<p class="footer-text">No hay noticias en esta categoría todavía.</p>';
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

function renderNewsChart(container, symbol) {
  container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
  script.async = true;
  script.text = JSON.stringify({
    symbol: symbol,
    width: '100%',
    height: 420,
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

async function initNoticiaDetail() {
  const body = document.getElementById('noticiaBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let noticias;
  try {
    noticias = await loadNoticias();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar la noticia.</p>';
    return;
  }

  const n = noticias.find(x => x.slug === slug);
  if (!n) {
    body.innerHTML = '<p class="footer-text">Noticia no encontrada. <a href="noticias.html">Volver a Noticias</a>.</p>';
    return;
  }

  document.title = n.title + ' — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', n.excerpt);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = n.title;

  const heroEl = document.getElementById('noticiaHero');
  if (heroEl) {
    heroEl.innerHTML = finHeroHTML(n.heroType, n.trend, 'size-full');
  }

  const metaEl = document.getElementById('noticiaMeta');
  if (metaEl) {
    const badge = n.symbol ? `<span class="instrument-badge">${newsSymbolLabel(n.symbol)}</span>` : '';
    metaEl.innerHTML = `
      <span class="badge-impact medium">${n.category}</span>${badge}
      <h1 style="margin:14px 0 10px;">${n.title}</h1>
      <span class="badge-live">ACTUALIZADO</span> <span class="news-meta" style="margin-left:8px;">${n.author} · ${tiempoRelativo(n.date)}</span>
    `;
  }

  if (n.symbol) {
    const chartWrap = document.getElementById('noticiaChart');
    if (chartWrap) {
      let tabsHTML = '';
      if (n.symbol2) {
        tabsHTML = `
          <div class="idea-chart-tabs">
            <button class="active" data-symbol="${n.symbol}">${newsSymbolLabel(n.symbol)}</button>
            <button data-symbol="${n.symbol2}">${newsSymbolLabel(n.symbol2)}</button>
          </div>
        `;
      }
      chartWrap.innerHTML = `
        <div class="idea-chart-wrap">
          ${tabsHTML}
          <div class="tradingview-widget-container" id="noticiaTvChart"></div>
        </div>
      `;
      const chartContainer = document.getElementById('noticiaTvChart');
      renderNewsChart(chartContainer, n.symbol);

      const techContainer = document.getElementById('noticiaTechnical');
      if (techContainer) renderTechnicalAnalysis(techContainer, n.symbol);

      if (n.symbol2) {
        chartWrap.querySelectorAll('.idea-chart-tabs button').forEach(btn => {
          btn.addEventListener('click', () => {
            chartWrap.querySelectorAll('.idea-chart-tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNewsChart(chartContainer, btn.dataset.symbol);
            if (techContainer) renderTechnicalAnalysis(techContainer, btn.dataset.symbol);
          });
        });
      }
    }
  }

  body.innerHTML = n.body;

  const conclusionEl = document.getElementById('noticiaConclusion');
  if (conclusionEl && n.bodyPremium) {
    const isPremiumUser = await getPremiumStatus();
    if (isPremiumUser) {
      conclusionEl.innerHTML = `<article class="article-body">${n.bodyPremium}</article>`;
    } else {
      conclusionEl.innerHTML = `
        <div class="premium-lock" style="border-radius:var(--radius);min-height:220px;">
          <div class="broker-card-inner-blur">
            <article class="article-body">${n.bodyPremium}</article>
          </div>
          <div class="premium-lock-overlay">
            <span class="lock-icon">🔒</span>
            <p><strong>Conclusión y análisis final</strong><br>Los datos macro completos y la lectura final de este movimiento son exclusivos para miembros Premium.</p>
            <a href="membresia.html" class="btn btn-gold">Ver membresía Premium</a>
          </div>
        </div>
      `;
    }
  }

  const sourceBox = document.getElementById('noticiaSource');
  if (sourceBox) {
    sourceBox.innerHTML = `📎 Fuente original de los datos: <a href="${n.sourceUrl}" target="_blank" rel="noopener">${n.sourceName}</a>. Resumen y análisis redactados por AR4 Mercados.`;
  }

  const relatedGrid = document.getElementById('relatedNoticiasGrid');
  if (relatedGrid) {
    const related = noticias.filter(x => x.slug !== slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
    relatedGrid.innerHTML = related.map(newsCardHTML).join('');
  }
}

async function initHomeNewsPreview() {
  const grid = document.getElementById('homeNewsGrid');
  if (!grid) return;
  try {
    const noticias = await loadNoticias();
    noticias.sort((a, b) => new Date(b.date) - new Date(a.date));
    grid.innerHTML = noticias.slice(0, 3).map(newsCardHTML).join('');
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar las noticias.</p>';
  }
}

initNoticiasListing();
initNoticiaDetail();
initHomeNewsPreview();
