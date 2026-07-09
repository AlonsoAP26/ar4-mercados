const FIN_PHOTOS = {
  gold: 'https://images.unsplash.com/photo-1762463176319-8416bf1e6a8e?fm=jpg&q=75&w=900&auto=format&fit=crop',
  oil: 'https://images.unsplash.com/photo-1648555394313-494797ad48fc?fm=jpg&q=75&w=900&auto=format&fit=crop',
  forex: 'https://images.unsplash.com/photo-1515606378517-3451a4fa2e12?fm=jpg&q=75&w=900&auto=format&fit=crop',
  bank: 'https://images.unsplash.com/photo-1633059050703-0f1b50828402?fm=jpg&q=75&w=900&auto=format&fit=crop',
  latam: 'https://images.unsplash.com/photo-1683684931126-50e9afd0e63f?fm=jpg&q=75&w=900&auto=format&fit=crop',
  index: 'https://images.unsplash.com/photo-1767424412548-1a1ac7f4b9bc?fm=jpg&q=75&w=900&auto=format&fit=crop'
};

const FIN_ICONS = {
  gold: `<svg viewBox="0 0 100 100"><path d="M22 42 L42 30 L84 30 L64 42 Z" fill="currentColor" opacity="0.55"/><path d="M22 42 L64 42 L64 74 L22 74 Z" fill="currentColor" opacity="0.85"/><path d="M64 42 L84 30 L84 62 L64 74 Z" fill="currentColor" opacity="0.65"/></svg>`,
  oil: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="28" rx="22" ry="9" fill="currentColor" opacity="0.9"/><path d="M28 28 L28 68 A22 9 0 0 0 72 68 L72 28" fill="currentColor" opacity="0.6"/><ellipse cx="50" cy="68" rx="22" ry="9" fill="currentColor" opacity="0.35"/></svg>`,
  forex: `<svg viewBox="0 0 100 100"><circle cx="40" cy="42" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.85"/><circle cx="62" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/><text x="40" y="49" font-size="22" font-weight="700" text-anchor="middle" fill="currentColor">$</text><text x="62" y="67" font-size="20" font-weight="700" text-anchor="middle" fill="currentColor" opacity="0.7">€</text></svg>`,
  index: `<svg viewBox="0 0 100 100"><rect x="18" y="58" width="12" height="24" fill="currentColor" opacity="0.55"/><rect x="36" y="44" width="12" height="38" fill="currentColor" opacity="0.7"/><rect x="54" y="30" width="12" height="52" fill="currentColor" opacity="0.85"/><rect x="72" y="18" width="12" height="64" fill="currentColor"/></svg>`,
  latam: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="4" opacity="0.35"/><path d="M50 16 A34 34 0 0 1 50 84" stroke="currentColor" stroke-width="4" fill="none" opacity="0.55"/><circle cx="42" cy="38" r="4" fill="currentColor"/><circle cx="58" cy="52" r="4" fill="currentColor" opacity="0.8"/><circle cx="46" cy="66" r="4" fill="currentColor" opacity="0.6"/><path d="M42 38 L58 52 L46 66" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
  bank: `<svg viewBox="0 0 100 100"><path d="M50 16 L86 34 L14 34 Z" fill="currentColor" opacity="0.85"/><rect x="20" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="38" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="54" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="72" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="14" y="78" width="72" height="7" fill="currentColor"/></svg>`
};

const TREND_LABELS = {
  up: { icon: '▲', text: 'Tendencia alcista', cls: 'trend-up' },
  down: { icon: '▼', text: 'Tendencia bajista', cls: 'trend-down' },
  neutral: { icon: '●', text: 'Rango / a la espera', cls: 'trend-neutral' }
};

function catClassFromType(type) {
  const map = { gold: 'cat-commodities', oil: 'cat-commodities', forex: 'cat-forex', index: 'cat-acciones', latam: 'cat-latam', bank: 'cat-forex' };
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
