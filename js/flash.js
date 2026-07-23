// AR4 Mercados — Flash del mercado (frontend).
// Renderiza data/flash.json: titulares institucionales (@DeItaone) analizados
// por el agente de IA. Feed completo en flash.html (#flashFeed) y cinta
// compacta en Noticias (#flashStrip). Auto-refresca cada 60 s.
(function () {
  const feed = document.getElementById('flashFeed');
  const FEED_LIMIT = feed && feed.dataset.limit ? parseInt(feed.dataset.limit, 10) : 0;
  let showAll = false;
  const strip = document.getElementById('flashStrip');
  if (!feed && !strip) return;

  const IMP_DOT = { alto: 'sdot-r', medio: 'sdot-y', bajo: 'sdot-g' };
  const ESTADO_LBL = { confirmado: 'CONFIRMADO', rumor: 'RUMOR', 'no-verificable': 'NO VERIFICADO' };
  const ESTADO_CLS = { confirmado: 'fl-ok', rumor: 'fl-rumor', 'no-verificable': 'fl-nv' };
  let currentFilter = 'todas';
  let onlyHigh = false;

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return 'hace ' + m + ' min';
    const h = Math.round(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  // Icono SVG monocromo (regla de la casa: sin emojis en la UI).
  const BRK_ICON = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px;"><path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2z"/></svg>';

  function sesgoChip(s) {
    const cls = s.sesgo === 'alcista' ? 'fl-up' : s.sesgo === 'bajista' ? 'fl-dn' : 'fl-nt';
    const arrow = s.sesgo === 'alcista' ? '&#9650;' : s.sesgo === 'bajista' ? '&#9660;' : '&#9679;';
    return `<span class="fl-sesgo ${cls}">${arrow} ${esc(s.activo)}</span>`;
  }

  function cardHTML(it) {
    const dot = IMP_DOT[it.impacto] || 'sdot-n';
    const upd = (it.updates || []).length;
    return `
    <article class="fl-card${it.breaking ? ' fl-breaking' : ''}" data-cat="${esc(it.categoria)}" data-imp="${esc(it.impacto)}">
      <div class="fl-head">
        ${it.breaking ? '<span class="fl-brk">' + BRK_ICON + 'BREAKING</span>' : ''}
        <span class="fl-cat">${esc(it.categoria)}</span>
        <span class="fl-imp"><span class="sdot ${dot}"></span> impacto ${esc(it.impacto)}</span>
        <span class="fl-time">${timeAgo(it.actualizado || it.fecha)}</span>
      </div>
      <h3 class="fl-title">${esc(it.titulo)}</h3>
      ${upd ? `<div class="fl-update-tag">Nueva información disponible · ${upd} actualización${upd > 1 ? 'es' : ''}</div>` : ''}
      <p class="fl-resumen">${esc(it.resumen)}</p>
      <div class="fl-meta">
        <span class="fl-estado ${ESTADO_CLS[it.analisis && it.analisis.estado] || 'fl-nv'}">${ESTADO_LBL[it.analisis && it.analisis.estado] || 'NO VERIFICADO'}</span>
        <span class="fl-fuente">Fuente original: ${esc((it.analisis && it.analisis.fuenteOriginal) || 'no indicada')}</span>
        <span class="fl-vol">Volatilidad ${esc(it.volatilidad || '—')}</span>
        <span class="fl-score">${it.importancia || '—'}/10</span>
      </div>
      ${(it.sesgos || []).length ? `<div class="fl-sesgos">${it.sesgos.map(sesgoChip).join('')}</div>` : ''}
      <details class="fl-more">
        <summary>Análisis completo del agente</summary>
        <div class="fl-more-body">
          ${(it.updates || []).map((u) => `<div class="fl-upd"><strong>Actualización · ${timeAgo(u.fecha)}</strong><p>${esc(u.texto)}</p></div>`).join('')}
          <h4>Por qué importa</h4><p>${esc(it.analisis && it.analisis.porque)}</p>
          <h4>Qué ocurrió</h4><p>${esc(it.analisis && it.analisis.queOcurrio)}</p>
          ${it.reaccion ? `
            <h4>Lectura de mercado</h4>
            <ul class="fl-list">
              <li><b>Reacciona primero:</b> ${esc(it.reaccion.primero)}</li>
              <li><b>Después:</b> ${esc(it.reaccion.despues)}</li>
              <li><b>Escenarios que se vigilan:</b> ${esc(it.reaccion.escenarios)}</li>
              <li><b>Riesgos:</b> ${esc(it.reaccion.riesgos)}</li>
            </ul>` : ''}
          ${it.macro ? `
            <h4>Efecto macro por activo</h4>
            <div class="fl-macro">${Object.entries(it.macro).filter(([, v]) => v).map(([k, v]) => `<div><span>${esc(k.toUpperCase())}</span>${esc(v)}</div>`).join('')}</div>` : ''}
          ${(it.activos || []).length ? `<h4>Activos relacionados</h4><p class="fl-activos">${it.activos.map(esc).join(' · ')}</p>` : ''}
          <div class="fl-actions">
            <a class="btn btn-outline" href="${esc(it.tgUrl)}" target="_blank" rel="noopener">Ver titular original</a>
            <button class="btn btn-outline fl-copy" data-x="${esc(it.xText || '')}">Copiar para X</button>
          </div>
          <p class="fl-original">Titular recibido: “${esc(it.original)}” — Walter Bloomberg (@DeItaone), vía su canal público de Telegram.</p>
        </div>
      </details>
    </article>`;
  }

  function render(items) {
    if (strip) {
      const top = items.slice(0, 4);
      strip.innerHTML = top.length ? `
        <div class="fl-strip-head"><span class="fl-strip-live"><span class="sdot sdot-r"></span> FLASH DEL MERCADO</span><a href="flash.html" class="see-all">Ver todo →</a></div>
        <div class="fl-strip-row">${top.map((it) => `
          <a href="flash.html" class="fl-strip-item">
            ${it.breaking ? '<span class="fl-brk">' + BRK_ICON + '</span>' : `<span class="sdot ${IMP_DOT[it.impacto] || 'sdot-n'}"></span>`}
            <span class="fl-strip-title">${esc(it.titulo)}</span>
            <span class="fl-strip-time">${timeAgo(it.actualizado || it.fecha)}</span>
          </a>`).join('')}</div>` : '';
    }
    if (!feed) return;
    let list = items;
    if (currentFilter !== 'todas') list = list.filter((it) => it.categoria === currentFilter);
    if (onlyHigh) list = list.filter((it) => it.impacto === 'alto' || it.breaking);
    const total = list.length;
    if (FEED_LIMIT && !showAll) list = list.slice(0, FEED_LIMIT);
    feed.innerHTML = (list.length
      ? list.map(cardHTML).join('')
      : '<p class="footer-text">Sin titulares en este filtro todavía. El agente vigila el mercado cada 10 minutos en las aperturas de Londres y Nueva York, y publica en cuanto detecta noticias relevantes.</p>')
      + (FEED_LIMIT && !showAll && total > FEED_LIMIT ? '<button class="btn btn-outline btn-block fl-vermas">Ver los ' + total + ' flashes →</button>' : '');
    const vermas = feed.querySelector('.fl-vermas');
    if (vermas) vermas.addEventListener('click', () => { showAll = true; render(cache); });
    feed.querySelectorAll('.fl-copy').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.dataset.x); btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = 'Copiar para X'; }, 1600); }
        catch (e) { prompt('Copia el texto:', btn.dataset.x); }
      });
    });
  }

  let cache = [];
  async function load() {
    try {
      const res = await fetch('/.netlify/functions/flash-live');
      const data = await res.json();
      cache = data.items || [];
      // Orden cronológico garantizado también en el navegador (por si el
      // archivo viene de una corrida antigua sin ordenar).
      cache.sort((a, b) => new Date(b.actualizado || b.fecha) - new Date(a.actualizado || a.fecha));
      render(cache);
      const st = document.getElementById('flashStatus');
      if (st) st.textContent = 'Última revisión del agente: ' + (data.actualizado ? timeAgo(data.actualizado) : '—') + ' · se actualiza solo';
    } catch (e) {
      if (feed && !cache.length) feed.innerHTML = '<p class="footer-text">No se pudo cargar el flash. Reintentando…</p>';
    }
  }

  const filterBar = document.getElementById('flashFilters');
  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      if (chip.dataset.high != null) {
        onlyHigh = !onlyHigh;
        chip.classList.toggle('active', onlyHigh);
      } else {
        currentFilter = chip.dataset.cat;
        filterBar.querySelectorAll('.filter-chip[data-cat]').forEach((c) => c.classList.toggle('active', c === chip));
      }
      render(cache);
    });
  }

  load();
  setInterval(load, 20000);
})();
