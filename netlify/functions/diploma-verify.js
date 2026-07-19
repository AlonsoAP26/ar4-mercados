const { getIdentity, identityListUsers } = require('./_diplomas');

// Verificación PÚBLICA de diplomas: cualquiera con el ID del certificado puede
// comprobar que el diploma es real, a nombre de quién se emitió, cuándo y con
// qué nota. Esto es lo que le da validez al diploma frente a terceros.
// GET ?cert=AR4-BAS-XXXXXXXX
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const cert = ((event.queryStringParameters && event.queryStringParameters.cert) || '').trim().toUpperCase();
  if (!/^AR4-(BAS|INS)-[0-9A-F]{8}$/.test(cert)) {
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true, valido: false, motivo: 'Formato de certificado inválido.' }) };
  }
  const identity = getIdentity(context);
  if (!identity) return { statusCode: 503, body: JSON.stringify({ success: false, error: 'Verificación no disponible en este momento.' }) };

  try {
    const users = await identityListUsers(identity);
    for (const u of users) {
      const dips = (u.app_metadata && u.app_metadata.diplomas) || {};
      for (const curso of Object.keys(dips)) {
        const d = dips[curso];
        if (d && d.cert === cert) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
            body: JSON.stringify({
              success: true, valido: true, curso,
              nombre: d.nombre, fecha: d.fecha, nota: d.nota
            })
          };
        }
      }
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
      body: JSON.stringify({ success: true, valido: false, motivo: 'No existe ningún diploma emitido con ese ID.' })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: String((e && e.message) || e) }) };
  }
};
