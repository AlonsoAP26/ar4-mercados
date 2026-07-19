// AR4 Mercados — Emisión del diploma por PROGRAMA (no por módulo).
// El servidor valida: todos los módulos completados + promedio de notas
// aprobatorio + nombre real confirmado en la cuenta. El diploma queda
// registrado con un ID verificable públicamente en verificar.html.
(function () {
  const stateEl = document.getElementById('diplomaState');
  const wrap = document.getElementById('diplomaWrap');
  if (!stateEl || !wrap) return;

  const CURSO_INFO = {
    basico: {
      titulo: 'Programa de Formación Integral en Trading',
      track: 'Programa completo · 30 módulos · Educación AR4',
      diplomaTitle: 'Diploma de Formación Integral'
    },
    institucional: {
      titulo: 'Programa Avanzado de Operativa Institucional',
      track: 'Programa completo · 50 módulos · Ruta Institucional AR4 Premium',
      diplomaTitle: 'Diploma Institucional'
    }
  };

  function msg(html) { stateEl.innerHTML = `<div class="community-form-msg">${html}</div>`; }

  function askConfirmName(sugerido, onDone) {
    const overlay = document.createElement('div');
    overlay.className = 'diploma-modal-overlay';
    overlay.innerHTML = `
      <div class="diploma-modal">
        <h3>Confirma tu nombre real</h3>
        <p>Escribe tu <strong>nombre y apellidos reales</strong>, tal como figuran en tu documento de identidad. Quedará impreso en tu diploma y <strong>no podrás cambiarlo después</strong> — así evitamos diplomas con nombres falsos. Tu nombre completo <strong>no es público</strong>: los demás usuarios solo ven tu nombre de usuario, y en la verificación pública del certificado aparece parcialmente oculto (solo iniciales).</p>
        <input type="text" id="dpNameInput" maxlength="60" placeholder="Ej. María Fernanda Rodríguez Torres" autocomplete="name">
        <p class="footer-text" id="dpNameErr" style="color:#ff8a8a;min-height:1em;margin:6px 0 0;"></p>
        <div class="diploma-modal-actions">
          <button class="btn btn-gold" id="dpNameOk">Confirmar mi nombre</button>
          <a class="btn btn-outline" href="educacion.html">Cancelar</a>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('#dpNameInput');
    const errEl = overlay.querySelector('#dpNameErr');
    if (sugerido) input.value = sugerido;
    input.focus();
    overlay.querySelector('#dpNameOk').addEventListener('click', async () => {
      const name = input.value.trim();
      if (name.length < 7 || !name.includes(' ') || /\d/.test(name)) {
        errEl.textContent = 'Escribe nombre y apellidos completos, solo letras.';
        return;
      }
      errEl.textContent = '';
      try {
        const jwt = await netlifyIdentity.currentUser().jwt();
        const res = await fetch('/.netlify/functions/diploma-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
          body: JSON.stringify({ action: 'set-name', name })
        });
        const data = await res.json();
        if (!data.success) { errEl.textContent = data.error || 'No se pudo guardar.'; return; }
        overlay.remove();
        onDone(data.nombre);
      } catch (e) { errEl.textContent = 'Error de conexión. Intenta de nuevo.'; }
    });
  }

  function render(curso, dip) {
    const info = CURSO_INFO[curso];
    document.getElementById('dpName').textContent = dip.nombre;
    document.getElementById('dpModule').textContent = info.titulo;
    document.getElementById('dpTrack').textContent = info.track;
    const notaEl = document.getElementById('dpNota');
    if (notaEl) notaEl.textContent = 'Calificación final: ' + dip.nota + ' / 100';
    document.getElementById('dpDate').textContent = new Date(dip.fecha).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('dpId').textContent = dip.cert;
    const verEl = document.getElementById('dpVerify');
    if (verEl) verEl.textContent = 'ar4mercados.com/verificar.html?cert=' + dip.cert;
    document.title = info.diplomaTitle + ' — AR4 Mercados';
    const titleEl = document.querySelector('.diploma-title');
    if (titleEl) titleEl.textContent = info.diplomaTitle;
    if (curso === 'institucional') document.getElementById('diplomaCard').classList.add('diploma-inst');
    stateEl.innerHTML = '';
    wrap.hidden = false;
    const shareBtn = document.getElementById('dpShareBtn');
    if (shareBtn) shareBtn.addEventListener('click', async () => {
      const url = 'https://ar4mercados.com/verificar.html?cert=' + dip.cert;
      try { await navigator.clipboard.writeText(url); shareBtn.textContent = '✔ Enlace copiado'; setTimeout(() => { shareBtn.textContent = 'Copiar enlace de verificación'; }, 1800); }
      catch (e) { prompt('Copia el enlace de verificación:', url); }
    });
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const legacySlug = params.get('slug');
    let curso = params.get('curso');

    if (legacySlug && !curso) {
      msg('Los diplomas ahora se otorgan al <strong>completar y aprobar el programa completo</strong> (30 módulos gratuitos, o los 50 de la ruta institucional), no por módulo suelto — así tienen validez real y verificación pública. Revisa tu avance en la <a href="educacion.html#diplomaRuta">Ruta del Diploma</a>.');
      return;
    }
    if (curso !== 'institucional') curso = 'basico';

    if (typeof netlifyIdentity === 'undefined' || !netlifyIdentity.currentUser()) {
      msg('Inicia sesión para emitir tu diploma. <a href="educacion.html">Volver a Educación</a>');
      if (typeof netlifyIdentity !== 'undefined') netlifyIdentity.open('login');
      return;
    }
    const user = netlifyIdentity.currentUser();
    msg('Verificando tu programa: módulos completados y promedio de notas...');

    let status;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/diploma-status', { headers: { Authorization: 'Bearer ' + jwt } });
      status = await res.json();
      if (!status.success) throw new Error(status.error || 'Error');
    } catch (e) {
      msg('No pudimos verificar tu progreso. Revisa tu conexión e intenta de nuevo.');
      return;
    }

    // ¿Ya emitido? Se re-muestra siempre igual.
    if (status.diplomas && status.diplomas[curso]) { render(curso, status.diplomas[curso]); return; }

    if (!status.elegible[curso]) {
      const p = status.progreso, n = status.notas;
      const falta = [];
      if (curso === 'basico') {
        if (p.freeDone < p.freeTotal) falta.push(`completar los 30 módulos (llevas ${p.freeDone}/${p.freeTotal})`);
        if (n.registradasFree < p.freeTotal) falta.push(`registrar la nota del cuestionario en los 30 módulos (llevas ${n.registradasFree}/${p.freeTotal})`);
        if (n.promedioBasico != null && n.promedioBasico < status.aprobadoMin) falta.push(`subir tu promedio a ${status.aprobadoMin}/100 (tienes ${n.promedioBasico})`);
      } else {
        if (p.freeDone < p.freeTotal || p.premDone < p.premTotal) falta.push(`completar los 50 módulos (llevas ${p.freeDone + p.premDone}/50)`);
        if (n.registradasAll < 50) falta.push(`registrar la nota en los 50 cuestionarios (llevas ${n.registradasAll}/50)`);
        if (n.promedioInstitucional != null && n.promedioInstitucional < status.aprobadoMin) falta.push(`subir tu promedio a ${status.aprobadoMin}/100 (tienes ${n.promedioInstitucional})`);
      }
      msg(`Aún no puedes emitir este diploma. Te falta: <strong>${falta.join('; ')}</strong>. <a href="educacion.html#diplomaRuta">Ver mi Ruta del Diploma →</a>`);
      return;
    }

    async function claim() {
      msg('Emitiendo tu diploma...');
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/diploma-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
          body: JSON.stringify({ action: 'claim', curso })
        });
        const data = await res.json();
        if (!data.success) {
          if (data.needName) { askConfirmName(status.nombreSugerido, claim); return; }
          throw new Error(data.error || 'Error');
        }
        render(curso, data.diploma);
      } catch (e) { msg('No se pudo emitir el diploma: ' + (e.message || e)); }
    }

    if (!status.nombre) askConfirmName(status.nombreSugerido, claim);
    else claim();

    const printBtn = document.getElementById('dpPrintBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());
  }

  if (typeof netlifyIdentity !== 'undefined') {
    netlifyIdentity.on('init', init);
    netlifyIdentity.init();
  } else {
    init();
  }
})();
