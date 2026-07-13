// AR4 Mercados — Narración por voz con avatar animado (Aria)
// Usa la síntesis de voz nativa del navegador: sin APIs externas ni costos.
// El texto se divide en fragmentos cortos para evitar el bug de Chrome que
// corta las locuciones largas, y eso mismo permite pausar, medir progreso
// y cambiar velocidad sin perder el hilo.
(function () {
  const CHUNK_MAX = 220;
  const SPEEDS = [1, 1.25, 1.5, 0.9];

  function pickSpanishVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    const score = (v) => {
      if (!v.lang || !v.lang.toLowerCase().startsWith('es')) return -1;
      let s = 1;
      const lang = v.lang.toLowerCase();
      const name = (v.name || '').toLowerCase();
      if (lang.includes('419') || lang.includes('mx') || lang.includes('us')) s += 2;
      if (name.includes('google') || name.includes('natural') || name.includes('online')) s += 2;
      if (name.includes('sabina') || name.includes('paulina') || name.includes('dalia')) s += 1;
      return s;
    };
    return voices.reduce((best, v) => (score(v) > score(best || { lang: '' }) ? v : best), null);
  }

  function splitIntoChunks(text) {
    const sentences = text.replace(/\s+/g, ' ').match(/[^.!?…]+[.!?…]*/g) || [text];
    const chunks = [];
    let current = '';
    sentences.forEach((s) => {
      if ((current + s).length > CHUNK_MAX && current) { chunks.push(current.trim()); current = ''; }
      current += s;
    });
    if (current.trim()) chunks.push(current.trim());
    return chunks.filter(Boolean);
  }

  function ariaAvatarSVG() {
    return `
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="ariaGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fbe9b0"/><stop offset="50%" stop-color="#d4af6a"/><stop offset="100%" stop-color="#b8860b"/>
          </linearGradient>
        </defs>
        <circle cx="60" cy="64" r="40" fill="url(#ariaGold)" stroke="#1a1408" stroke-width="4"/>
        <path d="M22 58 Q22 18 60 18 Q98 18 98 58" fill="none" stroke="#1a1408" stroke-width="7" stroke-linecap="round"/>
        <rect x="14" y="50" width="15" height="26" rx="7" fill="#111a2e" stroke="#1a1408" stroke-width="3.5"/>
        <rect x="91" y="50" width="15" height="26" rx="7" fill="#111a2e" stroke="#1a1408" stroke-width="3.5"/>
        <g class="aria-eyes">
          <circle cx="46" cy="60" r="10" fill="#fff" stroke="#1a1408" stroke-width="3"/>
          <circle cx="74" cy="60" r="10" fill="#fff" stroke="#1a1408" stroke-width="3"/>
          <circle cx="48" cy="61" r="4" fill="#1a1408"/>
          <circle cx="76" cy="61" r="4" fill="#1a1408"/>
        </g>
        <g class="aria-lids">
          <line x1="36" y1="60" x2="56" y2="60" stroke="#1a1408" stroke-width="4" stroke-linecap="round"/>
          <line x1="64" y1="60" x2="84" y2="60" stroke="#1a1408" stroke-width="4" stroke-linecap="round"/>
        </g>
        <ellipse class="aria-mouth" cx="60" cy="84" rx="9" ry="7" fill="#1a1408"/>
        <path class="aria-smile" d="M50 84 Q60 92 70 84" stroke="#1a1408" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      </svg>
    `;
  }

  function widgetHTML() {
    return `
      <div class="voice-widget" id="voiceWidget">
        <div class="voice-avatar" id="voiceAvatar">${ariaAvatarSVG()}</div>
        <div class="voice-main">
          <div class="voice-head">
            <strong>Aria</strong><span class="voice-sub">te lo lee en voz alta</span>
            <span class="voice-waves" id="voiceWaves" hidden>
              <span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span>
            </span>
          </div>
          <div class="voice-progress-track" id="voiceProgressTrack" hidden><div class="voice-progress-fill" id="voiceProgressFill"></div></div>
          <div class="voice-controls">
            <button class="voice-btn voice-btn-main" id="voicePlayBtn" type="button">▶ Escuchar</button>
            <button class="voice-btn" id="voiceStopBtn" type="button" hidden>⏹ Detener</button>
            <button class="voice-btn" id="voiceSpeedBtn" type="button" hidden>1x</button>
          </div>
        </div>
      </div>
    `;
  }

  function initVoiceNarration(bodyElId) {
    if (!('speechSynthesis' in window)) return;
    const bodyEl = document.getElementById(bodyElId);
    if (!bodyEl) return;

    bodyEl.insertAdjacentHTML('beforebegin', widgetHTML());
    const widget = document.getElementById('voiceWidget');
    const playBtn = document.getElementById('voicePlayBtn');
    const stopBtn = document.getElementById('voiceStopBtn');
    const speedBtn = document.getElementById('voiceSpeedBtn');
    const waves = document.getElementById('voiceWaves');
    const progressTrack = document.getElementById('voiceProgressTrack');
    const progressFill = document.getElementById('voiceProgressFill');
    const mouth = widget.querySelector('.aria-mouth');

    let chunks = [];
    let chunkIndex = 0;
    let totalChars = 0;
    let charsBefore = 0;
    let speedIndex = 0;
    let state = 'idle'; // idle | speaking | paused
    let mouthCloseTimer = null;
    let mouthFallbackTimer = null;
    let blinkTimer = null;

    function setMouth(open) {
      if (!mouth) return;
      mouth.style.transform = open ? 'scaleY(' + (0.6 + Math.random() * 0.5) + ')' : 'scaleY(0.12)';
    }

    function startBlinking() {
      stopBlinking();
      blinkTimer = setInterval(() => {
        widget.classList.add('aria-blinking');
        setTimeout(() => widget.classList.remove('aria-blinking'), 160);
      }, 3200 + Math.random() * 1800);
    }
    function stopBlinking() { if (blinkTimer) { clearInterval(blinkTimer); blinkTimer = null; } }

    function setUI() {
      const speaking = state === 'speaking';
      widget.classList.toggle('voice-active', state !== 'idle');
      widget.classList.toggle('voice-paused', state === 'paused');
      waves.hidden = state === 'idle';
      progressTrack.hidden = state === 'idle';
      stopBtn.hidden = state === 'idle';
      speedBtn.hidden = state === 'idle';
      if (state === 'idle') { playBtn.textContent = '▶ Escuchar'; playBtn.classList.add('voice-btn-main'); }
      else if (speaking) playBtn.textContent = '⏸ Pausa';
      else playBtn.textContent = '▶ Continuar';
      if (state === 'idle') { setMouth(false); stopBlinking(); }
      else startBlinking();
    }

    function updateProgress(charInChunk) {
      const done = charsBefore + (charInChunk || 0);
      progressFill.style.width = Math.min(100, Math.round((done / Math.max(1, totalChars)) * 100)) + '%';
    }

    function stopAll() {
      window.speechSynthesis.cancel();
      if (mouthFallbackTimer) { clearInterval(mouthFallbackTimer); mouthFallbackTimer = null; }
      state = 'idle';
      chunkIndex = 0;
      charsBefore = 0;
      progressFill.style.width = '0%';
      setUI();
    }

    function speakChunk(i) {
      if (i >= chunks.length) { stopAll(); return; }
      chunkIndex = i;
      const utter = new SpeechSynthesisUtterance(chunks[i]);
      const voice = pickSpanishVoice();
      if (voice) utter.voice = voice;
      utter.lang = voice ? voice.lang : 'es-ES';
      utter.rate = SPEEDS[speedIndex];

      let sawBoundary = false;
      utter.onboundary = (e) => {
        sawBoundary = true;
        if (mouthFallbackTimer) { clearInterval(mouthFallbackTimer); mouthFallbackTimer = null; }
        setMouth(true);
        if (mouthCloseTimer) clearTimeout(mouthCloseTimer);
        mouthCloseTimer = setTimeout(() => setMouth(false), 150);
        updateProgress(e.charIndex || 0);
      };
      utter.onstart = () => {
        state = 'speaking';
        setUI();
        // Algunas voces no emiten eventos de palabra: la boca se anima por temporizador.
        setTimeout(() => {
          if (!sawBoundary && state === 'speaking' && !mouthFallbackTimer) {
            mouthFallbackTimer = setInterval(() => { setMouth(true); setTimeout(() => setMouth(false), 140); }, 300);
          }
        }, 600);
      };
      utter.onend = () => {
        if (mouthFallbackTimer) { clearInterval(mouthFallbackTimer); mouthFallbackTimer = null; }
        if (state === 'idle') return;
        charsBefore += chunks[i].length;
        updateProgress(0);
        speakChunk(i + 1);
      };
      utter.onerror = () => { if (state !== 'idle') stopAll(); };

      window.speechSynthesis.speak(utter);
    }

    playBtn.addEventListener('click', () => {
      if (state === 'speaking') {
        window.speechSynthesis.pause();
        state = 'paused';
        setUI();
        return;
      }
      if (state === 'paused') {
        window.speechSynthesis.resume();
        state = 'speaking';
        setUI();
        return;
      }
      const text = bodyEl.innerText.trim();
      if (!text) return;
      chunks = splitIntoChunks(text);
      totalChars = chunks.reduce((s, c) => s + c.length, 0);
      charsBefore = 0;
      window.speechSynthesis.cancel();
      speakChunk(0);
    });

    stopBtn.addEventListener('click', stopAll);

    speedBtn.addEventListener('click', () => {
      speedIndex = (speedIndex + 1) % SPEEDS.length;
      speedBtn.textContent = String(SPEEDS[speedIndex]).replace('.', ',') + 'x';
      // Si está hablando, reinicia el fragmento actual con la nueva velocidad.
      if (state === 'speaking' || state === 'paused') {
        const i = chunkIndex;
        window.speechSynthesis.cancel();
        state = 'speaking';
        setUI();
        speakChunk(i);
      }
    });

    window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());

    // Chrome carga las voces de forma asíncrona; esto las precalienta.
    if (window.speechSynthesis.getVoices().length === 0 && window.speechSynthesis.onvoiceschanged === null) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
  }

  window.AR4_initVoiceNarration = initVoiceNarration;
})();
