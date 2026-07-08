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
  return `
    <article class="broker-card">
      <span class="news-tag">${a.category}</span>
      <h3 style="margin-top:10px;"><a href="idea.html?slug=${encodeURIComponent(a.slug)}" style="color:inherit;">${a.title}</a></h3>
      <p style="color:var(--text-mid); font-size:0.88rem; margin-bottom:14px;">${a.excerpt}</p>
      <span class="news-meta">${a.author} · ${formatFechaIdea(a.date)}</span>
      <a href="idea.html?slug=${encodeURIComponent(a.slug)}" class="btn btn-outline btn-block" style="margin-top:16px;">Leer análisis</a>
    </article>
  `;
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
    grid.innerHTML = filtered.map(ideaCardHTML).join('') || '<p class="footer-text">No hay análisis en esta categoría todavía.</p>';
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

  document.title = idea.title + ' — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', idea.excerpt);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = idea.title;

  const metaEl = document.getElementById('ideaMeta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="badge-impact medium">${idea.category}</span>
      <h1 style="margin:14px 0 10px;">${idea.title}</h1>
      <span class="news-meta">${idea.author} · ${formatFechaIdea(idea.date)}</span>
    `;
  }

  body.innerHTML = idea.body;

  const relatedGrid = document.getElementById('relatedIdeasGrid');
  if (relatedGrid) {
    const related = ideas.filter(a => a.slug !== slug).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2);
    relatedGrid.innerHTML = related.map(ideaCardHTML).join('');
  }
}

initIdeasListing();
initIdeaDetail();
