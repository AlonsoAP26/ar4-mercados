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

  function linkifyMentions(text) {
    return escapeHtml(text).replace(/@([a-z0-9_]{3,24})/gi, '<span class="comment-mention">@$1</span>');
  }

  window.AR4_initComments = function (containerId, targetType, targetId) {
    const container = document.getElementById(containerId);
    if (!container || !targetId) return;

    function commentRowHTML(c, author, depth) {
      const canReply = typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser();
      return `
        <div class="comment-row" style="margin-left:${Math.min(depth, 4) * 26}px;" data-comment-id="${c.id}">
          ${avatarHTML(author)}
          <div class="comment-body">
            <div class="comment-head"><strong>${escapeHtml(author.username)}</strong>${rankBadgeHTML(author.rank)}<span class="comment-time">${timeAgo(c.created_at)}</span></div>
            <p>${linkifyMentions(c.body)}</p>
            ${canReply ? `<button class="comment-reply-btn" data-reply-to="${c.id}" data-reply-username="${escapeHtml(author.username)}">Responder</button>` : ''}
            <div class="comment-reply-form" id="replyForm_${containerId}_${c.id}" hidden></div>
          </div>
        </div>
      `;
    }

    function renderThread(byParent, parentKey, profilesById, depth) {
      const children = byParent[parentKey] || [];
      return children.map((c) => {
        const author = profilesById[c.profile_id] || { username: 'Usuario' };
        return commentRowHTML(c, author, depth) + renderThread(byParent, c.id, profilesById, depth + 1);
      }).join('');
    }

    function replyFormHTML(commentId, username) {
      return `
        <textarea id="replyInput_${containerId}_${commentId}" maxlength="600" placeholder="Responder...">@${username} </textarea>
        <button class="btn btn-outline reply-submit-btn" data-reply-submit="${commentId}" style="padding:6px 14px;font-size:0.78rem;">Responder (+3 pts)</button>
        <div class="community-form-msg" id="replyMsg_${containerId}_${commentId}"></div>
      `;
    }

    async function postComment(text, parentCommentId, msgEl, btn) {
      const user = netlifyIdentity.currentUser();
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-comment-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ targetType, targetId, body: text, parentCommentId })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        await loadComments();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
        btn.disabled = false;
      }
    }

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

      const byParent = {};
      (comments || []).forEach((c) => {
        const key = c.parent_comment_id || 'root';
        if (!byParent[key]) byParent[key] = [];
        byParent[key].push(c);
      });

      const listHTML = renderThread(byParent, 'root', profilesById, 0)
        || '<p class="footer-text">Todavía no hay comentarios. ¡Sé el primero en opinar!</p>';

      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      const formHTML = user
        ? `
          <div class="comment-form">
            <textarea id="commentInput_${containerId}" maxlength="600" placeholder="Escribe un comentario... (usa @usuario para mencionar)"></textarea>
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
        submitBtn.addEventListener('click', () => {
          const input = document.getElementById('commentInput_' + containerId);
          const msgEl = document.getElementById('commentMsg_' + containerId);
          const text = input.value.trim();
          if (!text) return;
          postComment(text, null, msgEl, submitBtn);
        });
      }

      container.querySelectorAll('.comment-reply-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const commentId = btn.dataset.replyTo;
          const username = btn.dataset.replyUsername;
          const formEl = document.getElementById(`replyForm_${containerId}_${commentId}`);
          if (!formEl) return;
          const isHidden = formEl.hasAttribute('hidden');
          container.querySelectorAll('.comment-reply-form').forEach((f) => f.setAttribute('hidden', ''));
          if (isHidden) {
            formEl.innerHTML = replyFormHTML(commentId, username);
            formEl.removeAttribute('hidden');
            const submitReplyBtn = formEl.querySelector('.reply-submit-btn');
            submitReplyBtn.addEventListener('click', () => {
              const replyInput = document.getElementById(`replyInput_${containerId}_${commentId}`);
              const replyMsg = document.getElementById(`replyMsg_${containerId}_${commentId}`);
              const text = replyInput.value.trim();
              if (!text) return;
              postComment(text, commentId, replyMsg, submitReplyBtn);
            });
          }
        });
      });
    }

    loadComments();
  };
})();
