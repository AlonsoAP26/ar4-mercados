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
    <div class="quiz-q">
      <p class="quiz-question"><span class="quiz-qnum">${qi + 1}</span>${item.q}</p>
      <div class="quiz-options">
        ${item.options.map(([label, val], oi) => `
          <label class="quiz-option${oi === 0 ? ' selected' : ''}">
            <input type="radio" name="quiz_${qi}" value="${val}" ${oi === 0 ? 'checked' : ''}>
            <span class="quiz-option-dot"></span>
            <span class="quiz-option-label">${label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  // Resalta la opcion elegida (las tarjetas se ven como seleccionables).
  el.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener('change', () => {
      el.querySelectorAll(`input[name="${input.name}"]`).forEach((r) => {
        r.closest('.quiz-option').classList.toggle('selected', r.checked);
      });
    });
  });
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

const ACADEMY_STAGES = [
  { level: 'basico', icon: '🌱', title: 'Primeros pasos' },
  { level: 'intermedio', icon: '📈', title: 'Bases del trading' },
  { level: 'avanzado', icon: '🧠', title: 'Análisis y gestión avanzada' }
];

function renderAcademyPath(modules, completedSet) {
  const wrap = document.getElementById('academyPath');
  if (!wrap) return;

  wrap.innerHTML = ACADEMY_STAGES.map((stage, i) => {
    const stageModules = modules.filter((m) => m.level === stage.level);
    const doneCount = stageModules.filter((m) => completedSet.has(m.slug)).length;
    const pct = stageModules.length ? Math.round((doneCount / stageModules.length) * 100) : 0;
    const isComplete = stageModules.length > 0 && doneCount === stageModules.length;
    return `
      <div class="academy-stage${isComplete ? ' complete' : ''}" data-filter="${stage.level}">
        <div class="academy-stage-icon">${isComplete ? '✅' : stage.icon}</div>
        <div class="academy-stage-info">
          <strong>${stage.title}</strong>
          <span>${doneCount}/${stageModules.length} módulos completados</span>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        </div>
      </div>
      ${i < ACADEMY_STAGES.length - 1 ? '<div class="academy-path-line"></div>' : ''}
    `;
  }).join('');

  wrap.querySelectorAll('.academy-stage').forEach((el) => {
    el.addEventListener('click', () => {
      const chip = document.querySelector(`.filter-chip[data-filter="${el.dataset.filter}"]`);
      if (chip) chip.click();
      const grid = document.getElementById('modulesGrid');
      if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
  renderAcademyPath(modules, completed);

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

function renderModuleQuiz(m) {
  const section = document.getElementById('moduloQuizSection');
  if (!section) return;
  if (!m.quiz || !m.quiz.length) { section.innerHTML = ''; return; }

  section.innerHTML = `
    <div class="community-form" style="margin-top:28px;">
      <h3 style="margin-bottom:4px;">🧩 Pon a prueba lo que aprendiste</h3>
      <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">${m.quiz.length} preguntas rápidas, solo para reforzar — no afecta tu progreso si te equivocas.</p>
      <div id="moduloQuizForm"></div>
      <button class="btn btn-gold" id="moduloQuizSubmitBtn" style="margin-top:14px;">Revisar respuestas</button>
      <div id="moduloQuizResult"></div>
    </div>
  `;

  const formEl = document.getElementById('moduloQuizForm');
  formEl.innerHTML = m.quiz.map((item, qi) => `
    <div style="margin-bottom:16px;">
      <label class="quiz-question">${qi + 1}. ${item.q}</label>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${item.options.map((opt, oi) => `
          <label class="quiz-option">
            <input type="radio" name="moduloquiz_${qi}" value="${oi}"> ${opt}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  document.getElementById('moduloQuizSubmitBtn').addEventListener('click', () => {
    let correctCount = 0;
    m.quiz.forEach((item, qi) => {
      const checked = document.querySelector(`input[name="moduloquiz_${qi}"]:checked`);
      if (checked && parseInt(checked.value, 10) === item.correct) correctCount++;
      formEl.querySelectorAll(`input[name="moduloquiz_${qi}"]`).forEach((input) => {
        const label = input.closest('label');
        const val = parseInt(input.value, 10);
        label.style.color = '';
        if (val === item.correct) label.style.color = 'var(--green)';
        else if (input.checked) label.style.color = 'var(--crimson-bright)';
      });
    });
    const resultEl = document.getElementById('moduloQuizResult');
    const pct = Math.round((correctCount / m.quiz.length) * 100);
    resultEl.innerHTML = `<div class="community-form-msg ${pct === 100 ? 'success' : ''}" style="margin-top:14px;">Acertaste ${correctCount}/${m.quiz.length}. ${pct === 100 ? '¡Perfecto!' : 'Revisa en verde la respuesta correcta.'}</div>`;
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

  const toggleEl = document.getElementById('moduloExplainToggle');
  if (toggleEl && m.bodySimple) {
    toggleEl.innerHTML = `
      <div class="filter-bar" style="margin-bottom:18px;">
        <button class="filter-chip" data-version="simple">🌱 Explicación sencilla</button>
        <button class="filter-chip active" data-version="pro">🎓 Explicación profesional</button>
      </div>
    `;
    toggleEl.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        toggleEl.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        body.innerHTML = chip.dataset.version === 'simple' ? m.bodySimple : m.body;
      });
    });
  } else if (toggleEl) {
    toggleEl.innerHTML = '';
  }

  body.innerHTML = m.body;

  // Tareas interactivas sobre graficos reales (motor propio en module-tasks.js).
  const tasksEl = document.getElementById('moduloTasks');
  if (tasksEl && window.AR4_renderModuleTasks) window.AR4_renderModuleTasks(tasksEl, m.slug);

  renderModuleQuiz(m);

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
