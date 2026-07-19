// AR4 Mercados — Autocompletado universal de símbolos.
// Se engancha a cualquier input de símbolo del sitio y sugiere entre miles de
// instrumentos reales (acciones, divisas, cripto, índices, futuros) mientras
// escribes. Uso: AR4_attachSymbolSearch(inputEl, { onPick: (item) => {...} })
(function () {
  let activeDrop = null;

  function closeDrop() {
    if (activeDrop) { activeDrop.remove(); activeDrop = null; }
  }
  document.addEventListener('click', (e) => {
    if (activeDrop && !e.target.closest('.symsearch-drop') && !e.target.closest('.symsearch-input')) closeDrop();
  });

  window.AR4_attachSymbolSearch = function (input, opts) {
    if (!input || input.dataset.symsearch) return;
    input.dataset.symsearch = '1';
    input.classList.add('symsearch-input');
    input.setAttribute('autocomplete', 'off');
    const onPick = (opts && opts.onPick) || function () {};
    let timer = null;
    let lastQuery = '';

    function render(results) {
      closeDrop();
      if (!results.length) return;
      const drop = document.createElement('div');
      drop.className = 'symsearch-drop';
      drop.innerHTML = results.map((r, i) => `
        <button type="button" class="symsearch-item" data-i="${i}">
          <span class="symsearch-sym">${r.symbol}</span>
          <span class="symsearch-name">${(r.name || '').replace(/</g, '&lt;')}</span>
          <span class="symsearch-tag">${r.typeLabel}${r.exchange ? ' · ' + r.exchange : ''}</span>
        </button>`).join('');
      // Posicionar bajo el input, dentro de su contenedor relativo.
      const wrap = input.parentElement;
      if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
      wrap.appendChild(drop);
      drop.style.top = (input.offsetTop + input.offsetHeight + 6) + 'px';
      drop.style.left = input.offsetLeft + 'px';
      drop.style.minWidth = Math.min(input.offsetWidth, 420) + 'px';
      activeDrop = drop;
      drop.querySelectorAll('.symsearch-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = results[parseInt(btn.dataset.i, 10)];
          closeDrop();
          onPick(item);
        });
      });
    }

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (timer) clearTimeout(timer);
      if (q.length < 2) { closeDrop(); return; }
      timer = setTimeout(async () => {
        lastQuery = q;
        try {
          const res = await fetch('/.netlify/functions/symbol-search?q=' + encodeURIComponent(q));
          const data = await res.json();
          if (input.value.trim() !== lastQuery) return; // el usuario siguió escribiendo
          render((data && data.results) || []);
        } catch (e) { /* sin sugerencias; el input manual sigue funcionando */ }
      }, 280);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrop(); });
  };
})();
