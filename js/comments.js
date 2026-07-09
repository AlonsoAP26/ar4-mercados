(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffH = Math.round(diffMs / 3600000);
    if (diffH < 1) return 'hace instantes';
    if (diffH < 24) return `hace ${diffH} h`;
    return `hace ${Math.round(diffH / 24)} d`;
  }

  function avatarHTML(profile) {
    if (profile.avatar_url) return `<img class="comment-avatar" src="${escapeHtml(profile.avatar_url)}" alt="">`;
    const initial = (profile.username || '?').charAt(0).toUpperCase();
    return `<span class="comment-avatar comment-avatar-color" style="background:${escapeHtml(profile.avatar_color || '#d4af37')};">${escapeHtml(initial)}</span>`;
  }

  function rankBadgeHTML(rank) {
    if (!rank || !RANK_LABELS[rank]) return '';
    return `<span class="rank-badge rank-${rank}">${RANK_LABELS[rank]}</span>`;
  }

  window.AR4_initComments = function (containerId, targetType, targetId) {
    const container = document.getElementById(containerId);
    if (!container || !targetId) return;

    async function loadComments() {
      container.innerHTML = '<p class="footer-text">Cargando comentarios...</p>';

      const { data: comments, error } = await sb
        .from('comments')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) {
        container.innerHTML = '<p class="footer-text">No se pudieron cargar los comentarios.</p>';
        return;
      }

      const profileIds = [...new Set((comments || []).map((c) => c.profile_id))];
      let profilesById = {};
      if (profileIds.length) {
        const filter = profileIds.map((id) => `"${id}"`).join(',');
        const { data: profiles } = await sb.from('profiles').select('id,username,avatar_color,avatar_url,rank').in('id', profileIds);
        profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      }

      const listHTML = (comments || []).map((c) => {
        const author = profilesById[c.profile_id] || { username: 'Usuario' };
        return `
          <div class="comment-row">
            ${avatarHTML(author)}
            <div class="comment-body">
              <div class="comment-head"><strong>${escapeHtml(author.username)}</strong>${rankBadgeHTML(author.rank)}<span class="comment-time">${timeAgo(c.created_at)}</span></div>
              <p>${escapeHtml(c.body)}</p>
            </div>
          </div>
        `;
      }).join('') || '<p class="footer-text">Todavía no hay comentarios. ¡Sé el primero en opinar!</p>';

      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      const formHTML = user
        ? `
          <div class="comment-form">
            <textarea id="commentInput_${containerId}" maxlength="600" placeholder="Escribe un comentario..."></textarea>
            <button class="btn btn-gold" id="commentSubmit_${containerId}">Comentar (+3 pts)</button>
            <div class="community-form-msg" id="commentMsg_${containerId}"></div>
          </div>
        `
        : `<p class="footer-text">Inicia sesión y crea tu perfil de comunidad para comentar. <a href="comunidad.html">Ir a Comunidad</a></p>`;

      container.innerHTML = `
        <div class="comments-list">${listHTML}</div>
        ${formHTML}
      `;

      const submitBtn = document.getElementById('commentSubmit_' + containerId);
      if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
          const input = document.getElementById('commentInput_' + containerId);
          const msgEl = document.getElementById('commentMsg_' + containerId);
          const text = input.value.trim();
          if (!text) return;
          submitBtn.disabled = true;
          msgEl.textContent = '';
          msgEl.className = 'community-form-msg';
          try {
            const jwt = await user.jwt();
            const res = await fetch('/.netlify/functions/community-comment-post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
              body: JSON.stringify({ targetType, targetId, body: text })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Error desconocido');
            await loadComments();
          } catch (e) {
            msgEl.textContent = e.message;
            msgEl.className = 'community-form-msg error';
            submitBtn.disabled = false;
          }
        });
      }
    }

    loadComments();
  };
})();
