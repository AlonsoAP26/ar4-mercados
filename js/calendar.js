// AR4 Mercados — Calendario económico propio, en español y con el tema del sitio.
// Datos en vivo vía /.netlify/functions/economic-calendar (feed de ForexFactory/faireconomy).
(function () {
  const rootEl = document.getElementById('ar4Calendar');
  if (!rootEl) return;

  const CURRENCY_LABEL = {
    USD: '🇺🇸 EE.UU.', EUR: '🇪🇺 Eurozona', GBP: '🇬🇧 R. Unido', JPY: '🇯🇵 Japón',
    CAD: '🇨🇦 Canadá', AUD: '🇦🇺 Australia', NZD: '🇳🇿 N. Zelanda', CHF: '🇨🇭 Suiza',
    CNY: '🇨🇳 China', MXN: '🇲🇽 México', BRL: '🇧🇷 Brasil'
  };

  const IMPACT_LABEL = { High: { es: 'Alto', cls: 'high' }, Medium: { es: 'Medio', cls: 'medium' }, Low: { es: 'Bajo', cls: 'low' } };

  // Traducción de los eventos recurrentes más comunes. Los que no estén aquí
  // mantienen su nombre en inglés pero con los sufijos traducidos (m/m, y/y...).
  const EVENT_MAP = [
    [/core cpi/i, 'IPC subyacente (inflación sin alimentos ni energía)'],
    [/\bcpi\b/i, 'IPC — Índice de Precios al Consumidor (inflación)'],
    [/core ppi/i, 'IPP subyacente (precios al productor)'],
    [/\bppi\b/i, 'IPP — Índice de Precios al Productor'],
    [/core pce/i, 'PCE subyacente (inflación preferida de la Fed)'],
    [/\bpce\b/i, 'PCE — Gasto de Consumo Personal'],
    [/non-?farm employment change|non-?farm payrolls|nfp/i, 'Nóminas no agrícolas (NFP) — empleo de EE.UU.'],
    [/unemployment rate/i, 'Tasa de desempleo'],
    [/average hourly earnings/i, 'Salario promedio por hora'],
    [/adp non-?farm/i, 'Empleo privado ADP (adelanto del NFP)'],
    [/unemployment claims|jobless claims/i, 'Solicitudes de subsidio por desempleo'],
    [/retail sales/i, 'Ventas minoristas'],
    [/core retail sales/i, 'Ventas minoristas subyacentes'],
    [/\bgdp\b/i, 'PIB — Producto Interno Bruto'],
    [/federal funds rate|interest rate decision|official cash rate|cash rate|main refinancing rate|bank rate|overnight rate|rate statement|deposit facility rate/i, 'Decisión de tasa de interés'],
    [/monetary policy report|monetary policy statement/i, 'Informe de política monetaria'],
    [/inflation expectations/i, 'Expectativas de inflación'],
    [/philly fed|philadelphia fed/i, 'Índice manufacturero de la Fed de Filadelfia'],
    [/fomc statement/i, 'Comunicado del FOMC (Fed)'],
    [/fomc meeting minutes|monetary policy meeting minutes|mpc.*minutes/i, 'Minutas de política monetaria'],
    [/fomc press conference|press conference/i, 'Conferencia de prensa del banco central'],
    [/fomc member.*speaks|member.*speaks|.*speaks$/i, 'Discurso de un miembro del banco central'],
    [/powell speaks|fed chair/i, 'Discurso del presidente de la Fed'],
    [/\bpmi\b/i, 'PMI — Índice de Gerentes de Compras'],
    [/manufacturing pmi/i, 'PMI manufacturero'],
    [/services pmi/i, 'PMI de servicios'],
    [/ism manufacturing/i, 'ISM manufacturero'],
    [/ism services/i, 'ISM de servicios'],
    [/consumer confidence|consumer sentiment/i, 'Confianza del consumidor'],
    [/consumer credit/i, 'Crédito al consumo'],
    [/building permits/i, 'Permisos de construcción'],
    [/housing starts/i, 'Inicios de construcción de viviendas'],
    [/durable goods orders/i, 'Pedidos de bienes duraderos'],
    [/trade balance/i, 'Balanza comercial'],
    [/industrial production/i, 'Producción industrial'],
    [/federal budget balance/i, 'Balance del presupuesto federal'],
    [/crude oil inventories/i, 'Inventarios de petróleo crudo'],
    [/business confidence|business optimism/i, 'Confianza empresarial'],
    [/nfib/i, 'Optimismo de pequeñas empresas (NFIB)'],
    [/redbook/i, 'Ventas minoristas Redbook (semanal)'],
    [/wage/i, 'Salarios'],
    [/empire state/i, 'Índice manufacturero Empire State (Nueva York)']
  ];

  function translateEvent(title) {
    for (const [re, es] of EVENT_MAP) { if (re.test(title)) return es; }
    // Traducir sufijos comunes si no hay match completo.
    let t = title
      .replace(/\bPrelim(inary)?\b/gi, 'Preliminar')
      .replace(/\bFlash\b/gi, 'Preliminar')
      .replace(/\bFinal\b/gi, 'Final')
      .replace(/\bMonthly\b/gi, 'Mensual')
      .replace(/\bManufacturing\b/gi, 'manufacturero')
      .replace(/\bServices\b/gi, 'de servicios')
      .replace(/\bm\/m\b/gi, '(mensual)')
      .replace(/\by\/y\b/gi, '(anual)')
      .replace(/\bq\/q\b/gi, '(trimestral)')
      .replace(/\bMoM\b/g, '(mensual)')
      .replace(/\bYoY\b/g, '(anual)')
      .replace(/\bIndex\b/gi, 'Índice')
      .replace(/\bSpeaks\b/gi, '— discurso');
    return t;
  }

  function impactWeight(imp) { return imp === 'High' ? 3 : imp === 'Medium' ? 2 : 1; }

  function fmtTime(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    // "Todo el día" cuando la hora es 23:01 o similar (marcador del feed)
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function dayKey(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function isToday(dateStr) {
    const d = new Date(dateStr); const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  let allEvents = [];
  let currentFilter = 'high'; // high | all

  function render() {
    const events = currentFilter === 'high'
      ? allEvents.filter((e) => e.impact === 'High' || e.impact === 'Medium')
      : allEvents;

    if (!events.length) {
      rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">No hay eventos para mostrar con este filtro.</p>';
      return;
    }

    const byDay = {};
    events.forEach((e) => { const k = dayKey(e.date); (byDay[k] = byDay[k] || []).push(e); });

    let html = '';
    Object.keys(byDay).forEach((day) => {
      html += `<div class="ecal-day">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
      byDay[day].forEach((e) => {
        const imp = IMPACT_LABEL[e.impact] || IMPACT_LABEL.Low;
        const cur = CURRENCY_LABEL[e.country] || e.country;
        const esName = translateEvent(e.title);
        const showOriginal = esName !== e.title;
        html += `
          <div class="ecal-row ecal-imp-${imp.cls}${isToday(e.date) ? ' ecal-today' : ''}">
            <div class="ecal-time">${fmtTime(e.date)}</div>
            <div class="ecal-cur">${cur}</div>
            <div class="ecal-impact"><span class="ecal-dot ecal-dot-${imp.cls}"></span>${imp.es}</div>
            <div class="ecal-event"><strong>${escapeHtml(esName)}</strong>${showOriginal ? `<span class="ecal-orig">${escapeHtml(e.title)}</span>` : ''}</div>
            <div class="ecal-vals">
              <div><span>Previsión</span><strong>${e.forecast || '—'}</strong></div>
              <div><span>Anterior</span><strong>${e.previous || '—'}</strong></div>
              <div><span>Actual</span><strong class="${actualClass(e)}">${e.actual || '·'}</strong></div>
            </div>
          </div>`;
      });
    });

    rootEl.innerHTML = html;
  }

  function actualClass(e) {
    // Colorea el dato real vs. la previsión (verde si superó, rojo si quedó por debajo).
    const a = parseNum(e.actual), f = parseNum(e.forecast);
    if (a === null || f === null) return '';
    if (a > f) return 'ecal-up';
    if (a < f) return 'ecal-down';
    return '';
  }
  function parseNum(v) {
    if (!v) return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? null : n;
  }
  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  function wireFilters() {
    const bar = document.getElementById('ecalFilters');
    if (!bar) return;
    bar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-ecal-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.ecalFilter;
      bar.querySelectorAll('[data-ecal-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  }

  async function load() {
    rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">Cargando calendario económico...</p>';
    try {
      const res = await fetch('/.netlify/functions/economic-calendar');
      const data = await res.json();
      if (!data.success || !Array.isArray(data.events)) throw new Error('respuesta inválida');
      allEvents = data.events
        .filter((e) => e && e.date && e.title)
        .sort((a, b) => new Date(a.date) - new Date(b.date) || impactWeight(b.impact) - impactWeight(a.impact));
      render();
    } catch (e) {
      rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">No se pudo cargar el calendario en este momento. Recarga la página en unos segundos.</p>';
    }
  }

  wireFilters();
  load();
})();
