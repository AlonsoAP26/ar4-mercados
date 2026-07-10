(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };
  const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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

  function verifiedBadgeHTML(profile) {
    return profile && profile.verified ? '<span class="verified-badge" title="Cuenta verificada por AR4">✔</span>' : '';
  }

  function linkifyMentions(text) {
    return escapeHtml(text).replace(/@([a-z0-9_]{3,24})/gi, '<span class="comment-mention">@$1</span>');
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.AR4_initComments = function (containerId, targetType, targetId) {
    const container = document.getElementById(containerId);
    if (!container || !targetId) return;

    let sortMode = 'recientes';
    let myProfileId = null;
    let likeCounts = {};
    let myLikes = new Set();
    let pendingImageFile = null;

    async function getMyProfileId() {
      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      if (!user) return null;
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/community-profile', { headers: { 'Authorization': 'Bearer ' + jwt } });
        const data = await res.json();
        return data.success && data.profile ? data.profile.id : null;
      } catch (e) { return null; }
    }

    function commentRowHTML(c, author, depth) {
      const canReply = typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser();
      const isOwn = myProfileId && c.profile_id === myProfileId;
      const liked = myLikes.has(c.id);
      const likeCount = likeCounts[c.id] || 0;
      const imgHTML = c.image_url ? `<img class="comment-image" src="${escapeHtml(c.image_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">` : '';
      const editedHTML = c.edited_at ? '<span class="comment-edited"> (editado)</span>' : '';

      return `
        <div class="comment-row" style="margin-left:${Math.min(depth, 4) * 26}px;" data-comment-id="${c.id}">
          ${avatarHTML(author)}
          <div class="comment-body">
            <div class="comment-head"><strong>${escapeHtml(author.username)}</strong>${verifiedBadgeHTML(author)}${rankBadgeHTML(author.rank)}<span class="comment-time">${timeAgo(c.created_at)}${editedHTML}</span></div>
            <div class="comment-text" data-comment-text="${c.id}"><p>${linkifyMentions(c.body)}</p>${imgHTML}</div>
            <div class="comment-actions-row">
              <button class="comment-like-btn ${liked ? 'active' : ''}" data-like="${c.id}">❤️ <span class="like-count">${likeCount}</span></button>
              ${canReply ? `<button class="comment-reply-btn" data-reply-to="${c.id}" data-reply-username="${escapeHtml(author.username)}">Responder</button>` : ''}
              ${isOwn ? `<button class="comment-edit-btn" data-edit="${c.id}">Editar</button><button class="comment-delete-btn" data-delete="${c.id}">Eliminar</button>` : ''}
              ${canReply && !isOwn ? `<button class="comment-report-btn" data-report="${c.id}">Reportar</button>` : ''}
            </div>
            <div class="comment-reply-form" id="replyForm_${containerId}_${c.id}" hidden></div>
          </div>
        </div>
      `;
    }

    function renderThread(byParent, parentKey, profilesById, depth) {
      let children = byParent[parentKey] || [];
      if (parentKey === 'root' && sortMode === 'populares') {
        children = [...children].sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
      } else if (parentKey === 'root' && sortMode === 'verificados') {
        children = [...children].sort((a, b) => {
          const av = (profilesById[a.profile_id] || {}).verified ? 1 : 0;
          const bv = (profilesById[b.profile_id] || {}).verified ? 1 : 0;
          return bv - av;
        });
      }
      return children.map((c) => {
        const author = profilesById[c.profile_id] || { username: 'Usuario' };
        return commentRowHTML(c, author, depth) + renderThread(byParent, c.id, profilesById, depth + 1);
      }).join('');
    }

    function replyFormHTML(commentId, username) {
      return `
        <textarea id="replyInput_${containerId}_${commentId}" maxlength="600" placeholder="Responder...">@${username} </textarea>
        <div class="comment-attach-row">
          <button type="button" class="comment-attach-btn" data-attach-for="${commentId}">📷 Adjuntar imagen</button>
          <input type="file" class="comment-image-input" id="replyImageInput_${containerId}_${commentId}" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          <span class="comment-attach-name" id="replyImageName_${containerId}_${commentId}"></span>
        </div>
        <button class="btn btn-outline reply-submit-btn" data-reply-submit="${commentId}" style="padding:6px 14px;font-size:0.78rem;">Responder (+3 pts)</button>
        <div class="community-form-msg" id="replyMsg_${containerId}_${commentId}"></div>
      `;
    }

    async function postComment(text, parentCommentId, msgEl, btn, imageFile) {
      const user = netlifyIdentity.currentUser();
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const jwt = await user.jwt();
        let imageBase64 = null;
        let imageType = null;
        if (imageFile) {
          if (imageFile.size > MAX_IMAGE_BYTES) throw new Error('La imagen no puede pesar más de 4 MB.');
          imageBase64 = await fileToBase64(imageFile);
          imageType = imageFile.type;
        }
        const res = await fetch('/.netlify/functions/community-comment-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ targetType, targetId, body: text, parentCommentId, imageBase64, imageType })
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

    async function toggleLike(commentId, btn) {
      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      if (!user) { netlifyIdentity.open(); return; }
      btn.disabled = true;
      try {
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/comment-like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ commentId })
        });
        const data = await res.json();
        if (data.success) {
          likeCounts[commentId] = data.count;
          if (data.liked) myLikes.add(commentId); else myLikes.delete(commentId);
          btn.classList.toggle('active', data.liked);
          btn.querySelector('.like-count').textContent = data.count;
        }
      } catch (e) { /* noop */ }
      btn.disabled = false;
    }

    async function deleteComment(commentId) {
      if (!window.confirm('¿Eliminar este comentario?')) return;
      const user = netlifyIdentity.currentUser();
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/comment-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
        body: JSON.stringify({ commentId })
      });
      const data = await res.json();
      if (data.success) await loadComments();
    }

    async function reportComment(commentId, btn) {
      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      if (!user) { netlifyIdentity.open(); return; }
      btn.disabled = true;
      btn.textContent = 'Reportado';
      try {
        const jwt = await user.jwt();
        await fetch('/.netlify/functions/comment-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ commentId })
        });
      } catch (e) { /* noop */ }
    }

    function startEdit(commentId, currentText) {
      const textEl = document.querySelector(`[data-comment-text="${commentId}"]`);
      if (!textEl) return;
      textEl.innerHTML = `
        <textarea class="comment-edit-input" id="editInput_${commentId}" maxlength="600">${escapeHtml(currentText)}</textarea>
        <button class="btn btn-gold comment-edit-save" data-edit-save="${commentId}" style="padding:5px 12px;font-size:0.76rem;">Guardar</button>
        <button class="btn btn-outline comment-edit-cancel" data-edit-cancel="${commentId}" style="padding:5px 12px;font-size:0.76rem;">Cancelar</button>
        <div class="community-form-msg" id="editMsg_${commentId}"></div>
      `;
      document.getElementById(`editInput_${commentId}`).focus();
    }

    async function saveEdit(commentId) {
      const input = document.getElementById(`editInput_${commentId}`);
      const msgEl = document.getElementById(`editMsg_${commentId}`);
      const text = input.value.trim();
      if (!text) return;
      try {
        const user = netlifyIdentity.currentUser();
        const jwt = await user.jwt();
        const res = await fetch('/.netlify/functions/comment-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
          body: JSON.stringify({ commentId, body: text })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');
        await loadComments();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      }
    }

    async function loadComments() {
      container.innerHTML = '<p class="footer-text">Cargando comentarios...</p>';
      myProfileId = await getMyProfileId();

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

      const commentIds = (comments || []).map((c) => c.id);
      likeCounts = {};
      myLikes = new Set();
      if (commentIds.length) {
        const { data: likes } = await sb.from('comment_likes').select('comment_id,profile_id').in('comment_id', commentIds);
        (likes || []).forEach((l) => {
          likeCounts[l.comment_id] = (likeCounts[l.comment_id] || 0) + 1;
          if (myProfileId && l.profile_id === myProfileId) myLikes.add(l.comment_id);
        });
      }

      const profileIds = [...new Set((comments || []).map((c) => c.profile_id))];
      let profilesById = {};
      if (profileIds.length) {
        const { data: profiles } = await sb.from('profiles').select('id,username,avatar_color,avatar_url,rank,verified').in('id', profileIds);
        profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      }

      const byParent = {};
      (comments || []).forEach((c) => {
        const key = c.parent_comment_id || 'root';
        if (!byParent[key]) byParent[key] = [];
        byParent[key].push(c);
      });

      const totalCount = (comments || []).length;
      const sortBarHTML = totalCount > 1 ? `
        <div class="comments-sort-bar">
          <button class="sort-chip ${sortMode === 'recientes' ? 'active' : ''}" data-sort="recientes">Más recientes</button>
          <button class="sort-chip ${sortMode === 'populares' ? 'active' : ''}" data-sort="populares">Más populares</button>
          <button class="sort-chip ${sortMode === 'verificados' ? 'active' : ''}" data-sort="verificados">Analistas verificados</button>
        </div>
      ` : '';

      const listHTML = renderThread(byParent, 'root', profilesById, 0)
        || '<p class="footer-text">Todavía no hay comentarios. ¡Sé el primero en opinar!</p>';

      const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
      const formHTML = user
        ? `
          <div class="comment-form">
            <textarea id="commentInput_${containerId}" maxlength="600" placeholder="Escribe un comentario... (usa @usuario para mencionar)"></textarea>
            <div class="comment-attach-row">
              <button type="button" class="comment-attach-btn" id="commentAttachBtn_${containerId}">📷 Adjuntar imagen</button>
              <input type="file" class="comment-image-input" id="commentImageInput_${containerId}" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
              <span class="comment-attach-name" id="commentImageName_${containerId}"></span>
            </div>
            <button class="btn btn-gold" id="commentSubmit_${containerId}">Comentar (+3 pts)</button>
            <div class="community-form-msg" id="commentMsg_${containerId}"></div>
          </div>
        `
        : `<p class="footer-text">Inicia sesión y crea tu perfil de comunidad para comentar. <a href="comunidad.html">Ir a Comunidad</a></p>`;

      container.innerHTML = `
        ${sortBarHTML}
        <div class="comments-list">${listHTML}</div>
        ${formHTML}
      `;

      container.querySelectorAll('.sort-chip').forEach((btn) => {
        btn.addEventListener('click', () => { sortMode = btn.dataset.sort; loadComments(); });
      });

      container.querySelectorAll('.comment-like-btn').forEach((btn) => {
        btn.addEventListener('click', () => toggleLike(btn.dataset.like, btn));
      });
      container.querySelectorAll('.comment-delete-btn').forEach((btn) => {
        btn.addEventListener('click', () => deleteComment(btn.dataset.delete));
      });
      container.querySelectorAll('.comment-report-btn').forEach((btn) => {
        btn.addEventListener('click', () => reportComment(btn.dataset.report, btn));
      });
      container.querySelectorAll('.comment-edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const row = btn.closest('.comment-row');
          const textEl = row.querySelector('.comment-text p');
          startEdit(btn.dataset.edit, textEl ? textEl.textContent : '');
        });
      });
      container.addEventListener('click', (e) => {
        const saveBtn = e.target.closest('.comment-edit-save');
        if (saveBtn) saveEdit(saveBtn.dataset.editSave);
        const cancelBtn = e.target.closest('.comment-edit-cancel');
        if (cancelBtn) loadComments();
      });

      pendingImageFile = null;
      const attachBtn = document.getElementById('commentAttachBtn_' + containerId);
      const imageInput = document.getElementById('commentImageInput_' + containerId);
      if (attachBtn && imageInput) {
        attachBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', () => {
          pendingImageFile = imageInput.files[0] || null;
          document.getElementById('commentImageName_' + containerId).textContent = pendingImageFile ? pendingImageFile.name : '';
        });
      }

      const submitBtn = document.getElementById('commentSubmit_' + containerId);
      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const input = document.getElementById('commentInput_' + containerId);
          const msgEl = document.getElementById('commentMsg_' + containerId);
          const text = input.value.trim();
          if (!text && !pendingImageFile) return;
          postComment(text, null, msgEl, submitBtn, pendingImageFile);
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
            let replyImageFile = null;
            const replyAttachBtn = formEl.querySelector('.comment-attach-btn');
            const replyImageInput = formEl.querySelector('.comment-image-input');
            replyAttachBtn.addEventListener('click', () => replyImageInput.click());
            replyImageInput.addEventListener('change', () => {
              replyImageFile = replyImageInput.files[0] || null;
              document.getElementById(`replyImageName_${containerId}_${commentId}`).textContent = replyImageFile ? replyImageFile.name : '';
            });
            const submitReplyBtn = formEl.querySelector('.reply-submit-btn');
            submitReplyBtn.addEventListener('click', () => {
              const replyInput = document.getElementById(`replyInput_${containerId}_${commentId}`);
              const replyMsg = document.getElementById(`replyMsg_${containerId}_${commentId}`);
              const text = replyInput.value.trim();
              if (!text && !replyImageFile) return;
              postComment(text, commentId, replyMsg, submitReplyBtn, replyImageFile);
            });
          }
        });
      });
    }

    loadComments();
  };
})();
