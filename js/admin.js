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
      updatedEl.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) +
        (grew ? ' · ¡Nuevo registro! 🎉' : '');
    }
  }

  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) load(); }, 25000);
  }

  if (loginBtn) loginBtn.addEventListener('click', () => netlifyIdentity.open('login'));
  if (refreshBtn) refreshBtn.addEventListener('click', load);

  netlifyIdentity.on('init', () => { load(); startAutoRefresh(); });
  netlifyIdentity.on('login', () => { netlifyIdentity.close(); load(); });
  netlifyIdentity.on('logout', () => { lastTotal = null; load(); });
})();
