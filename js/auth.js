(function () {
  if (typeof netlifyIdentity === 'undefined') return;

  netlifyIdentity.init();

  const authBtn = document.getElementById('authBtn');
  const statusEl = document.getElementById('accountStatus');
  const subscribeBtn = document.getElementById('subscribeBtn');

  function currentUser() {
    return netlifyIdentity.currentUser();
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

  async function refreshUI() {
    const user = currentUser();

    if (authBtn) {
      authBtn.textContent = user ? '👤 ' + (user.email || '').split('@')[0] : 'Iniciar sesión';
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
    let culqiPublicKey = null;

    fetch('/.netlify/functions/culqi-config')
      .then(r => r.json())
      .then(d => { culqiPublicKey = d.publicKey || null; })
      .catch(() => { culqiPublicKey = null; });

    subscribeBtn.addEventListener('click', async () => {
      const user = currentUser();
      if (!user) {
        netlifyIdentity.open('signup');
        return;
      }

      if (typeof Culqi === 'undefined' || !culqiPublicKey) {
        alert('El pago todavía no está conectado en esta versión del sitio. Vuelve a intentarlo cuando Culqi esté configurado.');
        return;
      }

      Culqi.publicKey = culqiPublicKey;
      Culqi.settings({
        title: 'AR4 Mercados Premium',
        currency: 'PEN',
        amount: 0
      });

      window.culqi = async function () {
        if (Culqi.token) {
          const token = Culqi.token.id;
          subscribeBtn.disabled = true;
          subscribeBtn.textContent = 'Procesando suscripción...';
          try {
            const jwt = await user.jwt();
            const res = await fetch('/.netlify/functions/create-culqi-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
              body: JSON.stringify({ token, email: user.email })
            });
            const data = await res.json();
            if (data.success) {
              alert('¡Listo! Ya eres miembro Premium de AR4 Mercados.');
              window.location.reload();
            } else {
              throw new Error(data.error || 'Error desconocido');
            }
          } catch (e) {
            alert('No se pudo procesar la suscripción: ' + e.message);
          } finally {
            subscribeBtn.disabled = false;
            subscribeBtn.textContent = 'Suscribirme ahora';
          }
        } else if (Culqi.error) {
          alert('Error de Culqi: ' + (Culqi.error.user_message || 'no se pudo procesar la tarjeta'));
        }
      };

      Culqi.open();
    });
  }

  netlifyIdentity.on('init', refreshUI);
  netlifyIdentity.on('login', () => { refreshUI(); netlifyIdentity.close(); });
  netlifyIdentity.on('logout', refreshUI);

  refreshUI();
})();
