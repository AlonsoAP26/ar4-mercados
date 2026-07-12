// Generador determinístico de la Colección de Avatares AR4 (500 piezas, personajes mascota originales, temática de trading).
// No son NFTs / no usan blockchain, y no representan a personas reales: son mascotas propias de AR4,
// coleccionables cosméticos guardados en la base de datos. Cada índice (1-500) produce siempre el
// mismo avatar (mismo seed -> mismo resultado).

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
function chance(rng, p) { return rng() < p; }

const OUTLINE = '#1a1408';

const COMUN_FUR = ['#c9a26a', '#8a7a6a', '#a67f5e', '#6f8a7a', '#7a8aa6', '#b48a6a', '#9a8a6a', '#7a6a8a', '#a67a7a', '#6a9a8a'];
const RARO_FUR = ['#5eead4', '#c4b5fd', '#fbbf24', '#fb7185', '#7dd3fc', '#a3e635', '#f0abfc', '#67e8f9'];
const GOLD_FUR = ['#f0c75e', '#fbe9b0', '#d4af6a'];

const BG_COMUN = [
  ['#3a4356', '#232a38'], ['#4a4038', '#2a231e'], ['#3d4a3f', '#212a23'], ['#4a3d47', '#2a2126'],
  ['#39434a', '#20262b'], ['#4a4636', '#2a271b'], ['#3a4a49', '#1f2b2a'], ['#463a4a', '#28212b']
];
const BG_RARO = [
  ['#1e3a5f', '#0d1b2e'], ['#3d1e5f', '#1e0d2e'], ['#0d5f52', '#052e28'], ['#5f2e1e', '#2e150d'],
  ['#1e2e5f', '#0d132e'], ['#5f1e4a', '#2e0d24'], ['#1e5f3d', '#0d2e1e'], ['#5f4a1e', '#2e230d']
];
const BG_LEGENDARIO = ['#241a08', '#0a0704'];

const GOLD_ACCENT = '#f0c75e';
const GOLD_LIGHT = '#fbe9b0';
const GOLD_DEEP = '#b8860b';

// ---------- Expresiones (ojos + boca), compartidas entre especies ----------
function eyesMouth(rng, expression, cx1, cx2, cy) {
  const r = 16;
  let eyes = '';
  let mouth = '';
  if (expression === 'wink') {
    eyes = `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx1 + 2}" cy="${cy}" r="6.5" fill="${OUTLINE}"/><path d="M${cx2 - 12} ${cy} Q${cx2} ${cy + 8} ${cx2 + 12} ${cy}" stroke="${OUTLINE}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    mouth = `<path d="M84 132 Q100 142 116 132" stroke="${OUTLINE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else if (expression === 'sleepy') {
    eyes = `<path d="M${cx1 - 12} ${cy} Q${cx1} ${cy + 6} ${cx1 + 12} ${cy}" stroke="${OUTLINE}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${cx2 - 12} ${cy} Q${cx2} ${cy + 6} ${cx2 + 12} ${cy}" stroke="${OUTLINE}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    mouth = `<circle cx="100" cy="134" r="6" fill="none" stroke="${OUTLINE}" stroke-width="3"/>`;
  } else if (expression === 'shocked') {
    eyes = `<circle cx="${cx1}" cy="${cy}" r="${r + 3}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx2}" cy="${cy}" r="${r + 3}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx1}" cy="${cy}" r="7" fill="${OUTLINE}"/><circle cx="${cx2}" cy="${cy}" r="7" fill="${OUTLINE}"/>`;
    mouth = `<ellipse cx="100" cy="136" rx="9" ry="11" fill="${OUTLINE}"/>`;
  } else if (expression === 'confident') {
    eyes = `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx2}" cy="${cy}" r="${r}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx1 + 2}" cy="${cy}" r="6.5" fill="${OUTLINE}"/><circle cx="${cx2 + 2}" cy="${cy}" r="6.5" fill="${OUTLINE}"/><line x1="${cx1 - 14}" y1="${cy - 20}" x2="${cx1 + 10}" y2="${cy - 24}" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/><line x1="${cx2 - 10}" y1="${cy - 24}" x2="${cx2 + 14}" y2="${cy - 20}" stroke="${OUTLINE}" stroke-width="4" stroke-linecap="round"/>`;
    mouth = `<path d="M86 132 Q100 140 118 130" stroke="${OUTLINE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else {
    eyes = `<circle cx="${cx1}" cy="${cy}" r="${r}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx2}" cy="${cy}" r="${r}" fill="#fff" stroke="${OUTLINE}" stroke-width="3.5"/><circle cx="${cx1 + 2}" cy="${cy}" r="6.5" fill="${OUTLINE}"/><circle cx="${cx2 + 2}" cy="${cy}" r="6.5" fill="${OUTLINE}"/>`;
    mouth = `<path d="M88 132 Q100 138 112 132" stroke="${OUTLINE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  }
  return eyes + mouth;
}

// ---------- Especies ----------
function speciesToro(rng, fur) {
  return `<path d="M52 56 Q16 46 14 18 Q34 22 50 42 Q58 48 52 56 Z" fill="#e8e2d4" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M148 56 Q184 46 186 18 Q166 22 150 42 Q142 48 148 56 Z" fill="#e8e2d4" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<circle cx="42" cy="60" r="14" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="158" cy="60" r="14" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="100" cy="112" r="60" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<ellipse cx="100" cy="145" rx="27" ry="18" fill="#f0dcae" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="90" cy="148" r="3.2" fill="${OUTLINE}"/><circle cx="110" cy="148" r="3.2" fill="${OUTLINE}"/>`;
}
function speciesOso(rng, fur) {
  return `<circle cx="42" cy="52" r="20" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<circle cx="158" cy="52" r="20" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<circle cx="42" cy="52" r="9" fill="#8a715a"/><circle cx="158" cy="52" r="9" fill="#8a715a"/>
<circle cx="100" cy="110" r="62" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<ellipse cx="100" cy="146" rx="22" ry="15" fill="#e8d2a8" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="100" cy="140" r="4" fill="${OUTLINE}"/>`;
}
function speciesZorro(rng, fur) {
  return `<path d="M46 60 L26 20 L64 44 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M154 60 L174 20 L136 44 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<circle cx="100" cy="112" r="60" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M76 138 Q100 168 124 138 Q112 150 100 150 Q88 150 76 138 Z" fill="#f0dcae" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="100" cy="148" r="4" fill="${OUTLINE}"/>`;
}
function speciesBuho(rng, fur) {
  return `<path d="M56 46 L44 16 L68 38 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M144 46 L156 16 L132 38 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<circle cx="100" cy="112" r="62" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M92 138 L108 138 L100 152 Z" fill="#e8a45c" stroke="${OUTLINE}" stroke-width="3"/>`;
}
function speciesLobo(rng, fur) {
  return `<path d="M38 54 Q26 10 62 34 Q56 48 46 56 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M162 54 Q174 10 138 34 Q144 48 154 56 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<ellipse cx="100" cy="118" rx="64" ry="58" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M64 150 Q100 178 136 150 L124 186 Q100 196 76 186 Z" fill="#e8e4dc" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M100 146 L128 160 Q108 172 100 172 Q92 172 72 160 Z" fill="#5a5a5a" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>
<circle cx="100" cy="166" r="3.4" fill="${OUTLINE}"/>`;
}
function speciesTortuga(rng, fur) {
  return `<circle cx="100" cy="112" r="60" fill="#4f9a6f" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M62 90 L100 74 L138 90 L128 130 L100 148 L72 130 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round" opacity="0.9"/>
<ellipse cx="100" cy="146" rx="16" ry="10" fill="#dff0c9" stroke="${OUTLINE}" stroke-width="3"/>`;
}
function speciesAguila(rng, fur) {
  return `<path d="M30 96 Q4 90 30 74 Q40 84 40 96 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M170 96 Q196 90 170 74 Q160 84 160 96 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="100" cy="112" r="60" fill="#e8e4dc" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M92 92 Q100 84 108 92 Q120 100 100 108 Q80 100 92 92 Z" fill="${fur}"/>
<path d="M84 142 L116 142 L100 158 Z" fill="#e8a45c" stroke="${OUTLINE}" stroke-width="3"/>`;
}
function speciesBallena(rng, fur) {
  return `<ellipse cx="100" cy="116" rx="66" ry="56" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<circle cx="100" cy="66" r="5" fill="${OUTLINE}"/>
<path d="M84 148 Q100 158 116 148" stroke="${OUTLINE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
}
function speciesTiburon(rng, fur) {
  return `<path d="M90 40 L110 40 L100 8 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M100 172 Q50 172 40 118 Q40 56 100 52 Q160 56 160 118 Q150 172 100 172 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M78 140 L122 140 L112 150 L88 150 Z" fill="#f0dcae" stroke="${OUTLINE}" stroke-width="3"/>
<path d="M82 142 L86 148 L90 142 M94 142 L98 148 L102 142 M106 142 L110 148 L114 142" stroke="${OUTLINE}" stroke-width="1.6" fill="none"/>`;
}
function speciesPulpo(rng, fur) {
  return `<circle cx="100" cy="94" r="54" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M56 120 Q40 150 56 170 M76 130 Q66 162 80 176 M100 134 Q100 166 100 180 M124 130 Q134 162 120 176 M144 120 Q160 150 144 170" stroke="${fur}" stroke-width="14" fill="none" stroke-linecap="round"/>
<path d="M56 120 Q40 150 56 170 M76 130 Q66 162 80 176 M100 134 Q100 166 100 180 M124 130 Q134 162 120 176 M144 120 Q160 150 144 170" stroke="${OUTLINE}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.5"/>`;
}
function speciesMono(rng, fur) {
  return `<circle cx="40" cy="70" r="22" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<circle cx="160" cy="70" r="22" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<circle cx="40" cy="70" r="10" fill="#e8d2a8"/><circle cx="160" cy="70" r="10" fill="#e8d2a8"/>
<circle cx="100" cy="112" r="60" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<ellipse cx="100" cy="140" rx="30" ry="24" fill="#e8d2a8" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="90" cy="146" r="3" fill="${OUTLINE}"/><circle cx="110" cy="146" r="3" fill="${OUTLINE}"/>`;
}
function speciesRobot(rng, fur) {
  return `<line x1="100" y1="30" x2="100" y2="12" stroke="${fur}" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="10" r="7" fill="${fur}" stroke="${OUTLINE}" stroke-width="3"/>
<rect x="42" y="46" width="116" height="122" rx="26" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<rect x="62" y="84" width="76" height="30" rx="10" fill="#0a0a0a" stroke="${OUTLINE}" stroke-width="3"/>`;
}
function speciesCohete(rng, fur) {
  return `<path d="M100 14 Q140 60 132 140 L68 140 Q60 60 100 14 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M68 130 L36 168 L64 154 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M132 130 L164 168 L136 154 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="100" cy="88" r="22" fill="#8fd3f4" stroke="${OUTLINE}" stroke-width="3.5"/>
<circle cx="92" cy="86" r="4.5" fill="${OUTLINE}"/><circle cx="108" cy="86" r="4.5" fill="${OUTLINE}"/>
<path d="M92 96 Q100 100 108 96" stroke="${OUTLINE}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}
function speciesDiamante(rng, fur) {
  return `<path d="M100 18 L156 70 L100 172 L44 70 Z" fill="${fur}" stroke="${OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
<path d="M44 70 L156 70 M76 70 L100 18 L124 70 M76 70 L100 172 M124 70 L100 172" stroke="${OUTLINE}" stroke-width="2.2" opacity="0.5"/>`;
}
function speciesDragon(rng, fur) {
  return `<path d="M58 50 Q34 8 20 6 Q30 34 54 58 Z" fill="#7a2f2f" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M142 50 Q166 8 180 6 Q170 34 146 58 Z" fill="#7a2f2f" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>
<circle cx="100" cy="112" r="60" fill="${fur}" stroke="${OUTLINE}" stroke-width="4"/>
<path d="M80 142 Q100 156 120 142 L114 152 Q100 160 86 152 Z" fill="#e8a45c" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>`;
}

const SPECIES_FN = {
  toro: speciesToro, oso: speciesOso, zorro: speciesZorro, buho: speciesBuho, lobo: speciesLobo,
  tortuga: speciesTortuga, aguila: speciesAguila, ballena: speciesBallena,
  tiburon: speciesTiburon, pulpo: speciesPulpo,
  mono: speciesMono, robot: speciesRobot, cohete: speciesCohete, diamante: speciesDiamante, dragon: speciesDragon
};
const SPECIES_LABEL = {
  toro: 'Toro', oso: 'Oso', zorro: 'Zorro', buho: 'Búho', lobo: 'Lobo',
  tortuga: 'Tortuga', aguila: 'Águila', ballena: 'Ballena',
  tiburon: 'Tiburón', pulpo: 'Pulpo',
  mono: 'Mono', robot: 'Robot', cohete: 'Cohete', diamante: 'Diamante', dragon: 'Dragón'
};
// especies sin ojos/boca genéricos (ya traen su propia cara resuelta)
const NO_FACE_SPECIES = new Set(['robot', 'diamante', 'cohete']);

const COMUN_SPECIES = ['toro', 'oso', 'zorro', 'buho', 'lobo', 'tortuga', 'aguila', 'ballena'];
const RARO_SPECIES = ['toro', 'oso', 'zorro', 'buho', 'lobo', 'tortuga', 'aguila', 'ballena', 'tiburon', 'pulpo'];
const LEGENDARIO_SPECIES = ['mono', 'robot', 'cohete', 'diamante', 'dragon'];

const EXPRESSIONS = ['normal', 'wink', 'sleepy', 'shocked', 'confident'];

function accessoryBandana(rng, color) {
  return `<path d="M60 40 L100 20 L92 52 Z" fill="${color}" stroke="${OUTLINE}" stroke-width="3" stroke-linejoin="round"/>`;
}
function accessoryShades(rng) {
  return `<rect x="60" y="88" r="4" width="34" height="18" rx="6" fill="#0a0a0a" stroke="${OUTLINE}" stroke-width="3"/><rect x="106" y="88" width="34" height="18" rx="6" fill="#0a0a0a" stroke="${OUTLINE}" stroke-width="3"/><line x1="94" y1="96" x2="106" y2="96" stroke="${OUTLINE}" stroke-width="3"/>`;
}
function accessoryCrown(rng) {
  return `<path d="M62 38 L74 12 L88 32 L100 6 L112 32 L126 12 L138 38 Z" fill="url(#goldRing)" stroke="${OUTLINE}" stroke-width="3.5" stroke-linejoin="round"/>`;
}

function pad(n, len) { return String(n).padStart(len, '0'); }
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

function generateAvatar(seq) {
  if (seq < 1 || seq > TOTAL) throw new Error('seq fuera de rango (1-' + TOTAL + ')');
  const rng = mulberry32(seq * 7919 + 104729);
  const rarity = tierForSeq(seq);
  const tierIndex = tierIndexForSeq(seq);

  let bgColors, ringColor, ringWidth, glow, species, fur, name, pricePoints = null, priceSoles = null, accessory = '';

  const expression = pick(rng, EXPRESSIONS);

  if (rarity === 'comun') {
    bgColors = pick(rng, BG_COMUN);
    ringColor = '#8b7355';
    ringWidth = 3;
    glow = false;
    species = pick(rng, COMUN_SPECIES);
    fur = pick(rng, COMUN_FUR);
    name = 'AR4 Bronce · ' + SPECIES_LABEL[species] + ' #' + pad(tierIndex, 3);
    pricePoints = 220;
  } else if (rarity === 'raro') {
    bgColors = pick(rng, BG_RARO);
    ringColor = '#c7cede';
    ringWidth = 4;
    glow = true;
    species = pick(rng, RARO_SPECIES);
    fur = pick(rng, RARO_FUR);
    if (chance(rng, 0.55)) accessory = pick(rng, ['bandana', 'shades']);
    name = 'AR4 Plata · ' + SPECIES_LABEL[species] + ' #' + pad(tierIndex, 3);
    priceSoles = 6;
  } else {
    bgColors = BG_LEGENDARIO;
    ringColor = 'url(#goldRing)';
    ringWidth = 5;
    glow = true;
    species = pick(rng, LEGENDARIO_SPECIES);
    fur = pick(rng, GOLD_FUR);
    accessory = 'crown';
    name = 'AR4 Oro · ' + SPECIES_LABEL[species] + ' #' + pad(tierIndex, 2);
    priceSoles = 18;
  }

  const bandanaColor = pick(rng, RARO_FUR);
  let bodyMarkup = SPECIES_FN[species](rng, fur);
  if (!NO_FACE_SPECIES.has(species)) {
    bodyMarkup += eyesMouth(rng, expression, 78, 122, 108);
  }
  if (accessory === 'bandana') bodyMarkup += accessoryBandana(rng, bandanaColor);
  else if (accessory === 'shades') bodyMarkup += accessoryShades(rng);
  else if (accessory === 'crown') bodyMarkup += accessoryCrown(rng);

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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>
<radialGradient id="bg" cx="35%" cy="30%" r="85%">
<stop offset="0%" stop-color="${bgColors[0]}"/>
<stop offset="100%" stop-color="${bgColors[1]}"/>
</radialGradient>
${(rarity === 'legendario' || accessory === 'crown') ? `<linearGradient id="goldRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${GOLD_LIGHT}"/><stop offset="45%" stop-color="${GOLD_ACCENT}"/><stop offset="100%" stop-color="${GOLD_DEEP}"/></linearGradient>` : ''}
${glow ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
</defs>
<circle cx="100" cy="100" r="96" fill="url(#bg)"/>
<g ${glow ? 'filter="url(#glow)"' : ''}>${bodyMarkup}</g>
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
