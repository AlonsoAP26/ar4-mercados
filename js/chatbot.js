(function () {
  // Avatar de Aria: robot moderno (DiceBear bottts) sobre degradado dorado —
  // encaja con el tono de IA del sitio. Si la red falla, el monograma dorado
  // autocontenido queda de respaldo.
  const ARIA_AVATAR = 'https://api.dicebear.com/9.x/bottts/svg?seed=AriaBotAR4&radius=18&backgroundColor=b8860b,d4af37&backgroundType=gradientLinear';
  const ARIA_AVATAR_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#fbe9b0"/><stop offset="50%" stop-color="#f0c75e"/><stop offset="100%" stop-color="#b8860b"/>' +
    '</linearGradient></defs>' +
    '<rect width="48" height="48" rx="14" fill="#0f1625"/>' +
    '<rect x="1" y="1" width="46" height="46" rx="13" fill="none" stroke="url(#g)" stroke-width="1.5" opacity="0.7"/>' +
    '<path d="M24 12 L33 34 H28.6 L26.9 29.4 H21.1 L19.4 34 H15 Z M22.4 25.6 H25.6 L24 21 Z" fill="url(#g)"/>' +
    '</svg>');

  // Icono de chat en linea (SVG) para el lanzador: mas serio que el emoji.
  const CHAT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>';

  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.setAttribute('aria-label', 'Hablar con Aria, asistente de AR4');
  launcher.innerHTML = '<span class="chat-launcher-icon">' + CHAT_ICON + '</span><span class="chat-launcher-text">Consulta a Aria</span>';

  const greeting = document.createElement('div');
  greeting.className = 'chat-greeting';
  greeting.innerHTML = `
    <button class="chat-greeting-close" aria-label="Cerrar">✕</button>
    <strong>¿Dudas antes de operar?</strong> Soy Aria. Te ayudo con gestión de riesgo, disciplina y a elegir broker.
  `;

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-identity">
        <span class="chat-header-avatar-wrap">
          <img class="chat-header-avatar" src="${ARIA_AVATAR}" alt="Aria" onerror="this.onerror=null;this.src='${ARIA_AVATAR_FALLBACK}';">
          <span class="chat-status-dot" title="En línea"></span>
        </span>
        <div>
          <div class="chat-header-title">Aria</div>
          <div class="chat-header-sub">Asistente de AR4 · en línea</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-voice-toggle" id="chatVoiceToggle" aria-pressed="false" title="Activar voz de Aria"></button>
        <button class="chat-close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
    </div>
    <div class="chat-disclaimer">Apoyo educativo sobre estrategia, riesgo y psicología de trading. No es asesoría financiera ni terapia profesional. En una crisis emocional, acude a un profesional de salud mental.</div>
    <div class="chat-quicklinks">
      <a href="ideas.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 3 3 7-8"/><path d="M14 4h4v4"/></svg>Ideas de Trading</a>
      <a href="comunidad.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 3.5a3 3 0 0 1 0 5.8"/></svg>Comunidad</a>
      <a href="calendario.html"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>Calendario</a>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-row">
      <input type="text" id="chatInput" placeholder="Escribe tu consulta..." maxlength="500">
      <button id="chatSend" aria-label="Enviar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
      </button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(greeting);
  document.body.appendChild(panel);

  const closeBtn = panel.querySelector('.chat-close');
  const greetingClose = greeting.querySelector('.chat-greeting-close');
  const messagesEl = panel.querySelector('#chatMessages');
  const inputEl = panel.querySelector('#chatInput');
  const sendBtn = panel.querySelector('#chatSend');
  const voiceToggleBtn = panel.querySelector('#chatVoiceToggle');

  let history = [];
  let sending = false;
  let premiumCache = null;
  let pendingContext = null;
  let voiceEnabled = localStorage.getItem('ar4ChatVoice') === '1';

  const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/><path d="M18.5 6a7 7 0 0 1 0 12"/></svg>';
  const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';

  function updateVoiceToggleUI() {
    voiceToggleBtn.innerHTML = voiceEnabled ? ICON_SOUND_ON : ICON_SOUND_OFF;
    voiceToggleBtn.setAttribute('aria-pressed', String(voiceEnabled));
    voiceToggleBtn.title = voiceEnabled ? 'Voz de Aria activada (clic para silenciar)' : 'Activar voz de Aria';
  }
  updateVoiceToggleUI();

  voiceToggleBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    localStorage.setItem('ar4ChatVoice', voiceEnabled ? '1' : '0');
    updateVoiceToggleUI();
    if (!voiceEnabled && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  });

  function pickSpanishVoice() {
    if (typeof speechSynthesis === 'undefined') return null;
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => v.lang === 'es-419')
      || voices.find((v) => /^es-(MX|PE|AR|CO|CL)/i.test(v.lang))
      || voices.find((v) => /^es/i.test(v.lang))
      || null;
  }

  function speakText(text) {
    if (typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickSpanishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice ? voice.lang : 'es-ES';
    speechSynthesis.speak(utterance);
  }

  const FREE_DAILY_LIMIT = 8;

  async function isPremiumUser() {
    if (premiumCache !== null) return premiumCache;
    if (typeof window.AR4_checkPremium === 'function') {
      try { premiumCache = await window.AR4_checkPremium(); } catch (e) { premiumCache = false; }
    } else {
      premiumCache = false;
    }
    return premiumCache;
  }

  function todayKey() {
    return 'ar4ChatCount_' + new Date().toISOString().slice(0, 10);
  }

  function messagesUsedToday() {
    return parseInt(localStorage.getItem(todayKey()) || '0', 10);
  }

  function registerMessageUsed() {
    localStorage.setItem(todayKey(), String(messagesUsedToday() + 1));
  }

  function hideGreeting() {
    greeting.classList.remove('show');
    sessionStorage.setItem('ar4ChatGreetingSeen', '1');
  }

  if (!sessionStorage.getItem('ar4ChatGreetingSeen')) {
    setTimeout(() => greeting.classList.add('show'), 4000);
  }

  greetingClose.addEventListener('click', (e) => {
    e.stopPropagation();
    hideGreeting();
  });
  greeting.addEventListener('click', () => {
    hideGreeting();
    panel.classList.add('open');
  });

  launcher.addEventListener('click', () => {
    hideGreeting();
    panel.classList.toggle('open');
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;
    if (role === 'bot') {
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      const speakBtn = document.createElement('button');
      speakBtn.className = 'chat-msg-speak';
      speakBtn.setAttribute('aria-label', 'Escuchar respuesta de Aria');
      speakBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7"/></svg>';
      speakBtn.addEventListener('click', () => speakText(text));
      div.appendChild(textSpan);
      div.appendChild(speakBtn);
    } else {
      div.textContent = text;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sending) return;

    const premium = await isPremiumUser();
    if (!premium && messagesUsedToday() >= FREE_DAILY_LIMIT) {
      addMessage(text, 'user');
      const div = document.createElement('div');
      div.className = 'chat-msg error';
      div.innerHTML = `Llegaste al límite gratuito de ${FREE_DAILY_LIMIT} mensajes por hoy. <a href="membresia.html" style="color:inherit;text-decoration:underline;">Hazte Premium</a> para chatear sin límite.`;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      inputEl.value = '';
      return;
    }

    addMessage(text, 'user');
    history.push({ role: 'user', content: text });
    inputEl.value = '';
    sending = true;
    sendBtn.disabled = true;

    const thinking = document.createElement('div');
    thinking.className = 'chat-msg bot';
    thinking.textContent = 'Escribiendo...';
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser()) {
        try { headers['Authorization'] = 'Bearer ' + (await netlifyIdentity.currentUser().jwt()); } catch (e) { /* sigue sin auth si falla */ }
      }
      const payload = { messages: history };
      if (pendingContext) { payload.context = pendingContext; pendingContext = null; }

      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      thinking.remove();

      if (!res.ok) throw new Error('bad status');

      const data = await res.json();
      addMessage(data.reply, 'bot');
      history.push({ role: 'assistant', content: data.reply });
      if (!premium) registerMessageUsed();
      if (voiceEnabled) speakText(data.reply);
    } catch (e) {
      thinking.remove();
      addMessage('El asistente todavía no está conectado en esta versión del sitio. Vuelve a intentarlo cuando esté publicado con la integración activa.', 'error');
    } finally {
      sending = false;
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  addMessage('Hola, soy Aria, tu asistente en AR4 Mercados. 👋\n\nPuedo ayudarte con:\n• Gestión de riesgo y tamaño de posición\n• Disciplina y cómo manejar las emociones al operar\n• Entender una noticia o un análisis del sitio\n• Elegir broker según lo que necesitas\n\nUna sola regla, sin excepciones: te doy contexto y criterios, nunca una señal de compra o venta. ¿Por dónde empezamos?', 'bot');

  window.AR4_askAriaAbout = function (question, contextStr) {
    hideGreeting();
    panel.classList.add('open');
    pendingContext = contextStr || null;
    inputEl.value = question || '';
    inputEl.focus();
  };
})();
