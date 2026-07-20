async function loadFondeo() {
  const res = await fetch('data/fondeo.json');
  if (!res.ok) throw new Error('No se pudieron cargar las cuentas de fondeo');
  return res.json();
}

function fondeoReputation(f) {
  const r = parseFloat(f.trustpilotRating);
  if (Number.isFinite(r)) return `★ ${f.trustpilotRating}/5 <span>${f.ratingSource || 'Trustpilot'} · ${f.trustpilotReviews} reseñas${f.trustpilotLabel ? ' · "' + f.trustpilotLabel + '"' : ''}</span>`;
  return `<span style="color:var(--text-mid);">Bróker nuevo · sin calificación pública verificada aún</span>`;
}

function fondeoPartnerCardHTML(f) {
  return `
    <article class="broker-card broker-partner-card">
      <div class="broker-card-top">
        <div class="broker-rank broker-partner-badge">★ ${f.partnerLabel || 'Aliado destacado'}</div>
        <span class="tag-sponsored">Patrocinado</span>
      </div>
      <h3>${f.name}</h3>
      <div class="stars">${fondeoReputation(f)}</div>
      <p style="color:var(--text-mid); font-size:0.85rem; margin-bottom:14px;">${f.resumen}</p>
      <ul class="broker-facts" style="margin-bottom:14px;">
        <li>Tamaños de cuenta <strong>${f.accountSizes}</strong></li>
        <li>Split de ganancia <strong>${f.profitSplit}</strong></li>
      </ul>
      <a href="fondeo-detail.html?slug=${encodeURIComponent(f.slug)}" class="btn btn-outline btn-block">Ver detalles →</a>
    </article>
  `;
}

function fondeoRankCardHTML(f) {
  return `
    <article class="broker-card">
      <div class="broker-rank">#${f.rank}${f.rank === 1 ? ' · RECOMENDADA' : ''}</div>
      <h3>${f.name}</h3>
      <div class="stars">${fondeoReputation(f)}</div>
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
    const partners = firmas.filter((f) => f.partner);
    const ranked = firmas.filter((f) => !f.partner).sort((a, b) => a.rank - b.rank);
    grid.innerHTML = partners.map(fondeoPartnerCardHTML).join('') + ranked.map(fondeoRankCardHTML).join('');
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
        <div class="featured-ribbon" style="background:linear-gradient(135deg, ${f.brandColor}, ${f.brandColor}cc); color:#0a0f1c;">${f.partner ? '★ ' + (f.partnerLabel || 'ALIADO DESTACADO').toUpperCase() : '#' + f.rank + ' EN NUESTRO RANKING'}</div>
        <div class="featured-grid">
          <div class="featured-main">
            <div class="broker-logo" style="color:${f.brandColor};font-size:2.1rem;">${f.name}</div>
            <div class="stars" style="margin:12px 0 8px;">${fondeoReputation(f)}</div>
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
      ${f.partner ? `
      <div class="idea-warning" style="margin-top:28px;border-color:rgba(225,58,75,0.45);">
        <span class="icon">⚠️</span>
        <div>
          <strong>Importante: bróker offshore, sin regulación de primer nivel</strong>
          <p>${f.name} está registrado en San Vicente y las Granadinas (offshore) y no cuenta con regulación de ASIC, FCA o CySEC. Sus reseñas públicas están divididas y algunos usuarios reportan demoras en los retiros. Es un aliado de AR4 con condiciones atractivas, pero opéralo con criterio: prueba retiros pequeños al inicio y no comprometas más de lo que puedas permitirte arriesgar.</p>
        </div>
      </div>` : `
      <div class="idea-warning" style="margin-top:28px;">
        <span class="icon">⚠️</span>
        <div>
          <strong>Aviso de riesgo</strong>
          <p>Las cuentas de fondeo (prop firms) no son una inversión ni una garantía de ingresos. La gran mayoría de los traders no aprueba la evaluación, y el costo del challenge se pierde si no se completa. Opera solo con dinero que puedas permitirte destinar a intentar la evaluación.</p>
        </div>
      </div>`}

      <div class="section-head" style="margin-top:8px;"><h2>Reglas y datos clave de ${f.name}</h2></div>
      <ul class="featured-facts facts-clean" style="margin-bottom:28px;">
        <li><span>Año de fundación</span><strong>${f.founded}</strong></li>
        <li><span>Fases de evaluación</span><strong>${f.phases}</strong></li>
        <li><span>Pérdida diaria máxima</span><strong>${f.dailyLossLimit}</strong></li>
        <li><span>Pérdida total máxima (drawdown)</span><strong>${f.maxDrawdown}</strong></li>
        <li><span>Días mínimos de trading</span><strong>${f.minTradingDays}</strong></li>
        <li><span>Frecuencia de pago</span><strong>${f.payoutFrequency}</strong></li>
        <li><span>Tasa de aprobación estimada</span><strong>${f.approvalRate}</strong></li>
        <li><span>Tiempo de pago promedio</span><strong>${f.avgPayoutTime}</strong></li>
      </ul>

      <div class="section-head" style="margin-top:36px;"><h2>¿Nuevo en fondeo? Así funciona un reto, sin humo</h2></div>
      <div class="guide-grid">
        <div class="guide-step"><span class="guide-num">1</span><div><strong>Pagas una cuota, no un depósito</strong><p>Compras un examen: la empresa te presta una cuenta de práctica con reglas. La cuota no se invierte — es el precio del intento.</p></div></div>
        <div class="guide-step"><span class="guide-num">2</span><div><strong>Debes ganar un objetivo sin romper los límites</strong><p>Típicamente ganar 8-10% sin perder más de ~5% en un día ni ~10% en total. Romper un límite un solo día termina el reto, aunque vayas ganando.</p></div></div>
        <div class="guide-step"><span class="guide-num">3</span><div><strong>Si pasas, operas capital de la empresa</strong><p>Te llevas un porcentaje de las ganancias (70-90% habitual). Sigues sujeto a las mismas reglas de riesgo: la disciplina no termina con el examen.</p></div></div>
        <div class="guide-step"><span class="guide-num">4</span><div><strong>Haz números ANTES de pagar</strong><p>La mayoría falla por matemática, no por análisis: riesgo por operación demasiado alto para los límites. Usa gratis nuestro <a href="herramientas.html">Planificador de reto</a> — te dice si tu plan es viable o imposible antes de gastar un dólar.</p></div></div>
      </div>
      <details class="rl-help" style="margin-top:14px;">
        <summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9v5M12 17h.01"/></svg> Los 4 errores que hacen perder retos (y cómo evitarlos)</summary>
        <div class="rl-help-body"><ul>
          <li><b>Arriesgar 2-3% por operación con límite diario de 5%</b>: dos pérdidas normales y estás fuera. Con 0.5% aguantas diez.</li>
          <li><b>Intentar pasar el reto en 3 días</b>: la prisa obliga a sobre-apalancar. Los que pasan suelen tardar semanas operando pequeño.</li>
          <li><b>Operar noticias de alto impacto</b> sin necesidad: los picos de volatilidad rompen límites diarios en minutos (algunas empresas además lo prohíben).</li>
          <li><b>"Recuperar" tras un mal día</b>: doblar el riesgo tras perder es la forma más rápida de romper el límite total. Cierra la plataforma y vuelve mañana.</li>
        </ul></div>
      </details>

      ${f.faq && f.faq.length ? `
      <div class="section-head"><h2>Preguntas frecuentes sobre ${f.name}</h2></div>
      <div class="faq-list" style="margin-bottom:8px;">
        ${f.faq.map(item => `<details class="faq-item"><summary>${item.q}</summary><p>${item.a}</p></details>`).join('')}
      </div>` : ''}
    `;
  }

  const relatedGrid = document.getElementById('relatedFondeoGrid');
  if (relatedGrid) {
    const related = firmas.filter(x => x.slug !== slug && !x.partner).sort((a, x) => a.rank - x.rank);
    relatedGrid.innerHTML = related.map(fondeoRankCardHTML).join('');
  }
}

function fondeoMatchesPhaseFilter(f, filter) {
  if (filter === 'all') return true;
  const phasesText = (f.phases || '').toLowerCase();
  if (filter === '1') return /\b1\s*(o\s*2\s*)?fase/.test(phasesText);
  if (filter === '2') return /\b2\s*fases/.test(phasesText) || /1\s*o\s*2\s*fases/.test(phasesText);
  return true;
}

function fondeoCompareRowHTML(label, values) {
  return `<tr><th>${label}</th>${values.map((v) => `<td>${v}</td>`).join('')}</tr>`;
}

function renderFondeoCompareTable(firmas, filter) {
  const wrap = document.getElementById('fondeoCompareTable');
  if (!wrap) return;

  const filtered = firmas.filter((f) => !f.partner && fondeoMatchesPhaseFilter(f, filter));
  if (!filtered.length) {
    wrap.innerHTML = '<p class="footer-text">Ninguna firma coincide con ese filtro.</p>';
    return;
  }

  const rows = [
    ['Costo de evaluación', filtered.map((f) => f.evaluationCost)],
    ['Tamaños de cuenta', filtered.map((f) => f.accountSizes)],
    ['Split de ganancia', filtered.map((f) => f.profitSplit)],
    ['Fases', filtered.map((f) => f.phases)],
    ['Pérdida diaria máxima', filtered.map((f) => f.dailyLossLimit)],
    ['Drawdown máximo', filtered.map((f) => f.maxDrawdown)],
    ['Días mínimos de trading', filtered.map((f) => f.minTradingDays)],
    ['Frecuencia de pago', filtered.map((f) => f.payoutFrequency)],
    ['Plataformas', filtered.map((f) => f.platforms)],
    ['Reputación', filtered.map((f) => f.trustpilotRating + '/5 (' + f.trustpilotReviews + ')')]
  ];

  wrap.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead><tr><th></th>${filtered.map((f) => `<th>${f.name}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(([label, values]) => fondeoCompareRowHTML(label, values)).join('')}
          <tr><th></th>${filtered.map((f) => `<td><a href="fondeo-detail.html?slug=${encodeURIComponent(f.slug)}" class="btn btn-outline" style="padding:8px 14px;font-size:0.78rem;">Ver review →</a></td>`).join('')}</tr>
        </tbody>
      </table>
    </div>
  `;
}

async function initFondeoCompareTable() {
  const wrap = document.getElementById('fondeoCompareTable');
  if (!wrap) return;
  try {
    const firmas = await loadFondeo();
    firmas.sort((a, b) => a.rank - b.rank);
    renderFondeoCompareTable(firmas, 'all');
    document.querySelectorAll('.fondeo-phase-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fondeo-phase-filter').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderFondeoCompareTable(firmas, btn.dataset.filter);
      });
    });
  } catch (e) {
    wrap.innerHTML = '<p class="footer-text">No se pudo cargar la tabla comparativa.</p>';
  }
}

initFondeoListing();
initFondeoDetail();
initFondeoCompareTable();
