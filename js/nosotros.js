// AR4 Mercados — Página "Sobre Nosotros": animaciones de scroll, contadores con
// datos reales, mapa de Latinoamérica y testimonios cargados desde la base de datos.
(function () {
  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('reveal-in'));
  }

  // ---------- Contadores animados ----------
  function animateCounter(el, target) {
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString('es') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('es') + suffix;
    }
    requestAnimationFrame(tick);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  const counterState = new WeakSet();
  function fireCounter(el) {
    if (counterState.has(el)) return;
    counterState.add(el);
    animateCounter(el, parseInt(el.dataset.counter, 10) || 0);
  }
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { fireCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counterEls.forEach((el) => cio.observe(el));
  } else {
    counterEls.forEach((el) => fireCounter(el));
  }

  // ---------- Datos reales para los contadores ----------
  // Contenido publicado: artículos de Psicotrading + ideas + noticias.
  Promise.all([
    fetch('data/articulos.json').then((r) => r.ok ? r.json() : []).catch(() => []),
    fetch('data/ideas.json').then((r) => r.ok ? r.json() : []).catch(() => []),
    fetch('data/noticias.json').then((r) => r.ok ? r.json() : []).catch(() => [])
  ]).then(([arts, ideas, news]) => {
    const total = (arts.length || 0) + (ideas.length || 0) + (news.length || 0);
    const el = document.getElementById('statContenido');
    if (el && total > 0) { el.dataset.counter = String(total); if (counterState.has(el)) { counterState.delete(el); fireCounter(el); } }
  });

  // Usuarios registrados e ideas compartidas: conteo real vía Supabase (clave anónima).
  if (window.AR4_supabase) {
    const sb = window.AR4_supabase;
    sb.from('profiles').select('id', { count: 'exact', head: true }).then(({ count }) => {
      const el = document.getElementById('statUsuarios');
      if (el && typeof count === 'number') { el.dataset.counter = String(count); counterState.delete(el); fireCounter(el); }
    }).catch(() => {});
    sb.from('community_posts').select('id', { count: 'exact', head: true }).then(({ count }) => {
      const el = document.getElementById('statPosts');
      if (el && typeof count === 'number') { el.dataset.counter = String(count); counterState.delete(el); fireCounter(el); }
    }).catch(() => {});
  }

  // ---------- Mapa de Latinoamérica (nodos geográficos) ----------
  const COUNTRIES = [
    { code: 'MX', name: 'México', flag: '🇲🇽', x: 60, y: 78 },
    { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴', x: 200, y: 108 },
    { code: 'GT', name: 'Guatemala', flag: '🇬🇹', x: 92, y: 120 },
    { code: 'VE', name: 'Venezuela', flag: '🇻🇪', x: 168, y: 176 },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴', x: 128, y: 196 },
    { code: 'EC', name: 'Ecuador', flag: '🇪🇨', x: 104, y: 232 },
    { code: 'PE', name: 'Perú', flag: '🇵🇪', x: 122, y: 288 },
    { code: 'BO', name: 'Bolivia', flag: '🇧🇴', x: 162, y: 312 },
    { code: 'PY', name: 'Paraguay', flag: '🇵🇾', x: 188, y: 356 },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', x: 138, y: 400 },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', x: 172, y: 408 },
    { code: 'UY', name: 'Uruguay', flag: '🇺🇾', x: 210, y: 400 }
  ];

  const mapEl = document.getElementById('nosMap');
  const tooltip = document.getElementById('nosMapTooltip');
  if (mapEl) {
    const W = 300, H = 470;
    let links = '';
    for (let i = 0; i < COUNTRIES.length - 1; i++) {
      const a = COUNTRIES[i], b = COUNTRIES[i + 1];
      links += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="rgba(240,199,94,0.18)" stroke-width="1"/>`;
    }
    const nodes = COUNTRIES.map((c) => `
      <g class="nos-map-node" data-name="${c.name}" data-flag="${c.flag}" tabindex="0">
        <circle cx="${c.x}" cy="${c.y}" r="14" fill="rgba(240,199,94,0.08)" class="nos-map-halo"/>
        <circle cx="${c.x}" cy="${c.y}" r="5" fill="#f0c75e" class="nos-map-dot"/>
      </g>`).join('');
    mapEl.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" class="nos-map-svg" role="img" aria-label="Mapa de presencia en Latinoamérica">
        <defs><radialGradient id="mapGlow" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="rgba(240,199,94,0.10)"/><stop offset="100%" stop-color="rgba(240,199,94,0)"/></radialGradient></defs>
        <rect x="0" y="0" width="${W}" height="${H}" fill="url(#mapGlow)"/>
        ${links}
        ${nodes}
      </svg>`;

    mapEl.querySelectorAll('.nos-map-node').forEach((node) => {
      function show(evt) {
        if (!tooltip) return;
        tooltip.innerHTML = `<span class="nos-tt-flag">${node.dataset.flag}</span> <strong>${node.dataset.name}</strong><br><span class="nos-tt-sub">Comunidad presente y creciendo</span>`;
        tooltip.hidden = false;
        const rect = mapEl.getBoundingClientRect();
        const point = node.querySelector('.nos-map-dot');
        const cx = parseFloat(point.getAttribute('cx'));
        const cy = parseFloat(point.getAttribute('cy'));
        tooltip.style.left = (cx / 300 * rect.width) + 'px';
        tooltip.style.top = (cy / 470 * rect.height) + 'px';
        node.classList.add('nos-map-node-active');
      }
      function hide() { if (tooltip) tooltip.hidden = true; node.classList.remove('nos-map-node-active'); }
      node.addEventListener('mouseenter', show);
      node.addEventListener('mouseleave', hide);
      node.addEventListener('focus', show);
      node.addEventListener('blur', hide);
    });
  }

  // ---------- Testimonios desde la base de datos ----------
  const testEl = document.getElementById('nosTestimonials');
  function starsHTML(n) {
    const full = Math.max(0, Math.min(5, Math.round(n || 5)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
  function testimonialCardHTML(t) {
    const initial = (t.name || 'A').trim().charAt(0).toUpperCase();
    const avatar = t.avatar_url
      ? `<img src="${t.avatar_url}" alt="" class="nos-test-avatar-img">`
      : `<span class="nos-test-avatar" style="background:${t.avatar_color || '#d4af37'};">${initial}</span>`;
    return `
      <div class="nos-test-card reveal reveal-in">
        <div class="nos-test-stars">${starsHTML(t.rating)}</div>
        <p class="nos-test-comment">"${(t.comment || '').replace(/</g, '&lt;')}"</p>
        <div class="nos-test-person">
          ${avatar}
          <div><strong>${(t.name || 'Trader AR4').replace(/</g, '&lt;')}</strong><span>${[t.country, t.time_using].filter(Boolean).join(' · ')}</span></div>
        </div>
      </div>`;
  }
  function renderTestimonialsEmpty() {
    if (!testEl) return;
    testEl.innerHTML = `
      <div class="nos-test-empty reveal reveal-in">
        <span class="nos-test-empty-icon">💬</span>
        <h4>Aún no publicamos testimonios</h4>
        <p>Preferimos no inventar reseñas. A medida que la comunidad crezca, aquí aparecerán experiencias reales de traders que usan AR4. Si ya nos usas, <a href="nosotros.html#contactForm">cuéntanos tu experiencia</a>.</p>
      </div>`;
  }
  if (testEl && window.AR4_supabase) {
    window.AR4_supabase
      .from('testimonials')
      .select('name,country,time_using,comment,rating,avatar_color,avatar_url')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(9)
      .then(({ data, error }) => {
        if (error || !data || !data.length) { renderTestimonialsEmpty(); return; }
        testEl.innerHTML = data.map(testimonialCardHTML).join('');
      })
      .catch(() => renderTestimonialsEmpty());
  } else if (testEl) {
    renderTestimonialsEmpty();
  }
})();
