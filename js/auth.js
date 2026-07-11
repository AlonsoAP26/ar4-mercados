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
          const avatarHTML = profile.avatar_url
            ? `<img class="nav-avatar" src="${escapeHtmlLocal(profile.avatar_url)}" alt="">`
            : `<span class="nav-avatar nav-avatar-color" style="background:${escapeHtmlLocal(profile.avatar_color || '#d4af37')};">${escapeHtmlLocal((profile.username || '?').charAt(0).toUpperCase())}</span>`;
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

  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = currentUser();
      if (user) {
        window.location.href = 'comunidad.html';
      } else {
        netlifyIdentity.open('login');
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
    } else if (mpStatus === 'pending') {
      banner.textContent = 'Tu pago está pendiente de confirmación en Mercado Pago.';
    } else {
      banner.textContent = 'El pago no se completó. Puedes intentarlo de nuevo cuando quieras.';
    }
    const hero = document.querySelector('.page-hero .container');
    if (hero) hero.appendChild(banner);
  })();

  netlifyIdentity.on('init', refreshUI);
  netlifyIdentity.on('login', () => { refreshUI(); netlifyIdentity.close(); });
  netlifyIdentity.on('logout', refreshUI);
  netlifyIdentity.on('signup', () => {
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', { 'send_to': 'AW-18312316170/j8pzCJGY584cEIqK_5tE' });
    }
  });

  refreshUI();
})();
