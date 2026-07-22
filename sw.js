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
