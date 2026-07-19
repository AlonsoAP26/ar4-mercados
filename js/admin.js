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
      const [catalog, jwt] = await Promise.all([loadModuleCatalog(), user.jwt()]);
      const res = await fetch('/.netlify/functions/admin-diplomas', { headers: { Authorization: 'Bearer ' + jwt } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || ('Error ' + res.status));
      const withDiplomas = data.profiles.filter((p) => p.modules.length);
      const totalDiplomas = data.profiles.reduce((s, p) => s + p.modules.length, 0);
      if (!withDiplomas.length) {
        diplomasEl.innerHTML = '<p class="footer-text">Todavía nadie ha completado módulos. Cuando lo hagan, sus diplomas aparecerán aquí.</p>';
        return;
      }
      diplomasEl.innerHTML = `
        <p class="footer-text" style="margin-bottom:12px;"><strong style="color:var(--gold-bright);">${totalDiplomas}</strong> diploma(s) emitidos entre <strong>${withDiplomas.length}</strong> usuario(s).</p>
        ${withDiplomas.map((p) => `
          <div class="admin-dip-card">
            <div class="admin-dip-head">
              <strong>@${esc(p.username)}</strong>
              <span class="news-meta">${p.modules.length} diploma(s) · ${p.points} pts · rango ${esc(p.rank || 'básico')}</span>
            </div>
            <div class="admin-dip-chips">
              ${p.modules.map((slug) => {
                const m = catalog[slug];
                const inst = m && m.level === 'institucional';
                return `<span class="admin-dip-chip${inst ? ' admin-dip-inst' : ''}" title="${esc(m ? m.title : slug)}">
                  ${esc(m ? (m.order + '. ' + m.title) : slug)}${inst ? ' · INSTITUCIONAL' : ''}
                  <button class="admin-dip-revoke" data-profile="${p.id}" data-slug="${esc(slug)}" title="Revocar este diploma">✕</button>
                </span>`;
              }).join('')}
            </div>
          </div>`).join('')}
      `;
      diplomasEl.querySelectorAll('.admin-dip-revoke').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Revocar este diploma? El usuario perderá el módulo como completado (los puntos ya otorgados no se descuentan).')) return;
          btn.disabled = true;
          try {
            const jwt2 = await netlifyIdentity.currentUser().jwt();
            const r = await fetch('/.netlify/functions/admin-diplomas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt2 },
              body: JSON.stringify({ action: 'revoke', profileId: btn.dataset.profile, slug: btn.dataset.slug })
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
