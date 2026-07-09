const BLOCKED_PATTERNS = [
  /\b(garantiz\w*\s+(ganancia|rentabilidad|retorno)\w*)\b/i,
  /\b(dinero\s+f[aá]cil|hazte\s+rico|gana\s+dinero\s+r[aá]pido)\b/i,
  /\b(wa\.me|t\.me|whatsapp\.com|telegram\.me)\b/i,
  /\b(idiota|estúpid[oa]|imbécil|maldit[oa]|hijo\s+de\s+puta|puto|puta|mierda)\b/i,
  /(.)\1{7,}/
];

function localFilterFlagged(text) {
  return BLOCKED_PATTERNS.some((re) => re.test(text));
}

async function aiModerationFlagged(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: `Eres un moderador de un chat de trading en español para AR4 Mercados. Responde EXCLUSIVAMENTE "SI" o "NO" (sin comillas, sin explicación).\n\n¿Este mensaje debería bloquearse por ser acoso, spam, promoción de un esquema financiero fraudulento, contenido sexual, discurso de odio, o un intento de sacar usuarios del chat hacia otra plataforma?\n\nMensaje: "${text.replace(/"/g, "'").slice(0, 500)}"`
        }]
      })
    });
    if (!res.ok) return false;
    const data = await res.json();
    const block = Array.isArray(data.content) ? data.content.find((b) => b.type === 'text') : null;
    return !!(block && block.text.trim().toUpperCase().startsWith('SI'));
  } catch (e) {
    return false;
  }
}

async function isFlagged(text) {
  if (!text || !text.trim()) return true;
  if (text.length > 500) return true;
  if (localFilterFlagged(text)) return true;
  return aiModerationFlagged(text);
}

module.exports = { isFlagged };
