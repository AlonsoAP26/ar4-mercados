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

// ===== Diplomas por programa =====
// El diploma ya no se emite por módulo suelto: se otorga al completar TODO el
// programa (30 módulos gratuitos, o los 50 con la ruta institucional) con un
// promedio de notas aprobatorio. Las notas de los cuestionarios se registran
// en el servidor y el nombre impreso es el nombre real verificado de la cuenta.
const APROBADO_MIN = 75;
let quizResultActual = null; // {correct,total} del cuestionario recién rendido

async function fetchDiplomaStatus() {
  if (typeof netlifyIdentity === 'undefined') return null;
  const user = netlifyIdentity.currentUser();
  if (!user) return null;
  try {
    const jwt = await user.jwt();
    const res = await fetch('/.netlify/functions/diploma-status', { headers: { Authorization: 'Bearer ' + jwt } });
    const data = await res.json();
    return data.success ? data : null;
  } catch (e) { return null; }
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


// Tarjeta "Ruta del Diploma": progreso hacia los dos diplomas de programa.
async function renderDiplomaRuta() {
  const anchor = document.getElementById('academyPath');
  if (!anchor || document.getElementById('diplomaRuta')) return;
  const el = document.createElement('div');
  el.id = 'diplomaRuta';
  anchor.insertAdjacentElement('afterend', el);

  const logged = (typeof netlifyIdentity !== 'undefined') && netlifyIdentity.currentUser();
  if (!logged) {
    el.innerHTML = `
      <div class="dr-wrap">
        <div class="dr-head">${IC_DIPLOMA} <h2>Ruta del Diploma</h2></div>
        <p class="dr-sub">Completa los <strong>30 módulos gratuitos</strong> aprobando sus cuestionarios (promedio mínimo ${APROBADO_MIN}/100) y obtén el <strong>Diploma de Formación Integral en Trading</strong>: con tu nombre real, calificación final y <a href="verificar.html">verificación pública</a>. Con la ruta institucional Premium (50 módulos en total) llega el <strong>Diploma Institucional</strong>.</p>
        <button class="btn btn-gold" onclick="typeof netlifyIdentity !== 'undefined' && netlifyIdentity.open('signup')">Crear mi cuenta gratis para empezar</button>
      </div>`;
    return;
  }
  const st = await fetchDiplomaStatus();
  if (!st) return;
  const p = st.progreso, n = st.notas;
  const emitidos = st.diplomas || {};

  function card(curso, titulo, done, total, notas, promedio, elegible, emitido) {
    const pct = Math.round((done / total) * 100);
    let estado, cta;
    if (emitido) { estado = '<span class="dr-tag dr-ok">Emitido ✔</span>'; cta = `<a class="btn btn-gold" href="diploma.html?curso=${curso}">Ver mi diploma</a>`; }
    else if (elegible) { estado = '<span class="dr-tag dr-ok">¡Aprobado! Listo para emitir</span>'; cta = `<a class="btn btn-gold" href="diploma.html?curso=${curso}">Reclamar mi diploma</a>`; }
    else { estado = '<span class="dr-tag">En curso</span>'; cta = ''; }
    return `
      <div class="dr-card${curso === 'institucional' ? ' dr-inst' : ''}">
        <div class="dr-card-head"><strong>${titulo}</strong>${estado}</div>
        <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        <div class="dr-stats">
          <span>${done}/${total} módulos</span>
          <span>${notas}/${total} notas registradas</span>
          <span>Promedio: ${promedio != null ? promedio + '/100' : '—'} · mín. ${st.aprobadoMin}</span>
        </div>
        ${cta ? `<div style="margin-top:10px;">${cta}</div>` : ''}
      </div>`;
  }

  el.innerHTML = `
    <div class="dr-wrap">
      <div class="dr-head">${IC_DIPLOMA} <h2>Ruta del Diploma</h2><span class="news-meta">un diploma por programa completo — con nota final y verificación pública</span></div>
      <div class="dr-grid">
        ${card('basico', 'Diploma de Formación Integral en Trading', p.freeDone, p.freeTotal, n.registradasFree, n.promedioBasico, st.elegible.basico, !!emitidos.basico)}
        ${card('institucional', 'Diploma Institucional (Premium)', p.freeDone + p.premDone, p.freeTotal + p.premTotal, n.registradasAll, n.promedioInstitucional, st.elegible.institucional, !!emitidos.institucional)}
      </div>
      ${st.nombre
        ? `<p class="footer-text" style="margin-top:10px;">Nombre verificado para tus diplomas: <strong style="color:var(--gold-bright);">${st.nombre}</strong></p>`
        : '<p class="footer-text" style="margin-top:10px;">Al reclamar tu primer diploma confirmarás una única vez tu <strong>nombre real</strong> (es el que aparece en la verificación pública del certificado).</p>'}
    </div>`;
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
  renderDiplomaRuta();

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
      progressEl.innerHTML = `<div class="mission-progress-bar" style="max-width:340px;"><div class="mission-progress-fill" style="width:${premMods.length ? Math.round((doneCount / premMods.length) * 100) : 0}%;"></div></div><span style="font-size:0.8rem;color:var(--text-mid);">${doneCount}/${premMods.length} módulos · ${doneCount === premMods.length && premMods.length ? '¡Ruta completa!' : 'rumbo al Diploma Institucional'}</span>`;
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

function wireCompleteButton(m, alreadyDone, notaPrev) {
  const banner = document.getElementById('moduloCompleteBanner');
  const btn = document.getElementById('moduloCompleteBtn');
  const textEl = document.getElementById('moduloCompleteText');
  if (!banner || !btn || !textEl) return;
  if (typeof netlifyIdentity === 'undefined') return;

  banner.style.display = 'flex';
  const user = netlifyIdentity.currentUser();

  function addRutaLink() {
    if (document.getElementById('moduloRutaLink')) return;
    const a = document.createElement('a');
    a.id = 'moduloRutaLink';
    a.className = 'btn btn-outline diploma-btn';
    a.href = 'educacion.html#diplomaRuta';
    a.innerHTML = IC_DIPLOMA + ' Ver mi Ruta del Diploma';
    btn.insertAdjacentElement('afterend', a);
  }

  if (!user) {
    textEl.textContent = 'Inicia sesión para registrar tu nota y tu avance hacia el diploma';
    btn.textContent = 'Iniciar sesión';
    btn.addEventListener('click', () => netlifyIdentity.open('login'));
    return;
  }

  if (alreadyDone) {
    textEl.textContent = notaPrev != null
      ? `Módulo completado · nota registrada: ${notaPrev}/100.`
      : 'Módulo completado. Rinde el cuestionario para registrar tu nota: sin ella no cuenta para el diploma del programa.';
    btn.textContent = '✔ Completado';
    btn.disabled = true;
    addRutaLink();
    return;
  }

  // Sin nota registrada no hay completado: el diploma se calcula con las notas.
  const hasQuiz = m.quiz && m.quiz.length;
  if (hasQuiz && notaPrev == null) {
    btn.disabled = true;
    btn.dataset.waitQuiz = '1';
    textEl.textContent = 'Primero rinde el cuestionario del módulo (más abajo): tu nota cuenta para el diploma del programa.';
  }

  btn.addEventListener('click', async () => {
    if (btn.dataset.waitQuiz) return;
    btn.disabled = true;
    try {
      const jwt = await user.jwt();
      const payload = { slug: m.slug };
      if (quizResultActual) { payload.correct = quizResultActual.correct; payload.total = quizResultActual.total; }
      const res = await fetch('/.netlify/functions/community-complete-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error desconocido');
      if (data.alreadyCompleted) {
        textEl.textContent = 'Ya completaste este módulo anteriormente.';
      } else {
        textEl.textContent = `¡Listo! Ganaste ${data.reward} puntos${typeof data.nota === 'number' ? ` · nota ${data.nota}/100` : ''}. Un módulo más rumbo a tu diploma.`;
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
      }
      btn.textContent = '✔ Completado';
      addRutaLink();
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
        <p class="edu-quiz-sub">${questions.length} preguntas — salen en distinto orden cada vez. Tu resultado se registra como <strong>nota</strong> para el diploma del programa (promedio mínimo ${APROBADO_MIN}/100 para aprobar).</p>
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
      // Registra la nota en el servidor: cuenta para el diploma del programa.
      // Regla del servidor: la primera nota aprobatoria se conserva; mientras
      // sea menor a la mínima, cada nuevo intento la reemplaza (recuperación).
      quizResultActual = { correct, total: order.length };
      const u = (typeof netlifyIdentity !== 'undefined') ? netlifyIdentity.currentUser() : null;
      if (u) {
        u.jwt().then((jwt) => fetch('/.netlify/functions/community-complete-module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
          body: JSON.stringify({ slug: m.slug, correct, total: order.length, scoreOnly: true })
        })).then((r) => r.json()).then((d) => {
          if (!d || !d.success || typeof d.nota !== 'number') return;
          const extra = document.createElement('div');
          extra.className = 'community-form-msg' + (d.aprobada ? ' success' : '');
          extra.style.marginTop = '8px';
          extra.textContent = d.aprobada
            ? `Nota registrada para tu diploma: ${d.nota}/100 (aprobatoria — los reintentos ya no la bajan).`
            : `Nota registrada: ${d.nota}/100. Repasa el módulo y vuelve a rendir el cuestionario para mejorarla.`;
          resultEl.appendChild(extra);
          const cbtn = document.getElementById('moduloCompleteBtn');
          const ctext = document.getElementById('moduloCompleteText');
          if (cbtn && cbtn.dataset.waitQuiz) {
            cbtn.disabled = false; cbtn.dataset.waitQuiz = '';
            if (ctext) ctext.textContent = 'Cuestionario rendido. Marca el módulo como completado para registrar tu avance.';
          }
        }).catch(() => {});
      } else {
        resultEl.insertAdjacentHTML('beforeend', '<div class="community-form-msg" style="margin-top:8px;">Inicia sesión para que tu nota quede registrada y cuente para el diploma.</div>');
      }
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
          <p>20 módulos sobre cómo operan las mesas profesionales: microestructura, liquidez, order flow, volume profile, COT, macro, gamma y proceso de desk. Al completar los 20 módulos con nota aprobatoria obtienes el <strong>Diploma Institucional verificable</strong>, además de 30 puntos de comunidad por módulo.</p>
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
      <span class="news-meta">Módulo ${m.order} de ${modules.length} · +${m.points} pts · tu nota cuenta para el diploma del programa</span>
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

  // Objetivo claro al inicio (para módulos sin bloque de gancho propio):
  // el lector sabe en una frase qué se lleva antes de invertir su tiempo.
  if (m.body.indexOf('edu-hook') === -1) {
    body.insertAdjacentHTML('afterbegin', `
      <div class="edu-objective">
        <span class="edu-objective-lbl">Objetivo del módulo</span>
        <p>${m.excerpt}</p>
      </div>`);
  }

  // Tareas interactivas sobre graficos reales (motor propio en module-tasks.js).
  const tasksEl = document.getElementById('moduloTasks');
  if (tasksEl && window.AR4_renderModuleTasks) window.AR4_renderModuleTasks(tasksEl, m.slug);

  renderModuleQuiz(m);

  const completed = await getMyCompletedModules();
  const dstatus = await fetchDiplomaStatus();
  const notaPrev = dstatus && dstatus.scores && typeof dstatus.scores[m.slug] === 'number' ? dstatus.scores[m.slug] : null;
  wireCompleteButton(m, completed.has(m.slug), notaPrev);

  const nextGrid = document.getElementById('nextModuleGrid');
  if (nextGrid) {
    const next = modules.filter((x) => x.order > m.order).sort((a, b) => a.order - b.order).slice(0, 2);
    nextGrid.innerHTML = next.map((x) => isInstitutional ? premiumModuleCardHTML(x, completed, true) : moduleCardHTML(x, completed)).join('') || (isInstitutional
      ? '<p class="footer-text">¡Completaste el último módulo de la ruta institucional! Si tu promedio es aprobatorio, reclama tu <a href="educacion.html#diplomaRuta">Diploma Institucional</a>.</p>'
      : '<p class="footer-text">¡Llegaste al último módulo! Continúa con la <a href="educacion.html#instTrack">ruta institucional Premium</a>.</p>');
  }

  if (window.AR4_initComments) window.AR4_initComments('commentsSection', 'idea', 'modulo-' + m.slug);
}

initEducacionListing();
initModuloDetail();
