// AR4 Mercados — instalación como app (PWA).
// Registra el service worker y ofrece instalar la app de forma discreta:
// en Android/escritorio con el diálogo nativo del navegador, y en iPhone con
// las instrucciones manuales (Safari no permite el diálogo automático).
// Si el usuario dice "ahora no", no se le vuelve a preguntar en 14 días.
(function () {
  'use strict';

  var CLAVE_DESCARTE = 'ar4_pwa_descartado';
  var DIAS_ESPERA = 14;
  var eventoInstalar = null;

  function yaInstalada() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function esIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }

  function descartadoHacePoco() {
    try {
      var t = parseInt(localStorage.getItem(CLAVE_DESCARTE) || '0', 10);
      return t && (Date.now() - t) < DIAS_ESPERA * 86400000;
    } catch (e) { return false; }
  }

  function marcarDescartado() {
    try { localStorage.setItem(CLAVE_DESCARTE, String(Date.now())); } catch (e) {}
  }

  // ---- Registro del service worker ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // ---- Estilos del aviso ----
  var estilos = document.createElement('style');
  estilos.textContent = [
    '.ar4-pwa{position:fixed;left:16px;right:16px;bottom:16px;z-index:9500;max-width:440px;margin:0 auto;',
    'background:#111a2e;border:1px solid rgba(212,175,55,0.28);border-radius:12px;padding:16px 18px;',
    'box-shadow:0 12px 40px rgba(0,0,0,0.55);display:flex;gap:14px;align-items:flex-start;',
    'transform:translateY(140%);transition:transform .35s ease}',
    '.ar4-pwa.visible{transform:translateY(0)}',
    '.ar4-pwa-ic{flex:0 0 auto;color:#d4af37;margin-top:2px}',
    '.ar4-pwa-txt{flex:1;min-width:0}',
    '.ar4-pwa-txt strong{display:block;font-family:var(--heading,sans-serif);font-size:.95rem;color:#eef1f8;margin-bottom:3px}',
    '.ar4-pwa-txt span{display:block;font-size:.82rem;color:#aab2c5;line-height:1.5}',
    '.ar4-pwa-btns{display:flex;gap:8px;margin-top:12px}',
    '.ar4-pwa-btns button{font:inherit;font-size:.82rem;padding:8px 16px;border-radius:8px;cursor:pointer;border:1px solid transparent}',
    '.ar4-pwa-si{background:#d4af37;color:#0a0f1c;font-weight:600}',
    '.ar4-pwa-no{background:transparent;color:#6d7690;border-color:rgba(255,255,255,0.1)}',
    '.ar4-pwa-x{position:absolute;top:10px;right:12px;background:none;border:none;color:#6d7690;cursor:pointer;font-size:1.1rem;line-height:1;padding:4px}',
    '.ar4-pwa-pasos{margin:10px 0 0;padding-left:18px;color:#aab2c5;font-size:.82rem;line-height:1.8}',
    '.ar4-pwa-pasos b{color:#f0c75e;font-weight:600}',
    '@media(max-width:480px){.ar4-pwa{left:10px;right:10px;padding:14px 16px}}',
    '@media(max-width:768px){.ar4-pwa{bottom:calc(74px + env(safe-area-inset-bottom, 0px))}}'
  ].join('');

  var ICONO = '<svg class="ar4-pwa-ic" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18.5h2"/></svg>';

  function construirAviso(titulo, cuerpo, extra, alAceptar, textoAceptar) {
    if (document.querySelector('.ar4-pwa')) return;
    if (!estilos.parentNode) document.head.appendChild(estilos);

    var caja = document.createElement('div');
    caja.className = 'ar4-pwa';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-label', 'Instalar AR4 Mercados');
    caja.style.position = 'fixed';
    caja.innerHTML = ICONO +
      '<div class="ar4-pwa-txt"><strong>' + titulo + '</strong><span>' + cuerpo + '</span>' + (extra || '') +
      '<div class="ar4-pwa-btns"></div></div>' +
      '<button class="ar4-pwa-x" aria-label="Cerrar">&times;</button>';

    var botones = caja.querySelector('.ar4-pwa-btns');
    if (alAceptar) {
      var si = document.createElement('button');
      si.className = 'ar4-pwa-si';
      si.textContent = textoAceptar || 'Instalar';
      si.addEventListener('click', function () { alAceptar(caja); });
      botones.appendChild(si);
    }
    var no = document.createElement('button');
    no.className = 'ar4-pwa-no';
    no.textContent = alAceptar ? 'Ahora no' : 'Entendido';
    no.addEventListener('click', function () { marcarDescartado(); cerrar(caja); });
    botones.appendChild(no);

    caja.querySelector('.ar4-pwa-x').addEventListener('click', function () { marcarDescartado(); cerrar(caja); });

    document.body.appendChild(caja);
    requestAnimationFrame(function () { caja.classList.add('visible'); });
  }

  function cerrar(caja) {
    caja.classList.remove('visible');
    setTimeout(function () { if (caja.parentNode) caja.parentNode.removeChild(caja); }, 350);
  }

  function lanzarInstalacion(caja) {
    if (!eventoInstalar) { if (caja) cerrar(caja); return; }
    if (caja) cerrar(caja);
    eventoInstalar.prompt();
    eventoInstalar.userChoice.then(function () { eventoInstalar = null; });
  }

  // ---- Android / escritorio: diálogo nativo ----
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    eventoInstalar = e;
    document.querySelectorAll('[data-pwa-install]').forEach(function (b) { b.hidden = false; });
    if (yaInstalada() || descartadoHacePoco()) return;
    setTimeout(function () {
      construirAviso(
        'Instala AR4 en tu celular',
        'Ocupa menos de 1 MB. Te queda el ícono en la pantalla de inicio y abre al instante.',
        '',
        lanzarInstalacion,
        'Instalar'
      );
    }, 4000);
  });

  window.addEventListener('appinstalled', function () {
    eventoInstalar = null;
    marcarDescartado();
  });

  // ---- iPhone: Safari no da diálogo, hay que explicar los dos toques ----
  if (esIOS() && !yaInstalada() && !descartadoHacePoco()) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        construirAviso(
          'Instala AR4 en tu iPhone',
          'En dos toques te queda el ícono en la pantalla de inicio:',
          '<ol class="ar4-pwa-pasos"><li>Toca <b>Compartir</b> en la barra de abajo</li>' +
          '<li>Elige <b>Agregar a inicio</b></li></ol>',
          null
        );
      }, 5000);
    });
  }

  // Enlace permanente en el pie: quien cerró el aviso puede instalar cuando quiera.
  // Se inyecta desde aquí para no repetir el mismo bloque en cada página.
  function enlaceEnPie() {
    var columna = document.querySelector('.site-footer .footer-grid > div');
    if (!columna || columna.querySelector('[data-pwa-install]')) return;
    var a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-pwa-install', '');
    a.style.cssText = 'display:inline-flex;align-items:center;gap:7px;margin-top:12px;color:#d4af37;font-size:.85rem';
    a.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18.5h2"/></svg>Instalar app';
    a.hidden = !(eventoInstalar || esIOS());
    columna.appendChild(a);
  }

  if (!yaInstalada()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enlaceEnPie);
    else enlaceEnPie();
  }

  // Cualquier botón con data-pwa-install dispara la instalación.
  document.addEventListener('click', function (e) {
    var boton = e.target.closest && e.target.closest('[data-pwa-install]');
    if (!boton) return;
    e.preventDefault();
    if (eventoInstalar) { lanzarInstalacion(null); return; }
    if (esIOS()) {
      construirAviso(
        'Instala AR4 en tu iPhone',
        'En dos toques te queda el ícono en la pantalla de inicio:',
        '<ol class="ar4-pwa-pasos"><li>Toca <b>Compartir</b> en la barra de abajo</li>' +
        '<li>Elige <b>Agregar a inicio</b></li></ol>',
        null
      );
    }
  });

  // =========================================================================
  // Notificaciones push: aviso al celular cuando sale un titular importante.
  // =========================================================================

  // Clave pública VAPID. Debe ser idéntica a la de scripts/_webpush.js.
  var VAPID_PUBLICA = 'BPglGx8q0Ka3i3k2c3DeQnvM2k2xpLiycMGDN1WdXUbc4uW7CAlcj-Zio_1X8G7TcufxpMBzZczDo0U76Cge3Pc';
  var CLAVE_PUSH_DESCARTE = 'ar4_push_descartado';

  function b64urlABytes(base64url) {
    var relleno = '='.repeat((4 - base64url.length % 4) % 4);
    var base64 = (base64url + relleno).replace(/-/g, '+').replace(/_/g, '/');
    var crudo = atob(base64);
    var bytes = new Uint8Array(crudo.length);
    for (var i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
    return bytes;
  }

  function pushDisponible() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
    // En iPhone las notificaciones web SOLO funcionan si la app está instalada
    // en la pantalla de inicio. Ofrecerlas antes daría un error al usuario.
    if (esIOS() && !yaInstalada()) return false;
    return true;
  }

  function pushDescartadoHacePoco() {
    try {
      var t = parseInt(localStorage.getItem(CLAVE_PUSH_DESCARTE) || '0', 10);
      return t && (Date.now() - t) < DIAS_ESPERA * 86400000;
    } catch (e) { return false; }
  }

  async function suscribirPush() {
    var permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      try { localStorage.setItem(CLAVE_PUSH_DESCARTE, String(Date.now())); } catch (e) {}
      return false;
    }
    var reg = await navigator.serviceWorker.ready;
    var sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64urlABytes(VAPID_PUBLICA)
      });
    }
    var datos = sub.toJSON();
    var res = await fetch('/.netlify/functions/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: datos.keys && datos.keys.p256dh,
        auth: datos.keys && datos.keys.auth
      })
    });
    return res.ok;
  }

  function ofrecerPush(caja) {
    if (caja) cerrar(caja);
    suscribirPush().then(function (ok) {
      if (!ok) return;
      construirAviso('Avisos activados', 'Te llegará una notificación cuando salga un titular que de verdad mueva el mercado. Nada de spam.', '', null);
      actualizarEnlacePush();
    }).catch(function () {});
  }

  function enlacePushEnPie() {
    var columna = document.querySelector('.site-footer .footer-grid > div');
    if (!columna || columna.querySelector('[data-push-enable]')) return;
    var a = document.createElement('a');
    a.href = '#';
    a.setAttribute('data-push-enable', '');
    a.style.cssText = 'display:flex;align-items:center;gap:7px;margin-top:8px;color:#d4af37;font-size:.85rem';
    a.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>Activar avisos del mercado';
    columna.appendChild(a);
    actualizarEnlacePush(a);
  }

  function actualizarEnlacePush(elemento) {
    var a = elemento || document.querySelector('[data-push-enable]');
    if (!a) return;
    a.hidden = !pushDisponible() || Notification.permission === 'granted';
  }

  document.addEventListener('click', function (e) {
    var boton = e.target.closest && e.target.closest('[data-push-enable]');
    if (!boton) return;
    e.preventDefault();
    if (Notification.permission === 'denied') {
      construirAviso('Los avisos están bloqueados', 'Tu navegador tiene bloqueadas las notificaciones de este sitio. Actívalas desde el candado de la barra de direcciones y vuelve a intentarlo.', '', null);
      return;
    }
    ofrecerPush(null);
  });

  if (pushDisponible()) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enlacePushEnPie);
    else enlacePushEnPie();

    // Se propone solo donde tiene sentido (la sección de noticias) y después de
    // que el usuario lleve un rato leyendo: pedir el permiso nada más entrar es
    // la forma más rápida de que lo rechacen para siempre.
    var enNoticias = /noticias\.html|flash/.test(location.pathname + location.hash) || location.pathname === '/';
    if (enNoticias && Notification.permission === 'default' && !pushDescartadoHacePoco()) {
      setTimeout(function () {
        if (document.querySelector('.ar4-pwa')) return; // no pisar el aviso de instalación
        construirAviso(
          'Que no se te pase lo importante',
          'Te avisamos al celular solo cuando sale un titular que mueve el mercado de verdad. Puedes desactivarlo cuando quieras.',
          '',
          ofrecerPush,
          'Avísenme'
        );
      }, 30000);
    }
  }

  // Al instalar la app es el mejor momento para proponer los avisos.
  window.addEventListener('appinstalled', function () {
    if (!pushDisponible() || Notification.permission !== 'default') return;
    setTimeout(function () {
      construirAviso(
        'Una cosa más: los avisos',
        'Ya tienes la app. ¿Te avisamos al celular cuando salga un titular que mueva el mercado?',
        '',
        ofrecerPush,
        'Sí, avísenme'
      );
    }, 3000);
  });
})();
