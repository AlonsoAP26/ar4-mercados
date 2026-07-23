// AR4 Mercados — envío manual de una notificación push de prueba.
// Se dispara desde Actions ("Probar notificacion push" -> Run workflow) para
// comprobar que los avisos llegan al celular sin tener que esperar a que salga
// un titular importante. El aviso que se ve es el titular más reciente del
// Flash, igual que en un envío real.
const { avisarATodos } = require('./_webpush');
const { makeFail } = require('./_anthropic');

const fail = makeFail('Prueba de push');

async function main() {
  if (!process.env.VAPID_PRIVATE_KEY) fail('Falta el secreto VAPID_PRIVATE_KEY.');

  const r = await avisarATodos();

  if (r.total === 0) {
    console.log('::warning title=Prueba de push::No hay ninguna suscripcion guardada todavia. Entra a ar4mercados.com desde el celular y acepta las notificaciones antes de probar.');
    return;
  }

  console.log('Suscripciones: ' + r.total);
  console.log('Enviadas bien: ' + r.ok);
  console.log('Muertas borradas: ' + r.muertas);
  console.log('Con error: ' + r.errores);

  if (r.ok === 0) {
    fail('Ninguna notificacion salio. Enviadas=' + r.ok + ' errores=' + r.errores + ' muertas=' + r.muertas + '. Revisa que VAPID_PRIVATE_KEY sea la pareja de la clave publica del codigo.');
  }
  console.log('::notice title=Prueba de push::' + r.ok + ' de ' + r.total + ' notificaciones enviadas.');
}

main().catch((err) => { console.error(err); fail(String((err && err.message) || err)); });
