(function () {
  function pickSpanishVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('es')) || null;
  }

  function widgetHTML() {
    return `
      <div class="voice-narration-widget" id="voiceNarrationWidget">
        <button class="voice-narration-btn" id="voiceNarrationBtn" type="button">🔊 Escuchar este análisis</button>
        <div class="voice-narration-avatar" id="voiceNarrationAvatar" hidden>
          <span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span><span class="voice-bar"></span>
          <span class="voice-narration-label">Aria está leyendo...</span>
        </div>
      </div>
    `;
  }

  function initVoiceNarration(bodyElId) {
    if (!('speechSynthesis' in window)) return;
    const bodyEl = document.getElementById(bodyElId);
    if (!bodyEl) return;

    bodyEl.insertAdjacentHTML('beforebegin', widgetHTML());
    const btn = document.getElementById('voiceNarrationBtn');
    const avatar = document.getElementById('voiceNarrationAvatar');
    let utterance = null;
    let speaking = false;

    function stop() {
      window.speechSynthesis.cancel();
      speaking = false;
      avatar.hidden = true;
      btn.hidden = false;
      btn.textContent = '🔊 Escuchar este análisis';
    }

    btn.addEventListener('click', () => {
      if (speaking) { stop(); return; }
      const text = bodyEl.innerText.trim();
      if (!text) return;

      utterance = new SpeechSynthesisUtterance(text);
      const voice = pickSpanishVoice();
      if (voice) utterance.voice = voice;
      utterance.lang = voice ? voice.lang : 'es-ES';
      utterance.rate = 1;

      utterance.onstart = () => {
        speaking = true;
        btn.hidden = true;
        avatar.hidden = false;
      };
      utterance.onend = stop;
      utterance.onerror = stop;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

    avatar.addEventListener('click', stop);
    window.addEventListener('beforeunload', () => window.speechSynthesis.cancel());
  }

  window.AR4_initVoiceNarration = initVoiceNarration;
})();
