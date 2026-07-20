// AR4 Mercados — Regeneración TOTAL de la academia (30 gratuitos + 20 Premium).
// Lee scripts/academia-plan.json (el plan de estudios diseñado módulo a módulo),
// genera cada clase con IA en archivos *-v2.json y, cuando las 50 están listas,
// hace el CAMBIO COMPLETO en un solo paso: reemplaza los catálogos vivos y
// regenera el mapa de puntos del servidor. Reanudable: si se corta, la próxima
// corrida continúa donde quedó. Sin módulos a medias en la web en ningún momento.
//
// Reglas de la casa en el prompt: nada inventado (casos históricos famosos y
// verificables, sin estadísticas fabricadas), sin promesas de rentabilidad,
// sin señales; formato visual EXACTO de la academia actual.
const fs = require('fs');
const path = require('path');

const PLAN = require('./academia-plan.json');
const DATA = path.join(__dirname, '..', 'data');
const V2_FREE = path.join(DATA, 'educacion-v2.json');
const V2_PREM = path.join(DATA, 'educacion-premium-v2.json');
const LIVE_FREE = path.join(DATA, 'educacion.json');
const LIVE_PREM = path.join(DATA, 'educacion-premium.json');
const POINTS_FILE = path.join(__dirname, '..', 'netlify', 'functions', '_module-points.js');
const MAX_POR_CORRIDA = parseInt(process.env.MAX_MODULOS || '12', 10);

function loadJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; }
}

async function callApi(apiKey, prompt) {
  let lastErr = null;
  for (let intento = 1; intento <= 4; intento++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        // 24000: el pensamiento del modelo comparte este tope con la respuesta;
        // con 16000 las clases mas largas salian cortadas y fallaban la validacion.
        max_tokens: 24000,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.stop_reason === 'max_tokens') throw new Error('Respuesta cortada por max_tokens');
      return data;
    }
    lastErr = 'HTTP ' + res.status + ': ' + (await res.text()).slice(0, 300);
    console.warn('  intento ' + intento + ' fallido: ' + lastErr);
    if ((res.status === 429 || res.status >= 500) && intento < 4) {
      await new Promise((r) => setTimeout(r, intento * 20000));
      continue;
    }
    break;
  }
  throw new Error(lastErr);
}

function extractJson(data) {
  const blocks = Array.isArray(data.content) ? data.content.filter((b) => b.type === 'text' && b.text) : [];
  if (!blocks.length) throw new Error('Respuesta sin texto');
  let raw = blocks[blocks.length - 1].text.trim();
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) raw = fence[1].trim();
  if (!raw.startsWith('{')) {
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    if (a !== -1 && b > a) raw = raw.slice(a, b + 1);
  }
  return JSON.parse(raw);
}

function buildPrompt(mod, esPremium, contexto) {
  const seccionesExtra = esPremium
    ? `- <div class='inst-case'><h4>Caso real de mercado</h4>...</div> : un caso HISTÓRICO FAMOSO y verificable narrado con detalle (fechas y hechos conocidos públicamente; JAMÁS cifras inventadas).
- <h3>Checklist profesional</h3> con <ul> accionable.
- <h3>Ejercicio práctico</h3> : tarea concreta que el alumno hace esta semana.
- <h3>Resumen ejecutivo</h3> : 1 párrafo denso + <ul> de puntos clave.`
    : `- <h3>Caso real de mercado</h3> : un evento HISTÓRICO FAMOSO y verificable narrado en simple (fechas y hechos públicos; JAMÁS cifras inventadas).
- <h3>Resumen y puntos clave</h3> : párrafo breve + <ul>.`;

  return `Eres el director académico de AR4 Mercados, academia de trading en español para Latinoamérica con reputación de honestidad total ("sin humo"). Escribes la clase ${mod.order} de la ruta ${esPremium ? 'INSTITUCIONAL PREMIUM (nivel profesional: el alumno ya domina técnico, riesgo y psicología)' : 'GRATUITA (lleva de cero absoluto a nivel profesional; el alumno solo sabe lo visto en módulos anteriores)'}.

MÓDULO A ESCRIBIR
Título: ${mod.title}
Temario obligatorio (desarrolla TODOS los puntos, en este orden):
${mod.temario.map((t, i) => (i + 1) + '. ' + t).join('\n')}
Herramienta AR4 a integrar al final: ${mod.herramienta}
${contexto}

NIVEL DE CALIDAD: clase de academia premium de pago, comparable a FTMO Academy, Babypips School, CME Institute o los libros de Douglas/Brooks/Steenbarger/Bellafiore según el tema. Redacción ORIGINAL (nunca copies), profunda, con números y ejemplos CONCRETOS trabajados paso a paso. Extensión del body: ${esPremium ? '1800-2600' : '1400-2200'} palabras. Español latino claro, tuteo, profesional y cercano.

REGLAS INNEGOCIABLES DE LA MARCA
- NADA inventado: cero estadísticas fabricadas, cero estudios sin nombre, cero "el 90% de los traders...". Casos reales solo eventos famosos verificables (crisis 2008, SNB 2015, GameStop 2021, COVID marzo 2020, LTCM, Knight Capital, Barings, etc. según corresponda al tema).
- CERO promesas de rentabilidad, cero señales de compra/venta. Enseñas el mecanismo y el proceso, no "cómo hacerte rico".
- Sé honesto con las limitaciones de cada técnica (tasa de fallo, cuándo NO funciona).

FORMATO HTML EXACTO del body (atributos SIEMPRE con comillas simples, nunca dobles):
1. <div class='edu-hook'><h3>¿Por qué te importa esto?</h3><p>gancho de 3-4 frases con una escena o dato real que enganche</p></div>
2. <div class='edu-goals'><h3>Al terminar este módulo podrás…</h3><ul><li>3-4 logros concretos y medibles</li></ul></div>
3. Desarrollo del temario: una sección <h3> por punto del temario (usa exactamente los temas dados), con <p> ricos, <ul>/<ol> donde aporte, <strong> para términos clave, y ejemplos numéricos completos (ej: "con $5,000 y riesgo del 1%...").
4. OPCIONAL (máximo 1, solo si de verdad ilustra): un diagrama SVG simple envuelto en <div class='edu-diagram'><svg viewBox='0 0 560 240' xmlns='http://www.w3.org/2000/svg'>...</svg></div> — solo paths/líneas/círculos/texto corto, colores #f0c75e #2ecc71 #e05252 #8b93a7, fuente JetBrains Mono, texto en español, SIN desbordar el viewBox.
${seccionesExtra}
5. <h3>Errores comunes</h3> con <ul> (errores REALES y específicos del tema, incluidos los de traders con experiencia).
6. <h3>Consejos profesionales</h3> con <ul>.
7. <h3>Preguntas de repaso</h3> con <ol> de 3 preguntas abiertas (sin respuesta).
8. <div class='edu-apply'><h3>Aplícalo hoy en AR4</h3><p>acción concreta usando: ${mod.herramienta}</p></div>

RESPONDE EXCLUSIVAMENTE un JSON válido (sin markdown, comillas dobles solo como delimitadores JSON):
{
  "excerpt": "resumen vendedor y honesto de 1-2 frases (máx 180 caracteres)",
  "body": "TODO el HTML de la clase en una sola cadena",${esPremium ? '' : '\n  "bodySimple": "versión sencilla de la MISMA clase para principiantes absolutos: 500-800 palabras, mismo tema, solo <h3>/<p>/<ul>, lenguaje de explicárselo a un amigo, sin las clases CSS especiales",'}
  "quiz": [5 preguntas de evaluación que cubran lo esencial del módulo, formato {"q":"pregunta","options":["a","b","c"],"correct":0|1|2} — la correcta en posición aleatoria, distractores plausibles]
}`;
}

function validar(out, esPremium) {
  if (!out || typeof out.body !== 'string' || out.body.length < 4000) throw new Error('body demasiado corto');
  if (!out.excerpt || typeof out.excerpt !== 'string') throw new Error('sin excerpt');
  if (!esPremium && (typeof out.bodySimple !== 'string' || out.bodySimple.length < 1200)) throw new Error('bodySimple insuficiente');
  if (!Array.isArray(out.quiz) || out.quiz.length !== 5) throw new Error('quiz debe tener 5 preguntas');
  for (const q of out.quiz) {
    if (!q.q || !Array.isArray(q.options) || q.options.length !== 3 || ![0, 1, 2].includes(q.correct)) throw new Error('pregunta de quiz inválida');
  }
  const abre = (out.body.match(/<div/g) || []).length, cierra = (out.body.match(/<\/div>/g) || []).length;
  if (abre !== cierra) throw new Error('HTML desbalanceado: ' + abre + ' <div> vs ' + cierra + ' </div>');
}

function maybeSwap(v2Free, v2Prem) {
  if (v2Free.length !== PLAN.free.length || v2Prem.length !== PLAN.premium.length) return false;
  v2Free.sort((a, b) => a.order - b.order);
  v2Prem.sort((a, b) => a.order - b.order);
  fs.writeFileSync(LIVE_FREE, JSON.stringify(v2Free, null, 2) + '\n');
  fs.writeFileSync(LIVE_PREM, JSON.stringify(v2Prem, null, 2) + '\n');

  // Mapa de puntos del servidor (validación de diplomas) regenerado del plan.
  const lineas = [
    '// GENERADO por scripts/generate-academia.js — no editar a mano.',
    '// Espejo slug -> puntos de los catálogos de la academia (validación server-side).',
    'const MODULE_POINTS = {'
  ];
  PLAN.free.forEach((m) => lineas.push("  '" + m.slug + "': " + m.points + ','));
  lineas.push('};', '', 'const PREMIUM_MODULE_POINTS = {');
  PLAN.premium.forEach((m) => lineas.push("  '" + m.slug + "': " + m.points + ','));
  lineas.push('};', '', 'module.exports = { MODULE_POINTS, PREMIUM_MODULE_POINTS };', '');
  fs.writeFileSync(POINTS_FILE, lineas.join('\n'));

  fs.unlinkSync(V2_FREE);
  fs.unlinkSync(V2_PREM);
  console.log('*** CAMBIO COMPLETO REALIZADO: academia nueva en vivo (30 + 20 módulos) ***');
  return true;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('Falta ANTHROPIC_API_KEY'); process.exit(1); }

  const v2Free = loadJson(V2_FREE, []);
  const v2Prem = loadJson(V2_PREM, []);
  const hechosF = new Set(v2Free.map((m) => m.slug));
  const hechosP = new Set(v2Prem.map((m) => m.slug));

  // Si los v2 ya no existen y los vivos son el plan nuevo, no hay nada que hacer.
  const liveFree = loadJson(LIVE_FREE, []);
  if (!fs.existsSync(V2_FREE) && liveFree.length && liveFree[0].slug === PLAN.free[0].slug) {
    console.log('La academia nueva ya está en vivo. Nada que generar.');
    return;
  }

  const pendientes = [
    ...PLAN.free.filter((m) => !hechosF.has(m.slug)).map((m) => ({ ...m, esPremium: false })),
    ...PLAN.premium.filter((m) => !hechosP.has(m.slug)).map((m) => ({ ...m, esPremium: true }))
  ];

  if (!pendientes.length) {
    maybeSwap(v2Free, v2Prem);
    return;
  }
  console.log('Pendientes: ' + pendientes.length + ' | en esta corrida: ' + Math.min(MAX_POR_CORRIDA, pendientes.length));

  for (const mod of pendientes.slice(0, MAX_POR_CORRIDA)) {
    const lista = mod.esPremium ? PLAN.premium : PLAN.free;
    const idx = lista.findIndex((x) => x.slug === mod.slug);
    const prev = lista.slice(Math.max(0, idx - 2), idx).map((x) => x.title).join(' | ') || '(es el primero)';
    const next = lista[idx + 1] ? lista[idx + 1].title : '(es el último)';
    const contexto = 'Módulos anteriores (apóyate en ellos, no los repitas): ' + prev + '\nMódulo siguiente (prepara el terreno sin adelantarlo): ' + next;

    console.log('Generando [' + (mod.esPremium ? 'PREMIUM ' : '') + mod.order + '] ' + mod.title + '...');
    try {
      const data = await callApi(apiKey, buildPrompt(mod, mod.esPremium, contexto));
      const out = extractJson(data);
      validar(out, mod.esPremium);
      const registro = {
        slug: mod.slug, order: mod.order, level: mod.level,
        ...(mod.esPremium ? { premium: true } : {}),
        title: mod.title, excerpt: out.excerpt.slice(0, 200), points: mod.points,
        quiz: out.quiz,
        ...(mod.esPremium ? {} : { bodySimple: out.bodySimple }),
        body: out.body
      };
      if (mod.esPremium) { v2Prem.push(registro); fs.writeFileSync(V2_PREM, JSON.stringify(v2Prem, null, 2) + '\n'); }
      else { v2Free.push(registro); fs.writeFileSync(V2_FREE, JSON.stringify(v2Free, null, 2) + '\n'); }
      console.log('  OK (' + out.body.length + ' caracteres)');
    } catch (e) {
      console.error('  FALLO en ' + mod.slug + ': ' + (e.message || e) + ' — se reintentará en la próxima corrida');
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  const fDone = loadJson(V2_FREE, []), pDone = loadJson(V2_PREM, []);
  console.log('Progreso: gratuitos ' + fDone.length + '/' + PLAN.free.length + ' · premium ' + pDone.length + '/' + PLAN.premium.length);
  if (fDone.length === PLAN.free.length && pDone.length === PLAN.premium.length) maybeSwap(fDone, pDone);
}

main().catch((err) => { console.error(err); process.exit(1); });
