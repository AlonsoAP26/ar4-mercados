(function () {
  if (typeof supabase === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  window.AR4_initSentimentPulse = async function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<p class="footer-text">Calculando el pulso de la comunidad...</p>';

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await sb
      .from('community_posts')
      .select('sentiment')
      .not('sentiment', 'is', null)
      .gte('created_at', sevenDaysAgo);

    if (error || !data || !data.length) {
      container.innerHTML = '<p class="footer-text">Todavía no hay suficientes publicaciones con sesgo esta semana para calcular el pulso. Publica la tuya en la <a href="comunidad.html">comunidad</a>.</p>';
      return;
    }

    const counts = { alcista: 0, bajista: 0, neutral: 0 };
    data.forEach((r) => { if (counts[r.sentiment] !== undefined) counts[r.sentiment]++; });
    const total = counts.alcista + counts.bajista + counts.neutral;
    const pctAlcista = Math.round((counts.alcista / total) * 100);
    const pctBajista = Math.round((counts.bajista / total) * 100);
    const pctNeutral = Math.max(0, 100 - pctAlcista - pctBajista);

    let verdict = 'Sentimiento mixto en la comunidad';
    if (pctAlcista - pctBajista >= 20) verdict = 'Predomina el sesgo alcista en la comunidad';
    else if (pctBajista - pctAlcista >= 20) verdict = 'Predomina el sesgo bajista en la comunidad';

    container.innerHTML = `
      <div class="sentiment-pulse-header">
        <strong>${verdict}</strong>
        <span>${total} publicación${total === 1 ? '' : 'es'} con sesgo en los últimos 7 días</span>
      </div>
      <div class="sentiment-pulse-bar">
        <div class="sentiment-pulse-segment sentiment-seg-alcista" style="width:${pctAlcista}%;" title="Alcista ${pctAlcista}%"></div>
        <div class="sentiment-pulse-segment sentiment-seg-neutral" style="width:${pctNeutral}%;" title="Neutral ${pctNeutral}%"></div>
        <div class="sentiment-pulse-segment sentiment-seg-bajista" style="width:${pctBajista}%;" title="Bajista ${pctBajista}%"></div>
      </div>
      <div class="sentiment-pulse-legend">
        <span><span class='sdot sdot-g'></span> Alcista ${pctAlcista}%</span>
        <span><span class='sdot sdot-n'></span> Neutral ${pctNeutral}%</span>
        <span><span class='sdot sdot-r'></span> Bajista ${pctBajista}%</span>
      </div>
      <p style="color:var(--text-low);font-size:0.74rem;margin-top:10px;">Dato propio de la comunidad AR4, calculado a partir del sesgo que cada usuario elige al publicar — no es un indicador de mercado externo ni una señal de trading, es solo informativo.</p>
    `;
  };

  if (document.getElementById('sentimentPulseContainer')) {
    window.AR4_initSentimentPulse('sentimentPulseContainer');
  }
})();
