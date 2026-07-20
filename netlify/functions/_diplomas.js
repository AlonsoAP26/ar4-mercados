// AR4 Mercados — Lógica compartida del sistema de diplomas por programa.
// Un diploma se otorga al APROBAR un programa completo (no por módulo suelto):
//   - "basico": los 30 módulos gratuitos, con promedio de notas >= APROBADO_MIN.
//   - "institucional": los 50 módulos (30 + 20 Premium), mismo criterio.
// Las notas de los cuestionarios y el nombre verificado viven en el
// app_metadata de Netlify Identity (solo escribible por el servidor).

const APROBADO_MIN = 75;

// El espejo slug -> puntos vive en _module-points.js: lo regenera el generador
// de la academia automáticamente cuando cambia el catálogo de módulos.
const { MODULE_POINTS, PREMIUM_MODULE_POINTS } = require('./_module-points');

const FREE_SLUGS = Object.keys(MODULE_POINTS);
const PREMIUM_SLUGS = Object.keys(PREMIUM_MODULE_POINTS);
const ALL_SLUGS = [...FREE_SLUGS, ...PREMIUM_SLUGS];

// ID de certificado corto y determinista (usuario + programa): re-emitir
// siempre produce el mismo código, y el código no revela ningún dato.
function certId(userId, curso) {
  const s = String(userId) + '::programa::' + curso;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
  const pre = curso === 'institucional' ? 'INS' : 'BAS';
  return 'AR4-' + pre + '-' + h1.toString(16).toUpperCase().padStart(8, '0');
}

// Valida un nombre real: 2 a 6 palabras, solo letras (con tildes/ñ), sin números
// ni símbolos raros. Devuelve el nombre normalizado o null si no pasa.
function validName(raw) {
  const n = String(raw || '').trim().replace(/\s+/g, ' ');
  if (n.length < 7 || n.length > 60) return null;
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(n)) return null;
  const words = n.split(' ');
  if (words.length < 2 || words.length > 6) return null;
  if (words.some((w) => w.replace(/['-]/g, '').length < 2)) return null;
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Estado completo del alumno frente a los dos programas.
function computeStatus(appMeta, completedList) {
  const scores = (appMeta && appMeta.quiz_scores) || {};
  const completed = new Set(completedList || []);
  const freeDone = FREE_SLUGS.filter((s) => completed.has(s)).length;
  const premDone = PREMIUM_SLUGS.filter((s) => completed.has(s)).length;

  function avg(slugs) {
    const vals = slugs.map((s) => scores[s]).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  const notasFree = FREE_SLUGS.filter((s) => typeof scores[s] === 'number').length;
  const notasAll = ALL_SLUGS.filter((s) => typeof scores[s] === 'number').length;
  const promedioBasico = avg(FREE_SLUGS);
  const promedioInstitucional = avg(ALL_SLUGS);

  return {
    progreso: { freeDone, freeTotal: FREE_SLUGS.length, premDone, premTotal: PREMIUM_SLUGS.length },
    notas: { registradasFree: notasFree, registradasAll: notasAll, promedioBasico, promedioInstitucional },
    aprobadoMin: APROBADO_MIN,
    elegible: {
      basico: freeDone === FREE_SLUGS.length && notasFree === FREE_SLUGS.length && promedioBasico >= APROBADO_MIN,
      institucional: freeDone === FREE_SLUGS.length && premDone === PREMIUM_SLUGS.length &&
        notasAll === ALL_SLUGS.length && promedioInstitucional >= APROBADO_MIN
    }
  };
}

// --- Netlify Identity Admin (app_metadata: solo el servidor escribe aquí) ---
function getIdentity(context) {
  const id = context && context.clientContext && context.clientContext.identity;
  if (!id || !id.url || !id.token) return null;
  return id;
}

async function identityGetUser(identity, userId) {
  const res = await fetch(identity.url + '/admin/users/' + userId, {
    headers: { Authorization: 'Bearer ' + identity.token }
  });
  if (!res.ok) throw new Error('Identity GET ' + res.status);
  return res.json();
}

// GoTrue hace merge superficial de app_metadata: cada clave enviada reemplaza
// esa clave completa y las demás quedan intactas.
async function identityUpdateAppMeta(identity, userId, patch) {
  const res = await fetch(identity.url + '/admin/users/' + userId, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + identity.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_metadata: patch })
  });
  if (!res.ok) throw new Error('Identity PUT ' + res.status);
  return res.json();
}

async function identityListUsers(identity, maxPages) {
  const users = [];
  for (let page = 1; page <= (maxPages || 30); page++) {
    const res = await fetch(identity.url + '/admin/users?per_page=100&page=' + page, {
      headers: { Authorization: 'Bearer ' + identity.token }
    });
    if (!res.ok) throw new Error('Identity LIST ' + res.status);
    const data = await res.json();
    const batch = (data && data.users) || [];
    users.push(...batch);
    if (batch.length < 100) break;
  }
  return users;
}

module.exports = {
  APROBADO_MIN, MODULE_POINTS, PREMIUM_MODULE_POINTS, FREE_SLUGS, PREMIUM_SLUGS, ALL_SLUGS,
  certId, validName, computeStatus,
  getIdentity, identityGetUser, identityUpdateAppMeta, identityListUsers
};
