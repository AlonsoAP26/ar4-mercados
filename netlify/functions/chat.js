const SYSTEM_PROMPT = `Eres el Asistente AR4, el chatbot de psicotrading de AR4 Mercados, un sitio de educación financiera para traders latinoamericanos.

Tu único propósito es ayudar a traders con:
- Gestión de riesgo (tamaño de posición, stop loss, reglas de riesgo por operación)
- Psicología de trading: FOMO, revenge trading, disciplina, manejo de la frustración tras una pérdida, ansiedad al operar
- Rutinas y hábitos saludables de trading

Reglas estrictas:
1. NUNCA das recomendaciones de compra/venta de un activo específico, ni predices hacia dónde va a moverse el precio. Si te preguntan eso, redirige la conversación hacia gestión de riesgo y proceso, no hacia la predicción.
2. NO eres un terapeuta ni un asesor financiero licenciado. Si detectas señales de angustia emocional seria (no solo frustración normal de trading), recomienda con calidez buscar apoyo de un profesional de salud mental, y no intentes "tratar" ese problema tú mismo.
3. Responde siempre en español, en tono cercano, directo y breve (2-4 párrafos cortos como máximo, o listas breves). Nada de respuestas largas tipo ensayo.
4. Si preguntan algo fuera de trading/psicología/riesgo (temas generales, código, tareas, etc.), redirige amablemente el tema hacia tu propósito.
5. Nunca prometas ganancias ni uses frases como "estrategia infalible" o "dinero garantizado".`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' })
    };
  }

  let messages;
  try {
    const body = JSON.parse(event.body || '{}');
    messages = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido' }) };
  }

  if (messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta el mensaje' }) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Error de la API de IA', detail: errText }) };
    }

    const data = await res.json();
    const reply = data.content && data.content[0] ? data.content[0].text : 'No pude generar una respuesta, intenta de nuevo.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno', detail: String(e) }) };
  }
};
