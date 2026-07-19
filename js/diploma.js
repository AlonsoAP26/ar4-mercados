// AR4 Mercados — Emisión del diploma de módulo.
// El diploma solo se emite si el módulo figura como completado en el perfil del
// usuario (verificación real contra el servidor). El nombre nunca viaja en la URL:
// se guarda localmente en el dispositivo del alumno.
(function () {
  const stateEl = document.getElementById('diplomaState');
  const wrap = document.getElementById('diplomaWrap');
  if (!stateEl || !wrap) return;

  const TRACK_LABEL = {
    basico: 'Camino de aprendizaje · Nivel Básico',
    intermedio: 'Camino de aprendizaje · Nivel Intermedio',
    avanzado: 'Camino de aprendizaje · Nivel Avanzado',
    institucional: 'Ruta Institucional · AR4 Premium'
  };

  function msg(html) { stateEl.innerHTML = `<div class="community-form-msg">${html}</div>`; }

  // ID corto y determinista (usuario + módulo): permite re-generar siempre el mismo.
  function certId(userId, slug) {
    const s = userId + '::' + slug;
    let h1 = 0x811c9dc5, h2 = 0x1000193;
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
      h2 = (Math.imul(h2, 31) + s.charCodeAt(i)) >>> 0;
    }
    return ('AR4-' + h1.toString(16).toUpperCase().padStart(8, '0') + '-' + (h2 % 10000).toString().padStart(4, '0'));
  }

  function askName(cb) {
    const overlay = document.createElement('div');
    overlay.className = 'diploma-modal-overlay';
    overlay.innerHTML = `
      <div class="diploma-modal">
        <h3>Tu nombre para el diploma</h3>
        <p>Escribe tu <strong>nombre y apellidos reales</strong>, tal como quieres que aparezcan impresos. Solo se guarda en tu dispositivo.</p>
        <input type="text" id="dpNameInput" maxlength="60" placeholder="Ej. María Fernanda Rodríguez Torres" autocomplete="name">
        <div class="diploma-modal-actions">
          <button class="btn btn-gold" id="dpNameOk">Continuar</button>
          <a class="btn btn-outline" href="educacion.html">Cancelar</a>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#dpNameInput');
    try { input.value = localStorage.getItem('ar4DiplomaName') || ''; } catch (e) {}
    input.focus();
    overlay.querySelector('#dpNameOk').addEventListener('click', () => {
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

  async function init() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    if (!slug) { msg('Falta el módulo. Vuelve a <a href="educacion.html">Educación</a> y genera tu diploma desde un módulo completado.'); return; }

    if (typeof netlifyIdentity === 'undefined' || !netlifyIdentity.currentUser()) {
      msg('Inicia sesión para emitir tu diploma. <a href="educacion.html">Volver a Educación</a>');
      if (typeof netlifyIdentity !== 'undefined') netlifyIdentity.open('login');
      return;
    }
    const user = netlifyIdentity.currentUser();

    msg('Verificando tu módulo completado...');

    // Cargar catálogos y perfil en paralelo.
    let modules = [], premium = [], completed = [];
    try {
      const [r1, r2] = await Promise.all([
        fetch('data/educacion.json'),
        fetch('data/educacion-premium.json')
      ]);
      modules = r1.ok ? await r1.json() : [];
      premium = r2.ok ? await r2.json() : [];
      const jwt = await user.jwt();
      const pres = await fetch('/.netlify/functions/community-profile', { headers: { 'Authorization': 'Bearer ' + jwt } });
      const pdata = await pres.json();
      if (pdata.success && pdata.profile) completed = pdata.profile.completed_modules || [];
    } catch (e) {
      msg('No pudimos verificar tu progreso. Revisa tu conexión e intenta de nuevo.');
      return;
    }

    const m = modules.find((x) => x.slug === slug) || premium.find((x) => x.slug === slug);
    if (!m) { msg('Módulo no encontrado. <a href="educacion.html">Volver a Educación</a>'); return; }

    if (!completed.includes(slug)) {
      msg(`Aún no has completado <strong>${m.title}</strong>. Termina el módulo y márcalo como completado para emitir tu diploma. <a href="modulo.html?slug=${encodeURIComponent(slug)}">Ir al módulo →</a>`);
      return;
    }

    function render(name) {
      document.getElementById('dpName').textContent = name;
      document.getElementById('dpModule').textContent = m.title;
      document.getElementById('dpTrack').textContent = TRACK_LABEL[m.level] || 'Educación AR4';
      document.getElementById('dpDate').textContent = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
      document.getElementById('dpId').textContent = certId(user.id || user.email || 'ar4', slug);
      document.title = 'Diploma: ' + m.title + ' — AR4 Mercados';
      stateEl.innerHTML = '';
      wrap.hidden = false;
    }

    let name = '';
    try { name = localStorage.getItem('ar4DiplomaName') || ''; } catch (e) {}
    if (name) render(name); else askName(render);

    document.getElementById('dpPrintBtn').addEventListener('click', () => window.print());
    document.getElementById('dpRenameBtn').addEventListener('click', () => askName(render));
  }

  if (typeof netlifyIdentity !== 'undefined') {
    netlifyIdentity.on('init', init);
    netlifyIdentity.init();
  } else {
    init();
  }
})();
