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
    '@media(max-width:480px){.ar4-pwa{left:10px;right:10px;bottom:10px;padding:14px 16px}}'
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
})();
