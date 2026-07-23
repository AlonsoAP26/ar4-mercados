// AR4 Mercados — envío de notificaciones push del navegador (Web Push / RFC 8292).
//
// Sin librerías externas: el repo no usa npm install en Actions, así que la
// firma VAPID se hace con el módulo crypto de Node.
//
// Se envía un push SIN contenido ("tickle"). El service worker, al recibirlo,
// consulta el flash en vivo y arma la notificación con el titular más reciente.
// Así el aviso nunca queda desfasado y no hace falta implementar el cifrado
// aes128gcm del contenido.
const crypto = require('crypto');

// Clave pública VAPID. Es pública a propósito (va también en js/push.js).
// Si algún día se regenera el par de claves, hay que cambiarla EN LOS DOS SITIOS
// y todos los usuarios tendrán que volver a aceptar las notificaciones.
const VAPID_PUBLICA = 'BPglGx8q0Ka3i3k2c3DeQnvM2k2xpLiycMGDN1WdXUbc4uW7CAlcj-Zio_1X8G7TcufxpMBzZczDo0U76Cge3Pc';
const VAPID_SUBJECT = 'https://ar4mercados.com';

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeB64url(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

// Reconstruye la clave privada a partir del secreto (d) y de la clave pública
// (de donde salen las coordenadas x e y del punto de la curva).
function clavePrivada() {
  const secreto = process.env.VAPID_PRIVATE_KEY;
  if (!secreto) throw new Error('Falta VAPID_PRIVATE_KEY');
  const pub = desdeB64url(VAPID_PUBLICA);
  if (pub.length !== 65) throw new Error('La clave pública VAPID no mide 65 bytes');
  return crypto.createPrivateKey({
    key: {
      kty: 'EC',
      crv: 'P-256',
      x: b64url(pub.subarray(1, 33)),
      y: b64url(pub.subarray(33, 65)),
      d: secreto.trim()
    },
    format: 'jwk'
  });
}

// Token que demuestra al servicio de push (Google, Mozilla, Apple) que el
// envío viene de AR4 y no de un tercero.
function tokenVapid(audiencia, clave) {
  const cabecera = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const cuerpo = b64url(JSON.stringify({
    aud: audiencia,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT
  }));
  // dsaEncoding ieee-p1363 devuelve la firma como r|s (64 bytes), que es lo
  // que pide ES256. Por defecto Node la daría en DER y el servicio la rechaza.
  const firma = crypto.sign('sha256', Buffer.from(cabecera + '.' + cuerpo), {
    key: clave,
    dsaEncoding: 'ieee-p1363'
  });
  return cabecera + '.' + cuerpo + '.' + b64url(firma);
}

// Envía el aviso a UNA suscripción. Devuelve el código HTTP del servicio.
async function enviarAUno(endpoint, clave) {
  const audiencia = new URL(endpoint).origin;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'vapid t=' + tokenVapid(audiencia, clave) + ', k=' + VAPID_PUBLICA,
      'TTL': '3600',
      'Urgency': 'high',
      'Content-Length': '0'
    }
  });
  return res.status;
}

async function supabase(ruta, opciones) {
  const url = process.env.SUPABASE_KEY;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Faltan SUPABASE_KEY / SUPABASE_SECRET_KEY');
  const res = await fetch(url + '/rest/v1/' + ruta, {
    ...opciones,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(opciones && opciones.headers) }
  });
  const texto = await res.text();
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + texto.slice(0, 200));
  return texto ? JSON.parse(texto) : null;
}

// Avisa a todas las suscripciones guardadas y limpia las que ya no existen
// (el navegador se desinstaló, el usuario revocó el permiso, etc.).
// Devuelve un resumen para el log de Actions.
async function avisarATodos() {
  const clave = clavePrivada();
  const subs = await supabase('push_subscriptions?select=id,endpoint&limit=2000', { method: 'GET' });
  if (!subs.length) return { total: 0, ok: 0, muertas: 0, errores: 0 };

  let ok = 0, muertas = 0, errores = 0;
  const aBorrar = [];

  // De 25 en 25 para no abrir cientos de conexiones a la vez.
  for (let i = 0; i < subs.length; i += 25) {
    const lote = subs.slice(i, i + 25);
    await Promise.all(lote.map(async (s) => {
      try {
        const estado = await enviarAUno(s.endpoint, clave);
        if (estado === 201 || estado === 200 || estado === 202) { ok++; return; }
        // 404/410: la suscripción ya no existe. 403: clave VAPID que no coincide.
        if (estado === 404 || estado === 410) { muertas++; aBorrar.push(s.id); return; }
        errores++;
        console.warn('Push devolvió ' + estado + ' para ' + s.endpoint.slice(0, 60) + '...');
      } catch (e) {
        errores++;
        console.warn('Push falló (no fatal):', e.message);
      }
    }));
  }

  for (const id of aBorrar) {
    try { await supabase('push_subscriptions?id=eq.' + id, { method: 'DELETE' }); } catch (e) { /* da igual */ }
  }

  return { total: subs.length, ok, muertas, errores };
}

module.exports = { avisarATodos, VAPID_PUBLICA };
