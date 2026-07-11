(function () {
  const REACTIONS = [
    { emoji: '👍', label: 'Alcista' },
    { emoji: '👎', label: 'Bajista' },
    { emoji: '❤️', label: 'Me gusta' },
    { emoji: '🔥', label: 'Excelente cobertura' },
    { emoji: '🎯', label: 'Lo seguí' },
    { emoji: '🚀', label: 'Muy útil' },
    { emoji: '💡', label: 'Buen contexto' }
  ];

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function isLoggedIn() {
    return typeof netlifyIdentity !== 'undefined' && !!netlifyIdentity.currentUser();
  }

  function requireLogin() {
    if (typeof netlifyIdentity !== 'undefined') netlifyIdentity.open();
  }

  async function authHeaders() {
    if (!isLoggedIn()) return {};
    const jwt = await netlifyIdentity.currentUser().jwt();
    return { 'Authorization': 'Bearer ' + jwt };
  }

  function shareUrls(title, url) {
    const encUrl = encodeURIComponent(url);
    const encTitle = encodeURIComponent(title);
    return {
      whatsapp: `https://wa.me/?text=${encTitle}%20${encUrl}`,
      telegram: `https://t.me/share/url?url=${encUrl}&text=${encTitle}`,
      x: `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`
    };
  }

  window.AR4_initNoticiaSocial = async function (noticia) {
    const barWrap = document.getElementById('noticiaSocialBar');
    if (!barWrap) return;

    const targetType = 'noticia';
    const targetId = noticia.slug;
    const url = window.location.href.split('#')[0];
    const shares = shareUrls(noticia.title, url);

    let counts = {};
    let myReactions = [];
    let bookmarked = false;

    try {
      const headers = await authHeaders();
      const [reactRes, bmRes] = await Promise.all([
        fetch(`/.netlify/functions/target-react?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, { headers }),
        fetch(`/.netlify/functions/target-bookmark?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`, { headers })
      ]);
      const reactData = await reactRes.json();
      const bmData = await bmRes.json();
      if (reactData.success) { counts = reactData.counts; myReactions = reactData.myReactions || []; }
      if (bmData.success) bookmarked = bmData.bookmarked;
    } catch (e) { /* la barra social funciona igual sin conteos si falla la red */ }

    function reactionChip(r) {
      const active = myReactions.includes(r.emoji);
      const count = counts[r.emoji] || 0;
      return `<button class="reaction-chip ${active ? 'active' : ''}" data-emoji="${r.emoji}" title="${escapeHtml(r.label)}">${r.emoji} <span class="reaction-count">${count}</span></button>`;
    }

    function sentimentBarHTML() {
      const up = counts['👍'] || 0;
      const down = counts['👎'] || 0;
      const total = up + down;
      if (total < 3) return '';
      const pctUp = Math.round((up / total) * 100);
      const pctDown = 100 - pctUp;
      return `
        <div class="noticia-sentiment-row">
          <span class="noticia-sentiment-label">Sentimiento de lectores:</span>
          <div class="sentiment-pulse-bar" style="flex:1;min-width:120px;">
            <div class="sentiment-pulse-segment sentiment-seg-alcista" style="width:${pctUp}%;" title="Alcista ${pctUp}%"></div>
            <div class="sentiment-pulse-segment sentiment-seg-bajista" style="width:${pctDown}%;" title="Bajista ${pctDown}%"></div>
          </div>
          <span class="noticia-sentiment-pct">🟢 ${pctUp}% · 🔴 ${pctDown}%</span>
        </div>
      `;
    }

    function shareButtonsHTML() {
      return `
        <a href="${shares.whatsapp}" target="_blank" rel="noopener" class="share-btn" title="WhatsApp">📱</a>
        <a href="${shares.telegram}" target="_blank" rel="noopener" class="share-btn" title="Telegram">✈️</a>
        <a href="${shares.x}" target="_blank" rel="noopener" class="share-btn" title="X">𝕏</a>
        <a href="${shares.facebook}" target="_blank" rel="noopener" class="share-btn" title="Facebook">📘</a>
        <a href="${shares.linkedin}" target="_blank" rel="noopener" class="share-btn" title="LinkedIn">💼</a>
        <button class="share-btn" id="noticiaCopyLinkBtn" title="Copiar enlace">🔗</button>
      `;
    }

    barWrap.innerHTML = `
      <div class="glass-card idea-social-bar">
        <div class="reaction-row">${REACTIONS.map(reactionChip).join('')}</div>
        ${sentimentBarHTML()}
        <div class="idea-social-actions">
          <button class="btn btn-outline idea-bookmark-btn ${bookmarked ? 'active' : ''}" id="noticiaBookmarkBtn">${bookmarked ? '★ Guardado' : '☆ Guardar'}</button>
          <button class="btn btn-outline" id="noticiaAskAriaBtn">🤖 Consultar con IA</button>
          <button class="btn btn-outline" id="noticiaAudioBtn">🎧 Escuchar noticia</button>
          <div class="share-row">${shareButtonsHTML()}</div>
        </div>
      </div>
    `;

    async function onReactionClick(e) {
      const btn = e.currentTarget;
      if (!isLoggedIn()) { requireLogin(); return; }
      const emoji = btn.dataset.emoji;
      btn.disabled = true;
      try {
        const headers = await authHeaders();
        const res = await fetch('/.netlify/functions/target-react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ targetType, targetId, emoji })
        });
        const data = await res.json();
        if (data.success) {
          counts = data.counts; myReactions = data.myReactions || [];
          barWrap.querySelector('.reaction-row').innerHTML = REACTIONS.map(reactionChip).join('');
          const sentimentEl = barWrap.querySelector('.noticia-sentiment-row');
          if (sentimentEl) sentimentEl.outerHTML = sentimentBarHTML();
          wireReactionButtons();
        }
      } catch (e) { /* noop */ }
      btn.disabled = false;
    }

    function wireReactionButtons() {
      barWrap.querySelectorAll('.reaction-chip').forEach((btn) => btn.addEventListener('click', onReactionClick));
    }

    wireReactionButtons();

    const bookmarkBtn = document.getElementById('noticiaBookmarkBtn');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async () => {
        if (!isLoggedIn()) { requireLogin(); return; }
        bookmarkBtn.disabled = true;
        try {
          const headers = await authHeaders();
          const res = await fetch('/.netlify/functions/target-bookmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ targetType, targetId })
          });
          const data = await res.json();
          if (data.success) {
            bookmarked = data.bookmarked;
            bookmarkBtn.textContent = bookmarked ? '★ Guardado' : '☆ Guardar';
            bookmarkBtn.classList.toggle('active', bookmarked);
          }
        } catch (e) { /* noop */ }
        bookmarkBtn.disabled = false;
      });
    }

    const askAriaBtn = document.getElementById('noticiaAskAriaBtn');
    if (askAriaBtn) {
      askAriaBtn.addEventListener('click', () => {
        if (typeof window.AR4_askAriaAbout !== 'function') return;
        const plainBody = (noticia.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
        const contextStr = `Noticia: "${noticia.title}" (${noticia.category}). Resumen: ${noticia.excerpt || ''}. Contenido: ${plainBody}`;
        window.AR4_askAriaAbout(`Ayúdame a entender esta noticia: "${noticia.title}"`, contextStr);
      });
    }

    const audioBtn = document.getElementById('noticiaAudioBtn');
    if (audioBtn && 'speechSynthesis' in window) {
      audioBtn.addEventListener('click', () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          audioBtn.textContent = '🎧 Escuchar noticia';
          return;
        }
        const plainBody = (noticia.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const utterance = new SpeechSynthesisUtterance(`${noticia.title}. ${noticia.excerpt || ''}. ${plainBody}`);
        utterance.lang = 'es-ES';
        utterance.rate = 1;
        utterance.onend = () => { audioBtn.textContent = '🎧 Escuchar noticia'; };
        audioBtn.textContent = '⏸️ Detener audio';
        window.speechSynthesis.speak(utterance);
      });
    } else if (audioBtn) {
      audioBtn.remove();
    }

    const copyBtn = document.getElementById('noticiaCopyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
          copyBtn.textContent = '✅';
          setTimeout(() => { copyBtn.textContent = '🔗'; }, 1500);
        } catch (e) { /* noop */ }
      });
    }
  };
})();
