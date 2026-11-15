/**
 * earth + BR — static presentation content.
 * Everything measured (rain, soil moisture, temperature, crop suitability, reports)
 * comes from the backend API (see src/lib/api.ts). This file only holds fixed text:
 * data-source descriptions, glossary, landing copy and presentational metadata.
 */

/* ------------------------------------------------------------------ */
/* Data sources                                                        */
/* ------------------------------------------------------------------ */

export type SourceId = 'power' | 'smap' | 'gpm' | 'modis' | 'gaez'

export type DataSource = {
  id: SourceId
  name: string
  org: string
  measures: string
  plain: string
  resolution: string
  /** How often the source is refreshed (static text, not a date). */
  updatedAt: string
}

export const DATA_SOURCES: Record<SourceId, DataSource> = {
  power: {
    id: 'power',
    name: 'NASA POWER',
    org: 'NASA',
    measures: 'Rain, temperature, soil moisture and solar radiation',
    plain: 'Keeps more than 40 years of weather for every place: rain, temperature, soil moisture and sunshine, day by day.',
    resolution: '~50 km',
    updatedAt: 'daily, ~2 days behind',
  },
  smap: {
    id: 'smap',
    name: 'NASA SMAP',
    org: 'NASA',
    measures: 'Soil moisture',
    plain: 'A satellite that “feels” how much water is in the top few centimetres of the soil.',
    resolution: '9 km',
    updatedAt: 'every 2–3 days',
  },
  gpm: {
    id: 'gpm',
    name: 'NASA GPM',
    org: 'NASA / JAXA',
    measures: 'Rain',
    plain: 'A network of satellites that measures rain all over the world every half hour.',
    resolution: '~10 km',
    updatedAt: 'every 30 minutes',
  },
  modis: {
    id: 'modis',
    name: 'NASA MODIS',
    org: 'NASA',
    measures: 'Vegetation (NDVI)',
    plain: 'Photographs the Earth every day and shows whether plants are green and healthy.',
    resolution: '250 m',
    updatedAt: '16-day composites',
  },
  gaez: {
    id: 'gaez',
    name: 'FAO GAEZ v4',
    org: 'FAO',
    measures: 'Crop suitability and attainable yield',
    plain: 'A world map that estimates how well each crop can grow in a place, and how much it can yield, from its climate and soil.',
    resolution: '~9 km',
    updatedAt: 'fixed, 1981–2010 climate',
  },
}

/* ------------------------------------------------------------------ */
/* Glossary                                                            */
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
    plain: 'A number from 0 to 1 that shows how green and alive the plants are. Close to 1: very green. Below 0.3: struggling plants or bare soil.',
  },
  evapotranspiracao: {
    term: 'Evapotranspiration',
    plain: 'The water that “leaves” the land for the air: what evaporates from the ground plus what plants “sweat” through their leaves.',
  },
  anomalia: {
    term: 'Moisture anomaly',
    plain: 'The difference between the moisture now and what is normal for this time of year. Negative means: drier than normal.',
  },
  umidadeSolo: {
    term: 'Soil moisture',
    plain: 'How much water there is in the top metre of soil, as a share of the most it can hold: 0% is completely dry, 100% is saturated. It is not a percentage of the soil volume. The value is estimated by a NASA weather model (NASA POWER, variable GWETROOT) for an area about 50 km wide, not measured in your field.',
  },
  estresseTermico: {
    term: 'Heat stress',
    plain: 'When it is so hot that the plant stops growing properly to protect itself. For maize, this happens above about 35 °C.',
  },
  pousio: {
    term: 'Fallow',
    plain: 'Leaving the land “resting” with nothing planted. If it stays bare, it can lose soil to wind and rain.',
  },
  adubacaoVerde: {
    term: 'Green manure',
    plain: 'Plants such as velvet bean, pigeon pea and sunn hemp that are grown to feed and protect the soil, not to be harvested.',
  },
  curvaNivel: {
    term: 'Contour planting',
    plain: 'Planting in rows that follow the level of the land instead of running downhill. This holds water and soil in place.',
  },
  consorcio: {
    term: 'Intercropping',
    plain: 'Growing two crops together on the same land at the same time, so that one helps the other.',
  },
  materiaOrganica: {
    term: 'Organic matter',
    plain: 'Decomposed remains of plants and animals in the soil. It is what makes soil “alive”, loose and able to hold water.',
  },
  mediaHistorica: {
    term: 'Historical average',
    plain: 'The normal value for that month, calculated from 20 years of data (2001–2020) for your location.',
  },
  resolucao: {
    term: 'Resolution',
    plain: 'The size of the smallest “square” the satellite can see. The smaller it is, the more detail.',
  },
  talhao: {
    term: 'Field',
    plain: 'A part of the property set aside for one kind of planting.',
  },
  palhada: {
    term: 'Crop residue',
    plain: 'What is left after harvest (leaves, stalks), kept on the ground to cover it and protect it from sun and heavy rain.',
  },
}

/* ------------------------------------------------------------------ */
/* User and places                                                     */
/* ------------------------------------------------------------------ */

/** There are no user accounts: everyone uses the app as a visitor. */
export const USER = {
  firstName: 'visitor',
  fullName: 'Visitor',
  role: 'Demo access',
  initials: 'V',
}

export const STATES = ['AL', 'BA', 'CE', 'MA', 'MG', 'PB', 'PE', 'PI', 'RN', 'SE']

export const CITIES_BY_STATE: Record<string, string[]> = {
  SE: ['Aquidabã', 'Nossa Senhora da Glória', 'Poço Redondo', 'Canindé de São Francisco', 'Porto da Folha', 'Monte Alegre de Sergipe'],
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

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export type CalendarBand = {
  id: string
  label: string
  start: number // month 0–11
  end: number // inclusive
  kind: 'rain' | 'plant' | 'bare' | 'critical'
}

export type CropSegment = { crop: string; start: number; end: number; tone: 'grain' | 'legume' | 'forage' | 'cover' | 'bare' | 'cactus' }

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'

/* ------------------------------------------------------------------ */
/* Quick start                                                         */
/* ------------------------------------------------------------------ */

/**
 * Presentational metadata for the quick-start questions (icons, hints).
 * Question text and option labels shown to the user come from the API (`api.quiz()`);
 * ids and option ids here match the backend.
 */
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
    title: 'What is your biggest concern this season?',
    type: 'single',
    why: 'This tells us what to look at first in the satellite data and which strategies to put at the top.',
    options: [
      { id: 'agua', label: 'Water shortage', icon: 'Droplets' },
      { id: 'solo', label: 'Weak or eroded soil', icon: 'Mountain' },
      { id: 'calor', label: 'Heat and crop loss', icon: 'ThermometerSun' },
      { id: 'renda', label: 'Low income', icon: 'Wallet' },
    ],
  },
  {
    id: 'q2',
    title: 'How was the last season?',
    type: 'single',
    options: [
      { id: 'boa', label: 'Good', icon: 'Smile' },
      { id: 'regular', label: 'Fair', icon: 'Meh' },
      { id: 'ruim', label: 'Poor', icon: 'Frown' },
      { id: 'perdi', label: 'I lost most of it', icon: 'CloudOff' },
    ],
  },
  {
    id: 'q3',
    title: 'What do you do with the land after harvest?',
    type: 'single',
    why: 'Land with no cover in the dry season loses water and soil. This weighs heavily on erosion risk.',
    options: [
      { id: 'pousio', label: 'Leave it bare (fallow)', icon: 'Square' },
      { id: 'outra', label: 'Plant another crop', icon: 'Sprout' },
      { id: 'gado', label: 'Let cattle graze', icon: 'Beef' },
      { id: 'cobertura', label: 'Use cover (residue, green manure)', icon: 'Layers' },
    ],
  },
  {
    id: 'q4',
    title: 'Do you notice signs of erosion?',
    type: 'multi',
    note: 'You can choose more than one option.',
    why: 'Satellites cannot see small gullies. What you see on the ground completes what they show.',
    options: [
      { id: 'sulcos', label: 'Gullies in the ground', icon: 'Waves', image: 'gullies cut by runoff on sloping ground' },
      { id: 'levada', label: 'Soil washed away by rain', icon: 'CloudRain', image: 'muddy water running through the field' },
      { id: 'raizes', label: 'Exposed roots', icon: 'TreeDeciduous', image: 'tree roots showing above the ground' },
      { id: 'nao', label: "I don't notice any", icon: 'CircleCheck', image: 'covered, firm soil with no gullies' },
    ],
  },
  {
    id: 'q5',
    title: 'How much water do you have in the dry season?',
    type: 'single',
    options: [
      { id: 'nenhuma', label: 'None, rain only', icon: 'CloudSun' },
      { id: 'pouca', label: 'A little (cistern)', icon: 'Container' },
      { id: 'media', label: 'Some (well or reservoir)', icon: 'Droplet' },
      { id: 'irrigacao', label: 'I have irrigation', icon: 'ShowerHead' },
    ],
  },
  {
    id: 'q6',
    title: 'Do you raise animals?',
    type: 'single',
    why: 'If you raise animals, crops that become fodder (such as sorghum and forage cactus) are worth more to you.',
    options: [
      { id: 'gado', label: 'Yes, cattle', icon: 'Beef' },
      { id: 'caprinos', label: 'Yes, goats or sheep', icon: 'Rabbit' },
      { id: 'pequenos', label: 'Small animals', icon: 'Egg' },
      { id: 'nao', label: 'No', icon: 'Ban' },
    ],
  },
  {
    id: 'q7',
    title: 'Have you had pests or diseases that come back every year?',
    type: 'single',
    options: [
      { id: 'sempre', label: 'Yes, always', icon: 'Bug' },
      { id: 'asvezes', label: 'Sometimes', icon: 'BugOff' },
      { id: 'nao', label: 'No', icon: 'ShieldCheck' },
    ],
  },
  {
    id: 'q8',
    title: 'How do you sell your production?',
    type: 'single',
    options: [
      { id: 'proprio', label: 'Own consumption', icon: 'House' },
      { id: 'feira', label: 'Local market', icon: 'Store' },
      { id: 'coop', label: 'Cooperative or middleman', icon: 'Users' },
      { id: 'contrato', label: 'Contract or larger market', icon: 'Truck' },
    ],
  },
  {
    id: 'q9',
    title: 'How much can you invest to change your practices?',
    type: 'single',
    why: 'We only suggest changes you can afford. Many soil-protection actions cost very little.',
    options: [
      { id: 'nada', label: 'Nothing right now', icon: 'CircleSlash' },
      { id: 'pouco', label: 'A little', icon: 'Coins' },
      { id: 'moderado', label: 'A moderate amount', icon: 'Banknote' },
      { id: 'consigo', label: 'I can invest', icon: 'PiggyBank' },
    ],
  },
  {
    id: 'q10',
    title: 'What matters most to you in the coming years?',
    type: 'rank',
    note: 'Drag to reorder, or use the arrows. The first one is the most important.',
    options: [
      { id: 'agua', label: 'Saving water', icon: 'Droplets' },
      { id: 'solo', label: 'Restoring the soil', icon: 'Sprout' },
      { id: 'renda', label: 'Extra income', icon: 'Wallet' },
      { id: 'animais', label: 'Feeding the animals', icon: 'Wheat' },
    ],
  },
]

export const PROCESSING_STEPS = [
  { id: 'chuva', label: 'Rain', detail: 'NASA POWER · compared with 2001–2020' },
  { id: 'solo', label: 'Soil moisture', detail: 'NASA POWER' },
  { id: 'temp', label: 'Temperature', detail: 'NASA POWER' },
  { id: 'veg', label: 'Crop suitability', detail: 'FAO GAEZ v4' },
]

/* ------------------------------------------------------------------ */
/* Landing                                                             */
/* ------------------------------------------------------------------ */

export const LANDING = {
  problems: [
    {
      id: 'clima',
      title: 'The climate has changed',
      stat: '+75,000 km²',
      statLabel: 'more semi-arid climate per decade',
      text: 'What used to work is no longer a sure thing.',
      icon: 'ThermometerSun',
    },
    {
      id: 'assistencia',
      title: 'No one to help decide',
      stat: '9 in 10',
      statLabel: 'farms in Northeast Brazil get no technical assistance',
      text: 'Farmers choose alone, by trial and error.',
      icon: 'UserRoundX',
    },
    {
      id: 'dado',
      title: 'The data exists, but it is hard to use',
      stat: '40+ years',
      statLabel: 'of free climate data from NASA',
      text: 'But in formats that are far too technical.',
      icon: 'FileQuestionMark',
    },
  ],
  steps: [
    {
      title: 'NASA satellites watch your region',
      text: 'Rain, temperature, soil moisture and vegetation, every day.',
      icon: 'Satellite',
    },
    { title: 'You tell us about your land', text: 'Where it is, what you grow and what matters most to you.', icon: 'MessageCircle' },
    { title: 'earth + BR compares scenarios', text: 'Different rotations are scored on water, soil and crop suitability.', icon: 'GitCompare' },
    {
      title: 'You get a simple report',
      text: 'With advantages, risks and what still needs to be checked by a technician.',
      icon: 'FileText',
    },
  ],
}
