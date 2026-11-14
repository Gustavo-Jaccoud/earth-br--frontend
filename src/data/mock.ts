/**
 * Terra+ — dados fictícios (mock).
 * Todo o conteúdo exibido pelo protótipo vem deste arquivo, para facilitar
 * a troca por dados reais (APIs NASA POWER, SMAP, GPM, MODIS, ECOSTRESS e
 * ISRIC SoilGrids) no futuro.
 */

/* ------------------------------------------------------------------ */
/* Fontes de dados                                                     */
/* ------------------------------------------------------------------ */

export type SourceId = 'power' | 'smap' | 'gpm' | 'modis' | 'ecostress' | 'soilgrids'

export type DataSource = {
  id: SourceId
  name: string
  org: string
  measures: string
  plain: string
  resolution: string
  updatedAt: string
}

export const DATA_SOURCES: Record<SourceId, DataSource> = {
  power: {
    id: 'power',
    name: 'NASA POWER',
    org: 'NASA',
    measures: 'Temperatura, radiação solar e chuva',
    plain: 'Guarda mais de 40 anos de clima de cada lugar: temperatura, sol e chuva, dia a dia.',
    resolution: '~50 km',
    updatedAt: '13/11/2026',
  },
  smap: {
    id: 'smap',
    name: 'NASA SMAP',
    org: 'NASA',
    measures: 'Umidade do solo',
    plain: 'Satélite que “sente” quanta água existe nos primeiros centímetros do solo.',
    resolution: '9 km',
    updatedAt: '12/11/2026',
  },
  gpm: {
    id: 'gpm',
    name: 'NASA GPM',
    org: 'NASA / JAXA',
    measures: 'Chuva',
    plain: 'Rede de satélites que mede a chuva no mundo inteiro a cada meia hora.',
    resolution: '~10 km',
    updatedAt: '13/11/2026',
  },
  modis: {
    id: 'modis',
    name: 'NASA MODIS',
    org: 'NASA',
    measures: 'Vegetação (NDVI)',
    plain: 'Fotografa a Terra todo dia e mostra se as plantas estão verdes e saudáveis.',
    resolution: '250 m',
    updatedAt: '10/11/2026',
  },
  ecostress: {
    id: 'ecostress',
    name: 'NASA ECOSTRESS',
    org: 'NASA',
    measures: 'Temperatura da superfície',
    plain: 'Sensor na Estação Espacial que mede o calor do chão e das folhas — e se a planta está com sede.',
    resolution: '70 m',
    updatedAt: '08/11/2026',
  },
  soilgrids: {
    id: 'soilgrids',
    name: 'ISRIC SoilGrids',
    org: 'ISRIC',
    measures: 'Características do solo',
    plain: 'Mapa mundial do solo: textura, matéria orgânica e acidez, estimados a partir de milhares de amostras.',
    resolution: '250 m',
    updatedAt: '2025 (versão 2.0)',
  },
}

/* ------------------------------------------------------------------ */
/* Glossário                                                           */
/* ------------------------------------------------------------------ */

export type GlossaryKey =
  | 'ndvi'
  | 'evapotranspiracao'
  | 'anomalia'
  | 'umidadeSolo'
  | 'estresseTermico'
  | 'pousio'
  | 'adubacaoVerde'
  | 'curvaNivel'
  | 'consorcio'
  | 'materiaOrganica'
  | 'mediaHistorica'
  | 'resolucao'
  | 'talhao'
  | 'palhada'

export const GLOSSARY: Record<GlossaryKey, { term: string; plain: string }> = {
  ndvi: {
    term: 'NDVI',
    plain: 'Um número de 0 a 1 que mostra o quanto as plantas estão verdes e vivas. Perto de 1: muito verde. Abaixo de 0,3: plantas sofrendo ou solo exposto.',
  },
  evapotranspiracao: {
    term: 'Evapotranspiração',
    plain: 'A água que “sai” da terra para o ar: a que evapora do chão somada à que as plantas “suam” pelas folhas.',
  },
  anomalia: {
    term: 'Anomalia de umidade',
    plain: 'A diferença entre a umidade de hoje e o que é normal para esta época do ano. Negativa quer dizer: mais seco que o normal.',
  },
  umidadeSolo: {
    term: 'Umidade do solo',
    plain: 'Quanto de água existe na terra, em porcentagem. Para o milho crescer bem, o ideal aqui fica acima de 20%.',
  },
  estresseTermico: {
    term: 'Estresse térmico',
    plain: 'Quando faz tanto calor que a planta para de crescer direito para se proteger. Para o milho, acontece acima de 35 °C.',
  },
  pousio: {
    term: 'Pousio',
    plain: 'Deixar a terra “descansando” sem plantar nada. Se ficar descoberta, pode perder solo com o vento e a chuva.',
  },
  adubacaoVerde: {
    term: 'Adubo verde',
    plain: 'Plantas como mucuna, guandu e crotalária que são cultivadas para alimentar e proteger o solo, e não para colher.',
  },
  curvaNivel: {
    term: 'Curva de nível',
    plain: 'Plantar em linhas que acompanham o “deitado” do terreno, e não morro abaixo. Isso segura a água e a terra.',
  },
  consorcio: {
    term: 'Consórcio',
    plain: 'Plantar duas culturas juntas na mesma área, ao mesmo tempo, para que uma ajude a outra.',
  },
  materiaOrganica: {
    term: 'Matéria orgânica',
    plain: 'Restos de plantas e animais decompostos no solo. É o que deixa a terra “viva”, fofa e capaz de segurar água.',
  },
  mediaHistorica: {
    term: 'Média histórica',
    plain: 'O valor normal para aquele mês, calculado com 20 anos de dados de satélite da sua região.',
  },
  resolucao: {
    term: 'Resolução',
    plain: 'O tamanho do menor “quadradinho” que o satélite consegue enxergar. Quanto menor, mais detalhe.',
  },
  talhao: {
    term: 'Talhão',
    plain: 'Uma parte da propriedade separada para um tipo de plantio.',
  },
  palhada: {
    term: 'Palhada',
    plain: 'Restos da colheita (folhas, talos) deixados sobre o solo para cobri-lo e protegê-lo do sol e da chuva forte.',
  },
}

/* ------------------------------------------------------------------ */
/* Usuário e propriedades                                              */
/* ------------------------------------------------------------------ */

export const USER = {
  firstName: 'Maria',
  fullName: 'Maria das Dores Santos',
  role: 'Produtora rural',
  initials: 'MS',
}

export type SoilType = 'Arenoso' | 'Argiloso' | 'Misto' | 'Arenoso-argiloso' | 'Não sei'
export type WaterSource = 'Só chuva' | 'Poço' | 'Cisterna' | 'Açude' | 'Irrigação'
export type Goal = 'Economizar água' | 'Melhorar o solo' | 'Reduzir riscos climáticos' | 'Aumentar a renda'

export type Property = {
  id: string
  name: string
  state: string
  city: string
  areaHa: number
  soil: SoilType
  soilEstimated?: boolean
  water: WaterSource[]
  irrigation: boolean
  crops: string[]
  rotation: string
  goal: Goal
  currentCrop: string
  coords: string
  /** Forma do contorno no mapa placeholder (pontos em 0–100). */
  shape: string
}

export const PROPERTIES: Property[] = [
  {
    id: 'boa-esperanca',
    name: 'Sítio Boa Esperança',
    state: 'SE',
    city: 'Nossa Senhora da Glória',
    areaHa: 12,
    soil: 'Arenoso-argiloso',
    water: ['Só chuva', 'Cisterna'],
    irrigation: false,
    crops: ['Milho'],
    rotation: 'Milho no período chuvoso, depois a terra fica em pousio.',
    goal: 'Economizar água',
    currentCrop: 'Milho → pousio',
    coords: '10°13′S · 37°25′O',
    shape: '18,22 62,14 84,30 80,72 54,86 22,78 12,48',
  },
  {
    id: 'lagoa-funda',
    name: 'Fazenda Lagoa Funda',
    state: 'SE',
    city: 'Poço Redondo',
    areaHa: 38,
    soil: 'Argiloso',
    water: ['Açude'],
    irrigation: false,
    crops: ['Palma forrageira', 'Pastagem'],
    rotation: 'Palma o ano todo e pasto para o gado.',
    goal: 'Reduzir riscos climáticos',
    currentCrop: 'Palma forrageira + pastagem',
    coords: '9°48′S · 37°41′O',
    shape: '14,30 46,12 88,20 90,60 70,88 30,84 10,62',
  },
  {
    id: 'santa-luzia',
    name: 'Roça Santa Luzia',
    state: 'AL',
    city: 'Delmiro Gouveia',
    areaHa: 4.5,
    soil: 'Arenoso',
    water: ['Cisterna'],
    irrigation: false,
    crops: ['Feijão-caupi', 'Mandioca'],
    rotation: 'Feijão nas águas, mandioca o resto do ano.',
    goal: 'Aumentar a renda',
    currentCrop: 'Feijão-caupi → mandioca',
    coords: '9°23′S · 38°00′O',
    shape: '24,18 76,22 86,54 66,84 26,80 14,46',
  },
]

export const STATES = ['AL', 'BA', 'CE', 'MA', 'MG', 'PB', 'PE', 'PI', 'RN', 'SE']

export const CITIES_BY_STATE: Record<string, string[]> = {
  SE: ['Nossa Senhora da Glória', 'Poço Redondo', 'Canindé de São Francisco', 'Porto da Folha', 'Monte Alegre de Sergipe'],
  AL: ['Delmiro Gouveia', 'Santana do Ipanema', 'Pão de Açúcar', 'Água Branca'],
  BA: ['Juazeiro', 'Paulo Afonso', 'Euclides da Cunha', 'Irecê', 'Jeremoabo'],
  PE: ['Petrolina', 'Serra Talhada', 'Arcoverde', 'Afogados da Ingazeira'],
  PB: ['Patos', 'Sousa', 'Monteiro', 'Cajazeiras'],
  CE: ['Quixadá', 'Crateús', 'Iguatu', 'Tauá'],
  RN: ['Caicó', 'Mossoró', 'Currais Novos', 'Pau dos Ferros'],
  PI: ['Picos', 'São Raimundo Nonato', 'Oeiras'],
  MA: ['Balsas', 'Imperatriz'],
  MG: ['Janaúba', 'Montes Claros', 'Salinas'],
}

export const CROP_OPTIONS = [
  'Milho',
  'Feijão-caupi',
  'Mandioca',
  'Palma forrageira',
  'Sorgo',
  'Algodão',
  'Hortaliças',
  'Pastagem',
  'Outra',
]

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export const TODAY = new Date(2026, 10, 14) // 14 de novembro de 2026

export const MAIN_ALERT = {
  level: 'warn' as const,
  text: 'Atenção: umidade do solo 18% abaixo da média para novembro.',
  explanation:
    'O satélite SMAP mediu menos água na terra do que o normal para esta época. Sem chuva nas próximas semanas, plantar agora tem risco maior de perda. Uma cobertura com palhada ajuda a segurar a pouca umidade que resta.',
  source: 'smap' as SourceId,
}

export type Indicator = {
  id: string
  label: string
  value: string
  unit: string
  comparison: string
  trend: 'up' | 'down' | 'flat'
  status: 'ok' | 'warn' | 'crit'
  statusLabel: string
  sources: SourceId[]
  help: GlossaryKey
}

export const INDICATORS: Indicator[] = [
  {
    id: 'rain',
    label: 'Chuva acumulada (30 dias)',
    value: '12',
    unit: 'mm',
    comparison: 'Média para o período: 25 mm',
    trend: 'down',
    status: 'warn',
    statusLabel: 'Abaixo da média',
    sources: ['gpm', 'power'],
    help: 'mediaHistorica',
  },
  {
    id: 'moisture',
    label: 'Umidade do solo',
    value: '14',
    unit: '%',
    comparison: 'Normal para novembro: 17%',
    trend: 'down',
    status: 'warn',
    statusLabel: 'Abaixo do normal',
    sources: ['smap'],
    help: 'umidadeSolo',
  },
  {
    id: 'temp',
    label: 'Temperatura média',
    value: '31',
    unit: '°C',
    comparison: '3 dias de estresse térmico este mês',
    trend: 'up',
    status: 'warn',
    statusLabel: 'Calor acima do normal',
    sources: ['power', 'ecostress'],
    help: 'estresseTermico',
  },
  {
    id: 'ndvi',
    label: 'Saúde da vegetação (NDVI)',
    value: '0,32',
    unit: '',
    comparison: 'Média para novembro: 0,41',
    trend: 'down',
    status: 'crit',
    statusLabel: 'Vegetação sob estresse',
    sources: ['modis'],
    help: 'ndvi',
  },
]

export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MONTHS_LONG = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** Chuva mensal (mm) — dez/2025 a nov/2026 vs. média de 20 anos. */
export const RAIN_12M = [
  { month: 'dez/25', rain: 18, avg: 24 },
  { month: 'jan/26', rain: 31, avg: 38 },
  { month: 'fev/26', rain: 22, avg: 41 },
  { month: 'mar/26', rain: 58, avg: 62 },
  { month: 'abr/26', rain: 84, avg: 96 },
  { month: 'mai/26', rain: 118, avg: 110 },
  { month: 'jun/26', rain: 92, avg: 104 },
  { month: 'jul/26', rain: 71, avg: 88 },
  { month: 'ago/26', rain: 34, avg: 49 },
  { month: 'set/26', rain: 9, avg: 22 },
  { month: 'out/26', rain: 4, avg: 14 },
  { month: 'nov/26', rain: 12, avg: 25 },
]

export type CalendarBand = {
  id: string
  label: string
  start: number // mês 0–11
  end: number // inclusivo
  kind: 'rain' | 'plant' | 'bare' | 'critical'
}

export const LAND_CALENDAR: CalendarBand[] = [
  { id: 'chuva', label: 'Período chuvoso', start: 3, end: 7, kind: 'rain' },
  { id: 'plantio', label: 'Janela ideal de plantio', start: 3, end: 4, kind: 'plant' },
  { id: 'critico', label: 'Meses críticos para o milho (floração)', start: 5, end: 6, kind: 'critical' },
  { id: 'descoberto', label: 'Solo descoberto (risco de erosão)', start: 8, end: 2, kind: 'bare' },
]

export const LAST_REPORT_ID = 'r-001'

/* ------------------------------------------------------------------ */
/* Partida rápida                                                      */
/* ------------------------------------------------------------------ */

export type QuickOption = { id: string; label: string; icon: string; hint?: string; image?: string }
export type QuickQuestion = {
  id: string
  title: string
  type: 'single' | 'multi' | 'rank'
  options: QuickOption[]
  why?: string
  note?: string
}

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: 'q1',
    title: 'Qual é a sua maior preocupação nesta safra?',
    type: 'single',
    why: 'Assim sabemos o que olhar primeiro nos dados de satélite e quais estratégias colocar no topo.',
    options: [
      { id: 'agua', label: 'Falta de água', icon: 'Droplets' },
      { id: 'solo', label: 'Solo fraco ou erodido', icon: 'Mountain' },
      { id: 'calor', label: 'Calor e perda de lavoura', icon: 'ThermometerSun' },
      { id: 'renda', label: 'Renda baixa', icon: 'Wallet' },
    ],
  },
  {
    id: 'q2',
    title: 'Como foi a última safra?',
    type: 'single',
    options: [
      { id: 'boa', label: 'Boa', icon: 'Smile' },
      { id: 'regular', label: 'Regular', icon: 'Meh' },
      { id: 'ruim', label: 'Ruim', icon: 'Frown' },
      { id: 'perdi', label: 'Perdi a maior parte', icon: 'CloudOff' },
    ],
  },
  {
    id: 'q3',
    title: 'O que você faz com a terra depois da colheita?',
    type: 'single',
    why: 'A terra sem cobertura no período seco perde água e solo. Isso pesa muito no risco de erosão.',
    options: [
      { id: 'pousio', label: 'Deixo descansar sem nada (pousio)', icon: 'Square' },
      { id: 'outra', label: 'Planto outra cultura', icon: 'Sprout' },
      { id: 'gado', label: 'Coloco o gado para pastar', icon: 'Beef' },
      { id: 'cobertura', label: 'Uso cobertura (palhada, adubo verde)', icon: 'Layers' },
    ],
  },
  {
    id: 'q4',
    title: 'Você percebe sinais de erosão?',
    type: 'multi',
    note: 'Pode marcar mais de uma opção.',
      why: 'Os satélites não enxergam sulcos pequenos. O que você vê na terra completa o que eles mostram.',
    options: [
      { id: 'sulcos', label: 'Sulcos na terra', icon: 'Waves', image: 'sulcos abertos pela enxurrada em terreno inclinado' },
      { id: 'levada', label: 'Terra sendo levada pela chuva', icon: 'CloudRain', image: 'água barrenta escorrendo pela lavoura' },
      { id: 'raizes', label: 'Raízes expostas', icon: 'TreeDeciduous', image: 'raízes de árvore à mostra no chão' },
      { id: 'nao', label: 'Não percebo', icon: 'CircleCheck', image: 'solo coberto e firme, sem sulcos' },
    ],
  },
  {
    id: 'q5',
    title: 'Quanto de água você tem disponível no período seco?',
    type: 'single',
    options: [
      { id: 'nenhuma', label: 'Nenhuma, só chuva', icon: 'CloudSun' },
      { id: 'pouca', label: 'Pouca (cisterna)', icon: 'Container' },
      { id: 'media', label: 'Média (poço ou açude)', icon: 'Droplet' },
      { id: 'irrigacao', label: 'Tenho irrigação', icon: 'ShowerHead' },
    ],
  },
  {
    id: 'q6',
    title: 'Você cria animais?',
    type: 'single',
    why: 'Se você cria animais, culturas que viram forragem (como sorgo e palma) passam a valer mais.',
    options: [
      { id: 'gado', label: 'Sim, gado', icon: 'Beef' },
      { id: 'caprinos', label: 'Sim, caprinos ou ovinos', icon: 'Rabbit' },
      { id: 'pequenos', label: 'Pequenos animais', icon: 'Egg' },
      { id: 'nao', label: 'Não', icon: 'Ban' },
    ],
  },
  {
    id: 'q7',
    title: 'Já teve problemas com pragas ou doenças que voltam todo ano?',
    type: 'single',
    options: [
      { id: 'sempre', label: 'Sim, sempre', icon: 'Bug' },
      { id: 'asvezes', label: 'Às vezes', icon: 'BugOff' },
      { id: 'nao', label: 'Não', icon: 'ShieldCheck' },
    ],
  },
  {
    id: 'q8',
    title: 'Como você vende sua produção?',
    type: 'single',
    options: [
      { id: 'proprio', label: 'Consumo próprio', icon: 'House' },
      { id: 'feira', label: 'Feira local', icon: 'Store' },
      { id: 'coop', label: 'Cooperativa ou atravessador', icon: 'Users' },
      { id: 'contrato', label: 'Contrato ou mercado maior', icon: 'Truck' },
    ],
  },
  {
    id: 'q9',
    title: 'Quanto você pode investir para mudar o manejo?',
    type: 'single',
    why: 'Só sugerimos mudanças que cabem no seu bolso. Muitas ações de proteção do solo custam pouco.',
    options: [
      { id: 'nada', label: 'Nada agora', icon: 'CircleSlash' },
      { id: 'pouco', label: 'Pouco', icon: 'Coins' },
      { id: 'moderado', label: 'Moderado', icon: 'Banknote' },
      { id: 'consigo', label: 'Consigo investir', icon: 'PiggyBank' },
    ],
  },
  {
    id: 'q10',
    title: 'O que é mais importante para você nos próximos anos?',
    type: 'rank',
    note: 'Arraste para ordenar, ou use as setas. O primeiro é o mais importante.',
    options: [
      { id: 'agua', label: 'Economizar água', icon: 'Droplets' },
      { id: 'solo', label: 'Recuperar o solo', icon: 'Sprout' },
      { id: 'renda', label: 'Ter renda extra', icon: 'Wallet' },
      { id: 'animais', label: 'Alimentar os animais', icon: 'Wheat' },
    ],
  },
]

export const PROCESSING_STEPS = [
  { id: 'chuva', label: 'Chuva', detail: 'GPM e NASA POWER · 2006–2026' },
  { id: 'solo', label: 'Solo', detail: 'SMAP e SoilGrids' },
  { id: 'temp', label: 'Temperatura', detail: 'NASA POWER e ECOSTRESS' },
  { id: 'veg', label: 'Vegetação', detail: 'MODIS · NDVI' },
]

/* ------------------------------------------------------------------ */
/* Relatório da Partida rápida                                         */
/* ------------------------------------------------------------------ */

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'

export const QUICK_REPORT = {
  summary:
    'Sua terra está em risco moderado de falta de água e alto risco de erosão no período seco. A boa notícia: uma rotação com feijão-caupi e cobertura de solo pode reduzir esses riscos.',
  risks: [
    {
      id: 'hidrico',
      label: 'Risco hídrico',
      level: 'alto' as RiskLevel,
      value: 78,
      basedOn: ['Você só conta com chuva e cisterna', 'Chuva 52% abaixo da média em set–nov'],
      sources: ['smap', 'gpm'] as SourceId[],
    },
    {
      id: 'erosao',
      label: 'Risco de erosão',
      level: 'alto' as RiskLevel,
      value: 72,
      basedOn: ['Solo descoberto por 6 meses (pousio)', 'Sulcos na terra que você relatou'],
      sources: ['modis', 'soilgrids'] as SourceId[],
    },
    {
      id: 'termico',
      label: 'Estresse térmico',
      level: 'moderado' as RiskLevel,
      value: 52,
      basedOn: ['3 dias acima de 35 °C neste mês', 'Perda de lavoura relatada na última safra'],
      sources: ['power', 'ecostress'] as SourceId[],
    },
    {
      id: 'pragas',
      label: 'Pressão de pragas',
      level: 'baixo' as RiskLevel,
      value: 24,
      basedOn: ['Você relatou pragas só às vezes'],
      sources: [] as SourceId[],
    },
  ],
  environmental: [
    {
      id: 'perda',
      label: 'Perda de solo estimada',
      now: '8,4 t/ha/ano',
      after: '3,1 t/ha/ano',
      icon: 'Mountain',
      explain: 'Quanto de terra a chuva e o vento levam por ano. Cobrir o solo reduz em até 60%.',
    },
    {
      id: 'mo',
      label: 'Matéria orgânica',
      now: '0,9%',
      after: '1,3% em 3 anos',
      icon: 'Leaf',
      explain: 'É a “comida” do solo. Mais matéria orgânica = terra que segura mais água.',
    },
    {
      id: 'agua',
      label: 'Uso de água',
      now: '100%',
      after: '−22%',
      icon: 'Droplets',
      explain: 'Culturas de ciclo curto e solo coberto pedem menos água no mesmo período.',
    },
    {
      id: 'cobertura',
      label: 'Cobertura do solo',
      now: '45% do ano',
      after: '85% do ano',
      icon: 'Layers',
      explain: 'Tempo em que a terra fica protegida por plantas ou palhada.',
    },
  ],
  financial: {
    rows: [
      { label: 'Custo estimado por safra', current: 'R$ 4.800', suggested: 'R$ 5.300', note: 'Sementes de feijão e sorgo' },
      { label: 'Perda potencial por seca', current: 'R$ 3.600', suggested: 'R$ 1.400', note: 'Em ano seco como 2026' },
      { label: 'Possível renda extra', current: 'R$ 0', suggested: 'R$ 2.900', note: 'Venda de feijão + forragem de sorgo' },
    ],
    balanceCurrent: '−R$ 3.600',
    balanceSuggested: '+R$ 1.000',
  },
  actions: [
    {
      id: 'a1',
      when: 'Agora',
      title: 'Mantenha a palhada do milho sobre o solo',
      detail: 'Não queime nem retire os restos da colheita. Eles seguram umidade e protegem do sol.',
      icon: 'Layers',
      cost: 'Baixo',
      effort: 'Baixo',
    },
    {
      id: 'a2',
      when: 'Agora',
      title: 'Armazene forragem antes do pico da seca',
      detail: 'Faça silagem ou feno com o que tiver disponível até o fim de dezembro.',
      icon: 'Warehouse',
      cost: 'Médio',
      effort: 'Médio',
    },
    {
      id: 'a3',
      when: 'Próximos 3 meses',
      title: 'Prepare o plantio em curva de nível',
      detail: 'Marque as linhas acompanhando o terreno antes das primeiras chuvas de março.',
      icon: 'Waves',
      cost: 'Baixo',
      effort: 'Médio',
    },
    {
      id: 'a4',
      when: 'Próximos 3 meses',
      title: 'Garanta sementes de feijão-caupi tolerante à seca',
      detail: 'Cultivares como BRS Pujante e BRS Itaim têm ciclo curto (65–75 dias). Procure a Embrapa ou a cooperativa.',
      icon: 'Sprout',
      cost: 'Médio',
      effort: 'Baixo',
    },
    {
      id: 'a5',
      when: 'Próxima safra',
      title: 'Plante sorgo forrageiro depois do milho',
      detail: 'Aproveita a umidade final das chuvas e vira comida para os animais na seca.',
      icon: 'Wheat',
      cost: 'Médio',
      effort: 'Médio',
    },
    {
      id: 'a6',
      when: 'Próxima safra',
      title: 'Plante palma forrageira nas bordas da área',
      detail: 'Funciona como barreira contra o vento e reserva de forragem.',
      icon: 'Fence',
      cost: 'Alto',
      effort: 'Alto',
    },
  ],
  glossary: ['ndvi', 'pousio', 'evapotranspiracao', 'curvaNivel', 'consorcio', 'adubacaoVerde', 'palhada', 'materiaOrganica'] as GlossaryKey[],
}

export type CropSegment = { crop: string; start: number; end: number; tone: 'grain' | 'legume' | 'forage' | 'cover' | 'bare' | 'cactus' }

export type Strategy = {
  id: 'atual' | 'a' | 'b'
  name: string
  subtitle: string
  sequence: string
  timeline: CropSegment[]
  why: string
  evidence: { text: string; source: SourceId }[]
  scores: { water: number; soil: number; income: number; forage: number }
  risks: string[]
  unknowns: string[]
  needsValidation: boolean
  alignedGoal?: string
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'atual',
    name: 'Estratégia atual',
    subtitle: 'O que você faz hoje',
    sequence: 'Milho → pousio',
    timeline: [
      { crop: 'Milho', start: 3, end: 7, tone: 'grain' },
      { crop: 'Pousio (solo descoberto)', start: 8, end: 2, tone: 'bare' },
    ],
    why: 'É a referência para comparar. O milho aproveita bem os anos de chuva boa, mas a terra fica 7 meses descoberta, perdendo água e solo.',
    evidence: [
      { text: 'Em 4 dos últimos 10 anos, faltou água na floração do milho (junho–julho).', source: 'power' },
      { text: 'NDVI da área cai para 0,22 entre setembro e fevereiro: solo quase sem cobertura.', source: 'modis' },
    ],
    scores: { water: 2, soil: 1, income: 3, forage: 1 },
    risks: ['Perda de lavoura em anos com chuva abaixo da média', 'Erosão no início das chuvas, com o solo exposto'],
    unknowns: ['Produtividade real do milho nos últimos anos na sua área'],
    needsValidation: false,
  },
  {
    id: 'a',
    name: 'Estratégia A',
    subtitle: 'Economia de água',
    sequence: 'Feijão-caupi → milho → sorgo forrageiro',
    timeline: [
      { crop: 'Feijão-caupi', start: 2, end: 4, tone: 'legume' },
      { crop: 'Milho', start: 4, end: 7, tone: 'grain' },
      { crop: 'Sorgo forrageiro', start: 7, end: 10, tone: 'forage' },
      { crop: 'Palhada', start: 11, end: 1, tone: 'cover' },
    ],
    why: 'O feijão-caupi tem ciclo curto e pede pouca água. Ele aproveita as primeiras chuvas e devolve nitrogênio ao solo para o milho. O sorgo resiste à seca e vira forragem.',
    evidence: [
      { text: 'As chuvas de março a maio têm sido as mais regulares nos últimos 20 anos.', source: 'gpm' },
      { text: 'A umidade do solo fica acima de 18% até agosto em 7 de 10 anos — suficiente para o sorgo.', source: 'smap' },
      { text: 'Seu solo arenoso-argiloso drena bem, o que favorece o feijão-caupi.', source: 'soilgrids' },
    ],
    scores: { water: 5, soil: 3, income: 4, forage: 4 },
    risks: ['Se as chuvas atrasarem mais de 20 dias, o milho fica apertado no calendário', 'Exige sementes de feijão de ciclo curto'],
    unknowns: ['Disponibilidade de sementes de sorgo na sua região', 'Preço do feijão na feira local na próxima safra'],
    needsValidation: true,
    alignedGoal: 'economizar água',
  },
  {
    id: 'b',
    name: 'Estratégia B',
    subtitle: 'Recuperação do solo',
    sequence: 'Milho + guandu → mucuna/palhada → palma nas bordas',
    timeline: [
      { crop: 'Milho + guandu (consórcio)', start: 3, end: 7, tone: 'grain' },
      { crop: 'Mucuna / palhada', start: 8, end: 1, tone: 'cover' },
      { crop: 'Palma nas bordas (ano todo)', start: 0, end: 11, tone: 'cactus' },
    ],
    why: 'O guandu tem raiz profunda que “abre” o solo compactado. A mucuna cobre a terra no período seco e a palma nas bordas segura o vento e serve de reserva de comida para os animais.',
    evidence: [
      { text: 'A matéria orgânica do seu solo é baixa (0,9%), abaixo do ideal para a região.', source: 'soilgrids' },
      { text: 'A superfície da área chega a 48 °C na seca: a cobertura reduz essa temperatura.', source: 'ecostress' },
    ],
    scores: { water: 3, soil: 5, income: 2, forage: 4 },
    risks: ['Mais trabalho no primeiro ano', 'Resultado no solo aparece só depois de 2 a 3 safras', 'A mucuna pode competir com o milho se plantada cedo'],
    unknowns: ['Nível de compactação real do solo (precisa de teste no campo)', 'Mão de obra disponível para o manejo da palma'],
    needsValidation: true,
  },
]

/* ------------------------------------------------------------------ */
/* Análise da terra                                                    */
/* ------------------------------------------------------------------ */

export const ANALYSIS_AREAS = [
  { id: 'propriedade', label: 'Propriedade inteira' },
  { id: 'talhao', label: 'Talhão específico' },
  { id: 'municipio', label: 'Município (para comparação)' },
]

export const TALHOES = ['Talhão 1 — Baixada (4 ha)', 'Talhão 2 — Encosta (5 ha)', 'Talhão 3 — Cabeceira (3 ha)']

export const ANALYSIS_PERIODS = [
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'safra', label: 'Safra atual' },
  { id: '1a', label: 'Último ano' },
  { id: '5a', label: 'Últimos 5 anos' },
  { id: '10a', label: 'Últimos 10 anos' },
  { id: '20a', label: 'Últimos 20 anos' },
  { id: 'custom', label: 'Personalizado' },
]

export type VariableId = 'precip' | 'umidade' | 'tar' | 'tsup' | 'ndvi' | 'solo'

export const ANALYSIS_VARIABLES: { id: VariableId; label: string; source: SourceId; unit: string; layer: string }[] = [
  { id: 'precip', label: 'Precipitação', source: 'gpm', unit: 'mm', layer: 'Chuva' },
  { id: 'umidade', label: 'Umidade do solo', source: 'smap', unit: '%', layer: 'Umidade' },
  { id: 'tar', label: 'Temperatura do ar', source: 'power', unit: '°C', layer: 'Temp. do ar' },
  { id: 'tsup', label: 'Temperatura da superfície', source: 'ecostress', unit: '°C', layer: 'Calor do solo' },
  { id: 'ndvi', label: 'Vegetação / NDVI', source: 'modis', unit: '', layer: 'Vegetação' },
  { id: 'solo', label: 'Características do solo', source: 'soilgrids', unit: '%', layer: 'Solo' },
]

export const ANALYSIS_COMPARISONS = [
  { id: 'historico', label: 'Este ano vs. média histórica' },
  { id: 'safra', label: 'Safra vs. safra anterior' },
  { id: 'municipio', label: 'Minha propriedade vs. média do município' },
]

/** Série mensal (jan–dez) de cada variável: valor atual e referência. */
export const ANALYSIS_SERIES: Record<VariableId, { value: number[]; ref: number[] }> = {
  precip: {
    value: [31, 22, 58, 84, 118, 92, 71, 34, 9, 4, 12, 18],
    ref: [38, 41, 62, 96, 110, 104, 88, 49, 22, 14, 25, 24],
  },
  umidade: {
    value: [13, 12, 16, 21, 26, 25, 23, 19, 15, 13, 14, 13],
    ref: [15, 15, 18, 23, 27, 27, 25, 22, 18, 16, 17, 16],
  },
  tar: {
    value: [28.4, 28.9, 28.1, 27.2, 25.6, 24.3, 23.8, 24.6, 26.9, 29.2, 31.0, 30.1],
    ref: [27.6, 27.8, 27.5, 26.6, 25.1, 23.9, 23.2, 23.8, 25.6, 27.4, 28.3, 28.0],
  },
  tsup: {
    value: [41, 42, 39, 35, 32, 30, 30, 33, 40, 45, 48, 46],
    ref: [39, 39, 37, 34, 31, 29, 29, 31, 37, 41, 43, 42],
  },
  ndvi: {
    value: [0.24, 0.23, 0.31, 0.45, 0.58, 0.62, 0.55, 0.43, 0.33, 0.27, 0.32, 0.25],
    ref: [0.28, 0.28, 0.36, 0.5, 0.6, 0.63, 0.59, 0.49, 0.4, 0.34, 0.41, 0.31],
  },
  solo: {
    value: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
    ref: [1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4, 1.4],
  },
}

export const MAP_ZONES = [
  { id: 'z1', kind: 'water' as const, label: 'Ponto de estresse hídrico', x: 64, y: 34, r: 11, note: 'Umidade 11% · Encosta norte' },
  { id: 'z2', kind: 'erosion' as const, label: 'Zona de risco de erosão', x: 36, y: 64, r: 13, note: 'Declive de 8% · solo exposto' },
  { id: 'z3', kind: 'heat' as const, label: 'Área mais quente', x: 70, y: 66, r: 9, note: 'Superfície a 48 °C' },
]

export const ANALYSIS_INSIGHTS = {
  findings: [
    'Nos últimos 10 anos, o período seco na sua região começou em média 18 dias mais cedo.',
    'A umidade do solo entre setembro e dezembro está consistentemente abaixo do necessário para o milho.',
    'A encosta norte da propriedade é a área que seca primeiro: vale priorizar cobertura de solo ali.',
    'A superfície do terreno fica até 5 °C mais quente que a média histórica em outubro e novembro.',
  ],
  confidence: {
    level: 'Médio',
    why: 'A resolução do SMAP (9 km) é maior que sua propriedade, então a umidade é uma média da região ao redor. A chuva (GPM) e a vegetação (MODIS) têm mais detalhe.',
  },
  validate: [
    'Medir a umidade do solo no campo, principalmente na encosta norte',
    'Confirmar a profundidade e a textura do solo com uma análise de laboratório',
    'Verificar sulcos de erosão na baixada antes das chuvas',
  ],
}

/* ------------------------------------------------------------------ */
/* Meus relatórios                                                     */
/* ------------------------------------------------------------------ */

export type ReportType = 'partida' | 'analise'

export type Report = {
  id: string
  title: string
  type: ReportType
  propertyId: string
  date: string // ISO
  conclusion: string
  meta?: Record<string, string>
}

export const INITIAL_REPORTS: Report[] = [
  {
    id: 'r-001',
    title: 'Partida rápida — Safra 2026/27',
    type: 'partida',
    propertyId: 'boa-esperanca',
    date: '2026-11-02',
    conclusion: 'Estratégia A (feijão-caupi → milho → sorgo) reduz o risco hídrico de alto para moderado.',
  },
  {
    id: 'r-002',
    title: 'Umidade do solo — últimos 10 anos',
    type: 'analise',
    propertyId: 'boa-esperanca',
    date: '2026-10-18',
    conclusion: 'O período seco começa em média 18 dias mais cedo do que há 10 anos.',
    meta: { area: 'Propriedade inteira', period: 'Últimos 10 anos', vars: 'Umidade do solo, Precipitação' },
  },
  {
    id: 'r-003',
    title: 'Calor na encosta — safra atual',
    type: 'analise',
    propertyId: 'boa-esperanca',
    date: '2026-09-05',
    conclusion: 'A encosta norte chega a 48 °C na superfície: priorizar cobertura de solo.',
    meta: { area: 'Talhão 2 — Encosta (5 ha)', period: 'Safra atual', vars: 'Temperatura da superfície' },
  },
  {
    id: 'r-004',
    title: 'Partida rápida — Palma e pasto',
    type: 'partida',
    propertyId: 'lagoa-funda',
    date: '2026-07-21',
    conclusion: 'Risco de erosão baixo; atenção à reserva de forragem em outubro.',
  },
  {
    id: 'r-005',
    title: 'Município vs. propriedade — 2025',
    type: 'analise',
    propertyId: 'santa-luzia',
    date: '2026-03-12',
    conclusion: 'A chuva na roça ficou 9% abaixo da média de Delmiro Gouveia.',
    meta: { area: 'Município (para comparação)', period: 'Último ano', vars: 'Precipitação, Vegetação / NDVI' },
  },
]

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

export const LANDING = {
  problems: [
    {
      id: 'clima',
      title: 'O clima mudou',
      stat: '+75 mil km²',
      statLabel: 'de clima semiárido a mais por década',
      text: 'O que funcionava antes já não é garantia.',
      icon: 'ThermometerSun',
    },
    {
      id: 'assistencia',
      title: 'Falta quem ajude a decidir',
      stat: '9 em 10',
      statLabel: 'estabelecimentos do Nordeste não recebem assistência técnica',
      text: 'O produtor escolhe sozinho, na tentativa e erro.',
      icon: 'UserRoundX',
    },
    {
      id: 'dado',
      title: 'O dado existe, mas é difícil de usar',
      stat: '40+ anos',
      statLabel: 'de dados de clima gratuitos da NASA',
      text: 'Mas em formatos técnicos demais.',
      icon: 'FileQuestionMark',
    },
  ],
  steps: [
    {
      title: 'Satélites da NASA observam sua região',
      text: 'Chuva, temperatura, umidade do solo e vegetação, todos os dias.',
      icon: 'Satellite',
    },
    { title: 'Você conta sobre sua terra', text: 'Seu solo, sua água, o que planta e o que é mais importante para você.', icon: 'MessageCircle' },
    { title: 'O Terra+ compara cenários', text: 'Diferentes rotações são testadas com 20 anos de dados do clima.', icon: 'GitCompare' },
    {
      title: 'Você recebe um relatório simples',
      text: 'Com vantagens, riscos e o que ainda precisa ser validado por um técnico.',
      icon: 'FileText',
    },
  ],
  team: ['Lorem Ipsum', 'Dolor Sit', 'Amet Consectetur', 'Adipiscing Elit', 'Sed Do Eiusmod'],
}
