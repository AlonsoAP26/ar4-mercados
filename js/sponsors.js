/* AR4 Mercados — bloques patrocinados (afiliados). Discretos, responsive.
   Skyscraper Pepperstone (120x600) para sidebar de escritorio.
   Rectángulo FxPro (300x250) intercalado en el contenido (sobre todo móvil).
   Un solo banner visible por vista para no saturar la página. */
(function () {
  var PEPPERSTONE_URL = 'https://trk.pepperstonepartners.com/aff_c?offer_id=391&aff_id=46935&file_id=5726';
  var PEPPERSTONE_IMG = 'https://media.go2speed.org/brand/files/pepperstonegroup/391/TradingViewEssentials2401-StaticBanner-120x600-ES.png';
  var PEPPERSTONE_PIXEL = 'https://trk.pepperstonepartners.com/aff_i?offer_id=391&aff_id=46935&file_id=5726';
  var FXPRO_URL = 'https://direct.fxpro.group/es/partner/JB5PvniA';
  var FXPRO_IMG = 'https://fxpro-cdn.cloud/repo/marketing-portal-direct/banners/earning-season-en-gm-300x250.png';

  function skyscraper() {
    return '' +
      '<div class="sponsor-slot sponsor-sky-slot">' +
        '<span class="sponsor-tag">Publicidad</span>' +
        '<a href="' + PEPPERSTONE_URL + '" target="_blank" rel="noopener sponsored" class="sponsor-link">' +
          '<img src="' + PEPPERSTONE_IMG + '" width="120" height="600" alt="Pepperstone — abre tu cuenta" loading="lazy">' +
        '</a>' +
        '<img src="' + PEPPERSTONE_PIXEL + '" width="0" height="0" style="position:absolute;visibility:hidden;" alt="" aria-hidden="true">' +
      '</div>';
  }

  function rectangle(mobileOnly) {
    return '' +
      '<div class="sponsor-slot sponsor-rect-slot' + (mobileOnly ? ' sponsor-mobile-only' : '') + '">' +
        '<span class="sponsor-tag">Publicidad</span>' +
        '<a href="' + FXPRO_URL + '" target="_blank" rel="noopener sponsored" class="sponsor-link">' +
          '<img src="' + FXPRO_IMG + '" width="300" height="250" alt="FxPro — abre tu cuenta" loading="lazy">' +
        '</a>' +
      '</div>';
  }

  window.AR4_sponsorSky = skyscraper;
  window.AR4_sponsorRect = rectangle;

  // Inserta un rectángulo hacia la mitad del cuerpo del artículo (una sola vez).
  // opts.mobileOnly = true -> el rectángulo se oculta en escritorio (cuando ya hay skyscraper en la barra lateral).
  window.AR4_injectSponsor = function (containerId, opts) {
    opts = opts || {};
    var c = document.getElementById(containerId);
    if (!c || c.querySelector('.sponsor-rect-slot')) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = rectangle(!!opts.mobileOnly);
    var node = tmp.firstElementChild;
    var kids = Array.prototype.filter.call(c.children, function (el) {
      return el.tagName === 'P' || el.tagName === 'H2' || el.tagName === 'H3';
    });
    if (kids.length >= 4) {
      kids[Math.floor(kids.length / 2)].insertAdjacentElement('afterend', node);
    } else {
      c.appendChild(node);
    }
  };
})();
