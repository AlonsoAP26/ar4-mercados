function injectUpsellModal() {
  if (document.getElementById('upsellOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'upsell-overlay hidden';
  overlay.id = 'upsellOverlay';
  overlay.innerHTML = `
    <div class="upsell-modal">
      <button class="upsell-modal-close" id="upsellClose" aria-label="Cerrar">×</button>
      <span class="badge-live" style="background:rgba(212,175,55,0.15);color:var(--gold-bright);border-color:rgba(212,175,55,0.35);">★ AR4 PREMIUM</span>
      <h3 style="margin-top:12px;">¿Quieres ver esto antes que nadie?</h3>
      <p class="upsell-sub">Todo lo que acabas de leer se genera y actualiza con IA sobre datos de mercado en tiempo real. Con Premium, tienes acceso a la versión completa de ese análisis — sin límites y sin esperar.</p>
      <ul>
        <li>Ideas de Trading avanzadas y exclusivas, con más profundidad que la versión gratuita</li>
        <li>Noticias y análisis actualizados con IA, disponibles antes que en el plan gratuito</li>
        <li>Chatbot de gestión de riesgo sin límite diario de mensajes</li>
        <li>Acceso prioritario a nuevas herramientas apenas las lanzamos</li>
        <li>Cancela cuando quieras, sin permanencia</li>
      </ul>
      <div class="upsell-price">S/ 37 <span>PEN / mes</span></div>
      <a href="membresia.html" class="btn btn-gold btn-block">Ver planes Premium →</a>
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
