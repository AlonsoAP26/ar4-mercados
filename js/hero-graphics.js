function renderTechnicalAnalysis(container, symbol, interval) {
  container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
  script.async = true;
  script.text = JSON.stringify({
    interval: interval || '1h',
    width: '100%',
    isTransparent: true,
    height: 425,
    symbol: symbol,
    showIntervalTabs: true,
    locale: 'es',
    colorTheme: 'dark'
  });
  container.appendChild(script);
}

const FIN_PHOTOS = {
  gold: 'https://images.unsplash.com/photo-1762463176319-8416bf1e6a8e?fm=jpg&q=75&w=900&auto=format&fit=crop',
  oil: 'https://images.unsplash.com/photo-1648555394313-494797ad48fc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  forex: 'https://images.unsplash.com/photo-1515606378517-3451a4fa2e12?fm=jpg&q=75&w=900&auto=format&fit=crop',
  bank: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop',
  latam: 'https://images.unsplash.com/photo-1683684931126-50e9afd0e63f?fm=jpg&q=75&w=900&auto=format&fit=crop',
  index: 'https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?fm=jpg&q=75&w=900&auto=format&fit=crop'
};

const FIN_ICONS = {
  gold: `<svg viewBox="0 0 100 100"><path d="M22 42 L42 30 L84 30 L64 42 Z" fill="currentColor" opacity="0.55"/><path d="M22 42 L64 42 L64 74 L22 74 Z" fill="currentColor" opacity="0.85"/><path d="M64 42 L84 30 L84 62 L64 74 Z" fill="currentColor" opacity="0.65"/></svg>`,
  oil: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="28" rx="22" ry="9" fill="currentColor" opacity="0.9"/><path d="M28 28 L28 68 A22 9 0 0 0 72 68 L72 28" fill="currentColor" opacity="0.6"/><ellipse cx="50" cy="68" rx="22" ry="9" fill="currentColor" opacity="0.35"/></svg>`,
  forex: `<svg viewBox="0 0 100 100"><circle cx="40" cy="42" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.85"/><circle cx="62" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/><text x="40" y="49" font-size="22" font-weight="700" text-anchor="middle" fill="currentColor">$</text><text x="62" y="67" font-size="20" font-weight="700" text-anchor="middle" fill="currentColor" opacity="0.7">€</text></svg>`,
  index: `<svg viewBox="0 0 100 100"><rect x="18" y="58" width="12" height="24" fill="currentColor" opacity="0.55"/><rect x="36" y="44" width="12" height="38" fill="currentColor" opacity="0.7"/><rect x="54" y="30" width="12" height="52" fill="currentColor" opacity="0.85"/><rect x="72" y="18" width="12" height="64" fill="currentColor"/></svg>`,
  latam: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="4" opacity="0.35"/><path d="M50 16 A34 34 0 0 1 50 84" stroke="currentColor" stroke-width="4" fill="none" opacity="0.55"/><circle cx="42" cy="38" r="4" fill="currentColor"/><circle cx="58" cy="52" r="4" fill="currentColor" opacity="0.8"/><circle cx="46" cy="66" r="4" fill="currentColor" opacity="0.6"/><path d="M42 38 L58 52 L46 66" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
  bank: `<svg viewBox="0 0 100 100"><path d="M50 16 L86 34 L14 34 Z" fill="currentColor" opacity="0.85"/><rect x="20" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="38" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="54" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="72" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="14" y="78" width="72" height="7" fill="currentColor"/></svg>`,
  crypto: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="5" opacity="0.4"/><text x="50" y="63" font-size="42" font-weight="700" text-anchor="middle" fill="currentColor">₿</text></svg>`
};

const TREND_LABELS = {
  up: { icon: '▲', text: 'Tendencia alcista', cls: 'trend-up' },
  down: { icon: '▼', text: 'Tendencia bajista', cls: 'trend-down' },
  neutral: { icon: '●', text: 'Rango / a la espera', cls: 'trend-neutral' }
};

function catClassFromType(type) {
  const map = { gold: 'cat-commodities', oil: 'cat-commodities', forex: 'cat-forex', index: 'cat-acciones', latam: 'cat-latam', bank: 'cat-forex', crypto: 'cat-crypto' };
  return map[type] || 'cat-forex';
}

function finHeroHTML(type, trend, sizeClass) {
  const icon = FIN_ICONS[type] || FIN_ICONS.index;
  const photo = FIN_PHOTOS[type] || FIN_PHOTOS.index;
  const t = TREND_LABELS[trend] || TREND_LABELS.neutral;
  const catCls = catClassFromType(type);
  return `
    <div class="fin-hero ${catCls} ${sizeClass}" style="background-image:url('${photo}')">
      <div class="fin-hero-overlay"></div>
      <div class="fin-hero-icon-chip icon-${type}">${icon}</div>
      <div class="fin-hero-trend ${t.cls}">${t.icon} ${t.text}</div>
    </div>
  `;
}

const PSICO_PHOTOS = {
  fomo: 'https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  disciplina: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop',
  riesgo: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop',
  rutinas: 'https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  perdidas: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop',
  ansiedad: 'https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  confianza: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop'
};

const PSICO_ICONS = {
  fomo: `<svg viewBox="0 0 100 100"><path d="M56 12 L30 56 L48 56 L42 88 L74 42 L54 42 Z" fill="currentColor" opacity="0.9"/></svg>`,
  disciplina: `<svg viewBox="0 0 100 100"><rect x="26" y="18" width="48" height="64" rx="6" fill="none" stroke="currentColor" stroke-width="5"/><path d="M36 42 L44 50 L62 30" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="36" y1="62" x2="64" y2="62" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><line x1="36" y1="72" x2="54" y2="72" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>`,
  riesgo: `<svg viewBox="0 0 100 100"><path d="M50 14 L80 26 L80 50 C80 70 66 82 50 88 C34 82 20 70 20 50 L20 26 Z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M36 50 L46 60 L66 38" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  rutinas: `<svg viewBox="0 0 100 100"><path d="M74 50 A24 24 0 1 0 60 72" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M58 60 L60 72 L72 76" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  perdidas: `<svg viewBox="0 0 100 100"><polyline points="16,28 36,46 48,38 62,64 84,82" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M70,82 L84,82 L84,68" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ansiedad: `<svg viewBox="0 0 100 100"><polyline points="10,52 28,52 36,30 46,74 56,18 66,84 74,52 90,52" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  confianza: `<svg viewBox="0 0 100 100"><polyline points="16,68 40,44 54,56 84,24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M84,24 L84,40 M84,24 L68,24" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};

const PSICO_CAT_MAP = {
  'FOMO': 'fomo',
  'Disciplina': 'disciplina',
  'Gestión de riesgo': 'riesgo',
  'Rutinas': 'rutinas',
  'Pérdidas': 'perdidas',
  'Ansiedad': 'ansiedad',
  'Confianza': 'confianza'
};

function psychHeroHTML(category, sizeClass) {
  const key = PSICO_CAT_MAP[category] || 'disciplina';
  const icon = PSICO_ICONS[key];
  const photo = PSICO_PHOTOS[key];
  return `
    <div class="fin-hero cat-psico-${key} ${sizeClass}" style="background-image:url('${photo}')">
      <div class="fin-hero-overlay"></div>
      <div class="fin-hero-icon-chip icon-psico-${key}">${icon}</div>
      <div class="fin-hero-trend trend-neutral">${category}</div>
    </div>
  `;
}
