const LEVEL_LABELS = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', institucional: 'Institucional · Premium' };
const LEVEL_BADGE_CLASS = { basico: 'low', intermedio: 'medium', avanzado: 'high', institucional: 'high' };

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

// Ruta institucional (Premium): 20 módulos aparte, con su propio orden 1-20.
async function loadPremiumModules() {
  try {
    const res = await fetch('data/educacion-premium.json');
    if (!res.ok) return [];
    return await res.json();
  } catch (e) { return []; }
}

// ===== Diplomas =====
// Al completar cualquier módulo (gratis o Premium) el alumno puede emitir su
// diploma. Pide una sola vez el nombre real (se guarda localmente, nunca en la URL).
function getDiplomaName() {
  try { return localStorage.getItem('ar4DiplomaName') || ''; } catch (e) { return ''; }
}
function askDiplomaName(cb) {
  const existing = getDiplomaName();
  if (existing) { cb(existing); return; }
  const overlay = document.createElement('div');
  overlay.className = 'diploma-modal-overlay';
  overlay.innerHTML = `
    <div class="diploma-modal">
      <h3>Tu nombre para el diploma</h3>
      <p>Escribe tu <strong>nombre y apellidos reales</strong>, tal como quieres que aparezcan impresos en el diploma. Solo se guarda en tu dispositivo.</p>
      <input type="text" id="diplomaNameInput" maxlength="60" placeholder="Ej. María Fernanda Rodríguez Torres" autocomplete="name">
      <div class="diploma-modal-actions">
        <button class="btn btn-gold" id="diplomaNameOk">Generar mi diploma</button>
        <button class="btn btn-outline" id="diplomaNameCancel">Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#diplomaNameInput');
  input.focus();
  overlay.querySelector('#diplomaNameCancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#diplomaNameOk').addEventListener('click', () => {
    const name = input.value.trim();
    if (name.length < 5 || !name.includes(' ')) {
      input.style.borderColor = '#ff8a8a';
      input.placeholder = 'Escribe nombre y apellido completos';
      return;
    }
    try { localStorage.setItem('ar4DiplomaName', name); } catch (e) {}
    overlay.remove();
    cb(name);
  });
}
function openDiploma(slug) {
  askDiplomaName(() => { window.location.href = 'diploma.html?slug=' + encodeURIComponent(slug); });
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

const IC_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

// Portada contextual del módulo: arte SVG propio (velas, libro de órdenes, perfil
// de volumen...) elegido según el tema, con el tinte del nivel. Sin fotos externas.
const COVER_MOTIFS = [
  'M40 150 L110 90 L170 120 L250 50 L330 85 L410 30 L480 60',                                     // linea de tendencia
  'M60 140 v-60 h14 v60 z M100 150 v-90 h14 v90 z M140 130 v-50 h14 v50 z M180 155 v-100 h14 v100 z M220 120 v-40 h14 v40 z M260 145 v-80 h14 v80 z M300 110 v-30 h14 v30 z M340 150 v-95 h14 v95 z M380 125 v-45 h14 v45 z M420 148 v-75 h14 v75 z', // velas/barras
  'M60 60 h120 M60 85 h90 M60 110 h150 M60 135 h70 M340 60 h120 M370 85 h90 M310 110 h150 M390 135 h70', // libro de ordenes
  'M70 160 h60 v-18 h-60 z M70 138 h95 v-18 h-95 z M70 116 h150 v-18 h-150 z M70 94 h110 v-18 h-110 z M70 72 h75 v-18 h-75 z', // perfil de volumen
  'M60 130 C140 40 220 40 260 100 C300 160 380 160 460 70',                                        // curva/flujo
  'M100 60 L180 60 L180 120 L100 120 Z M240 90 L460 90 M240 60 L400 60 M240 120 L430 120',        // bloque + niveles
  'M260 40 a60 60 0 1 1 -1 0 M260 70 a30 30 0 1 1 -1 0',                                          // diana/objetivo
  'M80 140 Q130 60 180 140 T280 140 T380 140 T480 140'                                            // ondas de sesion
];
const LEVEL_TINT = { basico: '#8fb0d9', intermedio: '#c9a94a', avanzado: '#d4af37', institucional: '#f0c75e' };
function slugHash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function moduleCoverHTML(m) {
  const tint = LEVEL_TINT[m.level] || '#d4af37';
  const motif = COVER_MOTIFS[slugHash(m.slug) % COVER_MOTIFS.length];
  const inst = m.level === 'institucional';
  return `
    <div class="mod-cover${inst ? ' mod-cover-inst' : ''}">
      <svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="mcGlow" cx="0.85" cy="0.1" r="1"><stop offset="0" stop-color="${tint}" stop-opacity="0.30"/><stop offset="0.7" stop-color="${tint}" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="520" height="200" fill="#0c1322"/>
        <rect width="520" height="200" fill="url(#mcGlow)"/>
        <g stroke="${tint}" stroke-opacity="0.09"><path d="M0 50H520M0 100H520M0 150H520M130 0V200M260 0V200M390 0V200"/></g>
        <path d="${motif}" fill="none" stroke="${tint}" stroke-opacity="0.6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="488" y="182" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="64" font-weight="700" fill="${tint}" fill-opacity="0.16">${String(m.order).padStart(2, '0')}</text>
        <text x="32" y="180" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="3" fill="${tint}" fill-opacity="0.8">${inst ? 'RUTA INSTITUCIONAL · AR4 PREMIUM' : 'ACADEMIA AR4 · ' + (LEVEL_LABELS[m.level] || '').toUpperCase()}</text>
        <path d="M0 198 H520" stroke="${tint}" stroke-opacity="0.8" stroke-width="2.5"/>
      </svg>
    </div>`;
}
const IC_DIPLOMA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M12 6.5l1 1.9 2.1.3-1.5 1.5.3 2.1-1.9-1-1.9 1 .3-2.1L8.9 8.7l2.1-.3z"/><path d="M8.5 14.5 7 21l5-2.5L17 21l-1.5-6.5"/></svg>';

function premiumModuleCardHTML(m, completedSet, hasPremium) {
  const isDone = completedSet && completedSet.has(m.slug);
  return `
    <article class="inst-card${isDone ? ' inst-done' : ''}">
      <div class="inst-card-top">
        <span class="inst-num">${String(m.order).padStart(2, '0')}</span>
        ${isDone ? '<span class="inst-tag inst-tag-done">Completado · Diploma disponible</span>' : (hasPremium ? '<span class="inst-tag">Ruta institucional</span>' : `<span class="inst-tag inst-tag-lock">${IC_LOCK} Premium</span>`)}
      </div>
      <h3><a href="modulo.html?slug=${encodeURIComponent(m.slug)}">${m.title}</a></h3>
      <p>${m.excerpt}</p>
      <div class="inst-card-foot">
        <span class="news-meta">+${m.points} pts · diploma al completar</span>
        <a href="modulo.html?slug=${encodeURIComponent(m.slug)}" class="btn ${hasPremium || isDone ? 'btn-gold' : 'btn-outline'}" style="padding:8px 16px;font-size:0.82rem;">${isDone ? 'Repasar' : (hasPremium ? 'Empezar' : 'Ver módulo')}</a>
      </div>
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

  // Ruta institucional Premium (20 módulos) — visible para todos, operable con Premium.
  const instGrid = document.getElementById('instTrackGrid');
  if (instGrid) {
    const [premMods, hasPremium] = await Promise.all([
      loadPremiumModules(),
      window.AR4_checkPremium ? window.AR4_checkPremium() : Promise.resolve(false)
    ]);
    premMods.sort((a, b) => a.order - b.order);
    const doneCount = premMods.filter((m) => completed.has(m.slug)).length;
    const progressEl = document.getElementById('instTrackProgress');
    if (progressEl && hasPremium) {
      progressEl.innerHTML = `<div class="mission-progress-bar" style="max-width:340px;"><div class="mission-progress-fill" style="width:${premMods.length ? Math.round((doneCount / premMods.length) * 100) : 0}%;"></div></div><span style="font-size:0.8rem;color:var(--text-mid);">${doneCount}/${premMods.length} módulos · ${doneCount === premMods.length && premMods.length ? '¡Ruta completa!' : 'cada uno con diploma'}</span>`;
    }
    instGrid.innerHTML = premMods.map((m) => premiumModuleCardHTML(m, completed, hasPremium)).join('');
    const cta = document.getElementById('instTrackCta');
    if (cta && hasPremium) cta.hidden = true;
  }

  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filterBar.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    render(chip.dataset.filter);
  });
}

function wireCompleteButton(m, alreadyDone) {
  const banner = document.getElementById('moduloCompleteBanner');
  const btn = document.getElementById('moduloCompleteBtn');
  const textEl = document.getElementById('moduloCompleteText');
  if (!banner || !btn || !textEl) return;
  if (typeof netlifyIdentity === 'undefined') return;

  banner.style.display = 'flex';
  const user = netlifyIdentity.currentUser();

  // Botón de diploma: aparece cuando el módulo está (o queda) completado.
  function showDiplomaBtn() {
    if (document.getElementById('moduloDiplomaBtn')) return;
    const dbtn = document.createElement('button');
    dbtn.id = 'moduloDiplomaBtn';
    dbtn.className = 'btn btn-gold diploma-btn';
    dbtn.innerHTML = IC_DIPLOMA + ' Obtener mi diploma';
    dbtn.addEventListener('click', () => openDiploma(m.slug));
    btn.insertAdjacentElement('afterend', dbtn);
  }

  if (!user) {
    textEl.textContent = 'Inicia sesión para sumar puntos y obtener tu diploma';
    btn.textContent = 'Iniciar sesión';
    btn.addEventListener('click', () => netlifyIdentity.open('login'));
    return;
  }

  if (alreadyDone) {
    textEl.textContent = 'Módulo completado. Tu diploma te espera.';
    btn.textContent = '✔ Completado';
    btn.disabled = true;
    showDiplomaBtn();
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
        textEl.textContent = 'Ya completaste este módulo anteriormente. Tu diploma te espera.';
      } else {
        textEl.textContent = `¡Listo! Ganaste ${data.reward} puntos. Genera tu diploma con tu nombre.`;
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
      }
      btn.textContent = '✔ Completado';
      showDiplomaBtn();
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

  let modules, premModules;
  try {
    [modules, premModules] = await Promise.all([loadModules(), loadPremiumModules()]);
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar el módulo.</p>';
    return;
  }
  modules.sort((a, b) => a.order - b.order);
  premModules.sort((a, b) => a.order - b.order);

  let m = modules.find((x) => x.slug === slug);
  const isInstitutional = !m && !!premModules.find((x) => x.slug === slug);
  if (isInstitutional) m = premModules.find((x) => x.slug === slug);
  if (!m) {
    body.innerHTML = '<p class="footer-text">Módulo no encontrado. <a href="educacion.html">Volver a Educación</a>.</p>';
    return;
  }

  // Gate de la ruta institucional: el contenido completo requiere Premium activo.
  if (isInstitutional) {
    const hasPremium = window.AR4_checkPremium ? await window.AR4_checkPremium() : false;
    if (!hasPremium) {
      document.title = m.title + ' — AR4 Mercados';
      const bt = document.getElementById('breadcrumbTitle');
      if (bt) bt.textContent = m.title;
      const metaEl2 = document.getElementById('moduloMeta');
      if (metaEl2) {
        metaEl2.innerHTML = `
        <span class="badge-impact high">Ruta institucional · Premium</span>
        <h1 style="margin:14px 0 10px;">${m.order}. ${m.title}</h1>
        <span class="news-meta">Módulo ${m.order} de ${premModules.length} de la ruta institucional</span>`;
        metaEl2.insertAdjacentHTML('beforebegin', moduleCoverHTML(m));
      }
      body.innerHTML = `
        <p style="font-size:1.02rem;color:var(--text-mid);">${m.excerpt}</p>
        <div class="inst-gate">
          <div class="inst-gate-ic">${IC_LOCK}</div>
          <h3>Este módulo es parte de la ruta institucional</h3>
          <p>20 módulos sobre cómo operan las mesas profesionales: microestructura, liquidez, order flow, volume profile, COT, macro, gamma y proceso de desk. Cada módulo completado otorga <strong>diploma con tu nombre</strong> y 30 puntos de comunidad.</p>
          <ul class="inst-gate-list">
            <li>Contenido escrito con criterio profesional, sin promesas de rentabilidad</li>
            <li>Diagramas propios y ejercicios de comprensión en cada módulo</li>
            <li>Se suma a todo lo demás de Premium: Aria sin límites, Copilot, Risk Lab avanzado</li>
          </ul>
          <a href="membresia.html" class="btn btn-gold">Ver AR4 Premium</a>
          <a href="educacion.html" class="btn btn-outline" style="margin-left:8px;">Volver a Educación</a>
        </div>`;
      return;
    }
  }
  // Para módulos institucionales, el flujo de "siguientes" usa su propia lista.
  if (isInstitutional) modules = premModules;

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
      <span class="news-meta">Módulo ${m.order} de ${modules.length} · +${m.points} pts y diploma al completar</span>
    `;
    metaEl.insertAdjacentHTML('beforebegin', moduleCoverHTML(m));
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

  const completed = await getMyCompletedModules();
  wireCompleteButton(m, completed.has(m.slug));

  const nextGrid = document.getElementById('nextModuleGrid');
  if (nextGrid) {
    const next = modules.filter((x) => x.order > m.order).sort((a, b) => a.order - b.order).slice(0, 2);
    nextGrid.innerHTML = next.map((x) => isInstitutional ? premiumModuleCardHTML(x, completed, true) : moduleCardHTML(x, completed)).join('') || (isInstitutional
      ? '<p class="footer-text">¡Completaste el último módulo de la ruta institucional! Revisa tus diplomas desde cada módulo completado.</p>'
      : '<p class="footer-text">¡Llegaste al último módulo! Continúa con la <a href="educacion.html#instTrack">ruta institucional Premium</a>.</p>');
  }

  if (window.AR4_initComments) window.AR4_initComments('commentsSection', 'idea', 'modulo-' + m.slug);
}

initEducacionListing();
initModuloDetail();
