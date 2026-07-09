(function () {
  const launcher = document.createElement('button');
  launcher.className = 'chat-launcher';
  launcher.setAttribute('aria-label', 'Chatea con nosotros');
  launcher.innerHTML = '<span class="chat-launcher-icon">💬</span><span class="chat-launcher-text">Chatea con nosotros</span>';

  const greeting = document.createElement('div');
  greeting.className = 'chat-greeting';
  greeting.innerHTML = `
    <button class="chat-greeting-close" aria-label="Cerrar">✕</button>
    ¿Dudas sobre gestión de riesgo o qué broker elegir? Pregúntame 👋
  `;

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.innerHTML = `
    <div class="chat-header">
      <div>
        <div class="chat-header-title">Asistente AR4</div>
        <div class="chat-header-sub">Gestión de riesgo y emociones</div>
      </div>
      <button class="chat-close" aria-label="Cerrar">✕</button>
    </div>
    <div class="chat-disclaimer">Apoyo educativo sobre psicología de trading. No es asesoría financiera ni terapia profesional. En caso de crisis emocional, busca ayuda de un profesional de salud mental.</div>
    <div class="chat-messages" id="chatMessages">
      <div class="chat-msg bot">Hola 👋 Soy el asistente de AR4 Mercados. Puedo ayudarte a pensar en gestión de riesgo, disciplina, o cómo manejar emociones después de una operación. ¿Qué tienes en mente?</div>
    </div>
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

  let history = [];
  let sending = false;

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
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || sending) return;

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
})();
