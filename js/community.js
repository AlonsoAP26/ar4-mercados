(function () {
  if (typeof supabase === 'undefined' || typeof netlifyIdentity === 'undefined' || !window.AR4_supabase) return;
  const sb = window.AR4_supabase;

  const root = document.getElementById('communityRoot');
  if (!root) return;

  const CATEGORY_LABELS = ['Forex', 'Materias Primas', 'Índices', 'Criptomonedas', 'Acciones', 'Educación', 'Off Topic'];
  const ALLOWED_TIMEFRAMES = ['M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
  const IDEA_STATUS_META = {
    abierta: { label: 'Abierta', cls: 'idea-status-abierta' },
    ganadora: { label: 'Ganadora ✓', cls: 'idea-status-ganadora' },
    perdedora: { label: 'Perdedora ✕', cls: 'idea-status-perdedora' },
    cancelada: { label: 'Cancelada', cls: 'idea-status-cancelada' }
  };
  const BASE_ROOMS = [
    { id: 'forex', label: 'Forex' },
    { id: 'latam', label: 'LatAm' },
    { id: 'commodities', label: 'Materias Primas' },
    { id: 'acciones', label: 'Acciones' },
    { id: 'indices', label: 'Índices' },
    { id: 'cripto', label: 'Criptomonedas' }
  ];
  const ELITE_ROOM = { id: 'elite', label: '★ Elite Traders' };
  const ROOM_META = {
    forex: { icon: '', name: 'Forex', desc: 'Charla general sobre pares de divisas' },
    latam: { icon: '', name: 'LatAm', desc: 'Divisas, tasas y mercados de Latinoamérica' },
    commodities: { icon: '', name: 'Materias Primas', desc: 'Oro, petróleo y materias primas' },
    acciones: { icon: '', name: 'Acciones', desc: 'Acciones y resultados corporativos' },
    indices: { icon: '', name: 'Índices', desc: 'Índices bursátiles globales' },
    cripto: { icon: '', name: 'Criptomonedas', desc: 'Bitcoin, Ethereum y el resto del mercado cripto' },
    elite: { icon: '★', name: 'Elite Traders', desc: 'Sala exclusiva para rango Élite y Administrador' }
  };
  const RANK_LABELS = { basico: 'Básico', vip: 'VIP', premium: 'Premium', elite: 'Élite', administrador: 'Administrador' };
  const RANK_ORDER = { basico: 0, vip: 1, premium: 2, elite: 3, administrador: 4 };
  const AVATAR_COLORS = ['#f0c75e', '#7aa8ff', '#4fd18a', '#ff8a5c', '#f7931a', '#e2001a', '#22c07a'];
  const TRADING_STYLES = ['Day trader', 'Swing trader', 'Scalper', 'Macro / posicional', 'HODLer', 'Recién empezando'];
  const REACTIONS = [
    { emoji: '📚', label: 'Educativo' },
    { emoji: '', label: 'Buen análisis' },
    { emoji: '💡', label: 'Buena explicación' },
    { emoji: '🎯', label: 'Bien argumentado' }
  ];
  const POST_SYMBOL_MAP = {
    'EURUSD': 'FX:EURUSD', 'EUR/USD': 'FX:EURUSD',
    'GBPUSD': 'FX:GBPUSD', 'GBP/USD': 'FX:GBPUSD',
    'USDJPY': 'FX:USDJPY', 'USD/JPY': 'FX:USDJPY',
    'USDMXN': 'FX_IDC:USDMXN', 'USD/MXN': 'FX_IDC:USDMXN',
    'USDCOP': 'FX_IDC:USDCOP', 'USD/COP': 'FX_IDC:USDCOP',
    'USDCLP': 'FX_IDC:USDCLP', 'USD/CLP': 'FX_IDC:USDCLP',
    'USDARS': 'FX_IDC:USDARS', 'USD/ARS': 'FX_IDC:USDARS',
    'USDBRL': 'FX_IDC:USDBRL', 'USD/BRL': 'FX_IDC:USDBRL',
    'USDPEN': 'FX_IDC:USDPEN', 'USD/PEN': 'FX_IDC:USDPEN',
    'ORO': 'OANDA:XAUUSD', 'GOLD': 'OANDA:XAUUSD', 'XAUUSD': 'OANDA:XAUUSD', 'XAU/USD': 'OANDA:XAUUSD',
    'PLATA': 'OANDA:XAGUSD', 'SILVER': 'OANDA:XAGUSD', 'XAGUSD': 'OANDA:XAGUSD', 'XAG/USD': 'OANDA:XAGUSD',
    'PETROLEO': 'TVC:USOIL', 'WTI': 'TVC:USOIL', 'OIL': 'TVC:USOIL', 'USOIL': 'TVC:USOIL',
    'BRENT': 'TVC:UKOIL', 'UKOIL': 'TVC:UKOIL',
    'BTC': 'BITSTAMP:BTCUSD', 'BTCUSD': 'BITSTAMP:BTCUSD', 'BTC/USD': 'BITSTAMP:BTCUSD', 'BITCOIN': 'BITSTAMP:BTCUSD',
    'ETH': 'COINBASE:ETHUSD', 'ETHUSD': 'COINBASE:ETHUSD', 'ETH/USD': 'COINBASE:ETHUSD', 'ETHEREUM': 'COINBASE:ETHUSD',
    'SP500': 'FOREXCOM:SPXUSD', 'S&P500': 'FOREXCOM:SPXUSD', 'US500': 'FOREXCOM:SPXUSD', 'SPX': 'FOREXCOM:SPXUSD',
    'NASDAQ': 'FOREXCOM:NSXUSD', 'NAS100': 'FOREXCOM:NSXUSD', 'US100': 'FOREXCOM:NSXUSD',
    'DXY': 'CAPITALCOM:DXY'
  };
  const BADGE_META = {
    first_post: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/></svg>", name: 'Primera publicación' },
    century: { icon: "<span style='font-family:var(--mono);font-weight:700;font-size:0.72rem;'>100</span>", name: '100 puntos' },
    high_roller: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><circle cx='9' cy='9' r='6'/><path d='M15.5 6.5a6 6 0 1 1-9 9'/></svg>", name: '1000 puntos' },
    streak_7: { icon: "<svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg>", name: '7 días de racha' },
    streak_30: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z'/></svg>", name: '30 días de racha' },
    philanthropist: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='4' y='9' width='16' height='12' rx='1'/><path d='M4 13h16M12 9v12'/><path d='M12 9C11 5 8 5 8 7s3 2 4 2c1 0 4 0 4-2s-3-2-4 2z'/></svg>", name: 'Donó puntos' },
    elite_member: { icon: '★', name: 'Rango Élite' }
  };
  const MISSION_META = {
    post: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'/></svg>", label: 'Publica 1 idea en el Foro' },
    votes: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M7 11v9M7 11l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1 5.7a2 2 0 0 1-2 1.7H7'/></svg>", label: 'Vota 3 publicaciones' },
    chat: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z'/></svg>", label: 'Manda 5 mensajes en el chat' }
  };
  const SOCIAL_META = {
    twitter: { icon: '𝕏', placeholder: 'usuario de X/Twitter', urlBase: 'https://x.com/' },
    instagram: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z'/><circle cx='12' cy='13' r='3.5'/></svg>", placeholder: 'usuario de Instagram', urlBase: 'https://instagram.com/' },
    tiktok: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M9 18V5l11-2v13'/><circle cx='6.5' cy='18' r='2.5'/><circle cx='17.5' cy='16' r='2.5'/></svg>", placeholder: 'usuario de TikTok', urlBase: 'https://tiktok.com/@' },
    youtube: { icon: "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4l14 8-14 8z'/></svg>", placeholder: 'canal de YouTube', urlBase: 'https://youtube.com/@' }
  };

  // Íconos SVG (line icons) para el menú lateral — look profesional en vez de emojis.
  function svgIcon(inner) {
    return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  const ICON = {
    home: svgIcon('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>'),
    spark: svgIcon('<path d="M12 3l1.9 4.9L19 9.8l-4.6 2.9L13 18l-1-5.3L7 9.8l5.1-.9z"/><path d="M19 15l.6 1.6L21 17.2l-1.4.6L19 19l-.6-1.2-1.4-.6 1.4-.6z"/>'),
    list: svgIcon('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="0.9"/><circle cx="3.5" cy="12" r="0.9"/><circle cx="3.5" cy="18" r="0.9"/>'),
    forex: svgIcon('<path d="M4 8h13l-3-3"/><path d="M20 16H7l3 3"/>'),
    cripto: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M9.5 8h4a2 2 0 0 1 0 4h-4zM9.5 12h4.3a2 2 0 0 1 0 4H9.5zM9.5 7v10M11 6v1.5M11 16.5V18"/>'),
    acciones: svgIcon('<path d="M3 21h18"/><path d="M6 21v-8M11 21V7M16 21v-5"/>'),
    indices: svgIcon('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    commodities: svgIcon('<path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z"/>'),
    latam: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>'),
    oro: svgIcon('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.7L17 21l-1.5-7.5"/>'),
    educacion: svgIcon('<path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4.5"/>'),
    offtopic: svgIcon('<path d="M20 12a8 8 0 0 1-11.5 7.1L4 20l1-4.4A8 8 0 1 1 20 12z"/>'),
    mail: svgIcon('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7l8 5.5L20 7"/>'),
    chat: svgIcon('<path d="M21 14a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    ranking: svgIcon('<path d="M8 21h8M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 0-3 3"/>'),
    dna: svgIcon('<path d="M5 4c0 6 14 8 14 16M19 4c0 6-14 8-14 16"/><path d="M7 7h10M7.5 17h9M9 10.5h6M9 13.5h6"/>'),
    trophy: svgIcon('<path d="M8 21h8M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 0-3 3"/>'),
    star: svgIcon('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/>'),
    fire: svgIcon('<path d="M12 3c3 4 4.5 6.5 4.5 9a4.5 4.5 0 0 1-9 0c0-1.4.6-2.8 1.6-4C9.4 9.6 10 11 11 11c1 0 1.2-1.6.5-3.2C11 6.4 11.5 4.7 12 3z"/>'),
    bolt: svgIcon('<path d="M13 3 5 13h5l-1 8 8-11h-5z"/>'),
    target: svgIcon('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>'),
    bookmark: svgIcon('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    calendar: svgIcon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>'),
    radar: svgIcon('<path d="M20 12a8 8 0 1 1-4-6.9"/><path d="M12 12l6-4"/><circle cx="12" cy="12" r="1.5"/>')
  };
  // Header de panel con icono SVG (mismo estilo del menu): sustituye a los emojis.
  function panelH(iconKey, label, size) {
    return '<span class="sec-ic">' + ICON[iconKey] + '</span>' + label;
  }
  function navCategoriesHTML() {
    return [
      ['Forex', 'forex'], ['Criptomonedas', 'cripto'], ['Acciones', 'acciones'],
      ['Índices', 'indices'], ['Materias Primas', 'commodities'],
      ['Educación', 'educacion'], ['Off Topic', 'offtopic']
    ].map(function (c) {
      return '<button class="community-tab-btn" data-view="foro" data-category="' + c[0] + '"><span class="ctab-ic">' + ICON[c[1]] + '</span>' + c[0] + '</button>';
    }).join('');
  }

  function resolvePostSymbol(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim().toUpperCase();
    if (/^[A-Z0-9_]+:[A-Z0-9]+$/.test(trimmed)) return trimmed;
    const mapped = POST_SYMBOL_MAP[trimmed.replace(/\s+/g, '')];
    if (mapped) return mapped;
    // Símbolos del buscador global (formato Yahoo) -> equivalente TradingView
    const IDX_TV = { '^GSPC': 'SP:SPX', '^NDX': 'NDX', '^DJI': 'DJI', '^RUT': 'RUT', '^GDAXI': 'XETR:DAX', '^FTSE': 'UKX', '^N225': 'NI225', '^HSI': 'HSI', '^BVSP': 'IBOV', 'DX-Y.NYB': 'CAPITALCOM:DXY' };
    if (IDX_TV[trimmed]) return IDX_TV[trimmed];
    if (/=X$/.test(trimmed)) return trimmed.replace('=X', '');
    if (/-USD$/.test(trimmed)) return trimmed.replace('-USD', 'USD');
    if (/=F$/.test(trimmed)) return trimmed.replace('=F', '1!');
    if (/^[A-Z0-9.]{1,8}$/.test(trimmed)) return trimmed; // ticker plano: TradingView lo resuelve
    return null;
  }

  // Lista completa de instrumentos. l=etiqueta, s=valor del campo (TradingView), c=categoría, y=símbolo Yahoo (velas).
  const POST_INSTRUMENTS = [
    { l: 'EUR/USD', s: 'EUR/USD', c: 'Forex', y: 'EURUSD=X' }, { l: 'GBP/USD', s: 'GBP/USD', c: 'Forex', y: 'GBPUSD=X' },
    { l: 'USD/JPY', s: 'USD/JPY', c: 'Forex', y: 'USDJPY=X' }, { l: 'USD/CHF', s: 'FX:USDCHF', c: 'Forex', y: 'USDCHF=X' },
    { l: 'USD/CAD', s: 'FX:USDCAD', c: 'Forex', y: 'USDCAD=X' }, { l: 'AUD/USD', s: 'FX:AUDUSD', c: 'Forex', y: 'AUDUSD=X' },
    { l: 'NZD/USD', s: 'FX:NZDUSD', c: 'Forex', y: 'NZDUSD=X' }, { l: 'EUR/JPY', s: 'FX:EURJPY', c: 'Forex', y: 'EURJPY=X' },
    { l: 'USD/MXN', s: 'USD/MXN', c: 'Forex', y: 'USDMXN=X' }, { l: 'USD/BRL', s: 'USD/BRL', c: 'Forex', y: 'USDBRL=X' },
    { l: 'USD/COP', s: 'USD/COP', c: 'Forex', y: 'USDCOP=X' }, { l: 'USD/CLP', s: 'USD/CLP', c: 'Forex', y: 'USDCLP=X' },
    { l: 'USD/PEN', s: 'USD/PEN', c: 'Forex', y: 'USDPEN=X' }, { l: 'USD/ARS', s: 'USD/ARS', c: 'Forex', y: 'USDARS=X' },
    { l: 'Oro (XAU/USD)', s: 'ORO', c: 'Materias Primas', y: 'GC=F' }, { l: 'Plata (XAG/USD)', s: 'PLATA', c: 'Materias Primas', y: 'SI=F' },
    { l: 'Petróleo WTI', s: 'PETROLEO', c: 'Materias Primas', y: 'CL=F' }, { l: 'Petróleo Brent', s: 'UKOIL', c: 'Materias Primas', y: 'BZ=F' },
    { l: 'NASDAQ 100', s: 'NASDAQ', c: 'Índices', y: '^NDX' }, { l: 'S&P 500', s: 'SP500', c: 'Índices', y: '^GSPC' },
    { l: 'Dow Jones', s: 'TVC:DJI', c: 'Índices', y: '^DJI' }, { l: 'DAX 40 (Alemania)', s: 'TVC:DAX', c: 'Índices', y: '^GDAXI' },
    { l: 'FTSE 100 (R. Unido)', s: 'TVC:UKX', c: 'Índices', y: '^FTSE' },
    { l: 'Bitcoin (BTC/USD)', s: 'BTC/USD', c: 'Criptomonedas', y: 'BTC-USD' }, { l: 'Ethereum (ETH/USD)', s: 'ETH/USD', c: 'Criptomonedas', y: 'ETH-USD' },
    { l: 'Solana (SOL)', s: 'COINBASE:SOLUSD', c: 'Criptomonedas', y: 'SOL-USD' }, { l: 'XRP', s: 'BITSTAMP:XRPUSD', c: 'Criptomonedas', y: 'XRP-USD' },
    { l: 'Dogecoin (DOGE)', s: 'COINBASE:DOGEUSD', c: 'Criptomonedas', y: 'DOGE-USD' }, { l: 'BNB', s: 'BINANCE:BNBUSD', c: 'Criptomonedas', y: 'BNB-USD' },
    { l: 'Cardano (ADA)', s: 'COINBASE:ADAUSD', c: 'Criptomonedas', y: 'ADA-USD' },
    { l: 'Apple', s: 'NASDAQ:AAPL', c: 'Acciones', y: 'AAPL' }, { l: 'Tesla', s: 'NASDAQ:TSLA', c: 'Acciones', y: 'TSLA' },
    { l: 'NVIDIA', s: 'NASDAQ:NVDA', c: 'Acciones', y: 'NVDA' }, { l: 'Amazon', s: 'NASDAQ:AMZN', c: 'Acciones', y: 'AMZN' },
    { l: 'Microsoft', s: 'NASDAQ:MSFT', c: 'Acciones', y: 'MSFT' }, { l: 'Meta', s: 'NASDAQ:META', c: 'Acciones', y: 'META' },
    { l: 'Google', s: 'NASDAQ:GOOGL', c: 'Acciones', y: 'GOOGL' }, { l: 'AMD', s: 'NASDAQ:AMD', c: 'Acciones', y: 'AMD' },
    { l: 'Netflix', s: 'NASDAQ:NFLX', c: 'Acciones', y: 'NFLX' }, { l: 'Coca-Cola', s: 'NYSE:KO', c: 'Acciones', y: 'KO' }
  ];
  // Deduce el símbolo Yahoo desde lo que haya en el campo (para las velas del gráfico propio).
  function resolveYahooSymbol(raw) {
    const t = String(raw || '').trim();
    if (!t) return null;
    const up = t.toUpperCase();
    const found = POST_INSTRUMENTS.find((i) => i.s.toUpperCase() === up || i.l.toUpperCase() === up);
    if (found) return found.y;
    const m = up.match(/^([A-Z]{3})\/?([A-Z]{3})$/); // par forex tipo EUR/USD o EURUSD
    if (m) return m[1] + m[2] + '=X';
    const ex = up.match(/^[A-Z0-9_]+:([A-Z0-9]+)$/); // EXCHANGE:TICKER -> ticker (acción)
    if (ex) return ex[1];
    return null;
  }

  function mountPostChart(container, symbol) {
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.text = JSON.stringify({
      symbol,
      width: '100%',
      height: 280,
      interval: '60',
      locale: 'es',
      timezone: 'America/Lima',
      theme: 'dark',
      style: '1',
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      studies: ['MASimple@tv-basicstudies', 'MAExp@tv-basicstudies'],
      support_host: 'https://www.tradingview.com'
    });
    container.appendChild(script);
  }
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
  let presenceCount = 1;
  let activeTagFilter = null;
  let activeCategoryFilter = null;
  let dmPollTimer = null;
  let dmListPollTimer = null;
  let notifPollTimer = null;
  let feedSortMode = 'reciente';
  let currentDmThreadId = null;
  let catalogTab = 'comun';
  const CATALOG_PAGE_SIZE = 24;
  const catalogOffset = { comun: 0, raro: 0, legendario: 0 };
  const catalogCache = { comun: [], raro: [], legendario: [] };
  const catalogHasMore = { comun: true, raro: true, legendario: true };

  function initPresence() {
    const presenceKey = (netlifyIdentity.currentUser() && netlifyIdentity.currentUser().id) || ('guest-' + Math.random().toString(36).slice(2));
    const channel = sb.channel('community-online', { config: { presence: { key: presenceKey } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        presenceCount = Math.max(1, Object.keys(channel.presenceState()).length);
        const el = document.getElementById('pulseOnlineCount');
        if (el) el.textContent = String(presenceCount + agentesOnline);
        document.dispatchEvent(new CustomEvent('ar4-presence-update'));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
      });
  }

  // Agentes IA conectados = los que hablaron en los ultimos 45 min, con un
  // piso de "turno de guardia" segun la hora (la red opera en turnos reales:
  // cada 30 min en mercado, cada 2 h de noche). Estable dentro de cada hora.
  function turnoDeGuardia() {
    const ahora = new Date();
    const h = ahora.getUTCHours();
    const semilla = (h * 31 + ahora.getUTCDate() * 7 + ahora.getUTCMonth() * 3) % 5;
    const esMercado = h >= 11 && h <= 23;
    return esMercado ? 6 + semilla : 2 + (semilla % 3);
  }
  let agentesOnline = turnoDeGuardia();
  async function refreshAgentesOnline() {
    try {
      if (!window.AR4_AGENTES_IDS || !window.AR4_AGENTES_IDS.size) return;
      const desde = new Date(Date.now() - 45 * 60000).toISOString();
      const [posts, comments] = await Promise.all([
        sb.from('community_posts').select('profile_id').gte('created_at', desde).limit(60),
        sb.from('comments').select('profile_id').gte('created_at', desde).limit(120)
      ]);
      const activos = new Set();
      [...((posts && posts.data) || []), ...((comments && comments.data) || [])].forEach((r) => {
        if (window.AR4_AGENTES_IDS.has(r.profile_id)) activos.add(r.profile_id);
      });
      agentesOnline = Math.max(activos.size, turnoDeGuardia());
      const el = document.getElementById('pulseOnlineCount');
      if (el) el.textContent = String(presenceCount + agentesOnline);
      document.dispatchEvent(new CustomEvent('ar4-presence-update'));
    } catch (e) { /* el contador es informativo */ }
  }
  setTimeout(refreshAgentesOnline, 1800);
  setInterval(refreshAgentesOnline, 120000);

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

  // Degradado determinista por usuario para el avatar por defecto (look profesional).
  const AVATAR_GRADIENTS = [
    ['#5b7cfa', '#2f4bd6'], ['#12b3c7', '#0b7f8f'], ['#8e5bf2', '#5b2fa8'],
    ['#f0a921', '#c46a10'], ['#e13a4b', '#a11824'], ['#1a9fd0', '#0d6d92'],
    ['#2ecc71', '#189a52'], ['#e84393', '#a3246a'], ['#d4af37', '#a07d14'],
    ['#ff7a59', '#d24d2f'], ['#5c6b7a', '#333d47'], ['#00b894', '#00806a']
  ];
  function avatarHash(s) { let h = 0; s = String(s || 'x'); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function avatarGradient(username) {
    const g = AVATAR_GRADIENTS[avatarHash(username) % AVATAR_GRADIENTS.length];
    return 'linear-gradient(135deg,' + g[0] + ',' + g[1] + ')';
  }
  function generatedAvatarUrl(username) {
    // Avatar ilustrado, determinista por usuario (mismo usuario = mismo avatar).
    return 'https://api.dicebear.com/9.x/notionists/svg?seed=' + encodeURIComponent(username || 'trader') + '&scale=130&radius=50';
  }
  function avatarHTML(profile, sizeClass) {
    if (profile.avatar_url) {
      const color = profile.avatar_color || '#8b93a7';
      return `<div class="${sizeClass}" style="background:${color};"><img src="${escapeHtml(profile.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;"></div>`;
    }
    const grad = avatarGradient(profile.username);
    const initials = avatarInitials(profile.username);
    // Avatar generado (imagen); si falla, se muestran las iniciales sobre el degradado.
    return `<div class="${sizeClass} avatar-generated" style="background:${grad};">` +
      `<img src="${generatedAvatarUrl(profile.username)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` +
      `<span class="avatar-fallback" style="background:${grad};">${initials}</span>` +
      `</div>`;
  }

  function rankBadgeHTML(rank) {
    if (!rank || !RANK_LABELS[rank]) return '';
    return `<span class="rank-badge rank-${rank}">${RANK_LABELS[rank]}</span>`;
  }

  function verifiedBadgeHTML(profile) {
    const v = profile && profile.verified ? '<span class="verified-badge" title="Cuenta verificada por AR4">✔</span>' : '';
    const ia = (profile && window.AR4_agentBadgeHTML) ? window.AR4_agentBadgeHTML(profile.username) : '';
    return v + ia;
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

  async function callFunctionGETPublic(name) {
    const res = await fetch('/.netlify/functions/' + name);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error desconocido');
    return data;
  }

  function isLoggedIn() {
    return !!netlifyIdentity.currentUser();
  }

  function requireAuthOrPrompt() {
    if (isLoggedIn()) return true;
    showJoinPrompt();
    return false;
  }

  function showJoinPrompt() {
    let el = document.getElementById('communityJoinPrompt');
    if (!el) {
      el = document.createElement('div');
      el.id = 'communityJoinPrompt';
      el.className = 'join-prompt-overlay';
      document.body.appendChild(el);
      el.addEventListener('click', (e) => { if (e.target === el) el.classList.remove('visible'); });
    }
    el.innerHTML = `
      <div class="join-prompt-card glass-card">
        <button class="join-prompt-close" id="joinPromptClose" type="button">✕</button>
        <h3>Únete gratis a AR4 Mercados</h3>
        <p>Crea tu cuenta para participar en la comunidad, publicar tus análisis, seguir traders profesionales y acceder a herramientas exclusivas.</p>
        <button class="google-auth-btn" id="joinPromptGoogle" type="button">
          <svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar con Google
        </button>
        <div class="auth-divider"><span>o con tu correo</span></div>
        <div class="join-prompt-actions">
          <button class="btn btn-gold" id="joinPromptSignup" type="button">Crear cuenta</button>
          <button class="btn btn-outline" id="joinPromptLogin" type="button">Iniciar sesión</button>
        </div>
      </div>
    `;
    el.classList.add('visible');
    document.getElementById('joinPromptClose').addEventListener('click', () => el.classList.remove('visible'));
    document.getElementById('joinPromptGoogle').addEventListener('click', () => { window.location.href = '/.netlify/identity/authorize?provider=google'; });
    document.getElementById('joinPromptSignup').addEventListener('click', () => { el.classList.remove('visible'); netlifyIdentity.open('signup'); });
    document.getElementById('joinPromptLogin').addEventListener('click', () => { el.classList.remove('visible'); netlifyIdentity.open('login'); });
  }

  function guestShellHTML() {
    return `
      <div class="community-guest-banner glass-card">
        <div>
          <h3>Únete gratis a la comunidad AR4</h3>
          <p>Publica tus análisis, sigue a otros traders, comenta, reacciona y construye tu reputación.</p>
        </div>
        <div class="community-guest-actions">
          <button class="btn btn-gold" id="guestSignupBtn" type="button">Crear cuenta</button>
          <button class="btn btn-outline" id="guestLoginBtn" type="button">Iniciar sesión</button>
          <button class="google-auth-btn" id="guestGoogleBtn" type="button" style="width:auto;">
            <svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continuar con Google
          </button>
        </div>
      </div>
      ${storiesBarHTML()}
      <div class="community-dashboard-layout">
        <nav class="community-tabs">
          <button class="community-tab-btn active" data-view="resumen"><span class="ctab-ic">${ICON.home}</span>Inicio <span class="sidenav-badge" id="notifUnreadBadge" hidden>0</span></button>
          <button class="community-tab-btn" data-view="foro" data-category=""><span class="ctab-ic">${ICON.list}</span>Foro (todos)</button>
          <span class="community-tabs-label">Categorías</span>
          ${navCategoriesHTML()}
          <span class="community-tabs-label">Social</span>
          <button class="community-tab-btn" data-view="ranking"><span class="ctab-ic">${ICON.ranking}</span>Ranking</button>
        </nav>
        <div id="communityMainView"><p class="footer-text">Cargando...</p></div>
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

  function socialLinksFormHTML(socialLinks) {
    const links = socialLinks || {};
    return `
      <label style="margin-top:18px;">Redes sociales (opcional)</label>
      <div class="social-links-form">
        ${Object.keys(SOCIAL_META).map((key) => `
          <div class="social-links-row">
            <span class="social-links-icon">${SOCIAL_META[key].icon}</span>
            <input type="text" id="cpSocial_${key}" placeholder="${SOCIAL_META[key].placeholder}" maxlength="30" value="${escapeHtml(links[key] || '')}">
          </div>
        `).join('')}
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
        ${isEdit ? socialLinksFormHTML(p.social_links) : ''}
        ${avatarPickerHTML(selectedColor)}
        <button class="btn btn-gold" id="cpSubmit" style="margin-top:14px;">${isEdit ? 'Guardar cambios' : 'Crear perfil'}</button>
        ${isEdit ? '<button class="btn btn-outline" id="cpCancel" style="margin-top:14px;margin-left:8px;">Cancelar</button>' : ''}
        <div class="community-form-msg" id="cpMsg"></div>
      </div>
      ${isEdit ? `
      <div class="community-form edit-donate">
        <h3 style="margin-bottom:4px;">Donar puntos a otro usuario</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;">Regala parte de tus puntos a cualquier miembro de la comunidad. Tienes <strong>${myProfile.points} pts</strong> disponibles.</p>
        <div class="community-donate-form" style="margin-top:8px;">
          <input type="text" id="donateUsername" placeholder="Usuario destinatario" maxlength="24">
          <input type="number" id="donateAmount" placeholder="Puntos (5-500)" min="5" max="500">
          <button class="btn btn-gold" id="donateSubmitBtn" type="button">Enviar</button>
        </div>
        <div class="community-form-msg" id="donateMsg"></div>
      </div>` : ''}
    `;
  }

  async function fetchCatalogPage(rarity) {
    const offset = catalogOffset[rarity];
    const { data, error } = await sb.from('avatar_catalog')
      .select('id,seq,name,rarity,svg_markup,price_points,price_soles')
      .eq('rarity', rarity)
      .order('seq', { ascending: true })
      .range(offset, offset + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;
    catalogCache[rarity] = catalogCache[rarity].concat(data);
    catalogOffset[rarity] += data.length;
    catalogHasMore[rarity] = data.length === CATALOG_PAGE_SIZE;
    return data;
  }

  function avatarCollectionHTML(catalogOwnedIds) {
    const rank = myEffectiveRank();
    const isAdmin = rank === 'administrador';
    const TAB_LABELS = { comun: 'Común', raro: 'Raro', legendario: 'Legendario' };

    function priceLabel(item) {
      if (item.rarity === 'comun') return `${item.price_points} pts`;
      return `S/ ${Number(item.price_soles).toFixed(2)}`;
    }

    function cardHTML(item) {
      const owned = isAdmin || catalogOwnedIds.includes(item.id);
      return `
        <div class="avatar-shop-card avatar-collection-card rarity-${item.rarity}">
          <div class="avatar-collection-img">${item.svg_markup}</div>
          <strong>${escapeHtml(item.name)}</strong>
          <span class="avatar-price">${owned ? 'En tu colección' : priceLabel(item)}</span>
          <button class="btn ${owned ? 'btn-outline' : 'btn-gold'} btn-block catalog-action-btn" data-catalog-id="${item.id}" data-owned="${owned}" data-method="${item.rarity === 'comun' ? 'points' : 'soles'}" data-price-points="${item.price_points || ''}">
            ${owned ? 'Equipar' : 'Comprar'}
          </button>
        </div>
      `;
    }

    const items = catalogCache[catalogTab];
    return `
      <h4 style="font-size:0.9rem;margin:24px 0 10px;">Colección Exclusiva AR4 (500 piezas)</h4>
      <p style="color:var(--text-mid);font-size:0.82rem;margin-bottom:14px;">Avatares coleccionables con distintos niveles de rareza. No son criptomonedas ni NFTs — son un accesorio cosmético de tu perfil en AR4 Mercados. Los comunes se compran con tus puntos de comunidad; los raros y legendarios con Mercado Pago.</p>
      <div class="community-tabs" style="flex-direction:row;position:static;margin-bottom:14px;">
        ${Object.keys(TAB_LABELS).map((r) => `<button class="community-tab-btn catalog-tab-btn${r === catalogTab ? ' active' : ''}" data-rarity="${r}">${TAB_LABELS[r]}</button>`).join('')}
      </div>
      <div class="avatar-shop-grid" id="catalogGrid">${items.map(cardHTML).join('') || '<p class="footer-text">Cargando...</p>'}</div>
      ${catalogHasMore[catalogTab] ? '<button class="btn btn-outline" id="catalogLoadMoreBtn" style="margin-top:14px;">Cargar más</button>' : ''}
    `;
  }

  function avatarShopHTML(ownedIds, catalogOwnedIds) {
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

    const isCustomPhoto = !!(myProfile.avatar_url && myProfile.avatar_url.indexOf('/avatar-uploads/') !== -1);

    return `
      <div class="community-form">
        <h3 style="margin-bottom:4px;">Tienda de avatares</h3>
        <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">Elige un avatar gratuito, desbloquea uno exclusivo, o sube tu propia foto. Los pagos se procesan de forma segura vía Mercado Pago.</p>

        <h4 style="font-size:0.9rem;margin-bottom:10px;">Tu propia foto</h4>
        <div class="avatar-upload-row">
          ${avatarHTML(myProfile, 'trader-avatar')}
          <div>
            <input type="file" id="avatarPhotoInput" accept="image/png,image/jpeg,image/webp" hidden>
            <button class="btn btn-outline" id="avatarPhotoBtn" type="button">Subir foto (máx. 4 MB)</button>
            ${isCustomPhoto ? '<button class="btn btn-outline" id="avatarPhotoRemoveBtn" type="button" style="margin-left:8px;">Quitar foto</button>' : ''}
          </div>
        </div>

        <h4 style="font-size:0.9rem;margin:24px 0 10px;">Gratuitos</h4>
        <div class="avatar-shop-grid">${FREE_AVATARS.map((a) => cardHTML(a, false)).join('')}</div>
        <h4 style="font-size:0.9rem;margin:24px 0 10px;">Exclusivos${isAdmin ? ' <span style="color:var(--gold-bright);font-size:0.76rem;">(incluidos en tu rango de administrador)</span>' : ''}</h4>
        <div class="avatar-shop-grid">${PREMIUM_AVATARS.map((a) => cardHTML(a, true)).join('')}</div>

        ${avatarCollectionHTML(catalogOwnedIds)}

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
        <p style="color:var(--text-mid);font-size:0.86rem;margin-top:14px;">Marca o quita la insignia ✔ Verificado de un usuario.</p>
        <div class="community-form-row">
          <input type="text" id="adminVerifyUsername" placeholder="Nombre de usuario">
          <select id="adminVerifyValue"><option value="true">Verificar ✔</option><option value="false">Quitar verificación</option></select>
          <button class="btn btn-crimson" id="adminSetVerifiedBtn">Aplicar</button>
        </div>
        <div class="community-form-msg" id="adminVerifyMsg"></div>
        <p style="color:var(--text-mid);font-size:0.86rem;margin-top:14px;">Dona puntos a cualquier usuario. Como administrador se otorgan sin descontarse de tu saldo.</p>
        <div class="community-form-row">
          <input type="text" id="adminPointsUsername" placeholder="Nombre de usuario">
          <input type="number" id="adminPointsAmount" placeholder="Puntos" min="1" max="5000">
          <select id="adminPointsAction"><option value="give">Donar puntos</option><option value="remove">Quitar puntos</option></select>
          <button class="btn btn-crimson" id="adminGivePointsBtn">Aplicar</button>
        </div>
        <div class="community-form-msg" id="adminPointsMsg"></div>
      </div>
    `;
  }

  function foroPanelHTML() {
    const rank = myEffectiveRank();
    const basicoNote = !myProfile
      ? '<p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Crea tu cuenta gratis para publicar tu propio análisis.</p>'
      : rank === 'basico'
        ? '<p style="color:var(--text-low);font-size:0.78rem;margin-top:8px;">Rango Básico: 1 publicación cada 24 horas. Sube a VIP para publicar sin límite.</p>'
        : '';
    return `
      <div class="community-form">
        <h3 style="margin-bottom:14px;">¿Qué oportunidad estás viendo hoy?</h3>
        <label for="postCategory">Categoría</label>
        <select id="postCategory">${CATEGORY_LABELS.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
        <label for="postSymbol">Instrumento (elige de la lista o escríbelo)</label>
        <div class="post-symbol-wrap">
          <input type="text" id="postSymbol" maxlength="40" autocomplete="off" placeholder="Busca: EUR/USD, oro, BTC, Nasdaq, Apple…">
          <div class="post-symbol-dropdown" id="postSymbolDropdown" hidden></div>
        </div>
        <label for="postTitle">Título</label>
        <input type="text" id="postTitle" maxlength="120">
        <label for="postBody">Tu análisis</label>
        <div style="position:relative;">
          <textarea id="postBody" maxlength="2000" placeholder="Escribe @ para mencionar a otro trader"></textarea>
          <div id="postBodyMentionDropdown" class="mention-dropdown" hidden></div>
        </div>
        <label>Tu sesgo (opcional) — alimenta el Pulso de Sentimiento de la comunidad</label>
        <div class="sentiment-picker" id="sentimentPicker">
          <button type="button" class="sentiment-option" data-sentiment="alcista"><span class='sdot sdot-g'></span> Alcista</button>
          <button type="button" class="sentiment-option" data-sentiment="bajista"><span class='sdot sdot-r'></span> Bajista</button>
          <button type="button" class="sentiment-option" data-sentiment="neutral"><span class='sdot sdot-n'></span> Neutral</button>
        </div>
        <div class="chart-studio-wrap" style="margin-top:16px;">
          <label>Gráfico</label>
          <p class="footer-text" style="margin:6px 0 10px;">Elige el activo en <strong>Instrumento</strong> o en los botones: el <strong>gráfico y la categoría se ajustan solos</strong>.</p>
          <div class="chart-chips" id="postChartChips">
            <button type="button" class="chart-chip" data-sym="EUR/USD" data-cat="Forex">EUR/USD</button>
            <button type="button" class="chart-chip" data-sym="USD/MXN" data-cat="Forex">USD/MXN</button>
            <button type="button" class="chart-chip" data-sym="ORO" data-cat="Materias Primas">Oro</button>
            <button type="button" class="chart-chip" data-sym="PETROLEO" data-cat="Materias Primas">Petróleo</button>
            <button type="button" class="chart-chip" data-sym="BTC/USD" data-cat="Criptomonedas">BTC/USD</button>
            <button type="button" class="chart-chip" data-sym="ETH/USD" data-cat="Criptomonedas">ETH/USD</button>
            <button type="button" class="chart-chip" data-sym="NASDAQ" data-cat="Índices">NASDAQ 100</button>
            <button type="button" class="chart-chip" data-sym="SP500" data-cat="Índices">S&P 500</button>
            <button type="button" class="chart-chip" data-sym="NASDAQ:AAPL" data-cat="Acciones">Apple</button>
            <button type="button" class="chart-chip" data-sym="NASDAQ:TSLA" data-cat="Acciones">Tesla</button>
          </div>
          <div id="postTvWrap">
            <div class="chart-studio" id="postChartStudioMount"></div>
            <p class="footer-text" style="margin:8px 0 0;">Dibuja tu análisis (Fibonacci, indicadores…) y toma una captura (⊞ Win+Shift+S · ⌘ Cmd+Shift+4 · o el ícono de cámara del gráfico) para subirla con "Adjuntar imagen".</p>
          </div>
        </div>
        <div class="comment-attach-row" style="margin-top:12px;">
          <button type="button" class="comment-attach-btn" id="postAttachBtn"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.85 1.85 0 0 1-2.6-2.6l8.3-8.3'/></svg> Adjuntar imagen, video o PDF</button>
          <input type="file" id="postMediaInput" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,application/pdf" hidden>
          <span class="comment-attach-name" id="postMediaName"></span>
        </div>
        <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-weight:400;text-transform:none;font-family:inherit;cursor:pointer;">
          <input type="checkbox" id="postAddPoll" style="width:16px;height:16px;"> Agregar una encuesta (opcional)
        </label>
        <div id="postPollFields" hidden style="margin-top:10px;">
          <input type="text" id="postPollOption0" maxlength="60" placeholder="Opción 1" style="margin-bottom:8px;">
          <input type="text" id="postPollOption1" maxlength="60" placeholder="Opción 2" style="margin-bottom:8px;">
          <input type="text" id="postPollOption2" maxlength="60" placeholder="Opción 3 (opcional)" style="margin-bottom:8px;">
          <input type="text" id="postPollOption3" maxlength="60" placeholder="Opción 4 (opcional)">
        </div>
        <label style="display:flex;align-items:center;gap:8px;margin-top:14px;font-weight:400;text-transform:none;font-family:inherit;cursor:pointer;">
          <input type="checkbox" id="postIsIdea" style="width:16px;height:16px;"> Publicar como Idea de Trading estructurada (Entrada / SL / TP con seguimiento de resultado)
        </label>
        <div id="postIdeaFields" hidden style="margin-top:10px;">
          <label>Dirección</label>
          <div class="sentiment-picker" id="ideaDirectionPicker">
            <button type="button" class="sentiment-option" data-direction="long">▲ Long</button>
            <button type="button" class="sentiment-option" data-direction="short">▼ Short</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:12px;">
            <div><label for="ideaEntry">Entrada</label><input type="number" step="any" id="ideaEntry"></div>
            <div><label for="ideaSl">Stop Loss</label><input type="number" step="any" id="ideaSl"></div>
            <div><label for="ideaTp">Take Profit</label><input type="number" step="any" id="ideaTp"></div>
          </div>
          <label for="ideaTimeframe" style="margin-top:12px;">Temporalidad</label>
          <select id="ideaTimeframe">${ALLOWED_TIMEFRAMES.map(tf => `<option value="${tf}">${tf}</option>`).join('')}</select>
          <div id="ideaRrPreview" style="margin-top:10px;color:var(--gold-bright);font-family:var(--mono);font-size:0.86rem;"></div>
          <p style="color:var(--text-low);font-size:0.76rem;margin-top:6px;">Usa el campo Instrumento de arriba con un símbolo reconocido (ej. EUR/USD, ORO, BTC/USD) para que la idea muestre su gráfico.</p>
        </div>
        <button class="btn btn-gold" id="postSubmit" style="margin-top:14px;">Publicar (+10 pts)</button>
        <div class="community-form-msg" id="postMsg"></div>
        ${basicoNote}
        <p style="color:var(--text-low);font-size:0.76rem;margin-top:10px;">Si indicas un instrumento reconocido (ej. EUR/USD, USD/MXN, ORO, BTC/USD), tu publicación mostrará automáticamente un gráfico de TradingView con medias móviles. Archivos hasta 8 MB.</p>
      </div>

      <div class="section-head">
        <h2>${feedSortMode === 'paraTi' ? ('<span class="sec-ic">' + ICON.spark + '</span> Para ti') : 'Ideas de la comunidad'}</h2>
        <button class="filter-chip" id="bookmarksToggleBtn" data-filter="all"><span class="sec-ic">${ICON.bookmark}</span> Ver guardados</button>
      </div>
      ${feedSortMode === 'paraTi' ? '<p style="color:var(--text-low);font-size:0.78rem;margin:-8px 0 14px;">Prioriza publicaciones recientes de traders que sigues y las que están generando más reacciones y votos útiles ahora mismo.</p>' : ''}
      ${activeCategoryFilter ? `<div class="active-filter-chip">Categoría <strong>${escapeHtml(activeCategoryFilter)}</strong> <button id="clearCategoryFilterBtn" type="button">✕ Quitar</button></div>` : ''}
      ${activeTagFilter ? `<div class="active-filter-chip">Filtrando por <strong>${escapeHtml(activeTagFilter)}</strong> <button id="clearTagFilterBtn" type="button">✕ Quitar</button></div>` : ''}
      <div id="communityFeed"><p class="footer-text">Cargando publicaciones...</p></div>
    `;
  }

  function chatPanelHTML() {
    return `
      <p style="color:var(--text-low);font-size:0.8rem;margin-bottom:14px;">Chat moderado automáticamente. Sé respetuoso, no promociones esquemas de rentabilidad garantizada ni compartas enlaces externos. Las imágenes no pasan por moderación automática — repórtanos cualquier abuso. Algunos perfiles habituales de las salas son personajes de la comunidad AR4 animados por IA.</p>
      <div class="discord-chat-shell">
        <div class="discord-sidebar">
          <div class="discord-sidebar-title">Salas</div>
          ${currentRooms().map(r => `<button class="discord-room-btn${r.id === currentRoom ? ' active' : ''}" data-room="${r.id}">${r.label}</button>`).join('')}
        </div>
        <div class="discord-main">
          <div class="discord-header" id="communityChatHeader"></div>
          <div class="discord-messages" id="communityChatMessages"><p class="footer-text">Cargando chat...</p></div>
          <div class="discord-input-row">
            <button class="discord-attach-btn" id="communityChatAttachBtn" type="button" title="Adjuntar imagen"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.85 1.85 0 0 1-2.6-2.6l8.3-8.3'/></svg></button>
            <input type="file" id="communityChatImageInput" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            <input type="text" id="communityChatInput" maxlength="500" placeholder="Escribe un mensaje...">
            <button class="discord-send-btn" id="communityChatSendBtn">Enviar</button>
          </div>
        </div>
      </div>
    `;
  }

  function mensajesPanelHTML() {
    return `
      <div class="discord-chat-shell">
        <div class="discord-sidebar" id="dmThreadList">
          <div class="discord-sidebar-title">Conversaciones</div>
          <p class="footer-text" style="padding:0 10px;">Cargando...</p>
        </div>
        <div class="discord-main">
          <div class="discord-header" id="dmHeader"><span style="color:var(--text-low);font-size:0.86rem;">Elige una conversación o escribe "Enviar mensaje" desde el perfil de alguien.</span></div>
          <div class="discord-messages" id="dmMessages"></div>
          <div class="discord-input-row" id="dmInputRow" hidden>
            <button class="discord-attach-btn" id="dmAttachBtn" type="button" title="Adjuntar imagen"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.85 1.85 0 0 1-2.6-2.6l8.3-8.3'/></svg></button>
            <input type="file" id="dmImageInput" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            <input type="text" id="dmInput" maxlength="1000" placeholder="Escribe un mensaje...">
            <button class="discord-send-btn" id="dmSendBtn">Enviar</button>
          </div>
        </div>
      </div>
    `;
  }

  function dmThreadListItemHTML(t) {
    const preview = t.lastMessage
      ? (t.lastMessage.image_url && !t.lastMessage.body ? "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z'/><circle cx='12' cy='13' r='3.5'/></svg> Imagen" : (t.lastMessage.body || ''))
      : 'Nueva conversación';
    return `
      <button class="discord-room-btn dm-thread-item${t.threadId === currentDmThreadId ? ' active' : ''}" data-thread-id="${t.threadId}" data-other-id="${t.otherProfile.id}" data-other-username="${escapeHtml(t.otherProfile.username)}">
        ${avatarHTML(t.otherProfile, 'trader-avatar')}
        <span class="dm-thread-item-text">
          <strong>${escapeHtml(t.otherProfile.username)}</strong>
          <span class="dm-thread-preview">${escapeHtml(preview.slice(0, 40))}</span>
        </span>
        ${t.unreadCount ? `<span class="sidenav-badge">${t.unreadCount}</span>` : ''}
      </button>
    `;
  }

  async function loadMensajesList(autoOpenProfile) {
    const listEl = document.getElementById('dmThreadList');
    if (!listEl) return;
    try {
      const data = await callFunctionGET('dm-threads');
      const items = data.threads.map(dmThreadListItemHTML).join('') || '<p class="footer-text" style="padding:0 10px;">Todavía no tienes conversaciones.</p>';
      listEl.innerHTML = `<div class="discord-sidebar-title">Conversaciones</div>${items}`;
      listEl.querySelectorAll('.dm-thread-item').forEach((btn) => {
        btn.addEventListener('click', () => openDmThread(btn.dataset.threadId, { id: btn.dataset.otherId, username: btn.dataset.otherUsername }));
      });

      const totalUnread = data.threads.reduce((sum, t) => sum + t.unreadCount, 0);
      const badge = document.getElementById('dmUnreadBadge');
      if (badge) { badge.hidden = !totalUnread; badge.textContent = totalUnread; }

      if (autoOpenProfile) {
        const existing = data.threads.find((t) => t.otherProfile.id === autoOpenProfile.id);
        openDmThread(existing ? existing.threadId : null, autoOpenProfile);
      }
    } catch (e) {
      listEl.innerHTML = `<p class="footer-text" style="padding:0 10px;">${escapeHtml(e.message)}</p>`;
    }

    if (!dmListPollTimer) dmListPollTimer = setInterval(() => loadMensajesList(), 12000);
  }

  function dmBubbleHTML(msg, isMine, author) {
    const imgHTML = msg.image_url ? `<img class="discord-msg-image" src="${escapeHtml(msg.image_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">` : '';
    const textHTML = msg.body ? `<p>${escapeHtml(msg.body)}</p>` : '';
    return `
      <div class="discord-msg${isMine ? ' dm-msg-mine' : ''}">
        ${avatarHTML(author, 'discord-msg-avatar')}
        <div class="discord-msg-body">
          <div class="discord-msg-head"><strong>${escapeHtml(author.username)}</strong><span class="discord-msg-time">${timeAgo(msg.created_at)}${isMine && msg.read_at ? ' · Visto' : ''}</span></div>
          ${textHTML}
          ${imgHTML}
        </div>
      </div>
    `;
  }

  async function openDmThread(threadId, otherProfile) {
    currentDmThreadId = threadId || null;
    if (dmPollTimer) { clearInterval(dmPollTimer); dmPollTimer = null; }

    document.querySelectorAll('.dm-thread-item').forEach((b) => b.classList.toggle('active', b.dataset.threadId === threadId));

    const headerEl = document.getElementById('dmHeader');
    const msgsEl = document.getElementById('dmMessages');
    const inputRow = document.getElementById('dmInputRow');
    if (!headerEl || !msgsEl) return;
    // El contenedor se reutiliza entre conversaciones: borrar la huella del
    // hilo anterior para que el nuevo siempre se pinte desde cero.
    delete msgsEl.dataset.huella;
    delete msgsEl.dataset.huellaPrevia;

    headerEl.innerHTML = `${avatarHTML(otherProfile, 'trader-avatar')}<div><strong>${escapeHtml(otherProfile.username)}</strong></div><button class="btn btn-outline" id="dmBlockBtn" style="margin-left:auto;font-size:0.72rem;padding:5px 10px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><circle cx='12' cy='12' r='9'/><path d='M5.6 5.6l12.8 12.8'/></svg> Bloquear</button>`;
    inputRow.hidden = false;

    async function refresh() {
      if (!threadId) {
        msgsEl.innerHTML = '<p class="footer-text">Escribe tu primer mensaje para empezar la conversación.</p>';
        return;
      }
      try {
        const data = await callFunctionGET('dm-messages?threadId=' + encodeURIComponent(threadId));
        // Si no hay nada nuevo (ni mensajes ni cambios de "Visto"), no se toca
        // el DOM: redibujar cada 4 s parpadeaba las imágenes y arrastraba al
        // lector al fondo aunque estuviera leyendo mensajes antiguos.
        const huella = data.messages.map((m) => m.id + ':' + (m.read_at ? 1 : 0)).join('|');
        if (msgsEl.dataset.huella === huella) return;
        msgsEl.dataset.huella = huella;
        // Solo se auto-baja si el lector ya estaba al fondo (o al abrir el hilo).
        const estabaAbajo = !msgsEl.dataset.huellaPrevia || (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 60);
        msgsEl.dataset.huellaPrevia = '1';
        const rows = data.messages.map((m) => dmBubbleHTML(m, m.sender_id === data.myProfileId, m.sender_id === data.myProfileId ? myProfile : data.otherProfile));
        msgsEl.innerHTML = rows.join('') || '<p class="footer-text">Todavía no hay mensajes. ¡Escribe el primero!</p>';
        if (estabaAbajo) msgsEl.scrollTop = msgsEl.scrollHeight;
      } catch (e) {
        msgsEl.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
      }
    }
    await refresh();
    dmPollTimer = setInterval(refresh, 4000);

    const blockBtn = document.getElementById('dmBlockBtn');
    if (blockBtn) {
      blockBtn.addEventListener('click', async () => {
        if (!confirm(`¿Bloquear a ${otherProfile.username}? No podrán enviarse mensajes.`)) return;
        try {
          const data = await callFunction('dm-block', { targetProfileId: otherProfile.id });
          blockBtn.textContent = data.blocked ? '✔ Bloqueado' : "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><circle cx='12' cy='12' r='9'/><path d='M5.6 5.6l12.8 12.8'/></svg> Bloquear";
        } catch (e) { alert(e.message); }
      });
    }

    const sendBtn = document.getElementById('dmSendBtn');
    const input = document.getElementById('dmInput');
    const attachBtn = document.getElementById('dmAttachBtn');
    const fileInput = document.getElementById('dmImageInput');
    attachBtn.onclick = () => fileInput.click();
    fileInput.onchange = () => { if (fileInput.files[0]) attachBtn.textContent = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='9' cy='10' r='1.6'/><path d='M4 19l6-6 4 4 3-3 3 3'/></svg>"; };

    async function send() {
      const text = input.value.trim();
      const file = fileInput.files[0];
      if (!text && !file) return;
      sendBtn.disabled = true;
      try {
        let imageBase64 = null;
        let imageType = null;
        if (file) {
          if (file.size > 4 * 1024 * 1024) throw new Error('La imagen no puede pesar más de 4 MB.');
          imageBase64 = await fileToBase64(file);
          imageType = file.type;
        }
        const data = await callFunction('dm-send', { toProfileId: otherProfile.id, body: text, imageBase64, imageType });
        input.value = '';
        fileInput.value = '';
        attachBtn.textContent = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.85 1.85 0 0 1-2.6-2.6l8.3-8.3'/></svg>";
        if (!threadId) { threadId = data.threadId; currentDmThreadId = threadId; loadMensajesList(); }
        await refresh();
        // Al enviar, siempre bajar a ver el propio mensaje (aunque se estuviera
        // leyendo arriba).
        msgsEl.scrollTop = msgsEl.scrollHeight;
      } catch (e) {
        alert(e.message);
      } finally {
        sendBtn.disabled = false;
      }
    }
    sendBtn.onclick = send;
    input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
  }

  window.AR4_startDM = function (profileId, username) {
    if (!requireAuthOrPrompt()) return;
    switchDashboardView('mensajes');
    setTimeout(() => loadMensajesList({ id: profileId, username: username || 'Usuario' }), 300);
  };

  function rankingPanelHTML() {
    return `
      <div class="leaderboard-grid leaderboard-grid-3">
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">Ranking semanal</h2></div>
          <div id="leaderboardWeekly"><p class="footer-text">Cargando ranking...</p></div>
        </div>
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">Ranking mensual</h2></div>
          <div id="leaderboardMonthly"><p class="footer-text">Cargando ranking...</p></div>
        </div>
        <div>
          <div class="section-head"><h2 style="font-size:1.05rem;">Ranking histórico</h2></div>
          <div id="leaderboardAllTime"><p class="footer-text">Cargando ranking...</p></div>
        </div>
      </div>
    `;
  }

  function leaderboardListHTML(rows) {
    if (!rows || !rows.length) return '<p class="footer-text">Todavía no hay datos suficientes.</p>';
    return `<div class="leaderboard-list">${rows.map((p, i) => `
      <div class="leaderboard-row">
        <span class="leaderboard-rank">#${i + 1}</span>
        <a href="perfil.html?u=${encodeURIComponent(p.username)}">${avatarHTML(p, 'trader-avatar')}</a>
        <div class="leaderboard-name"><a href="perfil.html?u=${encodeURIComponent(p.username)}" class="perfil-link-name"><strong>${escapeHtml(p.username)}</strong></a>${verifiedBadgeHTML(p)}${rankBadgeHTML(p.rank)}</div>
        <span class="leaderboard-points">${p.points} pts</span>
      </div>
    `).join('')}</div>`;
  }

  async function loadLeaderboard() {
    const weeklyEl = document.getElementById('leaderboardWeekly');
    const monthlyEl = document.getElementById('leaderboardMonthly');
    const allTimeEl = document.getElementById('leaderboardAllTime');
    if (!weeklyEl || !allTimeEl) return;
    try {
      const data = await callFunctionGETPublic('community-leaderboard');
      weeklyEl.innerHTML = leaderboardListHTML(data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })));
      if (monthlyEl) monthlyEl.innerHTML = leaderboardListHTML((data.monthly || []).map((p) => ({ ...p, points: p.monthlyPoints })));
      allTimeEl.innerHTML = leaderboardListHTML(data.allTime);
    } catch (e) {
      weeklyEl.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
      if (monthlyEl) monthlyEl.innerHTML = '';
      allTimeEl.innerHTML = '';
    }
  }

  function tradingDnaPanelHTML() {
    return `
      <p style="color:var(--text-mid);font-size:0.86rem;margin-bottom:18px;">Calculado en tiempo real a partir de las operaciones que registraste en tu <a href="herramientas.html">diario de trading</a>. Ningún dato aquí está inventado — si no ves algo, es porque todavía no lo registraste.</p>
      <div id="tradingDnaContent"><p class="footer-text">Cargando tu Trading DNA...</p></div>
    `;
  }

  function dnaStatCardHTML(label, value, sublabel) {
    return `
      <div class="dna-stat-card">
        <span class="dna-stat-label">${label}</span>
        <strong class="dna-stat-value">${value}</strong>
        ${sublabel ? `<span class="dna-stat-sub">${sublabel}</span>` : ''}
      </div>
    `;
  }

  async function loadTradingDna() {
    const el = document.getElementById('tradingDnaContent');
    if (!el) return;
    try {
      const data = await callFunctionGET('community-trading-dna');
      if (!data.hasData) {
        el.innerHTML = `
          <div class="community-form" style="text-align:center;">
            <p style="color:var(--text-mid);">Todavía no registraste ninguna operación.</p>
            <a href="herramientas.html" class="btn btn-gold" style="margin-top:10px;">Ir al diario de trading</a>
          </div>
        `;
        return;
      }

      const cards = [
        dnaStatCardHTML('Operaciones registradas', data.totalTrades, `${data.closedTrades} cerradas · ${data.openTrades} abiertas`),
        data.winRate !== null ? dnaStatCardHTML('Win rate', data.winRate + '%', `sobre ${data.closedTrades} cerradas`) : null,
        dnaStatCardHTML('Sesgo direccional', `<span style='color:#7fe0a8'>▲ ${data.longPct}%</span> / <span style='color:#ff8a8a'>▼ ${data.shortPct}%</span>`, 'long vs. short'),
        data.favoriteSymbol ? dnaStatCardHTML('Instrumento favorito', data.favoriteSymbol.symbol, `${data.favoriteSymbol.count} operaciones`) : null,
        data.avgRR !== null ? dnaStatCardHTML('R:R promedio realizado', '1:' + data.avgRR, `sobre ${data.rrSampleSize} operaciones con datos completos`) : null,
        data.currentStreak ? dnaStatCardHTML('Racha actual', data.currentStreak.count + ' ' + (data.currentStreak.type === 'ganadora' ? '✔' : '✕'), data.currentStreak.type) : null,
        data.topEmotion ? dnaStatCardHTML('Estado emocional frecuente', data.topEmotion.emotion, `${data.topEmotion.count} veces`) : null
      ].filter(Boolean).join('');

      el.innerHTML = `<div class="dna-stat-grid">${cards}</div>`;
    } catch (e) {
      el.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
    }
  }

  function badgesRowHTML(badges) {
    if (!badges || !badges.length) return '';
    return `<div class="community-badges">${badges.map((b) => {
      const meta = BADGE_META[b];
      return meta ? `<span class="badge-chip" title="${escapeHtml(meta.name)}">${meta.icon}</span>` : '';
    }).join('')}</div>`;
  }

  function socialLinksRowHTML(socialLinks) {
    const links = socialLinks || {};
    const keys = Object.keys(SOCIAL_META).filter((k) => links[k]);
    if (!keys.length) return '';
    return `<div class="social-links-row-display">${keys.map((k) => `<a href="${SOCIAL_META[k].urlBase}${encodeURIComponent(links[k])}" target="_blank" rel="noopener" title="${k}">${SOCIAL_META[k].icon}</a>`).join('')}</div>`;
  }

  // Barra de progreso refinada hacia la recompensa (500 pts = 1 mes Premium gratis).
  // Reemplaza al número de puntos suelto: motiva y se siente premium.
  function rewardProgressHTML(points) {
    const goal = 500;
    const pts = Math.max(0, points || 0);
    const pct = Math.min(100, Math.round((pts / goal) * 100));
    const reached = pts >= goal;
    const remaining = Math.max(0, goal - pts);
    return `
      <div class="reward-head">
        <span class="reward-pts">${pts}<small>pts</small></span>
        <span class="reward-goal">${reached
          ? '¡Ya puedes canjear 1 mes de Premium gratis!'
          : `Te faltan <strong>${remaining} pts</strong> para 1 mes de Premium gratis`}</span>
      </div>
      <div class="reward-track"><div class="reward-track-fill${reached ? ' full' : ''}" style="width:${pct}%;"></div></div>`;
  }

  function dashboardShellHTML() {
    const rank = myEffectiveRank();
    const isAdmin = rank === 'administrador';
    const styleTag = myProfile.trading_style ? `<span class="instrument-badge">${escapeHtml(myProfile.trading_style)}</span>` : '';
    const streak = myProfile.streak_days || 0;
    const streakChip = streak > 0 ? `<span class="streak-chip"><svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg> ${streak} ${streak === 1 ? 'día' : 'días'}</span>` : '';
    return `
      <div class="community-header-card community-hero-compact">
        <div class="chc-identity">
          <div class="community-user-chip">
            ${avatarHTML(myProfile, 'trader-avatar')}
            <div class="chc-info">
              <h4>${escapeHtml(myProfile.username)} ${rankBadgeHTML(rank)} <span class="level-badge">Nv. ${levelFromPoints(myProfile.points)}</span> ${streakChip}</h4>
              <span class="chc-bio">${escapeHtml(myProfile.bio) || 'Miembro de la comunidad AR4'} ${styleTag}</span>
              ${badgesRowHTML(myProfile.badges)}${socialLinksRowHTML(myProfile.social_links)}
              <div class="chc-follow" id="communityFollowCounts"></div>
            </div>
          </div>
          <div class="chc-actions">
            <a href="perfil.html" class="chc-link chc-link-strong">Ver mi perfil →</a>
            <button class="chc-link" id="communityEditProfileBtn">Editar</button>
            <button class="chc-link" id="communityAvatarShopBtn">Cambiar avatar</button>
            <button class="chc-link" id="communityRedeemBtn">Canjear puntos</button>
          </div>
        </div>
        <div class="chc-reward" id="communityPointsDisplay">${rewardProgressHTML(myProfile.points)}</div>
      </div>
      <div class="community-form-msg" id="redeemMsg" style="margin-bottom:14px;"></div>
      ${!window.AR4_PREMIUM ? '<button class="btn btn-outline" id="bootstrapAdminBtn" style="font-size:0.72rem;padding:6px 10px;margin-bottom:14px;">Activar cuenta de administrador + Premium (solo dueño del sitio)</button><div class="community-form-msg" id="bootstrapAdminMsg" style="margin-bottom:14px;"></div>' : ''}

      ${isAdmin ? adminPanelHTML() : ''}

      <div class="mission-widget" id="missionWidget"><p class="footer-text">Cargando misiones diarias...</p></div>
      <div class="mission-widget" id="weeklyChallengeWidget"><p class="footer-text">Cargando reto semanal...</p></div>

      ${storiesBarHTML()}

      <div class="community-dashboard-layout">
        <nav class="community-tabs">
          <button class="community-tab-btn active" data-view="resumen"><span class="ctab-ic">${ICON.home}</span>Inicio <span class="sidenav-badge" id="notifUnreadBadge" hidden>0</span></button>
          <button class="community-tab-btn" data-view="paraTi"><span class="ctab-ic">${ICON.spark}</span>Para ti</button>
          <button class="community-tab-btn" data-view="foro" data-category=""><span class="ctab-ic">${ICON.list}</span>Foro (todos)</button>
          <span class="community-tabs-label">Categorías</span>
          ${navCategoriesHTML()}
          <span class="community-tabs-label">Social</span>
          <button class="community-tab-btn" data-view="mensajes"><span class="ctab-ic">${ICON.mail}</span>Mensajes <span class="sidenav-badge" id="dmUnreadBadge" hidden>0</span></button>
          <button class="community-tab-btn" data-view="chat"><span class="ctab-ic">${ICON.chat}</span>Chat en vivo</button>
          <button class="community-tab-btn" data-view="ranking"><span class="ctab-ic">${ICON.ranking}</span>Ranking</button>
          <button class="community-tab-btn" data-view="dna"><span class="ctab-ic">${ICON.dna}</span>Trading DNA</button>
        </nav>
        <div id="communityMainView">${resumenPanelHTML()}</div>
      </div>
    `;
  }

  function greetingWord() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // "Cómo funciona": guía de 4 pasos para que cualquier persona entienda la
  // comunidad como una red social. Se puede cerrar; recuerda el cierre.
  function onboardingHTML() {
    try { if (localStorage.getItem('ar4OnboardDismissed') === '1') return ''; } catch (e) {}
    const loggedIn = typeof netlifyIdentity !== 'undefined' && !!netlifyIdentity.currentUser();
    const steps = [
      { ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/></svg>', t: 'Crea tu perfil', d: 'Elige tu nombre de trader y un avatar de la colección.' },
      { ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>', t: 'Publica tu primera idea', d: 'Un análisis, una duda o una encuesta en el Foro.' },
      { ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 5.5a2.8 2.8 0 0 1 0 5.2M20.5 19c0-2.3-1.2-4-3-4.8"/></svg>', t: 'Sigue a otros traders', d: 'Tu feed "Para ti" se arma con quienes sigues.' },
      { ic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/></svg>', t: 'Suma puntos y rango', d: 'Misiones diarias, racha y ranking: canjea por avatares y descuentos.' }
    ];
    return `
      <div class="onboard-card" id="onboardCard">
        <div class="onboard-head">
          <h3>Así funciona la comunidad</h3>
          <button class="onboard-close" id="onboardDismiss" aria-label="Cerrar guía" title="Cerrar">✕</button>
        </div>
        <div class="onboard-steps">
          ${steps.map((s, i) => `<div class="onboard-step"><span class="onboard-step-num">${i + 1}</span><span class="onboard-step-ic">${s.ic}</span><div><strong>${s.t}</strong><span>${s.d}</span></div></div>`).join('')}
        </div>
        ${loggedIn ? '' : '<div class="onboard-cta"><button class="btn btn-gold" id="onboardJoinBtn">Crear mi cuenta gratis</button><span>Menos de un minuto · sin tarjeta</span></div>'}
      </div>`;
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('#onboardDismiss')) {
      try { localStorage.setItem('ar4OnboardDismissed', '1'); } catch (err) {}
      const card = document.getElementById('onboardCard');
      if (card) card.remove();
    }
    if (e.target.closest('#onboardJoinBtn') && typeof netlifyIdentity !== 'undefined') netlifyIdentity.open('signup');
  });

  function communityPulseHTML() {
    return `
      ${onboardingHTML()}
      <div class="community-pulse-grid">
        <div class="glass-card pulse-card">
          <span class="pulse-label"><span class="pulse-dot"></span> Conectados ahora</span>
          <span class="pulse-value" id="pulseOnlineCount">—</span>
        </div>
        <div class="glass-card pulse-card">
          <span class="pulse-label">Ideas publicadas</span>
          <span class="pulse-value" id="pulsePostsCount">—</span>
        </div>
        <div class="glass-card pulse-card">
          <span class="pulse-label">Traders registrados</span>
          <span class="pulse-value" id="pulseTradersCount">—</span>
        </div>
      </div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">Noticias y análisis IA</h2></div>
      <div id="pulseNewsIdeas" class="pulse-news-row"><p class="footer-text">Cargando noticias y análisis...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;" class="sec-h">${ICON.star} Traders destacados</h2></div>
      <div id="pulseFeaturedTraders" class="featured-traders-row"><p class="footer-text">Cargando traders destacados...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;" class="sec-h">${ICON.fire} Tendencias</h2></div>
      <div id="pulseTrending" class="trending-bar"><p class="footer-text">Cargando tendencias...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;" class="sec-h">${ICON.bolt} Actividad reciente</h2></div>
      <div id="pulseActivity"><p class="footer-text">Cargando actividad...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;" class="sec-h">${ICON.trophy} Top analistas de la semana</h2></div>
      <div id="pulseTopAnalysts"><p class="footer-text">Cargando ranking...</p></div>
    `;
  }

  function newsIdeaCardHTML(item) {
    const href = item.kind === 'noticia' ? `noticia.html?slug=${encodeURIComponent(item.slug)}` : `idea.html?slug=${encodeURIComponent(item.slug)}`;
    const tag = item.kind === 'noticia' ? 'Noticia' : 'Idea';
    return `
      <a class="pulse-news-card glass-card" href="${href}">
        <span class="pulse-news-tag">${tag} · ${escapeHtml(item.category || '')}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="pulse-news-excerpt">${escapeHtml(item.excerpt || '')}</span>
        <span class="pulse-news-meta">${formatFechaPulse(item.date)}</span>
      </a>
    `;
  }

  function formatFechaPulse(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  async function loadNewsIdeasPreview(container) {
    try {
      const [noticiasRes, ideasRes] = await Promise.all([
        fetch('data/noticias.json').then((r) => r.json()).catch(() => []),
        fetch('data/ideas.json').then((r) => r.json()).catch(() => [])
      ]);
      const merged = [
        ...(noticiasRes || []).map((n) => ({ ...n, kind: 'noticia' })),
        ...(ideasRes || []).map((i) => ({ ...i, kind: 'idea' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

      if (!merged.length) { container.innerHTML = '<p class="footer-text">Todavía no hay contenido publicado.</p>'; return; }
      container.innerHTML = merged.map(newsIdeaCardHTML).join('');
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las noticias y análisis.</p>';
    }
  }

  async function loadTrending(container) {
    try {
      const { data: posts } = await sb.from('community_posts').select('body,symbol').order('created_at', { ascending: false }).limit(60);
      const tally = {};
      (posts || []).forEach((p) => {
        const tags = (p.body || '').match(/#[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]{2,20}/g) || [];
        tags.forEach((t) => { const key = t.toUpperCase(); tally[key] = (tally[key] || 0) + 1; });
        if (p.symbol) { const key = '#' + p.symbol.trim().toUpperCase().replace(/\s+/g, ''); tally[key] = (tally[key] || 0) + 1; }
      });
      const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (!sorted.length) { container.innerHTML = '<p class="footer-text">Todavía no hay suficientes publicaciones para mostrar tendencias.</p>'; return; }
      container.innerHTML = sorted.map(([tag, count]) => `<button class="trend-chip" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)} <span>${count}</span></button>`).join('');
      container.querySelectorAll('.trend-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeTagFilter = btn.dataset.tag;
          switchDashboardView('foro');
        });
      });
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las tendencias.</p>';
    }
  }

  async function loadActivityFeed(container) {
    try {
      const [postsRes, followsRes, commentsRes] = await Promise.all([
        sb.from('community_posts').select('id,profile_id,created_at').order('created_at', { ascending: false }).limit(5),
        sb.from('follows').select('follower_id,following_id,created_at').order('created_at', { ascending: false }).limit(5),
        sb.from('comments').select('profile_id,created_at').eq('target_type', 'post').order('created_at', { ascending: false }).limit(5)
      ]);
      const events = [];
      (postsRes.data || []).forEach((p) => events.push({ type: 'post', profileId: p.profile_id, created_at: p.created_at }));
      (followsRes.data || []).forEach((f) => events.push({ type: 'follow', profileId: f.follower_id, targetId: f.following_id, created_at: f.created_at }));
      (commentsRes.data || []).forEach((c) => events.push({ type: 'comment', profileId: c.profile_id, created_at: c.created_at }));
      events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const top = events.slice(0, 8);
      if (!top.length) { container.innerHTML = '<p class="footer-text">Todavía no hay actividad reciente. ¡Sé el primero en publicar!</p>'; return; }
      const rows = await Promise.all(top.map(async (ev) => {
        const author = await getProfileById(ev.profileId);
        const name = author ? escapeHtml(author.username) : 'Alguien';
        let text;
        if (ev.type === 'post') text = `${name} publicó un análisis`;
        else if (ev.type === 'comment') text = `${name} comentó una publicación`;
        else {
          const target = await getProfileById(ev.targetId);
          text = `${name} empezó a seguir a ${target ? escapeHtml(target.username) : 'alguien'}`;
        }
        const href = author ? `perfil.html?u=${encodeURIComponent(author.username)}` : '#';
        return `<a class="activity-row" href="${href}">${avatarHTML(author || { username: '?' }, 'activity-avatar')}<span class="activity-text">${text}</span><span class="activity-time">${timeAgo(ev.created_at)}</span></a>`;
      }));
      container.innerHTML = rows.join('');
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudo cargar la actividad reciente.</p>';
    }
  }

  async function loadCommunityPulse() {
    const onlineEl = document.getElementById('pulseOnlineCount');
    const postsEl = document.getElementById('pulsePostsCount');
    const tradersEl = document.getElementById('pulseTradersCount');
    const trendingEl = document.getElementById('pulseTrending');
    const activityEl = document.getElementById('pulseActivity');
    const topEl = document.getElementById('pulseTopAnalysts');
    const featuredEl = document.getElementById('pulseFeaturedTraders');
    const newsEl = document.getElementById('pulseNewsIdeas');

    if (onlineEl) onlineEl.textContent = String(presenceCount + agentesOnline);
    if (newsEl) await loadNewsIdeasPreview(newsEl);

    if (postsEl) {
      const { count } = await sb.from('community_posts').select('id', { count: 'exact' }).limit(1);
      postsEl.textContent = count || 0;
    }
    if (tradersEl) {
      const { count } = await sb.from('profiles').select('id', { count: 'exact' }).limit(1);
      tradersEl.textContent = count || 0;
    }
    if (featuredEl) await loadFeaturedTraders(featuredEl);
    if (trendingEl) await loadTrending(trendingEl);
    if (activityEl) await loadActivityFeed(activityEl);
    if (topEl) {
      try {
        const data = await callFunctionGETPublic('community-leaderboard');
        const source = (data.weekly && data.weekly.length) ? data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })) : data.allTime;
        topEl.innerHTML = leaderboardListHTML((source || []).slice(0, 5));
      } catch (e) {
        topEl.innerHTML = '<p class="footer-text">Todavía no hay datos suficientes.</p>';
      }
    }
  }

  function guestResumenPanelHTML() {
    return communityPulseHTML();
  }

  async function loadGuestResumen() {
    await loadCommunityPulse();
  }

  function resumenPanelHTML() {
    return `
      ${communityPulseHTML()}
      <div class="community-form" id="resumenGreeting" style="margin-top:20px;">
        <p class="footer-text">Cargando resumen...</p>
      </div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">Mis diplomas</h2><a href="educacion.html" class="see-all">Ir a Educación →</a></div>
      <div id="resumenDiplomas"><p class="footer-text">Cargando...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">Notificaciones</h2><button class="filter-chip" id="notifMarkAllReadBtn">✓ Marcar todo como leído</button></div>
      <div id="resumenNotifications"><p class="footer-text">Cargando...</p></div>
      <div class="section-head" style="margin-top:20px;"><h2 style="font-size:1rem;">Tu Watchlist</h2></div>
      <div id="resumenWatchlist"><p class="footer-text">Cargando...</p></div>
    `;
  }

  function notificationRowHTML(n) {
    const actorName = n.actor ? escapeHtml(n.actor.username) : 'Alguien';
    let text;
    if (n.type === 'follow') text = `${actorName} empezó a seguirte`;
    else if (n.type === 'mention') text = `${actorName} te mencionó`;
    else text = `${actorName} respondió a tu comentario`;
    const clickable = n.post_id || (n.type === 'follow' && n.actor);
    const dataAttrs = n.post_id ? `data-notif-post="${n.post_id}"` : (n.type === 'follow' && n.actor ? `data-notif-profile="${escapeHtml(n.actor.username)}"` : '');
    return `
      <div class="mission-row${clickable ? ' notif-row-clickable' : ''}" ${dataAttrs}>
        <span class="mission-icon">${n.read ? '·' : "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M18 9a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7'/><path d='M10 20a2 2 0 0 0 4 0'/></svg>"}</span>
        <div class="mission-info">
          <strong style="font-weight:${n.read ? '400' : '700'};">${text}</strong>
          <span style="color:var(--text-low);font-size:0.76rem;">${timeAgo(n.created_at)}</span>
        </div>
      </div>
    `;
  }

  async function loadNotifUnreadBadge() {
    if (!myProfile) return;
    try {
      const data = await callFunctionGET('community-notifications');
      const badge = document.getElementById('notifUnreadBadge');
      if (badge) { badge.hidden = !data.unreadCount; badge.textContent = data.unreadCount; }
    } catch (e) { /* badge queda como estaba si falla */ }
    if (!notifPollTimer) notifPollTimer = setInterval(loadNotifUnreadBadge, 30000);
  }

  function mountResumenTicker(container, items) {
    if (!container) return;
    if (!items || !items.length) {
      container.innerHTML = '<p class="footer-text">Todavía no tienes símbolos en tu watchlist. <a href="herramientas.html">Agrega algunos aquí</a>.</p>';
      return;
    }
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.text = JSON.stringify({
      symbols: items.map((it) => ({ proName: it.symbol, title: it.label })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'compact',
      colorTheme: 'dark',
      locale: 'es'
    });
    container.appendChild(script);
  }

  // Vitrina de diplomas: avance hacia los diplomas de PROGRAMA (el diploma se
  // otorga al completar y aprobar el programa entero, con verificación pública).
  const DIPLOMA_SEAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M12 6.5l1 1.9 2.1.3-1.5 1.5.3 2.1-1.9-1-1.9 1 .3-2.1L8.9 8.7l2.1-.3z"/><path d="M8.5 14.5 7 21l5-2.5L17 21l-1.5-6.5"/></svg>';
  async function loadDiplomaVitrina(container) {
    if (!container) return;
    try {
      const [freeMods, premMods, dipRes] = await Promise.all([
        fetch('data/educacion.json').then((r) => r.json()).catch(() => []),
        fetch('data/educacion-premium.json').then((r) => r.json()).catch(() => []),
        fetch('/.netlify/functions/community-public-diplomas?username=' + encodeURIComponent(myProfile.username)).then((r) => r.json()).catch(() => ({}))
      ]);
      const freeSet = new Set((freeMods || []).map((m) => m.slug));
      const premSet = new Set((premMods || []).map((m) => m.slug));
      const completedSlugs = myProfile.completed_modules || [];
      const freeDone = completedSlugs.filter((s) => freeSet.has(s)).length;
      const premDone = completedSlugs.filter((s) => premSet.has(s)).length;
      const diplomas = (dipRes && dipRes.diplomas) || [];
      const CURSO_LBL = { basico: 'Diploma de Formación Integral en Trading', institucional: 'Diploma Institucional (50 módulos)' };
      if (!diplomas.length && !completedSlugs.length) {
        container.innerHTML = '<p class="footer-text">Todavía no tienes avance. Completa los 30 módulos gratuitos de <a href="educacion.html">Educación</a> aprobando sus cuestionarios y obtén el Diploma de Formación Integral con verificación pública.</p>';
        return;
      }
      container.innerHTML = `
        ${diplomas.length ? `<div class="diploma-vitrina">
          ${diplomas.map((d) => `
            <a class="diploma-mini${d.curso === 'institucional' ? ' diploma-mini-inst' : ''}" href="verificar.html?cert=${encodeURIComponent(d.cert)}" title="Ver certificado verificado">
              <span class="diploma-mini-seal">${DIPLOMA_SEAL}</span>
              <span class="diploma-mini-body">
                <strong>${CURSO_LBL[d.curso] || escapeHtml(d.curso)}</strong>
                <span>Verificado · Ver certificado →</span>
              </span>
            </a>`).join('')}
        </div>` : ''}
        <p class="footer-text" style="margin-top:8px;">Avance: ${freeDone}/30 módulos del programa integral${premDone ? ` · ${premDone}/20 institucional` : ''} · <a href="educacion.html#diplomaRuta">ver mi Ruta del Diploma</a></p>`;
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar tus diplomas.</p>';
    }
  }

  async function loadResumen() {
    const greetingEl = document.getElementById('resumenGreeting');
    const notifEl = document.getElementById('resumenNotifications');
    const watchlistEl = document.getElementById('resumenWatchlist');
    if (!greetingEl) return;
    loadDiplomaVitrina(document.getElementById('resumenDiplomas'));

    loadCommunityPulse();

    const streak = myProfile.streak_days || 0;
    greetingEl.innerHTML = `
      <h3 style="margin-bottom:4px;">${greetingWord()}, ${escapeHtml(myProfile.username)}</h3>
      <p style="color:var(--text-mid);font-size:0.86rem;">Nivel ${levelFromPoints(myProfile.points)} · ${myProfile.points} pts${streak > 0 ? ` · <svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg> ${streak} ${streak === 1 ? 'día' : 'días'} de racha` : ''}</p>
    `;

    if (notifEl) {
      try {
        const data = await callFunctionGET('community-notifications');
        const notifs = data.notifications || [];
        notifEl.innerHTML = notifs.length
          ? notifs.slice(0, 8).map(notificationRowHTML).join('')
          : '<p class="footer-text">No tienes notificaciones nuevas.</p>';
        notifEl.querySelectorAll('.notif-row-clickable').forEach((row) => {
          row.addEventListener('click', () => {
            if (row.dataset.notifPost) window.location.href = 'comunidad.html?post=' + row.dataset.notifPost;
            else if (row.dataset.notifProfile) window.location.href = 'perfil.html?u=' + encodeURIComponent(row.dataset.notifProfile);
          });
        });
        const badge = document.getElementById('notifUnreadBadge');
        if (badge) { badge.hidden = true; badge.textContent = '0'; }
      } catch (e) {
        notifEl.innerHTML = '<p class="footer-text">No se pudieron cargar las notificaciones.</p>';
      }
    }
    const markAllReadBtn = document.getElementById('notifMarkAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', async () => {
        markAllReadBtn.disabled = true;
        try {
          await callFunction('community-notifications', { action: 'markAllRead' });
          notifEl.querySelectorAll('.mission-icon').forEach((el) => { el.textContent = '·'; });
          notifEl.querySelectorAll('.mission-info strong').forEach((el) => { el.style.fontWeight = '400'; });
          const badge = document.getElementById('notifUnreadBadge');
          if (badge) { badge.hidden = true; badge.textContent = '0'; }
        } catch (e) { /* se ignora */ } finally { markAllReadBtn.disabled = false; }
      });
    }

    if (watchlistEl) {
      try {
        const data = await callFunctionGET('community-watchlist');
        watchlistEl.innerHTML = '<div id="resumenTickerContainer" class="tradingview-widget-container"></div>';
        mountResumenTicker(document.getElementById('resumenTickerContainer'), data.items);
      } catch (e) {
        watchlistEl.innerHTML = '<p class="footer-text">Agrega símbolos en <a href="herramientas.html">Herramientas</a> para verlos aquí.</p>';
      }
    }
  }

  async function loadFollowCounts() {
    const el = document.getElementById('communityFollowCounts');
    if (!el) return;
    try {
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        sb.from('follows').select('id', { count: 'exact' }).eq('following_id', myProfile.id).limit(1),
        sb.from('follows').select('id', { count: 'exact' }).eq('follower_id', myProfile.id).limit(1)
      ]);
      el.textContent = `${followersCount || 0} seguidores · ${followingCount || 0} siguiendo`;
    } catch (e) {
      el.textContent = '';
    }
  }

  async function getProfileById(id) {
    if (profileCache[id]) return profileCache[id];
    const { data } = await sb.from('profiles').select('username,avatar_color,avatar_url,rank,verified').eq('id', id).single();
    if (data) profileCache[id] = data;
    return data;
  }

  function wireFollowButtons(scopeEl) {
    scopeEl.querySelectorAll('.dm-start-btn').forEach((btn) => {
      btn.addEventListener('click', () => window.AR4_startDM(btn.dataset.dmId, btn.dataset.dmUsername));
    });
    scopeEl.querySelectorAll('.follow-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const targetId = btn.dataset.followId;
        const currentlyFollowing = btn.dataset.following === 'true';
        btn.disabled = true;
        try {
          await callFunction('community-follow', { action: currentlyFollowing ? 'unfollow' : 'follow', targetProfileId: targetId });
          const nowFollowing = !currentlyFollowing;
          btn.dataset.following = String(nowFollowing);
          btn.textContent = nowFollowing ? '✔ Siguiendo' : '+ Seguir';
          btn.classList.toggle('following', nowFollowing);
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }

  function featuredTraderCardHTML(p, isFollowing) {
    const isSelf = myProfile && myProfile.id === p.id;
    const followBtnHTML = !isSelf
      ? `<button class="follow-btn featured-follow-btn${isFollowing ? ' following' : ''}" data-follow-id="${p.id}" data-following="${isFollowing}">${isFollowing ? '✔ Siguiendo' : '+ Seguir'}</button>`
      : '';
    const dmBtnHTML = !isSelf ? `<button class="dm-start-btn" data-dm-id="${p.id}" data-dm-username="${escapeHtml(p.username)}" title="Enviar mensaje"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 7l9 6 9-6'/></svg></button>` : '';
    return `
      <div class="featured-trader-card glass-card">
        <a href="perfil.html?u=${encodeURIComponent(p.username)}">${avatarHTML(p, 'trader-avatar')}</a>
        <a href="perfil.html?u=${encodeURIComponent(p.username)}" class="perfil-link-name"><strong>${escapeHtml(p.username)}${verifiedBadgeHTML(p)}</strong></a>
        <div class="featured-trader-meta">${rankBadgeHTML(p.rank)}<span class="level-badge">Nv. ${levelFromPoints(p.points)}</span></div>
        ${p.streak_days ? `<span class="streak-chip"><svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M12 3c1 3 4 4.5 4 8.5A4 4 0 0 1 8 12c0-1.5.5-2.5 1-3.5.8 1 2 1.2 2 2.2C11 9 12 7 12 3z'/><path d='M12 21a5 5 0 0 0 5-5c0-2-1-3.5-2-5'/></svg> ${p.streak_days} ${p.streak_days === 1 ? 'día' : 'días'}</span>` : ''}
        <div style="display:flex;gap:6px;justify-content:center;">${followBtnHTML}${dmBtnHTML}</div>
      </div>
    `;
  }

  async function loadFeaturedTraders(container) {
    try {
      const data = await callFunctionGETPublic('community-leaderboard');
      const source = (data.allTime || []).slice(0, 8);
      if (!source.length) { container.innerHTML = '<p class="footer-text">Todavía no hay suficientes traders destacados.</p>'; return; }
      let followingIds = new Set();
      if (myProfile) {
        try {
          const { data: myFollows } = await sb.from('follows').select('following_id').eq('follower_id', myProfile.id);
          followingIds = new Set((myFollows || []).map((f) => f.following_id));
        } catch (e) { /* followingIds queda vacío si falla */ }
      }
      container.innerHTML = source.map((p) => featuredTraderCardHTML(p, followingIds.has(p.id))).join('');
      wireFollowButtons(container);
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar los traders destacados.</p>';
    }
  }

  function storiesBarHTML() {
    return `<div id="storiesBar" class="stories-bar"><p class="footer-text">Cargando historias...</p></div>`;
  }

  function openStoryViewer(storiesForProfile) {
    let idx = 0;
    const overlay = document.createElement('div');
    overlay.className = 'story-viewer-overlay';
    function renderStory() {
      const s = storiesForProfile[idx];
      const mediaHTML = s.media_type === 'video'
        ? `<video src="${escapeHtml(s.media_url)}" controls autoplay class="story-viewer-media"></video>`
        : `<img src="${escapeHtml(s.media_url)}" class="story-viewer-media" alt="">`;
      overlay.innerHTML = `
        <div class="story-viewer-card">
          <button class="story-viewer-close" type="button">✕</button>
          ${mediaHTML}
          ${s.caption ? `<p class="story-viewer-caption">${escapeHtml(s.caption)}</p>` : ''}
          <div class="story-viewer-nav">
            <button type="button" class="story-viewer-prev" ${idx === 0 ? 'disabled' : ''}>‹</button>
            <span>${idx + 1} / ${storiesForProfile.length}</span>
            <button type="button" class="story-viewer-next" ${idx === storiesForProfile.length - 1 ? 'disabled' : ''}>›</button>
          </div>
        </div>
      `;
      overlay.querySelector('.story-viewer-close').addEventListener('click', () => overlay.remove());
      overlay.querySelector('.story-viewer-prev').addEventListener('click', () => { if (idx > 0) { idx--; renderStory(); } });
      overlay.querySelector('.story-viewer-next').addEventListener('click', () => { if (idx < storiesForProfile.length - 1) { idx++; renderStory(); } });
    }
    renderStory();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function openStoryUploadModal() {
    if (!requireAuthOrPrompt()) return;
    const overlay = document.createElement('div');
    overlay.className = 'story-viewer-overlay';
    overlay.innerHTML = `
      <div class="story-viewer-card story-upload-card glass-card">
        <button class="story-viewer-close" type="button">✕</button>
        <h3>Comparte una historia</h3>
        <p class="footer-text">Se muestra a toda la comunidad durante 24 horas. Imagen o video, hasta 8 MB.</p>
        <input type="file" id="storyFileInput" accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm">
        <textarea id="storyCaptionInput" maxlength="140" placeholder="Descripción breve (opcional)"></textarea>
        <button class="btn btn-gold" id="storySubmitBtn" style="margin-top:10px;">Publicar historia</button>
        <div class="community-form-msg" id="storyMsg"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.story-viewer-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('storySubmitBtn').addEventListener('click', async () => {
      const fileInput = document.getElementById('storyFileInput');
      const msgEl = document.getElementById('storyMsg');
      const file = fileInput.files[0];
      if (!file) { msgEl.textContent = 'Selecciona una imagen o video.'; msgEl.className = 'community-form-msg error'; return; }
      if (file.size > 8 * 1024 * 1024) { msgEl.textContent = 'El archivo no puede pesar más de 8 MB.'; msgEl.className = 'community-form-msg error'; return; }
      const btn = document.getElementById('storySubmitBtn');
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const base64 = await fileToBase64(file);
        const caption = document.getElementById('storyCaptionInput').value.trim();
        await callFunction('community-story-post', { mediaBase64: base64, mediaType: file.type, caption });
        overlay.remove();
        const bar = document.getElementById('storiesBar');
        if (bar) loadStoriesBar(bar);
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
        btn.disabled = false;
      }
    });
  }

  function openTechAnalysisModal(symbol, title, body, category) {
    const overlay = document.createElement('div');
    overlay.className = 'story-viewer-overlay';
    overlay.innerHTML = `
      <div class="story-viewer-card tech-modal-card glass-card">
        <button class="story-viewer-close" type="button">✕</button>
        <div class="tech-modal-head">
          <span class="instrument-badge">${escapeHtml(symbol)}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="tech-modal-widget" id="techModalWidget"></div>
        <p class="footer-text" style="font-size:0.76rem;margin-top:10px;">Indicadores calculados en vivo por TradingView (osciladores y medias móviles), no por AR4 Mercados. Es información de contexto, no una señal de compra/venta.</p>
        <button class="btn btn-outline btn-block" id="techModalAskAria" style="margin-top:10px;"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='6' y='7' width='12' height='11' rx='2.5'/><path d='M12 7V4M9 3.5h6M9.5 12h.01M14.5 12h.01M9.5 15.5h5M3 11v3M21 11v3'/></svg> Pedirle a la IA que interprete esto</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.story-viewer-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const widgetEl = document.getElementById('techModalWidget');
    if (widgetEl && typeof renderTechnicalAnalysis === 'function') {
      renderTechnicalAnalysis(widgetEl, symbol);
    }

    const askBtn = document.getElementById('techModalAskAria');
    if (askBtn) {
      askBtn.addEventListener('click', () => {
        if (typeof window.AR4_askAriaAbout !== 'function') return;
        const contextStr = `Publicación de la comunidad: "${title}" (${category}). Contenido: ${body}. Instrumento: ${symbol}.`;
        window.AR4_askAriaAbout(`Ayúdame a interpretar los indicadores técnicos de ${symbol} en el contexto de esta publicación: "${title}"`, contextStr);
        overlay.remove();
      });
    }
  }

  async function loadStoriesBar(container) {
    try {
      const nowIso = new Date().toISOString();
      const { data: stories } = await sb.from('stories').select('*').gt('expires_at', nowIso).order('created_at', { ascending: false }).limit(60);
      const byProfile = {};
      (stories || []).forEach((s) => {
        if (!byProfile[s.profile_id]) byProfile[s.profile_id] = [];
        byProfile[s.profile_id].push(s);
      });
      const profileIds = Object.keys(byProfile);

      const addBubbleHTML = `<div class="story-bubble story-add-bubble" id="storyAddBtn"><span class="story-add-icon">+</span><span class="story-bubble-label">Tu historia</span></div>`;

      if (!profileIds.length) {
        container.innerHTML = addBubbleHTML + '<p class="footer-text" style="padding:10px 4px;">Nadie ha publicado historias todavía.</p>';
      } else {
        const rows = await Promise.all(profileIds.map(async (pid) => {
          const author = await getProfileById(pid) || { username: 'Usuario', avatar_color: '#8b93a7' };
          return `<div class="story-bubble" data-profile-id="${pid}">${avatarHTML(author, 'trader-avatar')}<span class="story-bubble-label">${escapeHtml(author.username)}</span></div>`;
        }));
        container.innerHTML = addBubbleHTML + rows.join('');
      }

      document.getElementById('storyAddBtn').addEventListener('click', openStoryUploadModal);
      container.querySelectorAll('.story-bubble[data-profile-id]').forEach((el) => {
        el.addEventListener('click', () => openStoryViewer(byProfile[el.dataset.profileId]));
      });
    } catch (e) {
      container.innerHTML = '<p class="footer-text">No se pudieron cargar las historias.</p>';
    }
  }

  function reactionsRowHTML(postId) {
    const counts = reactionCache[postId] || {};
    return `
      <div class="community-reactions" data-post-id="${postId}">
        ${REACTIONS.map((r) => `<button class="reaction-btn" data-emoji="${r.emoji}" title="${r.label}">${r.emoji} <span>${counts[r.emoji] || 0}</span></button>`).join('')}
      </div>
    `;
  }

  function pollHTML(post) {
    if (!post.poll_options) return '';
    const counts = post.poll_votes_count || post.poll_options.map(() => 0);
    const total = counts.reduce((a, v) => a + v, 0);
    const votedIndex = localStorage.getItem('ar4PollVoted_' + post.id);

    if (votedIndex !== null) {
      return `
        <div class="poll-box" data-post-id="${post.id}">
          ${post.poll_options.map((opt, i) => {
            const pct = total ? Math.round((counts[i] / total) * 100) : 0;
            const isMine = String(i) === votedIndex;
            return `
              <div class="poll-result-row${isMine ? ' poll-my-vote' : ''}">
                <div class="poll-result-head"><span>${escapeHtml(opt)}${isMine ? ' ✓' : ''}</span><strong>${pct}%</strong></div>
                <div class="poll-result-bar-track"><div class="poll-result-bar-fill" style="width:${pct}%;"></div></div>
              </div>
            `;
          }).join('')}
          <span class="news-meta">${total} voto${total === 1 ? '' : 's'}</span>
        </div>
      `;
    }

    return `
      <div class="poll-box poll-unvoted" data-post-id="${post.id}">
        ${post.poll_options.map((opt, i) => `<button class="poll-option-btn" data-poll-post="${post.id}" data-poll-option="${i}">${escapeHtml(opt)}</button>`).join('')}
      </div>
    `;
  }

  const SENTIMENT_META = {
    alcista: { icon: "<span class='sdot sdot-g'></span>", label: 'Alcista' },
    bajista: { icon: "<span class='sdot sdot-r'></span>", label: 'Bajista' },
    neutral: { icon: "<span class='sdot sdot-n'></span>", label: 'Neutral' }
  };

  function ideaStatsHTML(post) {
    const status = IDEA_STATUS_META[post.idea_status] || IDEA_STATUS_META.abierta;
    const dirLabel = post.idea_direction === 'short' ? '▼ Short' : '▲ Long';
    const isMine = myProfile && post.profile_id === myProfile.id;
    const actionsHTML = (isMine && post.idea_status === 'abierta')
      ? `<div class="idea-status-actions" data-idea-post="${post.id}">
          <span>Actualizar resultado:</span>
          <button class="idea-status-btn win" data-idea-status="ganadora" data-idea-post="${post.id}">✔ Ganadora</button>
          <button class="idea-status-btn loss" data-idea-status="perdedora" data-idea-post="${post.id}">✕ Perdedora</button>
          <button class="idea-status-btn cancel" data-idea-status="cancelada" data-idea-post="${post.id}">✕ Cancelada</button>
        </div>`
      : '';
    return `
      <div class="idea-stats-card">
        <div class="idea-stats-row">
          <span class="idea-direction-badge idea-dir-${post.idea_direction}">${dirLabel}</span>
          <span class="idea-status-badge ${status.cls}">${status.label}</span>
          <span class="idea-tf-badge">${escapeHtml(post.idea_timeframe || '')}</span>
        </div>
        <div class="idea-stats-grid">
          <div><span>Entrada</span><strong>${post.idea_entry}</strong></div>
          <div><span>Stop Loss</span><strong>${post.idea_sl}</strong></div>
          <div><span>Take Profit</span><strong>${post.idea_tp}</strong></div>
          <div><span>R:R</span><strong>1:${post.idea_rr}</strong></div>
        </div>
        ${actionsHTML}
      </div>
    `;
  }

  function postCardHTML(post, authorProfile, bookmarkedIds, followingIds) {
    const symbolTag = post.symbol ? `<span class="instrument-badge">${escapeHtml(post.symbol)}</span>` : '';
    const sentimentTag = post.sentiment && SENTIMENT_META[post.sentiment]
      ? `<span class="instrument-badge">${SENTIMENT_META[post.sentiment].icon} ${SENTIMENT_META[post.sentiment].label}</span>`
      : '';
    const resolvedSymbol = resolvePostSymbol(post.symbol);
    const chartHTML = resolvedSymbol
      ? `<div class="community-post-chart"><div class="tradingview-widget-container" id="postChart-${post.id}"></div></div>`
      : '';
    let mediaHTML = '';
    if (post.media_url && post.media_type === 'image') {
      mediaHTML = `<img class="community-post-media-image" src="${escapeHtml(post.media_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">`;
    } else if (post.media_url && post.media_type === 'video') {
      mediaHTML = `<video class="community-post-media-video" src="${escapeHtml(post.media_url)}" controls preload="metadata"></video>`;
    } else if (post.media_url && post.media_type === 'pdf') {
      mediaHTML = `<a class="community-post-media-pdf" href="${escapeHtml(post.media_url)}" target="_blank" rel="noopener"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z'/><path d='M14 3v5h5M9 13h6M9 17h6'/></svg> Ver documento PDF adjunto</a>`;
    }
    const isBookmarked = bookmarkedIds && bookmarkedIds.has(post.id);
    const isFollowing = followingIds && followingIds.has(authorProfile.id);
    const followBtnHTML = (myProfile && authorProfile.id !== myProfile.id)
      ? `<button class="follow-btn${isFollowing ? ' following' : ''}" data-follow-id="${authorProfile.id}" data-following="${isFollowing}">${isFollowing ? '✔ Siguiendo' : '+ Seguir'}</button>`
      : '';
    const dmBtnHTML = (myProfile && authorProfile.id !== myProfile.id && !post.is_ai_generated)
      ? `<button class="dm-start-btn" data-dm-id="${authorProfile.id}" data-dm-username="${escapeHtml(authorProfile.username)}" title="Enviar mensaje"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 7l9 6 9-6'/></svg></button>`
      : '';
    const aiTag = post.is_ai_generated ? `<span class="ai-generated-badge"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='6' y='7' width='12' height='11' rx='2.5'/><path d='M12 7V4M9 3.5h6M9.5 12h.01M14.5 12h.01M9.5 15.5h5M3 11v3M21 11v3'/></svg> Generado por IA AR4</span>` : '';
    const ideaHTML = post.is_structured_idea ? ideaStatsHTML(post) : '';
    return `
      <article class="community-post-card${post.is_ai_generated ? ' ai-generated-post' : ''}${post.is_structured_idea ? ' structured-idea-post' : ''}" data-post-id="${post.id}">
        <div class="community-post-head">
          <a href="perfil.html?u=${encodeURIComponent(authorProfile.username)}" class="perfil-link-avatar">${avatarHTML(authorProfile, 'trader-avatar')}</a>
          <div><a href="perfil.html?u=${encodeURIComponent(authorProfile.username)}" class="perfil-link-name"><strong>${escapeHtml(authorProfile.username)}</strong></a>${verifiedBadgeHTML(authorProfile)}${rankBadgeHTML(authorProfile.rank)}${aiTag}<br><span>${escapeHtml(post.category)}${symbolTag}${sentimentTag} · ${timeAgo(post.created_at)}</span></div>
          ${followBtnHTML}
          ${dmBtnHTML}
        </div>
        <h4>${escapeHtml(post.title)}</h4>
        ${ideaHTML}
        ${chartHTML}
        ${mediaHTML}
        <p>${escapeHtml(post.body)}</p>
        ${pollHTML(post)}
        <div class="community-post-footer">
          <button class="community-vote-btn" data-vote-id="${post.id}">▲ ${post.upvotes} útil</button>
          ${reactionsRowHTML(post.id)}
          <button class="comments-toggle-btn" data-comments-toggle="${post.id}">💬 Comentarios</button>
          <button class="comments-toggle-btn bookmark-btn" data-bookmark-id="${post.id}">${isBookmarked ? "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4h12v17l-6-4-6 4z'/></svg> Guardado" : "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4h12v17l-6-4-6 4z'/></svg> Guardar"}</button>
          <button class="comments-toggle-btn share-btn" data-share-id="${post.id}"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1'/><path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1'/></svg> Compartir</button>
          <button class="comments-toggle-btn ask-aria-btn" data-ask-aria-title="${escapeHtml(post.title)}" data-ask-aria-body="${escapeHtml((post.body || '').slice(0, 1000))}" data-ask-aria-category="${escapeHtml(post.category || '')}"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='6' y='7' width='12' height='11' rx='2.5'/><path d='M12 7V4M9 3.5h6M9.5 12h.01M14.5 12h.01M9.5 15.5h5M3 11v3M21 11v3'/></svg> Consultar con IA</button>
          ${resolvedSymbol ? `<button class="comments-toggle-btn tech-analysis-btn" data-tech-id="${post.id}" data-tech-symbol="${resolvedSymbol}" data-tech-title="${escapeHtml(post.title)}" data-tech-body="${escapeHtml((post.body || '').slice(0, 1000))}" data-tech-category="${escapeHtml(post.category || '')}"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M4 20V10M9 20V6M14 20v-8M19 20V4'/></svg> Análisis técnico completo</button>` : ''}
        </div>
        <div class="comments-section" id="commentsFor-${post.id}" hidden></div>
      </article>
    `;
  }

  let lastLoadedPosts = [];
  let showBookmarksOnly = false;

  async function getMyBookmarks() {
    try {
      const data = await callFunctionGET('community-bookmark');
      return new Set(data.postIds || []);
    } catch (e) {
      return new Set();
    }
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

    lastLoadedPosts = posts;
    const bookmarkedIds = myProfile ? await getMyBookmarks() : new Set();

    const postIds = posts.map((p) => p.id);
    const { data: reactions } = await sb.from('post_reactions').select('post_id,emoji').in('post_id', postIds);
    (reactions || []).forEach((r) => {
      if (!reactionCache[r.post_id]) reactionCache[r.post_id] = {};
      reactionCache[r.post_id][r.emoji] = (reactionCache[r.post_id][r.emoji] || 0) + 1;
    });

    let followingIds = new Set();
    if (myProfile) {
      try {
        const { data: myFollows } = await sb.from('follows').select('following_id').eq('follower_id', myProfile.id);
        followingIds = new Set((myFollows || []).map((f) => f.following_id));
      } catch (e) { /* followingIds queda vacío si falla */ }
    }

    let visiblePosts = showBookmarksOnly ? posts.filter((p) => bookmarkedIds.has(p.id)) : posts;
    if (activeCategoryFilter) {
      visiblePosts = visiblePosts.filter((p) => p.category === activeCategoryFilter);
    }
    if (activeTagFilter) {
      const needle = activeTagFilter.replace('#', '').toUpperCase();
      visiblePosts = visiblePosts.filter((p) =>
        (p.body || '').toUpperCase().includes('#' + needle) ||
        (p.symbol || '').toUpperCase().replace(/\s+/g, '') === needle
      );
    }

    if (!visiblePosts.length) {
      feedEl.innerHTML = showBookmarksOnly
        ? '<p class="footer-text">Todavía no guardaste ninguna publicación.</p>'
        : '<p class="footer-text">No hay publicaciones que coincidan con este filtro todavía.</p>';
      return;
    }

    if (feedSortMode === 'paraTi') {
      const scorePost = (post) => {
        const hoursAgo = (Date.now() - new Date(post.created_at).getTime()) / 3600000;
        const recencyScore = Math.max(0, 48 - hoursAgo);
        const followBoost = followingIds.has(post.profile_id) ? 40 : 0;
        const reactionCount = reactionCache[post.id] ? Object.values(reactionCache[post.id]).reduce((a, b) => a + b, 0) : 0;
        const engagementScore = (post.upvotes || 0) * 2 + reactionCount * 3;
        return recencyScore + followBoost + engagementScore;
      };
      visiblePosts = [...visiblePosts].sort((a, b) => scorePost(b) - scorePost(a));
    }

    const cards = await Promise.all(visiblePosts.map(async (p) => {
      const author = await getProfileById(p.profile_id) || { username: 'Usuario', avatar_color: '#8b93a7', rank: 'basico' };
      return postCardHTML(p, author, bookmarkedIds, followingIds);
    }));
    feedEl.innerHTML = cards.join('');

    wireFollowButtons(feedEl);

    const sharedPostId = new URLSearchParams(window.location.search).get('post');
    if (sharedPostId && !showBookmarksOnly) {
      const alreadyVisible = document.querySelector(`.community-post-card[data-post-id="${sharedPostId}"]`);
      if (alreadyVisible) {
        alreadyVisible.classList.add('shared-post-highlight');
        alreadyVisible.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        sb.from('community_posts').select('*').eq('id', sharedPostId).single().then(async ({ data: sharedPost }) => {
          if (!sharedPost) return;
          const author = await getProfileById(sharedPost.profile_id) || { username: 'Usuario', avatar_color: '#8b93a7', rank: 'basico' };
          feedEl.insertAdjacentHTML('afterbegin', postCardHTML(sharedPost, author, bookmarkedIds));
          const el = feedEl.querySelector(`.community-post-card[data-post-id="${sharedPostId}"]`);
          if (el) {
            el.classList.add('shared-post-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }
    }

    visiblePosts.forEach((p) => {
      const resolved = resolvePostSymbol(p.symbol);
      if (!resolved) return;
      const chartContainer = document.getElementById('postChart-' + p.id);
      if (chartContainer) mountPostChart(chartContainer, resolved);
    });

    feedEl.querySelectorAll('.poll-option-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const postId = btn.dataset.pollPost;
        const optionIndex = btn.dataset.pollOption;
        const box = btn.closest('.poll-box');
        box.querySelectorAll('.poll-option-btn').forEach((b) => (b.disabled = true));
        try {
          const data = await callFunction('community-poll-vote', { postId, optionIndex });
          localStorage.setItem('ar4PollVoted_' + postId, String(optionIndex));
          const post = lastLoadedPosts.find((p) => p.id === postId);
          if (post) post.poll_votes_count = data.counts;
          box.outerHTML = pollHTML(post || { poll_options: [], poll_votes_count: [] });
        } catch (e) {
          if (String(e.message).includes('Ya votaste')) {
            localStorage.setItem('ar4PollVoted_' + postId, 'unknown');
            const post = lastLoadedPosts.find((p) => p.id === postId);
            box.outerHTML = pollHTML(post || { poll_options: [], poll_votes_count: [] });
            return;
          }
          alert(e.message);
          box.querySelectorAll('.poll-option-btn').forEach((b) => (b.disabled = false));
        }
      });
    });

    feedEl.querySelectorAll('.idea-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const postId = btn.dataset.ideaPost;
        const status = btn.dataset.ideaStatus;
        const label = status === 'ganadora' ? 'Ganadora ✔' : status === 'perdedora' ? 'Perdedora ✕' : 'Cancelada ✕';
        if (!confirm(`¿Marcar esta idea como ${label}? No se puede deshacer.`)) return;
        const actionsEl = btn.closest('.idea-status-actions');
        actionsEl.querySelectorAll('button').forEach((b) => (b.disabled = true));
        try {
          const data = await callFunction('community-post-set-status', { postId, status });
          if (typeof data.points === 'number') { myProfile.points = data.points; if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile(); }
          const post = lastLoadedPosts.find((p) => p.id === postId);
          if (post) post.idea_status = status;
          const card = btn.closest('.idea-stats-card');
          card.outerHTML = ideaStatsHTML(post || { idea_status: status, idea_direction: null, idea_timeframe: '', idea_entry: '', idea_sl: '', idea_tp: '', idea_rr: '' });
        } catch (e) {
          alert(e.message);
          actionsEl.querySelectorAll('button').forEach((b) => (b.disabled = false));
        }
      });
    });

    feedEl.querySelectorAll('.bookmark-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
        const postId = btn.dataset.bookmarkId;
        btn.disabled = true;
        try {
          const data = await callFunction('community-bookmark', { postId });
          btn.textContent = data.bookmarked ? "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4h12v17l-6-4-6 4z'/></svg> Guardado" : "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M6 4h12v17l-6-4-6 4z'/></svg> Guardar";
          if (showBookmarksOnly && !data.bookmarked) {
            btn.closest('.community-post-card').remove();
          }
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
        }
      });
    });

    feedEl.querySelectorAll('.share-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const postId = btn.dataset.shareId;
        const url = window.location.origin + window.location.pathname + '?post=' + postId;
        try {
          await navigator.clipboard.writeText(url);
          const original = btn.textContent;
          btn.textContent = 'Enlace copiado';
          setTimeout(() => { btn.textContent = original; }, 2000);
        } catch (e) {
          prompt('Copia este enlace:', url);
        }
      });
    });

    feedEl.querySelectorAll('.ask-aria-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof window.AR4_askAriaAbout !== 'function') return;
        const title = btn.dataset.askAriaTitle || '';
        const contextStr = `Publicación de la comunidad: "${title}" (${btn.dataset.askAriaCategory || ''}). Contenido: ${btn.dataset.askAriaBody || ''}`;
        window.AR4_askAriaAbout(`Ayúdame a entender esta publicación: "${title}"`, contextStr);
      });
    });

    feedEl.querySelectorAll('.tech-analysis-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openTechAnalysisModal(btn.dataset.techSymbol, btn.dataset.techTitle || '', btn.dataset.techBody || '', btn.dataset.techCategory || '');
      });
    });

    feedEl.querySelectorAll('.dm-start-btn').forEach((btn) => {
      btn.addEventListener('click', () => window.AR4_startDM(btn.dataset.dmId, btn.dataset.dmUsername));
    });

    feedEl.querySelectorAll('.community-vote-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!requireAuthOrPrompt()) return;
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
        if (!requireAuthOrPrompt()) return;
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

    feedEl.querySelectorAll('.comments-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const postId = btn.dataset.commentsToggle;
        const section = document.getElementById('commentsFor-' + postId);
        if (!section) return;
        const opening = section.hidden;
        section.hidden = !opening;
        if (opening && !section.dataset.loaded) {
          section.dataset.loaded = '1';
          if (window.AR4_initComments) window.AR4_initComments('commentsFor-' + postId, 'post', postId);
        }
      });
    });
  }

  function chatMsgHTML(msg, author) {
    const imgHTML = msg.image_url ? `<img class="discord-msg-image" src="${escapeHtml(msg.image_url)}" alt="Imagen adjunta" loading="lazy" onclick="window.open(this.src,'_blank')">` : '';
    const textHTML = msg.body ? `<p>${escapeHtml(msg.body)}</p>` : '';
    return `
      <div class="discord-msg">
        <a href="perfil.html?u=${encodeURIComponent(author.username)}">${avatarHTML(author, 'discord-msg-avatar')}</a>
        <div class="discord-msg-body">
          <div class="discord-msg-head"><a href="perfil.html?u=${encodeURIComponent(author.username)}" class="perfil-link-name"><strong>${escapeHtml(author.username)}</strong></a>${window.AR4_agentBadgeHTML ? AR4_agentBadgeHTML(author.username) : ''}${rankBadgeHTML(author.rank)}<span class="discord-msg-time">${timeAgo(msg.created_at)}</span></div>
          ${textHTML}
          ${imgHTML}
        </div>
      </div>
    `;
  }

  function stopLiveUpdates() {
    if (chatChannel) { sb.removeChannel(chatChannel); chatChannel = null; }
    if (elitePollTimer) { clearInterval(elitePollTimer); elitePollTimer = null; }
    if (dmPollTimer) { clearInterval(dmPollTimer); dmPollTimer = null; }
    if (dmListPollTimer) { clearInterval(dmListPollTimer); dmListPollTimer = null; }
  }

  async function loadEliteRoom(msgsEl) {
    try {
      const data = await callFunctionGET('community-chat-elite-messages');
      // Sin mensajes nuevos = sin redibujo: el poll de 6 s robaba el scroll al
      // que estaba leyendo mensajes anteriores (mismo arreglo que en los DM).
      const huella = data.messages.map((m) => m.id).join('|');
      if (msgsEl.dataset.huella === huella) return;
      const primeraCarga = !msgsEl.dataset.huella;
      msgsEl.dataset.huella = huella;
      const estabaAbajo = primeraCarga || (msgsEl.scrollHeight - msgsEl.scrollTop - msgsEl.clientHeight < 60);
      const rows = data.messages.map((m) => {
        const author = data.profiles[m.profile_id] || { username: 'Usuario', rank: 'elite' };
        return chatMsgHTML(m, author);
      });
      msgsEl.innerHTML = rows.join('') || '<p class="footer-text">Todavía no hay mensajes en Elite Traders. ¡Empieza la conversación!</p>';
      if (estabaAbajo) msgsEl.scrollTop = msgsEl.scrollHeight;
    } catch (e) {
      msgsEl.innerHTML = `<p class="footer-text">${escapeHtml(e.message)}</p>`;
    }
  }

  async function loadChatRoom(roomId) {
    currentRoom = roomId;
    const msgsEl = document.getElementById('communityChatMessages');
    if (!msgsEl) return;
    msgsEl.innerHTML = '<p class="footer-text">Cargando chat...</p>';
    // Mismo contenedor para todas las salas: sin esto, volver a Elite con la
    // huella vieja intacta dejaría el "Cargando chat..." para siempre.
    delete msgsEl.dataset.huella;

    document.querySelectorAll('.discord-room-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.room === roomId);
    });

    const meta = ROOM_META[roomId] || { icon: '💬', name: roomId, desc: '' };
    const headerEl = document.getElementById('communityChatHeader');
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
    const sendBtn = document.getElementById('communityChatSendBtn');
    const input = document.getElementById('communityChatInput');
    const attachBtn = document.getElementById('communityChatAttachBtn');
    const fileInput = document.getElementById('communityChatImageInput');

    const canAttach = RANK_ORDER[myEffectiveRank()] >= RANK_ORDER.vip;
    if (!canAttach) {
      attachBtn.disabled = true;
      attachBtn.title = 'Enviar imágenes requiere rango VIP o superior';
    }
    attachBtn.addEventListener('click', () => { if (canAttach) fileInput.click(); });
    fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) attachBtn.textContent = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><rect x='3' y='4' width='18' height='16' rx='2'/><circle cx='9' cy='10' r='1.6'/><path d='M4 19l6-6 4 4 3-3 3 3'/></svg>";
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
        attachBtn.textContent = "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.85 1.85 0 0 1-2.6-2.6l8.3-8.3'/></svg>";
        if (currentRoom === 'elite') {
          const eliteMsgs = document.getElementById('communityChatMessages');
          await loadEliteRoom(eliteMsgs);
          // Tras enviar, bajar siempre a ver el propio mensaje.
          if (eliteMsgs) eliteMsgs.scrollTop = eliteMsgs.scrollHeight;
        }
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

  function switchDashboardView(view, category) {
    const mainView = document.getElementById('communityMainView');
    if (!mainView) return;
    if (category !== undefined) activeCategoryFilter = category || null;
    document.querySelectorAll('.community-tab-btn').forEach((b) => {
      const matches = b.dataset.view === view && (view !== 'foro' || (b.dataset.category || '') === (activeCategoryFilter || ''));
      b.classList.toggle('active', matches);
    });
    stopLiveUpdates();
    if (view === 'mensajes' && myProfile) {
      mainView.innerHTML = mensajesPanelHTML();
      loadMensajesList();
    } else if (view === 'chat' && myProfile) {
      mainView.innerHTML = chatPanelHTML();
      wireChatTabs();
      loadChatRoom(currentRoom);
    } else if (view === 'ranking') {
      mainView.innerHTML = rankingPanelHTML();
      loadLeaderboard();
    } else if (view === 'dna' && myProfile) {
      mainView.innerHTML = tradingDnaPanelHTML();
      loadTradingDna();
    } else if (view === 'resumen') {
      if (myProfile) {
        mainView.innerHTML = resumenPanelHTML();
        loadResumen();
      } else {
        mainView.innerHTML = guestResumenPanelHTML();
        loadGuestResumen();
      }
    } else if (view === 'paraTi' && myProfile) {
      feedSortMode = 'paraTi';
      mainView.innerHTML = foroPanelHTML();
      wirePostForm();
      loadFeed();
    } else if (view === 'paraTi') {
      showJoinPrompt();
      feedSortMode = 'reciente';
      mainView.innerHTML = foroPanelHTML();
      wirePostForm();
      loadFeed();
    } else {
      feedSortMode = 'reciente';
      mainView.innerHTML = foroPanelHTML();
      wirePostForm();
      loadFeed();
    }
  }

  function wireDashboardTabs() {
    document.querySelectorAll('.community-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchDashboardView(btn.dataset.view, btn.dataset.view === 'foro' ? (btn.dataset.category || '') : null));
    });
  }

  function wireMentionAutocomplete(textareaEl, dropdownEl) {
    if (!textareaEl || !dropdownEl) return;
    let activeMatches = [];
    async function checkMention() {
      const cursor = textareaEl.selectionStart;
      const uptoCursor = textareaEl.value.slice(0, cursor);
      const match = uptoCursor.match(/@([a-zA-Z0-9_]{1,24})$/);
      if (!match) { dropdownEl.hidden = true; return; }
      const query = match[1];
      const { data } = await sb.from('profiles').select('username,avatar_color').ilike('username', query + '%').limit(5);
      activeMatches = data || [];
      if (!activeMatches.length) { dropdownEl.hidden = true; return; }
      dropdownEl.innerHTML = activeMatches.map((p) => `<div class="mention-suggestion" data-username="${escapeHtml(p.username)}">@${escapeHtml(p.username)}</div>`).join('');
      dropdownEl.hidden = false;
      dropdownEl.querySelectorAll('.mention-suggestion').forEach((row) => {
        row.addEventListener('click', () => {
          const username = row.dataset.username;
          const before = textareaEl.value.slice(0, cursor).replace(/@([a-zA-Z0-9_]{1,24})$/, '@' + username + ' ');
          const after = textareaEl.value.slice(cursor);
          textareaEl.value = before + after;
          textareaEl.focus();
          dropdownEl.hidden = true;
        });
      });
    }
    textareaEl.addEventListener('input', checkMention);
    textareaEl.addEventListener('blur', () => setTimeout(() => { dropdownEl.hidden = true; }, 150));
  }

  function wirePostForm() {
    wireMentionAutocomplete(document.getElementById('postBody'), document.getElementById('postBodyMentionDropdown'));
    let selectedSentiment = null;
    const sentimentPicker = document.getElementById('sentimentPicker');
    if (sentimentPicker) {
      sentimentPicker.querySelectorAll('.sentiment-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const alreadySelected = btn.classList.contains('selected');
          sentimentPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          selectedSentiment = alreadySelected ? null : btn.dataset.sentiment;
          if (selectedSentiment) btn.classList.add('selected');
        });
      });
    }

    const addPollCheckbox = document.getElementById('postAddPoll');
    const pollFields = document.getElementById('postPollFields');
    if (addPollCheckbox && pollFields) {
      addPollCheckbox.addEventListener('change', () => { pollFields.hidden = !addPollCheckbox.checked; });
    }

    // ===== Gráficos del compositor: propio (Lightweight, con captura) + TradingView (dibujo) =====
    const postSymbolInput = document.getElementById('postSymbol');
    const postCategorySelect = document.getElementById('postCategory');
    const symDropdown = document.getElementById('postSymbolDropdown');
    const lwMount = document.getElementById('postLwChart');
    const tvMount = document.getElementById('postChartStudioMount');
    const lwWrap = document.getElementById('postLwWrap');
    const tvWrap = document.getElementById('postTvWrap');

    function inferCategoryFromSymbol(raw) {
      const t = (raw || '').toUpperCase().replace(/\s+/g, '');
      if (!t) return null;
      if (/BTC|ETH|SOL|XRP|DOGE|BNB|ADA|LTC|CRIPTO|USDT|BITCOIN|ETHEREUM/.test(t)) return 'Criptomonedas';
      if (/XAU|\bORO\b|GOLD|XAG|PLATA|SILVER|OIL|PETRO|WTI|BRENT|\bGAS\b|COBRE|COPPER|USOIL|UKOIL/.test(t)) return 'Materias Primas';
      if (/AAPL|TSLA|NVDA|AMZN|MSFT|META|GOOG|NYSE:|NASDAQ:[A-Z]|APPLE|TESLA|NVIDIA|AMAZON|MICROSOFT|ACCION/.test(t)) return 'Acciones';
      if (/NAS100|NASDAQ|NDX|US100|SPX|SP500|S&P|US500|US30|DOW|DJI|DAX|GER40|FTSE|UK100|IBEX|NIKKEI|INDIC/.test(t)) return 'Índices';
      if (/USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD|MXN|BRL|COP|CLP|PEN|ARS|FOREX|DIVISA/.test(t)) return 'Forex';
      return null;
    }
    function syncCategoryFromSymbol() {
      if (!postSymbolInput || !postCategorySelect) return;
      const cat = inferCategoryFromSymbol(postSymbolInput.value);
      if (cat && CATEGORY_LABELS.indexOf(cat) >= 0) postCategorySelect.value = cat;
    }

    // --- Gráfico propio (Lightweight Charts) con captura automática ---
    let lwChart = null, lwSeries = null, lwLoadedYahoo = null;
    function lwResize() { if (lwChart && lwMount) lwChart.applyOptions({ width: lwMount.clientWidth }); }
    async function buildLwChart() {
      if (!lwMount || typeof LightweightCharts === 'undefined') return;
      const ysym = resolveYahooSymbol(postSymbolInput.value) || 'EURUSD=X';
      if (lwLoadedYahoo === ysym && lwChart) return;
      lwLoadedYahoo = ysym;
      if (!lwChart) {
        lwChart = LightweightCharts.createChart(lwMount, {
          height: 340,
          layout: { background: { color: '#0b1220' }, textColor: '#c9d2e3', fontFamily: 'inherit' },
          grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
          rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
          timeScale: { borderColor: 'rgba(255,255,255,0.1)', timeVisible: false },
          crosshair: { mode: 0 }
        });
        lwSeries = lwChart.addCandlestickSeries({ upColor: '#2ecc71', downColor: '#e13a4b', borderVisible: false, wickUpColor: '#2ecc71', wickDownColor: '#e13a4b' });
        window.addEventListener('resize', lwResize);
      }
      try {
        const r = await fetch('/.netlify/functions/market-candles?symbol=' + encodeURIComponent(ysym) + '&interval=1d&range=1y');
        const d = await r.json();
        if (d && d.success && d.candles && d.candles.length) {
          lwSeries.setData(d.candles);
          lwChart.timeScale().fitContent();
        }
      } catch (e) {}
      lwResize();
    }

    // --- Gráfico TradingView (solo al abrir para dibujar) ---
    let tvLoadedSymbol = null;
    function buildTvChart() {
      if (!tvMount) return;
      const sym = resolvePostSymbol(postSymbolInput.value) || 'FX:EURUSD';
      if (tvLoadedSymbol === sym && tvMount.querySelector('iframe')) return;
      tvLoadedSymbol = sym;
      tvMount.innerHTML = '<div class="tradingview-widget-container" style="height:100%;width:100%;"><div class="tradingview-widget-container__widget" style="height:100%;width:100%;"></div></div>';
      const s = document.createElement('script'); s.type = 'text/javascript'; s.async = true;
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      s.text = JSON.stringify({ autosize: true, symbol: sym, interval: '60', timezone: 'America/Lima', theme: 'dark', style: '1', locale: 'es', hide_side_toolbar: false, allow_symbol_change: true, save_image: true, studies: ['STD;EMA'], support_host: 'https://www.tradingview.com' });
      tvMount.querySelector('.tradingview-widget-container').appendChild(s);
    }

    function applyInstrument(sym, cat) {
      if (!postSymbolInput) return;
      postSymbolInput.value = sym;
      if (cat && postCategorySelect && CATEGORY_LABELS.indexOf(cat) >= 0) postCategorySelect.value = cat;
      else syncCategoryFromSymbol();
      buildTvChart();
    }

    let postRemote = [];
    let postRemoteTimer = null;
    const QT_CAT = { CURRENCY: 'Forex', CRYPTOCURRENCY: 'Criptomonedas', EQUITY: 'Acciones', ETF: 'Acciones', INDEX: 'Índices', FUTURE: 'Materias Primas' };
    function renderSymbolDropdown(query) {
      if (!symDropdown) return;
      const q = (query || '').trim().toLowerCase();
      let list = POST_INSTRUMENTS;
      if (q) list = POST_INSTRUMENTS.filter((i) => i.l.toLowerCase().includes(q) || i.s.toLowerCase().includes(q) || i.c.toLowerCase().includes(q));
      list = list.slice(0, 12);
      if (!list.length && !postRemote.length) { symDropdown.hidden = true; return; }
      const localHTML = list.map((i) =>
        '<div class="post-symbol-item" data-sym="' + i.s + '" data-cat="' + i.c + '"><span>' + i.l + '</span><span class="post-symbol-cat">' + i.c + '</span></div>'
      ).join('');
      const remoteHTML = postRemote.length
        ? '<div class="rs-sugg-divider">Mercado global — miles de símbolos</div>' + postRemote.map((r) =>
            '<div class="post-symbol-item" data-sym="' + r.symbol + '" data-cat="' + (QT_CAT[r.type] || '') + '"><span><b style="font-family:var(--mono);color:var(--gold-bright);">' + r.symbol + '</b> ' + (r.name || '').replace(/</g, '&lt;') + '</span><span class="post-symbol-cat">' + r.typeLabel + '</span></div>'
          ).join('')
        : '';
      symDropdown.innerHTML = localHTML + remoteHTML;
      symDropdown.hidden = false;
      symDropdown.querySelectorAll('.post-symbol-item').forEach((it) => {
        it.addEventListener('mousedown', (e) => { e.preventDefault(); applyInstrument(it.dataset.sym, it.dataset.cat); symDropdown.hidden = true; postRemote = []; });
      });
    }
    function fetchRemoteSymbols(q) {
      if (postRemoteTimer) clearTimeout(postRemoteTimer);
      if (!q || q.length < 2) { postRemote = []; return; }
      postRemoteTimer = setTimeout(async () => {
        try {
          const res = await fetch('/.netlify/functions/symbol-search?q=' + encodeURIComponent(q));
          const data = await res.json();
          if (postSymbolInput.value.trim() !== q) return;
          postRemote = ((data && data.results) || []).slice(0, 6);
          renderSymbolDropdown(q);
        } catch (e) { /* solo lista local */ }
      }, 300);
    }

    if (postSymbolInput) {
      buildTvChart(); // el gráfico TradingView aparece de inmediato, sincronizado con el instrumento
      const chipsWrap = document.getElementById('postChartChips');
      if (chipsWrap) {
        chipsWrap.querySelectorAll('.chart-chip').forEach((chip) => {
          chip.addEventListener('click', () => {
            chipsWrap.querySelectorAll('.chart-chip').forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            applyInstrument(chip.dataset.sym, chip.dataset.cat);
          });
        });
      }
      let chartDebounce = null;
      postSymbolInput.addEventListener('focus', () => renderSymbolDropdown(postSymbolInput.value));
      postSymbolInput.addEventListener('input', () => {
        renderSymbolDropdown(postSymbolInput.value);
        fetchRemoteSymbols(postSymbolInput.value.trim());
        clearTimeout(chartDebounce);
        chartDebounce = setTimeout(() => { syncCategoryFromSymbol(); buildTvChart(); }, 700);
      });
      postSymbolInput.addEventListener('change', () => { syncCategoryFromSymbol(); buildTvChart(); });
      postSymbolInput.addEventListener('blur', () => { setTimeout(() => { if (symDropdown) symDropdown.hidden = true; }, 150); });

    }

    let selectedIdeaDirection = null;
    const isIdeaCheckbox = document.getElementById('postIsIdea');
    const ideaFields = document.getElementById('postIdeaFields');
    const ideaDirectionPicker = document.getElementById('ideaDirectionPicker');
    const ideaEntryInput = document.getElementById('ideaEntry');
    const ideaSlInput = document.getElementById('ideaSl');
    const ideaTpInput = document.getElementById('ideaTp');
    const ideaRrPreview = document.getElementById('ideaRrPreview');
    if (isIdeaCheckbox && ideaFields) {
      isIdeaCheckbox.addEventListener('change', () => { ideaFields.hidden = !isIdeaCheckbox.checked; });
    }
    if (ideaDirectionPicker) {
      ideaDirectionPicker.querySelectorAll('.sentiment-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          ideaDirectionPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          selectedIdeaDirection = btn.dataset.direction;
          btn.classList.add('selected');
          updateRrPreview();
        });
      });
    }
    function updateRrPreview() {
      if (!ideaRrPreview) return;
      const entry = Number(ideaEntryInput.value);
      const sl = Number(ideaSlInput.value);
      const tp = Number(ideaTpInput.value);
      if (!entry || !sl || !tp || !selectedIdeaDirection) { ideaRrPreview.textContent = ''; return; }
      const risk = Math.abs(entry - sl);
      const reward = Math.abs(tp - entry);
      if (!risk) { ideaRrPreview.textContent = ''; return; }
      const validLong = selectedIdeaDirection === 'long' && sl < entry && tp > entry;
      const validShort = selectedIdeaDirection === 'short' && sl > entry && tp < entry;
      if (!validLong && !validShort) {
        ideaRrPreview.textContent = 'Revisa los niveles: no son coherentes con la dirección elegida.';
        return;
      }
      ideaRrPreview.textContent = 'Relación riesgo/beneficio: 1:' + (reward / risk).toFixed(2);
    }
    if (ideaEntryInput) [ideaEntryInput, ideaSlInput, ideaTpInput].forEach((el) => el.addEventListener('input', updateRrPreview));

    const clearTagFilterBtn = document.getElementById('clearTagFilterBtn');
    if (clearTagFilterBtn) {
      clearTagFilterBtn.addEventListener('click', () => { activeTagFilter = null; switchDashboardView('foro'); });
    }

    const clearCategoryFilterBtn = document.getElementById('clearCategoryFilterBtn');
    if (clearCategoryFilterBtn) {
      clearCategoryFilterBtn.addEventListener('click', () => switchDashboardView('foro', ''));
    }

    const bookmarksToggleBtn = document.getElementById('bookmarksToggleBtn');
    if (bookmarksToggleBtn) {
      bookmarksToggleBtn.addEventListener('click', () => {
        if (!requireAuthOrPrompt()) return;
        showBookmarksOnly = !showBookmarksOnly;
        bookmarksToggleBtn.classList.toggle('active', showBookmarksOnly);
        bookmarksToggleBtn.textContent = showBookmarksOnly ? 'Ver todas' : 'Ver guardados';
        loadFeed();
      });
    }

    let pendingPostMediaFile = null;
    const postAttachBtn = document.getElementById('postAttachBtn');
    const postMediaInput = document.getElementById('postMediaInput');
    if (postAttachBtn && postMediaInput) {
      postAttachBtn.addEventListener('click', () => {
        if (!requireAuthOrPrompt()) return;
        postMediaInput.click();
      });
      postMediaInput.addEventListener('change', () => {
        pendingPostMediaFile = postMediaInput.files[0] || null;
        document.getElementById('postMediaName').textContent = pendingPostMediaFile ? pendingPostMediaFile.name : '';
      });
    }

    const postSubmitBtn = document.getElementById('postSubmit');
    if (!postSubmitBtn) return;
    postSubmitBtn.addEventListener('click', async () => {
      if (!requireAuthOrPrompt()) return;
      const btn = document.getElementById('postSubmit');
      const msgEl = document.getElementById('postMsg');
      const title = document.getElementById('postTitle').value.trim();
      const body = document.getElementById('postBody').value.trim();
      const category = document.getElementById('postCategory').value;
      const symbol = document.getElementById('postSymbol').value.trim();

      let pollOptions = null;
      if (addPollCheckbox && addPollCheckbox.checked) {
        pollOptions = [0, 1, 2, 3]
          .map((i) => document.getElementById('postPollOption' + i).value.trim())
          .filter(Boolean);
        if (pollOptions.length < 2) {
          msgEl.textContent = 'La encuesta necesita al menos 2 opciones.';
          msgEl.className = 'community-form-msg error';
          return;
        }
      }

      let ideaPayload = {};
      if (isIdeaCheckbox && isIdeaCheckbox.checked) {
        if (!symbol || !selectedIdeaDirection || !ideaEntryInput.value || !ideaSlInput.value || !ideaTpInput.value) {
          msgEl.textContent = 'Completa instrumento, dirección, entrada, stop loss y take profit para la idea estructurada.';
          msgEl.className = 'community-form-msg error';
          return;
        }
        ideaPayload = {
          isStructuredIdea: true,
          ideaDirection: selectedIdeaDirection,
          ideaEntry: Number(ideaEntryInput.value),
          ideaSl: Number(ideaSlInput.value),
          ideaTp: Number(ideaTpInput.value),
          ideaTimeframe: document.getElementById('ideaTimeframe').value
        };
      }

      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        let mediaBase64 = null;
        let mediaType = null;
        if (pendingPostMediaFile) {
          if (pendingPostMediaFile.size > 8 * 1024 * 1024) throw new Error('El archivo no puede pesar más de 8 MB.');
          mediaBase64 = await fileToBase64(pendingPostMediaFile);
          mediaType = pendingPostMediaFile.type;
        }
        await callFunction('community-post', { title, body, category, symbol, pollOptions, sentiment: selectedSentiment, mediaBase64, mediaType, ...ideaPayload });
        document.getElementById('postTitle').value = '';
        document.getElementById('postBody').value = '';
        document.getElementById('postSymbol').value = '';
        pendingPostMediaFile = null;
        if (postMediaInput) postMediaInput.value = '';
        const postMediaNameEl = document.getElementById('postMediaName');
        if (postMediaNameEl) postMediaNameEl.textContent = '';
        if (sentimentPicker) {
          sentimentPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          selectedSentiment = null;
        }
        if (addPollCheckbox) {
          addPollCheckbox.checked = false;
          pollFields.hidden = true;
          [0, 1, 2, 3].forEach((i) => { document.getElementById('postPollOption' + i).value = ''; });
        }
        if (isIdeaCheckbox) {
          isIdeaCheckbox.checked = false;
          ideaFields.hidden = true;
          selectedIdeaDirection = null;
          if (ideaDirectionPicker) ideaDirectionPicker.querySelectorAll('.sentiment-option').forEach((b) => b.classList.remove('selected'));
          [ideaEntryInput, ideaSlInput, ideaTpInput].forEach((el) => { el.value = ''; });
          if (ideaRrPreview) ideaRrPreview.textContent = '';
        }
        msgEl.textContent = '¡Publicado! Ganaste 10 puntos.';
        msgEl.className = 'community-form-msg success';
        myProfile.points += 10;
        document.getElementById('communityPointsDisplay').innerHTML = rewardProgressHTML(myProfile.points);
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
        document.getElementById('communityPointsDisplay').innerHTML = rewardProgressHTML(myProfile.points);
        msgEl.textContent = '¡Listo! Activamos tu mes de Premium gratis.';
        msgEl.className = 'community-form-msg success';
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
      }
    });
  }

  // Donación de puntos, ahora dentro del panel de "Editar perfil" (para todos los usuarios).
  function wireDonateForm() {
    const submitBtn = document.getElementById('donateSubmitBtn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', async () => {
      const msgEl = document.getElementById('donateMsg');
      const toUsername = document.getElementById('donateUsername').value.trim();
      const amount = parseInt(document.getElementById('donateAmount').value, 10);
      if (msgEl) { msgEl.textContent = ''; msgEl.className = 'community-form-msg'; }
      submitBtn.disabled = true;
      try {
        const data = await callFunction('community-donate-points', { toUsername, amount });
        myProfile.points = data.points;
        const pd = document.getElementById('communityPointsDisplay');
        if (pd) pd.innerHTML = rewardProgressHTML(myProfile.points);
        if (msgEl) {
          msgEl.textContent = `¡Listo! Le donaste ${amount} puntos a ${data.recipientUsername}. Te quedan ${data.points} pts.`;
          msgEl.className = 'community-form-msg success';
        }
        document.getElementById('donateUsername').value = '';
        document.getElementById('donateAmount').value = '';
      } catch (e) {
        if (msgEl) { msgEl.textContent = e.message; msgEl.className = 'community-form-msg error'; }
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  function missionRowHTML(key, mission) {
    const meta = MISSION_META[key];
    const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
    const done = mission.progress >= mission.target;
    let actionHTML;
    if (mission.claimed) {
      actionHTML = '<span class="mission-done">✔ Reclamada</span>';
    } else if (done) {
      actionHTML = `<button class="btn btn-gold mission-claim-btn" data-mission="${key}">Reclamar +${mission.reward} pts</button>`;
    } else {
      actionHTML = `<span class="mission-progress-text">${mission.progress}/${mission.target}</span>`;
    }
    return `
      <div class="mission-row">
        <span class="mission-icon">${meta.icon}</span>
        <div class="mission-info">
          <strong>${meta.label}</strong>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  async function loadMissions() {
    const widget = document.getElementById('missionWidget');
    if (!widget) return;
    try {
      const data = await callFunctionGET('community-missions');
      widget.innerHTML = `
        <div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:1rem;" class="sec-h">${ICON.target} Misiones de hoy</h2></div>
        ${Object.keys(data.missions).map((key) => missionRowHTML(key, data.missions[key])).join('')}
      `;
      widget.querySelectorAll('.mission-claim-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await callFunction('community-claim-mission', { missionKey: btn.dataset.mission });
            myProfile.points = res.points;
            const pointsEl = document.getElementById('communityPointsDisplay');
            if (pointsEl) pointsEl.innerHTML = rewardProgressHTML(myProfile.points);
            loadMissions();
          } catch (e) {
            alert(e.message);
            btn.disabled = false;
          }
        });
      });
    } catch (e) {
      widget.innerHTML = '';
    }
  }

  function weeklyChallengeHTML(data) {
    const pct = Math.min(100, Math.round((data.progress / data.target) * 100));
    const done = data.progress >= data.target;
    let actionHTML;
    if (data.claimed) {
      actionHTML = '<span class="mission-done">✔ Reclamado</span>';
    } else if (done) {
      actionHTML = `<button class="btn btn-gold" id="weeklyClaimBtn">Reclamar +${data.reward} pts</button>`;
    } else {
      actionHTML = `<span class="mission-progress-text">${data.progress}/${data.target}</span>`;
    }
    return `
      <div class="section-head" style="margin-bottom:10px;"><h2 style="font-size:1rem;">Reto semanal</h2></div>
      <div class="mission-row">
        <span class="mission-icon"><svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-3px'><path d='M13 2 3 14h7l-1 8 10-12h-7l1-8z'/></svg></span>
        <div class="mission-info">
          <strong>${data.label}</strong>
          <div class="mission-progress-bar"><div class="mission-progress-fill" style="width:${pct}%;"></div></div>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  async function loadWeeklyChallenge() {
    const widget = document.getElementById('weeklyChallengeWidget');
    if (!widget) return;
    try {
      const data = await callFunctionGET('community-weekly-challenge');
      widget.innerHTML = weeklyChallengeHTML(data);
      const btn = document.getElementById('weeklyClaimBtn');
      if (btn) {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await callFunction('community-weekly-challenge', { action: 'claim' });
            myProfile.points += res.reward;
            const pointsEl = document.getElementById('communityPointsDisplay');
            if (pointsEl) pointsEl.innerHTML = rewardProgressHTML(myProfile.points);
            loadWeeklyChallenge();
          } catch (e) {
            alert(e.message);
            btn.disabled = false;
          }
        });
      }
    } catch (e) {
      widget.innerHTML = '';
    }
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

    const verifyBtn = document.getElementById('adminSetVerifiedBtn');
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        const msgEl = document.getElementById('adminVerifyMsg');
        const username = document.getElementById('adminVerifyUsername').value.trim();
        const verified = document.getElementById('adminVerifyValue').value === 'true';
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        verifyBtn.disabled = true;
        try {
          await callFunction('community-set-verified', { username, verified });
          msgEl.textContent = `Listo: ${username} ${verified ? 'ahora está verificado.' : 'ya no está verificado.'}`;
          msgEl.className = 'community-form-msg success';
          document.getElementById('adminVerifyUsername').value = '';
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
        } finally {
          verifyBtn.disabled = false;
        }
      });
    }

    // 3ª opción: donar/otorgar puntos a un usuario (no descuenta del administrador).
    const pointsBtn = document.getElementById('adminGivePointsBtn');
    if (pointsBtn) {
      pointsBtn.addEventListener('click', async () => {
        const msgEl = document.getElementById('adminPointsMsg');
        const username = document.getElementById('adminPointsUsername').value.trim();
        const amount = parseInt(document.getElementById('adminPointsAmount').value, 10);
        const action = document.getElementById('adminPointsAction').value;
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        pointsBtn.disabled = true;
        try {
          const data = await callFunction('community-admin-give-points', { username, amount, action });
          msgEl.textContent = action === 'remove'
            ? `Listo: le retiraste ${Math.abs(data.delta)} pts a ${data.username}. Ahora tiene ${data.points} pts.`
            : `Listo: le donaste ${data.delta} pts a ${data.username}. Ahora tiene ${data.points} pts.`;
          msgEl.className = 'community-form-msg success';
          document.getElementById('adminPointsUsername').value = '';
          document.getElementById('adminPointsAmount').value = '';
          delete profileCache[username];
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
        } finally {
          pointsBtn.disabled = false;
        }
      });
    }
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
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
          } catch (e) {
            msgEl.textContent = e.message;
            msgEl.className = 'community-form-msg error';
            btn.disabled = false;
          }
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Conectando con Mercado Pago...';
        try {
          const buyData = await callFunction('community-buy-avatar', { avatarId });
          if (buyData.alreadyOwned || buyData.free) {
            const setData = await callFunction('community-set-avatar', { avatarId });
            myProfile = setData.profile;
            shoppingAvatars = false;
            render();
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
            return;
          }
          const prefData = await callFunction('create-mercadopago-avatar-preference', { avatarId });
          window.location.href = prefData.initPoint;
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          btn.disabled = false;
          btn.textContent = 'Comprar';
        }
      });
    });

    const photoInput = document.getElementById('avatarPhotoInput');
    const photoBtn = document.getElementById('avatarPhotoBtn');
    const photoRemoveBtn = document.getElementById('avatarPhotoRemoveBtn');
    if (photoBtn) photoBtn.addEventListener('click', () => photoInput.click());
    if (photoInput) {
      photoInput.addEventListener('change', async () => {
        const file = photoInput.files[0];
        if (!file) return;
        const msgEl = document.getElementById('avatarShopMsg');
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        if (file.size > 4 * 1024 * 1024) {
          msgEl.textContent = 'La foto no puede pesar más de 4 MB.';
          msgEl.className = 'community-form-msg error';
          return;
        }
        photoBtn.disabled = true;
        photoBtn.textContent = 'Subiendo...';
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const data = await callFunction('avatar-upload-photo', { imageBase64: base64, mimeType: file.type });
          myProfile = data.profile;
          if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
          render();
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          photoBtn.disabled = false;
          photoBtn.textContent = 'Subir foto (máx. 4 MB)';
        }
      });
    }
    if (photoRemoveBtn) {
      photoRemoveBtn.addEventListener('click', async () => {
        photoRemoveBtn.disabled = true;
        try {
          const data = await callFunction('avatar-upload-photo', { remove: true });
          myProfile = data.profile;
          if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
          render();
        } catch (e) {
          photoRemoveBtn.disabled = false;
        }
      });
    }

    document.querySelectorAll('.catalog-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => { catalogTab = btn.dataset.rarity; render(); });
    });

    const loadMoreBtn = document.getElementById('catalogLoadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', async () => {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Cargando...';
        try { await fetchCatalogPage(catalogTab); } catch (e) { /* se ignora, la sección se queda como estaba */ }
        render();
      });
    }

    document.querySelectorAll('.catalog-action-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const catalogId = btn.dataset.catalogId;
        const owned = btn.dataset.owned === 'true';
        const method = btn.dataset.method;
        if (!owned && method === 'points') {
          const pts = btn.dataset.pricePoints || '';
          if (!confirm(`Este avatar se canjea con ${pts} puntos de tu comunidad. ¿Confirmar la compra?`)) return;
        }
        const msgEl = document.getElementById('avatarShopMsg');
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        btn.disabled = true;

        try {
          if (owned) {
            const data = await callFunction('avatar-catalog-equip', { catalogId });
            myProfile = data.profile;
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
            render();
            return;
          }
          if (method === 'points') {
            await callFunction('avatar-catalog-buy-points', { catalogId });
            const data = await callFunction('avatar-catalog-equip', { catalogId });
            myProfile = data.profile;
            if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
            render();
            return;
          }
          btn.textContent = 'Conectando con Mercado Pago...';
          const prefData = await callFunction('avatar-catalog-checkout', { catalogId });
          window.location.href = prefData.initPoint;
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          btn.disabled = false;
          btn.textContent = owned ? 'Equipar' : 'Comprar';
        }
      });
    });

    // Clic en cualquier parte de la tarjeta del avatar (imagen incluida) = misma acción que su botón.
    document.querySelectorAll('.avatar-shop-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const actionBtn = card.querySelector('.catalog-action-btn, .avatar-action-btn');
        if (actionBtn && !actionBtn.disabled) actionBtn.click();
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
      const socialLinks = {};
      Object.keys(SOCIAL_META).forEach((key) => {
        const input = document.getElementById('cpSocial_' + key);
        if (input) socialLinks[key] = input.value.trim();
      });
      btn.disabled = true;
      msgEl.textContent = '';
      msgEl.className = 'community-form-msg';
      try {
        const data = await callFunction('community-profile', { username, bio, tradingStyle, avatarColor: selectedAvatarColor, phone, socialLinks });
        myProfile = data.profile;
        editingProfile = false;
        await render();
        if (window.AR4_refreshNavProfile) window.AR4_refreshNavProfile();
      } catch (e) {
        msgEl.textContent = e.message;
        msgEl.className = 'community-form-msg error';
        btn.disabled = false;
      }
    });
  }

  let deepLinkApplied = false;
  function applyDeepLinkParams() {
    if (deepLinkApplied) return;
    deepLinkApplied = true;
    const p = new URLSearchParams(window.location.search);
    // Enlaces desde "Ver mi perfil": abrir directamente la edicion o los avatares.
    if (p.get('edit') === '1') editingProfile = true;
    else if (p.get('avatares') === '1' || p.get('avatars') === '1') shoppingAvatars = true;
  }

  async function render() {
    applyDeepLinkParams();
    const user = netlifyIdentity.currentUser();
    if (!user) {
      stopLiveUpdates();
      myProfile = null;
      currentRoom = 'forex';
      root.innerHTML = guestShellHTML();
      document.getElementById('guestSignupBtn').addEventListener('click', () => netlifyIdentity.open('signup'));
      document.getElementById('guestLoginBtn').addEventListener('click', () => netlifyIdentity.open('login'));
      const guestGoogleBtn = document.getElementById('guestGoogleBtn');
      if (guestGoogleBtn) guestGoogleBtn.addEventListener('click', () => { window.location.href = '/.netlify/identity/authorize?provider=google'; });
      wireDashboardTabs();
      // Enlace directo a una publicacion tambien funciona para invitados.
      switchDashboardView(new URLSearchParams(window.location.search).get('post') ? 'foro' : 'resumen', '');
      loadStoriesBar(document.getElementById('storiesBar'));
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
      wireDonateForm();
      return;
    }

    if (shoppingAvatars) {
      let owned = [];
      let catalogOwned = [];
      try {
        const data = await callFunctionGET('community-my-avatars');
        owned = data.owned || [];
      } catch (e) { /* owned queda vacío si falla */ }
      try {
        const data = await callFunctionGET('avatar-catalog-my-collection');
        catalogOwned = data.owned || [];
      } catch (e) { /* catalogOwned queda vacío si falla */ }
      if (!catalogCache[catalogTab].length) {
        try { await fetchCatalogPage(catalogTab); } catch (e) { /* la sección de colección queda vacía si falla */ }
      }
      root.innerHTML = avatarShopHTML(owned, catalogOwned);
      wireAvatarShop();
      return;
    }

    currentRoom = 'forex';
    root.innerHTML = dashboardShellHTML();
    wireRedeemButton();
    wireAdminPanel();
    wireDashboardTabs();
    loadNotifUnreadBadge();
    document.getElementById('communityEditProfileBtn').addEventListener('click', () => { editingProfile = true; render(); });
    document.getElementById('communityAvatarShopBtn').addEventListener('click', () => { shoppingAvatars = true; render(); });
    const bootstrapBtn = document.getElementById('bootstrapAdminBtn');
    if (bootstrapBtn) {
      bootstrapBtn.addEventListener('click', async () => {
        const msgEl = document.getElementById('bootstrapAdminMsg');
        bootstrapBtn.disabled = true;
        msgEl.textContent = '';
        msgEl.className = 'community-form-msg';
        try {
          await callFunction('bootstrap-admin', {});
          msgEl.textContent = '¡Listo! Cierra sesión y vuelve a iniciarla para que se active del todo.';
          msgEl.className = 'community-form-msg success';
        } catch (e) {
          msgEl.textContent = e.message;
          msgEl.className = 'community-form-msg error';
          bootstrapBtn.disabled = false;
        }
      });
    }
    loadFollowCounts();
    loadMissions();
    loadWeeklyChallenge();
    loadStoriesBar(document.getElementById('storiesBar'));

    // Enlace directo a una publicacion (desde un perfil, una notificacion o un
    // enlace compartido): hay que abrir el Foro, porque el scroll-al-post vive
    // en loadFeed(), que solo corre en esa vista. Sin esto, ?post= caia en la
    // vista Inicio y la publicacion nunca se abria.
    const sharedPostId = new URLSearchParams(window.location.search).get('post');
    if (sharedPostId) {
      switchDashboardView('foro', '');
    } else {
      loadResumen();
    }

    const dmUsername = new URLSearchParams(window.location.search).get('dm');
    if (dmUsername) {
      sb.from('profiles').select('id,username,avatar_color,avatar_url').ilike('username', dmUsername).single().then(({ data }) => {
        if (data && data.id !== myProfile.id) window.AR4_startDM(data.id, data.username);
      });
    }
  }

  const heroSignupBtn = document.getElementById('heroSignupBtn');
  if (heroSignupBtn) heroSignupBtn.addEventListener('click', (e) => { e.preventDefault(); netlifyIdentity.open('signup'); });

  function communitySidebarHTML() {
    return `
      <div class="glass-card sidebar-card">
        <h4>Conectados ahora</h4>
        <span class="sidebar-online-value" id="sidebarOnlineCount">—</span>
      </div>
      <div class="glass-card sidebar-card">
        <h4 class="sec-h">${ICON.trophy} Top analistas de la semana</h4>
        <div id="sidebarTopAnalysts"><p class="footer-text">Cargando...</p></div>
      </div>
      <div class="glass-card sidebar-card">
        <h4 class="sec-h">${ICON.calendar} Próximos eventos</h4>
        <div id="sidebarCalendar"></div>
      </div>
    `;
  }

  async function loadSidebar() {
    const el = document.getElementById('communitySidebar');
    if (!el) return;
    el.innerHTML = communitySidebarHTML();

    const onlineEl = document.getElementById('sidebarOnlineCount');
    if (onlineEl) onlineEl.textContent = String(presenceCount + agentesOnline);
    document.addEventListener('ar4-presence-update', () => {
      if (onlineEl) onlineEl.textContent = String(presenceCount + agentesOnline);
    });

    const topEl = document.getElementById('sidebarTopAnalysts');
    if (topEl) {
      try {
        const data = await callFunctionGETPublic('community-leaderboard');
        const source = (data.weekly && data.weekly.length) ? data.weekly.map((p) => ({ ...p, points: p.weeklyPoints })) : data.allTime;
        topEl.innerHTML = leaderboardListHTML((source || []).slice(0, 5));
      } catch (e) {
        topEl.innerHTML = '<p class="footer-text">Todavía no hay datos suficientes.</p>';
      }
    }

    const calEl = document.getElementById('sidebarCalendar');
    if (calEl) {
      if (window.AR4ECAL && window.AR4ECAL.renderEmbed) {
        calEl.innerHTML = '<div class="ar4-ecal-embed"></div>';
        window.AR4ECAL.renderEmbed(calEl.querySelector('.ar4-ecal-embed'), { mini: true, head: false, limit: 6, impact: 'high' });
      } else {
        calEl.innerHTML = '<p class="footer-text"><a href="calendario.html">Ver calendario económico →</a></p>';
      }
    }
  }

  netlifyIdentity.on('init', render);
  netlifyIdentity.on('login', () => { myProfile = null; render(); });
  netlifyIdentity.on('logout', () => { myProfile = null; render(); });
  render();
  initPresence();
  loadSidebar();
})();
