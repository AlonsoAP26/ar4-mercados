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

const RATING_CATEGORY_LABELS = {
  instrumentos: 'Gama de instrumentos',
  comisiones: 'Comisiones y costos',
  plataformas: 'Plataformas de trading',
  investigacion: 'Investigación y análisis',
  movil: 'Trading móvil',
  educacion: 'Educación'
};

function starsHTML(score) {
  const filled = Math.round(score);
  return '★'.repeat(Math.max(0, filled)) + '☆'.repeat(Math.max(0, 5 - filled));
}

function ratingRowHTML(label, score) {
  return `<li><span>${label}</span><strong style="color:var(--gold-bright);letter-spacing:1px;">${starsHTML(score)} <span style="color:var(--text-mid);font-family:var(--mono);letter-spacing:0;">${score.toFixed(1)}</span></strong></li>`;
}

function brokerDeepDiveHTML(b) {
  if (!b.founded) return '';

  const ratingRows = b.ratingBreakdown
    ? Object.entries(b.ratingBreakdown).map(([key, score]) => ratingRowHTML(RATING_CATEGORY_LABELS[key] || key, score)).join('')
    : '';
  const avgRating = b.ratingBreakdown
    ? Object.values(b.ratingBreakdown).reduce((a, v) => a + v, 0) / Object.values(b.ratingBreakdown).length
    : null;

  const faqHTML = (b.faq || []).map(item => `
    <details class="faq-item">
      <summary>${item.q}</summary>
      <p>${item.a}</p>
    </details>
  `).join('');

  return `
    <div class="idea-warning" style="margin-top:28px;">
      <span class="icon">⚠️</span>
      <div>
        <strong>Aviso de riesgo</strong>
        <p>Los CFD son instrumentos financieros complejos y conllevan un riesgo alto de perder dinero rápidamente debido al apalancamiento. La mayoría de las cuentas de inversores minoristas pierden dinero al operar CFD con este tipo de proveedores. Debes considerar si comprendes cómo funcionan los CFD y si puedes permitirte asumir el riesgo elevado de perder tu dinero.</p>
      </div>
    </div>

    <div class="section-head" style="margin-top:8px;"><h2>Datos clave de ${b.name}</h2></div>
    <ul class="featured-facts" style="margin-bottom:28px;">
      <li><span>Año de fundación</span><strong>${b.founded}</strong></li>
      <li><span>¿Cotiza en bolsa?</span><strong>${b.publiclyTraded ? 'Sí' : 'No'}</strong></li>
      <li><span>¿Es un banco?</span><strong>${b.isBank ? 'Sí' : 'No'}</strong></li>
      <li><span>Tipo de ejecución</span><strong>${b.executionType}</strong></li>
      <li><span>Apalancamiento máximo</span><strong>${b.leverage}</strong></li>
      <li><span>Cuenta demo</span><strong>${b.demoAccount}</strong></li>
    </ul>

    ${ratingRows ? `
    <div class="section-head"><h2>Calificación de ${b.name} por categoría</h2></div>
    <p style="color:var(--text-low);font-size:0.8rem;margin-bottom:12px;">Calificación de 1 a 5 asignada por AR4 Mercados con base en reseñas públicas, condiciones publicadas por el bróker y comparación con el resto de esta lista. No sustituye tu propia investigación.</p>
    <ul class="featured-facts" style="margin-bottom:28px;">
      ${avgRating ? `<li><span>Promedio AR4 (todas las categorías)</span><strong style="color:var(--gold-bright);letter-spacing:1px;">${starsHTML(avgRating)} <span style="color:var(--text-mid);font-family:var(--mono);letter-spacing:0;">${avgRating.toFixed(1)}</span></strong></li>` : ''}
      ${ratingRows}
    </ul>` : ''}

    <div class="section-head"><h2>Depósitos y retiros</h2></div>
    <ul class="featured-facts" style="margin-bottom:28px;">
      <li><span>Métodos de depósito</span><strong>${b.depositMethods}</strong></li>
      <li><span>Tiempo de depósito</span><strong>${b.depositTime}</strong></li>
      <li><span>Tiempo de retiro</span><strong>${b.withdrawalTime}</strong></li>
      <li><span>Comisión por inactividad</span><strong>${b.inactivityFee}</strong></li>
    </ul>

    <details class="glossary-box" style="margin-bottom:28px;">
      <summary>¿Qué significa el tipo de ejecución? (ECN, STP, Market Maker)</summary>
      <dl class="glossary-grid">
        <dt>ECN (Electronic Communication Network)</dt>
        <dd>El bróker conecta tus órdenes directamente a una red de proveedores de liquidez (bancos, otros brokers, fondos de inversión), sin actuar como tu contraparte. Suele venir con spreads muy bajos, a veces desde 0.0 pips, más una comisión fija por operación.</dd>
        <dt>STP (Straight Through Processing)</dt>
        <dd>Tus órdenes se envían directo a proveedores de liquidez externos, de forma similar a un ECN pero sin la misma transparencia sobre el libro de órdenes. El costo suele ir incluido en el spread, sin comisión aparte.</dd>
        <dt>Market Maker (Dealing Desk)</dt>
        <dd>El bróker actúa como contraparte de tu operación y "crea el mercado" internamente en lugar de enviarla a un proveedor externo. No implica necesariamente peor ejecución, pero sí un potencial conflicto de interés que vale la pena conocer.</dd>
        <dt>¿Cuál conviene según tu estilo de trading?</dt>
        <dd>Los modelos ECN/STP suelen preferirse para scalping y trading algorítmico, donde la velocidad y transparencia de precios importan más. Los Market Maker pueden ofrecer spreads fijos más predecibles, algo valorado por cuentas pequeñas o principiantes.</dd>
      </dl>
    </details>

    ${faqHTML ? `
    <div class="section-head"><h2>Preguntas frecuentes sobre ${b.name}</h2></div>
    <div class="faq-list" style="margin-bottom:8px;">
      ${faqHTML}
    </div>` : ''}
  `;
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

  const deepDiveEl = document.getElementById('brokerDeepDive');
  if (deepDiveEl) deepDiveEl.innerHTML = brokerDeepDiveHTML(b);

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
