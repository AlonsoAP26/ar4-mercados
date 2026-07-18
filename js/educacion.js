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

// Iconos SVG serios (mismo estilo de linea que el menu), en vez de emojis.
const IC_SEED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-4-1-7-4-7-9 4 1 7 4 7 9z"/><path d="M12 21c4-1 7-4 7-9-4 1-7 4-7 9z"/><path d="M12 21V10"/></svg>';
const IC_TREND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>';
const IC_TARGET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>';
const ACADEMY_STAGES = [
  { level: 'basico', icon: IC_SEED, title: 'Primeros pasos' },
  { level: 'intermedio', icon: IC_TREND, title: 'Bases del trading' },
  { level: 'avanzado', icon: IC_TARGET, title: 'Análisis y gestión avanzada' }
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
        <div class="academy-stage-icon">${isComplete ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="color:var(--green)"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>' : stage.icon}</div>
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

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const IC_QUIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>';

function renderModuleQuiz(m) {
  const section = document.getElementById('moduloQuizSection');
  if (!section) return;
  if (!m.quiz || !m.quiz.length) { section.innerHTML = ''; return; }

  // Baraja opciones (y el orden de preguntas) para que no salgan siempre igual.
  // Guardamos cuál opción es la correcta tras barajar, con data-correct.
  const questions = m.quiz.map((item) => ({
    q: item.q,
    options: shuffleArr(item.options.map((text, i) => ({ text, ok: i === item.correct })))
  }));
  const order = shuffleArr(questions.map((_, i) => i));

  function build() {
    const qs = order.map((qIdx, disp) => {
      const item = questions[qIdx];
      return `
        <div class="quiz-q" data-q="${qIdx}">
          <p class="quiz-question"><span class="quiz-qnum">${disp + 1}</span>${item.q}</p>
          <div class="quiz-options quiz-options-col">
            ${item.options.map((opt, oi) => `
              <label class="quiz-option">
                <input type="radio" name="mq_${qIdx}" value="${oi}" data-ok="${opt.ok ? 1 : 0}">
                <span class="quiz-option-dot"></span>
                <span class="quiz-option-label">${opt.text}</span>
              </label>`).join('')}
          </div>
        </div>`;
    }).join('');
    section.innerHTML = `
      <div class="edu-quiz-card">
        <h3 class="edu-quiz-h">${IC_QUIZ} Pon a prueba lo que aprendiste</h3>
        <p class="edu-quiz-sub">${questions.length} preguntas para reforzar — las opciones salen en distinto orden cada vez. No afecta tu progreso.</p>
        <div id="moduloQuizForm">${qs}</div>
        <div class="edu-quiz-actions">
          <button class="btn btn-gold" id="moduloQuizSubmitBtn">Revisar respuestas</button>
          <button class="btn btn-outline" id="moduloQuizRetry" hidden>Volver a intentar</button>
        </div>
        <div id="moduloQuizResult"></div>
      </div>`;
    wire();
  }

  function wire() {
    const formEl = document.getElementById('moduloQuizForm');
    formEl.querySelectorAll('input[type=radio]').forEach((input) => {
      input.addEventListener('change', () => {
        formEl.querySelectorAll(`input[name="${input.name}"]`).forEach((r) => r.closest('.quiz-option').classList.toggle('selected', r.checked));
      });
    });
    document.getElementById('moduloQuizSubmitBtn').addEventListener('click', () => {
      let correct = 0, answered = 0;
      order.forEach((qIdx) => {
        const checked = formEl.querySelector(`input[name="mq_${qIdx}"]:checked`);
        if (checked) answered++;
        formEl.querySelectorAll(`input[name="mq_${qIdx}"]`).forEach((input) => {
          const opt = input.closest('.quiz-option');
          opt.classList.remove('quiz-correct', 'quiz-wrong');
          if (input.dataset.ok === '1') opt.classList.add('quiz-correct');
          else if (input.checked) opt.classList.add('quiz-wrong');
        });
        if (checked && checked.dataset.ok === '1') correct++;
      });
      const resultEl = document.getElementById('moduloQuizResult');
      if (answered < order.length) {
        resultEl.innerHTML = `<div class="community-form-msg" style="margin-top:14px;">Responde todas las preguntas para ver tu resultado.</div>`;
        return;
      }
      const pct = Math.round((correct / order.length) * 100);
      resultEl.innerHTML = `<div class="community-form-msg ${pct === 100 ? 'success' : ''}" style="margin-top:14px;">Acertaste <strong>${correct}/${order.length}</strong>. ${pct === 100 ? '¡Perfecto! Lo tienes claro.' : 'La respuesta correcta está marcada en verde.'}</div>`;
      document.getElementById('moduloQuizSubmitBtn').setAttribute('hidden', '');
      document.getElementById('moduloQuizRetry').removeAttribute('hidden');
    });
    document.getElementById('moduloQuizRetry').addEventListener('click', () => renderModuleQuiz(m));
  }

  build();
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
        <button class="filter-chip" data-version="simple">${IC_SEED} Explicación sencilla</button>
        <button class="filter-chip active" data-version="pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c0 1 2 2.5 5 2.5s5-1.5 5-2.5v-5"/><path d="M21 8v5"/></svg> Explicación profesional</button>
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
