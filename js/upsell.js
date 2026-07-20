function injectUpsellModal() {
  if (document.getElementById('upsellOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'upsell-overlay hidden';
  overlay.id = 'upsellOverlay';
  overlay.innerHTML = `
    <div class="upsell-modal">
      <button class="upsell-modal-close" id="upsellClose" aria-label="Cerrar">×</button>
      <span class="badge-live" style="background:rgba(212,175,55,0.15);color:var(--gold-bright);border-color:rgba(212,175,55,0.35);">★ AR4 PREMIUM</span>
      <h3 style="margin-top:12px;">El mercado no espera a nadie</h3>
      <p class="upsell-sub">La diferencia entre una idea de trading y una decisión bien informada está en la profundidad del análisis. Con Premium tienes la versión completa, actualizada con IA en tiempo real — sin resúmenes y sin esperar a que se libere gratis.</p>
      <ul>
        <li>Ideas de Trading con profundidad completa, no la versión resumida</li>
        <li>Noticias y análisis con IA en el momento que pasan, no después</li>
        <li>Chatbot de gestión de riesgo sin límite diario de mensajes</li>
        <li>Acceso prioritario a cada herramienta nueva que lancemos</li>
        <li>Cancela cuando quieras, sin permanencia</li>
      </ul>
      <div class="upsell-price">S/ 45 <span>PEN / mes · ≈ $12 USD · S/ 1.50 al día</span></div>
      <a href="membresia.html" class="btn btn-gold btn-block">Desbloquear análisis completo →</a>
    </div>
  `;
  document.body.appendChild(overlay);

  function close() { overlay.classList.add('hidden'); }
  document.getElementById('upsellClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

function openUpsellModal() {
  injectUpsellModal();
  document.getElementById('upsellOverlay').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  injectUpsellModal();
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.js-open-upsell')) {
      e.preventDefault();
      openUpsellModal();
    }
  });
});
