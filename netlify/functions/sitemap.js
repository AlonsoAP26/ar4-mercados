// AR4 Mercados — sitemap.xml dinámico.
// Se sirve en /sitemap.xml (redirect en netlify.toml). Incluye las páginas
// fijas del sitio + TODAS las noticias, ideas y artículos de psicotrading
// leyendo los JSON publicados — así cada contenido nuevo del día entra al
// mapa solo, sin regenerar nada a mano.
const BASE = 'https://ar4mercados.com';

// Páginas fijas con su prioridad y frecuencia de cambio honesta.
const FIJAS = [
  ['', 'daily', '1.0'],
  ['noticias.html', 'hourly', '0.9'],
  ['comunidad.html', 'daily', '0.9'],
  ['educacion.html', 'weekly', '0.9'],
  ['ideas.html', 'daily', '0.8'],
  ['psicotrading.html', 'daily', '0.8'],
  ['brokers.html', 'weekly', '0.8'],
  ['fondeo.html', 'weekly', '0.7'],
  ['copytrading.html', 'weekly', '0.7'],
  ['herramientas.html', 'weekly', '0.7'],
  ['calendario.html', 'daily', '0.7'],
  ['membresia.html', 'weekly', '0.6'],
  ['nosotros.html', 'monthly', '0.5'],
  ['metodologia.html', 'monthly', '0.5'],
  ['verificar.html', 'monthly', '0.4'],
  ['terminos.html', 'yearly', '0.2'],
  ['privacidad.html', 'yearly', '0.2']
];

function url(loc, lastmod, changefreq, priority) {
  return '<url><loc>' + loc + '</loc>' +
    (lastmod ? '<lastmod>' + lastmod + '</lastmod>' : '') +
    (changefreq ? '<changefreq>' + changefreq + '</changefreq>' : '') +
    (priority ? '<priority>' + priority + '</priority>' : '') +
    '</url>';
}

function escapeXml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function articulos(ruta, pagina) {
  try {
    const res = await fetch(BASE + '/data/' + ruta);
    if (!res.ok) return [];
    const lista = await res.json();
    return lista
      .filter((a) => a && a.slug)
      .map((a) => url(
        BASE + '/' + pagina + '?slug=' + encodeURIComponent(a.slug).replace(/&/g, '%26'),
        (a.date || '').slice(0, 10) || null,
        null,
        '0.6'
      ));
  } catch (e) { return []; }
}

exports.handler = async () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const fijas = FIJAS.map(([p, freq, prio]) => url(BASE + '/' + p, hoy, freq, prio));
  const [noticias, ideas, psico, brokers] = await Promise.all([
    articulos('noticias.json', 'noticia.html'),
    articulos('ideas.json', 'idea.html'),
    articulos('articulos.json', 'articulo.html'),
    // Las reviews de brokers también son páginas indexables (broker.html?slug=X)
    articulos('brokers.json', 'broker.html')
  ]);

  const xml = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    fijas.join('') + noticias.join('') + ideas.join('') + psico.join('') + brokers.join('') +
    '</urlset>';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Cache de 1 hora en el CDN: fresco para Google, barato para Netlify.
      'Cache-Control': 'public, max-age=3600'
    },
    body: xml
  };
};
