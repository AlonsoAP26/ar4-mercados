(function () {
  if (typeof netlifyIdentity === 'undefined') return;

  netlifyIdentity.init();

  const authBtn = document.getElementById('authBtn');
  const statusEl = document.getElementById('accountStatus');
  const subscribeBtn = document.getElementById('subscribeBtn');

  function currentUser() {
    return netlifyIdentity.currentUser();
  }

  function escapeHtmlLocal(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  const AV_GRADS = [['#5b7cfa', '#2f4bd6'], ['#12b3c7', '#0b7f8f'], ['#8e5bf2', '#5b2fa8'], ['#f0a921', '#c46a10'], ['#e13a4b', '#a11824'], ['#1a9fd0', '#0d6d92'], ['#2ecc71', '#189a52'], ['#e84393', '#a3246a'], ['#d4af37', '#a07d14'], ['#ff7a59', '#d24d2f'], ['#5c6b7a', '#333d47'], ['#00b894', '#00806a']];
  function avHash(s) { let h = 0; s = String(s || 'x'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function avGrad(u) { const g = AV_GRADS[avHash(u) % AV_GRADS.length]; return 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')'; }
  function avGen(u) { return 'https://api.dicebear.com/9.x/notionists/svg?seed=' + encodeURIComponent(u || 'trader') + '&scale=130&radius=50'; }

  let cachedProfile = null;
  async function fetchCommunityProfile(user) {
    if (cachedProfile !== null) return cachedProfile;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/community-profile', { headers: { 'Authorization': 'Bearer ' + jwt } });
      const data = await res.json();
      cachedProfile = (data.success && data.profile) ? data.profile : false;
    } catch (e) {
      cachedProfile = false;
    }
    return cachedProfile;
  }

  async function isPremiumUser(user) {
    if (!user) return false;
    try {
      await user.jwt(true); // fuerza refresco del token para traer el app_metadata más reciente
    } catch (e) { /* si falla el refresco, usamos lo que ya tenemos */ }
    return !!(user.app_metadata && user.app_metadata.premium);
  }

  window.AR4_checkPremium = async function () {
    return isPremiumUser(currentUser());
  };

  window.AR4_refreshNavProfile = function () {
    cachedProfile = null;
    refreshUI();
  };

  async function refreshUI() {
    const user = currentUser();

    if (authBtn) {
      if (!user) {
        authBtn.textContent = 'Iniciar sesión';
        authBtn.classList.remove('has-avatar');
      } else {
        const profile = await fetchCommunityProfile(user);
        if (profile) {
          const navGrad = avGrad(profile.username);
          const avatarHTML = profile.avatar_url
            ? `<img class="nav-avatar" src="${escapeHtmlLocal(profile.avatar_url)}" alt="">`
            : `<span class="nav-avatar avatar-generated" style="background:${navGrad};"><img src="${avGen(profile.username)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="avatar-fallback" style="background:${navGrad};">${escapeHtmlLocal((profile.username || '?').charAt(0).toUpperCase())}</span></span>`;
          authBtn.innerHTML = avatarHTML + `<span>${escapeHtmlLocal(profile.username)}</span>`;
          authBtn.classList.add('has-avatar');
        } else {
          authBtn.textContent = '👤 ' + (user.email || '').split('@')[0];
          authBtn.classList.remove('has-avatar');
        }
      }
    }

    if (statusEl) {
      if (!user) {
        statusEl.innerHTML = `<div class="promo-banner" style="margin-bottom:28px;"><div class="promo-banner-text"><h3>Inicia sesión para gestionar tu membresía</h3><p>Crea una cuenta gratis para suscribirte o ver el estado de tu plan.</p></div><a href="#" class="btn btn-outline" id="statusLoginBtn">Iniciar sesión / Crear cuenta</a></div>`;
        const btn = document.getElementById('statusLoginBtn');
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); netlifyIdentity.open('signup'); });
      } else {
        const premium = await isPremiumUser(user);
        window.AR4_PREMIUM = premium;
        statusEl.innerHTML = premium
          ? `<div class="promo-banner" style="margin-bottom:28px;border-color:rgba(34,192,122,0.35);"><div class="promo-banner-text"><h3>✅ Ya eres miembro Premium</h3><p>Sesión: ${user.email}</p></div><button class="btn btn-outline" id="logoutBtn">Cerrar sesión</button></div>`
          : `<div class="promo-banner" style="margin-bottom:28px;"><div class="promo-banner-text"><h3>Estás en el plan Gratis</h3><p>Sesión: ${user.email} — suscríbete para desbloquear el contenido Premium.</p></div><button class="btn btn-outline" id="logoutBtn">Cerrar sesión</button></div>`;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => netlifyIdentity.logout());
      }
    } else if (user) {
      window.AR4_PREMIUM = await isPremiumUser(user);
      document.dispatchEvent(new CustomEvent('ar4-access-ready'));
    }
  }

  // ---------- Menú desplegable del perfil (con cerrar sesión) ----------
  function closeProfileMenu() {
    const m = document.getElementById('navProfileMenu');
    if (m) m.remove();
    document.removeEventListener('click', onDocClickForMenu);
  }
  function onDocClickForMenu(e) {
    if (!e.target.closest('#navProfileMenu') && e.target !== authBtn && !authBtn.contains(e.target)) closeProfileMenu();
  }
  async function openProfileMenu(user) {
    if (document.getElementById('navProfileMenu')) { closeProfileMenu(); return; }
    const profile = await fetchCommunityProfile(user);
    const username = profile && profile.username ? profile.username : (user.email || '').split('@')[0];
    const menu = document.createElement('div');
    menu.id = 'navProfileMenu';
    menu.className = 'nav-profile-menu';
    const navGrad2 = avGrad(username);
    const headAvatar = profile && profile.avatar_url
      ? `<img class="nav-pm-avatar" src="${escapeHtmlLocal(profile.avatar_url)}" alt="">`
      : `<span class="nav-pm-avatar avatar-generated" style="background:${navGrad2};"><img src="${avGen(username)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="avatar-fallback" style="background:${navGrad2};">${escapeHtmlLocal(String(username).charAt(0).toUpperCase())}</span></span>`;
    const icCommunity = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 3.5a3 3 0 0 1 0 5.8"/><path d="M18 14a6 6 0 0 1 3 5"/></svg>';
    const icProfile = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
    const icMember = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/></svg>';
    const icLogout = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 17l-5-5 5-5M15 12H5"/></svg>';
    menu.innerHTML = `
      <div class="nav-profile-menu-head">
        ${headAvatar}
        <div class="nav-pm-id"><strong>${escapeHtmlLocal(username)}</strong><span>${escapeHtmlLocal(user.email || '')}</span></div>
      </div>
      <a href="comunidad.html">${icCommunity}<span>Ir a la comunidad</span></a>
      ${profile && profile.username ? `<a href="perfil.html?u=${encodeURIComponent(profile.username)}">${icProfile}<span>Ver mi perfil</span></a>` : ''}
      <a href="membresia.html">${icMember}<span>Mi membresía</span></a>
      <button type="button" id="navLogoutBtn" class="nav-pm-logout">${icLogout}<span>Cerrar sesión</span></button>
    `;
    const rect = authBtn.getBoundingClientRect();
    menu.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    menu.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
    document.body.appendChild(menu);
    document.getElementById('navLogoutBtn').addEventListener('click', () => { closeProfileMenu(); netlifyIdentity.logout(); });
    setTimeout(() => document.addEventListener('click', onDocClickForMenu), 0);
  }

  // ---------- Modal persuasivo antes de registrarse ----------
  function showJoinBenefits() {
    if (document.getElementById('ar4JoinBenefits')) return;
    const overlay = document.createElement('div');
    overlay.id = 'ar4JoinBenefits';
    overlay.className = 'join-benefits-overlay';
    overlay.innerHTML = `
      <div class="join-benefits-card">
        <button class="join-benefits-close" aria-label="Cerrar">✕</button>
        <span class="badge-live" style="background:rgba(212,175,55,0.15);color:var(--gold-bright);border-color:rgba(212,175,55,0.35);">★ ÚNETE GRATIS</span>
        <h3>Crea tu cuenta y desbloquea todo AR4</h3>
        <p class="join-benefits-sub">Es gratis, sin tarjeta y en menos de un minuto. Al registrarte obtienes:</p>
        <ul class="join-benefits-list">
          <li><span>💬</span> Publicar en la comunidad y chatear en las salas de mercado en vivo</li>
          <li><span>📊</span> Guardar tus análisis, ideas y brokers favoritos</li>
          <li><span>🏆</span> Ganar puntos, subir de rango y desbloquear avatares exclusivos</li>
          <li><span>🤖</span> Usar a Aria, tu asistente de IA para gestión de riesgo</li>
          <li><span>🔔</span> Seguir a otros traders y recibir notificaciones</li>
          <li><span>📚</span> Marcar tu progreso en los 12 módulos de educación</li>
          <li><span>🎁</span> Acumular puntos canjeables por un mes de Premium gratis</li>
        </ul>
        <button class="btn btn-gold btn-block" id="joinBenefitsSignup">Crear mi cuenta gratis</button>
        <button class="join-benefits-login" id="joinBenefitsLogin">Ya tengo cuenta — Iniciar sesión</button>
      </div>
    `;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.querySelector('.join-benefits-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.getElementById('joinBenefitsSignup').addEventListener('click', () => { close(); netlifyIdentity.open('signup'); });
    document.getElementById('joinBenefitsLogin').addEventListener('click', () => { close(); netlifyIdentity.open('login'); });
  }
  window.AR4_showJoinBenefits = showJoinBenefits;

  // ---- Bienvenida persuasiva al registrarse (destaca los agentes de IA) ----
  function firstName(user) {
    const meta = (user && user.user_metadata) || {};
    let n = meta.full_name || meta.name || (user && user.email) || '';
    n = String(n).split('@')[0].split(/[.\s_]/)[0];
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : '';
  }

  function showWelcome(user) {
    if (document.getElementById('ar4Welcome')) return;
    const name = firstName(user);
    const overlay = document.createElement('div');
    overlay.id = 'ar4Welcome';
    overlay.className = 'join-benefits-overlay';
    overlay.innerHTML = `
      <div class="join-benefits-card ar4-welcome-card">
        <button class="join-benefits-close" aria-label="Cerrar">✕</button>
        <div class="ar4-welcome-emoji">🤖</div>
        <span class="badge-live" style="background:rgba(46,204,113,0.15);color:var(--green);border-color:rgba(46,204,113,0.35);">✓ CUENTA CREADA</span>
        <h3>${name ? '¡Bienvenido, ' + escapeText(name) + '! 🎉' : '¡Bienvenido a AR4 Mercados! 🎉'}</h3>
        <p class="join-benefits-sub">Acabas de tomar una de las <strong>mejores decisiones para tu trading</strong>. Ahora eres parte de una de las primeras comunidades de Latinoamérica potenciada por <strong>agentes de inteligencia artificial</strong>.</p>
        <ul class="join-benefits-list">
          <li><span>🤖</span> <strong>Aria, tu agente de IA</strong>, te acompaña 24/7: gestión de riesgo, tamaño de posición y qué mirar antes de operar.</li>
          <li><span>🧠</span> Noticias y análisis del mercado <strong>interpretados por IA</strong>, en español y sin jerga complicada.</li>
          <li><span>🏆</span> Empiezas a <strong>ganar puntos desde hoy</strong>: sube de rango, desbloquea avatares y canjéalos por Premium gratis.</li>
          <li><span>💬</span> Entra a las salas en vivo y aprende junto a traders reales de la región.</li>
        </ul>
        <button class="btn btn-gold btn-block" id="welcomeExplore">Empezar con Aria y la comunidad →</button>
        <button class="join-benefits-login" id="welcomeLater">Explorar por mi cuenta</button>
      </div>
    `;
    document.body.appendChild(overlay);
    function close() { overlay.remove(); }
    overlay.querySelector('.join-benefits-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.getElementById('welcomeLater').addEventListener('click', close);
    document.getElementById('welcomeExplore').addEventListener('click', () => { close(); window.location.href = 'comunidad.html'; });
  }
  function escapeText(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  window.AR4_showWelcome = showWelcome;

  // Muestra la bienvenida una sola vez por usuario, solo tras un registro nuevo.
  function maybeWelcome(user) {
    if (!user) return;
    const key = 'ar4_welcomed_' + (user.id || user.email || 'x');
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      localStorage.removeItem('ar4_pending_welcome');
    } catch (e) {}
    showWelcome(user);
  }
  function hasPendingWelcome() {
    try { return !!localStorage.getItem('ar4_pending_welcome'); } catch (e) { return false; }
  }

  // Crea el perfil de comunidad del usuario si aún no existe (así "Traders
  // registrados" crece cuando un registrado entra). Seguro: la función usa la
  // identidad del propio JWT. Se ejecuta una vez por sesión.
  async function ensureMyProfile(user) {
    if (!user) return;
    try {
      if (sessionStorage.getItem('ar4_profile_ensured')) return;
      const jwt = await user.jwt();
      await fetch('/.netlify/functions/ensure-my-profile', { method: 'POST', headers: { Authorization: 'Bearer ' + jwt } });
      sessionStorage.setItem('ar4_profile_ensured', '1');
    } catch (e) {}
  }

  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = currentUser();
      if (user) {
        openProfileMenu(user);
      } else {
        showJoinBenefits();
      }
    });
  }

  if (subscribeBtn) {
    subscribeBtn.addEventListener('click', async () => {
      const user = currentUser();
      if (!user) {
        netlifyIdentity.open('signup');
        return;
      }

      subscribeBtn.disabled = true;
      subscribeBtn.textContent = 'Conectando con Mercado Pago...';
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/create-mercadopago-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt }
        });
        const data = await res.json();
        if (data.success && data.initPoint) {
          window.location.href = data.initPoint;
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (e) {
        alert('No se pudo iniciar la suscripción: ' + e.message);
        subscribeBtn.disabled = false;
        subscribeBtn.textContent = 'Suscribirme ahora';
      }
    });
  }

  (function checkMpStatusBanner() {
    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get('mp_status');
    if (!mpStatus) return;
    const banner = document.createElement('div');
    banner.className = 'community-form-msg ' + (mpStatus === 'success' ? 'success' : mpStatus === 'pending' ? '' : 'error');
    banner.style.cssText = 'margin:16px auto;max-width:700px;';
    if (mpStatus === 'success') {
      banner.textContent = 'Tu pago se está confirmando con Mercado Pago. Esto puede tardar unos segundos — recarga la página si no ves el cambio reflejado.';
      if (typeof gtag === 'function') {
        gtag('event', 'conversion', {
          'send_to': 'AW-18312316170/P8OpCIK2584cEIqK_5tE',
          'value': 37.0,
          'currency': 'PEN'
        });
      }
      params.delete('mp_status');
      const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', cleanUrl);
    } else if (mpStatus === 'pending') {
      banner.textContent = 'Tu pago está pendiente de confirmación en Mercado Pago.';
    } else {
      banner.textContent = 'El pago no se completó. Puedes intentarlo de nuevo cuando quieras.';
    }
    const hero = document.querySelector('.page-hero .container');
    if (hero) hero.appendChild(banner);
  })();

  netlifyIdentity.on('init', (user) => {
    refreshUI();
    if (user) ensureMyProfile(user);
    // Tras confirmar el email, el usuario vuelve ya logueado: mostramos la bienvenida
    // pendiente marcada en el registro.
    if (user && hasPendingWelcome()) maybeWelcome(user);
  });
  netlifyIdentity.on('login', () => {
    refreshUI();
    netlifyIdentity.close();
    const u = currentUser();
    if (u) ensureMyProfile(u);
    if (hasPendingWelcome()) maybeWelcome(u);
  });
  netlifyIdentity.on('logout', refreshUI);
  netlifyIdentity.on('signup', (user) => {
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', { 'send_to': 'AW-18312316170/j8pzCJGY584cEIqK_5tE' });
    }
    try { localStorage.setItem('ar4_pending_welcome', '1'); } catch (e) {}
    // Con confirmación por email desactivada el usuario queda logueado al instante;
    // damos un pequeño margen para cerrar el widget y saludamos.
    setTimeout(() => { netlifyIdentity.close(); maybeWelcome(user || currentUser()); }, 400);
  });

  refreshUI();
})();
