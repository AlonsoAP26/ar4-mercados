// AR4 Mercados — Service Worker.
// Objetivo: que la web se pueda instalar como app y siga abriendo aunque el
// usuario se quede sin señal. Nada de contenido viejo servido como si fuera
// nuevo: las páginas y los datos van SIEMPRE a la red primero y el caché solo
// entra si la red falla.
// Al cambiar la estrategia, subir VERSION para limpiar los cachés anteriores.
const VERSION = 'ar4-v1';
const CACHE_PAGINAS = VERSION + '-paginas';
const CACHE_ESTATICOS = VERSION + '-estaticos';
const CACHE_DATOS = VERSION + '-datos';
const OFFLINE = '/offline.html';

// Rutas que el service worker NO debe tocar nunca: sesión, pagos y todo lo
// que dependa de la respuesta en vivo del servidor.
const NUNCA = [
  '/.netlify/functions/',
  '/.netlify/identity',
  '/admin.html'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_PAGINAS)
      .then((cache) => cache.addAll([OFFLINE, '/icons/icon-192.png']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((c) => c.indexOf(VERSION) !== 0).map((c) => caches.delete(c))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'SKIP_WAITING') self.skipWaiting();
});

function esEstatico(ruta) {
  return /\.(css|js|png|jpg|jpeg|svg|webp|woff2?|ico)$/i.test(ruta);
}

// Red primero, caché como red de emergencia.
// "clave" permite guardar bajo una URL limpia: los JSON se piden con ?cb=<hora>
// para evitar el caché del navegador, y sin esto cada visita dejaria una entrada
// nueva que nunca se vuelve a usar.
async function redPrimero(peticion, nombreCache, respaldo, clave) {
  const guardarEn = clave || peticion;
  try {
    const respuesta = await fetch(peticion);
    if (respuesta && respuesta.ok && respuesta.type === 'basic') {
      const copia = respuesta.clone();
      caches.open(nombreCache).then((cache) => cache.put(guardarEn, copia)).catch(() => {});
    }
    return respuesta;
  } catch (e) {
    const guardada = await caches.match(guardarEn);
    if (guardada) return guardada;
    if (respaldo) {
      const pagina = await caches.match(respaldo);
      if (pagina) return pagina;
    }
    throw e;
  }
}

// Sirve del caché al instante y refresca en segundo plano. Solo para archivos
// versionados (?v=N), donde un archivo viejo nunca se confunde con uno nuevo.
async function cacheYRefresco(peticion) {
  const cache = await caches.open(CACHE_ESTATICOS);
  const guardada = await cache.match(peticion);
  const enRed = fetch(peticion).then((respuesta) => {
    if (respuesta && respuesta.ok && respuesta.type === 'basic') cache.put(peticion, respuesta.clone());
    return respuesta;
  }).catch(() => null);
  return guardada || enRed || fetch(peticion);
}

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  let url;
  try { url = new URL(peticion.url); } catch (e) { return; }

  // Otros dominios (fuentes, Supabase, Identity, anuncios): que los maneje el navegador.
  if (url.origin !== self.location.origin) return;
  if (NUNCA.some((r) => url.pathname.indexOf(r) === 0)) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(redPrimero(peticion, CACHE_PAGINAS, OFFLINE));
    return;
  }

  if (url.pathname.indexOf('/data/') === 0) {
    evento.respondWith(redPrimero(peticion, CACHE_DATOS, null, url.origin + url.pathname));
    return;
  }

  if (esEstatico(url.pathname)) {
    evento.respondWith(cacheYRefresco(peticion));
  }
});

// ---------------------------------------------------------------------------
// Notificaciones push
// ---------------------------------------------------------------------------
// El servidor manda el aviso SIN contenido. Aquí se consulta el flash en vivo
// y se arma la notificación con el titular más reciente, así nunca llega un
// aviso con una noticia ya vieja.
const DESTINO_FLASH = '/noticias.html#flash';

async function armarNotificacion() {
  let titulo = 'AR4 Mercados';
  let cuerpo = 'Hay un titular importante moviendo el mercado.';
  let etiqueta = 'ar4-flash';

  try {
    const res = await fetch('/.netlify/functions/flash-live', { cache: 'no-store' });
    const datos = await res.json();
    const ultimo = (datos.items || [])[0];
    if (ultimo) {
      titulo = ultimo.breaking ? 'Última hora · AR4' : 'Flash del mercado · AR4';
      cuerpo = ultimo.pushText || ultimo.titulo || cuerpo;
      // Con la misma etiqueta, un segundo aviso del mismo titular reemplaza al
      // anterior en vez de apilarse.
      etiqueta = 'ar4-flash-' + ultimo.id;
    }
  } catch (e) { /* sin datos: se muestra el aviso genérico */ }

  return self.registration.showNotification(titulo, {
    body: cuerpo,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: etiqueta,
    renotify: false,
    data: { url: DESTINO_FLASH }
  });
}

self.addEventListener('push', (evento) => {
  // waitUntil es obligatorio: si no se muestra una notificación, el navegador
  // enseña por su cuenta un aviso genérico de "el sitio se actualizó".
  evento.waitUntil(armarNotificacion());
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || DESTINO_FLASH;
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      // Si la app ya está abierta, se reutiliza esa ventana en vez de abrir otra.
      for (const v of ventanas) {
        if (v.url.indexOf(self.location.origin) === 0 && 'focus' in v) {
          v.navigate(destino).catch(() => {});
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    })
  );
});
