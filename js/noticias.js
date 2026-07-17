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
  'CAPITALCOM:DXY': 'ÍNDICE DÓLAR (DXY)',
  'BMFBOVESPA:IBOV': 'IBOVESPA',
  'OANDA:XAUUSD': 'ORO (XAU/USD)',
  'BITSTAMP:BTCUSD': 'BTC/USD',
  'COINBASE:ETHUSD': 'ETH/USD',
  'FOREXCOM:SPXUSD': 'S&P 500',
  'FOREXCOM:NSXUSD': 'NASDAQ 100',
  'TVC:US10Y': 'BONO EE.UU. 10A'
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

function plainText(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderReadBar(n) {
  const el = document.getElementById('noticiaReadBar');
  if (!el) return;
  const words = plainText(n.body).split(' ').filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  el.innerHTML = `<span class="noticia-readtime">⏱ ${minutes} min de lectura ${n.aiSummary ? '· <a href="#noticiaAiSummaryCard">Ver resumen de 30 segundos ↓</a>' : ''}</span>`;
}

function renderAiSummary(n) {
  const el = document.getElementById('noticiaAiSummary');
  if (!el || !n.aiSummary) { if (el) el.innerHTML = ''; return; }
  const s = n.aiSummary;
  const activosHTML = (s.activos || []).map(a => `<span class="instrument-badge">${a}</span>`).join(' ');
  el.innerHTML = `
    <div class="glass-card ai-summary-card" id="noticiaAiSummaryCard">
      <div class="ai-summary-head">🤖 <strong>Resumen generado por IA</strong> <span class="badge-live">EN 30 SEGUNDOS</span></div>
      <ul class="ai-summary-list">
        <li><strong>Qué pasó:</strong> ${s.que}</li>
        <li><strong>Por qué importa:</strong> ${s.porque}</li>
        ${activosHTML ? `<li><strong>Qué activos afecta:</strong> ${activosHTML}</li>` : ''}
        <li><strong>Qué podría ocurrir después:</strong> ${s.siguiente}</li>
      </ul>
      <p class="footer-text" style="font-size:0.74rem;margin-top:6px;">Resumen interpretativo generado por IA AR4 a partir de la noticia completa. No es asesoría financiera.</p>
    </div>
  `;
}

function lazyLoadWidget(container, buildFn) {
  if (!('IntersectionObserver' in window)) { buildFn(); return; }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { buildFn(); observer.disconnect(); }
    });
  }, { rootMargin: '200px' });
  observer.observe(container);
}

function renderMarketImpact(n) {
  const el = document.getElementById('noticiaMarketImpact');
  if (!el || !n.relatedSymbols || !n.relatedSymbols.length) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="section-head" style="margin-top:8px;margin-bottom:14px;">
      <h2 style="font-size:1.1rem;">🌎 Impacto en otros mercados</h2>
      <span class="badge-live">COTIZACIONES EN VIVO</span>
    </div>
    <div class="tradingview-widget-container" id="noticiaImpactWidget" style="margin-bottom:28px;"></div>
  `;
  const widgetContainer = document.getElementById('noticiaImpactWidget');
  lazyLoadWidget(widgetContainer, () => {
    widgetContainer.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;
    script.text = JSON.stringify({
      width: '100%',
      height: 260,
      symbolsGroups: [{ name: 'Relacionados', symbols: n.relatedSymbols.map(s => ({ name: s, displayName: newsSymbolLabel(s) })) }],
      colorTheme: 'dark',
      isTransparent: true,
      locale: 'es'
    });
    widgetContainer.appendChild(script);
  });
}

function renderTimeline(n) {
  const el = document.getElementById('noticiaTimeline');
  if (!el || !n.timeline || !n.timeline.length) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="section-head" style="margin-top:8px;margin-bottom:14px;">
      <h2 style="font-size:1.1rem;">🕒 Cómo se fue armando esta historia</h2>
    </div>
    <div class="noticia-timeline">
      ${n.timeline.map(t => `
        <div class="noticia-timeline-item">
          <span class="noticia-timeline-when">${t.cuando}</span>
          <p>${t.texto}</p>
        </div>
      `).join('<div class="noticia-timeline-arrow">↓</div>')}
    </div>
  `;
}

function renderAiPanel(n) {
  const el = document.getElementById('noticiaAiPanel');
  if (!el) return;
  if (!n.aiScenarios && !n.aiDetects && !n.impactScore) { el.innerHTML = ''; return; }

  const scenariosHTML = n.aiScenarios ? `
    <div class="ai-scenarios">
      <strong style="display:block;margin-bottom:8px;">Escenarios IA</strong>
      <div class="ai-scenario-row"><span>🟢 Alcista</span><div class="ai-scenario-bar"><div style="width:${n.aiScenarios.alcista}%;background:var(--green);"></div></div><span>${n.aiScenarios.alcista}%</span></div>
      <div class="ai-scenario-row"><span>🟡 Lateral</span><div class="ai-scenario-bar"><div style="width:${n.aiScenarios.lateral}%;background:#f0c75e;"></div></div><span>${n.aiScenarios.lateral}%</span></div>
      <div class="ai-scenario-row"><span>🔴 Bajista</span><div class="ai-scenario-bar"><div style="width:${n.aiScenarios.bajista}%;background:var(--crimson-bright);"></div></div><span>${n.aiScenarios.bajista}%</span></div>
    </div>
  ` : '';

  const detectsHTML = n.aiDetects ? `
    <div class="ai-panel-stats">
      <div><span class="trade-card-label">Probabilidad de continuidad</span><span class="trade-card-value">${n.aiDetects.probabilidad}%</span></div>
      <div><span class="trade-card-label">Riesgo</span><span class="trade-card-value">${n.aiDetects.riesgo}</span></div>
    </div>
    <p style="margin-top:8px;">${n.aiDetects.lectura} <a href="#noticiaChart">Ver niveles en el gráfico en vivo ↑</a></p>
  ` : '';

  const impactHTML = n.impactScore ? `
    <div class="ai-impact-row">
      <span class="trade-card-label">Impacto estimado por IA AR4</span>
      <div class="ai-impact-bar"><div style="width:${n.impactScore * 10}%;"></div></div>
      <span>${n.impactScore}/10</span>
    </div>
  ` : '';

  el.innerHTML = `
    <div class="section-head" style="margin-top:32px;margin-bottom:14px;">
      <h2 style="font-size:1.1rem;">🤖 IA AR4 detecta</h2>
      <span class="badge-live">ANÁLISIS AUTOMÁTICO</span>
    </div>
    <div class="glass-card ai-panel ai-panel-noticia">
      ${detectsHTML}
      ${scenariosHTML}
      ${impactHTML}
      <p class="footer-text" style="font-size:0.76rem;margin-top:10px;">Lectura probabilística generada por IA AR4 a partir del contexto de la noticia. Nunca es una señal de compra/venta ni una predicción garantizada — es un análisis educativo.</p>
    </div>
  `;
}

function renderFaq(n) {
  const el = document.getElementById('noticiaFaq');
  if (!el || !n.faq || !n.faq.length) { if (el) el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="section-head" style="margin-top:32px;margin-bottom:14px;">
      <h2 style="font-size:1.1rem;">❓ Preguntas frecuentes</h2>
    </div>
    <div class="noticia-faq">
      ${n.faq.map((f, i) => `
        <details class="noticia-faq-item" ${i === 0 ? 'open' : ''}>
          <summary>${f.q}</summary>
          <p>${f.a}</p>
        </details>
      `).join('')}
    </div>
  `;
}

function renderMidRelated(n, noticias) {
  const el = document.getElementById('noticiaMidRelated');
  if (!el) return;
  const related = noticias.filter(x => x.slug !== n.slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  if (!related.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="section-head" style="margin-top:28px;margin-bottom:12px;">
      <h2 style="font-size:1rem;">📰 También podría interesarte</h2>
    </div>
    <div class="noticia-mid-related">
      ${related.map(r => `<a href="noticia.html?slug=${encodeURIComponent(r.slug)}" class="noticia-mid-related-item">${r.title}</a>`).join('')}
    </div>
  `;
}

async function renderSidebar(n, noticias) {
  const el = document.getElementById('noticiaSidebar');
  if (!el) return;

  const ultimaHora = noticias.filter(x => x.slug !== n.slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const ultimaHoraHTML = ultimaHora.map(x => `
    <a href="noticia.html?slug=${encodeURIComponent(x.slug)}" class="sidebar-mini-item">
      <span class="news-tag" style="font-size:0.66rem;">${x.category}</span>
      <span>${x.title}</span>
    </a>
  `).join('');

  let ideasHTML = '<p class="footer-text" style="font-size:0.78rem;">Sin ideas relacionadas todavía.</p>';
  try {
    const res = await fetch('data/ideas.json');
    if (res.ok) {
      const ideas = await res.json();
      const related = n.symbol
        ? ideas.filter(i => i.symbol === n.symbol)
        : ideas.filter(i => i.category === n.category);
      const picks = related.slice(0, 3);
      if (picks.length) {
        ideasHTML = picks.map(i => `<a href="idea.html?slug=${encodeURIComponent(i.slug)}" class="sidebar-mini-item"><span>${i.title}</span></a>`).join('');
      }
    }
  } catch (e) { /* noop */ }

  let communityHTML = '';
  if (n.symbol && typeof supabase !== 'undefined' && window.AR4_supabase) {
    try {
      const label = newsSymbolLabel(n.symbol).split(' ')[0].split('(')[0].trim();
      const { count } = await window.AR4_supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .ilike('symbol', `%${label}%`);
      if (count) {
        communityHTML = `
          <a href="comunidad.html" class="sidebar-cta-card">
            <strong>👥 ${count} publicaci${count === 1 ? 'ón' : 'ones'}</strong>
            <span>de la comunidad hablando de ${label}</span>
          </a>
        `;
      }
    } catch (e) { /* noop */ }
  }

  const sponsorHTML = (typeof window.AR4_sponsorSky === 'function') ? window.AR4_sponsorSky() : '';

  el.innerHTML = `
    <div class="sidebar-block">
      <h3>🔥 Última hora</h3>
      ${ultimaHoraHTML || '<p class="footer-text" style="font-size:0.78rem;">No hay más noticias todavía.</p>'}
    </div>
    <div class="sidebar-block">
      <h3>⭐ Ideas relacionadas</h3>
      ${ideasHTML}
    </div>
    ${communityHTML}
    ${sponsorHTML}
    <div class="sidebar-block sidebar-cta-premium">
      <h3>🚀 AR4 AI Premium</h3>
      <p>Consulta con Aria sobre esta noticia con contexto ilimitado y análisis más profundo.</p>
      <a href="membresia.html" class="btn btn-gold btn-block">Ver Premium</a>
    </div>
  `;

  // Rectángulo (FxPro) intercalado en el cuerpo, visible solo en móvil (en escritorio manda el skyscraper de la barra).
  if (typeof window.AR4_injectSponsor === 'function') window.AR4_injectSponsor('noticiaBody', { mobileOnly: true });
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
      // Panel propio con los indicadores reales que viajan dentro de la noticia:
      // no depende de ningun widget externo y no puede quedarse sin datos. El
      // widget de TradingView solo queda de respaldo para piezas sin marketData.
      const pintaIndicadores = (sym) => {
        if (!techContainer) return;
        if (n.marketData && window.AR4_renderIndicators && sym === n.symbol) {
          window.AR4_renderIndicators(techContainer, n.marketData);
        } else {
          renderTechnicalAnalysis(techContainer, sym);
        }
      };
      pintaIndicadores(n.symbol);

      if (n.symbol2) {
        chartWrap.querySelectorAll('.idea-chart-tabs button').forEach(btn => {
          btn.addEventListener('click', () => {
            chartWrap.querySelectorAll('.idea-chart-tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNewsChart(chartContainer, btn.dataset.symbol);
            pintaIndicadores(btn.dataset.symbol);
          });
        });
      }
    }
  }

  body.innerHTML = n.body;

  renderReadBar(n);
  renderAiSummary(n);
  renderMarketImpact(n);
  renderTimeline(n);
  renderAiPanel(n);
  renderFaq(n);
  renderMidRelated(n, noticias);
  renderSidebar(n, noticias);
  if (window.AR4_initNoticiaSocial) window.AR4_initNoticiaSocial(n);

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
    // Las noticias nuevas traen varias fuentes verificadas (el generador
    // comprueba que cada URL salga de verdad de la busqueda web antes de
    // publicar). Las antiguas solo tienen sourceUrl/sourceName.
    if (Array.isArray(n.sources) && n.sources.length) {
      const enlaces = n.sources
        .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>`)
        .join(' · ');
      sourceBox.innerHTML = `📎 Fuentes originales de los datos: ${enlaces}. Resumen y análisis redactados por AR4 Mercados.` +
        (n.marketData ? ` Cotizaciones y variaciones medidas sobre datos de mercado de Yahoo Finance.` : '');
    } else if (n.sourceUrl) {
      sourceBox.innerHTML = `📎 Fuente original de los datos: <a href="${n.sourceUrl}" target="_blank" rel="noopener">${n.sourceName}</a>. Resumen y análisis redactados por AR4 Mercados.`;
    }
  }

  if (window.AR4_initComments) window.AR4_initComments('commentsSection', 'noticia', n.slug);

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
