/* AR4 Mercados — AR4 AI Market Copilot (Premium).
   El usuario elige un mercado y el Copilot arma un briefing ESTRUCTURADO con
   datos reales (endpoint market-dossier): tendencia, momentum, niveles reales,
   volatilidad, riesgo y estructura de stop/objetivo con su R:R.
   Honestidad (regla del sitio): NO da señales de compra/venta, NO predice el
   precio y NO inventa "probabilidades de éxito". Describe el contexto y deja la
   decisión al usuario. Para la lectura en prosa abre a Aria (Opus, Premium) con
   el dossier real como contexto — así el modelo razona sobre cifras verdaderas.
   Renderiza en #marketCopilot. */
(function () {
  const el = document.getElementById('marketCopilot');
  if (!el) return;

  // Catálogo completo del mercado, agrupado. Todos con datos reales de Yahoo.
  const INSTR = [
    // Índices
    { g: 'Índices', id: 'NAS100', label: 'Nasdaq 100', y: '^NDX', dec: 1 },
    { g: 'Índices', id: 'SP500', label: 'S&P 500', y: '^GSPC', dec: 1 },
    { g: 'Índices', id: 'US30', label: 'Dow Jones 30', y: '^DJI', dec: 1 },
    { g: 'Índices', id: 'RUT2000', label: 'Russell 2000', y: '^RUT', dec: 1 },
    { g: 'Índices', id: 'GER40', label: 'DAX 40 (Alemania)', y: '^GDAXI', dec: 1 },
    { g: 'Índices', id: 'UK100', label: 'FTSE 100 (R. Unido)', y: '^FTSE', dec: 1 },
    { g: 'Índices', id: 'JPN225', label: 'Nikkei 225 (Japón)', y: '^N225', dec: 0 },
    { g: 'Índices', id: 'HK50', label: 'Hang Seng (Hong Kong)', y: '^HSI', dec: 0 },
    { g: 'Índices', id: 'BVSP', label: 'Bovespa (Brasil)', y: '^BVSP', dec: 0 },
    { g: 'Índices', id: 'DXY', label: 'Índice Dólar (DXY)', y: 'DX-Y.NYB', dec: 2 },
    // Forex mayores
    { g: 'Forex mayores', id: 'EURUSD', label: 'EUR/USD', y: 'EURUSD=X', dec: 5 },
    { g: 'Forex mayores', id: 'GBPUSD', label: 'GBP/USD', y: 'GBPUSD=X', dec: 5 },
    { g: 'Forex mayores', id: 'USDJPY', label: 'USD/JPY', y: 'USDJPY=X', dec: 3 },
    { g: 'Forex mayores', id: 'USDCHF', label: 'USD/CHF', y: 'USDCHF=X', dec: 5 },
    { g: 'Forex mayores', id: 'USDCAD', label: 'USD/CAD', y: 'USDCAD=X', dec: 5 },
    { g: 'Forex mayores', id: 'AUDUSD', label: 'AUD/USD', y: 'AUDUSD=X', dec: 5 },
    { g: 'Forex mayores', id: 'NZDUSD', label: 'NZD/USD', y: 'NZDUSD=X', dec: 5 },
    // Cruces
    { g: 'Forex cruces', id: 'EURGBP', label: 'EUR/GBP', y: 'EURGBP=X', dec: 5 },
    { g: 'Forex cruces', id: 'EURJPY', label: 'EUR/JPY', y: 'EURJPY=X', dec: 3 },
    { g: 'Forex cruces', id: 'GBPJPY', label: 'GBP/JPY', y: 'GBPJPY=X', dec: 3 },
    { g: 'Forex cruces', id: 'AUDJPY', label: 'AUD/JPY', y: 'AUDJPY=X', dec: 3 },
    { g: 'Forex cruces', id: 'EURAUD', label: 'EUR/AUD', y: 'EURAUD=X', dec: 5 },
    // LatAm
    { g: 'Forex LatAm', id: 'USDMXN', label: 'USD/MXN (México)', y: 'USDMXN=X', dec: 4 },
    { g: 'Forex LatAm', id: 'USDBRL', label: 'USD/BRL (Brasil)', y: 'USDBRL=X', dec: 4 },
    { g: 'Forex LatAm', id: 'USDCLP', label: 'USD/CLP (Chile)', y: 'USDCLP=X', dec: 2 },
    { g: 'Forex LatAm', id: 'USDCOP', label: 'USD/COP (Colombia)', y: 'USDCOP=X', dec: 2 },
    { g: 'Forex LatAm', id: 'USDPEN', label: 'USD/PEN (Perú)', y: 'USDPEN=X', dec: 4 },
    { g: 'Forex LatAm', id: 'USDARS', label: 'USD/ARS (Argentina)', y: 'USDARS=X', dec: 2 },
    // Metales y energía
    { g: 'Metales y energía', id: 'XAUUSD', label: 'Oro', y: 'GC=F', dec: 2 },
    { g: 'Metales y energía', id: 'XAGUSD', label: 'Plata', y: 'SI=F', dec: 3 },
    { g: 'Metales y energía', id: 'XPTUSD', label: 'Platino', y: 'PL=F', dec: 2 },
    { g: 'Metales y energía', id: 'COBRE', label: 'Cobre', y: 'HG=F', dec: 3 },
    { g: 'Metales y energía', id: 'USOIL', label: 'Petróleo WTI', y: 'CL=F', dec: 2 },
    { g: 'Metales y energía', id: 'UKOIL', label: 'Petróleo Brent', y: 'BZ=F', dec: 2 },
    { g: 'Metales y energía', id: 'NATGAS', label: 'Gas natural', y: 'NG=F', dec: 3 },
    // Criptomonedas
    { g: 'Criptomonedas', id: 'BTCUSD', label: 'Bitcoin', y: 'BTC-USD', dec: 2 },
    { g: 'Criptomonedas', id: 'ETHUSD', label: 'Ethereum', y: 'ETH-USD', dec: 2 },
    { g: 'Criptomonedas', id: 'SOLUSD', label: 'Solana', y: 'SOL-USD', dec: 2 },
    { g: 'Criptomonedas', id: 'XRPUSD', label: 'XRP', y: 'XRP-USD', dec: 4 },
    { g: 'Criptomonedas', id: 'BNBUSD', label: 'BNB', y: 'BNB-USD', dec: 2 },
    { g: 'Criptomonedas', id: 'ADAUSD', label: 'Cardano', y: 'ADA-USD', dec: 4 },
    { g: 'Criptomonedas', id: 'DOGEUSD', label: 'Dogecoin', y: 'DOGE-USD', dec: 5 },
    // Acciones
    { g: 'Acciones', id: 'AAPL', label: 'Apple', y: 'AAPL', dec: 2 },
    { g: 'Acciones', id: 'MSFT', label: 'Microsoft', y: 'MSFT', dec: 2 },
    { g: 'Acciones', id: 'NVDA', label: 'NVIDIA', y: 'NVDA', dec: 2 },
    { g: 'Acciones', id: 'TSLA', label: 'Tesla', y: 'TSLA', dec: 2 },
    { g: 'Acciones', id: 'AMZN', label: 'Amazon', y: 'AMZN', dec: 2 },
    { g: 'Acciones', id: 'META', label: 'Meta', y: 'META', dec: 2 },
    { g: 'Acciones', id: 'GOOGL', label: 'Alphabet (Google)', y: 'GOOGL', dec: 2 },
    { g: 'Acciones', id: 'NFLX', label: 'Netflix', y: 'NFLX', dec: 2 },
    { g: 'Acciones', id: 'AMD', label: 'AMD', y: 'AMD', dec: 2 },
    { g: 'Acciones', id: 'JPM', label: 'JPMorgan', y: 'JPM', dec: 2 },
    { g: 'Acciones', id: 'DIS', label: 'Disney', y: 'DIS', dec: 2 },
    { g: 'Acciones', id: 'MELI', label: 'MercadoLibre', y: 'MELI', dec: 2 },
    { g: 'Acciones', id: 'KO', label: 'Coca-Cola', y: 'KO', dec: 2 },
    { g: 'Acciones', id: 'BABA', label: 'Alibaba', y: 'BABA', dec: 2 }
  ];
  // Opciones agrupadas para el selector
  function instrOptionsHTML() {
    const groups = [];
    INSTR.forEach((i) => { if (!groups.includes(i.g)) groups.push(i.g); });
    return groups.map((g) =>
      `<optgroup label="${g}">` +
      INSTR.filter((i) => i.g === g).map((i) => `<option value="${i.id}">${i.label}</option>`).join('') +
      `</optgroup>`
    ).join('');
  }
  let isPro = false;
  let current = INSTR[0];

  const $ = (id) => document.getElementById(id);
  const fmt = (v, d) => (v == null ? '—' : Number(v).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const money = (v) => '$' + Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  el.innerHTML = `
    <div class="section-head" style="margin-bottom:12px;">
      <h2 class="h2-ic gold" style="font-size:1.35rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M16 3l5 5"/></svg>
        AR4 AI Market Copilot
      </h2>
      <span class="rl-tier-badge rl-tier-pro" id="cpTier">★ PLUS PREMIUM</span>
    </div>
    <p style="color:var(--text-mid);font-size:0.92rem;margin-bottom:14px;max-width:82ch;">
      Tu copiloto para preparar el día. Elige un mercado y en segundos tienes su radiografía con <b>datos reales</b>:
      tendencia, momentum, niveles clave, <b>volumen</b>, <b>presión de flujo</b>, <b>bloques de órdenes</b>, volatilidad y la
      estructura de riesgo. No te dice qué comprar — te da el contexto que un profesional revisa antes de decidir.
    </p>

    <details class="rl-help">
      <summary><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> ¿Cómo se usa?</summary>
      <div class="rl-help-body">
        <ol>
          <li>Elige el <b>mercado</b> que quieres operar hoy y pon tu <b>capital</b>.</li>
          <li>Pulsa <b>Analizar</b>: el Copilot descarga los datos reales y arma el briefing.</li>
          <li>Lee las tarjetas: tendencia, momentum, niveles, volatilidad y la estructura de stop/objetivo con su relación riesgo/beneficio.</li>
          <li>Pulsa <b>Pídele la lectura completa a Aria</b> para que la IA Premium te lo interprete en palabras, con esos mismos números.</li>
        </ol>
        <p><b>Importante:</b> los stops y objetivos que ves son <b>referencias de estructura</b> (el soporte/resistencia real más cercano), no una orden de "compra aquí". Decidir si operar o esperar es tuyo.</p>
      </div>
    </details>

    <div class="cp-banner" id="cpBanner" hidden></div>

    <div class="cp-controls">
      <div class="cp-field">
        <label class="rl-label" for="cpSymbol">Quiero operar…</label>
        <select class="rl-input" id="cpSymbol">${instrOptionsHTML()}</select>
      </div>
      <div class="cp-field cp-field-sm">
        <label class="rl-label" for="cpCapital">Mi capital (USD)</label>
        <input class="rl-input" type="number" id="cpCapital" value="5000" min="1" step="100">
      </div>
      <div class="cp-field cp-field-sm">
        <label class="rl-label" for="cpRisk">Riesgo</label>
        <select class="rl-input" id="cpRisk"><option value="0.5">0.5%</option><option value="1" selected>1%</option><option value="2">2%</option></select>
      </div>
      <button class="btn btn-gold cp-run" id="cpRun">Analizar</button>
    </div>

    <div class="cp-lockwrap">
      <div class="cp-out" id="cpOut"><p class="footer-text" style="text-align:center;padding:30px 0;">Elige un mercado y pulsa <b>Analizar</b>.</p></div>
      <div class="cp-lock" id="cpLock" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
        <strong>El Market Copilot es exclusivo Premium</strong>
        <span>Radiografía completa de cualquier mercado con datos reales, en un clic, más la lectura de Aria. Abajo tienes un ejemplo de lo que verías.</span>
        <a href="membresia.html#subscribeBtn" class="btn btn-gold">Desbloquear</a>
      </div>
    </div>

    <p class="rl-disclaimer"><b>El Copilot describe, no predice.</b> Todos los indicadores se calculan sobre el histórico real de Yahoo Finance. No es una señal de compra/venta, no anticipa el precio ni garantiza resultados. La decisión de operar, y su riesgo, es tuya.</p>

    <div class="rl-cta rl-cta-pro" id="cpCta">
      <div>
        <strong>Prepara cualquier mercado en segundos, con datos reales</strong>
        <span>Exclusivo Premium: tendencia, niveles institucionales, volatilidad, estructura de riesgo y la lectura de Aria — todo en un panel.</span>
      </div>
      <a href="membresia.html#subscribeBtn" class="btn btn-gold">Actualizar a Premium</a>
    </div>
  `;

  function verdictTrend(t) {
    if (t === 'alcista') return { cls: 'cp-up', txt: 'Alcista' };
    if (t === 'bajista') return { cls: 'cp-down', txt: 'Bajista' };
    if (t === 'mixta') return { cls: 'cp-flat', txt: 'Mixta / sin dirección' };
    return { cls: 'cp-flat', txt: 'Lateral' };
  }

  function commonMistakes(d) {
    const out = [];
    if (d.rsiRead === 'sobrecompra') out.push('El activo está sobrecomprado (RSI ' + fmt(d.rsi14, 0) + '): perseguir compras aquí suele dar peor relación riesgo/beneficio.');
    if (d.rsiRead === 'sobreventa') out.push('El activo está sobrevendido (RSI ' + fmt(d.rsi14, 0) + '): vender en pánico cerca de un mínimo suele salir caro.');
    if (d.trend === 'mixta') out.push('Sin tendencia clara, operar rupturas suele generar señales falsas; muchos entran por aburrimiento.');
    if (d.atrPct != null && d.atrPct > 2.5) out.push('Volatilidad alta (mueve ~' + fmt(d.atrPct, 1) + '% al día): un stop demasiado ajustado te saca por ruido normal.');
    if (d.distHi52pct != null && d.distHi52pct < 1.5) out.push('Está pegado a su máximo de 52 semanas: es zona donde muchos compran tarde justo antes de una toma de ganancias.');
    if (!out.length) out.push('El contexto no muestra un extremo evidente; el error más común aquí es operar sin un plan escrito y sin definir el stop antes de entrar.');
    return out;
  }

  function renderDossier(d, capital, riskPct) {
    const tv = verdictTrend(d.trend);
    const sup = (d.supports && d.supports[0]) || null;
    const res = (d.resistances && d.resistances[0]) || null;

    // Estructura de stop/objetivo (NO señal): stop más allá del soporte/resistencia
    // real más cercano; objetivo en el nivel opuesto; R:R = recompensa / riesgo.
    let riskBlock = '<p class="cp-muted">No hay un soporte y una resistencia claros por encima/debajo del precio ahora mismo para plantear una estructura simétrica. Cuando el precio defina niveles, vuelve a analizar.</p>';
    if (sup && res) {
      const buffer = (d.atr14 || 0) * 0.5;
      const stop = sup - buffer;
      const riskPerUnit = d.price - stop;
      const rewardPerUnit = res - d.price;
      const rr = riskPerUnit > 0 ? rewardPerUnit / riskPerUnit : null;
      const riskMoney = capital * (riskPct / 100);
      const units = riskPerUnit > 0 ? riskMoney / riskPerUnit : null;
      riskBlock = `
        <div class="cp-risk-grid">
          <div class="cp-rk"><span>Referencia de stop</span><strong>${fmt(stop, current.dec)}</strong><em>medio ATR bajo el soporte ${fmt(sup, current.dec)}</em></div>
          <div class="cp-rk"><span>Referencia de objetivo</span><strong>${fmt(res, current.dec)}</strong><em>en la resistencia más cercana</em></div>
          <div class="cp-rk"><span>Relación R:R</span><strong class="${rr && rr >= 2 ? 'rl-pos' : rr && rr >= 1 ? '' : 'rl-neg'}">${rr ? '1 : ' + fmt(rr, 2) : '—'}</strong><em>${rr && rr >= 2 ? 'favorable' : rr && rr >= 1 ? 'ajustada' : 'desfavorable'}</em></div>
          <div class="cp-rk"><span>Arriesgando ${riskPct}%</span><strong>${money(riskMoney)}</strong><em>${units ? '≈ ' + fmt(units, units < 10 ? 2 : 0) + ' u. de tamaño' : ''}</em></div>
        </div>
        <p class="cp-muted">Referencias de <b>estructura</b>, no una orden. Ajusta stop y objetivo a tu plan y a las condiciones reales de tu broker.</p>`;
    }

    el.querySelector('.cp-out').innerHTML = `
      <div class="cp-head">
        <div>
          <span class="cp-symbol">${current.label}</span>
          <span class="cp-price">${fmt(d.price, current.dec)} <span class="${d.changePct >= 0 ? 'cp-up' : 'cp-down'}">${d.changePct != null ? (d.changePct >= 0 ? '▲' : '▼') + ' ' + Math.abs(d.changePct).toFixed(2) + '%' : ''}</span></span>
        </div>
        <span class="cp-source">${d.fuente}</span>
      </div>

      <div class="cp-cards">
        <div class="cp-card">
          <div class="cp-card-h">Tendencia principal</div>
          <div class="cp-badge ${tv.cls}">${tv.txt}</div>
          <p>${d.trendWhy}${d.slope50 ? ' La media de 50 va <b>' + d.slope50 + '</b>.' : ''}</p>
        </div>
        <div class="cp-card">
          <div class="cp-card-h">Momentum (RSI 14)</div>
          <div class="cp-badge ${d.rsiRead === 'sobrecompra' ? 'cp-down' : d.rsiRead === 'sobreventa' ? 'cp-up' : 'cp-flat'}">${fmt(d.rsi14, 0)} · ${d.rsiRead}</div>
          <p>${d.rsiRead === 'neutral' ? 'Ni sobrecomprado ni sobrevendido: sin extremos de momentum.' : 'Lectura de ' + d.rsiRead + ': el impulso está en un extremo, ojo con las entradas tardías.'}</p>
        </div>
        <div class="cp-card">
          <div class="cp-card-h">Niveles clave</div>
          <div class="cp-levels">
            <div><span class="cp-lv-lbl">Resistencias</span>${(d.resistances && d.resistances.length ? d.resistances : ['—']).map((v) => '<span class="cp-lv cp-lv-r">' + (v === '—' ? '—' : fmt(v, current.dec)) + '</span>').join('')}</div>
            <div class="cp-lv-price">Precio: ${fmt(d.price, current.dec)}</div>
            <div><span class="cp-lv-lbl">Soportes</span>${(d.supports && d.supports.length ? d.supports : ['—']).map((v) => '<span class="cp-lv cp-lv-s">' + (v === '—' ? '—' : fmt(v, current.dec)) + '</span>').join('')}</div>
          </div>
          <p class="cp-muted">Pivotes reales de las últimas ~90 sesiones.</p>
        </div>
        <div class="cp-card">
          <div class="cp-card-h">Volatilidad (ATR 14)</div>
          <div class="cp-badge cp-flat">${fmt(d.atr14, current.dec)} ${d.atrPct != null ? '· ' + fmt(d.atrPct, 1) + '%/día' : ''}</div>
          <p>Se mueve unos <b>${fmt(d.atr14, current.dec)}</b> por sesión. Tu stop debería respetar esta distancia para no salir por ruido normal.</p>
        </div>
        ${d.volume && d.volume.hasData ? `
        <div class="cp-card">
          <div class="cp-card-h">Volumen</div>
          <div class="cp-badge ${d.volume.relPct >= 130 ? 'cp-up' : d.volume.relPct <= 70 ? 'cp-down' : 'cp-flat'}">${d.volume.relPct}% del promedio</div>
          <p>Hoy se negocia el <b>${d.volume.relPct}%</b> del volumen medio de 20 sesiones. ${d.volume.relPct >= 130 ? 'Volumen alto: hay convicción detrás del movimiento.' : d.volume.relPct <= 70 ? 'Volumen flojo: los movimientos con poco volumen suelen no sostenerse.' : 'Volumen dentro de lo normal.'}</p>
        </div>` : ''}
        ${d.flow && d.flow.hasData ? `
        <div class="cp-card">
          <div class="cp-card-h">Presión de volumen</div>
          <div class="cp-badge ${d.flow.bias === 'compradora' ? 'cp-up' : d.flow.bias === 'vendedora' ? 'cp-down' : 'cp-flat'}">${d.flow.buyPct}% comprador · ${d.flow.bias}</div>
          <p>En las últimas 20 sesiones, el <b>${d.flow.buyPct}%</b> del volumen entró en velas alcistas.</p>
          <p class="cp-muted">Aproximación de acumulación/distribución con velas diarias — no es order flow de tick/DOM.</p>
        </div>` : ''}
      </div>

      ${(d.orderBlocks && (d.orderBlocks.bull || d.orderBlocks.bear)) ? `
      <div class="cp-card cp-card-wide">
        <div class="cp-card-h">Bloques de órdenes (Order Blocks)</div>
        <div class="cp-ob-grid">
          ${d.orderBlocks.bull ? `<div class="cp-ob cp-ob-bull"><span>Bloque alcista · soporte</span><strong>${fmt(d.orderBlocks.bull.low, current.dec)} – ${fmt(d.orderBlocks.bull.high, current.dec)}</strong><em>zona donde arrancó el último impulso de compra</em></div>` : ''}
          ${d.orderBlocks.bear ? `<div class="cp-ob cp-ob-bear"><span>Bloque bajista · resistencia</span><strong>${fmt(d.orderBlocks.bear.low, current.dec)} – ${fmt(d.orderBlocks.bear.high, current.dec)}</strong><em>zona donde arrancó el último impulso de venta</em></div>` : ''}
        </div>
        <p class="cp-muted">La última vela contraria antes de un movimiento fuerte (&gt;1.2× ATR). Suele actuar como imán y como soporte/resistencia. Es un patrón sobre velas reales, no una predicción.</p>
      </div>` : ''}

      <div class="cp-card cp-card-wide">
        <div class="cp-card-h">Estructura de riesgo (no es una señal)</div>
        ${riskBlock}
      </div>

      <div class="cp-card cp-card-wide">
        <div class="cp-card-h">⚠️ Errores comunes en este contexto</div>
        <ul class="cp-mistakes">${commonMistakes(d).map((m) => '<li>' + m + '</li>').join('')}</ul>
      </div>

      <div class="cp-actions">
        <a class="btn btn-outline" href="noticias.html">Ver noticias del mercado</a>
        <button class="btn btn-gold" id="cpAskAria">Pídele la lectura completa a Aria →</button>
      </div>
    `;

    const askBtn = $('cpAskAria');
    if (askBtn) askBtn.addEventListener('click', () => {
      if (typeof window.AR4_askAriaAbout !== 'function') return;
      const volTxt = d.volume && d.volume.hasData ? `volumen relativo ${d.volume.relPct}% del promedio` : 'sin datos de volumen';
      const flowTxt = d.flow && d.flow.hasData ? `presión de volumen ${d.flow.buyPct}% compradora (${d.flow.bias})` : 'sin datos de flujo';
      const obTxt = d.orderBlocks && (d.orderBlocks.bull || d.orderBlocks.bear)
        ? `bloques de órdenes: ${d.orderBlocks.bull ? 'alcista en ' + JSON.stringify(d.orderBlocks.bull) : ''} ${d.orderBlocks.bear ? 'bajista en ' + JSON.stringify(d.orderBlocks.bear) : ''}`
        : 'sin bloques de órdenes claros';
      const ctx = `El usuario prepara una posible operación en ${current.label}. Datos reales de hoy (Yahoo, velas diarias): precio ${d.price}, variación ${d.changePct}%, tendencia ${d.trend} (${d.trendWhy}), RSI14 ${d.rsi14} (${d.rsiRead}), ATR14 ${d.atr14} (${d.atrPct}%/día), media50 ${d.sma50}, media200 ${d.sma200}, soportes ${JSON.stringify(d.supports)}, resistencias ${JSON.stringify(d.resistances)}, máximo 52s ${d.hi52}, mínimo 52s ${d.lo52}, ${volTxt}, ${flowTxt}, ${obTxt}. Interpreta este contexto de forma educativa: tendencia, momentum, volumen y flujo, qué vigilar en esos niveles y bloques de órdenes, gestión de riesgo con estas cifras y errores comunes. NO des una señal de compra/venta ni predigas el precio: ayuda a decidir con criterio.`;
      window.AR4_askAriaAbout(`Interprétame el contexto de ${current.label} para hoy con estos datos.`, ctx);
    });
  }

  async function analyze() {
    if (!isPro) return; // el gratis ve el ejemplo estático ya renderizado
    const out = el.querySelector('.cp-out');
    out.innerHTML = `<p class="footer-text" style="text-align:center;padding:30px 0;">Analizando ${current.label} con datos reales…</p>`;
    const capital = parseFloat($('cpCapital').value) || 5000;
    const riskPct = parseFloat($('cpRisk').value) || 1;
    try {
      const res = await fetch('/.netlify/functions/market-dossier?symbol=' + encodeURIComponent(current.y));
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Sin datos');
      renderDossier(d, capital, riskPct);
    } catch (e) {
      out.innerHTML = `<p class="rl-msg rl-msg-error" style="text-align:center;padding:20px 0;">No pudimos analizar ${current.label} ahora mismo (${(e.message || '').slice(0, 60)}). Inténtalo de nuevo en un momento.</p>`;
    }
  }

  // Ejemplo estático para el usuario gratis (datos ilustrativos, claramente marcados).
  function renderSample() {
    const d = {
      fuente: 'Ejemplo ilustrativo · en Premium son datos reales en vivo',
      price: 20450.0, changePct: 0.62, trend: 'alcista',
      trendWhy: 'El precio está por encima de la media de 50 y esta por encima de la de 200.',
      slope50: 'subiendo', rsi14: 63.4, rsiRead: 'neutral', atr14: 210.0, atrPct: 1.03,
      sma50: 20010, sma200: 18900, hi52: 20700, lo52: 16100, distHi52pct: 1.2, distLo52pct: 27,
      supports: [20180, 19850, 19420], resistances: [20700, 21050],
      volume: { hasData: true, current: 0, avg20: 0, relPct: 118 },
      flow: { hasData: true, buyPct: 61, bias: 'compradora' },
      orderBlocks: { bull: { low: 20120, high: 20250 }, bear: { low: 20680, high: 20740 } }
    };
    current = INSTR[0];
    renderDossier(d, 5000, 1);
  }

  async function detect() {
    try { if (typeof window.AR4_checkPremium === 'function') isPro = await window.AR4_checkPremium(); } catch (e) { isPro = false; }
    el.classList.toggle('cp-pro-on', isPro);
    const banner = $('cpBanner');
    if (isPro) {
      $('cpTier').textContent = '★ PREMIUM ACTIVO';
      banner.hidden = false; banner.className = 'cp-banner cp-banner-on';
      banner.innerHTML = 'Copilot activo: analiza cualquier mercado con datos reales en vivo.';
      $('cpCta').hidden = true;
      analyze();
    } else {
      ['cpSymbol', 'cpCapital', 'cpRisk', 'cpRun'].forEach((id) => { const e = $(id); if (e) e.disabled = true; });
      $('cpLock').hidden = false;
      $('cpTier').textContent = '★ PREMIUM · ejemplo';
      banner.hidden = false; banner.className = 'cp-banner';
      banner.innerHTML = 'Estás viendo un <b>ejemplo ilustrativo</b>. Con Premium analizas cualquier mercado con datos reales en vivo.';
      renderSample();
    }
  }

  $('cpSymbol').addEventListener('change', (e) => {
    current = INSTR.find((i) => i.id === e.target.value) || INSTR[0];
    analyze();
  });
  $('cpRun').addEventListener('click', analyze);
  detect();
})();
