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
          <span>Usuario</span><span>Correo</span><span>Registrado</span><span>Estado</span><span>Premium</span>
        </div>` +
        data.users.map((u) => `
          <div class="admin-row${isRecent(u.created_at, DAY) ? ' admin-row-new' : ''}">
            <span class="admin-name">${esc(u.name || '—')}${isRecent(u.created_at, DAY) ? ' <em class="admin-badge-new">NUEVO</em>' : ''}</span>
            <span class="admin-email">${esc(u.email)}</span>
            <span class="admin-date">${fmtDate(u.created_at)}</span>
            <span>${u.confirmed ? '<span class="admin-ok">✓ Confirmado</span>' : '<span class="admin-pending">Pendiente</span>'}</span>
            <span class="admin-prem">${u.premium
              ? `<span class="admin-ok">★ hasta ${u.premium_until ? fmtDate(u.premium_until).split(' · ')[0] : '∞'}</span> <button class="filter-chip admin-prem-btn" data-uid="${esc(u.id)}" data-act="quitar">Quitar</button>`
              : `<button class="filter-chip admin-prem-btn" data-uid="${esc(u.id)}" data-act="activar" title="Para pagos verificados por Yape/WhatsApp">Activar 31d</button>`}</span>
          </div>`).join('');
      // Activación manual de Premium (pagos por Yape verificados por WhatsApp).
      listEl.querySelectorAll('.admin-prem-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const activar = btn.dataset.act === 'activar';
          const msg = activar
            ? '¿Activar Premium por 31 días a este usuario? Hazlo solo si ya verificaste su pago por Yape en tu WhatsApp.'
            : '¿Quitar el Premium de este usuario?';
          if (!confirm(msg)) return;
          btn.disabled = true;
          try {
            const jwt2 = await netlifyIdentity.currentUser().jwt();
            const r = await fetch('/.netlify/functions/admin-set-premium', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt2 },
              body: JSON.stringify({ userId: btn.dataset.uid, action: btn.dataset.act, dias: 31 })
            });
            const d = await r.json();
            if (!d.success) throw new Error(d.error || 'Error');
            load();
          } catch (e) { alert(String(e.message || e)); btn.disabled = false; }
        });
      });
    }

    if (updatedEl) {
      let extra = grew ? ' · ¡Nuevo registro!' : '';
      if (data.profilesCreated > 0) extra += ' · ' + data.profilesCreated + ' perfil(es) sincronizado(s) con la comunidad';
      updatedEl.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + extra;
    }
    applyUserFilter();
  }

  // Buscador: para encontrar al instante al usuario que pagó por Yape
  // (pega el correo que llegó por WhatsApp y activa su Premium).
  function applyUserFilter() {
    const box = document.getElementById('adminSearch');
    if (!box || !listEl) return;
    const q = box.value.trim().toLowerCase();
    listEl.querySelectorAll('.admin-row:not(.admin-row-head)').forEach((row) => {
      row.style.display = !q || row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  }
  const searchBox = document.getElementById('adminSearch');
  if (searchBox) searchBox.addEventListener('input', applyUserFilter);

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
      const CURSO_LBL = { basico: 'Formación Integral (30 módulos)', institucional: 'Institucional (50 módulos)' };
      const perfiles = data.profiles.slice();
      if (!perfiles.length) {
        diplomasEl.innerHTML = '<p class="footer-text">Aún no hay perfiles de comunidad registrados. Aquí verás el progreso, las notas, el nombre verificado y los diplomas emitidos de cada usuario.</p>';
        return;
      }
      // Orden: primero quienes más avanzaron en el temario NUEVO, luego el resto.
      const avanceDe = (p) => p.progreso ? (p.progreso.freeDone + p.progreso.premDone) : 0;
      perfiles.sort((a, b) => avanceDe(b) - avanceDe(a) || (b.points || 0) - (a.points || 0));
      const totalDiplomas = perfiles.reduce((s, p) => s + Object.keys(p.diplomas || {}).length, 0);
      const enCurso = perfiles.filter((p) => avanceDe(p) > 0).length;
      diplomasEl.innerHTML = `
        <p class="footer-text" style="margin-bottom:12px;">
          <strong style="color:var(--gold-bright);">${perfiles.length}</strong> usuario(s) registrados ·
          <strong style="color:var(--gold-bright);">${enCurso}</strong> avanzando en el temario nuevo ·
          <strong style="color:var(--gold-bright);">${totalDiplomas}</strong> diploma(s) de programa emitidos
        </p>` + perfiles.map((p) => {
        const dips = Object.keys(p.diplomas || {});
        const nuevos = avanceDe(p);
        const antiguos = Math.max(0, (p.modules || []).length - nuevos);
        const prog = p.progreso
          ? `${p.progreso.freeDone}/30 gratis · ${p.progreso.premDone}/20 premium${antiguos ? ` · ${antiguos} del temario anterior (ya no cuentan)` : ''}`
          : `${(p.modules || []).length} módulos`;
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
              </span>`).join('')}</div>` : '<p class="footer-text" style="margin:6px 0 0;">Sin diplomas de programa todavía (se emiten al completar y aprobar el programa entero).</p>'}
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

  // ===== Reel del dia: guion listo para HeyGen + caption para Facebook =====
  async function loadReel() {
    const el = document.getElementById('adminReel');
    if (!el) return;
    try {
      const g = await fetch('data/guion-reel.json?cb=' + Date.now()).then((r) => r.json());
      const bloque = (etiqueta, texto, idb) => `
        <div class="admin-dip-card" style="margin-bottom:10px;">
          <div class="admin-dip-head" style="margin-bottom:6px;"><strong>${etiqueta}</strong>
            <button class="filter-chip reel-copy" data-copy="${idb}">Copiar</button></div>
          <p class="footer-text" id="${idb}" style="margin:0;white-space:pre-wrap;">${esc(texto)}</p>
        </div>`;
      el.innerHTML = `
        <p class="footer-text" style="margin-bottom:10px;">Guion del <strong style="color:var(--gold-bright);">${esc(g.fecha)}</strong> · Gancho: <em>${esc(g.gancho)}</em></p>
        ${bloque('1) Guion para HeyGen (pegar y generar)', g.guion, 'reelGuion')}
        ${bloque('2) Título del post', g.titulo, 'reelTitulo')}
        ${bloque('3) Descripción del Reel', g.caption, 'reelCaption')}
        ${bloque('4) Primer comentario (fijarlo)', g.comentario, 'reelComentario')}`;
      el.querySelectorAll('.reel-copy').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const texto = (document.getElementById(btn.dataset.copy) || {}).textContent || '';
          try { await navigator.clipboard.writeText(texto); btn.textContent = '✔ Copiado'; setTimeout(() => { btn.textContent = 'Copiar'; }, 1500); }
          catch (e) { prompt('Copia el texto:', texto); }
        });
      });
    } catch (e) {
      el.innerHTML = '<p class="footer-text">Aún no hay guion generado. Aparece cada mañana a las 8:00.</p>';
    }
  }
  loadReel();

  // ===== Red de agentes IA: roster + metricas =====
  const agentesEl = document.getElementById('adminAgentes');
  async function loadAgentes() {
    if (!agentesEl) return;
    const user = netlifyIdentity.currentUser();
    if (!user) return;
    try {
      const [rosterRes, configRes, jwt] = await Promise.all([
        fetch('data/agentes.json').then((r) => r.json()),
        fetch('data/agentes-config.json').then((r) => r.json()).catch(() => ({})),
        user.jwt()
      ]);
      const roster = rosterRes.agentes || [];
      const ids = roster.map((x) => x.id);
      const met = await fetch('/.netlify/functions/admin-agentes?ids=' + encodeURIComponent(JSON.stringify(ids)), { headers: { Authorization: 'Bearer ' + jwt } }).then((r) => r.json());
      const counts = (met && met.counts) || {};
      const totalPosts = Object.values(counts).reduce((s2, c) => s2 + (c.posts || 0), 0);
      const totalComments = Object.values(counts).reduce((s2, c) => s2 + (c.comments || 0), 0);
      agentesEl.innerHTML = `
        <p class="footer-text" style="margin-bottom:12px;">
          Sistema: <strong style="color:${configRes.activo ? 'var(--green, #2ecc71)' : '#ff8a8a'};">${configRes.activo ? 'ACTIVO' : 'APAGADO'}</strong> ·
          <strong style="color:var(--gold-bright);">${roster.length}</strong> agentes ·
          <strong style="color:var(--gold-bright);">${totalPosts}</strong> publicaciones ·
          <strong style="color:var(--gold-bright);">${totalComments}</strong> comentarios acumulados
        </p>
        <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">
        ${roster.map((ag) => {
          const c = counts[ag.id] || { posts: 0, comments: 0 };
          return `
          <div class="admin-dip-card" style="margin:0;">
            <div class="admin-dip-head" style="margin-bottom:4px;">
              <strong><a href="perfil.html?u=${encodeURIComponent(ag.username)}" class="perfil-link-name">@${esc(ag.username)}</a></strong>
              <span class="news-meta">${esc(ag.pais)} · peso ${ag.peso}</span>
            </div>
            <p class="footer-text" style="margin:0 0 6px;">${esc(ag.especialidad)} · ${esc(ag.nivel)} · ${esc(ag.experiencia)}</p>
            <p class="footer-text" style="margin:0 0 6px;font-style:italic;">"${esc(ag.bio)}"</p>
            <span class="news-meta">${c.posts} post(s) · ${c.comments} comentario(s)</span>
          </div>`;
        }).join('')}
        </div>`;
    } catch (e) {
      agentesEl.innerHTML = '<p class="footer-text">No se pudieron cargar los agentes: ' + esc(String(e.message || e)) + '</p>';
    }
  }
  const agentesRefreshBtn = document.getElementById('adminAgentesRefresh');
  if (agentesRefreshBtn) agentesRefreshBtn.addEventListener('click', loadAgentes);

  if (diplomasRefreshBtn) diplomasRefreshBtn.addEventListener('click', loadDiplomas);

  if (loginBtn) loginBtn.addEventListener('click', () => netlifyIdentity.open('login'));
  if (refreshBtn) refreshBtn.addEventListener('click', load);

  netlifyIdentity.on('init', () => { load(); startAutoRefresh(); loadDiplomas(); loadAgentes(); });
  netlifyIdentity.on('login', () => { netlifyIdentity.close(); load(); loadDiplomas(); loadAgentes(); });
  netlifyIdentity.on('logout', () => { lastTotal = null; load(); });
})();
