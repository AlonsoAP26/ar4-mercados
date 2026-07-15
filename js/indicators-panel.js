// AR4 Mercados — Panel de indicadores técnicos propio.
//
// Sustituye al widget de Análisis Técnico de TradingView, que mostraba "Aquí
// todavía no existen datos" en cuanto el símbolo era un CFD (TVC:USOIL,
// FOREXCOM:*, CAPITALCOM:*). Aquello obligaba a ir mapeando símbolos a mano,
// uno por uno, cada vez que fallaba.
//
// Este panel se dibuja con el marketData que el generador ya guardó dentro del
// análisis: RSI, medias, ATR, soportes y resistencias reales, calculados sobre
// las velas de Yahoo. Al viajar dentro del JSON, NO PUEDE quedarse sin datos.
// El precio en vivo es un extra: si la red falla, el panel se muestra igual.

(function () {
  'use strict';

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // Formato español: 1.234,56
  function num(v) {
    if (v == null || !isFinite(v)) return '—';
    const abs = Math.abs(v);
    const dec = abs < 10 ? 4 : 2;
    return Number(v).toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function pct(v) {
    if (v == null || !isFinite(v)) return '—';
    return (v > 0 ? '+' : '') + Number(v).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + '%';
  }

  function cls(v) {
    if (v == null || !isFinite(v) || v === 0) return 'ind-flat';
    return v > 0 ? 'ind-up' : 'ind-down';
  }

  // Veredicto transparente: son reglas explícitas sobre datos reales, no una
  // "IA" opaca. Cada señal que suma se muestra al usuario para que la audite.
  function veredicto(d) {
    const señales = [];
    if (d.media50 != null && d.precio != null) {
      const alcista = d.precio > d.media50;
      señales.push({ ok: alcista, texto: 'Precio ' + (alcista ? 'por encima' : 'por debajo') + ' de la media de 50' });
    }
    if (d.media200 != null && d.precio != null) {
      const alcista = d.precio > d.media200;
      señales.push({ ok: alcista, texto: 'Precio ' + (alcista ? 'por encima' : 'por debajo') + ' de la media de 200' });
    }
    if (d.media50 != null && d.media200 != null) {
      const alcista = d.media50 > d.media200;
      señales.push({ ok: alcista, texto: 'Media de 50 ' + (alcista ? 'sobre' : 'bajo') + ' la de 200' });
    }
    if (d.rsi14 != null) {
      if (d.rsi14 >= 70) señales.push({ ok: false, texto: 'RSI en sobrecompra (' + num(d.rsi14) + ')' });
      else if (d.rsi14 <= 30) señales.push({ ok: true, texto: 'RSI en sobreventa (' + num(d.rsi14) + ')' });
      else señales.push({ ok: d.rsi14 > 50, texto: 'RSI ' + (d.rsi14 > 50 ? 'sobre' : 'bajo') + ' 50 (' + num(d.rsi14) + ')' });
    }
    const favor = señales.filter((s) => s.ok).length;
    const total = señales.length;
    let etiqueta = 'Neutral', clase = 'ind-flat';
    if (total) {
      const r = favor / total;
      if (r >= 0.75) { etiqueta = 'Sesgo alcista'; clase = 'ind-up'; }
      else if (r <= 0.25) { etiqueta = 'Sesgo bajista'; clase = 'ind-down'; }
      else if (r > 0.5) { etiqueta = 'Ligeramente alcista'; clase = 'ind-up'; }
      else if (r < 0.5) { etiqueta = 'Ligeramente bajista'; clase = 'ind-down'; }
    }
    return { etiqueta, clase, favor, total, señales };
  }

  function nivelesHTML(titulo, arr, claseColor) {
    if (!arr || !arr.length) {
      return '<div class="ind-levels"><span class="ind-levels-t ' + claseColor + '">' + titulo + '</span>' +
        '<span class="ind-levels-empty">sin pivote de referencia</span></div>';
    }
    return '<div class="ind-levels"><span class="ind-levels-t ' + claseColor + '">' + titulo + '</span>' +
      arr.map((v) => '<span class="ind-level">' + num(v) + '</span>').join('') + '</div>';
  }

  function render(container, d) {
    if (!container || !d) return;
    const v = veredicto(d);

    container.innerHTML =
      '<div class="ind-panel">' +
        '<div class="ind-head">' +
          '<div>' +
            '<h4>' + esc(d.nombre || d.symbol) + '</h4>' +
            '<span class="ind-sub">Indicadores calculados sobre el cierre de la vela diaria del ' +
              esc(d.fechaUltimaVela || '—') + ' · ' + esc(d.fuente || 'Yahoo Finance') + '</span>' +
          '</div>' +
          '<div class="ind-verdict ' + v.clase + '">' +
            '<strong>' + v.etiqueta + '</strong>' +
            '<span>' + v.favor + ' de ' + v.total + ' señales alcistas</span>' +
          '</div>' +
        '</div>' +

        '<div class="ind-live" id="indLive">' +
          '<span class="ind-live-label">Precio del análisis</span>' +
          '<span class="ind-live-price">' + num(d.precio) + '</span>' +
          '<span class="ind-live-chg ' + cls(d.variacionDiaPct) + '">' + pct(d.variacionDiaPct) + ' en el día</span>' +
        '</div>' +

        '<div class="ind-grid">' +
          cell('RSI (14)', num(d.rsi14), d.lecturaRsi, d.rsi14 == null ? 'ind-flat' : (d.rsi14 >= 70 ? 'ind-down' : d.rsi14 <= 30 ? 'ind-up' : 'ind-flat')) +
          cell('Media 50', num(d.media50), d.posicionVsMedia50 ? 'precio ' + d.posicionVsMedia50 : '', d.posicionVsMedia50 === 'por encima' ? 'ind-up' : d.posicionVsMedia50 ? 'ind-down' : 'ind-flat') +
          cell('Media 200', num(d.media200), d.posicionVsMedia200 ? 'precio ' + d.posicionVsMedia200 : '', d.posicionVsMedia200 === 'por encima' ? 'ind-up' : d.posicionVsMedia200 ? 'ind-down' : 'ind-flat') +
          cell('ATR (14)', num(d.atr14), 'rango medio diario', 'ind-flat') +
          cell('1 semana', pct(d.variacionSemanaPct), '', cls(d.variacionSemanaPct)) +
          cell('1 mes', pct(d.variacionMesPct), '', cls(d.variacionMesPct)) +
          cell('Máx. 52 sem.', num(d.maximo52sem), pct(d.distanciaAMaximo52semPct) + ' desde el precio', 'ind-flat') +
          cell('Mín. 52 sem.', num(d.minimo52sem), pct(d.distanciaAMinimo52semPct) + ' desde el precio', 'ind-flat') +
        '</div>' +

        nivelesHTML('Resistencias', d.resistencias, 'ind-down') +
        nivelesHTML('Soportes', d.soportes, 'ind-up') +

        (d.patronUltimaVela ? '<div class="ind-pattern"><strong>Última vela:</strong> ' + esc(d.patronUltimaVela) + '</div>' : '') +

        '<details class="ind-how">' +
          '<summary>Cómo se calcula este sesgo</summary>' +
          '<p>No es una predicción ni una recomendación: es el recuento de cuántas de estas condiciones objetivas se cumplen ahora mismo sobre datos reales de precio.</p>' +
          '<ul>' + v.señales.map((s) => '<li class="' + (s.ok ? 'ind-up' : 'ind-down') + '">' + esc(s.texto) + '</li>').join('') + '</ul>' +
          '<p>RSI de Wilder (14) y medias simples de 50 y 200 sesiones. Los soportes y resistencias son pivotes reales del gráfico (máximos y mínimos que superan a las 3 velas de cada lado), agrupados cuando están a menos de 0,4% entre sí.</p>' +
        '</details>' +
      '</div>';

    // Precio en vivo: extra opcional. Si falla, el panel ya está completo.
    actualizarPrecioEnVivo(container, d);
  }

  function cell(label, valor, nota, clase) {
    return '<div class="ind-cell">' +
      '<span class="ind-cell-l">' + esc(label) + '</span>' +
      '<span class="ind-cell-v ' + (clase || '') + '">' + valor + '</span>' +
      (nota ? '<span class="ind-cell-n">' + esc(nota) + '</span>' : '') +
      '</div>';
  }

  function yahooDe(d) {
    if (d.yahooSymbol) return d.yahooSymbol;
    // Análisis antiguos: el símbolo va dentro de "Yahoo Finance (CL=F)".
    const m = String(d.fuente || '').match(/\(([^)]+)\)/);
    return m ? m[1] : null;
  }

  function actualizarPrecioEnVivo(container, d) {
    const ysym = yahooDe(d);
    const box = container.querySelector('#indLive');
    if (!ysym || !box) return;
    fetch('/.netlify/functions/market-price?symbol=' + encodeURIComponent(ysym))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j || !j.success || typeof j.price !== 'number') return;
        const desde = d.precio != null ? ((j.price - d.precio) / d.precio) * 100 : null;
        box.innerHTML =
          '<span class="ind-live-label">Precio ahora <span class="ind-dot"></span></span>' +
          '<span class="ind-live-price">' + num(j.price) + '</span>' +
          '<span class="ind-live-chg ' + cls(j.changePct) + '">' + pct(j.changePct) + ' en el día</span>' +
          (desde != null ? '<span class="ind-live-since">' + pct(desde) + ' desde que se publicó el análisis (' + num(d.precio) + ')</span>' : '');
      })
      .catch(() => { /* sin conexión: se queda el precio del análisis, que es real igual */ });
  }

  window.AR4_renderIndicators = render;
})();
