const LEVEL_LABELS = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
const LEVEL_BADGE_CLASS = { basico: 'low', intermedio: 'medium', avanzado: 'high' };

const QUIZ_QUESTIONS = [
  { q: '¿Alguna vez has operado en un mercado financiero (real o demo)?', options: [['Nunca', 0], ['Algunas veces', 1], ['Regularmente', 2]] },
  { q: '¿Sabes leer una vela japonesa (apertura, cierre, máximo, mínimo)?', options: [['No', 0], ['Más o menos', 1], ['Sí, la leo bien', 2]] },
  { q: '¿Conoces qué es el soporte y la resistencia?', options: [['No', 0], ['Algo', 1], ['Sí', 2]] },
  { q: '¿Usas indicadores técnicos como RSI o medias móviles?', options: [['No', 0], ['A veces', 1], ['Sí, regularmente', 2]] },
  { q: '¿Sabes calcular el tamaño de una posición según tu riesgo?', options: [['No', 0], ['Más o menos', 1], ['Sí', 2]] }
];

async function loadModules() {
  const res = await fetch('data/educacion.json');
  if (!res.ok) throw new Error('No se pudieron cargar los módulos');
  return res.json();
}

async function getMyCompletedModules() {
  if (typeof netlifyIdentity === 'undefined') return new Set();
  const user = netlifyIdentity.currentUser();
  if (!user) return new Set();
  try {
    const jwt = await user.jwt();
    const res = await fetch('/.netlify/functions/community-profile', { headers: { 'Authorization': 'Bearer ' + jwt } });
    const data = await res.json();
    if (data.success && data.profile) return new Set(data.profile.completed_modules || []);
  } catch (e) { /* sesión sin perfil de comunidad todavía, o error de red */ }
  return new Set();
}

function moduleCardHTML(m, completedSet) {
  const isDone = completedSet && completedSet.has(m.slug);
  return `
    <article class="broker-card" data-level="${m.level}">
      <span class="badge-impact ${LEVEL_BADGE_CLASS[m.level]}">${LEVEL_LABELS[m.level]}</span>
      ${isDone ? '<span class="badge-live" style="margin-left:6px;">COMPLETADO</span>' : ''}
      <h3 style="margin-top:10px;"><a href="modulo.html?slug=${encodeURIComponent(m.slug)}" style="color:inherit;">${m.order}. ${m.title}</a></h3>
      <p style="color:var(--text-mid); font-size:0.88rem; margin-bottom:14px;">${m.excerpt}</p>
      <span class="news-meta">+${m.points} pts al completar</span>
      <a href="modulo.html?slug=${encodeURIComponent(m.slug)}" class="btn btn-outline btn-block" style="margin-top:16px;">${isDone ? 'Repasar módulo' : 'Empezar módulo'}</a>
    </article>
  `;
}

function renderQuizForm() {
  const el = document.getElementById('quizForm');
  if (!el) return;
  el.innerHTML = QUIZ_QUESTIONS.map((item, qi) => `
    <div style="margin-bottom:16px;">
      <label style="display:block;margin-bottom:8px;font-size:0.9rem;color:var(--text-hi);">${qi + 1}. ${item.q}</label>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        ${item.options.map(([label, val], oi) => `
          <label style="display:flex;align-items:center;gap:6px;font-weight:400;font-size:0.85rem;color:var(--text-mid);cursor:pointer;">
            <input type="radio" name="quiz_${qi}" value="${val}" ${oi === 0 ? 'checked' : ''}> ${label}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function wireQuiz(modules) {
  const btn = document.getElementById('quizSubmitBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((_, qi) => {
      const checked = document.querySelector(`input[name="quiz_${qi}"]:checked`);
      score += checked ? parseInt(checked.value, 10) : 0;
    });
    let level = 'basico';
    if (score >= 8) level = 'avanzado';
    else if (score >= 4) level = 'intermedio';
    const target = modules.filter((m) => m.level === level).sort((a, b) => a.order - b.order)[0];
    const resultEl = document.getElementById('quizResult');
    if (resultEl && target) {
      resultEl.innerHTML = `
        <div class="community-form-msg success" style="margin-top:14px;">Con ${score}/10 puntos, te recomendamos empezar en nivel <strong>${LEVEL_LABELS[level]}</strong> — pero recuerda, puedes leer cualquier módulo cuando quieras.</div>
        <a href="modulo.html?slug=${encodeURIComponent(target.slug)}" class="btn btn-outline" style="margin-top:10px;">Ir a "${target.title}" →</a>
      `;
    }
  });
}

async function initEducacionListing() {
  const grid = document.getElementById('modulesGrid');
  const filterBar = document.getElementById('levelFilterBar');
  if (!grid || !filterBar) return;

  let modules;
  try {
    modules = await loadModules();
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar los módulos. Intenta recargar la página.</p>';
    return;
  }
  modules.sort((a, b) => a.order - b.order);

  renderQuizForm();
  wireQuiz(modules);

  const completed = await getMyCompletedModules();

  function render(filter) {
    const filtered = filter === 'all' ? modules : modules.filter((m) => m.level === filter);
    grid.innerHTML = filtered.map((m) => moduleCardHTML(m, completed)).join('');
  }
  render('all');

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    render(chip.dataset.filter);
  });
}

function wireCompleteButton(m) {
  const banner = document.getElementById('moduloCompleteBanner');
  const btn = document.getElementById('moduloCompleteBtn');
  const textEl = document.getElementById('moduloCompleteText');
  if (!banner || !btn || !textEl) return;
  if (typeof netlifyIdentity === 'undefined') return;

  banner.style.display = 'flex';
  const user = netlifyIdentity.currentUser();

  if (!user) {
    textEl.textContent = 'Inicia sesión para sumar puntos a tu perfil';
    btn.textContent = 'Iniciar sesión';
    btn.addEventListener('click', () => netlifyIdentity.open('login'));
    return;
  }

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/community-complete-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify({ slug: m.slug })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error desconocido');
      if (data.alreadyCompleted) {
        textEl.textContent = 'Ya completaste este módulo anteriormente.';
      } else {
        textEl.textContent = `¡Listo! Ganaste ${data.reward} puntos.`;
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
      }
      btn.textContent = '✔ Completado';
    } catch (e) {
      alert(e.message);
      btn.disabled = false;
    }
  });
}

async function initModuloDetail() {
  const body = document.getElementById('moduloBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let modules;
  try {
    modules = await loadModules();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar el módulo.</p>';
    return;
  }
  modules.sort((a, b) => a.order - b.order);

  const m = modules.find((x) => x.slug === slug);
  if (!m) {
    body.innerHTML = '<p class="footer-text">Módulo no encontrado. <a href="educacion.html">Volver a Educación</a>.</p>';
    return;
  }

  document.title = m.title + ' — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', m.excerpt);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = m.title;

  const metaEl = document.getElementById('moduloMeta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="badge-impact ${LEVEL_BADGE_CLASS[m.level]}">${LEVEL_LABELS[m.level]}</span>
      <h1 style="margin:14px 0 10px;">${m.order}. ${m.title}</h1>
      <span class="news-meta">Módulo ${m.order} de ${modules.length} · +${m.points} pts al completar</span>
    `;
  }

  body.innerHTML = m.body;

  wireCompleteButton(m);

  const nextGrid = document.getElementById('nextModuleGrid');
  if (nextGrid) {
    const next = modules.filter((x) => x.order > m.order).sort((a, b) => a.order - b.order).slice(0, 2);
    const completed = await getMyCompletedModules();
    nextGrid.innerHTML = next.map((x) => moduleCardHTML(x, completed)).join('') || '<p class="footer-text">¡Llegaste al último módulo! Vuelve a la <a href="educacion.html">lista completa</a>.</p>';
  }

  if (window.AR4_initComments) window.AR4_initComments('commentsSection', 'idea', 'modulo-' + m.slug);
}

initEducacionListing();
initModuloDetail();
