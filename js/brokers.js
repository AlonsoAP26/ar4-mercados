async function loadBrokers() {
  const res = await fetch('data/brokers.json');
  if (!res.ok) throw new Error('No se pudieron cargar los brokers');
  return res.json();
}

function brokerLogoHTML(b, size) {
  if (b.logoUrl) {
    return `<div class="broker-logo-img-wrap size-${size}"><img class="broker-logo-img" src="${b.logoUrl}" alt="${b.name} logo" loading="eager"></div>`;
  }
  const fontSize = size === 'lg' ? '2.1rem' : '1.15rem';
  return `<div class="broker-logo" style="color:${b.brandColor};font-size:${fontSize};">${b.name}</div>`;
}

function brokerCtaUrl(b) {
  return b.affiliateUrl || b.officialUrl;
}

function brokerRankCardHTML(b) {
  const ctaLabel = b.affiliateUrl ? 'Abrir cuenta' : 'Ver review completa';
  const sponsoredTag = b.affiliateUrl ? '<span class="badge-premium" style="background:linear-gradient(135deg,var(--crimson-bright),var(--crimson));">Patrocinado</span>' : '';
  return `
    <article class="broker-card broker-rank-card">
      <div class="broker-rank">#${b.rank}</div>
      ${brokerLogoHTML(b, 'sm')}
      <div class="stars" style="margin:8px 0;">⭐ ${b.trustpilotRating}/5 <span>Trustpilot · ${b.trustpilotReviews} reseñas</span></div>
      <p style="color:var(--text-mid); font-size:0.85rem; margin-bottom:14px;">${b.resumen}</p>
      <ul class="broker-facts" style="margin-bottom:14px;">
        <li>Depósito mínimo <strong>${b.minDeposit}</strong></li>
        <li>Spreads <strong>${b.spreadsFrom}</strong></li>
      </ul>
      ${sponsoredTag}
      <a href="broker.html?slug=${encodeURIComponent(b.slug)}" class="btn btn-outline btn-block" style="margin-top:12px;">Ver review completa →</a>
    </article>
  `;
}

async function initBrokersListing() {
  const grid = document.getElementById('brokersTop10');
  if (!grid) return;
  try {
    const brokers = await loadBrokers();
    brokers.sort((a, b) => a.rank - b.rank);
    grid.innerHTML = brokers.map(brokerRankCardHTML).join('');
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar los brokers.</p>';
  }
}

async function initBrokerDetail() {
  const body = document.getElementById('brokerBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let brokers;
  try {
    brokers = await loadBrokers();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar la información del broker.</p>';
    return;
  }

  const b = brokers.find(x => x.slug === slug);
  if (!b) {
    body.innerHTML = '<p class="footer-text">Broker no encontrado. <a href="brokers.html">Volver a Brokers</a>.</p>';
    return;
  }

  document.title = b.name + ' — Review completa 2026 — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', b.resumen);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = b.name;

  const ctaUrl = brokerCtaUrl(b);
  const ctaLabel = b.affiliateUrl ? 'Abrir cuenta en ' + b.name + ' →' : 'Ir al sitio oficial de ' + b.name + ' →';
  const sponsoredBadge = b.affiliateUrl ? '<span class="badge-premium" style="background:linear-gradient(135deg,var(--crimson-bright),var(--crimson));">Enlace de afiliado</span>' : '';

  const heroEl = document.getElementById('brokerHero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="featured-broker" style="border-color:${b.brandColor}55;">
        <div class="featured-ribbon" style="background:linear-gradient(135deg, ${b.brandColor}, ${b.brandColor}cc); color:#0a0f1c;">#${b.rank} EN NUESTRO TOP 10 ${sponsoredBadge}</div>
        <div class="featured-grid">
          <div class="featured-main">
            ${brokerLogoHTML(b, 'lg')}
            <div class="stars" style="margin:12px 0 8px;">⭐ ${b.trustpilotRating}/5 <span>Trustpilot · ${b.trustpilotReviews} reseñas · "${b.trustpilotLabel}"</span></div>
            <p class="featured-desc">${b.descripcion}</p>
            <ul class="featured-facts">
              <li><span>Regulación</span><strong>${b.regulation}</strong></li>
              <li><span>Depósito mínimo</span><strong>${b.minDeposit}</strong></li>
              <li><span>Spreads</span><strong>${b.spreadsFrom}</strong></li>
              <li><span>Plataformas</span><strong>${b.platforms}</strong></li>
            </ul>
            <div class="hero-actions" style="margin-top:22px;">
              <a href="${ctaUrl}" target="_blank" rel="noopener ${b.affiliateUrl ? 'sponsored' : ''}" class="btn btn-crimson">${ctaLabel}</a>
            </div>
          </div>
          <div class="featured-side">
            <div class="pros-cons" style="grid-template-columns:1fr;">
              <div class="pros">
                <h5>Ventajas</h5>
                <ul>${b.pros.map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
              <div class="cons">
                <h5>Desventajas</h5>
                <ul>${b.cons.map(c => `<li>${c}</li>`).join('')}</ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const bottomCta = document.getElementById('brokerBottomCta');
  if (bottomCta) {
    bottomCta.innerHTML = `
      <div class="promo-banner">
        <div class="promo-banner-text">
          <h3>¿Listo para operar con ${b.name}?</h3>
          <p>${b.resumen}</p>
        </div>
        <a href="${ctaUrl}" target="_blank" rel="noopener ${b.affiliateUrl ? 'sponsored' : ''}" class="btn btn-crimson">${ctaLabel}</a>
      </div>
    `;
  }

  const relatedGrid = document.getElementById('relatedBrokersGrid');
  if (relatedGrid) {
    const related = brokers.filter(x => x.slug !== slug).sort((a, x) => a.rank - x.rank).slice(0, 3);
    relatedGrid.innerHTML = related.map(brokerRankCardHTML).join('');
  }
}

initBrokersListing();
initBrokerDetail();
