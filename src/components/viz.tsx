import { CloudRain, Droplets, Flame, Mountain, Sprout, TriangleAlert, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MONTHS_SHORT, type CalendarBand, type CropSegment, type VariableId } from '@/data/mock'
import { cx } from './ui'

/* =========================== Mapa (SVG) =========================== */

export type MapLayer = VariableId | 'none'

const PALETTES: Record<VariableId, { stops: string[]; low: string; high: string; title: string }> = {
  umidade: { stops: ['#B9814A', '#E2C68D', '#9FD0C8', '#2D7FB8'], low: 'Seco', high: 'Úmido', title: 'Umidade do solo' },
  precip: { stops: ['#F1E9D2', '#B7D6E8', '#5EA3D1', '#1F5F99'], low: 'Pouca chuva', high: 'Muita chuva', title: 'Chuva acumulada' },
  tar: { stops: ['#F7E39A', '#F2B45A', '#E0703A', '#B42318'], low: 'Mais fresco', high: 'Mais quente', title: 'Temperatura do ar' },
  tsup: { stops: ['#F7E39A', '#F2B45A', '#E0703A', '#9A1D13'], low: 'Mais fresco', high: 'Mais quente', title: 'Calor da superfície' },
  ndvi: { stops: ['#A66A3A', '#D9C27A', '#8CC46A', '#1E7A4C'], low: 'Pouca vegetação', high: 'Vegetação saudável', title: 'Vegetação (NDVI)' },
  solo: { stops: ['#EBD9B4', '#C9A06A', '#8E6239', '#5A3B20'], low: 'Pouca matéria orgânica', high: 'Mais matéria orgânica', title: 'Matéria orgânica do solo' },
}

function lerpColor(stops: string[], t: number) {
  const x = Math.max(0, Math.min(0.999, t)) * (stops.length - 1)
  const i = Math.floor(x)
  const f = x - i
  const a = parseInt(stops[i].slice(1), 16)
  const b = parseInt(stops[i + 1].slice(1), 16)
  const mix = (sh: number) => Math.round(((a >> sh) & 255) * (1 - f) + ((b >> sh) & 255) * f)
  return `rgb(${mix(16)},${mix(8)},${mix(0)})`
}

const BLOBS = [
  { x: 30, y: 30, r: 22, v: 0.55 },
  { x: 62, y: 32, r: 18, v: 0.2 },
  { x: 78, y: 54, r: 20, v: 0.35 },
  { x: 40, y: 62, r: 24, v: 0.42 },
  { x: 22, y: 56, r: 16, v: 0.7 },
  { x: 58, y: 74, r: 18, v: 0.3 },
  { x: 50, y: 46, r: 20, v: 0.5 },
]

export type Zone = { id: string; kind: 'water' | 'erosion' | 'heat'; label: string; x: number; y: number; r: number; note: string }

const ZONE_STYLE: Record<Zone['kind'], { color: string; icon: LucideIcon; short: string }> = {
  water: { color: '#1F5F99', icon: Droplets, short: 'Estresse hídrico' },
  erosion: { color: '#8A5A12', icon: Mountain, short: 'Risco de erosão' },
  heat: { color: '#B42318', icon: Flame, short: 'Área mais quente' },
}

const SX = 1.6 // escala horizontal (viewBox 160 × 100)

function scalePoints(shape: string) {
  return shape
    .split(' ')
    .map((p) => {
      const [x, y] = p.split(',').map(Number)
      return `${x * SX},${y}`
    })
    .join(' ')
}

export function PropertyMap({
  shape,
  layer = 'umidade',
  intensity = 1,
  zones = [],
  showPin,
  className,
  label,
  invertFor = [],
}: {
  shape: string
  layer?: MapLayer
  intensity?: number
  zones?: Zone[]
  showPin?: boolean
  className?: string
  label: string
  invertFor?: VariableId[]
}) {
  const uid = useId().replace(/:/g, '')
  const pts = scalePoints(shape)
  const palette = layer !== 'none' ? PALETTES[layer] : null
  const invert = layer !== 'none' && (layer === 'tar' || layer === 'tsup' || invertFor.includes(layer))
  return (
    <svg viewBox="0 0 160 100" role="img" aria-label={label} className={cx('block h-full w-full', className)} preserveAspectRatio="xMidYMid slice">
      <defs>
        <clipPath id={`clip-${uid}`}>
          <polygon points={pts} />
        </clipPath>
        <filter id={`blur-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <pattern id={`grid-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="var(--c-line)" strokeWidth="0.3" />
        </pattern>
      </defs>
      {/* Terreno de fundo */}
      <rect width="160" height="100" fill="var(--c-tint-2)" />
      <rect width="160" height="100" fill={`url(#grid-${uid})`} />
      {[18, 32, 46, 60, 74].map((o, i) => (
        <path
          key={o}
          d={`M-5 ${o + 6} C 30 ${o - 8 + i * 2}, 70 ${o + 14}, 110 ${o - 2} S 150 ${o + 10}, 170 ${o}`}
          fill="none"
          stroke="var(--c-muted)"
          strokeOpacity="0.22"
          strokeWidth="0.45"
        />
      ))}
      <path d="M-5 92 C 40 80, 70 96, 120 84 S 160 70, 170 74" fill="none" stroke="#5EA3D1" strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M118 -5 L 104 40 L 112 105" fill="none" stroke="var(--c-muted)" strokeOpacity="0.35" strokeWidth="1.1" strokeDasharray="3 2" />

      {/* Camada de dados */}
      {palette && (
        <g clipPath={`url(#clip-${uid})`}>
          <rect width="160" height="100" fill={lerpColor(palette.stops, invert ? 0.45 : 0.4)} />
          <g filter={`url(#blur-${uid})`}>
            {BLOBS.map((b, i) => {
              let v = b.v * intensity
              if (invert) v = 1 - v * 0.9
              return <circle key={i} cx={b.x * SX} cy={b.y} r={b.r} fill={lerpColor(palette.stops, v)} opacity="0.95" />
            })}
          </g>
        </g>
      )}
      <polygon points={pts} fill={palette ? 'none' : 'var(--c-tint)'} stroke="var(--c-deep)" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points={pts} fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="0.35" strokeDasharray="1.5 1.5" />

      {zones.map((z) => {
        const st = ZONE_STYLE[z.kind]
        return (
          <g key={z.id}>
            <circle cx={z.x * SX} cy={z.y} r={z.r} fill={st.color} fillOpacity="0.14" stroke={st.color} strokeWidth="0.8" strokeDasharray="2 1.4" />
            <circle cx={z.x * SX} cy={z.y} r="3.2" fill="#fff" stroke={st.color} strokeWidth="0.9" />
            <circle cx={z.x * SX} cy={z.y} r="1.4" fill={st.color} />
          </g>
        )
      })}

      {showPin && (
        <g transform="translate(80 44)">
          <ellipse cx="0" cy="9" rx="4" ry="1.4" fill="#000" opacity="0.2" />
          <path d="M0 9 C -5 2 -6 -1 -6 -3 A 6 6 0 1 1 6 -3 C 6 -1 5 2 0 9Z" fill="var(--c-primary)" stroke="#fff" strokeWidth="0.8" />
          <circle cx="0" cy="-3" r="2.2" fill="#fff" />
        </g>
      )}
    </svg>
  )
}

export function MapLegend({ layer, zones = [], className }: { layer: MapLayer; zones?: Zone[]; className?: string }) {
  const palette = layer !== 'none' ? PALETTES[layer] : null
  const invert = layer === 'tar' || layer === 'tsup'
  const kinds = Array.from(new Set(zones.map((z) => z.kind)))
  return (
    <div className={cx('flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]', className)}>
      {palette && (
        <div className="min-w-56">
          <p className="mb-1 font-bold text-ink">{palette.title}</p>
          <div className="h-3 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${(invert ? palette.stops : palette.stops).join(',')})` }} />
          <div className="mt-1 flex justify-between text-muted">
            <span>{palette.low}</span>
            <span>{palette.high}</span>
          </div>
        </div>
      )}
      {kinds.map((k) => {
        const st = ZONE_STYLE[k]
        const Icon = st.icon
        return (
          <span key={k} className="inline-flex items-center gap-2 text-ink">
            <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-dashed" style={{ borderColor: st.color, color: st.color }}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            {st.short}
          </span>
        )
      })}
      <span className="inline-flex items-center gap-2 text-ink">
        <span className="h-0 w-6 border-t-2 border-deep" aria-hidden /> Limite da propriedade
      </span>
    </div>
  )
}

export { ZONE_STYLE }

/* ============================ Gráficos ============================ */

const tooltipStyle = {
  background: 'var(--c-surface)',
  border: '1px solid var(--c-line)',
  borderRadius: 12,
  color: 'var(--c-ink)',
  fontFamily: 'Atkinson Hyperlegible, sans-serif',
  fontSize: 15,
}

export function RainChart({ data }: { data: { month: string; rain: number; avg: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="var(--c-line)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={{ stroke: 'var(--c-line)' }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={false} unit=" mm" width={64} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${v} mm`, n]} labelStyle={{ fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 15, color: 'var(--c-ink)', paddingTop: 8 }} iconType="plainline" />
          <Line isAnimationActive={false} type="monotone" dataKey="avg" name="Média histórica (20 anos)" stroke="var(--c-muted)" strokeWidth={2} strokeDasharray="6 5" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="rain" name="Chuva neste ano" stroke="var(--c-primary)" strokeWidth={3} dot={{ r: 3.5, fill: 'var(--c-primary)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SeriesChart({
  value,
  reference,
  unit,
  valueName,
  refName,
  cursor,
  height = 'h-64',
  decimals = 0,
}: {
  value: number[]
  reference: number[]
  unit: string
  valueName: string
  refName: string
  cursor?: number
  height?: string
  decimals?: number
}) {
  const data = MONTHS_SHORT.map((m, i) => ({ month: m, v: value[i], r: reference[i] }))
  const fmt = (n: number) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${unit ? ` ${unit}` : ''}`
  return (
    <div className={cx(height, 'w-full')}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -4 }}>
          <CartesianGrid stroke="var(--c-line)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={{ stroke: 'var(--c-line)' }} />
          <YAxis tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={false} width={56} tickFormatter={(n) => Number(n).toLocaleString('pt-BR')} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fmt(Number(v)), n]} labelStyle={{ fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 15, paddingTop: 8 }} iconType="plainline" />
          {cursor !== undefined && <ReferenceLine x={MONTHS_SHORT[cursor]} stroke="var(--c-warn)" strokeWidth={2} />}
          <Line isAnimationActive={false} type="monotone" dataKey="r" name={refName} stroke="var(--c-muted)" strokeWidth={2} strokeDasharray="6 5" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="v" name={valueName} stroke="var(--c-primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--c-primary)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ====================== Linhas do tempo (12 meses) ====================== */

function splitWrap<T extends { start: number; end: number }>(s: T): T[] {
  return s.start <= s.end ? [s] : [{ ...s, end: 11 }, { ...s, start: 0 }]
}

const CROP_TONE: Record<CropSegment['tone'], string> = {
  grain: 'bg-[#F2D27A] text-[#3D2E06]',
  legume: 'bg-[#9ED7AE] text-[#0F3D2A]',
  forage: 'bg-[#8FC9C4] text-[#0B3533]',
  cover: 'bg-[#CDB48A] text-[#3B2A12]',
  cactus: 'bg-[#B9CB82] text-[#2D3510]',
  bare: 'bg-[repeating-linear-gradient(135deg,#F4D3CF_0_6px,#E9B6AF_6px_8px)] text-[#7A1A12]',
}

export function MonthAxis({ highlight, className, initials }: { highlight?: number; className?: string; initials?: boolean }) {
  return (
    <div className={cx('grid grid-cols-12 text-center text-[12px] text-muted sm:text-[13px]', className)} aria-hidden>
      {MONTHS_SHORT.map((m, i) => (
        <span key={m} className={cx('py-1', i === highlight && 'font-bold text-primary')}>
          {initials ? m[0].toUpperCase() : m}
        </span>
      ))}
    </div>
  )
}

export function CropTimeline({ segments, compact }: { segments: CropSegment[]; compact?: boolean }) {
  // Distribui segmentos sobrepostos em faixas.
  const lanes: CropSegment[][] = []
  for (const seg of segments) {
    const parts = splitWrap(seg)
    const fits = (lane: CropSegment[]) => lane.every((o) => splitWrap(o).every((op) => parts.every((p) => p.end < op.start || p.start > op.end)))
    const lane = lanes.find(fits)
    if (lane) lane.push(seg)
    else lanes.push([seg])
  }
  return (
    <div>
      <MonthAxis initials={compact} />
      <div className="relative space-y-1.5 rounded-[8px] bg-tint-2 p-1.5">
        <div className="pointer-events-none absolute inset-1.5 grid grid-cols-12" aria-hidden>
          {MONTHS_SHORT.map((m) => (
            <span key={m} className="border-l border-line first:border-l-0" />
          ))}
        </div>
        {lanes.map((lane, li) => (
          <div key={li} className="relative grid h-9 grid-cols-12 gap-0">
            {lane.flatMap((seg) =>
              splitWrap(seg).map((p, pi) => (
                <div
                  key={`${seg.crop}-${pi}`}
                  title={seg.crop}
                  className={cx('z-[1] flex items-center overflow-hidden rounded-[6px] px-2 text-[13px] font-bold leading-tight', CROP_TONE[seg.tone])}
                  style={{ gridColumn: `${p.start + 1} / ${p.end + 2}` }}
                >
                  <span className="truncate">{p.end - p.start >= 1 || !compact ? seg.crop : ''}</span>
                </div>
              )),
            )}
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted">
        {segments.map((s) => (
          <li key={s.crop} className="inline-flex items-center gap-1.5">
            <span className={cx('size-3 rounded-[3px]', CROP_TONE[s.tone])} aria-hidden />
            {s.crop} <span className="tabular">({MONTHS_SHORT[s.start]}–{MONTHS_SHORT[s.end]})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const BAND_STYLE: Record<CalendarBand['kind'], { cls: string; icon: LucideIcon }> = {
  rain: { cls: 'bg-[#B7D6E8] text-[#123E66]', icon: CloudRain },
  plant: { cls: 'bg-primary text-on-primary', icon: Sprout },
  critical: { cls: 'bg-warn text-[#2B1C04]', icon: TriangleAlert },
  bare: { cls: 'bg-[repeating-linear-gradient(135deg,#F4D3CF_0_6px,#E9B6AF_6px_8px)] text-[#7A1A12] ring-1 ring-crit/50', icon: Mountain },
}

export function LandCalendar({ bands, today }: { bands: CalendarBand[]; today: number }) {
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-[200px_minmax(0,1fr)]">
        <span className="hidden md:block" />
        <MonthAxis highlight={today} />
      </div>
      <ul className="space-y-3">
        {bands.map((b) => {
          const st = BAND_STYLE[b.kind]
          const Icon = st.icon
          return (
            <li key={b.id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-1 md:grid-cols-[200px_minmax(0,1fr)] md:gap-3">
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
                <Icon className={cx('size-4 shrink-0', b.kind === 'bare' ? 'text-crit' : b.kind === 'critical' ? 'text-warn' : 'text-primary')} aria-hidden />
                {b.label}
              </span>
              <div className="relative grid h-8 grid-cols-12 rounded-[6px] bg-tint-2">
                <div
                  className="pointer-events-none absolute inset-y-[-4px] z-[2] w-0.5 bg-ink/70"
                  style={{ left: `calc(${((today + 0.5) / 12) * 100}% - 1px)` }}
                  aria-hidden
                />
                {splitWrap(b).map((p, i) => (
                  <div key={i} className={cx('flex items-center rounded-[6px] px-2 text-[12px] font-bold', st.cls)} style={{ gridColumn: `${p.start + 1} / ${p.end + 2}` }}>
                    <span className="sr-only">
                      {b.label}: {MONTHS_SHORT[b.start]} a {MONTHS_SHORT[b.end]}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-[14px] text-muted">
        <span className="inline-block h-4 w-0.5 bg-ink/70" aria-hidden /> Hoje ({MONTHS_SHORT[today]})
      </p>
    </div>
  )
}

/** Notas de 1 a 5 em ícones. */
export function ScoreDots({ value, icon: Icon, label }: { value: number; icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] text-ink">{label}</span>
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: nota ${value} de 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} className={cx('size-[18px]', n <= value ? 'text-primary' : 'text-line')} fill={n <= value ? 'currentColor' : 'none'} strokeWidth={n <= value ? 1.5 : 2} aria-hidden />
        ))}
        <span className="ml-1.5 w-7 text-right text-[14px] font-bold text-muted tabular">{value}/5</span>
      </span>
    </div>
  )
}
