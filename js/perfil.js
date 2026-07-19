(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };
  const BADGE_META = {
    first_post: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/></svg>", name: 'Primera publicación' },
    century: { icon: "<span style='font-family:var(--mono);font-weight:700;font-size:0.72rem;'>100</span>", name: '100 puntos' },
    high_roller: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><circle cx='9' cy='9' r='6'/><path d='M15.5 6.5a6 6 0 1 1-9 9'/></svg>", name: '1000 puntos' },
    streak_7: { icon: "<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg>", name: '7 días de racha' },
    streak_30: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z'/></svg>", name: '30 días de racha' },
    philanthropist: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='4' y='9' width='16' height='12' rx='1'/><path d='M4 13h16M12 9v12'/><path d='M12 9C11 5 8 5 8 7s3 2 4 2c1 0 4 0 4-2s-3-2-4 2z'/></svg>", name: 'Donó puntos' },
    elite_member: { icon: '★', name: 'Rango Élite' }
  };
  const SOCIAL_META = {
    twitter: { icon: '𝕏', urlBase: 'https://x.com/' },
    instagram: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z'/><circle cx='12' cy='13' r='3.5'/></svg>", urlBase: 'https://instagram.com/' },
    tiktok: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M9 18V5l11-2v13'/><circle cx='6.5' cy='18' r='2.5'/><circle cx='17.5' cy='16' r='2.5'/></svg>", urlBase: 'https://tiktok.com/@' },
    youtube: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4l14 8-14 8z'/></svg>", urlBase: 'https://youtube.com/@' }
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
  const AVATAR_GRADIENTS = [
    ['#5b7cfa', '#2f4bd6'], ['#12b3c7', '#0b7f8f'], ['#8e5bf2', '#5b2fa8'],
    ['#f0a921', '#c46a10'], ['#e13a4b', '#a11824'], ['#1a9fd0', '#0d6d92'],
    ['#2ecc71', '#189a52'], ['#e84393', '#a3246a'], ['#d4af37', '#a07d14'],
    ['#ff7a59', '#d24d2f'], ['#5c6b7a', '#333d47'], ['#00b894', '#00806a']
  ];
  function avatarHash(s) { let h = 0; s = String(s || 'x'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function avatarGradient(u) { const g = AVATAR_GRADIENTS[avatarHash(u) % AVATAR_GRADIENTS.length]; return 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')'; }
  function generatedAvatarUrl(u) { return 'https://api.dicebear.com/9.x/notionists/svg?seed=' + encodeURIComponent(u || 'trader') + '&scale=130&radius=50'; }
  function avatarHTML(profile, sizeClass) {
    if (profile.avatar_url) {
      const color = profile.avatar_color || '#8b93a7';
      return `<div class="${sizeClass}" style="background:${color};"><img src="${escapeHtml(profile.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>`;
    }
    const grad = avatarGradient(profile.username);
    const initial = (profile.username || '?').charAt(0).toUpperCase();
    return `<div class="${sizeClass} avatar-generated" style="background:${grad};">` +
      `<img src="${generatedAvatarUrl(profile.username)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` +
      `<span class="avatar-fallback" style="background:${grad};">${escapeHtml(initial)}</span>` +
      `</div>`;
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
    const color = score >= 70 ? "<span class='sdot sdot-g'></span>" : score >= 40 ? "<span class='sdot sdot-y'></span>" : "<span class='sdot sdot-r'></span>";
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

    const IC_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>';
    const IC_LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>';
    const IC_FLAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></svg>';
    const IC_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 6"/></svg>';
    const IC_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
    const IC_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
    const IC_AV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="4"/><path d="M5.5 20a7 7 0 0 1 13 0"/></svg>';
    const IC_GIFT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="16" height="12" rx="1"/><path d="M4 13h16M12 9v12"/><path d="M12 9C11 5 8 5 8 7s3 2 4 2c1 0 4 0 4-2s-3-2-4 2z"/></svg>';
    const actionButtons = isSelf ? `
      <div class="perfil-actions">
        <a href="comunidad.html?edit=1" class="btn btn-gold btn-ic">${IC_EDIT} Editar perfil</a>
        <a href="comunidad.html?avatares=1" class="btn btn-outline btn-ic">${IC_AV} Cambiar avatar</a>
        <a href="comunidad.html" class="btn btn-outline btn-ic">${IC_GIFT} Canjear puntos</a>
        <button class="btn btn-outline btn-ic" id="perfilCopyBtn">${IC_LINK} Copiar enlace</button>
      </div>
    ` : `
      <div class="perfil-actions">
        ${myProfile ? `<button class="btn ${amFollowing ? 'btn-outline' : 'btn-gold'} btn-ic" id="perfilFollowBtn" data-following="${amFollowing}">${amFollowing ? IC_CHECK + ' Siguiendo' : IC_PLUS + ' Seguir'}</button>` : '<a href="comunidad.html" class="btn btn-gold">Inicia sesión para seguir</a>'}
        <button class="btn btn-outline btn-ic" id="perfilDmBtn">${IC_MAIL} Enviar mensaje</button>
        <button class="btn btn-outline btn-ic" id="perfilCopyBtn">${IC_LINK} Copiar enlace</button>
        ${myProfile ? `<button class="btn btn-outline btn-ic" id="perfilReportBtn">${IC_FLAG} Reportar</button>` : ''}
      </div>
    `;

    root.innerHTML = `
      <div class="perfil-header glass-card">
        ${avatarHTML(targetProfile, 'perfil-avatar')}
        <div class="perfil-header-info">
          <h1>${escapeHtml(targetProfile.username)}${verifiedBadgeHTML(targetProfile)} ${rankBadgeHTML(targetProfile.rank)}<span class="level-badge">Nv. ${levelFromPoints(targetProfile.points)}</span>${streak ? `<span class="streak-chip"><svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg> ${streak} ${streak === 1 ? 'día' : 'días'}</span>` : ''}</h1>
          <p class="perfil-bio">${escapeHtml(targetProfile.bio) || 'Sin biografía todavía.'}</p>
          <div class="perfil-meta-row">
            ${targetProfile.trading_style ? `<span class="instrument-badge">${escapeHtml(targetProfile.trading_style)}</span>` : ''}
            ${joinDate ? `<span class="footer-text perfil-join"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg> Miembro desde ${joinDate}</span>` : ''}
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

      <div id="perfilDiplomas"></div>

      <div id="perfilAffinity"></div>

      <div class="community-tabs" style="flex-direction:row;position:static;margin-top:24px;">
        <button class="community-tab-btn active" data-tab="posts"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></svg> Publicaciones</button>
        <button class="community-tab-btn" data-tab="comments"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg> Comentarios</button>
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

    // Vitrina pública de diplomas: los diplomas de PROGRAMA emitidos (con
    // verificación pública) + el avance de módulos como progreso visible.
    (async () => {
      const el = document.getElementById('perfilDiplomas');
      if (!el) return;
      // Nombre real verificado: SOLO visible para el dueño del perfil.
      async function appendNombreVerificado() {
        if (!isSelf || typeof netlifyIdentity === 'undefined' || !netlifyIdentity.currentUser()) return;
        try {
          const jwt = await netlifyIdentity.currentUser().jwt();
          const st = await fetch('/.netlify/functions/diploma-status', { headers: { Authorization: 'Bearer ' + jwt } }).then((r) => r.json());
          if (st && st.success) {
            el.insertAdjacentHTML('beforeend', `<p class="footer-text" style="margin-top:6px;">Identidad para diplomas (solo visible para ti): ${st.nombre ? `<strong style="color:var(--gold-bright);">${escapeHtml(st.nombre)}</strong>` : 'aún sin confirmar; se pedirá al reclamar tu primer diploma'}.</p>`);
          }
        } catch (e) { /* linea opcional */ }
      }
      try {
        const [freeMods, premMods, dipRes] = await Promise.all([
          fetch('data/educacion.json').then((r) => r.json()).catch(() => []),
          fetch('data/educacion-premium.json').then((r) => r.json()).catch(() => []),
          fetch('/.netlify/functions/community-public-diplomas?username=' + encodeURIComponent(targetProfile.username)).then((r) => r.json()).catch(() => ({}))
        ]);
        const slugs = (dipRes && dipRes.slugs) || [];
        const diplomas = (dipRes && dipRes.diplomas) || [];
        const freeSet = new Set((freeMods || []).map((mm) => mm.slug));
        const premSet = new Set((premMods || []).map((mm) => mm.slug));
        const freeDone = slugs.filter((sl) => freeSet.has(sl)).length;
        const premDone = slugs.filter((sl) => premSet.has(sl)).length;
        const CURSO_LBL = { basico: 'Diploma de Formación Integral en Trading', institucional: 'Diploma Institucional (50 módulos)' };
        const seal = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M12 6.5l1 1.9 2.1.3-1.5 1.5.3 2.1-1.9-1-1.9 1 .3-2.1L8.9 8.7l2.1-.3z"/><path d="M8.5 14.5 7 21l5-2.5L17 21l-1.5-6.5"/></svg>';

        if (!diplomas.length && !slugs.length) {
          // Perfil propio sin avance: invitación clara al nuevo modelo.
          if (isSelf) {
            el.innerHTML = `
              <div class="section-head" style="margin-top:24px;"><h2 style="font-size:1rem;">Vitrina de diplomas</h2></div>
              <div class="diploma-empty">
                <span class="diploma-mini-seal">${seal}</span>
                <div>
                  <strong>Tu vitrina está esperando su primer diploma</strong>
                  <p>Completa los <strong>30 módulos gratuitos</strong> de Educación aprobando sus cuestionarios (promedio mínimo 75/100) y obtén el Diploma de Formación Integral: con tu nombre real, nota final y verificación pública. No se regala por módulo — por eso vale.</p>
                  <a href="educacion.html" class="btn btn-gold" style="margin-top:8px;">Empezar mi primer módulo</a>
                </div>
              </div>`;
            appendNombreVerificado();
          }
          return;
        }

        el.innerHTML = `
          <div class="section-head" style="margin-top:24px;"><h2 style="font-size:1rem;">Vitrina de diplomas</h2>${diplomas.length ? `<span class="news-meta">${diplomas.length} diploma${diplomas.length === 1 ? '' : 's'} verificado${diplomas.length === 1 ? '' : 's'}</span>` : ''}</div>
          ${diplomas.length ? `<div class="diploma-vitrina">
            ${diplomas.map((d) => `
              <a class="diploma-mini${d.curso === 'institucional' ? ' diploma-mini-inst' : ''}" href="verificar.html?cert=${encodeURIComponent(d.cert)}">
                <span class="diploma-mini-seal">${seal}</span>
                <span class="diploma-mini-body"><strong>${CURSO_LBL[d.curso] || escapeHtml(d.curso)}</strong><span>Emitido ${new Date(d.fecha).toLocaleDateString('es', { month: 'short', year: 'numeric' })} · Verificado · Ver certificado →</span></span>
              </a>`).join('')}
          </div>` : ''}
          <p class="footer-text" style="margin-top:10px;">Avance: ${freeDone}/30 módulos del programa integral${premDone ? ` · ${premDone}/20 de la ruta institucional` : ''}${isSelf ? ' · <a href="educacion.html#diplomaRuta">ver mi Ruta del Diploma</a>' : ''}</p>`;
        appendNombreVerificado();
      } catch (e) { /* la vitrina es opcional; el perfil sigue funcionando */ }
    })();

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
          const orig = copyBtn.innerHTML;
          copyBtn.textContent = 'Enlace copiado';
          setTimeout(() => { copyBtn.innerHTML = orig; }, 1500);
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
