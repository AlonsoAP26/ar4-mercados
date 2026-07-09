const FIN_ICONS = {
  gold: `<svg viewBox="0 0 100 100"><path d="M22 42 L42 30 L84 30 L64 42 Z" fill="currentColor" opacity="0.55"/><path d="M22 42 L64 42 L64 74 L22 74 Z" fill="currentColor" opacity="0.85"/><path d="M64 42 L84 30 L84 62 L64 74 Z" fill="currentColor" opacity="0.65"/><path d="M30 50 L56 50" stroke="#000" stroke-opacity="0.15" stroke-width="2"/><path d="M30 58 L56 58" stroke="#000" stroke-opacity="0.15" stroke-width="2"/><path d="M30 66 L56 66" stroke="#000" stroke-opacity="0.15" stroke-width="2"/></svg>`,
  oil: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="28" rx="22" ry="9" fill="currentColor" opacity="0.9"/><path d="M28 28 L28 68 A22 9 0 0 0 72 68 L72 28" fill="currentColor" opacity="0.6"/><ellipse cx="50" cy="68" rx="22" ry="9" fill="currentColor" opacity="0.35"/><rect x="28" y="42" width="44" height="6" fill="#000" opacity="0.18"/><rect x="28" y="54" width="44" height="6" fill="#000" opacity="0.18"/></svg>`,
  forex: `<svg viewBox="0 0 100 100"><circle cx="40" cy="42" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.85"/><circle cx="62" cy="60" r="26" fill="none" stroke="currentColor" stroke-width="5" opacity="0.5"/><text x="40" y="49" font-size="22" font-weight="700" text-anchor="middle" fill="currentColor">$</text><text x="62" y="67" font-size="20" font-weight="700" text-anchor="middle" fill="currentColor" opacity="0.7">€</text></svg>`,
  index: `<svg viewBox="0 0 100 100"><rect x="18" y="58" width="12" height="24" fill="currentColor" opacity="0.55"/><rect x="36" y="44" width="12" height="38" fill="currentColor" opacity="0.7"/><rect x="54" y="30" width="12" height="52" fill="currentColor" opacity="0.85"/><rect x="72" y="18" width="12" height="64" fill="currentColor"/><path d="M18 54 L36 40 L54 26 L84 14" stroke="currentColor" stroke-width="3" fill="none" opacity="0.9"/></svg>`,
  latam: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="4" opacity="0.35"/><path d="M50 16 A34 34 0 0 1 50 84" stroke="currentColor" stroke-width="4" fill="none" opacity="0.55"/><circle cx="42" cy="38" r="4" fill="currentColor"/><circle cx="58" cy="52" r="4" fill="currentColor" opacity="0.8"/><circle cx="46" cy="66" r="4" fill="currentColor" opacity="0.6"/><path d="M42 38 L58 52 L46 66" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
  bank: `<svg viewBox="0 0 100 100"><path d="M50 16 L86 34 L14 34 Z" fill="currentColor" opacity="0.85"/><rect x="20" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="38" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="54" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="72" y="40" width="8" height="34" fill="currentColor" opacity="0.7"/><rect x="14" y="78" width="72" height="7" fill="currentColor"/></svg>`
};

const TREND_LABELS = {
  up: { icon: '▲', text: 'Tendencia alcista', cls: 'trend-up' },
  down: { icon: '▼', text: 'Tendencia bajista', cls: 'trend-down' },
  neutral: { icon: '●', text: 'Rango / a la espera', cls: 'trend-neutral' }
};

const CANDLE_BG = `<svg class="fin-hero-bg" viewBox="0 0 300 70" preserveAspectRatio="none">
  <line x1="10" y1="10" x2="10" y2="60" stroke="currentColor" stroke-width="2"/><rect x="6" y="28" width="8" height="18" fill="currentColor"/>
  <line x1="30" y1="18" x2="30" y2="55" stroke="currentColor" stroke-width="2"/><rect x="26" y="22" width="8" height="14" fill="currentColor"/>
  <line x1="50" y1="8" x2="50" y2="50" stroke="currentColor" stroke-width="2"/><rect x="46" y="30" width="8" height="16" fill="currentColor"/>
  <line x1="70" y1="20" x2="70" y2="62" stroke="currentColor" stroke-width="2"/><rect x="66" y="24" width="8" height="20" fill="currentColor"/>
  <line x1="90" y1="5" x2="90" y2="45" stroke="currentColor" stroke-width="2"/><rect x="86" y="10" width="8" height="18" fill="currentColor"/>
  <line x1="110" y1="15" x2="110" y2="58" stroke="currentColor" stroke-width="2"/><rect x="106" y="32" width="8" height="14" fill="currentColor"/>
  <line x1="130" y1="22" x2="130" y2="52" stroke="currentColor" stroke-width="2"/><rect x="126" y="26" width="8" height="16" fill="currentColor"/>
  <line x1="150" y1="6" x2="150" y2="48" stroke="currentColor" stroke-width="2"/><rect x="146" y="12" width="8" height="20" fill="currentColor"/>
  <line x1="170" y1="18" x2="170" y2="60" stroke="currentColor" stroke-width="2"/><rect x="166" y="34" width="8" height="16" fill="currentColor"/>
  <line x1="190" y1="10" x2="190" y2="50" stroke="currentColor" stroke-width="2"/><rect x="186" y="16" width="8" height="18" fill="currentColor"/>
  <line x1="210" y1="24" x2="210" y2="56" stroke="currentColor" stroke-width="2"/><rect x="206" y="28" width="8" height="14" fill="currentColor"/>
  <line x1="230" y1="8" x2="230" y2="44" stroke="currentColor" stroke-width="2"/><rect x="226" y="14" width="8" height="18" fill="currentColor"/>
  <line x1="250" y1="16" x2="250" y2="58" stroke="currentColor" stroke-width="2"/><rect x="246" y="30" width="8" height="18" fill="currentColor"/>
  <line x1="270" y1="20" x2="270" y2="50" stroke="currentColor" stroke-width="2"/><rect x="266" y="24" width="8" height="14" fill="currentColor"/>
  <line x1="290" y1="12" x2="290" y2="46" stroke="currentColor" stroke-width="2"/><rect x="286" y="18" width="8" height="16" fill="currentColor"/>
</svg>`;

function catClassFromType(type) {
  const map = { gold: 'cat-commodities', oil: 'cat-commodities', forex: 'cat-forex', index: 'cat-acciones', latam: 'cat-latam', bank: 'cat-forex' };
  return map[type] || 'cat-forex';
}

function finHeroHTML(type, trend, sizeClass, categoryLabel) {
  const icon = FIN_ICONS[type] || FIN_ICONS.index;
  const t = TREND_LABELS[trend] || TREND_LABELS.neutral;
  const catCls = catClassFromType(type);
  return `
    <div class="fin-hero ${catCls} ${sizeClass}">
      ${CANDLE_BG}
      <div class="fin-hero-icon icon-${type}">${icon}</div>
      <div class="fin-hero-trend ${t.cls}">${t.icon} ${t.text}</div>
      ${categoryLabel ? `<div class="fin-hero-cat-label">${categoryLabel}</div>` : ''}
    </div>
  `;
}
