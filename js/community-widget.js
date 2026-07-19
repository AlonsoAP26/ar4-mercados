(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

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

  window.AR4_mountCommunityWidget = async function (containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    try {
      const [postsCountRes, tradersCountRes, recentRes] = await Promise.all([
        sb.from('community_posts').select('id', { count: 'exact', head: true }),
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('community_posts').select('title,category,symbol,created_at').order('created_at', { ascending: false }).limit(3)
      ]);

      const postsCount = postsCountRes.count || 0;
      const tradersCount = tradersCountRes.count || 0;
      const recent = recentRes.data || [];

      const recentHTML = recent.length
        ? recent.map((p) => `
            <a href="comunidad.html" class="sidebar-mini-item">
              <span class="news-tag" style="font-size:0.66rem;">${escapeHtml(p.category || '')}</span>
              <span>${escapeHtml(p.title)} · ${timeAgo(p.created_at)}</span>
            </a>
          `).join('')
        : '<p class="footer-text" style="font-size:0.78rem;">Sé el primero en publicar hoy.</p>';

      el.innerHTML = `
        <div class="sidebar-block community-widget-card">
          <h3>Comunidad AR4 en vivo</h3>
          <div class="community-widget-stats">
            <div><strong>${postsCount}</strong><span>Ideas publicadas</span></div>
            <div><strong>${tradersCount}</strong><span>Traders registrados</span></div>
          </div>
          ${recentHTML}
          <a href="comunidad.html" class="btn btn-outline btn-block" style="margin-top:12px;">Entrar a la comunidad →</a>
        </div>
      `;
    } catch (e) {
      el.innerHTML = '';
    }
  };
})();
