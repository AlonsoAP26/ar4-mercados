/* AR4 Mercados — Avatar canónico de Aria (IA de AR4).
   Emblema futurista y refinado, autocontenido (sin red), SIEMPRE idéntico
   en el chatbot, la narración por voz y cualquier lugar donde aparezca Aria.
   - AR4_ariaAvatarMarkup({inline,pulse}) -> string SVG inline (con hooks de animación)
   - AR4_ARIA_AVATAR_URI -> data URI para usar en <img src>  */
(function () {
  var uid = 0;

  function build(opts) {
    opts = opts || {};
    var id = 'ar' + (opts.inline ? (++uid) : 'x'); // ids únicos por instancia inline
    var g = 'ag_' + id, c = 'ac_' + id, gl = 'al_' + id;
    var rootCls = opts.inline ? ' class="aria-av"' : '';
    var pulse = opts.pulse
      ? '<circle class="aria-pulse aria-pulse-1" cx="50" cy="50" r="34" fill="none" stroke="url(#' + g + ')" stroke-width="1.3"/>' +
        '<circle class="aria-pulse aria-pulse-2" cx="50" cy="50" r="34" fill="none" stroke="url(#' + g + ')" stroke-width="1.1"/>'
      : '';
    return '' +
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"' + rootCls + ' aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0%" stop-color="#fbe9b0"/><stop offset="45%" stop-color="#eaca74"/><stop offset="100%" stop-color="#b8860b"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + c + '" cx="0.5" cy="0.4" r="0.62">' +
            '<stop offset="0%" stop-color="#fff7de"/><stop offset="55%" stop-color="#f0c75e"/><stop offset="100%" stop-color="#b8860b"/>' +
          '</radialGradient>' +
          '<radialGradient id="' + gl + '" cx="0.5" cy="0.5" r="0.5">' +
            '<stop offset="0%" stop-color="#f0c75e" stop-opacity="0.30"/><stop offset="100%" stop-color="#f0c75e" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<circle cx="50" cy="50" r="49" fill="#0b1222"/>' +
        '<circle cx="50" cy="50" r="49" fill="url(#' + gl + ')"/>' +
        '<circle cx="50" cy="50" r="46.5" fill="none" stroke="url(#' + g + ')" stroke-width="1.5" opacity="0.85"/>' +
        pulse +
        // Arcos orbitales (sensación de IA / procesamiento)
        '<g fill="none" stroke="url(#' + g + ')" stroke-linecap="round" opacity="0.55">' +
          '<path d="M17 61 A35 35 0 0 1 31 20" stroke-width="1.4"/>' +
          '<path d="M83 39 A35 35 0 0 1 69 80" stroke-width="1.4"/>' +
        '</g>' +
        // Núcleo hexagonal
        '<polygon class="aria-core" points="50,25 71.6,37.5 71.6,62.5 50,75 28.4,62.5 28.4,37.5" fill="#0e1830" stroke="url(#' + g + ')" stroke-width="2"/>' +
        // Monograma "A" dorado (Aria / AR4)
        '<path d="M50 34 L61 61 H55.2 L53.3 56.2 H46.7 L44.8 61 H39 Z M48.2 51.4 H51.8 L50 46.8 Z" fill="url(#' + c + ')"/>' +
        // Nodos de la órbita
        '<circle cx="50" cy="25" r="2.6" fill="url(#' + c + ')"/>' +
        '<circle cx="71.6" cy="62.5" r="1.9" fill="url(#' + g + ')"/>' +
        '<circle cx="28.4" cy="37.5" r="1.9" fill="url(#' + g + ')"/>' +
      '</svg>';
  }

  window.AR4_ariaAvatarMarkup = build;
  window.AR4_ARIA_AVATAR_URI = 'data:image/svg+xml;utf8,' + encodeURIComponent(build({ inline: false }));
})();
