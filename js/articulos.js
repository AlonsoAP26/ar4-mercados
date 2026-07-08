async function loadArticulos() {
  const res = await fetch('data/articulos.json');
  if (!res.ok) throw new Error('No se pudieron cargar los artículos');
  return res.json();
}

function formatFecha(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function articleCardHTML(a) {
  return `
    <article class="broker-card">
      <span class="news-tag">${a.category}</span>
      <h3 style="margin-top:10px;"><a href="articulo.html?slug=${encodeURIComponent(a.slug)}" style="color:inherit;">${a.title}</a></h3>
      <p style="color:var(--text-mid); font-size:0.88rem; margin-bottom:14px;">${a.excerpt}</p>
      <span class="news-meta">${a.author} · ${formatFecha(a.date)}</span>
      <a href="articulo.html?slug=${encodeURIComponent(a.slug)}" class="btn btn-outline btn-block" style="margin-top:16px;">Leer artículo</a>
    </article>
  `;
}

async function initPsicotradingListing() {
  const grid = document.getElementById('articulosGrid');
  const filterBar = document.getElementById('psicoFilterBar');
  if (!grid || !filterBar) return;

  let articulos;
  try {
    articulos = await loadArticulos();
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar los artículos. Intenta recargar la página.</p>';
    return;
  }

  articulos.sort((a, b) => new Date(b.date) - new Date(a.date));

  const categories = ['all', ...new Set(articulos.map(a => a.category))];
  filterBar.innerHTML = categories.map(c =>
    `<button class="filter-chip ${c === 'all' ? 'active' : ''}" data-filter="${c}">${c === 'all' ? 'Todos' : c}</button>`
  ).join('');

  function render(filter) {
    const filtered = filter === 'all' ? articulos : articulos.filter(a => a.category === filter);
    grid.innerHTML = filtered.map(articleCardHTML).join('') || '<p class="footer-text">No hay artículos en esta categoría todavía.</p>';
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

async function initArticleDetail() {
  const body = document.getElementById('articleBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let articulos;
  try {
    articulos = await loadArticulos();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar el artículo.</p>';
    return;
  }

  const articulo = articulos.find(a => a.slug === slug);
  if (!articulo) {
    body.innerHTML = '<p class="footer-text">Artículo no encontrado. <a href="psicotrading.html">Volver a Psicotrading</a>.</p>';
    return;
  }

  document.title = articulo.title + ' — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', articulo.excerpt);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = articulo.title;

  const metaEl = document.getElementById('articleMeta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="badge-impact medium">${articulo.category}</span>
      <h1 style="margin:14px 0 10px;">${articulo.title}</h1>
      <span class="news-meta">${articulo.author} · ${formatFecha(articulo.date)}</span>
    `;
  }

  body.innerHTML = articulo.body;

  const relatedGrid = document.getElementById('relatedGrid');
  if (relatedGrid) {
    const related = articulos.filter(a => a.slug !== slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
    relatedGrid.innerHTML = related.map(articleCardHTML).join('');
  }
}

initPsicotradingListing();
initArticleDetail();
