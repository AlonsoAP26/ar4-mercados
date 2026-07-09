async function loadFondeo() {
  const res = await fetch('data/fondeo.json');
  if (!res.ok) throw new Error('No se pudieron cargar las cuentas de fondeo');
  return res.json();
}

function fondeoRankCardHTML(f) {
  return `
    <article class="broker-card">
      <div class="broker-rank">#${f.rank}</div>
      <h3>${f.name}</h3>
      <div class="stars">⭐ ${f.trustpilotRating}/5 <span>Trustpilot · ${f.trustpilotReviews} reseñas</span></div>
      <p style="color:var(--text-mid); font-size:0.85rem; margin-bottom:14px;">${f.resumen}</p>
      <ul class="broker-facts" style="margin-bottom:14px;">
        <li>Costo evaluación <strong>${f.evaluationCost}</strong></li>
        <li>Split de ganancia <strong>${f.profitSplit}</strong></li>
      </ul>
      <a href="fondeo-detail.html?slug=${encodeURIComponent(f.slug)}" class="btn btn-outline btn-block">Ver review completa →</a>
    </article>
  `;
}

async function initFondeoListing() {
  const grid = document.getElementById('fondeoTop');
  if (!grid) return;
  try {
    const firmas = await loadFondeo();
    firmas.sort((a, b) => a.rank - b.rank);
    grid.innerHTML = firmas.map(fondeoRankCardHTML).join('');
  } catch (e) {
    grid.innerHTML = '<p class="footer-text">No se pudieron cargar las cuentas de fondeo.</p>';
  }
}

async function initFondeoDetail() {
  const body = document.getElementById('fondeoBody');
  if (!body) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  let firmas;
  try {
    firmas = await loadFondeo();
  } catch (e) {
    body.innerHTML = '<p class="footer-text">No se pudo cargar la información.</p>';
    return;
  }

  const f = firmas.find(x => x.slug === slug);
  if (!f) {
    body.innerHTML = '<p class="footer-text">Cuenta de fondeo no encontrada. <a href="fondeo.html">Volver a Fondeo</a>.</p>';
    return;
  }

  document.title = f.name + ' — Review completa 2026 — AR4 Mercados';
  const descTag = document.getElementById('pageDesc');
  if (descTag) descTag.setAttribute('content', f.resumen);
  const breadcrumbTitle = document.getElementById('breadcrumbTitle');
  if (breadcrumbTitle) breadcrumbTitle.textContent = f.name;

  const heroEl = document.getElementById('fondeoHero');
  if (heroEl) {
    heroEl.innerHTML = `
      <div class="featured-broker" style="border-color:${f.brandColor}55;">
        <div class="featured-ribbon" style="background:linear-gradient(135deg, ${f.brandColor}, ${f.brandColor}cc); color:#0a0f1c;">#${f.rank} EN NUESTRO RANKING</div>
        <div class="featured-grid">
          <div class="featured-main">
            <div class="broker-logo" style="color:${f.brandColor};font-size:2.1rem;">${f.name}</div>
            <div class="stars" style="margin:12px 0 8px;">⭐ ${f.trustpilotRating}/5 <span>Trustpilot · ${f.trustpilotReviews} reseñas · "${f.trustpilotLabel}"</span></div>
            <p class="featured-desc">${f.descripcion}</p>
            <ul class="featured-facts">
              <li><span>Costo evaluación</span><strong>${f.evaluationCost}</strong></li>
              <li><span>Tamaños de cuenta</span><strong>${f.accountSizes}</strong></li>
              <li><span>Split de ganancia</span><strong>${f.profitSplit}</strong></li>
              <li><span>Plataformas</span><strong>${f.platforms}</strong></li>
            </ul>
            <div class="hero-actions" style="margin-top:22px;">
              <a href="${f.officialUrl}" target="_blank" rel="noopener" class="btn btn-crimson">Ir al sitio oficial de ${f.name} →</a>
            </div>
          </div>
          <div class="featured-side">
            <div class="pros-cons" style="grid-template-columns:1fr;">
              <div class="pros">
                <h5>Ventajas</h5>
                <ul>${f.pros.map(p => `<li>${p}</li>`).join('')}</ul>
              </div>
              <div class="cons">
                <h5>Desventajas</h5>
                <ul>${f.cons.map(c => `<li>${c}</li>`).join('')}</ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const deepDiveEl = document.getElementById('fondeoDeepDive');
  if (deepDiveEl) {
    deepDiveEl.innerHTML = `
      <div class="idea-warning" style="margin-top:28px;">
        <span class="icon">⚠️</span>
        <div>
          <strong>Aviso de riesgo</strong>
          <p>Las cuentas de fondeo (prop firms) no son una inversión ni una garantía de ingresos. La gran mayoría de los traders no aprueba la evaluación, y el costo del challenge se pierde si no se completa. Opera solo con dinero que puedas permitirte destinar a intentar la evaluación.</p>
        </div>
      </div>

      <div class="section-head" style="margin-top:8px;"><h2>Reglas y datos clave de ${f.name}</h2></div>
      <ul class="featured-facts" style="margin-bottom:28px;">
        <li><span>Año de fundación</span><strong>${f.founded}</strong></li>
        <li><span>Fases de evaluación</span><strong>${f.phases}</strong></li>
        <li><span>Pérdida diaria máxima</span><strong>${f.dailyLossLimit}</strong></li>
        <li><span>Pérdida total máxima (drawdown)</span><strong>${f.maxDrawdown}</strong></li>
        <li><span>Días mínimos de trading</span><strong>${f.minTradingDays}</strong></li>
        <li><span>Frecuencia de pago</span><strong>${f.payoutFrequency}</strong></li>
        <li><span>Tasa de aprobación estimada</span><strong>${f.approvalRate}</strong></li>
        <li><span>Tiempo de pago promedio</span><strong>${f.avgPayoutTime}</strong></li>
      </ul>

      ${f.faq && f.faq.length ? `
      <div class="section-head"><h2>Preguntas frecuentes sobre ${f.name}</h2></div>
      <div class="faq-list" style="margin-bottom:8px;">
        ${f.faq.map(item => `<details class="faq-item"><summary>${item.q}</summary><p>${item.a}</p></details>`).join('')}
      </div>` : ''}
    `;
  }

  const relatedGrid = document.getElementById('relatedFondeoGrid');
  if (relatedGrid) {
    const related = firmas.filter(x => x.slug !== slug).sort((a, x) => a.rank - x.rank);
    relatedGrid.innerHTML = related.map(fondeoRankCardHTML).join('');
  }
}

initFondeoListing();
initFondeoDetail();
