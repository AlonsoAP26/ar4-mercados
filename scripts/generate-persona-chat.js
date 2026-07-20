// AR4 Mercados — Conversaciones de los personajes de la comunidad en el chat en vivo.
// Genera de vez en cuando (con probabilidad de saltarse la corrida, para que el ritmo
// se sienta orgánico) una charla corta entre 2-4 de los perfiles semilla ya existentes.
// Reglas duras: nunca señales de compra/venta, nunca promesas de rentabilidad,
// nunca precios exactos "actuales" que no podemos verificar.

const { callApi, makeFail } = require('./_anthropic');

const SKIP_PROBABILITY = 0.35;
const fail = makeFail('Generador del chat en vivo');

const PERSONAS = [
  { id: 'a0000000-0000-4000-8000-000000000001', username: 'ElNorteno_FX', voice: 'Trader de USD/MXN desde Monterrey, ~4 años de experiencia, swing trading, tono calmado y directo, da consejos de proceso sin presumir.' },
  { id: 'a0000000-0000-4000-8000-000000000002', username: 'LimaTrader', voice: 'Day trader de Lima, opera sol peruano, cobre y USD/COP, todavía aprendiendo gestión de riesgo, hace preguntas honestas y admite errores.' },
  { id: 'a0000000-0000-4000-8000-000000000003', username: 'CafetaleroBTC', voice: 'HODLer de Medellín, filosófico sobre Bitcoin, desconfía del trading de corto plazo en cripto, habla de ciclos y paciencia.' },
  { id: 'a0000000-0000-4000-8000-000000000004', username: 'PesoChileno_', voice: 'Swing trader chileno pendiente del IPC, el cobre y el Banco Central de Chile, aporta contexto macro local.' },
  { id: 'a0000000-0000-4000-8000-000000000005', username: 'BuenosAiresBull', voice: 'Argentino, humor seco sobre la inflación y el dólar, macro/posicional, relativiza todo comparándolo con la volatilidad argentina.' },
  { id: 'a0000000-0000-4000-8000-000000000006', username: 'GoldScalperPE', voice: 'Scalper peruano de oro y petróleo, mensajes cortos y al grano, habla de sesiones, spreads y disciplina.' },
  { id: 'a0000000-0000-4000-8000-000000000007', username: 'QuantMX', voice: 'Trader técnico/cuantitativo de Guadalajara, habla de backtesting, estadística y alertas, escéptico de la intuición.' },
  { id: 'a0000000-0000-4000-8000-000000000008', username: 'SoyBogotana', voice: 'Novata de Bogotá, hace las preguntas que todos los principiantes tienen, agradece las respuestas, cuenta su progreso en demo.' },
  { id: 'a0000000-0000-4000-8000-000000000009', username: 'ChileCobre', voice: 'Swing trader chileno enfocado en cobre y USD/CLP, comparte datos de la economía chilena con calma.' },
  { id: 'a0000000-0000-4000-8000-000000000010', username: 'ElitePeru88', voice: 'Day trader peruano fondeado con una prop firm, habla de reglas de drawdown, objetivos mensuales y presión psicológica del fondeo.' },
  { id: 'a0000000-0000-4000-8000-000000000011', username: 'FXVeteran_CL', voice: 'Más de una década en mercados, ahora también cripto, tono de mentor sin ser condescendiente, cuenta anécdotas de crisis pasadas.' }
];

const ROOMS = [
  { id: 'forex', label: 'Forex (pares de divisas, forex en general)', weight: 3 },
  { id: 'latam', label: 'LatAm (divisas y economía latinoamericana: USD/MXN, USD/COP, USD/CLP, USD/PEN, dólar blue, inflación)', weight: 2 },
  { id: 'commodities', label: 'Materias Primas (oro, petróleo, cobre)', weight: 2 },
  { id: 'acciones', label: 'Acciones (empresas, resultados corporativos)', weight: 1 },
  { id: 'indices', label: 'Índices (S&P 500, Nasdaq, Merval, IPSA, índices bursátiles)', weight: 1 },
  { id: 'cripto', label: 'Criptomonedas (Bitcoin, Ethereum, mercado cripto)', weight: 2 }
];

function pickWeighted(items) {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = Math.random() * total;
  for (const it of items) { r -= it.weight; if (r <= 0) return it; }
  return items[items.length - 1];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function supabaseRequest(supabaseUrl, supabaseKey, path, options) {
  const res = await fetch(supabaseUrl + '/rest/v1/' + path, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': 'Bearer ' + supabaseKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options && options.headers)
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error('Error de Supabase: ' + (data && data.message ? data.message : res.status));
  return data;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.SUPABASE_KEY;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  if (!apiKey || !supabaseUrl || !supabaseSecret) {
    fail('Faltan variables de entorno: ANTHROPIC_API_KEY, SUPABASE_KEY o SUPABASE_SECRET_KEY');
  }

  if (Math.random() < SKIP_PROBABILITY) {
    console.log('Corrida saltada al azar para mantener un ritmo orgánico. No se generó conversación.');
    return;
  }

  const room = pickWeighted(ROOMS);
  const participantCount = 2 + Math.floor(Math.random() * 3); // 2-4
  const participants = shuffle(PERSONAS).slice(0, participantCount);

  const recent = await supabaseRequest(supabaseUrl, supabaseSecret,
    'chat_messages?room_id=eq.' + room.id + '&select=body&order=created_at.desc&limit=12', { method: 'GET' });
  const recentBodies = recent.map((m) => '- ' + m.body).join('\n');

  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Genera una conversación corta y natural de chat entre traders latinoamericanos en la sala "${room.label}" de un foro de trading en español. Hoy es ${today}.

PARTICIPANTES (usa EXACTAMENTE estos usernames, con sus personalidades):
${participants.map((p) => `- ${p.username}: ${p.voice}`).join('\n')}

TEMAS RECIENTES DE LA SALA (no repitas estas conversaciones, continúa con algo distinto):
${recentBodies || '(sala sin mensajes recientes)'}

REGLAS ESTRICTAS:
- Registro de CHAT informal real: mensajes cortos (máximo ~110 caracteres), minúsculas frecuentes, algún "jaja" ocasional, sin emojis en exceso (máximo 1 en toda la conversación).
- NUNCA señales de compra/venta ("compren", "entren en", "vendan"), NUNCA promesas de rentabilidad, NUNCA precios exactos presentados como el precio actual del mercado.
- Los temas válidos: proceso, psicología, gestión de riesgo, sesiones de mercado, anécdotas, preguntas de novato, herramientas, macro general sin cifras precisas del día.
- La conversación debe fluir: cada mensaje responde o continúa al anterior, no son monólogos sueltos.
- Entre 4 y 7 mensajes en total. No todos los participantes deben hablar la misma cantidad de veces.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin \`\`\`), con esta forma exacta:
{
  "messages": [
    { "username": "uno de los usernames listados", "body": "texto del mensaje" }
  ]
}`;

  // callApi hace streaming (evita el timeout de 300s del fetch de Node) y
  // reintenta 429/5xx/cortes de red.
  const data = await callApi(apiKey, {
    model: 'claude-sonnet-5',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }]
  });
  const textBlock = Array.isArray(data.content) ? data.content.find((b) => b.type === 'text') : null;
  if (!textBlock) { fail('Respuesta sin bloque de texto. stop_reason=' + data.stop_reason + ' uso=' + JSON.stringify(data.usage)); }

  let convo;
  try {
    convo = JSON.parse(textBlock.text.trim());
  } catch (e) {
    console.error(textBlock.text.slice(0, 1200));
    fail('La IA no devolvió un JSON válido. stop_reason=' + data.stop_reason);
  }

  const byUsername = Object.fromEntries(PERSONAS.map((p) => [p.username, p.id]));
  const messages = (convo.messages || [])
    .filter((m) => byUsername[m.username] && m.body && String(m.body).trim().length >= 2)
    .slice(0, 7)
    .map((m) => ({ profile_id: byUsername[m.username], body: String(m.body).trim().slice(0, 160) }));

  if (messages.length < 3) {
    fail('La conversación generada quedó demasiado corta, no se inserta nada.');
  }

  // Los mensajes se fechan hacia atrás desde ahora, con 2-5 minutos entre cada uno,
  // para que la conversación se lea como algo que acaba de pasar.
  let cursor = Date.now();
  const timestamps = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    timestamps[i] = new Date(cursor).toISOString();
    cursor -= (2 + Math.random() * 3) * 60 * 1000;
  }

  const rows = messages.map((m, i) => ({ room_id: room.id, profile_id: m.profile_id, body: m.body, created_at: timestamps[i] }));
  await supabaseRequest(supabaseUrl, supabaseSecret, 'chat_messages', { method: 'POST', body: JSON.stringify(rows) });

  console.log(`Conversación de ${messages.length} mensajes insertada en la sala "${room.id}" (${participants.map((p) => p.username).join(', ')}).`);
}

main().catch((err) => {
  console.error(err);
  fail(err && err.message ? err.message : String(err));
});
