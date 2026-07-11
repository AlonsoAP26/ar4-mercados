(function () {
  if (typeof supabase === 'undefined' || typeof netlifyIdentity === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const root = document.getElementById('communityRoot');
  if (!root) return;

  const CATEGORY_LABELS = ['Forex', 'LatAm', 'Materias Primas', 'Índices', 'Criptomonedas'];
  const BASE_ROOMS = [
    { id: 'forex', label: '💱 Forex' },
    { id: 'commodities', label: '🛢️ Commodities' },
    { id: 'acciones', label: '📈 Acciones e Índices' },
    { id: 'cripto', label: '₿ Criptomonedas' }
  ];
  const ELITE_ROOM = { id: 'elite', label: '★ Elite Traders' };
  const ROOM_META = {
    forex: { icon: '💱', name: 'Forex', desc: 'Charla general sobre pares de divisas' },
    commodities: { icon: '🛢️', name: 'Commodities', desc: 'Oro, petróleo y materias primas' },
    acciones: { icon: '📈', name: 'Acciones e Índices', desc: 'Índices bursátiles y acciones' },
    cripto: { icon: '₿', name: 'Criptomonedas', desc: 'Bitcoin, Ethereum y el resto del mercado cripto' },
    elite: { icon: '★', name: 'Elite Traders', desc: 'Sala exclusiva para rango Élite y Administrador' }
  };
  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };
  const RANK_ORDER = { basico: 0, vip: 1, premium: 2, elite: 3, administrador: 4 };
  const AVATAR_COLORS = ['#f0c75e', '#7aa8ff', '#4fd18a', '#ff8a5c', '#f7931a', '#e2001a', '#22c07a'];
  const TRADING_STYLES = ['Day trader', 'Swing trader', 'Scalper', 'Macro / posicional', 'HODLer', 'Recién empezando'];
  const REACTIONS = [
    { emoji: '📚', label: 'Educativo' },
    { emoji: '📈', label: 'Buen análisis' },
    { emoji: '💡', label: 'Buena explicación' },
    { emoji: '🎯', label: 'Bien argumentado' }
  ];
  const POST_SYMBOL_MAP = {
    'EURUSD': 'FX:EURUSD', 'EUR/USD': 'FX:EURUSD',
    'GBPUSD': 'FX:GBPUSD', 'GBP/USD': 'FX:GBPUSD',
    'USDJPY': 'FX:USDJPY', 'USD/JPY': 'FX:USDJPY',
    'USDMXN': 'FX_IDC:USDMXN', 'USD/MXN': 'FX_IDC:USDMXN',
    'USDCOP': 'FX_IDC:USDCOP', 'USD/COP': 'FX_IDC:USDCOP',
    'USDCLP': 'FX_IDC:USDCLP', 'USD/CLP': 'FX_IDC:USDCLP',
    'USDARS': 'FX_IDC:USDARS', 'USD/ARS': 'FX_IDC:USDARS',
    'USDBRL': 'FX_IDC:USDBRL', 'USD/BRL': 'FX_IDC:USDBRL',
    'USDPEN': 'FX_IDC:USDPEN', 'USD/PEN': 'FX_IDC:USDPEN',
    'ORO': 'OANDA:XAUUSD', 'GOLD': 'OANDA:XAUUSD', 'XAUUSD': 'OANDA:XAUUSD', 'XAU/USD': 'OANDA:XAUUSD',
    'PLATA': 'OANDA:XAGUSD', 'SILVER': 'OANDA:XAGUSD', 'XAGUSD': 'OANDA:XAGUSD', 'XAG/USD': 'OANDA:XAGUSD',
    'PETROLEO': 'TVC:USOIL', 'WTI': 'TVC:USOIL', 'OIL': 'TVC:USOIL', 'USOIL': 'TVC:USOIL',
    'BRENT': 'TVC:UKOIL', 'UKOIL': 'TVC:UKOIL',
    'BTC': 'BITSTAMP:BTCUSD', 'BTCUSD': 'BITSTAMP:BTCUSD', 'BTC/USD': 'BITSTAMP:BTCUSD', 'BITCOIN': 'BITSTAMP:BTCUSD',
    'ETH': 'COINBASE:ETHUSD', 'ETHUSD': 'COINBASE:ETHUSD', 'ETH/USD': 'COINBASE:ETHUSD', 'ETHEREUM': 'COINBASE:ETHUSD',
    'SP500': 'FOREXCOM:SPXUSD', 'S&P500': 'FOREXCOM:SPXUSD', 'US500': 'FOREXCOM:SPXUSD', 'SPX': 'FOREXCOM:SPXUSD',
    'NASDAQ': 'FOREXCOM:NSXUSD', 'NAS100': 'FOREXCOM:NSXUSD', 'US100': 'FOREXCOM:NSXUSD',
    'DXY': 'CAPITALCOM:DXY'
  };
  const BADGE_META = {
    first_post: { icon: '📝', name: 'Primera publicación' },
    century: { icon: '💯', name: '100 puntos' },
    high_roller: { icon: '💰', name: '1000 puntos' },
    streak_7: { icon: '🔥', name: '7 días de racha' },
    streak_30: { icon: '🌟', name: '30 días de racha' },
    philanthropist: { icon: '🎁', name: 'Donó puntos' },
    elite_member: { icon: '★', name: 'Rango Élite' }
  };
  const MISSION_META = {
    post: { icon: '📝', label: 'Publica 1 idea en el Foro' },
    votes: { icon: '👍', label: 'Vota 3 publicaciones' },
    chat: { icon: '💬', label: 'Manda 5 mensajes en el chat' }
  };
  const SOCIAL_META = {
    twitter: { icon: '𝕏', placeholder: 'usuario de X/Twitter', urlBase: 'https://x.com/' },
    instagram: { icon: '📷', placeholder: 'usuario de Instagram', urlBase: 'https://instagram.com/' },
    tiktok: { icon: '🎵', placeholder: 'usuario de TikTok', urlBase: 'https://tiktok.com/@' },
    youtube: { icon: '▶️', placeholder: 'canal de YouTube', urlBase: 'https://youtube.com/@' }
  };

  function resolvePostSymbol(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim().toUpperCase();
    if (/^[A-Z0-9_]+:[A-Z0-9]+$/.test(trimmed)) return trimmed;
    return POST_SYMBOL_MAP[trimmed.replace(/\s+/g, '')] || null;
  }

  function mountPostChart(container, symbol) {
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.text = JSON.stringify({
      symbol,
      width: '100%',
      height: 280,
      interval: '60',
      locale: 'es',
      timezone: 'America/Lima',
      theme: 'dark',
      style: '1',
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      studies: ['MASimple@tv-basicstudies', 'MAExp@tv-basicstudies'],
      support_host: 'https://www.tradingview.com'
    });
    container.appendChild(script);
  }
  const FREE_AVATARS = [
    { id: 'bot-1', name: 'Bot Ámbar', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo1' },
    { id: 'bot-2', name: 'Bot Cobalto', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo2' },
    { id: 'bot-3', name: 'Bot Esmeralda', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo3' },
    { id: 'bot-4', name: 'Bot Coral', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo4' },
    { id: 'bot-5', name: 'Bot Grafito', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo5' },
    { id: 'bot-6', name: 'Bot Plata', url: 'https://api.dicebear.com/9.x/bottts/svg?seed=Robo6' }
  ];
  const PREMIUM_AVATARS = [
    { id: 'guerrero-oro', name: 'Guerrero de Oro', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Warrior1', priceSoles: 10 },
    { id: 'ninja-sombra', name: 'Ninja de la Sombra', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ninja1', priceSoles: 10 },
    { id: 'caballero-plata', name: 'Caballero de Plata', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Knight1', priceSoles: 8 },
    { id: 'mago-arcano', name: 'Mago Arcano', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Mage1', priceSoles: 8 },
    { id: 'cyborg-neon', name: 'Cyborg Neón', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Cyborg1', priceSoles: 10 },
    { id: 'fenix-leyenda', name: 'Fénix Leyenda', url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Phoenix1', priceSoles: 10 }
  ];

  const profileCache = {};
  const reactionCache = {};
  let myProfile = null;
  let currentRoom = 'forex';
  let chatChannel = null;
  let elitePollTimer = null;
  let editingProfile = false;
  let shoppingAvatars = false;
  let presenceCount = 1;
  let activeTagFilter = null;

  function initPresence() {
    const presenceKey = (netlifyIdentity.currentUser() && netlifyIdentity.currentUser().id) || ('guest-' + Math.random().toString(36).slice(2));
    const channel = sb.channel('community-online', { config: { presence: { key: presenceKey } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        presenceCount = Math.max(1, Object.keys(channel.presenceState()).length);
        const el = document.getElementById('pulseOnlineCount');
        if (el) el.textContent = String(presenceCount);
        document.dispatchEvent(new CustomEvent('ar4-presence-update'));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} h`;
    return `hace ${Math.round(diffH / 24)} d`;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function avatarInitials(username) {
    return escapeHtml((username || '?').slice(0, 2).toUpperCase());
  }

  function avatarHTML(profile, sizeClass) {
    const color = profile.avatar_color || '#8b93a7';
    if (profile.avatar_url) {
      return `<div class="${sizeClass}" style="background:${color};"><img src="${escapeHtml(profile.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>`;
    }
    return `<div class="${sizeClass}" style="background:${color};">${avatarInitials(profile.username)}</div>`;
  }

  function rankBadgeHTML(rank) {
    if (!rank || !RANK_LABELS[rank]) return '';
    return `<span class="rank-badge rank-${rank}">${RANK_LABELS[rank]}</span>`;
  }

  function verifiedBadgeHTML(profile) {
    return profile && profile.verified ? '<span class="verified-badge" title="Cuenta verificada por AR4">✔</span>' : '';
  }

  function myEffectiveRank() {
    return (myProfile && myProfile.effectiveRank) || 'basico';
  }

  function levelFromPoints(points) {
    return Math.floor((points || 0) / 100) + 1;
  }

  function currentRooms() {
    return RANK_ORDER[myEffectiveRank()] >= RANK_ORDER.elite ? [...BASE_ROOMS, ELITE_ROOM] : BASE_ROOMS;
  }

  async function callFunction(name, payload) {
    const user = netlifyIdentity.currentUser();
    if (!user) throw new Error('Debes iniciar sesión.');
    const jwt = await user.jwt();
    const res = await fetch('/.netlify/functions/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(payload || {})
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error desconocido');
    return data;
  }

  async function callFunctionGET(name) {
    const user = netlifyIdentity.currentUser();
    if (!user) throw new Error('Debes iniciar sesión.');
    const jwt = await user.jwt();
    const res = await fetch('/.netlify/functions/' + name, { headers: { 'Authorization': 'Bearer ' + jwt } });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error desconocido');
    return data;
  }

  async function fetchMyProfile() {
    const user = netlifyIdentity.currentUser();
    if (!user) return null;
    const jwt = await user.jwt();
    const res = await fetch('/.netlify/functions/community-profile', {
      headers: { 'Authorization': 'Bearer ' + jwt }
    });
    const data = await res.json();
    return data.success ? data.profile : null;
  }

  async function callFunctionGETPublic(name) {
    const res = await fetch('/.netlify/functions/' + name);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error desconocido');
    return data;
  }

  function isLoggedIn() {
    return !!netlifyIdentity.currentUser();
  }

  function requireAuthOrPrompt() {
    if (isLoggedIn()) return true;
    showJoinPrompt();
    return false;
  }

  function showJoinPrompt() {
    let el = document.getElementById('communityJoinPrompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'communityJoinPrompt';
      el.className = 'join-prompt-overlay';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => { if (e.target === el) el.classList.remove('visible'); });
    }
    el.innerHTML = `
      <div class="join-prompt-card glass-card">
        <button class="join-prompt-close" id="joinPromptClose" type="button">✕</button>
        <h3>Únete gratis a AR4 Mercados</h3>
        <p>Crea tu cuenta para participar en la comunidad, publicar tus análisis, seguir traders profesionales y acceder a herramientas exclusivas.</p>
        <div class="join-prompt-actions">
          <button class="btn btn-gold" id="joinPromptSignup" type="button">Crear cuenta</button>
          <button class="btn btn-outline" id="joinPromptLogin" type="button">Iniciar sesión</button>
        </div>
      </div>
    `;
    el.classList.add('visible');
    document.getElementById('joinPromptClose').addEventListener('click', () => el.classList.remove('visible'));
    document.getElementById('joinPromptSignup').addEventListener('click', () => { el.classList.remove('visible'); netlifyIdentity.open('signup'); });
    document.getElementById('joinPromptLogin').addEventListener('click', () => { el.classList.remove('visible'); netlifyIdentity.open('login'); });
  }

  function guestShellHTML() {
    return `
      <div class="community-guest-banner glass-card">
        <div>
          <h3>Únete gratis a la comunidad AR4</h3>
          <p>Publica tus análisis, sigue a otros traders, comenta, reacciona y construye tu reputación.</p>
        </div>
        <div class="community-guest-actions">
          <button class="btn btn-gold" id="guestSignupBtn" type="button">Crear cuenta</button>
          <button class="btn btn-outline" id="guestLoginBtn" type="button">Iniciar sesión</button>
        </div>
      </div>
      ${storiesBarHTML()}
      <div class="community-tabs">
        <button class="community-tab-btn active" data-view="resumen">🏠 Resumen</button>
        <button class="community-tab-btn" data-view="foro">📋 Foro de ideas</button>
        <button class="community-tab-btn" data-view="ranking">🏆 Ranking</button>
      </div>
      <div id="communityMainView"><p class="footer-text">Cargando...</p></div>
    `;
  }

  function avatarPickerHTML(selectedColor) {
    return `
      <label>Color de avatar</label>
      <div class="avatar-picker">
        ${AVATAR_COLORS.map((c) => `<button type="button" class="avatar-swatch${c === selectedColor ? ' selected' : ''}" data-color="${c}" style="background:${c};" aria-label="Elegir color ${c}"></button>`).join('')}
      </div>
    `;
  }

  function socialLinksFormHTML(socialLinks) {
    const links = socialLinks || {};
    return `
      <label style="margin-top:18px;">Redes sociales (opcional)</label>
      <div class="social-links-form">
        ${Object.keys(SOCIAL_META).map((key) => `
          <div class="social-links-row">
            <span class="social-links-icon">${SOCIAL_META[key].icon}</span>
            <input type="text" id="cpSocial_${key}" placeholder="${SOCIAL_META[key].placeholder}" maxlength="30" value="${escapeHtml(links[key] || '')}">
          </div>
        `).join('')}
      </div>
    `;
  }

  function profileSetupHTML(isEdit) {
    const p = isEdit ? myProfile : null;
    const selectedColor = (p && p.avatar_color) || AVATAR_COLORS[0];
    return `
      <div class="community-form">
        <h3 style="margin-bottom:4px;">${isEdit ? 'Editar tu perfil' : 'Crea tu perfil de comunidad'}</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;">${isEdit ? 'Actualiza cómo te ven los demás en la comunidad.' : 'Elige un nombre de usuario para publicar, votar y chatear. Recibes 20 puntos de bienvenida al crearlo.'}</p>
        <label for="cpUsername">Nombre de usuario</label>
        <input type="text" id="cpUsername" placeholder="ej. TraderLima2026" maxlength="24" value="${isEdit ? escapeHtml(p.username) : ''}">
        <label for="cpBio">Bio (opcional)</label>
        <textarea id="cpBio" maxlength="160" placeholder="Cuéntanos qué operas o qué te interesa aprender...">${isEdit ? escapeHtml(p.bio || '') : ''}</textarea>
        <label for="cpStyle">Estilo de trading (opcional)</label>
        <select id="cpStyle">
          <option value="">Sin especificar</option>
          ${TRADING_STYLES.map((s) => `<option value="${s}"${isEdit && p.trading_style === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
        <label for="cpPhone">Teléfono (opcional, privado — no se muestra a otros usuarios)</label>
        <input type="tel" id="cpPhone" placeholder="ej. +51 999 999 999" maxlength="20" value="${isEdit && p.phone ? escapeHtml(p.phone) : ''}">
        ${isEdit ? socialLinksFormHTML(p.social_links) : ''}
        ${avatarPickerHTML(selectedColor)}
        <button class="btn btn-gold" id="cpSubmit" style="margin-top:14px;">${isEdit ? 'Guardar cambios' : 'Crear perfil'}</button>
        ${isEdit ? '<button class="btn btn-outline" id="cpCancel" style="margin-top:14px;margin-left:8px;">Cancelar</button>' : ''}
        <div class="community-form-msg" id="cpMsg"></div>
      </div>
    `;
  }

  function avatarShopHTML(ownedIds) {
    const rank = myEffectiveRank();
    const isAdmin = rank === 'administrador';

    function cardHTML(a, isPremium) {
      const owned = !isPremium || isAdmin || ownedIds.includes(a.id);
      const isCurrent = myProfile.avatar_url === a.url;
      const priceLabel = isPremium
        ? (owned ? (isAdmin ? 'Incluido (admin)' : 'Ya lo tienes') : `S/ ${a.priceSoles.toFixed(2)}`)
        : 'Gratis';
      return `
        <div class="avatar-shop-card${isCurrent ? ' current' : ''}">
          <img src="${a.url}" alt="${escapeHtml(a.name)}">
          <strong>${escapeHtml(a.name)}</strong>
          <span class="avatar-price">${priceLabel}</span>
          <button class="btn ${owned ? 'btn-outline' : 'btn-gold'} btn-block avatar-action-btn" data-avatar-id="${a.id}" data-owned="${owned}" data-premium="${isPremium}" ${isCurrent ? 'disabled' : ''}>
            ${isCurrent ? 'Seleccionado' : (owned ? 'Usar' : 'Comprar')}
          </button>
        </div>
      `;
    }

    return `
      <div class="community-form">
        <h3 style="margin-bottom:4px;">Tienda de avatares</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">Elige un avatar gratuito o desbloquea uno exclusivo. Los pagos se procesan de forma segura vía Mercado Pago.</p>
        <h4 style="font-size:0.9rem;margin-bottom:10px;">Gratuitos</h4>
        <div class="avatar-shop-grid">${FREE_AVATARS.map((a) => cardHTML(a, false)).join('')}</div>
        <h4 style="font-size:0.9rem;margin:24px 0 10px;">Exclusivos${isAdmin ? ' <span style="color:var(--gold-bright);font-size:0.76rem;">(incluidos en tu rango de administrador)</span>' : ''}</h4>
        <div class="avatar-shop-grid">${PREMIUM_AVATARS.map((a) => cardHTML(a, true)).join('')}</div>
        <button class="btn btn-outline" id="avatarShopBackBtn" style="margin-top:22px;">← Volver</button>
        <div class="community-form-msg" id="avatarShopMsg"></div>
      </div>
    `;
  }

  function adminPanelHTML() {
    return `
      <div class="community-admin-panel">
        <h3>Panel de administrador</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;">Cambia el rango de cualquier usuario de la comunidad por su nombre de usuario.</p>
        <div class="community-form-row">
          <input type="text" id="adminUsername" placeholder="Nombre de usuario">
          <select id="adminRank">${Object.keys(RANK_LABELS).map((r) => `<option value="${r}">${RANK_LABELS[r]}</option>`).join('')}</select>
          <button class="btn btn-crimson" id="adminSetRankBtn">Aplicar rango</button>
        </div>
        <div class="community-form-msg" id="adminMsg"></div>
        <p style="color:var(--text-mid);font-size:0.86rem;margin-top:14px;">Marca o quita la insignia ✔ Verificado de un usuario.</p>
        <div class="community-form-row">
          <input type="text" id="adminVerifyUsername" placeholder="Nombre de usuario">
          <select id="adminVerifyValue"><option value="true">Verificar ✔</option><option value="false">Quitar verificación</option></select>
          <button class="btn btn-crimson" id="adminSetVerifiedBtn">Aplicar</button>
        </div>
        <div class="community-form-msg" id="adminVerifyMsg"></div>
      </div>
    `;
  }

  function foroPanelHTML() {
    const rank = myEffectiveRank();
    const basicoNote = !myProfile
      ? '<p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Crea tu cuenta gratis para publicar tu propio análisis.</p>'
      : rank === 'basico'
        ? '<p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Rango Básico: 1 publicación cada 24 horas. Sube a VIP para publicar sin límite.</p>'
        : '';
    return `
      <div class="community-form">
        <h3 style="margin-bottom:14px;">¿Qué oportunidad estás viendo hoy?</h3>
        <label for="postCategory">Categoría</label>
        <select id="postCategory">${CATEGORY_LABELS.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        <label for="postSymbol">Instrumento (opcional, ej. EUR/USD, ORO, BTC/USD)</label>
        <input type="text" id="postSymbol" maxlength="40">
        <label for="postTitle">Título</label>
        <input type="text" id="postTitle" maxlength="120">
        <label for="postBody">Tu análisis</label>
        <textarea id="postBody" maxlength="2000"></textarea>
        <label>Tu sesgo (opcional) — alimenta el Pulso de Sentimiento de la comunidad</label>
        <div class="sentiment-picker" id="sentimentPicker">
          <button type="button" class="sentiment-option" data-sentiment="alcista">🟢 Alcista</button>
          <button type="button" class="sentiment-option" data-sentiment="bajista">🔴 Bajista</button>
          <button type="button" class="sentiment-option" data-sentiment="neutral">⚪ Neutral</button>
        </div>
        <div class="comment-attach-row" style="margin-top:12px;">
          <button type="button" class="comment-attach-btn" id="postAttachBtn">📎 Adjuntar imagen, video o PDF</button>
          <input type="file" id="postMediaInput" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,application/pdf" hidden>
          <span class="comment-attach-name" id="postMediaName"></span>
        </div>
        <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-weight:400;text-transform:none;font-family:inherit;cursor:pointer;">
          <input type="checkbox" id="postAddPoll" style="width:16px;height:16px;"> Agregar una encuesta (opcional)
        </label>
        <div id="postPollFields" hidden style="margin-top:10px;">
          <input type="text" id="postPollOption0" maxlength="60" placeholder="Opción 1" style="margin-bottom:8px;">
          <input type="text" id="postPollOption1" maxlength="60" placeholder="Opción 2" style="margin-bottom:8px;">
          <input type="text" id="postPollOption2" maxlength="60" placeholder="Opción 3 (opcional)" style="margin-bottom:8px;">
          <input type="text" id="postPollOption3" maxlength="60" placeholder="Opción 4 (opcional)">
        </div>
        <button class="btn btn-gold" id="postSubmit" style="margin-top:14px;">Publicar (+10 pts)</button>
        <div class="community-form-msg" id="postMsg"></div>
        ${basicoNote}
        <p style="color:var(--text-low);font-size:0.76rem;margin-top:10px;">Si indicas un instrumento reconocido (ej. EUR/USD, USD/MXN, ORO, BTC/USD), tu publicación mostrará automáticamente un gráfico de TradingView con medias móviles. Archivos hasta 8 MB.</p>
      </div>

      <div class="section-head">
        <h2>Ideas de la comunidad</h2>
        <button class="filter-chip" id="bookmarksToggleBtn" data-filter="all">🔖 Ver guardados</button>
      </div>
      ${activeTagFilter ? `<div class="active-filter-chip">Filtrando por <strong>${escapeHtml(activeTagFilter)}</strong> <button id="clearTagFilterBtn" type="button">✕ Quitar</button></div>` : ''}
      <div id="communityFeed"><p class="footer-text">Cargando publicaciones...</p></div>
    `;
  }

  function chatPanelHTML() {
    return `
      <p style="color:var(--text-low);font-size:0.8rem;margin-bottom:14px;">Chat moderado automáticamente. Sé respetuoso, no promociones esquemas de rentabilidad garantizada ni compartas enlaces externos. Las imágenes no pasan por moderación automática — repórtanos cualquier abuso.</p>
      <div class="discord-chat-shell">
        <div class="discord-sidebar">
          <div class="discord-sidebar-title">Salas</div>
          ${currentRooms().map(r => `<button class="discord-room-btn${r.id === currentRoom ? ' active' : ''}" data-room="${r.id}">${r.label}</button>`).join('')}
        </div>
        <div class="discord-main">
          <div class="discord-header" id="communityChatHeader"></div>
          <div class="discord-messages" id="communityChatMessages"><p class="footer-text">Cargando chat...</p></div>
          <div class="discord-input-row">
            <button class="discord-attach-btn" id="communityChatAttachBtn" type="button" title="Adjuntar imagen">📎</button>
            <input type="file" id="communityChatImageInput" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            <input type="text" id="communityChatInput" maxlength="500" placeholder="Escribe un mensaje...">
            <button class="discord-send-btn" id="communityChatSendBtn">Enviar</button>
          </div>
        </div>
      </div>
    `;
  }

  function rankingPanelHTML() {
    return `
      <div class="leaderboard-grid leaderboard-grid-3">
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">🔥 Ranking semanal</h2></div>
          <div id="leaderboardWeekly"><p class="footer-text">Cargando ranking...</p></div>
        </div>
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">📅 Ranking mensual</h2></div>
          <div id="leaderboardMonthly"><p class="footer-text">Cargando ranking...</p></div>
        </div>
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">🏆 Ranking histórico</h2></div>
          <div id="leaderboardAllTime"><p class="footer-text">Cargando ranking...</p></div>
        </div>
      </div>
    `;
  }

  function leaderboardListHTML(rows) {
    if (!rows || !rows.length) return '<p class="footer-text">Todavía no hay datos suficientes.</p>';
    return `<div class="leaderboard-list">${rows.map((p, i) => `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">#${i + 1}</span>
        ${avatarHTML(p, 'trader-avatar')}
        <div class="leaderboard-name"><strong>${escapeHtml(p.username)}</strong>${verifiedBadgeHTML(p)}${rankBadgeHTML(p.rank)}</div>
        <span class="leaderboard-points">${p.points} pts</span>
      </div>
    `).join('')}</div>`;
  }

  async function loadLeaderboard() {
    const weeklyEl = document.getElementById('leaderboardWeekly');
    const monthlyEl = document.getElementById('leaderboardMonthly');
    const allTimeEl = document.getElementById('leaderboardAllTime');
    if (!weeklyEl || !allTimeEl) return;
    try {
      const data = await callFunctionGETPublic('community-leaderboard');
      weeklyEl.innerHTML = leaderboardListHTML(data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })));
      if (monthlyEl) monthlyEl.innerHTML = leaderboardListHTML((data.monthly || []).map((p) => ({ ...p, points: p.monthlyPoints })));
      allTimeEl.innerHTML = leaderboardListHTML(data.allTime);
    } catch (e) {
      weeklyEl.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
      if (monthlyEl) monthlyEl.innerHTML = '';
      allTimeEl.innerHTML = '';
    }
  }

  function tradingDnaPanelHTML() {
    return `
      <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">Calculado en tiempo real a partir de las operaciones que registraste en tu <a href="herramientas.html">diario de trading</a>. Ningún dato aquí está inventado — si no ves algo, es porque todavía no lo registraste.</p>
      <div id="tradingDnaContent"><p class="footer-text">Cargando tu Trading DNA...</p></div>
    `;
  }

  function dnaStatCardHTML(label, value, sublabel) {
    return `
      <div class="dna-stat-card">
        <span class="dna-stat-label">${label}</span>
        <strong class="dna-stat-value">${value}</strong>
        ${sublabel ? `<span class="dna-stat-sub">${sublabel}</span>` : ''}
      </div>
    `;
  }

  async function loadTradingDna() {
    const el = document.getElementById('tradingDnaContent');
    if (!el) return;
    try {
      const data = await callFunctionGET('community-trading-dna');
      if (!data.hasData) {
        el.innerHTML = `
          <div class="community-form" style="text-align:center;">
            <p style="color:var(--text-mid);">Todavía no registraste ninguna operación.</p>
            <a href="herramientas.html" class="btn btn-gold" style="margin-top:10px;">Ir al diario de trading</a>
          </div>
        `;
        return;
      }

      const cards = [
        dnaStatCardHTML('Operaciones registradas', data.totalTrades, `${data.closedTrades} cerradas · ${data.openTrades} abiertas`),
        data.winRate !== null ? dnaStatCardHTML('Win rate', data.winRate + '%', `sobre ${data.closedTrades} cerradas`) : null,
        dnaStatCardHTML('Sesgo direccional', `${data.longPct}% 📈 / ${data.shortPct}% 📉`, 'long vs. short'),
        data.favoriteSymbol ? dnaStatCardHTML('Instrumento favorito', data.favoriteSymbol.symbol, `${data.favoriteSymbol.count} operaciones`) : null,
        data.avgRR !== null ? dnaStatCardHTML('R:R promedio realizado', '1:' + data.avgRR, `sobre ${data.rrSampleSize} operaciones con datos completos`) : null,
        data.currentStreak ? dnaStatCardHTML('Racha actual', data.currentStreak.count + ' ' + (data.currentStreak.type === 'ganadora' ? '✅' : '❌'), data.currentStreak.type) : null,
        data.topEmotion ? dnaStatCardHTML('Estado emocional frecuente', data.topEmotion.emotion, `${data.topEmotion.count} veces`) : null
      ].filter(Boolean).join('');

      el.innerHTML = `<div class="dna-stat-grid">${cards}</div>`;
    } catch (e) {
      el.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
    }
  }

  function badgesRowHTML(badges) {
    if (!badges || !badges.length) return '';
    return `<div class="community-badges">${badges.map((b) => {
      const meta = BADGE_META[b];
      return meta ? `<span class="badge-chip" title="${escapeHtml(meta.name)}">${meta.icon}</span>` : '';
    }).join('')}</div>`;
  }

  function socialLinksRowHTML(socialLinks) {
    const links = socialLinks || {};
    const keys = Object.keys(SOCIAL_META).filter((k) => links[k]);
    if (!keys.length) return '';
    return `<div class="social-links-row-display">${keys.map((k) => `<a href="${SOCIAL_META[k].urlBase}${encodeURIComponent(links[k])}" target="_blank" rel="noopener" title="${k}">${SOCIAL_META[k].icon}</a>`).join('')}</div>`;
  }

  function dashboardShellHTML() {
    const rank = myEffectiveRank();
    const isAdmin = rank === 'administrador';
    const styleTag = myProfile.trading_style ? `<span class="instrument-badge">${escapeHtml(myProfile.trading_style)}</span>` : '';
    const streak = myProfile.streak_days || 0;
    const streakChip = streak > 0 ? `<span class="streak-chip">🔥 ${streak} ${streak === 1 ? 'día' : 'días'}</span>` : '';
    return `
      <div class="community-header-card">
        <div class="community-user-chip">
          ${avatarHTML(myProfile, 'trader-avatar')}
          <div><h4>${escapeHtml(myProfile.username)} ${rankBadgeHTML(rank)} <span class="level-badge">Nv. ${levelFromPoints(myProfile.points)}</span> ${streakChip}</h4><span style="color:var(--text-mid);font-size:0.8rem;">${escapeHtml(myProfile.bio) || 'Miembro de la comunidad AR4'} ${styleTag}</span>${badgesRowHTML(myProfile.badges)}${socialLinksRowHTML(myProfile.social_links)}</div>
        </div>
        <div class="community-points" id="communityPointsDisplay">${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span></div>
        <div style="color:var(--text-mid);font-size:0.8rem;margin-bottom:10px;" id="communityFollowCounts"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline" id="communityAvatarShopBtn">Cambiar avatar</button>
          <button class="btn btn-outline" id="communityEditProfileBtn">Editar perfil</button>
          <button class="btn btn-outline" id="communityRedeemBtn">Canjear puntos</button>
          <button class="btn btn-outline" id="communityDonateBtn">🎁 Donar puntos</button>
        </div>
        <div class="community-donate-form" id="communityDonateForm" hidden>
          <input type="text" id="donateUsername" placeholder="Usuario destinatario" maxlength="24">
          <input type="number" id="donateAmount" placeholder="Puntos (5-500)" min="5" max="500">
          <button class="btn btn-gold" id="donateSubmitBtn">Enviar</button>
        </div>
      </div>
      <div class="community-form-msg" id="redeemMsg" style="margin-bottom:14px;"></div>
      ${!window.AR4_PREMIUM ? '<button class="btn btn-outline" id="bootstrapAdminBtn" style="font-size:0.72rem;padding:6px 10px;margin-bottom:14px;">🔑 Activar cuenta de administrador + Premium (solo dueño del sitio)</button><div class="community-form-msg" id="bootstrapAdminMsg" style="margin-bottom:14px;"></div>' : ''}

      ${isAdmin ? adminPanelHTML() : ''}

      <div class="mission-widget" id="missionWidget"><p class="footer-text">Cargando misiones diarias...</p></div>
      <div class="mission-widget" id="weeklyChallengeWidget"><p class="footer-text">Cargando reto semanal...</p></div>

      ${storiesBarHTML()}

      <div class="community-tabs">
        <button class="community-tab-btn active" data-view="resumen">🏠 Resumen</button>
        <button class="community-tab-btn" data-view="foro">📋 Foro de ideas</button>
        <button class="community-tab-btn" data-view="chat">💬 Chat en vivo</button>
        <button class="community-tab-btn" data-view="ranking">🏆 Ranking</button>
        <button class="community-tab-btn" data-view="dna">🧬 Trading DNA</button>
      </div>
      <div id="communityMainView">${resumenPanelHTML()}</div>
    `;
  }

  function greetingWord() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  function communityPulseHTML() {
    return `
      <div class="community-pulse-grid">
        <div class="glass-card pulse-card">
          <span class="pulse-label">🟢 Conectados ahora</span>
          <span class="pulse-value" id="pulseOnlineCount">—</span>
        </div>
        <div class="glass-card pulse-card">
          <span class="pulse-label">📝 Ideas publicadas</span>
          <span class="pulse-value" id="pulsePostsCount">—</span>
        </div>
        <div class="glass-card pulse-card">
          <span class="pulse-label">👥 Traders registrados</span>
          <span class="pulse-value" id="pulseTradersCount">—</span>
        </div>
      </div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">📰 Noticias y análisis IA</h2></div>
      <div id="pulseNewsIdeas" class="pulse-news-row"><p class="footer-text">Cargando noticias y análisis...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">⭐ Traders destacados</h2></div>
      <div id="pulseFeaturedTraders" class="featured-traders-row"><p class="footer-text">Cargando traders destacados...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">🔥 Tendencias</h2></div>
      <div id="pulseTrending" class="trending-bar"><p class="footer-text">Cargando tendencias...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">⚡ Actividad reciente</h2></div>
      <div id="pulseActivity"><p class="footer-text">Cargando actividad...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">🏆 Top analistas de la semana</h2></div>
      <div id="pulseTopAnalysts"><p class="footer-text">Cargando ranking...</p></div>
    `;
  }

  function newsIdeaCardHTML(item) {
    const href = item.kind === 'noticia' ? `noticia.html?slug=${encodeURIComponent(item.slug)}` : `idea.html?slug=${encodeURIComponent(item.slug)}`;
    const tag = item.kind === 'noticia' ? '📰 Noticia' : '📈 Idea';
    return `
      <a class="pulse-news-card glass-card" href="${href}">
        <span class="pulse-news-tag">${tag} · ${escapeHtml(item.category || '')}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="pulse-news-excerpt">${escapeHtml(item.excerpt || '')}</span>
        <span class="pulse-news-meta">${formatFechaPulse(item.date)}</span>
      </a>
    `;
  }

  function formatFechaPulse(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  async function loadNewsIdeasPreview(container) {
    try {
      const [noticiasRes, ideasRes] = await Promise.all([
        fetch('data/noticias.json').then((r) => r.json()).catch(() => []),
        fetch('data/ideas.json').then((r) => r.json()).catch(() => [])
      ]);
      const merged = [
        ...(noticiasRes || []).map((n) => ({ ...n, kind: 'noticia' })),
        ...(ideasRes || []).map((i) => ({ ...i, kind: 'idea' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

      if (!merged.length) { container.innerHTML = '<p class="footer-text">Todavía no hay contenido publicado.</p>'; return; }
      container.innerHTML = merged.map(newsIdeaCardHTML).join('');
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las noticias y análisis.</p>';
    }
  }

  async function loadTrending(container) {
    try {
      const { data: posts } = await sb.from('community_posts').select('body,symbol').order('created_at', { ascending: false }).limit(60);
      const tally = {};
      (posts || []).forEach((p) => {
        const tags = (p.body || '').match(/#[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]{2,20}/g) || [];
        tags.forEach((t) => { const key = t.toUpperCase(); tally[key] = (tally[key] || 0) + 1; });
        if (p.symbol) { const key = '#' + p.symbol.trim().toUpperCase().replace(/\s+/g, ''); tally[key] = (tally[key] || 0) + 1; }
      });
      const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (!sorted.length) { container.innerHTML = '<p class="footer-text">Todavía no hay suficientes publicaciones para mostrar tendencias.</p>'; return; }
      container.innerHTML = sorted.map(([tag, count]) => `<button class="trend-chip" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <span>${count}</span></button>`).join('');
      container.querySelectorAll('.trend-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTagFilter = btn.dataset.tag;
          switchDashboardView('foro');
        });
      });
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las tendencias.</p>';
    }
  }

  async function loadActivityFeed(container) {
    try {
      const [postsRes, followsRes, commentsRes] = await Promise.all([
        sb.from('community_posts').select('id,profile_id,created_at').order('created_at', { ascending: false }).limit(5),
        sb.from('follows').select('follower_id,following_id,created_at').order('created_at', { ascending: false }).limit(5),
        sb.from('comments').select('profile_id,created_at').eq('target_type', 'post').order('created_at', { ascending: false }).limit(5)
      ]);
      const events = [];
      (postsRes.data || []).forEach((p) => events.push({ type: 'post', profileId: p.profile_id, created_at: p.created_at }));
      (followsRes.data || []).forEach((f) => events.push({ type: 'follow', profileId: f.follower_id, targetId: f.following_id, created_at: f.created_at }));
      (commentsRes.data || []).forEach((c) => events.push({ type: 'comment', profileId: c.profile_id, created_at: c.created_at }));
      events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const top = events.slice(0, 8);
      if (!top.length) { container.innerHTML = '<p class="footer-text">Todavía no hay actividad reciente. ¡Sé el primero en publicar!</p>'; return; }
      const rows = await Promise.all(top.map(async (ev) => {
        const author = await getProfileById(ev.profileId);
        const name = author ? escapeHtml(author.username) : 'Alguien';
        let text;
        if (ev.type === 'post') text = `${name} publicó un análisis`;
        else if (ev.type === 'comment') text = `${name} comentó una publicación`;
        else {
          const target = await getProfileById(ev.targetId);
          text = `${name} empezó a seguir a ${target ? escapeHtml(target.username) : 'alguien'}`;
        }
        return `<div class="activity-row"><span class="activity-dot"></span><span>${text}</span><span class="activity-time">${timeAgo(ev.created_at)}</span></div>`;
      }));
      container.innerHTML = rows.join('');
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudo cargar la actividad reciente.</p>';
    }
  }

  async function loadCommunityPulse() {
    const onlineEl = document.getElementById('pulseOnlineCount');
    const postsEl = document.getElementById('pulsePostsCount');
    const tradersEl = document.getElementById('pulseTradersCount');
    const trendingEl = document.getElementById('pulseTrending');
    const activityEl = document.getElementById('pulseActivity');
    const topEl = document.getElementById('pulseTopAnalysts');
    const featuredEl = document.getElementById('pulseFeaturedTraders');
    const newsEl = document.getElementById('pulseNewsIdeas');

    if (onlineEl) onlineEl.textContent = String(presenceCount);
    if (newsEl) await loadNewsIdeasPreview(newsEl);

    if (postsEl) {
      const { count } = await sb.from('community_posts').select('id', { count: 'exact' }).limit(1);
      postsEl.textContent = count || 0;
    }
    if (tradersEl) {
      const { count } = await sb.from('profiles').select('id', { count: 'exact' }).limit(1);
      tradersEl.textContent = count || 0;
    }
    if (featuredEl) await loadFeaturedTraders(featuredEl);
    if (trendingEl) await loadTrending(trendingEl);
    if (activityEl) await loadActivityFeed(activityEl);
    if (topEl) {
      try {
        const data = await callFunctionGETPublic('community-leaderboard');
        const source = (data.weekly && data.weekly.length) ? data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })) : data.allTime;
        topEl.innerHTML = leaderboardListHTML((source || []).slice(0, 5));
      } catch (e) {
        topEl.innerHTML = '<p class="footer-text">Todavía no hay datos suficientes.</p>';
      }
    }
  }

  function guestResumenPanelHTML() {
    return communityPulseHTML();
  }

  async function loadGuestResumen() {
    await loadCommunityPulse();
  }

  function resumenPanelHTML() {
    return `
      ${communityPulseHTML()}
      <div class="community-form" id="resumenGreeting" style="margin-top:20px;">
        <p class="footer-text">Cargando resumen...</p>
      </div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">🔔 Notificaciones</h2></div>
      <div id="resumenNotifications"><p class="footer-text">Cargando...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">📌 Tu Watchlist</h2></div>
      <div id="resumenWatchlist"><p class="footer-text">Cargando...</p></div>
    `;
  }

  function notificationRowHTML(n) {
    const actorName = n.actor ? escapeHtml(n.actor.username) : 'Alguien';
    let text;
    if (n.type === 'follow') text = `${actorName} empezó a seguirte`;
    else if (n.type === 'mention') text = `${actorName} te mencionó en un comentario`;
    else text = `${actorName} respondió a tu comentario`;
    return `
      <div class="mission-row">
        <span class="mission-icon">${n.read ? '·' : '🔔'}</span>
        <div class="mission-info">
          <strong style="font-weight:${n.read ? '400' : '700'};">${text}</strong>
          <span style="color:var(--text-low);font-size:0.76rem;">${timeAgo(n.created_at)}</span>
        </div>
      </div>
    `;
  }

  function mountResumenTicker(container, items) {
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = '<p class="footer-text">Todavía no tienes símbolos en tu watchlist. <a href="herramientas.html">Agrega algunos aquí</a>.</p>';
      return;
    }
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.text = JSON.stringify({
      symbols: items.map((it) => ({ proName: it.symbol, title: it.label })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'compact',
      colorTheme: 'dark',
      locale: 'es'
    });
    container.appendChild(script);
  }

  async function loadResumen() {
    const greetingEl = document.getElementById('resumenGreeting');
    const notifEl = document.getElementById('resumenNotifications');
    const watchlistEl = document.getElementById('resumenWatchlist');
    if (!greetingEl) return;

    loadCommunityPulse();

    const streak = myProfile.streak_days || 0;
    greetingEl.innerHTML = `
      <h3 style="margin-bottom:4px;">${greetingWord()}, ${escapeHtml(myProfile.username)} 👋</h3>
      <p style="color:var(--text-mid);font-size:0.86rem;">Nivel ${levelFromPoints(myProfile.points)} · ${myProfile.points} pts${streak > 0 ? ` · 🔥 ${streak} ${streak === 1 ? 'día' : 'días'} de racha` : ''}</p>
    `;

    if (notifEl) {
      try {
        const data = await callFunctionGET('community-notifications');
        const notifs = data.notifications || [];
        notifEl.innerHTML = notifs.length
          ? notifs.slice(0, 8).map(notificationRowHTML).join('')
          : '<p class="footer-text">No tienes notificaciones nuevas.</p>';
      } catch (e) {
        notifEl.innerHTML = '<p class="footer-text">No se pudieron cargar las notificaciones.</p>';
      }
    }

    if (watchlistEl) {
      try {
        const data = await callFunctionGET('community-watchlist');
        watchlistEl.innerHTML = '<div id="resumenTickerContainer" class="tradingview-widget-container"></div>';
        mountResumenTicker(document.getElementById('resumenTickerContainer'), data.items);
      } catch (e) {
        watchlistEl.innerHTML = '<p class="footer-text">Agrega símbolos en <a href="herramientas.html">Herramientas</a> para verlos aquí.</p>';
      }
    }
  }

  async function loadFollowCounts() {
    const el = document.getElementById('communityFollowCounts');
    if (!el) return;
    try {
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        sb.from('follows').select('id', { count: 'exact' }).eq('following_id', myProfile.id).limit(1),
        sb.from('follows').select('id', { count: 'exact' }).eq('follower_id', myProfile.id).limit(1)
      ]);
      el.textContent = `${followersCount || 0} seguidores · ${followingCount || 0} siguiendo`;
    } catch (e) {
      el.textContent = '';
    }
  }

  async function getProfileById(id) {
    if (profileCache[id]) return profileCache[id];
    const { data } = await sb.from('profiles').select('username,avatar_color,avatar_url,rank,verified').eq('id', id).single();
    if (data) profileCache[id] = data;
    return data;
  }

  function wireFollowButtons(scopeEl) {
    scopeEl.querySelectorAll('.follow-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const targetId = btn.dataset.followId;
        const currentlyFollowing = btn.dataset.following === 'true';
        btn.disabled = true;
        try {
          await callFunction('community-follow', { action: currentlyFollowing ? 'unfollow' : 'follow', targetProfileId: targetId });
          const nowFollowing = !currentlyFollowing;
          btn.dataset.following = String(nowFollowing);
          btn.textContent = nowFollowing ? '✔ Siguiendo' : '+ Seguir';
          btn.classList.toggle('following', nowFollowing);
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function featuredTraderCardHTML(p, isFollowing) {
    const isSelf = myProfile && myProfile.id === p.id;
    const followBtnHTML = !isSelf
      ? `<button class="follow-btn featured-follow-btn${isFollowing ? ' following' : ''}" data-follow-id="${p.id}" data-following="${isFollowing}">${isFollowing ? '✔ Siguiendo' : '+ Seguir'}</button>`
      : '';
    return `
      <div class="featured-trader-card glass-card">
        ${avatarHTML(p, 'trader-avatar')}
        <strong>${escapeHtml(p.username)}${verifiedBadgeHTML(p)}</strong>
        <div class="featured-trader-meta">${rankBadgeHTML(p.rank)}<span class="level-badge">Nv. ${levelFromPoints(p.points)}</span></div>
        ${p.streak_days ? `<span class="streak-chip">🔥 ${p.streak_days} ${p.streak_days === 1 ? 'día' : 'días'}</span>` : ''}
        ${followBtnHTML}
      </div>
    `;
  }

  async function loadFeaturedTraders(container) {
    try {
      const data = await callFunctionGETPublic('community-leaderboard');
      const source = (data.allTime || []).slice(0, 8);
      if (!source.length) { container.innerHTML = '<p class="footer-text">Todavía no hay suficientes traders destacados.</p>'; return; }
      let followingIds = new Set();
      if (myProfile) {
        try {
          const { data: myFollows } = await sb.from('follows').select('following_id').eq('follower_id', myProfile.id);
          followingIds = new Set((myFollows || []).map((f) => f.following_id));
        } catch (e) { /* followingIds queda vacío si falla */ }
      }
      container.innerHTML = source.map((p) => featuredTraderCardHTML(p, followingIds.has(p.id))).join('');
      wireFollowButtons(container);
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar los traders destacados.</p>';
    }
  }

  function storiesBarHTML() {
    return `<div id="storiesBar" class="stories-bar"><p class="footer-text">Cargando historias...</p></div>`;
  }

  function openStoryViewer(storiesForProfile) {
    let idx = 0;
    const overlay = document.createElement('div');
    overlay.className = 'story-viewer-overlay';
    function renderStory() {
      const s = storiesForProfile[idx];
      const mediaHTML = s.media_type === 'video'
        ? `<video src="${escapeHtml(s.media_url)}" controls autoplay class="story-viewer-media"></video>`
        : `<img src="${escapeHtml(s.media_url)}" class="story-viewer-media" alt="">`;
      overlay.innerHTML = `
        <div class="story-viewer-card">
          <button class="story-viewer-close" type="button">✕</button>
          ${mediaHTML}
          ${s.caption ? `<p class="story-viewer-caption">${escapeHtml(s.caption)}</p>` : ''}
          <div class="story-viewer-nav">
            <button type="button" class="story-viewer-prev" ${idx === 0 ? 'disabled' : ''}>‹</button>
            <span>${idx + 1} / ${storiesForProfile.length}</span>
            <button type="button" class="story-viewer-next" ${idx === storiesForProfile.length - 1 ? 'disabled' : ''}>›</button>
          </div>
        </div>
      `;
      overlay.querySelector('.story-viewer-close').addEventListener('click', () => overlay.remove());
      overlay.querySelector('.story-viewer-prev').addEventListener('click', () => { if (idx > 0) { idx--; renderStory(); } });
      overlay.querySelector('.story-viewer-next').addEventListener('click', () => { if (idx < storiesForProfile.length - 1) { idx++; renderStory(); } });
    }
    renderStory();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function openStoryUploadModal() {
    if (!requireAuthOrPrompt()) return;
    const overlay = document.createElement('div');
    overlay.className = 'story-viewer-overlay';
    overlay.innerHTML = `
      <div class="story-viewer-card story-upload-card glass-card">
        <button class="story-viewer-close" type="button">✕</button>
        <h3>Comparte una historia</h3>
        <p class="footer-text">Se muestra a toda la comunidad durante 24 horas. Imagen o video, hasta 8 MB.</p>
        <input type="file" id="storyFileInput" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm">
        <textarea id="storyCaptionInput" maxlength="140" placeholder="Descripción breve (opcional)"></textarea>
        <button class="btn btn-gold" id="storySubmitBtn" style="margin-top:10px;">Publicar historia</button>
        <div class="community-form-msg" id="storyMsg"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.story-viewer-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('storySubmitBtn').addEventListener('click', async () => {
      const fileInput = document.getElementById('storyFileInput');
      const msgEl = document.getElementById('storyMsg');
      const file = fileInput.files[0];
      if (!file) { msgEl.textContent = 'Selecciona una imagen o video.'; msgEl.className = 'community-form-msg error'; return; }
      if (file.size > 8 * 1024 * 1024) { msgEl.textContent = 'El archivo no puede pesar más de 8 MB.'; msgEl.className = 'community-form-msg error'; return; }
      const btn = document.getElementById('storySubmitBtn');
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const base64 = await fileToBase64(file);
        const caption = document.getElementById('storyCaptionInput').value.trim();
        await callFunction('community-story-post', { mediaBase64: base64, mediaType: file.type, caption });
        overlay.remove();
        const bar = document.getElementById('storiesBar');
        if (bar) loadStoriesBar(bar);
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
        btn.disabled = false;
      }
    });
  }

  async function loadStoriesBar(container) {
    try {
      const nowIso = new Date().toISOString();
      const { data: stories } = await sb.from('stories').select('*').gt('expires_at', nowIso).order('created_at', { ascending: false }).limit(60);
      const byProfile = {};
      (stories || []).forEach((s) => {
        if (!byProfile[s.profile_id]) byProfile[s.profile_id] = [];
        byProfile[s.profile_id].push(s);
      });
      const profileIds = Object.keys(byProfile);

      const addBubbleHTML = `<div class="story-bubble story-add-bubble" id="storyAddBtn"><span class="story-add-icon">+</span><span class="story-bubble-label">Tu historia</span></div>`;

      if (!profileIds.length) {
        container.innerHTML = addBubbleHTML + '<p class="footer-text" style="padding:10px 4px;">Nadie ha publicado historias todavía.</p>';
      } else {
        const rows = await Promise.all(profileIds.map(async (pid) => {
          const author = await getProfileById(pid) || { username: 'Usuario', avatar_color: '#8b93a7' };
          return `<div class="story-bubble" data-profile-id="${pid}">${avatarHTML(author, 'trader-avatar')}<span class="story-bubble-label">${escapeHtml(author.username)}</span></div>`;
        }));
        container.innerHTML = addBubbleHTML + rows.join('');
      }

      document.getElementById('storyAddBtn').addEventListener('click', openStoryUploadModal);
      container.querySelectorAll('.story-bubble[data-profile-id]').forEach((el) => {
        el.addEventListener('click', () => openStoryViewer(byProfile[el.dataset.profileId]));
      });
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las historias.</p>';
    }
  }

  function reactionsRowHTML(postId) {
    const counts = reactionCache[postId] || {};
    return `
      <div class="community-reactions" data-post-id="${postId}">
        ${REACTIONS.map((r) => `<button class="reaction-btn" data-emoji="${r.emoji}" title="${r.label}">${r.emoji} <span>${counts[r.emoji] || 0}</span></button>`).join('')}
      </div>
    `;
  }

  function pollHTML(post) {
    if (!post.poll_options) return '';
    const counts = post.poll_votes_count || post.poll_options.map(() => 0);
    const total = counts.reduce((a, v) => a + v, 0);
    const votedIndex = localStorage.getItem('ar4PollVoted_' + post.id);

    if (votedIndex !== null) {
      return `
        <div class="poll-box" data-post-id="${post.id}">
          ${post.poll_options.map((opt, i) => {
            const pct = total ? Math.round((counts[i] / total) * 100) : 0;
            const isMine = String(i) === votedIndex;
            return `
              <div class="poll-result-row${isMine ? ' poll-my-vote' : ''}">
                <div class="poll-result-head"><span>${escapeHtml(opt)}${isMine ? ' ✓' : ''}</span><strong>${pct}%</strong></div>
                <div class="poll-result-bar-track"><div class="poll-result-bar-fill" style="width:${pct}%;"></div></div>
              </div>
            `;
          }).join('')}
          <span class="news-meta">${total} voto${total === 1 ? '' : 's'}</span>
        </div>
      `;
    }

    return `
      <div class="poll-box poll-unvoted" data-post-id="${post.id}">
        ${post.poll_options.map((opt, i) => `<button class="poll-option-btn" data-poll-post="${post.id}" data-poll-option="${i}">${escapeHtml(opt)}</button>`).join('')}
      </div>
    `;
  }

  const SENTIMENT_META = {
    alcista: { icon: '🟢', label: 'Alcista' },
    bajista: { icon: '🔴', label: 'Bajista' },
    neutral: { icon: '⚪', label: 'Neutral' }
  };

  function postCardHTML(post, authorProfile, bookmarkedIds, followingIds) {
    const symbolTag = post.symbol ? `<span class="instrument-badge">${escapeHtml(post.symbol)}</span>` : '';
    const sentimentTag = post.sentiment && SENTIMENT_META[post.sentiment]
      ? `<span class="instrument-badge">${SENTIMENT_META[post.sentiment].icon} ${SENTIMENT_META[post.sentiment].label}</span>`
      : '';
    const resolvedSymbol = resolvePostSymbol(post.symbol);
    const chartHTML = resolvedSymbol
      ? `<div class="community-post-chart"><div class="tradingview-widget-container" id="postChart-${post.id}"></div></div>`
      : '';
    let mediaHTML = '';
    if (post.media_url && post.media_type === 'image') {
      mediaHTML = `<img class="community-post-media-image" src="${escapeHtml(post.media_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">`;
    } else if (post.media_url && post.media_type === 'video') {
      mediaHTML = `<video class="community-post-media-video" src="${escapeHtml(post.media_url)}" controls preload="metadata"></video>`;
    } else if (post.media_url && post.media_type === 'pdf') {
      mediaHTML = `<a class="community-post-media-pdf" href="${escapeHtml(post.media_url)}" target="_blank" rel="noopener">📄 Ver documento PDF adjunto</a>`;
    }
    const isBookmarked = bookmarkedIds && bookmarkedIds.has(post.id);
    const isFollowing = followingIds && followingIds.has(authorProfile.id);
    const followBtnHTML = (myProfile && authorProfile.id !== myProfile.id)
      ? `<button class="follow-btn${isFollowing ? ' following' : ''}" data-follow-id="${authorProfile.id}" data-following="${isFollowing}">${isFollowing ? '✔ Siguiendo' : '+ Seguir'}</button>`
      : '';
    const aiTag = post.is_ai_generated ? '<span class="ai-generated-badge">🤖 Generado por IA AR4</span>' : '';
    return `
      <article class="community-post-card${post.is_ai_generated ? ' ai-generated-post' : ''}" data-post-id="${post.id}">
        <div class="community-post-head">
          ${avatarHTML(authorProfile, 'trader-avatar')}
          <div><strong>${escapeHtml(authorProfile.username)}</strong>${verifiedBadgeHTML(authorProfile)}${rankBadgeHTML(authorProfile.rank)}${aiTag}<br><span>${escapeHtml(post.category)}${symbolTag}${sentimentTag} · ${timeAgo(post.created_at)}</span></div>
          ${followBtnHTML}
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        ${chartHTML}
        ${mediaHTML}
        <p>${escapeHtml(post.body)}</p>
        ${pollHTML(post)}
        <div class="community-post-footer">
          <button class="community-vote-btn" data-vote-id="${post.id}">▲ ${post.upvotes} útil</button>
          ${reactionsRowHTML(post.id)}
          <button class="comments-toggle-btn" data-comments-toggle="${post.id}">💬 Comentarios</button>
          <button class="comments-toggle-btn bookmark-btn" data-bookmark-id="${post.id}">${isBookmarked ? '🔖 Guardado' : '🔖 Guardar'}</button>
          <button class="comments-toggle-btn share-btn" data-share-id="${post.id}">🔗 Compartir</button>
          <button class="comments-toggle-btn ask-aria-btn" data-ask-aria-title="${escapeHtml(post.title)}" data-ask-aria-body="${escapeHtml((post.body || '').slice(0, 1000))}" data-ask-aria-category="${escapeHtml(post.category || '')}">🤖 Consultar con IA</button>
        </div>
        <div class="comments-section" id="commentsFor-${post.id}" hidden></div>
      </article>
    `;
  }

  let lastLoadedPosts = [];
  let showBookmarksOnly = false;

  async function getMyBookmarks() {
    try {
      const data = await callFunctionGET('community-bookmark');
      return new Set(data.postIds || []);
    } catch (e) {
      return new Set();
    }
  }

  async function loadFeed() {
    const feedEl = document.getElementById('communityFeed');
    if (!feedEl) return;
    const { data: posts, error } = await sb
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !posts || !posts.length) {
      feedEl.innerHTML = '<p class="footer-text">Todavía no hay publicaciones. ¡Sé el primero en compartir un análisis!</p>';
      return;
    }

    lastLoadedPosts = posts;
    const bookmarkedIds = myProfile ? await getMyBookmarks() : new Set();

    const postIds = posts.map((p) => p.id);
    const { data: reactions } = await sb.from('post_reactions').select('post_id,emoji').in('post_id', postIds);
    (reactions || []).forEach((r) => {
      if (!reactionCache[r.post_id]) reactionCache[r.post_id] = {};
      reactionCache[r.post_id][r.emoji] = (reactionCache[r.post_id][r.emoji] || 0) + 1;
    });

    let followingIds = new Set();
    if (myProfile) {
      try {
        const { data: myFollows } = await sb.from('follows').select('following_id').eq('follower_id', myProfile.id);
        followingIds = new Set((myFollows || []).map((f) => f.following_id));
      } catch (e) { /* followingIds queda vacío si falla */ }
    }

    let visiblePosts = showBookmarksOnly ? posts.filter((p) => bookmarkedIds.has(p.id)) : posts;
    if (activeTagFilter) {
      const needle = activeTagFilter.replace('#', '').toUpperCase();
      visiblePosts = visiblePosts.filter((p) =>
        (p.body || '').toUpperCase().includes('#' + needle) ||
        (p.symbol || '').toUpperCase().replace(/\s+/g, '') === needle
      );
    }

    if (!visiblePosts.length) {
      feedEl.innerHTML = showBookmarksOnly
        ? '<p class="footer-text">Todavía no guardaste ninguna publicación.</p>'
        : '<p class="footer-text">No hay publicaciones que coincidan con este filtro todavía.</p>';
      return;
    }

    const cards = await Promise.all(visiblePosts.map(async (p) => {
      const author = await getProfileById(p.profile_id) || { username: 'Usuario', avatar_color: '#8b93a7', rank: 'basico' };
      return postCardHTML(p, author, bookmarkedIds, followingIds);
    }));
    feedEl.innerHTML = cards.join('');

    wireFollowButtons(feedEl);

    const sharedPostId = new URLSearchParams(window.location.search).get('post');
    if (sharedPostId && !showBookmarksOnly) {
      const alreadyVisible = document.querySelector(`.community-post-card[data-post-id="${sharedPostId}"]`);
      if (alreadyVisible) {
        alreadyVisible.classList.add('shared-post-highlight');
        alreadyVisible.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        sb.from('community_posts').select('*').eq('id', sharedPostId).single().then(async ({ data: sharedPost }) => {
          if (!sharedPost) return;
          const author = await getProfileById(sharedPost.profile_id) || { username: 'Usuario', avatar_color: '#8b93a7', rank: 'basico' };
          feedEl.insertAdjacentHTML('afterbegin', postCardHTML(sharedPost, author, bookmarkedIds));
          const el = feedEl.querySelector(`.community-post-card[data-post-id="${sharedPostId}"]`);
          if (el) {
            el.classList.add('shared-post-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }

    visiblePosts.forEach((p) => {
      const resolved = resolvePostSymbol(p.symbol);
      if (!resolved) return;
      const chartContainer = document.getElementById('postChart-' + p.id);
      if (chartContainer) mountPostChart(chartContainer, resolved);
    });

    feedEl.querySelectorAll('.poll-option-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const postId = btn.dataset.pollPost;
        const optionIndex = btn.dataset.pollOption;
        const box = btn.closest('.poll-box');
        box.querySelectorAll('.poll-option-btn').forEach((b) => (b.disabled = true));
        try {
          const data = await callFunction('community-poll-vote', { postId, optionIndex });
          localStorage.setItem('ar4PollVoted_' + postId, String(optionIndex));
          const post = lastLoadedPosts.find((p) => p.id === postId);
          if (post) post.poll_votes_count = data.counts;
          box.outerHTML = pollHTML(post || { poll_options: [], poll_votes_count: [] });
        } catch (e) {
          if (String(e.message).includes('Ya votaste')) {
            localStorage.setItem('ar4PollVoted_' + postId, 'unknown');
            const post = lastLoadedPosts.find((p) => p.id === postId);
            box.outerHTML = pollHTML(post || { poll_options: [], poll_votes_count: [] });
            return;
          }
          alert(e.message);
          box.querySelectorAll('.poll-option-btn').forEach((b) => (b.disabled = false));
        }
      });
    });

    feedEl.querySelectorAll('.bookmark-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const postId = btn.dataset.bookmarkId;
        btn.disabled = true;
        try {
          const data = await callFunction('community-bookmark', { postId });
          btn.textContent = data.bookmarked ? '🔖 Guardado' : '🔖 Guardar';
          if (showBookmarksOnly && !data.bookmarked) {
            btn.closest('.community-post-card').remove();
          }
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    feedEl.querySelectorAll('.share-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const postId = btn.dataset.shareId;
        const url = window.location.origin + window.location.pathname + '?post=' + postId;
        try {
          await navigator.clipboard.writeText(url);
          const original = btn.textContent;
          btn.textContent = '✔ Enlace copiado';
          setTimeout(() => { btn.textContent = original; }, 2000);
        } catch (e) {
          prompt('Copia este enlace:', url);
        }
      });
    });

    feedEl.querySelectorAll('.ask-aria-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof window.AR4_askAriaAbout !== 'function') return;
        const title = btn.dataset.askAriaTitle || '';
        const contextStr = `Publicación de la comunidad: "${title}" (${btn.dataset.askAriaCategory || ''}). Contenido: ${btn.dataset.askAriaBody || ''}`;
        window.AR4_askAriaAbout(`Ayúdame a entender esta publicación: "${title}"`, contextStr);
      });
    });

    feedEl.querySelectorAll('.community-vote-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        btn.disabled = true;
        try {
          const data = await callFunction('community-vote', { postId: btn.dataset.voteId });
          btn.textContent = `▲ ${data.upvotes} útil`;
        } catch (e) {
          alert(e.message);
          btn.disabled = false;
        }
      });
    });

    feedEl.querySelectorAll('.reaction-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const postId = btn.closest('.community-reactions').dataset.postId;
        const emoji = btn.dataset.emoji;
        btn.disabled = true;
        try {
          const data = await callFunction('community-react', { postId, emoji });
          reactionCache[postId] = data.counts;
          btn.closest('.community-reactions').outerHTML = reactionsRowHTML(postId);
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    feedEl.querySelectorAll('.comments-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const postId = btn.dataset.commentsToggle;
        const section = document.getElementById('commentsFor-' + postId);
        if (!section) return;
        const opening = section.hidden;
        section.hidden = !opening;
        if (opening && !section.dataset.loaded) {
          section.dataset.loaded = '1';
          if (window.AR4_initComments) window.AR4_initComments('commentsFor-' + postId, 'post', postId);
        }
      });
    });
  }

  function chatMsgHTML(msg, author) {
    const imgHTML = msg.image_url ? `<img class="discord-msg-image" src="${escapeHtml(msg.image_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">` : '';
    const textHTML = msg.body ? `<p>${escapeHtml(msg.body)}</p>` : '';
    return `
      <div class="discord-msg">
        ${avatarHTML(author, 'discord-msg-avatar')}
        <div class="discord-msg-body">
          <div class="discord-msg-head"><strong>${escapeHtml(author.username)}</strong>${rankBadgeHTML(author.rank)}<span class="discord-msg-time">${timeAgo(msg.created_at)}</span></div>
          ${textHTML}
          ${imgHTML}
        </div>
      </div>
    `;
  }

  function stopLiveUpdates() {
    if (chatChannel) { sb.removeChannel(chatChannel); chatChannel = null; }
    if (elitePollTimer) { clearInterval(elitePollTimer); elitePollTimer = null; }
  }

  async function loadEliteRoom(msgsEl) {
    try {
      const data = await callFunctionGET('community-chat-elite-messages');
      const rows = data.messages.map((m) => {
        const author = data.profiles[m.profile_id] || { username: 'Usuario', rank: 'elite' };
        return chatMsgHTML(m, author);
      });
      msgsEl.innerHTML = rows.join('') || '<p class="footer-text">Todavía no hay mensajes en Elite Traders. ¡Empieza la conversación!</p>';
      msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch (e) {
      msgsEl.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
    }
  }

  async function loadChatRoom(roomId) {
    currentRoom = roomId;
    const msgsEl = document.getElementById('communityChatMessages');
    if (!msgsEl) return;
    msgsEl.innerHTML = '<p class="footer-text">Cargando chat...</p>';

    document.querySelectorAll('.discord-room-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.room === roomId);
    });

    const meta = ROOM_META[roomId] || { icon: '💬', name: roomId, desc: '' };
    const headerEl = document.getElementById('communityChatHeader');
    if (headerEl) headerEl.innerHTML = `<span style="font-size:1.3rem;">${meta.icon}</span><div><strong>${escapeHtml(meta.name)}</strong><span>${escapeHtml(meta.desc)}</span></div>`;

    stopLiveUpdates();

    if (roomId === 'elite') {
      await loadEliteRoom(msgsEl);
      elitePollTimer = setInterval(() => loadEliteRoom(msgsEl), 6000);
      return;
    }

    const { data: messages } = await sb
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);

    const rows = await Promise.all((messages || []).map(async (m) => {
      const author = await getProfileById(m.profile_id) || { username: 'Usuario', rank: 'basico' };
      return chatMsgHTML(m, author);
    }));
    msgsEl.innerHTML = rows.join('') || '<p class="footer-text">Todavía no hay mensajes en esta sala. ¡Empieza la conversación!</p>';
    msgsEl.scrollTop = msgsEl.scrollHeight;

    chatChannel = sb
      .channel('room-' + roomId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'room_id=eq.' + roomId }, async (payload) => {
        const author = await getProfileById(payload.new.profile_id) || { username: 'Usuario', rank: 'basico' };
        msgsEl.insertAdjacentHTML('beforeend', chatMsgHTML(payload.new, author));
        msgsEl.scrollTop = msgsEl.scrollHeight;
      })
      .subscribe();
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function wireChatTabs() {
    document.querySelectorAll('.discord-room-btn').forEach((btn) => {
      btn.addEventListener('click', () => loadChatRoom(btn.dataset.room));
    });
    const sendBtn = document.getElementById('communityChatSendBtn');
    const input = document.getElementById('communityChatInput');
    const attachBtn = document.getElementById('communityChatAttachBtn');
    const fileInput = document.getElementById('communityChatImageInput');

    const canAttach = RANK_ORDER[myEffectiveRank()] >= RANK_ORDER.vip;
    if (!canAttach) {
      attachBtn.disabled = true;
      attachBtn.title = 'Enviar imágenes requiere rango VIP o superior';
    }
    attachBtn.addEventListener('click', () => { if (canAttach) fileInput.click(); });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) attachBtn.textContent = '🖼️';
    });

    async function send() {
      const text = input.value.trim();
      const file = fileInput.files[0];
      if (!text && !file) return;
      sendBtn.disabled = true;
      attachBtn.disabled = true;
      try {
        let imageBase64 = null;
        let imageType = null;
        if (file) {
          if (file.size > 4 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 4 MB.');
          imageBase64 = await fileToBase64(file);
          imageType = file.type;
        }
        await callFunction('community-chat-send', { roomId: currentRoom, body: text, imageBase64, imageType });
        input.value = '';
        fileInput.value = '';
        attachBtn.textContent = '📎';
        if (currentRoom === 'elite') await loadEliteRoom(document.getElementById('communityChatMessages'));
      } catch (e) {
        alert(e.message);
      } finally {
        sendBtn.disabled = false;
        attachBtn.disabled = !canAttach;
      }
    }
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  function switchDashboardView(view) {
    const mainView = document.getElementById('communityMainView');
    if (!mainView) return;
    document.querySelectorAll('.community-tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    stopLiveUpdates();
    if (view === 'chat' && myProfile) {
      mainView.innerHTML = chatPanelHTML();
      wireChatTabs();
      loadChatRoom(currentRoom);
    } else if (view === 'ranking') {
      mainView.innerHTML = rankingPanelHTML();
      loadLeaderboard();
    } else if (view === 'dna' && myProfile) {
      mainView.innerHTML = tradingDnaPanelHTML();
      loadTradingDna();
    } else if (view === 'resumen') {
      if (myProfile) {
        mainView.innerHTML = resumenPanelHTML();
        loadResumen();
      } else {
        mainView.innerHTML = guestResumenPanelHTML();
        loadGuestResumen();
      }
    } else {
      mainView.innerHTML = foroPanelHTML();
      wirePostForm();
      loadFeed();
    }
  }

  function wireDashboardTabs() {
    document.querySelectorAll('.community-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchDashboardView(btn.dataset.view));
    });
  }

  function wirePostForm() {
    let selectedSentiment = null;
    const sentimentPicker = document.getElementById('sentimentPicker');
    if (sentimentPicker) {
      sentimentPicker.querySelectorAll('.sentiment-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const alreadySelected = btn.classList.contains('selected');
          sentimentPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          selectedSentiment = alreadySelected ? null : btn.dataset.sentiment;
          if (selectedSentiment) btn.classList.add('selected');
        });
      });
    }

    const addPollCheckbox = document.getElementById('postAddPoll');
    const pollFields = document.getElementById('postPollFields');
    if (addPollCheckbox && pollFields) {
      addPollCheckbox.addEventListener('change', () => { pollFields.hidden = !addPollCheckbox.checked; });
    }

    const clearTagFilterBtn = document.getElementById('clearTagFilterBtn');
    if (clearTagFilterBtn) {
      clearTagFilterBtn.addEventListener('click', () => { activeTagFilter = null; switchDashboardView('foro'); });
    }

    const bookmarksToggleBtn = document.getElementById('bookmarksToggleBtn');
    if (bookmarksToggleBtn) {
      bookmarksToggleBtn.addEventListener('click', () => {
        if (!requireAuthOrPrompt()) return;
        showBookmarksOnly = !showBookmarksOnly;
        bookmarksToggleBtn.classList.toggle('active', showBookmarksOnly);
        bookmarksToggleBtn.textContent = showBookmarksOnly ? '📋 Ver todas' : '🔖 Ver guardados';
        loadFeed();
      });
    }

    let pendingPostMediaFile = null;
    const postAttachBtn = document.getElementById('postAttachBtn');
    const postMediaInput = document.getElementById('postMediaInput');
    if (postAttachBtn && postMediaInput) {
      postAttachBtn.addEventListener('click', () => {
        if (!requireAuthOrPrompt()) return;
        postMediaInput.click();
      });
      postMediaInput.addEventListener('change', () => {
        pendingPostMediaFile = postMediaInput.files[0] || null;
        document.getElementById('postMediaName').textContent = pendingPostMediaFile ? pendingPostMediaFile.name : '';
      });
    }

    const postSubmitBtn = document.getElementById('postSubmit');
    if (!postSubmitBtn) return;
    postSubmitBtn.addEventListener('click', async () => {
      if (!requireAuthOrPrompt()) return;
      const btn = document.getElementById('postSubmit');
      const msgEl = document.getElementById('postMsg');
      const title = document.getElementById('postTitle').value.trim();
      const body = document.getElementById('postBody').value.trim();
      const category = document.getElementById('postCategory').value;
      const symbol = document.getElementById('postSymbol').value.trim();

      let pollOptions = null;
      if (addPollCheckbox && addPollCheckbox.checked) {
        pollOptions = [0, 1, 2, 3]
          .map((i) => document.getElementById('postPollOption' + i).value.trim())
          .filter(Boolean);
        if (pollOptions.length < 2) {
          msgEl.textContent = 'La encuesta necesita al menos 2 opciones.';
          msgEl.className = 'community-form-msg error';
          return;
        }
      }

      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        let mediaBase64 = null;
        let mediaType = null;
        if (pendingPostMediaFile) {
          if (pendingPostMediaFile.size > 8 * 1024 * 1024) throw new Error('El archivo no puede pesar más de 8 MB.');
          mediaBase64 = await fileToBase64(pendingPostMediaFile);
          mediaType = pendingPostMediaFile.type;
        }
        await callFunction('community-post', { title, body, category, symbol, pollOptions, sentiment: selectedSentiment, mediaBase64, mediaType });
        document.getElementById('postTitle').value = '';
        document.getElementById('postBody').value = '';
        document.getElementById('postSymbol').value = '';
        pendingPostMediaFile = null;
        if (postMediaInput) postMediaInput.value = '';
        const postMediaNameEl = document.getElementById('postMediaName');
        if (postMediaNameEl) postMediaNameEl.textContent = '';
        if (sentimentPicker) {
          sentimentPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          selectedSentiment = null;
        }
        if (addPollCheckbox) {
          addPollCheckbox.checked = false;
          pollFields.hidden = true;
          [0, 1, 2, 3].forEach((i) => { document.getElementById('postPollOption' + i).value = ''; });
        }
        msgEl.textContent = '¡Publicado! Ganaste 10 puntos.';
        msgEl.className = 'community-form-msg success';
        myProfile.points += 10;
        document.getElementById('communityPointsDisplay').innerHTML = `${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span>`;
        loadFeed();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      } finally {
        btn.disabled = false;
      }
    });
  }

  function wireRedeemButton() {
    document.getElementById('communityRedeemBtn').addEventListener('click', async () => {
      const msgEl = document.getElementById('redeemMsg');
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const data = await callFunction('community-redeem-points', {});
        myProfile.points = data.remainingPoints;
        document.getElementById('communityPointsDisplay').innerHTML = `${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span>`;
        msgEl.textContent = '¡Listo! Activamos tu mes de Premium gratis.';
        msgEl.className = 'community-form-msg success';
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      }
    });
  }

  function wireDonateForm() {
    const toggleBtn = document.getElementById('communityDonateBtn');
    const form = document.getElementById('communityDonateForm');
    const submitBtn = document.getElementById('donateSubmitBtn');
    toggleBtn.addEventListener('click', () => { form.hidden = !form.hidden; });
    submitBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('redeemMsg');
      const toUsername = document.getElementById('donateUsername').value.trim();
      const amount = parseInt(document.getElementById('donateAmount').value, 10);
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      submitBtn.disabled = true;
      try {
        const data = await callFunction('community-donate-points', { toUsername, amount });
        myProfile.points = data.points;
        document.getElementById('communityPointsDisplay').innerHTML = `${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span>`;
        msgEl.textContent = `¡Listo! Le donaste ${amount} puntos a ${data.recipientUsername}.`;
        msgEl.className = 'community-form-msg success';
        document.getElementById('donateUsername').value = '';
        document.getElementById('donateAmount').value = '';
        form.hidden = true;
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function missionRowHTML(key, mission) {
    const meta = MISSION_META[key];
    const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
    const done = mission.progress >= mission.target;
    let actionHTML;
    if (mission.claimed) {
      actionHTML = '<span class="mission-done">✔ Reclamada</span>';
    } else if (done) {
      actionHTML = `<button class="btn btn-gold mission-claim-btn" data-mission="${key}">Reclamar +${mission.reward} pts</button>`;
    } else {
      actionHTML = `<span class="mission-progress-text">${mission.progress}/${mission.target}</span>`;
    }
    return `
      <div class="mission-row">
        <span class="mission-icon">${meta.icon}</span>
        <div class="mission-info">
          <strong>${meta.label}</strong>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  async function loadMissions() {
    const widget = document.getElementById('missionWidget');
    if (!widget) return;
    try {
      const data = await callFunctionGET('community-missions');
      widget.innerHTML = `
        <div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:1rem;">🎯 Misiones de hoy</h2></div>
        ${Object.keys(data.missions).map((key) => missionRowHTML(key, data.missions[key])).join('')}
      `;
      widget.querySelectorAll('.mission-claim-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await callFunction('community-claim-mission', { missionKey: btn.dataset.mission });
            myProfile.points = res.points;
            const pointsEl = document.getElementById('communityPointsDisplay');
            if (pointsEl) pointsEl.innerHTML = `${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span>`;
            loadMissions();
          } catch (e) {
            alert(e.message);
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      widget.innerHTML = '';
    }
  }

  function weeklyChallengeHTML(data) {
    const pct = Math.min(100, Math.round((data.progress / data.target) * 100));
    const done = data.progress >= data.target;
    let actionHTML;
    if (data.claimed) {
      actionHTML = '<span class="mission-done">✔ Reclamado</span>';
    } else if (done) {
      actionHTML = `<button class="btn btn-gold" id="weeklyClaimBtn">Reclamar +${data.reward} pts</button>`;
    } else {
      actionHTML = `<span class="mission-progress-text">${data.progress}/${data.target}</span>`;
    }
    return `
      <div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:1rem;">🏆 Reto semanal</h2></div>
      <div class="mission-row">
        <span class="mission-icon">⚡</span>
        <div class="mission-info">
          <strong>${data.label}</strong>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  async function loadWeeklyChallenge() {
    const widget = document.getElementById('weeklyChallengeWidget');
    if (!widget) return;
    try {
      const data = await callFunctionGET('community-weekly-challenge');
      widget.innerHTML = weeklyChallengeHTML(data);
      const btn = document.getElementById('weeklyClaimBtn');
      if (btn) {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await callFunction('community-weekly-challenge', { action: 'claim' });
            myProfile.points += res.reward;
            const pointsEl = document.getElementById('communityPointsDisplay');
            if (pointsEl) pointsEl.innerHTML = `${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span>`;
            loadWeeklyChallenge();
          } catch (e) {
            alert(e.message);
            btn.disabled = false;
          }
        });
      }
    } catch (e) {
      widget.innerHTML = '';
    }
  }

  function wireAdminPanel() {
    const btn = document.getElementById('adminSetRankBtn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const msgEl = document.getElementById('adminMsg');
      const username = document.getElementById('adminUsername').value.trim();
      const rank = document.getElementById('adminRank').value;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      btn.disabled = true;
      try {
        await callFunction('community-set-rank', { username, rank });
        msgEl.textContent = `Listo: ${username} ahora es ${RANK_LABELS[rank]}.`;
        msgEl.className = 'community-form-msg success';
        document.getElementById('adminUsername').value = '';
        delete profileCache[username];
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      } finally {
        btn.disabled = false;
      }
    });

    const verifyBtn = document.getElementById('adminSetVerifiedBtn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        const msgEl = document.getElementById('adminVerifyMsg');
        const username = document.getElementById('adminVerifyUsername').value.trim();
        const verified = document.getElementById('adminVerifyValue').value === 'true';
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        verifyBtn.disabled = true;
        try {
          await callFunction('community-set-verified', { username, verified });
          msgEl.textContent = `Listo: ${username} ${verified ? 'ahora está verificado.' : 'ya no está verificado.'}`;
          msgEl.className = 'community-form-msg success';
          document.getElementById('adminVerifyUsername').value = '';
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
        } finally {
          verifyBtn.disabled = false;
        }
      });
    }
  }

  function wireAvatarShop() {
    document.getElementById('avatarShopBackBtn').addEventListener('click', () => { shoppingAvatars = false; render(); });

    document.querySelectorAll('.avatar-action-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const avatarId = btn.dataset.avatarId;
        const owned = btn.dataset.owned === 'true';
        const msgEl = document.getElementById('avatarShopMsg');
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';

        if (owned) {
          btn.disabled = true;
          try {
            const data = await callFunction('community-set-avatar', { avatarId });
            myProfile = data.profile;
            shoppingAvatars = false;
            render();
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
          } catch (e) {
            msgEl.textContent = e.message;
            msgEl.className = 'community-form-msg error';
            btn.disabled = false;
          }
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Conectando con Mercado Pago...';
        try {
          const buyData = await callFunction('community-buy-avatar', { avatarId });
          if (buyData.alreadyOwned || buyData.free) {
            const setData = await callFunction('community-set-avatar', { avatarId });
            myProfile = setData.profile;
            shoppingAvatars = false;
            render();
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
            return;
          }
          const prefData = await callFunction('create-mercadopago-avatar-preference', { avatarId });
          window.location.href = prefData.initPoint;
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          btn.disabled = false;
          btn.textContent = 'Comprar';
        }
      });
    });
  }

  function wireProfileForm() {
    let selectedAvatarColor = document.querySelector('.avatar-swatch.selected')?.dataset.color || AVATAR_COLORS[0];
    document.querySelectorAll('.avatar-swatch').forEach((sw) => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('.avatar-swatch').forEach((s) => s.classList.remove('selected'));
        sw.classList.add('selected');
        selectedAvatarColor = sw.dataset.color;
      });
    });

    const cancelBtn = document.getElementById('cpCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { editingProfile = false; render(); });

    document.getElementById('cpSubmit').addEventListener('click', async () => {
      const btn = document.getElementById('cpSubmit');
      const msgEl = document.getElementById('cpMsg');
      const username = document.getElementById('cpUsername').value.trim();
      const bio = document.getElementById('cpBio').value.trim();
      const tradingStyle = document.getElementById('cpStyle').value;
      const phone = document.getElementById('cpPhone').value.trim();
      const socialLinks = {};
      Object.keys(SOCIAL_META).forEach((key) => {
        const input = document.getElementById('cpSocial_' + key);
        if (input) socialLinks[key] = input.value.trim();
      });
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const data = await callFunction('community-profile', { username, bio, tradingStyle, avatarColor: selectedAvatarColor, phone, socialLinks });
        myProfile = data.profile;
        editingProfile = false;
        await render();
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
        btn.disabled = false;
      }
    });
  }

  async function render() {
    const user = netlifyIdentity.currentUser();
    if (!user) {
      stopLiveUpdates();
      myProfile = null;
      currentRoom = 'forex';
      root.innerHTML = guestShellHTML();
      document.getElementById('guestSignupBtn').addEventListener('click', () => netlifyIdentity.open('signup'));
      document.getElementById('guestLoginBtn').addEventListener('click', () => netlifyIdentity.open('login'));
      wireDashboardTabs();
      switchDashboardView('resumen');
      loadStoriesBar(document.getElementById('storiesBar'));
      return;
    }

    if (!myProfile) myProfile = await fetchMyProfile();

    if (!myProfile) {
      root.innerHTML = profileSetupHTML(false);
      wireProfileForm();
      return;
    }

    if (editingProfile) {
      root.innerHTML = profileSetupHTML(true);
      wireProfileForm();
      return;
    }

    if (shoppingAvatars) {
      let owned = [];
      try {
        const data = await callFunctionGET('community-my-avatars');
        owned = data.owned || [];
      } catch (e) { /* owned queda vacío si falla */ }
      root.innerHTML = avatarShopHTML(owned);
      wireAvatarShop();
      return;
    }

    currentRoom = 'forex';
    root.innerHTML = dashboardShellHTML();
    wireRedeemButton();
    wireDonateForm();
    wireAdminPanel();
    wireDashboardTabs();
    document.getElementById('communityEditProfileBtn').addEventListener('click', () => { editingProfile = true; render(); });
    document.getElementById('communityAvatarShopBtn').addEventListener('click', () => { shoppingAvatars = true; render(); });
    const bootstrapBtn = document.getElementById('bootstrapAdminBtn');
    if (bootstrapBtn) {
      bootstrapBtn.addEventListener('click', async () => {
        const msgEl = document.getElementById('bootstrapAdminMsg');
        bootstrapBtn.disabled = true;
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        try {
          await callFunction('bootstrap-admin', {});
          msgEl.textContent = '¡Listo! Cierra sesión y vuelve a iniciarla para que se active del todo.';
          msgEl.className = 'community-form-msg success';
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          bootstrapBtn.disabled = false;
        }
      });
    }
    loadResumen();
    loadFollowCounts();
    loadMissions();
    loadWeeklyChallenge();
    loadStoriesBar(document.getElementById('storiesBar'));
  }

  const heroSignupBtn = document.getElementById('heroSignupBtn');
  if (heroSignupBtn) heroSignupBtn.addEventListener('click', (e) => { e.preventDefault(); netlifyIdentity.open('signup'); });

  function communitySidebarHTML() {
    return `
      <div class="glass-card sidebar-card">
        <h4>🟢 Conectados ahora</h4>
        <span class="sidebar-online-value" id="sidebarOnlineCount">—</span>
      </div>
      <div class="glass-card sidebar-card">
        <h4>🏆 Top analistas de la semana</h4>
        <div id="sidebarTopAnalysts"><p class="footer-text">Cargando...</p></div>
      </div>
      <div class="glass-card sidebar-card">
        <h4>📅 Próximos eventos</h4>
        <div id="sidebarCalendar"></div>
      </div>
    `;
  }

  async function loadSidebar() {
    const el = document.getElementById('communitySidebar');
    if (!el) return;
    el.innerHTML = communitySidebarHTML();

    const onlineEl = document.getElementById('sidebarOnlineCount');
    if (onlineEl) onlineEl.textContent = String(presenceCount);
    document.addEventListener('ar4-presence-update', () => {
      if (onlineEl) onlineEl.textContent = String(presenceCount);
    });

    const topEl = document.getElementById('sidebarTopAnalysts');
    if (topEl) {
      try {
        const data = await callFunctionGETPublic('community-leaderboard');
        const source = (data.weekly && data.weekly.length) ? data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })) : data.allTime;
        topEl.innerHTML = leaderboardListHTML((source || []).slice(0, 5));
      } catch (e) {
        topEl.innerHTML = '<p class="footer-text">Todavía no hay datos suficientes.</p>';
      }
    }

    const calEl = document.getElementById('sidebarCalendar');
    if (calEl) {
      calEl.innerHTML = '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
      script.async = true;
      script.text = JSON.stringify({
        colorTheme: 'dark', isTransparent: true, width: '100%', height: '300',
        locale: 'es', importanceFilter: '1', countryFilter: 'us,mx,co,cl,pe,ar,br,eu'
      });
      calEl.querySelector('.tradingview-widget-container').appendChild(script);
    }
  }

  netlifyIdentity.on('init', render);
  netlifyIdentity.on('login', () => { myProfile = null; render(); });
  netlifyIdentity.on('logout', () => { myProfile = null; render(); });
  render();
  initPresence();
  loadSidebar();
})();
