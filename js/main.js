document.getElementById('year').textContent = new Date().getFullYear();

const navMenuBtn = document.getElementById('navMenuBtn');
const mainNav = document.getElementById('mainNav');
if (navMenuBtn && mainNav) {
  function closeNav() {
    mainNav.classList.remove('open');
    navMenuBtn.setAttribute('aria-expanded', 'false');
  }
  function openNav() {
    mainNav.classList.add('open');
    navMenuBtn.setAttribute('aria-expanded', 'true');
  }
  navMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mainNav.classList.contains('open')) closeNav(); else openNav();
  });
  mainNav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeNav();
  });
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('open') && !mainNav.contains(e.target) && e.target !== navMenuBtn) closeNav();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  mainNav.querySelectorAll('a').forEach((a) => {
    if (a.getAttribute('href') === currentPath) a.classList.add('nav-active');
  });
}

const filterBar = document.getElementById('filterBar');
const newsList = document.getElementById('newsList');
if (filterBar && newsList) {
  const chips = filterBar.querySelectorAll('.filter-chip');
  const items = newsList.querySelectorAll('[data-category]');
  filterBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const filter = chip.dataset.filter;
    items.forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
    });
  });
}

// Feedback visual global: los radios dentro de .quiz-option son invisibles por CSS,
// así que sin esto el clic "no hace nada" a la vista. Marca la tarjeta elegida
// en cualquier cuestionario del sitio (brokers, educación, futuros formularios).
document.addEventListener('change', (e) => {
  const input = e.target;
  if (!input || !input.matches || !input.matches('.quiz-option input[type="radio"]')) return;
  document.querySelectorAll('input[name="' + (window.CSS && CSS.escape ? CSS.escape(input.name) : input.name) + '"]').forEach((r) => {
    const opt = r.closest('.quiz-option');
    if (opt) opt.classList.toggle('selected', r.checked);
  });
});

// ============================================================
// AR4 v2 — Pulido global de experiencia (aplica a TODAS las páginas)
// 1) Header con desenfoque y sombra al hacer scroll
// 2) Aparición suave de tarjetas y paneles al entrar en pantalla
// 3) Botón dorado "volver arriba"
// 4) Franja profesional de advertencia de riesgo sobre el footer
// ============================================================
(function () {
  var header = document.querySelector('.site-header');

  // Botón volver arriba
  var topBtn = document.createElement('button');
  topBtn.className = 'to-top';
  topBtn.setAttribute('aria-label', 'Volver arriba');
  topBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  document.body.appendChild(topBtn);

  function onScroll() {
    if (header) header.classList.toggle('hdr-scrolled', window.scrollY > 10);
    topBtn.classList.toggle('show', window.scrollY > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Franja de advertencia de riesgo (estándar profesional del sector)
  var footer = document.querySelector('footer.site-footer');
  if (footer && !document.querySelector('.risk-strip')) {
    var strip = document.createElement('div');
    strip.className = 'risk-strip';
    strip.innerHTML = '<div class="container"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9v5M12 17h.01"/></svg><p><strong>Advertencia de riesgo:</strong> el trading de divisas, CFDs y criptomonedas conlleva un alto riesgo de perder tu capital y no es adecuado para todas las personas. AR4 Mercados es una plataforma educativa e informativa: no somos un broker, no gestionamos fondos y nada en este sitio constituye una señal de compra/venta ni asesoría financiera personalizada.</p></div>';
    footer.parentNode.insertBefore(strip, footer);
  }

  // Aparición suave: tarjetas y paneles se revelan al entrar en pantalla.
  // Respeta prefers-reduced-motion y no anima lo que ya está visible al cargar.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var SEL = '.broker-card,.info-card,.inst-card,.tool-card,.promo-card,.quiz-card,.inst-track,.faq-refined .faq-item,.diploma-mini,.rl-panel,.pulse-news-card,.trader-card,.onboard-card,.inst-case,.mod-cover';
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ar4-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    var scheduled = false;
    function watch() {
      scheduled = false;
      document.querySelectorAll(SEL).forEach(function (el) {
        if (el.dataset.ar4r) return;
        el.dataset.ar4r = '1';
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92) return; // ya visible: no parpadear
        el.classList.add('ar4-reveal');
        io.observe(el);
      });
    }
    watch();
    new MutationObserver(function () {
      if (!scheduled) { scheduled = true; requestAnimationFrame(watch); }
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
