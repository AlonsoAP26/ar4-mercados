(function () {
  const SUPABASE_URL = 'https://gxiybgirkjsqnagcabnz.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_uqWQ2hoarxuLrKi816sfzw_ngOFppYx';

  if (typeof supabase === 'undefined' || typeof netlifyIdentity === 'undefined') return;
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

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
  const REACTION_EMOJI = ['🔥', '🚀', '💡', '🤔'];
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

  function loggedOutHTML() {
    return `
      <div class="promo-banner">
        <div class="promo-banner-text">
          <h3>Inicia sesión para unirte a la comunidad</h3>
          <p>Crea perfil, publica ideas, vota las de otros traders y chatea en las salas de Forex, Acciones y Criptomonedas.</p>
        </div>
        <a href="#" class="btn btn-gold" id="communityLoginBtn">Iniciar sesión / Crear cuenta</a>
      </div>
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
        <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">Elige un avatar gratuito o desbloquea uno exclusivo. Los pagos se procesan de forma segura vía Culqi.</p>
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
      </div>
    `;
  }

  function dashboardShellHTML() {
    const rank = myEffectiveRank();
    const isAdmin = rank === 'administrador';
    const basicoNote = rank === 'basico'
      ? '<p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Rango Básico: 1 publicación cada 24 horas. Sube a VIP para publicar sin límite.</p>'
      : '';

    const styleTag = myProfile.trading_style ? `<span class="instrument-badge">${escapeHtml(myProfile.trading_style)}</span>` : '';
    return `
      <div class="community-header-card">
        <div class="community-user-chip">
          ${avatarHTML(myProfile, 'trader-avatar')}
          <div><h4>${escapeHtml(myProfile.username)} ${rankBadgeHTML(rank)} <span class="level-badge">Nv. ${levelFromPoints(myProfile.points)}</span></h4><span style="color:var(--text-mid);font-size:0.8rem;">${escapeHtml(myProfile.bio) || 'Miembro de la comunidad AR4'} ${styleTag}</span></div>
        </div>
        <div class="community-points" id="communityPointsDisplay">${myProfile.points} pts<span>500 pts = 1 mes Premium gratis</span></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-outline" id="communityAvatarShopBtn">Cambiar avatar</button>
          <button class="btn btn-outline" id="communityEditProfileBtn">Editar perfil</button>
          <button class="btn btn-outline" id="communityRedeemBtn">Canjear puntos</button>
        </div>
      </div>
      <div class="community-form-msg" id="redeemMsg" style="margin-bottom:14px;"></div>

      ${isAdmin ? adminPanelHTML() : ''}

      <div class="community-form">
        <h3 style="margin-bottom:14px;">Publicar una idea</h3>
        <label for="postCategory">Categoría</label>
        <select id="postCategory">${CATEGORY_LABELS.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        <label for="postSymbol">Instrumento (opcional, ej. EUR/USD)</label>
        <input type="text" id="postSymbol" maxlength="40">
        <label for="postTitle">Título</label>
        <input type="text" id="postTitle" maxlength="120">
        <label for="postBody">Tu análisis</label>
        <textarea id="postBody" maxlength="2000"></textarea>
        <button class="btn btn-gold" id="postSubmit" style="margin-top:14px;">Publicar (+10 pts)</button>
        <div class="community-form-msg" id="postMsg"></div>
        ${basicoNote}
      </div>

      <div class="section-head"><h2>Ideas de la comunidad</h2></div>
      <div id="communityFeed"><p class="footer-text">Cargando publicaciones...</p></div>

      <div class="section-head" style="margin-top:36px;"><h2>Chat de la comunidad</h2></div>
      <p style="color:var(--text-low);font-size:0.8rem;margin-bottom:14px;">Chat moderado automáticamente. Sé respetuoso, no promociones esquemas de rentabilidad garantizada ni compartas enlaces externos. Las imágenes no pasan por moderación automática — repórtanos cualquier abuso.</p>
      <div class="discord-chat-shell">
        <div class="discord-sidebar">
          <div class="discord-sidebar-title">Salas</div>
          ${currentRooms().map(r => `<button class="discord-room-btn${r.id === currentRoom ? ' active' : ''}" data-room="${r.id}">${r.label}</button>`).join('')}
        </div>
        <div class="discord-main">
          <div class="discord-header" id="chatHeader"></div>
          <div class="discord-messages" id="chatMessages"><p class="footer-text">Cargando chat...</p></div>
          <div class="discord-input-row">
            <button class="discord-attach-btn" id="chatAttachBtn" type="button" title="Adjuntar imagen">📎</button>
            <input type="file" id="chatImageInput" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            <input type="text" id="chatInput" maxlength="500" placeholder="Escribe un mensaje...">
            <button class="discord-send-btn" id="chatSendBtn">Enviar</button>
          </div>
        </div>
      </div>
    `;
  }

  async function getProfileById(id) {
    if (profileCache[id]) return profileCache[id];
    const { data } = await sb.from('profiles').select('username,avatar_color,avatar_url,rank').eq('id', id).single();
    if (data) profileCache[id] = data;
    return data;
  }

  function reactionsRowHTML(postId) {
    const counts = reactionCache[postId] || {};
    return `
      <div class="community-reactions" data-post-id="${postId}">
        ${REACTION_EMOJI.map((e) => `<button class="reaction-btn" data-emoji="${e}">${e} <span>${counts[e] || 0}</span></button>`).join('')}
      </div>
    `;
  }

  function postCardHTML(post, authorProfile) {
    const symbolTag = post.symbol ? `<span class="instrument-badge">${escapeHtml(post.symbol)}</span>` : '';
    return `
      <article class="community-post-card" data-post-id="${post.id}">
        <div class="community-post-head">
          ${avatarHTML(authorProfile, 'trader-avatar')}
          <div><strong>${escapeHtml(authorProfile.username)}</strong>${rankBadgeHTML(authorProfile.rank)}<br><span>${escapeHtml(post.category)}${symbolTag} · ${timeAgo(post.created_at)}</span></div>
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        <p>${escapeHtml(post.body)}</p>
        <div class="community-post-footer">
          <button class="community-vote-btn" data-vote-id="${post.id}">▲ ${post.upvotes} útil</button>
          ${reactionsRowHTML(post.id)}
        </div>
      </article>
    `;
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

    const postIds = posts.map((p) => p.id);
    const { data: reactions } = await sb.from('post_reactions').select('post_id,emoji').in('post_id', postIds);
    (reactions || []).forEach((r) => {
      if (!reactionCache[r.post_id]) reactionCache[r.post_id] = {};
      reactionCache[r.post_id][r.emoji] = (reactionCache[r.post_id][r.emoji] || 0) + 1;
    });

    const cards = await Promise.all(posts.map(async (p) => {
      const author = await getProfileById(p.profile_id) || { username: 'Usuario', avatar_color: '#8b93a7', rank: 'basico' };
      return postCardHTML(p, author);
    }));
    feedEl.innerHTML = cards.join('');

    feedEl.querySelectorAll('.community-vote-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
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
    const msgsEl = document.getElementById('chatMessages');
    if (!msgsEl) return;
    msgsEl.innerHTML = '<p class="footer-text">Cargando chat...</p>';

    document.querySelectorAll('.discord-room-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.room === roomId);
    });

    const meta = ROOM_META[roomId] || { icon: '💬', name: roomId, desc: '' };
    const headerEl = document.getElementById('chatHeader');
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
    const sendBtn = document.getElementById('chatSendBtn');
    const input = document.getElementById('chatInput');
    const attachBtn = document.getElementById('chatAttachBtn');
    const fileInput = document.getElementById('chatImageInput');

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
        if (currentRoom === 'elite') await loadEliteRoom(document.getElementById('chatMessages'));
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

  function wirePostForm() {
    document.getElementById('postSubmit').addEventListener('click', async () => {
      const btn = document.getElementById('postSubmit');
      const msgEl = document.getElementById('postMsg');
      const title = document.getElementById('postTitle').value.trim();
      const body = document.getElementById('postBody').value.trim();
      const category = document.getElementById('postCategory').value;
      const symbol = document.getElementById('postSymbol').value.trim();

      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        await callFunction('community-post', { title, body, category, symbol });
        document.getElementById('postTitle').value = '';
        document.getElementById('postBody').value = '';
        document.getElementById('postSymbol').value = '';
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
          } catch (e) {
            msgEl.textContent = e.message;
            msgEl.className = 'community-form-msg error';
            btn.disabled = false;
          }
          return;
        }

        if (typeof Culqi === 'undefined') {
          msgEl.textContent = 'El pago no está disponible en este momento.';
          msgEl.className = 'community-form-msg error';
          return;
        }

        let culqiPublicKey = null;
        try {
          const r = await fetch('/.netlify/functions/culqi-config');
          const d = await r.json();
          culqiPublicKey = d.publicKey || null;
        } catch (e) { /* culqiPublicKey queda null */ }

        if (!culqiPublicKey) {
          msgEl.textContent = 'El pago no está disponible en este momento.';
          msgEl.className = 'community-form-msg error';
          return;
        }

        const avatar = PREMIUM_AVATARS.find((a) => a.id === avatarId);
        if (!avatar) return;

        Culqi.publicKey = culqiPublicKey;
        Culqi.settings({ title: 'AR4 Mercados — ' + avatar.name, currency: 'PEN', amount: Math.round(avatar.priceSoles * 100) });

        window.culqi = async function () {
          if (Culqi.token) {
            const token = Culqi.token.id;
            btn.disabled = true;
            btn.textContent = 'Procesando...';
            try {
              await callFunction('community-buy-avatar', { avatarId, token });
              msgEl.textContent = '¡Compra exitosa! Ya puedes usar tu nuevo avatar.';
              msgEl.className = 'community-form-msg success';
              shoppingAvatars = false;
              render();
            } catch (e) {
              msgEl.textContent = e.message;
              msgEl.className = 'community-form-msg error';
              btn.disabled = false;
              btn.textContent = 'Comprar';
            }
          } else if (Culqi.error) {
            msgEl.textContent = 'Error de pago: ' + (Culqi.error.user_message || 'no se pudo procesar la tarjeta');
            msgEl.className = 'community-form-msg error';
          }
        };

        Culqi.open();
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
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const data = await callFunction('community-profile', { username, bio, tradingStyle, avatarColor: selectedAvatarColor, phone });
        myProfile = data.profile;
        editingProfile = false;
        await render();
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
      root.innerHTML = loggedOutHTML();
      const loginBtn = document.getElementById('communityLoginBtn');
      if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); netlifyIdentity.open('signup'); });
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
    wirePostForm();
    wireRedeemButton();
    wireAdminPanel();
    wireChatTabs();
    document.getElementById('communityEditProfileBtn').addEventListener('click', () => { editingProfile = true; render(); });
    document.getElementById('communityAvatarShopBtn').addEventListener('click', () => { shoppingAvatars = true; render(); });
    loadFeed();
    loadChatRoom(currentRoom);
  }

  netlifyIdentity.on('init', render);
  netlifyIdentity.on('login', () => { myProfile = null; render(); });
  netlifyIdentity.on('logout', () => { myProfile = null; render(); });
  render();
})();
