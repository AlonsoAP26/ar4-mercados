(function () {
  const REACTIONS = [
    { emoji: '👍', label: 'Alcista' },
    { emoji: '👎', label: 'Bajista' },
    { emoji: '❤️', label: 'Me gusta' },
    { emoji: '🔥', label: 'Excelente análisis' },
    { emoji: '🎯', label: 'Lo seguí' },
    { emoji: '🚀', label: 'Muy útil' },
    { emoji: '💡', label: 'Buena idea' }
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

  window.AR4_initSocial = async function (idea) {
    const barWrap = document.getElementById('ideaSocialBar');
    const stickyWrap = document.getElementById('ideaStickyPanel');
    if (!barWrap) return;

    const targetType = 'idea';
    const targetId = idea.slug;
    const url = window.location.href.split('#')[0];
    const shares = shareUrls(idea.title, url);

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

    function shareButtonsHTML() {
      return `
        <a href="${shares.whatsapp}" target="_blank" rel="noopener" class="share-btn" title="WhatsApp">📱</a>
        <a href="${shares.telegram}" target="_blank" rel="noopener" class="share-btn" title="Telegram">✈️</a>
        <a href="${shares.x}" target="_blank" rel="noopener" class="share-btn" title="X">𝕏</a>
        <a href="${shares.facebook}" target="_blank" rel="noopener" class="share-btn" title="Facebook">📘</a>
        <a href="${shares.linkedin}" target="_blank" rel="noopener" class="share-btn" title="LinkedIn">💼</a>
        <button class="share-btn" id="ideaCopyLinkBtn" title="Copiar enlace">🔗</button>
      `;
    }

    barWrap.innerHTML = `
      <div class="glass-card idea-social-bar">
        <div class="reaction-row">${REACTIONS.map(reactionChip).join('')}</div>
        <div class="idea-social-actions">
          <button class="btn btn-outline idea-bookmark-btn ${bookmarked ? 'active' : ''}" id="ideaBookmarkBtn">${bookmarked ? '★ Guardado' : '☆ Guardar'}</button>
          <button class="btn btn-outline" id="ideaAskAriaBtn"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='6' y='7' width='12' height='11' rx='2.5'/><path d='M12 7V4M9 3.5h6M9.5 12h.01M14.5 12h.01M9.5 15.5h5M3 11v3M21 11v3'/></svg> Consultar con IA</button>
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
          wireReactionButtons();
        }
      } catch (e) { /* noop */ }
      btn.disabled = false;
    }

    function wireReactionButtons() {
      barWrap.querySelectorAll('.reaction-chip').forEach((btn) => btn.addEventListener('click', onReactionClick));
    }

    wireReactionButtons();

    const bookmarkBtn = document.getElementById('ideaBookmarkBtn');
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

    const askAriaBtn = document.getElementById('ideaAskAriaBtn');
    if (askAriaBtn) {
      askAriaBtn.addEventListener('click', () => {
        if (typeof window.AR4_askAriaAbout !== 'function') return;
        const plainBody = (idea.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);
        const contextStr = `Análisis: "${idea.title}" (${idea.category}${idea.symbol ? ', ' + idea.symbol : ''}). Resumen: ${idea.excerpt || ''}. Contenido: ${plainBody}`;
        window.AR4_askAriaAbout(`Ayúdame a entender este análisis: "${idea.title}"`, contextStr);
      });
    }

    const copyBtn = document.getElementById('ideaCopyLinkBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(url);
          copyBtn.textContent = '✔';
          setTimeout(() => { copyBtn.textContent = '🔗'; }, 1500);
        } catch (e) { /* noop */ }
      });
    }

    if (stickyWrap) {
      stickyWrap.innerHTML = `
        <button class="sticky-action-btn" data-scroll="ideaSocialBar" title="Reaccionar">❤️</button>
        <button class="sticky-action-btn" data-scroll="commentsSection" title="Comentar">💬</button>
        <button class="sticky-action-btn" id="ideaStickyBookmark" title="Guardar">${bookmarked ? '★' : '☆'}</button>
        <button class="sticky-action-btn" data-scroll="ideaSocialBar" title="Compartir">📤</button>
      `;
      stickyWrap.querySelectorAll('[data-scroll]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = document.getElementById(btn.dataset.scroll);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
      const stickyBookmark = document.getElementById('ideaStickyBookmark');
      if (stickyBookmark) stickyBookmark.addEventListener('click', () => bookmarkBtn && bookmarkBtn.click());
    }
  };
})();
