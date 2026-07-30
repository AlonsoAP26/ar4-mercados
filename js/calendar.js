// AR4 Mercados — Calendario económico propio, en español y con el tema del sitio.
// Datos en vivo vía /.netlify/functions/economic-calendar (feed de ForexFactory/faireconomy).
// Traduce TODOS los eventos y añade una explicación para que cualquiera pueda interpretarlos.
(function () {
  // rootEl = calendario completo (calendario.html). Puede no existir en otras páginas,
  // donde el módulo se usa solo para incrustar mini-calendarios (.ar4-ecal-embed).
  const rootEl = document.getElementById('ar4Calendar');

  // Banderas SVG en miniatura (18x12): los emojis de bandera no se dibujan en
  // Windows (salía solo "EU"/"GB") y la regla de la casa es SVG serio, no emoji.
  // Diseños simplificados pero reconocibles de cada bandera real.
  function flagSVG(inner) {
    return '<svg class="ecal-flag" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true">' + inner + '</svg>';
  }
  const FLAGS = {
    USD: flagSVG('<rect width="18" height="12" fill="#B22234"/><g fill="#fff"><rect y="1.7" width="18" height="1.7"/><rect y="5.1" width="18" height="1.7"/><rect y="8.5" width="18" height="1.7"/></g><rect width="8" height="6.8" fill="#3C3B6E"/><g fill="#fff"><circle cx="2" cy="1.7" r="0.55"/><circle cx="4.5" cy="1.7" r="0.55"/><circle cx="6.5" cy="1.7" r="0.55"/><circle cx="3.2" cy="3.4" r="0.55"/><circle cx="5.6" cy="3.4" r="0.55"/><circle cx="2" cy="5.1" r="0.55"/><circle cx="4.5" cy="5.1" r="0.55"/><circle cx="6.5" cy="5.1" r="0.55"/></g>'),
    EUR: flagSVG('<rect width="18" height="12" fill="#003399"/><g fill="#FFCC00"><circle cx="9" cy="2.4" r="0.65"/><circle cx="11.6" cy="3.4" r="0.65"/><circle cx="12.6" cy="6" r="0.65"/><circle cx="11.6" cy="8.6" r="0.65"/><circle cx="9" cy="9.6" r="0.65"/><circle cx="6.4" cy="8.6" r="0.65"/><circle cx="5.4" cy="6" r="0.65"/><circle cx="6.4" cy="3.4" r="0.65"/></g>'),
    GBP: flagSVG('<rect width="18" height="12" fill="#012169"/><path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" stroke-width="2.4"/><path d="M0 0 L18 12 M18 0 L0 12" stroke="#C8102E" stroke-width="1.1"/><path d="M9 0 V12 M0 6 H18" stroke="#fff" stroke-width="3.4"/><path d="M9 0 V12 M0 6 H18" stroke="#C8102E" stroke-width="1.9"/>'),
    JPY: flagSVG('<rect width="18" height="12" fill="#fff"/><rect width="18" height="12" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.5"/><circle cx="9" cy="6" r="3.4" fill="#BC002D"/>'),
    CAD: flagSVG('<rect width="18" height="12" fill="#fff"/><rect width="4.5" height="12" fill="#D80621"/><rect x="13.5" width="4.5" height="12" fill="#D80621"/><path d="M9 2.6 L9.8 4.4 L11.4 4 L10.6 5.8 L12 6.6 L9.9 7 L9.9 8.8 L9 8 L8.1 8.8 L8.1 7 L6 6.6 L7.4 5.8 L6.6 4 L8.2 4.4 Z" fill="#D80621"/>'),
    AUD: flagSVG('<rect width="18" height="12" fill="#00247D"/><g transform="scale(0.5)"><path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" stroke-width="2.4"/><path d="M9 0 V12 M0 6 H18" stroke="#fff" stroke-width="3.2"/><path d="M9 0 V12 M0 6 H18" stroke="#C8102E" stroke-width="1.8"/></g><g fill="#fff"><circle cx="13.5" cy="3" r="0.7"/><circle cx="15.5" cy="6" r="0.7"/><circle cx="12.5" cy="8.5" r="0.7"/><circle cx="4.5" cy="9.5" r="0.9"/></g>'),
    NZD: flagSVG('<rect width="18" height="12" fill="#00247D"/><g transform="scale(0.5)"><path d="M0 0 L18 12 M18 0 L0 12" stroke="#fff" stroke-width="2.4"/><path d="M9 0 V12 M0 6 H18" stroke="#fff" stroke-width="3.2"/><path d="M9 0 V12 M0 6 H18" stroke="#C8102E" stroke-width="1.8"/></g><g fill="#C8102E" stroke="#fff" stroke-width="0.4"><circle cx="13.5" cy="3.2" r="0.8"/><circle cx="15.3" cy="6" r="0.8"/><circle cx="12.8" cy="8.6" r="0.8"/></g>'),
    CHF: flagSVG('<rect width="18" height="12" fill="#D52B1E"/><rect x="7.6" y="2.6" width="2.8" height="6.8" fill="#fff"/><rect x="5.6" y="4.6" width="6.8" height="2.8" fill="#fff"/>'),
    CNY: flagSVG('<rect width="18" height="12" fill="#DE2910"/><path d="M3.4 1.8 L4.1 3.4 L5.8 3.5 L4.5 4.6 L4.9 6.2 L3.4 5.3 L1.9 6.2 L2.3 4.6 L1 3.5 L2.7 3.4 Z" fill="#FFDE00"/><g fill="#FFDE00"><circle cx="7" cy="1.6" r="0.5"/><circle cx="7.8" cy="3.2" r="0.5"/><circle cx="7.8" cy="5" r="0.5"/><circle cx="7" cy="6.6" r="0.5"/></g>'),
    MXN: flagSVG('<rect width="6" height="12" fill="#006847"/><rect x="6" width="6" height="12" fill="#fff"/><rect x="12" width="6" height="12" fill="#CE1126"/><circle cx="9" cy="6" r="1.6" fill="#8C6239" opacity="0.85"/>'),
    BRL: flagSVG('<rect width="18" height="12" fill="#009B3A"/><path d="M9 1.6 L16 6 L9 10.4 L2 6 Z" fill="#FEDF00"/><circle cx="9" cy="6" r="2.4" fill="#002776"/>'),
    SGD: flagSVG('<rect width="18" height="12" fill="#fff"/><rect width="18" height="6" fill="#EF3340"/><path d="M5.4 3 A2.1 2.1 0 1 0 5.4 3.01 Z" fill="#EF3340"/><circle cx="5.6" cy="3" r="1.7" fill="#fff"/><circle cx="4.6" cy="3" r="1.7" fill="#EF3340"/><g fill="#fff"><circle cx="7" cy="2" r="0.35"/><circle cx="8" cy="2.8" r="0.35"/><circle cx="7.6" cy="4" r="0.35"/><circle cx="6.4" cy="4" r="0.35"/><circle cx="6" cy="2.8" r="0.35"/></g>'),
    ZAR: flagSVG('<rect width="18" height="12" fill="#fff"/><rect width="18" height="4" fill="#E03C31"/><rect y="8" width="18" height="4" fill="#001489"/><path d="M0 0 L8 6 L0 12 Z" fill="#007749"/><path d="M0 1.5 L6 6 L0 10.5 Z" fill="#FFB81C"/><path d="M0 3 L4 6 L0 9 Z" fill="#000"/>'),
    SEK: flagSVG('<rect width="18" height="12" fill="#006AA7"/><rect x="5" width="2.4" height="12" fill="#FECC02"/><rect y="4.8" width="18" height="2.4" fill="#FECC02"/>'),
    NOK: flagSVG('<rect width="18" height="12" fill="#BA0C2F"/><rect x="4.6" width="3.2" height="12" fill="#fff"/><rect y="4.4" width="18" height="3.2" fill="#fff"/><rect x="5.4" width="1.6" height="12" fill="#00205B"/><rect y="5.2" width="18" height="1.6" fill="#00205B"/>'),
    HKD: flagSVG('<rect width="18" height="12" fill="#DE2910"/><g fill="#fff"><ellipse cx="9" cy="4.6" rx="0.9" ry="1.6"/><ellipse cx="10.9" cy="5.6" rx="0.9" ry="1.6" transform="rotate(72 10.9 5.6)"/><ellipse cx="10.2" cy="7.6" rx="0.9" ry="1.6" transform="rotate(144 10.2 7.6)"/><ellipse cx="7.8" cy="7.6" rx="0.9" ry="1.6" transform="rotate(216 7.8 7.6)"/><ellipse cx="7.1" cy="5.6" rx="0.9" ry="1.6" transform="rotate(288 7.1 5.6)"/></g>'),
    INR: flagSVG('<rect width="18" height="4" fill="#FF9933"/><rect y="4" width="18" height="4" fill="#fff"/><rect y="8" width="18" height="4" fill="#138808"/><circle cx="9" cy="6" r="1.5" fill="none" stroke="#000080" stroke-width="0.5"/><circle cx="9" cy="6" r="0.4" fill="#000080"/>'),
    KRW: flagSVG('<rect width="18" height="12" fill="#fff"/><rect width="18" height="12" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.5"/><path d="M9 3.4 A2.6 2.6 0 0 1 9 8.6 A1.3 1.3 0 0 1 9 6 A1.3 1.3 0 0 0 9 3.4" fill="#CD2E3A"/><path d="M9 8.6 A2.6 2.6 0 0 1 9 3.4 A1.3 1.3 0 0 1 9 6 A1.3 1.3 0 0 0 9 8.6" fill="#0047A0"/>'),
    TRY: flagSVG('<rect width="18" height="12" fill="#E30A17"/><circle cx="7.4" cy="6" r="2.6" fill="#fff"/><circle cx="8.1" cy="6" r="2.1" fill="#E30A17"/><path d="M11.5 6 L13.6 6.7 L12.3 5 L12.3 7 L13.6 5.3 Z" fill="#fff"/>'),
    RUB: flagSVG('<rect width="18" height="4" fill="#fff"/><rect y="4" width="18" height="4" fill="#0039A6"/><rect y="8" width="18" height="4" fill="#D52B1E"/><rect width="18" height="12" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.5"/>')
  };
  const FLAG_MUNDO = flagSVG('<rect width="18" height="12" fill="#0f1626"/><circle cx="9" cy="6" r="4" fill="none" stroke="#d4af37" stroke-width="0.8"/><path d="M5 6 H13 M9 2 C10.8 3.5 10.8 8.5 9 10 C7.2 8.5 7.2 3.5 9 2" fill="none" stroke="#d4af37" stroke-width="0.6"/>');

  const CURRENCY_LABEL = {
    USD: 'EE.UU.', EUR: 'Eurozona', GBP: 'R. Unido', JPY: 'Japón',
    CAD: 'Canadá', AUD: 'Australia', NZD: 'N. Zelanda', CHF: 'Suiza',
    CNY: 'China', MXN: 'México', BRL: 'Brasil', SGD: 'Singapur',
    ZAR: 'Sudáfrica', SEK: 'Suecia', NOK: 'Noruega', HKD: 'Hong Kong',
    INR: 'India', KRW: 'Corea', TRY: 'Turquía', RUB: 'Rusia'
  };

  const IMPACT_LABEL = { High: { es: 'Alto', cls: 'high' }, Medium: { es: 'Medio', cls: 'medium' }, Low: { es: 'Bajo', cls: 'low' }, Holiday: { es: 'Feriado', cls: 'low' } };

  // ---- Prefijos de país / idioma que aparecen al inicio de muchos eventos ----
  const PREFIX_COUNTRY = [
    [/^german\s+/i, 'Alemania'], [/^french\s+/i, 'Francia'], [/^italian\s+/i, 'Italia'],
    [/^spanish\s+/i, 'España'], [/^dutch\s+/i, 'Países Bajos'], [/^swiss\s+/i, 'Suiza'],
    [/^chinese\s+/i, 'China'], [/^japanese\s+/i, 'Japón'], [/^canadian\s+/i, 'Canadá'],
    [/^australian\s+/i, 'Australia'], [/^british\s+/i, 'R. Unido']
  ];

  // ---- Nombres completos de eventos recurrentes (los más específicos primero) ----
  const EVENT_MAP = [
    // Inflación
    [/final core cpi/i, 'IPC subyacente final (inflación sin alimentos ni energía)'],
    [/final cpi/i, 'IPC final — Índice de Precios al Consumidor'],
    [/core cpi/i, 'IPC subyacente (inflación sin alimentos ni energía)'],
    [/\bcpi\b/i, 'IPC — Índice de Precios al Consumidor (inflación)'],
    [/core ppi/i, 'IPP subyacente (precios al productor)'],
    [/\bppi\b/i, 'IPP — Índice de Precios al Productor'],
    [/core pce/i, 'PCE subyacente (inflación preferida de la Fed)'],
    [/\bpce\b/i, 'PCE — Gasto de Consumo Personal (inflación)'],
    [/\bhicp\b/i, 'IPCA — inflación armonizada de la Eurozona'],
    [/\bwpi\b/i, 'Índice de precios mayoristas'],
    [/\bfpi\b/i, 'Índice de precios de alimentos'],
    [/import prices/i, 'Precios de importación'],
    [/producer prices/i, 'Precios al productor'],
    [/gdp price index|gdp deflator/i, 'Deflactor del PIB (inflación de la economía)'],
    // Empleo
    [/adp non-?farm/i, 'Empleo privado ADP (adelanto del NFP)'],
    [/adp .*employment/i, 'Cambio de empleo ADP (sector privado)'],
    [/non-?farm employment change|non-?farm payrolls|\bnfp\b/i, 'Nóminas no agrícolas (NFP) — empleo de EE.UU.'],
    [/employment change/i, 'Variación del empleo'],
    [/unemployment rate/i, 'Tasa de desempleo'],
    [/unemployment claims|jobless claims/i, 'Solicitudes de subsidio por desempleo'],
    [/average hourly earnings/i, 'Salario promedio por hora'],
    [/average earnings/i, 'Salarios promedio'],
    [/claimant count/i, 'Variación de solicitantes de subsidio (R. Unido)'],
    [/labou?r cost|wage/i, 'Costes laborales / salarios'],
    [/participation rate/i, 'Tasa de participación laboral'],
    // Bancos centrales: tasas
    [/federal funds rate|interest rate decision|official cash rate|cash rate|main refinancing rate|bank rate|overnight rate|rate statement|deposit facility rate|policy rate/i, 'Decisión de tasa de interés'],
    [/rate decision/i, 'Decisión de tasa de interés'],
    // Bancos centrales: comunicación
    [/monetary policy report/i, 'Informe de política monetaria'],
    [/monetary policy statement|rate statement/i, 'Comunicado de política monetaria'],
    [/summary of (monetary policy )?(deliberations|discussions)/i, 'Resumen de las deliberaciones de política monetaria'],
    [/fomc statement/i, 'Comunicado del FOMC (Fed)'],
    [/fomc economic projections|economic projections|sep\b/i, 'Proyecciones económicas de la Fed'],
    [/(fomc|mpc)?\s*meeting minutes|monetary policy meeting minutes|policy meeting minutes|minutes/i, 'Minutas / actas de política monetaria'],
    [/press conference/i, 'Conferencia de prensa del banco central'],
    [/beige book/i, 'Libro Beige de la Fed (informe económico por regiones)'],
    [/inflation report|monetary policy hearing/i, 'Informe / comparecencia sobre política monetaria'],
    // Sentimiento / encuestas
    [/prelim uom consumer sentiment|revised uom consumer sentiment|uom consumer sentiment/i, 'Confianza del consumidor (U. de Michigan)'],
    [/prelim uom inflation|uom inflation expectations/i, 'Expectativas de inflación (U. de Michigan)'],
    [/mi inflation (gauge|expectations)/i, 'Expectativas de inflación (Melbourne Institute)'],
    [/inflation expectations/i, 'Expectativas de inflación'],
    [/philly fed|philadelphia fed/i, 'Índice manufacturero de la Fed de Filadelfia'],
    [/empire state/i, 'Índice manufacturero Empire State (Nueva York)'],
    [/richmond manufacturing/i, 'Índice manufacturero de la Fed de Richmond'],
    [/\bism\b.*(manufacturing|services|non-?manufacturing)/i, 'ISM — actividad económica (EE.UU.)'],
    [/ism manufacturing/i, 'ISM manufacturero (EE.UU.)'],
    [/ism (services|non-?manufacturing)/i, 'ISM de servicios (EE.UU.)'],
    [/manufacturing pmi/i, 'PMI manufacturero'],
    [/services pmi/i, 'PMI de servicios'],
    [/composite pmi/i, 'PMI compuesto'],
    [/construction pmi/i, 'PMI de construcción'],
    [/\bpmi\b/i, 'PMI — Índice de Gerentes de Compras'],
    [/nab business confidence/i, 'Confianza empresarial NAB (Australia)'],
    [/nzier business confidence/i, 'Confianza empresarial NZIER (N. Zelanda)'],
    [/westpac consumer sentiment/i, 'Confianza del consumidor Westpac (Australia)'],
    [/nfib small business|nfib/i, 'Optimismo de pequeñas empresas (NFIB, EE.UU.)'],
    [/nahb housing market/i, 'Índice del mercado de vivienda (NAHB, EE.UU.)'],
    [/businessnz (services|manufacturing)/i, 'Índice de actividad BusinessNZ (N. Zelanda)'],
    [/business confidence|business optimism|business climate|business index|business survey/i, 'Confianza empresarial'],
    [/consumer confidence|consumer sentiment|consumer climate/i, 'Confianza del consumidor'],
    [/economic sentiment|sentix|zew/i, 'Sentimiento económico'],
    [/tankan/i, 'Encuesta Tankan (Japón)'],
    [/ifo business climate/i, 'Clima empresarial IFO (Alemania)'],
    // Crecimiento / actividad
    [/\bgdp\b/i, 'PIB — Producto Interno Bruto'],
    [/revised industrial production/i, 'Producción industrial (revisada)'],
    [/industrial production/i, 'Producción industrial'],
    [/manufacturing production/i, 'Producción manufacturera'],
    [/manufacturing sales/i, 'Ventas del sector manufacturero'],
    [/construction output/i, 'Producción del sector construcción'],
    [/capacity utilization/i, 'Uso de la capacidad instalada'],
    [/core machinery orders/i, 'Pedidos de maquinaria subyacente (Japón)'],
    [/machinery orders/i, 'Pedidos de maquinaria'],
    [/factory orders/i, 'Pedidos de fábrica'],
    [/durable goods orders/i, 'Pedidos de bienes duraderos'],
    [/fixed asset investment/i, 'Inversión en activos fijos (China)'],
    [/business inventories/i, 'Inventarios empresariales'],
    [/tertiary industry activity/i, 'Actividad del sector servicios (Japón)'],
    [/index of services/i, 'Índice del sector servicios'],
    [/leading index|cb leading/i, 'Índice líder (anticipa la economía)'],
    // Consumo
    [/core retail sales/i, 'Ventas minoristas subyacentes'],
    [/retail sales/i, 'Ventas minoristas'],
    [/brc retail sales/i, 'Monitor de ventas minoristas BRC (R. Unido)'],
    [/redbook/i, 'Ventas minoristas Redbook (semanal, EE.UU.)'],
    [/wholesale sales/i, 'Ventas mayoristas'],
    [/wholesale inventories/i, 'Inventarios mayoristas'],
    [/personal spending/i, 'Gasto personal'],
    [/personal income/i, 'Ingreso personal'],
    // Vivienda
    [/building permits/i, 'Permisos de construcción'],
    [/housing starts/i, 'Inicios de construcción de viviendas'],
    [/pending home sales/i, 'Ventas pendientes de viviendas (EE.UU.)'],
    [/existing home sales/i, 'Ventas de viviendas usadas'],
    [/new home sales/i, 'Ventas de viviendas nuevas'],
    [/new home prices|house price|home prices/i, 'Precios de la vivienda'],
    [/construction spending/i, 'Gasto en construcción'],
    // Comercio exterior / capitales
    [/goods trade balance/i, 'Balanza comercial de bienes'],
    [/trade balance/i, 'Balanza comercial'],
    [/current account/i, 'Cuenta corriente (balanza de pagos)'],
    [/foreign securities purchases/i, 'Compras de valores extranjeros'],
    [/tic long-?term purchases|tic net long-?term/i, 'Flujos de capital de largo plazo (TIC, EE.UU.)'],
    [/visitor arrivals/i, 'Llegadas de visitantes (turismo)'],
    [/treasury currency report/i, 'Informe cambiario del Tesoro (EE.UU.)'],
    // Energía
    [/crude oil inventories/i, 'Inventarios de petróleo crudo (EE.UU.)'],
    [/natural gas storage/i, 'Inventarios de gas natural (EE.UU.)'],
    [/api weekly|api .*bulletin/i, 'Inventarios de petróleo API (adelanto semanal)'],
    [/gasoline inventories/i, 'Inventarios de gasolina'],
    // Dinero / crédito / fiscal
    [/m2 money supply|m3 money supply|money supply/i, 'Oferta monetaria'],
    [/new loans/i, 'Nuevos préstamos bancarios (China)'],
    [/private (sector )?credit|consumer credit/i, 'Crédito al sector privado'],
    [/federal budget balance|budget balance/i, 'Balance presupuestario del gobierno'],
    // Subastas de deuda
    [/(\d+)-?(y|yr|year)\s+bond auction/i, 'Subasta de bonos'],
    [/bond auction|note auction|bill auction|bund auction|gilt auction/i, 'Subasta de deuda pública'],
    // Otros / institucionales
    [/nbs press conference/i, 'Conferencia de la Oficina de Estadística (China)'],
    [/bank holiday/i, 'Feriado bancario'],
    [/\bboe\b|bank of england/i, 'Banco de Inglaterra'],
    [/\bboc\b|bank of canada/i, 'Banco de Canadá'],
    [/\becb\b/i, 'Banco Central Europeo'],
    [/\brba\b/i, 'Banco de la Reserva de Australia'],
    [/\brbnz\b/i, 'Banco de la Reserva de N. Zelanda'],
    [/\bsnb\b/i, 'Banco Nacional de Suiza'],
    [/\bboj\b|bank of japan/i, 'Banco de Japón']
  ];

  // ---- Clasificación por tipo para explicar cualquier evento a quien no sabe ----
  const CATEGORIES = [
    { key: 'tasas', re: /rate decision|rate statement|interest rate|cash rate|refinancing rate|bank rate|overnight rate|deposit facility|policy rate|funds rate/i, icon: 'BC', label: 'Tasas de interés', why: 'Decisión de tasas del banco central. Tasas más altas suelen fortalecer la moneda y presionar a bolsas, oro y cripto; tasas más bajas hacen lo contrario.' },
    { key: 'banco', re: /speaks|testifies|testimony|press conference|minutes|monetary policy|fomc|mpc|beige book|projections|hearing|deliberations|discussions/i, icon: 'BC', label: 'Banco central', why: 'Discurso, actas o informe de un banquero central. El mercado busca pistas sobre las próximas tasas: un tono "duro" (a favor de subirlas) suele fortalecer la moneda.' },
    { key: 'inflacion', re: /cpi|ppi|pce|hicp|inflation|price index|import prices|producer prices|wpi|fpi|deflator/i, icon: 'INF', label: 'Inflación', why: 'Mide cuánto suben los precios. Si sale por encima de lo previsto, aumentan las chances de subir tasas → suele fortalecer la moneda y pesar sobre bolsas y oro.' },
    { key: 'empleo', re: /employment|payroll|nfp|unemployment|jobless|claims|earnings|labou?r|wage|claimant|participation/i, icon: 'EMP', label: 'Empleo', why: 'Mide la salud del mercado laboral. Más empleo o menos desempleo de lo previsto = economía fuerte → suele fortalecer la moneda.' },
    { key: 'crecimiento', re: /\bgdp\b|growth/i, icon: 'PIB', label: 'Crecimiento (PIB)', why: 'Mide cuánto crece la economía. Un dato mejor al previsto suele apoyar a la moneda y a las bolsas de ese país.' },
    { key: 'consumo', re: /retail sales|personal spending|consumer spending|redbook|brc/i, icon: 'CON', label: 'Consumo', why: 'Mide cuánto gastan los consumidores, el principal motor de la economía. Ventas mayores a lo previsto suelen apoyar a la moneda.' },
    { key: 'industria', re: /industrial production|manufacturing|factory|capacity|machinery|durable goods|fixed asset|inventories|tertiary|index of services|construction output|leading index/i, icon: 'IND', label: 'Actividad e industria', why: 'Mide la producción y la actividad de las empresas. Mejor de lo previsto = economía más fuerte → suele apoyar a la moneda.' },
    { key: 'sentimiento', re: /pmi|ism|confidence|sentiment|optimism|climate|zew|sentix|tankan|nfib|nab|nzier|westpac|ifo|business index|business survey/i, icon: 'PMI', label: 'Sentimiento / encuestas', why: 'Encuesta sobre el optimismo de empresas o consumidores respecto a la economía. Más optimismo de lo previsto suele apoyar a la moneda.' },
    { key: 'vivienda', re: /housing|building permits|home sales|home prices|house price|construction spending|nahb|mortgage/i, icon: 'VIV', label: 'Vivienda', why: 'Mide el mercado inmobiliario, un termómetro del crédito y del consumo de las familias.' },
    { key: 'comercio', re: /trade balance|current account|foreign securities|tic |visitor arrivals|treasury currency/i, icon: 'COM', label: 'Comercio exterior', why: 'Mide el saldo entre lo que el país exporta e importa (o los flujos de capital). Un superávit mayor de lo previsto suele apoyar a la moneda.' },
    { key: 'energia', re: /crude oil|natural gas|gasoline|\bapi\b|oil inventories/i, icon: 'OIL', label: 'Energía', why: 'Mide los inventarios de energía. Más inventarios de lo previsto suele bajar el precio del petróleo o del gas (y viceversa).' },
    { key: 'deuda', re: /bond auction|note auction|bill auction|bund|gilt/i, icon: 'BON', label: 'Subasta de deuda', why: 'Subasta de bonos del gobierno. El interés que exige el mercado para prestarle al país refleja la confianza en su deuda.' },
    { key: 'dinero', re: /money supply|new loans|credit|budget balance/i, icon: 'FX', label: 'Dinero y crédito', why: 'Mide cuánto dinero, crédito o deuda pública circula en la economía.' },
    { key: 'feriado', re: /bank holiday|holiday/i, icon: 'FER', label: 'Feriado', why: 'Feriado bancario: hay menos liquidez y volumen, así que esa divisa puede moverse de forma más errática o quedar plana.' }
  ];
  const CAT_DEFAULT = { key: 'otros', icon: '', label: 'Indicador económico', why: 'Compara el dato "Actual" con la "Previsión": mejor de lo esperado suele apoyar a la moneda; peor de lo esperado suele debilitarla.' };

  function classify(title) {
    for (const c of CATEGORIES) { if (c.re.test(title)) return c; }
    return CAT_DEFAULT;
  }

  // ---- Sufijo de periodo (mensual/anual/trimestral) ----
  function periodWord(title) {
    if (/\bytd\/y\b/i.test(title)) return 'acumulado del año';
    if (/\b3m\/3m\b/i.test(title)) return '3 meses';
    if (/\bq\/y\b/i.test(title)) return 'trimestral, interanual';
    if (/\bm\/m\b|\bmom\b/i.test(title)) return 'mensual';
    if (/\by\/y\b|\byoy\b/i.test(title)) return 'anual';
    if (/\bq\/q\b|\bqoq\b/i.test(title)) return 'trimestral';
    return '';
  }
  // Añade el periodo: entre paréntesis, o con " · " si el nombre ya termina en ")".
  function withPeriod(name, word) {
    if (!word) return name;
    return /\)\s*$/.test(name) ? name + ' · ' + word : name + ' (' + word + ')';
  }

  function translateEvent(title) {
    const period = periodWord(title);
    // 0) Discursos de banqueros centrales con nombre → formato "Discurso de X, cargo"
    let sp;
    if ((sp = title.match(/^fomc member (.+?) speaks$/i))) return 'Discurso de ' + sp[1] + ', miembro de la Fed';
    if ((sp = title.match(/^mpc member (.+?) speaks$/i))) return 'Discurso de ' + sp[1] + ', miembro del Comité de Política Monetaria (BoE)';
    if ((sp = title.match(/^(?:boe|bank of england) gov(?:ernor)? (.+?) speaks$/i))) return 'Discurso de ' + sp[1] + ', gobernador del Banco de Inglaterra';
    if ((sp = title.match(/^(?:boc|bank of canada) gov(?:ernor)? (.+?) speaks$/i))) return 'Discurso de ' + sp[1] + ', gobernador del Banco de Canadá';
    if ((sp = title.match(/^(?:ecb) (?:president |gov )?(.+?) speaks$/i))) return 'Discurso de ' + sp[1] + ', del Banco Central Europeo';
    if ((sp = title.match(/^fed (?:chair(?:man)?) (.+?) (speaks|testifies)$/i))) return (/testifies/i.test(sp[2]) ? 'Comparecencia' : 'Discurso') + ' del presidente de la Fed, ' + sp[1];
    // 1) Coincidencia con un nombre conocido
    for (const [re, es] of EVENT_MAP) {
      const m = title.match(re);
      if (m) {
        let name = es;
        // Subasta de bonos con plazo en años
        if (/bond auction/i.test(re.source) && m[1]) name = 'Subasta de bonos a ' + m[1] + ' años';
        // Añadir prefijo de país si el título lo trae y el nombre no lo menciona
        for (const [pre, pais] of PREFIX_COUNTRY) {
          if (pre.test(title) && !name.includes(pais) && !/\(/.test(name)) { name += ' (' + pais + ')'; break; }
        }
        return withPeriod(name, period);
      }
    }
    // 2) Sin match: traducción por piezas para no dejar nada en inglés
    let t = title;
    // Nombre de país al inicio (se guarda y se añade AL FINAL, tras traducir el resto)
    let paisSuffix = '';
    for (const [pre, pais] of PREFIX_COUNTRY) { if (pre.test(t)) { t = t.replace(pre, ''); paisSuffix = ' (' + pais + ')'; break; } }
    // Abreviaturas de instituciones dentro del texto
    t = t.replace(/\bBuba\b/gi, 'Bundesbank');
    // Patrones de discurso / comparecencia (antes de añadir el país)
    t = t.replace(/^(.*?)\s+testifies$/i, 'Comparecencia de $1');
    t = t.replace(/^(.*?)\s+speaks$/i, 'Discurso de $1');
    t = t.replace(/(\d+)-?(y|yr|year)\s+bond auction/i, 'Subasta de bonos a $1 años');
    // Diccionario de términos frecuentes
    const DICT = [
      [/\bGov\b|\bGovernor\b/gi, 'gobernador'], [/\bPresident\b/gi, 'presidente'],
      [/\bChairman\b|\bChair\b/gi, 'presidente'], [/\bMember\b/gi, 'miembro'],
      [/\bBond Auction\b/gi, 'Subasta de bonos'], [/\bAuction\b/gi, 'Subasta'],
      [/\bWholesale\b/gi, 'mayorista'], [/\bRetail\b/gi, 'minorista'],
      [/\bTrade Balance\b/gi, 'Balanza comercial'], [/\bManufacturing\b/gi, 'manufacturero'],
      [/\bServices\b/gi, 'de servicios'], [/\bProduction\b/gi, 'Producción'],
      [/\bSales\b/gi, 'Ventas'], [/\bOrders\b/gi, 'Pedidos'], [/\bIndex\b/gi, 'Índice'],
      [/\bRate\b/gi, 'Tasa'], [/\bInflation\b/gi, 'Inflación'], [/\bEmployment\b/gi, 'Empleo'],
      [/\bPrices\b/gi, 'Precios'], [/\bConfidence\b/gi, 'Confianza'], [/\bSentiment\b/gi, 'Confianza'],
      [/\bBalance\b/gi, 'Balance'], [/\bBudget\b/gi, 'Presupuesto'], [/\bSurvey\b/gi, 'Encuesta'],
      [/\bReport\b/gi, 'Informe'], [/\bStatement\b/gi, 'Comunicado'], [/\bMinutes\b/gi, 'Actas'],
      [/\bPrelim(inary)?\b/gi, 'Preliminar'], [/\bFlash\b/gi, 'Preliminar'], [/\bFinal\b/gi, 'Final'],
      [/\bRevised\b/gi, 'Revisado'], [/\bMonthly\b/gi, 'Mensual'], [/\bQuarterly\b/gi, 'Trimestral'],
      [/\bAnnual\b/gi, 'Anual']
    ];
    for (const [re, es] of DICT) t = t.replace(re, es);
    // Limpiar sufijos de periodo del texto (se añaden formateados aparte)
    t = t.replace(/\b(m\/m|y\/y|q\/q|q\/y|ytd\/y|3m\/3m|mom|yoy|qoq)\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    return withPeriod((t || title) + paisSuffix, period);
  }

  function impactWeight(imp) { return imp === 'High' ? 3 : imp === 'Medium' ? 2 : 1; }

  function fmtTime(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return '—';
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function dayKey(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function isToday(dateStr) {
    const d = new Date(dateStr); const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  let allEvents = [];
  let currentFilter = 'high'; // high | all

  // Construye una fila. compact=true (incrustado): sin la explicación visible,
  // que pasa a un tooltip; compact=false (calendario completo): con explicación.
  function rowHTML(e, compact) {
    const imp = IMPACT_LABEL[e.impact] || IMPACT_LABEL.Low;
    const cur = (FLAGS[e.country] || FLAG_MUNDO) + ' ' + (CURRENCY_LABEL[e.country] || e.country);
    const esName = translateEvent(e.title);
    const cat = classify(e.title);
    const showOriginal = esName.replace(/\s*\([^)]*\)\s*$/, '').toLowerCase() !== e.title.toLowerCase();
    return `
      <div class="ecal-row ecal-imp-${imp.cls}${isToday(e.date) ? ' ecal-today' : ''}"${compact ? ` title="${escAttr(cat.why)}"` : ''}>
        <div class="ecal-time">${fmtTime(e.date)}</div>
        <div class="ecal-cur">${cur}</div>
        <div class="ecal-impact"><span class="ecal-dot ecal-dot-${imp.cls}"></span>${imp.es}</div>
        <div class="ecal-event">
          <strong>${escapeHtml(esName)}</strong>
          <span class="ecal-cat ecal-cat-${cat.key}">${cat.icon} ${cat.label}</span>
          ${compact ? '' : `<span class="ecal-why">${escapeHtml(cat.why)}</span>`}
          ${showOriginal ? `<span class="ecal-orig">${escapeHtml(e.title)}</span>` : ''}
        </div>
        <div class="ecal-vals">
          <div><span>Previsión</span><strong>${e.forecast || '—'}</strong></div>
          <div><span>Anterior</span><strong>${e.previous || '—'}</strong></div>
          <div><span>Actual</span><strong class="${actualClass(e)}">${e.actual || '·'}</strong></div>
        </div>
      </div>`;
  }

  function groupAndBuild(events, compact) {
    const byDay = {};
    events.forEach((e) => { const k = dayKey(e.date); (byDay[k] = byDay[k] || []).push(e); });
    let html = '';
    Object.keys(byDay).forEach((day) => {
      html += `<div class="ecal-day">${day.charAt(0).toUpperCase() + day.slice(1)}</div>`;
      byDay[day].forEach((e) => { html += rowHTML(e, compact); });
    });
    return html;
  }

  function render() {
    if (!rootEl) return;
    const events = currentFilter === 'high'
      ? allEvents.filter((e) => e.impact === 'High' || e.impact === 'Medium')
      : allEvents;
    if (!events.length) {
      rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">No hay eventos para mostrar con este filtro.</p>';
      return;
    }
    rootEl.innerHTML = groupAndBuild(events, false);
  }

  function actualClass(e) {
    // Colorea el dato real vs. la previsión (verde si superó, rojo si quedó por debajo).
    const a = parseNum(e.actual), f = parseNum(e.forecast);
    if (a === null || f === null) return '';
    if (a > f) return 'ecal-up';
    if (a < f) return 'ecal-down';
    return '';
  }
  function parseNum(v) {
    if (!v) return null;
    const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? null : n;
  }
  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function escAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }

  // ---- Feed compartido (una sola descarga por página) ----
  let feedPromise = null;
  function getFeed() {
    if (!feedPromise) {
      feedPromise = fetch('/.netlify/functions/economic-calendar')
        .then((r) => r.json())
        .then((data) => {
          if (!data.success || !Array.isArray(data.events)) throw new Error('respuesta inválida');
          return data.events
            .filter((e) => e && e.date && e.title)
            .sort((a, b) => new Date(a.date) - new Date(b.date) || impactWeight(b.impact) - impactWeight(a.impact));
        });
    }
    return feedPromise;
  }

  function wireFilters() {
    const bar = document.getElementById('ecalFilters');
    if (!bar) return;
    bar.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-ecal-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.ecalFilter;
      bar.querySelectorAll('[data-ecal-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      render();
    });
  }

  function loadFull() {
    if (!rootEl) return;
    rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">Cargando calendario económico...</p>';
    getFeed().then((events) => { allEvents = events; render(); })
      .catch(() => { rootEl.innerHTML = '<p class="footer-text" style="padding:20px;text-align:center;">No se pudo cargar el calendario en este momento. Recarga la página en unos segundos.</p>'; });
  }

  // ---- Mini-calendario incrustado (ideas, noticias, educación, sidebar, etc.) ----
  // opts: { currencies, limit, impact, title, mini:bool, head:bool }
  // mini = layout compacto apilado para columnas estrechas (sidebar).
  // head = mostrar cabecera con título + enlace (por defecto true; en mini, false).
  function renderEmbed(el, opts) {
    if (!el) return;
    opts = opts || {};
    const currencies = (opts.currencies && opts.currencies.length) ? opts.currencies : null;
    const limit = opts.limit || 6;
    const impact = opts.impact || 'high';
    const mini = !!opts.mini;
    const showHead = opts.head !== undefined ? !!opts.head : !mini;
    const title = opts.title || 'Calendario económico relacionado';
    el.dataset.ecalReady = '1'; // evita que el auto-init lo vuelva a renderizar
    el.classList.add('ecal-embed');
    if (mini) el.classList.add('ecal-embed-mini');
    const headHTML = showHead
      ? `<div class="ecal-embed-head"><h3>${escapeHtml(title)}</h3><a href="calendario.html" class="ecal-embed-link">Ver calendario completo →</a></div>`
      : '';
    el.innerHTML = headHTML +
      `<div class="ecal-embed-body ecal-table"><p class="footer-text" style="padding:16px;text-align:center;">Cargando calendario...</p></div>`;
    const body = el.querySelector('.ecal-embed-body');
    getFeed().then((events) => {
      let pool = events.filter((e) => (impact === 'all' ? true : (e.impact === 'High' || e.impact === 'Medium')));
      if (currencies) pool = pool.filter((e) => currencies.indexOf(e.country) >= 0);
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const upcoming = pool.filter((e) => new Date(e.date).getTime() >= todayStart.getTime());
      const chosen = (upcoming.length ? upcoming : pool).slice(0, limit);
      if (!chosen.length) {
        body.innerHTML = '<p class="footer-text" style="padding:16px;text-align:center;">No hay eventos económicos relevantes esta semana.</p>';
        return;
      }
      body.innerHTML = groupAndBuild(chosen, true);
      if (!showHead) {
        const foot = document.createElement('a');
        foot.href = 'calendario.html';
        foot.className = 'ecal-embed-link ecal-embed-foot';
        foot.textContent = 'Ver calendario completo →';
        el.appendChild(foot);
      }
    }).catch(() => {
      body.innerHTML = '<p class="footer-text" style="padding:16px;text-align:center;">No se pudo cargar el calendario ahora. Recarga en unos segundos.</p>';
    });
  }

  function initEmbeds(scope) {
    (scope || document).querySelectorAll('.ar4-ecal-embed').forEach((el) => {
      if (el.dataset.ecalReady) return;
      el.dataset.ecalReady = '1';
      const cur = (el.dataset.currencies || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
      renderEmbed(el, {
        currencies: cur,
        limit: parseInt(el.dataset.limit || '6', 10),
        impact: el.dataset.impact || 'high',
        title: el.dataset.title
      });
    });
  }

  function init() {
    if (rootEl) { wireFilters(); loadFull(); }
    initEmbeds(document);
  }

  // Expuesto para páginas que insertan el calendario dinámicamente (p. ej. idea.html).
  window.AR4ECAL = { renderEmbed: renderEmbed, initEmbeds: initEmbeds, getFeed: getFeed, translateEvent: translateEvent, classify: classify };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
