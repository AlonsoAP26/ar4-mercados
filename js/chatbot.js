(function () {
  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.setAttribute('aria-label', 'Chatea con nosotros');
  launcher.innerHTML = '<span class="chat-launcher-icon">💬</span><span class="chat-launcher-text">Chatea con nosotros</span>';

  const ARIA_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=AriaAR4&backgroundColor=f0c75e';

  const greeting = document.createElement('div');
  greeting.className = 'chat-greeting';
  greeting.innerHTML = `
    <button class="chat-greeting-close" aria-label="Cerrar">✕</button>
    ¿Dudas sobre gestión de riesgo o qué broker elegir? Soy Aria, pregúntame 👋
  `;

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-identity">
        <img class="chat-header-avatar" src="${ARIA_AVATAR}" alt="Aria">
        <div>
          <div class="chat-header-title">Aria · Mentora AR4</div>
          <div class="chat-header-sub">Gestión de riesgo y emociones</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-voice-toggle" id="chatVoiceToggle" aria-pressed="false" title="Activar voz de Aria">🔇</button>
        <button class="chat-close" aria-label="Cerrar">✕</button>
      </div>
    </div>
    <div class="chat-disclaimer">Apoyo educativo sobre psicología de trading. No es asesoría financiera ni terapia profesional. En caso de crisis emocional, busca ayuda de un profesional de salud mental.</div>
    <div class="chat-quicklinks">
      <a href="ideas.html">💡 Ver Ideas de Trading</a>
      <a href="comunidad.html">💬 Ir al chat de la comunidad</a>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-row">
      <input type="text" id="chatInput" placeholder="Escribe tu mensaje..." maxlength="500">
      <button id="chatSend">Enviar</button>
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
  let voiceEnabled = localStorage.getItem('ar4ChatVoice') === '1';

  function updateVoiceToggleUI() {
    voiceToggleBtn.textContent = voiceEnabled ? '🔊' : '🔇';
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
      speakBtn.textContent = '🔊';
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
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
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

  addMessage('Hola 👋 Soy Aria, tu mentora en AR4 Mercados. Puedo ayudarte a pensar en gestión de riesgo, disciplina, o cómo manejar emociones después de una operación. ¿Qué tienes en mente?', 'bot');
})();
