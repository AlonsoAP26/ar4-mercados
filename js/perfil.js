(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };
  const BADGE_META = {
    first_post: { icon: '📝', name: 'Primera publicación' },
    century: { icon: '💯', name: '100 puntos' },
    high_roller: { icon: '💰', name: '1000 puntos' },
    streak_7: { icon: '🔥', name: '7 días de racha' },
    streak_30: { icon: '🌟', name: '30 días de racha' },
    philanthropist: { icon: '🎁', name: 'Donó puntos' },
    elite_member: { icon: '★', name: 'Rango Élite' }
  };
  const SOCIAL_META = {
    twitter: { icon: '𝕏', urlBase: 'https://x.com/' },
    instagram: { icon: '📷', urlBase: 'https://instagram.com/' },
    tiktok: { icon: '🎵', urlBase: 'https://tiktok.com/@' },
    youtube: { icon: '▶️', urlBase: 'https://youtube.com/@' }
  };

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
    const diffD = Math.round(diffH / 24);
    if (diffD < 30) return `hace ${diffD} d`;
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function levelFromPoints(points) { return Math.floor((points || 0) / 100) + 1; }
  function avatarHTML(profile, sizeClass) {
    const color = profile.avatar_color || '#8b93a7';
    if (profile.avatar_url) {
      return `<div class="${sizeClass}" style="background:${color};"><img src="${escapeHtml(profile.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>`;
    }
    const initial = (profile.username || '?').charAt(0).toUpperCase();
    return `<div class="${sizeClass}" style="background:${color};">${escapeHtml(initial)}</div>`;
  }
  function rankBadgeHTML(rank) {
    if (!rank || !RANK_LABELS[rank]) return '';
    return `<span class="rank-badge rank-${rank}">${RANK_LABELS[rank]}</span>`;
  }
  function verifiedBadgeHTML(p) {
    return p && p.verified ? '<span class="verified-badge" title="Cuenta verificada por AR4">✔</span>' : '';
  }

  function isLoggedIn() { return typeof netlifyIdentity !== 'undefined' && !!netlifyIdentity.currentUser(); }
  async function authHeaders() {
    if (!isLoggedIn()) return {};
    const jwt = await netlifyIdentity.currentUser().jwt();
    return { 'Authorization': 'Bearer ' + jwt };
  }
  async function callFunction(name, payload) {
    const headers = await authHeaders();
    const res = await fetch('/.netlify/functions/' + name, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload || {})
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error desconocido');
    return data;
  }
  async function getMyProfile() {
    const user = typeof netlifyIdentity !== 'undefined' ? netlifyIdentity.currentUser() : null;
    if (!user) return null;
    try {
      const jwt = await user.jwt();
      const res = await fetch('/.netlify/functions/community-profile', { headers: { 'Authorization': 'Bearer ' + jwt } });
      const data = await res.json();
      return data.success && data.profile ? data.profile : null;
    } catch (e) { return null; }
  }

  function badgesRowHTML(badges) {
    if (!badges || !badges.length) return '';
    return `<div class="community-badges">${badges.map((b) => {
      const meta = BADGE_META[b];
      return meta ? `<span class="badge-chip" title="${escapeHtml(meta.name)}">${meta.icon}</span>` : '';
    }).join('')}</div>`;
  }
  function socialLinksRowHTML(links) {
    links = links || {};
    const keys = Object.keys(SOCIAL_META).filter((k) => links[k]);
    if (!keys.length) return '';
    return `<div class="social-links-row-display">${keys.map((k) => `<a href="${SOCIAL_META[k].urlBase}${encodeURIComponent(links[k])}" target="_blank" rel="noopener" title="${k}">${SOCIAL_META[k].icon}</a>`).join('')}</div>`;
  }

  function statCardHTML(label, value) {
    return `<div class="perfil-stat-card"><strong>${value}</strong><span>${label}</span></div>`;
  }

  function affinityHTML(score, tags) {
    const color = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
    return `
      <div class="glass-card perfil-affinity-card">
        <div class="perfil-affinity-head">
          <div class="perfil-affinity-circle" style="--aff-deg:${Math.round(score * 3.6)}deg;">
            <div class="perfil-affinity-inner"><span>${score}%</span></div>
          </div>
          <div>
            <strong>${color} ${score}% de afinidad contigo</strong>
            <p class="footer-text" style="font-size:0.78rem;margin-top:4px;">Calculado con datos reales: estilo de trading, categorías y símbolos que ambos han publicado — no es una predicción, es una comparación simple y transparente.</p>
          </div>
        </div>
        ${tags.length ? `<div class="perfil-affinity-tags">${tags.map((t) => `<span class="filter-chip">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
    `;
  }

  async function computeAffinity(myProfile, targetProfile) {
    if (!myProfile || myProfile.id === targetProfile.id) return null;
    const [{ data: myPosts }, { data: theirPosts }] = await Promise.all([
      sb.from('community_posts').select('category,symbol').eq('profile_id', myProfile.id).limit(40),
      sb.from('community_posts').select('category,symbol').eq('profile_id', targetProfile.id).limit(40)
    ]);
    const myCats = new Set((myPosts || []).map((p) => p.category).filter(Boolean));
    const theirCats = new Set((theirPosts || []).map((p) => p.category).filter(Boolean));
    const mySymbols = new Set((myPosts || []).map((p) => (p.symbol || '').toUpperCase()).filter(Boolean));
    const theirSymbols = new Set((theirPosts || []).map((p) => (p.symbol || '').toUpperCase()).filter(Boolean));

    let score = 0;
    const tags = [];
    const maxScore = 100;
    let signals = 0;

    if (myProfile.trading_style && myProfile.trading_style === targetProfile.trading_style) {
      score += 30; signals++;
      tags.push(`Ambos hacen ${targetProfile.trading_style}`);
    }
    const sharedCats = [...myCats].filter((c) => theirCats.has(c));
    if (sharedCats.length) {
      score += Math.min(40, sharedCats.length * 15); signals++;
      sharedCats.slice(0, 2).forEach((c) => tags.push(`Ambos analizan ${c}`));
    }
    const sharedSymbols = [...mySymbols].filter((s) => theirSymbols.has(s));
    if (sharedSymbols.length) {
      score += Math.min(30, sharedSymbols.length * 10); signals++;
      sharedSymbols.slice(0, 2).forEach((s) => tags.push(`Ambos operan ${s}`));
    }

    if (!signals) return { score: 0, tags: ['Todavía no hay suficientes publicaciones de ambos para comparar'] };
    return { score: Math.min(maxScore, Math.round(score)), tags };
  }

  function postMiniCardHTML(p) {
    return `
      <a href="comunidad.html?post=${p.id}" class="perfil-post-mini glass-card">
        <span class="news-tag">${escapeHtml(p.category)}</span>
        <strong>${escapeHtml(p.title)}</strong>
        <span class="footer-text" style="font-size:0.76rem;">${timeAgo(p.created_at)} · ▲ ${p.upvotes || 0} útil</span>
      </a>
    `;
  }
  function commentMiniHTML(c) {
    return `
      <div class="perfil-comment-mini glass-card">
        <p>${escapeHtml(c.body)}</p>
        <span class="footer-text" style="font-size:0.74rem;">${timeAgo(c.created_at)} · en ${escapeHtml(c.target_type)}</span>
      </div>
    `;
  }

  async function loadTab(tab, targetProfile) {
    const el = document.getElementById('perfilTabContent');
    if (!el) return;
    el.innerHTML = '<p class="footer-text">Cargando...</p>';
    if (tab === 'posts') {
      const { data } = await sb.from('community_posts').select('*').eq('profile_id', targetProfile.id).order('created_at', { ascending: false }).limit(30);
      el.innerHTML = (data && data.length) ? `<div class="perfil-post-grid">${data.map(postMiniCardHTML).join('')}</div>` : '<p class="footer-text">Todavía no publicó nada en el Foro.</p>';
    } else {
      const { data } = await sb.from('comments').select('*').eq('profile_id', targetProfile.id).order('created_at', { ascending: false }).limit(30);
      el.innerHTML = (data && data.length) ? data.map(commentMiniHTML).join('') : '<p class="footer-text">Todavía no dejó comentarios.</p>';
    }
  }

  async function init() {
    const root = document.getElementById('perfilRoot');
    if (!root) return;
    const username = new URLSearchParams(window.location.search).get('u');
    if (!username) { root.innerHTML = '<p class="footer-text">Falta indicar qué perfil mostrar. <a href="comunidad.html">Ir a Comunidad</a>.</p>'; return; }

    const { data: targetProfile } = await sb.from('profiles')
      .select('id,username,avatar_color,avatar_url,rank,verified,bio,trading_style,social_links,badges,streak_days,points,created_at')
      .ilike('username', username).single();
    if (!targetProfile) { root.innerHTML = `<p class="footer-text">No encontramos a "${escapeHtml(username)}". <a href="comunidad.html">Ir a Comunidad</a>.</p>`; return; }

    document.title = targetProfile.username + ' — Perfil AR4 Mercados';
    const breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = targetProfile.username;

    const [postsCountRes, commentsCountRes, followersRes, followingRes, myProfile] = await Promise.all([
      sb.from('community_posts').select('id', { count: 'exact', head: true }).eq('profile_id', targetProfile.id),
      sb.from('comments').select('id', { count: 'exact', head: true }).eq('profile_id', targetProfile.id),
      sb.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetProfile.id),
      sb.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', targetProfile.id),
      getMyProfile()
    ]);

    const isSelf = myProfile && myProfile.id === targetProfile.id;
    let amFollowing = false;
    if (myProfile && !isSelf) {
      const { data } = await sb.from('follows').select('follower_id').eq('follower_id', myProfile.id).eq('following_id', targetProfile.id).limit(1);
      amFollowing = !!(data && data.length);
    }

    const joinDate = targetProfile.created_at ? new Date(targetProfile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '';
    const streak = targetProfile.streak_days || 0;

    const actionButtons = isSelf ? '' : `
      <div class="perfil-actions">
        ${myProfile ? `<button class="btn ${amFollowing ? 'btn-outline' : 'btn-gold'}" id="perfilFollowBtn" data-following="${amFollowing}">${amFollowing ? '✔ Siguiendo' : '+ Seguir'}</button>` : '<a href="comunidad.html" class="btn btn-gold">Inicia sesión para seguir</a>'}
        <button class="btn btn-outline" id="perfilDmBtn">✉️ Enviar mensaje</button>
        <button class="btn btn-outline" id="perfilCopyBtn">🔗 Copiar enlace</button>
        ${myProfile ? '<button class="btn btn-outline" id="perfilReportBtn">🚩 Reportar</button>' : ''}
      </div>
    `;

    root.innerHTML = `
      <div class="perfil-header glass-card">
        ${avatarHTML(targetProfile, 'perfil-avatar')}
        <div class="perfil-header-info">
          <h1>${escapeHtml(targetProfile.username)}${verifiedBadgeHTML(targetProfile)} ${rankBadgeHTML(targetProfile.rank)}<span class="level-badge">Nv. ${levelFromPoints(targetProfile.points)}</span>${streak ? `<span class="streak-chip">🔥 ${streak} ${streak === 1 ? 'día' : 'días'}</span>` : ''}</h1>
          <p class="perfil-bio">${escapeHtml(targetProfile.bio) || 'Sin biografía todavía.'}</p>
          <div class="perfil-meta-row">
            ${targetProfile.trading_style ? `<span class="instrument-badge">${escapeHtml(targetProfile.trading_style)}</span>` : ''}
            ${joinDate ? `<span class="footer-text">📅 Miembro desde ${joinDate}</span>` : ''}
          </div>
          ${badgesRowHTML(targetProfile.badges)}
          ${socialLinksRowHTML(targetProfile.social_links)}
        </div>
      </div>

      ${actionButtons}

      <div class="perfil-stats-grid">
        ${statCardHTML('Publicaciones', postsCountRes.count || 0)}
        ${statCardHTML('Comentarios', commentsCountRes.count || 0)}
        ${statCardHTML('Seguidores', followersRes.count || 0)}
        ${statCardHTML('Siguiendo', followingRes.count || 0)}
        ${statCardHTML('Puntos', targetProfile.points || 0)}
      </div>

      <div id="perfilAffinity"></div>

      <div class="community-tabs" style="flex-direction:row;position:static;margin-top:24px;">
        <button class="community-tab-btn active" data-tab="posts">📋 Publicaciones</button>
        <button class="community-tab-btn" data-tab="comments">💬 Comentarios</button>
      </div>
      <div id="perfilTabContent"><p class="footer-text">Cargando...</p></div>
    `;

    document.querySelectorAll('#perfilRoot .community-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#perfilRoot .community-tab-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        loadTab(btn.dataset.tab, targetProfile);
      });
    });
    loadTab('posts', targetProfile);

    if (myProfile && !isSelf) {
      const affinityEl = document.getElementById('perfilAffinity');
      const result = await computeAffinity(myProfile, targetProfile);
      if (result && affinityEl) affinityEl.innerHTML = affinityHTML(result.score, result.tags);
    }

    const followBtn = document.getElementById('perfilFollowBtn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        followBtn.disabled = true;
        try {
          const currentlyFollowing = followBtn.dataset.following === 'true';
          await callFunction('community-follow', { action: currentlyFollowing ? 'unfollow' : 'follow', targetProfileId: targetProfile.id });
          const nowFollowing = !currentlyFollowing;
          followBtn.dataset.following = String(nowFollowing);
          followBtn.textContent = nowFollowing ? '✔ Siguiendo' : '+ Seguir';
          followBtn.classList.toggle('btn-gold', !nowFollowing);
          followBtn.classList.toggle('btn-outline', nowFollowing);
        } catch (e) { alert(e.message); }
        followBtn.disabled = false;
      });
    }

    const dmBtn = document.getElementById('perfilDmBtn');
    if (dmBtn) {
      dmBtn.addEventListener('click', () => {
        if (!isLoggedIn()) { if (typeof netlifyIdentity !== 'undefined') netlifyIdentity.open(); return; }
        window.location.href = 'comunidad.html?dm=' + encodeURIComponent(targetProfile.username);
      });
    }

    const copyBtn = document.getElementById('perfilCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          copyBtn.textContent = '✅ Copiado';
          setTimeout(() => { copyBtn.textContent = '🔗 Copiar enlace'; }, 1500);
        } catch (e) { prompt('Copia este enlace:', window.location.href); }
      });
    }

    const reportBtn = document.getElementById('perfilReportBtn');
    if (reportBtn) {
      reportBtn.addEventListener('click', async () => {
        if (!confirm(`¿Reportar el perfil de ${targetProfile.username}? Un administrador lo revisará.`)) return;
        reportBtn.disabled = true;
        try {
          await callFunction('report-user', { targetProfileId: targetProfile.id });
          reportBtn.textContent = '✔ Reportado';
        } catch (e) { alert(e.message); reportBtn.disabled = false; }
      });
    }
  }

  init();
})();
