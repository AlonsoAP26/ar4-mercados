// AR4 Mercados — Panel de nuevos registros (solo dueño).
(function () {
  if (typeof netlifyIdentity === 'undefined') return;
  const statusEl = document.getElementById('adminStatus');
  const panelEl = document.getElementById('adminPanel');
  const statsEl = document.getElementById('adminStats');
  const listEl = document.getElementById('adminList');
  const loginBtn = document.getElementById('adminLoginBtn');
  const refreshBtn = document.getElementById('adminRefreshBtn');
  const updatedEl = document.getElementById('adminUpdated');
  if (!statusEl) return;

  let timer = null;
  let lastTotal = null;

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function isRecent(iso, ms) { return iso && (Date.now() - new Date(iso).getTime()) < ms; }

  function showStatus(msg) {
    statusEl.hidden = false;
    statusEl.innerHTML = msg;
    if (panelEl) panelEl.hidden = true;
  }

  async function load() {
    const user = netlifyIdentity.currentUser();
    if (!user) {
      if (loginBtn) loginBtn.hidden = false;
      showStatus('<p class="footer-text">Inicia sesión con la cuenta de administrador para ver los registros.</p>');
      return;
    }
    if (loginBtn) loginBtn.hidden = true;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/admin-users', { headers: { Authorization: 'Bearer ' + jwt } });
      const data = await res.json();
      if (res.status === 403) { showStatus('<p class="footer-text">Esta sección es solo para el dueño del sitio.</p>'); return; }
      if (!res.ok || !data.success) throw new Error(data.error || ('Error ' + res.status));
      render(data);
    } catch (e) {
      showStatus('<p class="footer-text">No se pudo cargar la lista de registros: ' + esc(String(e.message || e)) + '</p>');
    }
  }

  function render(data) {
    statusEl.hidden = true;
    if (panelEl) panelEl.hidden = false;

    const grew = lastTotal !== null && data.total > lastTotal;
    lastTotal = data.total;

    statsEl.innerHTML = [
      { label: 'Registrados en total', value: data.total, cls: 'gold' },
      { label: 'Hoy', value: data.today, cls: data.today > 0 ? 'green' : '' },
      { label: 'Últimos 7 días', value: data.week, cls: '' },
      { label: 'Con email confirmado', value: data.confirmed, cls: '' }
    ].map((s) => `<div class="admin-stat"><span>${s.label}</span><strong class="${s.cls}">${s.value}</strong></div>`).join('');

    if (!data.users.length) {
      listEl.innerHTML = '<p class="footer-text" style="padding:16px;">Todavía no hay usuarios registrados.</p>';
    } else {
      const DAY = 86400000;
      listEl.innerHTML = `
        <div class="admin-row admin-row-head">
          <span>Usuario</span><span>Correo</span><span>Registrado</span><span>Estado</span>
        </div>` +
        data.users.map((u) => `
          <div class="admin-row${isRecent(u.created_at, DAY) ? ' admin-row-new' : ''}">
            <span class="admin-name">${esc(u.name || '—')}${isRecent(u.created_at, DAY) ? ' <em class="admin-badge-new">NUEVO</em>' : ''}</span>
            <span class="admin-email">${esc(u.email)}</span>
            <span class="admin-date">${fmtDate(u.created_at)}</span>
            <span>${u.confirmed ? '<span class="admin-ok">✓ Confirmado</span>' : '<span class="admin-pending">Pendiente</span>'}</span>
          </div>`).join('');
    }

    if (updatedEl) {
      let extra = grew ? ' · ¡Nuevo registro!' : '';
      if (data.profilesCreated > 0) extra += ' · ' + data.profilesCreated + ' perfil(es) sincronizado(s) con la comunidad';
      updatedEl.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + extra;
    }
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) load(); }, 25000);
  }

  // ===== Panel de diplomas (ver por usuario y revocar si fue un error) =====
  const diplomasEl = document.getElementById('adminDiplomas');
  const diplomasRefreshBtn = document.getElementById('adminDiplomasRefresh');
  let moduleCatalog = null;

  async function loadModuleCatalog() {
    if (moduleCatalog) return moduleCatalog;
    const [a, b] = await Promise.all([
      fetch('data/educacion.json').then((r) => r.json()).catch(() => []),
      fetch('data/educacion-premium.json').then((r) => r.json()).catch(() => [])
    ]);
    moduleCatalog = {};
    [...(a || []), ...(b || [])].forEach((m) => { moduleCatalog[m.slug] = m; });
    return moduleCatalog;
  }

  async function loadDiplomas() {
    if (!diplomasEl) return;
    const user = netlifyIdentity.currentUser();
    if (!user) return;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/admin-diplomas', { headers: { Authorization: 'Bearer ' + jwt } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || ('Error ' + res.status));
      const activos = data.profiles.filter((p) => p.modules.length || (p.diplomas && Object.keys(p.diplomas).length));
      const CURSO_LBL = { basico: 'Formación Integral (30 módulos)', institucional: 'Institucional (50 módulos)' };
      if (!activos.length) {
        diplomasEl.innerHTML = '<p class="footer-text">Todavía nadie ha avanzado en los programas. Aquí verás el progreso, las notas, el nombre verificado y los diplomas emitidos de cada usuario.</p>';
        return;
      }
      diplomasEl.innerHTML = activos.map((p) => {
        const dips = Object.keys(p.diplomas || {});
        const prog = p.progreso ? `${p.progreso.freeDone}/30 gratis · ${p.progreso.premDone}/20 premium` : `${p.modules.length} módulos`;
        return `
          <div class="admin-dip-card">
            <div class="admin-dip-head">
              <strong>@${esc(p.username)}</strong>
              <span class="news-meta">${p.nombre ? 'Nombre verificado: ' + esc(p.nombre) : 'Sin nombre verificado aún'} · ${prog} · promedio ${p.promedioBasico != null ? p.promedioBasico + '/100' : '—'} · ${p.points} pts</span>
            </div>
            ${dips.length ? `<div class="admin-dip-chips">${dips.map((c) => `
              <span class="admin-dip-chip${c === 'institucional' ? ' admin-dip-inst' : ''}">
                DIPLOMA ${esc(CURSO_LBL[c] || c)} · ${esc((p.diplomas[c] || {}).cert || '')} · nota ${esc(String((p.diplomas[c] || {}).nota != null ? (p.diplomas[c] || {}).nota : '—'))}
                <button class="admin-dip-revoke" data-userid="${esc(p.userId || '')}" data-curso="${esc(c)}" title="Revocar este diploma">✕</button>
              </span>`).join('')}</div>` : '<p class="footer-text" style="margin:6px 0 0;">Sin diplomas de programa todavía (se emiten al aprobar el programa completo).</p>'}
            ${p.nombre && p.userId ? `<button class="filter-chip admin-name-reset" data-userid="${esc(p.userId)}" style="margin-top:8px;">Permitir corregir nombre</button>` : ''}
          </div>`;
      }).join('');
      diplomasEl.querySelectorAll('.admin-dip-revoke').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Revocar este diploma emitido? El usuario tendrá que reclamarlo de nuevo (solo podrá si sigue cumpliendo los requisitos).')) return;
          btn.disabled = true;
          try {
            const jwt2 = await netlifyIdentity.currentUser().jwt();
            const r = await fetch('/.netlify/functions/admin-diplomas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt2 },
              body: JSON.stringify({ action: 'revoke-diploma', userId: btn.dataset.userid, curso: btn.dataset.curso })
            });
            const d = await r.json();
            if (!d.success) throw new Error(d.error || 'Error');
            loadDiplomas();
          } catch (e) { alert(String(e.message || e)); btn.disabled = false; }
        });
      });
      diplomasEl.querySelectorAll('.admin-name-reset').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Borrar el nombre verificado de este usuario para que pueda escribirlo de nuevo? Úsalo solo si el nombre es falso o tiene un error real.')) return;
          btn.disabled = true;
          try {
            const jwt2 = await netlifyIdentity.currentUser().jwt();
            const r = await fetch('/.netlify/functions/admin-diplomas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt2 },
              body: JSON.stringify({ action: 'reset-name', userId: btn.dataset.userid })
            });
            const d = await r.json();
            if (!d.success) throw new Error(d.error || 'Error');
            loadDiplomas();
          } catch (e) { alert(String(e.message || e)); btn.disabled = false; }
        });
      });
    } catch (e) {
      diplomasEl.innerHTML = '<p class="footer-text">No se pudieron cargar los diplomas: ' + esc(String(e.message || e)) + '</p>';
    }
  }

  if (diplomasRefreshBtn) diplomasRefreshBtn.addEventListener('click', loadDiplomas);

  if (loginBtn) loginBtn.addEventListener('click', () => netlifyIdentity.open('login'));
  if (refreshBtn) refreshBtn.addEventListener('click', load);

  netlifyIdentity.on('init', () => { load(); startAutoRefresh(); loadDiplomas(); });
  netlifyIdentity.on('login', () => { netlifyIdentity.close(); load(); loadDiplomas(); });
  netlifyIdentity.on('logout', () => { lastTotal = null; load(); });
})();
