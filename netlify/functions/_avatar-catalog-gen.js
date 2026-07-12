// Generador determinístico de la Colección de Avatares AR4 (500 piezas, temática de trading).
// No son NFTs / no usan blockchain: son coleccionables cosméticos guardados en la base de datos.
// Cada índice (1-500) produce siempre el mismo avatar (mismo seed -> mismo resultado).

const TOTAL = 500;
const COMUN_COUNT = 350;
const RARO_COUNT = 125;
const LEGENDARIO_COUNT = 25;

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
function rangeFloat(rng, min, max) { return min + rng() * (max - min); }
function rangeInt(rng, min, max) { return Math.floor(rangeFloat(rng, min, max + 1)); }

const COMUN_PALETTES = [
  ['#3a4356', '#232a38'], ['#4a4038', '#2a231e'], ['#3d4a3f', '#212a23'], ['#4a3d47', '#2a2126'],
  ['#39434a', '#20262b'], ['#4a4636', '#2a271b'], ['#3a4a49', '#1f2b2a'], ['#463a4a', '#28212b'],
  ['#4a3a3a', '#2b2020'], ['#3a4442', '#212928']
];
const COMUN_ACCENTS = ['#c9a869', '#6f9a94', '#b47a86', '#7a93b4', '#7aa885', '#a893b4', '#c98f6f'];

const RARO_PALETTES = [
  ['#1e3a5f', '#0d1b2e'], ['#3d1e5f', '#1e0d2e'], ['#0d5f52', '#052e28'], ['#5f2e1e', '#2e150d'],
  ['#1e2e5f', '#0d132e'], ['#5f1e4a', '#2e0d24'], ['#1e5f3d', '#0d2e1e'], ['#5f4a1e', '#2e230d']
];
const RARO_ACCENTS = ['#5eead4', '#c4b5fd', '#fbbf24', '#fb7185', '#7dd3fc', '#a3e635'];

const GOLD_ACCENT = '#f0c75e';
const GOLD_LIGHT = '#fbe9b0';
const GOLD_DEEP = '#b8860b';

function candlesIcon(rng, colorA, colorB, n, mixed) {
  const totalWidth = 78;
  const startX = 100 - totalWidth / 2;
  const gap = totalWidth / n;
  const candleW = gap * 0.52;
  const baseY = 148;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = startX + i * gap + gap * 0.24;
    const h = 16 + i * (54 / n) + rangeFloat(rng, -4, 6);
    const y = baseY - h;
    const wick = h * rangeFloat(rng, 0.18, 0.32);
    const color = mixed && i % 2 === 1 ? colorB : colorA;
    out += `<line x1="${(x + candleW / 2).toFixed(1)}" y1="${(y - wick).toFixed(1)}" x2="${(x + candleW / 2).toFixed(1)}" y2="${(y + h + wick).toFixed(1)}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>`;
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${candleW.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${color}"/>`;
  }
  return out;
}

function arrowIcon(rng, color) {
  const headW = rangeInt(rng, 32, 46);
  const shaftTop = rangeInt(rng, 58, 68);
  const shaftBottom = 148;
  const headDrop = rangeInt(rng, 28, 38);
  return `<line x1="100" y1="${shaftBottom}" x2="100" y2="${shaftTop}" stroke="${color}" stroke-width="9" stroke-linecap="round"/><path d="M ${100 - headW / 2} ${shaftTop + headDrop} L 100 ${shaftTop} L ${100 + headW / 2} ${shaftTop + headDrop}" stroke="${color}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

function waveIcon(rng, color, n) {
  const pts = [];
  const startX = 55, endX = 145, startY = 132;
  let y = startY;
  for (let i = 0; i <= n; i++) {
    const x = startX + (i / n) * (endX - startX);
    if (i > 0) y -= rangeFloat(rng, 8, 20);
    y += rangeFloat(rng, -6, 6);
    pts.push({ x, y });
  }
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPts = `55,142 ${line} 145,142`;
  const last = pts[pts.length - 1];
  return `<polygon points="${areaPts}" fill="${color}" opacity="0.14"/><polyline points="${line}" stroke="${color}" stroke-width="5.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="5" fill="${color}"/>`;
}

function coinIcon(rng, color) {
  return `<circle cx="85" cy="118" r="25" fill="none" stroke="${color}" stroke-width="5.5"/><circle cx="118" cy="90" r="25" fill="none" stroke="${color}" stroke-width="5.5"/>`;
}

function diamondIcon(rng, color) {
  return `<rect x="72" y="72" width="56" height="56" fill="none" stroke="${color}" stroke-width="5.5" transform="rotate(45 100 100)"/><line x1="100" y1="64" x2="100" y2="136" stroke="${color}" stroke-width="2.5" opacity="0.55"/><line x1="64" y1="100" x2="136" y2="100" stroke="${color}" stroke-width="2.5" opacity="0.55"/>`;
}

function starIcon(rng, color, points) {
  const cx = 100, cy = 100, rOuter = 42, rInner = 18;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
  }
  d += 'Z';
  return `<path d="${d}" fill="${color}" opacity="0.92"/>`;
}

function crownIcon(rng, color) {
  const dip = rangeInt(rng, 12, 20);
  return `<path d="M56 132 L56 100 L76 ${100 + dip} L100 74 L124 ${100 + dip} L144 100 L144 132 Z" fill="none" stroke="${color}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><line x1="56" y1="132" x2="144" y2="132" stroke="${color}" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="70" r="4.5" fill="${color}"/>`;
}

const COMUN_ICONS = ['candles-up', 'arrow-up', 'wave', 'diamond'];
const RARO_ICONS = ['candles-mixed', 'wave', 'coin', 'diamond', 'star5'];
const LEGENDARIO_ICONS = ['crown', 'star6', 'full-chart', 'diamond'];

function renderIcon(kind, rng, accentA, accentB) {
  switch (kind) {
    case 'candles-up': return candlesIcon(rng, accentA, accentB, rangeInt(rng, 3, 4), false);
    case 'candles-mixed': return candlesIcon(rng, accentA, accentB, rangeInt(rng, 4, 5), true);
    case 'full-chart': return candlesIcon(rng, accentA, accentB, 6, true) + waveIcon(rng, accentB, 5);
    case 'arrow-up': return arrowIcon(rng, accentA);
    case 'wave': return waveIcon(rng, accentA, rangeInt(rng, 5, 6));
    case 'coin': return coinIcon(rng, accentA);
    case 'diamond': return diamondIcon(rng, accentA);
    case 'star5': return starIcon(rng, accentA, 5);
    case 'star6': return starIcon(rng, accentA, 6);
    case 'crown': return crownIcon(rng, accentA);
    default: return waveIcon(rng, accentA, 5);
  }
}

function tierForSeq(seq) {
  if (seq <= COMUN_COUNT) return 'comun';
  if (seq <= COMUN_COUNT + RARO_COUNT) return 'raro';
  return 'legendario';
}

function tierIndexForSeq(seq) {
  if (seq <= COMUN_COUNT) return seq;
  if (seq <= COMUN_COUNT + RARO_COUNT) return seq - COMUN_COUNT;
  return seq - COMUN_COUNT - RARO_COUNT;
}

function pad(n, len) { return String(n).padStart(len, '0'); }

function generateAvatar(seq) {
  if (seq < 1 || seq > TOTAL) throw new Error('seq fuera de rango (1-' + TOTAL + ')');
  const rng = mulberry32(seq * 7919 + 104729);
  const rarity = tierForSeq(seq);
  const tierIndex = tierIndexForSeq(seq);

  let bgColors, ringColor, ringWidth, glow, iconKind, accentA, accentB, name, pricePoints = null, priceSoles = null;

  if (rarity === 'comun') {
    bgColors = pick(rng, COMUN_PALETTES);
    ringColor = '#8b7355';
    ringWidth = 3;
    glow = false;
    iconKind = pick(rng, COMUN_ICONS);
    accentA = pick(rng, COMUN_ACCENTS);
    accentB = pick(rng, COMUN_ACCENTS);
    name = 'AR4 Bronce #' + pad(tierIndex, 3);
    pricePoints = 220;
  } else if (rarity === 'raro') {
    bgColors = pick(rng, RARO_PALETTES);
    ringColor = '#c7cede';
    ringWidth = 4;
    glow = true;
    iconKind = pick(rng, RARO_ICONS);
    accentA = pick(rng, RARO_ACCENTS);
    accentB = pick(rng, RARO_ACCENTS);
    name = 'AR4 Plata #' + pad(tierIndex, 3);
    priceSoles = 6;
  } else {
    bgColors = ['#241a08', '#0a0704'];
    ringColor = 'url(#goldRing)';
    ringWidth = 5;
    glow = true;
    iconKind = pick(rng, LEGENDARIO_ICONS);
    accentA = GOLD_ACCENT;
    accentB = GOLD_LIGHT;
    name = 'AR4 Oro #' + pad(tierIndex, 2);
    priceSoles = 18;
  }

  const rotation = rangeInt(rng, 0, 359);
  const iconMarkup = renderIcon(iconKind, rng, accentA, accentB);

  let sparkles = '';
  if (rarity === 'legendario') {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + rng() * 0.3;
      const r = 90 + rng() * 4;
      const x = 100 + r * Math.cos(angle);
      const y = 100 + r * Math.sin(angle);
      sparkles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.2 + rng() * 1.3).toFixed(1)}" fill="${GOLD_LIGHT}" opacity="${(0.5 + rng() * 0.4).toFixed(2)}"/>`;
    }
  }

  let pattern = '';
  if (rarity !== 'comun') {
    const dots = [];
    for (let i = 0; i < 14; i++) {
      const x = rangeInt(rng, 20, 180);
      const y = rangeInt(rng, 20, 180);
      dots.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="#ffffff" opacity="0.06"/>`);
    }
    pattern = dots.join('');
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>
<radialGradient id="bg" cx="35%" cy="30%" r="85%">
<stop offset="0%" stop-color="${bgColors[0]}"/>
<stop offset="100%" stop-color="${bgColors[1]}"/>
</radialGradient>
${rarity === 'legendario' ? `<linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${GOLD_LIGHT}"/><stop offset="45%" stop-color="${GOLD_ACCENT}"/><stop offset="100%" stop-color="${GOLD_DEEP}"/></linearGradient>` : ''}
${glow ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
</defs>
<circle cx="100" cy="100" r="96" fill="url(#bg)"/>
${pattern}
<g transform="rotate(${rotation % 12 - 6} 100 100)" ${glow ? 'filter="url(#glow)"' : ''}>${iconMarkup}</g>
${sparkles}
<circle cx="100" cy="100" r="96" fill="none" stroke="${ringColor}" stroke-width="${ringWidth}"/>
</svg>`;

  return { seq, rarity, name, svg, pricePoints, priceSoles };
}

function generateAll() {
  const out = [];
  for (let seq = 1; seq <= TOTAL; seq++) out.push(generateAvatar(seq));
  return out;
}

const AR4AvatarGen = { generateAvatar, generateAll, TOTAL, COMUN_COUNT, RARO_COUNT, LEGENDARIO_COUNT, tierForSeq };
if (typeof module !== 'undefined' && module.exports) module.exports = AR4AvatarGen;
if (typeof window !== 'undefined') window.AR4AvatarGen = AR4AvatarGen;
