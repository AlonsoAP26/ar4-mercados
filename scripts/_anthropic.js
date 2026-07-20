// Cliente compartido de la API de Anthropic para todos los generadores.
//
// SIEMPRE en streaming: sin stream, una peticion con busqueda web o con
// pensamiento largo puede tardar mas de 5 minutos en devolver el primer byte
// y el fetch de Node la aborta a los 300s ("fetch failed"). Asi fallo el
// generador de noticias del 17 al 19/jul y el de psicotrading el 19/jul.
// Con stream:true los datos fluyen cada pocos segundos y ese tope de
// inactividad nunca se alcanza.

// Anotacion publica de GitHub Actions: los logs requieren sesion, pero las
// anotaciones ::error:: son visibles para cualquiera. Es la unica forma de
// diagnosticar un fallo en remoto sin token.
function makeFail(titulo) {
  return function fail(msg) {
    console.error(msg);
    console.log('::error title=' + titulo + '::' + String(msg).replace(/\r?\n/g, ' | ').slice(0, 600));
    process.exit(1);
  };
}

// Reconstruye el mensaje completo desde el flujo SSE de la API.
async function readSse(res) {
  const decoder = new TextDecoder();
  let buf = '';
  const content = [];
  const partialJson = {};
  let stopReason = null;
  let stopDetails = null;
  let usage = null;

  const handle = (ev) => {
    if (ev.type === 'error') {
      throw new Error('Error en el stream de la API: ' + JSON.stringify(ev.error || {}).slice(0, 300));
    } else if (ev.type === 'content_block_start') {
      content[ev.index] = ev.content_block;
      partialJson[ev.index] = '';
    } else if (ev.type === 'content_block_delta') {
      const b = content[ev.index];
      const d = ev.delta || {};
      if (d.type === 'text_delta') b.text = (b.text || '') + d.text;
      else if (d.type === 'thinking_delta') b.thinking = (b.thinking || '') + d.thinking;
      else if (d.type === 'signature_delta') b.signature = (b.signature || '') + d.signature;
      else if (d.type === 'input_json_delta') partialJson[ev.index] += d.partial_json;
      else if (d.type === 'citations_delta') { b.citations = b.citations || []; b.citations.push(d.citation); }
    } else if (ev.type === 'content_block_stop') {
      const b = content[ev.index];
      // El input de los tool_use llega como JSON parcial; se arma al cerrar el bloque.
      if (b && (b.type === 'tool_use' || b.type === 'server_tool_use')) {
        b.input = partialJson[ev.index] ? JSON.parse(partialJson[ev.index]) : (b.input || {});
      }
    } else if (ev.type === 'message_delta') {
      if (ev.delta && ev.delta.stop_reason) stopReason = ev.delta.stop_reason;
      if (ev.delta && ev.delta.stop_details) stopDetails = ev.delta.stop_details;
      if (ev.usage) usage = ev.usage;
    }
  };

  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of raw.split('\n')) {
        if (line.startsWith('data: ')) handle(JSON.parse(line.slice(6)));
      }
    }
  }
  return { content: content.filter(Boolean), stop_reason: stopReason, stop_details: stopDetails, usage };
}

// body: el cuerpo del request tal cual (model, max_tokens, thinking, tools,
// messages...); stream:true se añade aqui. Devuelve el mensaje ya armado con
// la misma forma que la respuesta sin streaming: {content, stop_reason, usage}.
// Reintenta hasta 4 veces ante 429/5xx/cortes de red; los 4xx no se insisten.
async function callApi(apiKey, body) {
  let lastErr = null;
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(Object.assign({}, body, { stream: true }))
      });
      if (res.ok) return await readSse(res);
      const errText = await res.text();
      lastErr = 'API de Anthropic (HTTP ' + res.status + '): ' + errText.slice(0, 400);
      console.warn('Intento ' + intento + ' fallido: ' + lastErr);
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      lastErr = 'Red/stream: ' + (e && e.message ? e.message : String(e));
      console.warn('Intento ' + intento + ' fallido: ' + lastErr);
    }
    if (intento < 4) await new Promise((r) => setTimeout(r, intento * 20000));
  }
  throw new Error(lastErr);
}

module.exports = { callApi, makeFail };
