(function () {
  if (typeof netlifyIdentity === 'undefined') return;

  netlifyIdentity.init();

  const authBtn = document.getElementById('authBtn');
  const statusEl = document.getElementById('accountStatus');
  const subscribeBtn = document.getElementById('subscribeBtn');

  function currentUser() {
    return netlifyIdentity.currentUser();
  }

  async function checkAccess(email) {
    try {
      const res = await fetch('/.netlify/functions/check-access?email=' + encodeURIComponent(email));
      if (!res.ok) return { premium: false };
      return res.json();
    } catch (e) {
      return { premium: false };
    }
  }

  window.AR4_checkPremium = async function () {
    const user = currentUser();
    if (!user) return false;
    const access = await checkAccess(user.email);
    return !!access.premium;
  };

  async function refreshUI() {
    const user = currentUser();

    if (authBtn) {
      authBtn.textContent = user ? 'Mi cuenta (' + (user.email || '').split('@')[0] + ')' : 'Iniciar sesión';
    }

    if (statusEl) {
      if (!user) {
        statusEl.innerHTML = `<div class="promo-banner" style="margin-bottom:28px;"><div class="promo-banner-text"><h3>Inicia sesión para gestionar tu membresía</h3><p>Crea una cuenta gratis para suscribirte o ver el estado de tu plan.</p></div><a href="#" class="btn btn-outline" id="statusLoginBtn">Iniciar sesión / Crear cuenta</a></div>`;
        const btn = document.getElementById('statusLoginBtn');
        if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); netlifyIdentity.open('signup'); });
      } else {
        const access = await checkAccess(user.email);
        window.AR4_PREMIUM = !!access.premium;
        statusEl.innerHTML = access.premium
          ? `<div class="promo-banner" style="margin-bottom:28px;border-color:rgba(34,192,122,0.35);"><div class="promo-banner-text"><h3>✅ Ya eres miembro Premium</h3><p>Sesión: ${user.email}</p></div><button class="btn btn-outline" id="logoutBtn">Cerrar sesión</button></div>`
          : `<div class="promo-banner" style="margin-bottom:28px;"><div class="promo-banner-text"><h3>Estás en el plan Gratis</h3><p>Sesión: ${user.email} — suscríbete para desbloquear el contenido Premium.</p></div><button class="btn btn-outline" id="logoutBtn">Cerrar sesión</button></div>`;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => netlifyIdentity.logout());
      }
    } else if (user) {
      const access = await checkAccess(user.email);
      window.AR4_PREMIUM = !!access.premium;
      document.dispatchEvent(new CustomEvent('ar4-access-ready'));
    }
  }

  if (authBtn) {
    authBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const user = currentUser();
      if (user) {
        window.location.href = 'membresia.html';
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
      subscribeBtn.textContent = 'Redirigiendo a pago seguro...';
      try {
        const res = await fetch('/.netlify/functions/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('no url');
        }
      } catch (e) {
        subscribeBtn.disabled = false;
        subscribeBtn.textContent = 'Suscribirme ahora';
        alert('El pago todavía no está conectado en esta versión del sitio. Vuelve a intentarlo cuando Stripe esté configurado.');
      }
    });
  }

  netlifyIdentity.on('init', refreshUI);
  netlifyIdentity.on('login', () => { refreshUI(); netlifyIdentity.close(); });
  netlifyIdentity.on('logout', refreshUI);

  refreshUI();
})();
