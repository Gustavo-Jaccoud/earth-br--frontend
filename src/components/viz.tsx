import { Check, CloudRain, Sprout, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MONTHS_SHORT, type CalendarBand, type CropSegment } from '@/data/mock'
import { api, type LonLat, type MapLayer, type MapLayerId, type MonthlyValue } from '@/lib/api'
import LeafletMap from './LeafletMap'
import { ringsDifferVisibly } from '@/lib/geo'
import { cx } from './ui'

/* ============================== Map ============================== */

const LAYER_IDS: MapLayerId[] = ['soil_moisture', 'precipitation', 'ndvi']
const LAYER_TITLE: Record<MapLayerId, string> = { soil_moisture: 'Soil moisture', precipitation: 'Rainfall', ndvi: 'Vegetation (NDVI)' }

/** "2026-09" → "Sep 2026" (or "Sep '26" when `short`). Anything else is returned unchanged. */
export function monthLabel(label: string, short = false) {
  const m = /^(\d{4})-(\d{2})/.exec(label)
  if (!m) return label
  const month = new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
  return short ? `${month} '${m[1].slice(2)}` : `${month} ${m[1]}`
}

/** Colour key of a backend map layer plus the field-outline entry. */
export function MapLegend({ title, unit, legend = [], className }: { title?: string; unit?: string; legend?: { color: string; label: string }[]; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px]', className)}>
      {title && (
        <span className="font-bold text-ink">
          {title}
          {unit ? ` (${unit})` : ''}
        </span>
      )}
      {legend.map((l) => (
        <span key={l.label} className="inline-flex items-center gap-1.5 text-ink">
          <span className="size-3.5 rounded-[3px] ring-1 ring-line" style={{ background: l.color }} aria-hidden /> {l.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-2 text-ink">
        <span className="h-0 w-6 border-t-[3px] border-[#2f7d32]" aria-hidden /> Field outline
      </span>
    </div>
  )
}

/**
 * Interactive map of the field. Satellite layers are shown only when the backend has them
 * (`/maps/{layer}` answers 404 until the satellite pipeline runs) — otherwise just the outline.
 * `polygon` is the real boundary; `reference` is the server's query area (the rectangle enclosing the boundary), drawn dashed (with a
 * caption) only when it can be told apart from the boundary.
 */
export function FieldMap({ polygon, reference, label, className, coords }: { polygon: LonLat[]; reference?: LonLat[]; label: string; className?: string; coords?: string }) {
  const [layers, setLayers] = useState<Partial<Record<MapLayerId, MapLayer>>>({})
  const [layerId, setLayerId] = useState<MapLayerId | null>(null)
  const [period, setPeriod] = useState('')

  useEffect(() => {
    let alive = true
    void Promise.allSettled(LAYER_IDS.map((id) => api.mapLayer(id))).then((results) => {
      if (!alive) return
      const found: Partial<Record<MapLayerId, MapLayer>> = {}
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.periods.length > 0) found[LAYER_IDS[i]] = r.value
      })
      setLayers(found)
      setLayerId(LAYER_IDS.find((id) => found[id]) ?? null)
    })
    return () => {
      alive = false
    }
  }, [])

  const showReference = !!reference && ringsDifferVisibly(polygon, reference)
  const available = LAYER_IDS.filter((id) => layers[id])
  const layer = layerId ? layers[layerId] : undefined
  const current = layer ? (layer.periods.find((p) => p.period === period) ?? layer.periods[layer.periods.length - 1]) : undefined
  const chip = (on: boolean) => cx('inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[15px] font-bold', on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary/50')

  return (
    <div className={className}>
      {available.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Map layers" className="flex flex-wrap gap-2">
            {available.map((id) => (
              <button key={id} type="button" aria-pressed={id === layerId} onClick={() => setLayerId(id)} className={chip(id === layerId)}>
                {id === layerId && <Check className="size-4" strokeWidth={3} aria-hidden />} {LAYER_TITLE[id]}
              </button>
            ))}
            <button type="button" aria-pressed={layerId === null} onClick={() => setLayerId(null)} className={chip(layerId === null)}>
              {layerId === null && <Check className="size-4" strokeWidth={3} aria-hidden />} Outline only
            </button>
          </div>
          {layer && current && layer.periods.length > 1 && (
            <select
              aria-label="Month shown on the map"
              value={current.period}
              onChange={(e) => setPeriod(e.target.value)}
              className="ml-auto min-h-11 rounded-full border-2 border-line bg-surface px-4 text-[15px] text-ink focus:border-primary focus:outline-none"
            >
              {layer.periods.map((p) => (
                <option key={p.period} value={p.period}>
                  {monthLabel(p.period)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] border border-line">
        <LeafletMap polygon={polygon} reference={showReference ? reference : null} overlay={current ? { url: api.staticUrl(current.url), bounds: current.bounds } : null} label={label} className="size-full" />
        {coords && <span className="pointer-events-none absolute bottom-10 left-2 z-[1] rounded-full bg-surface/90 px-2.5 py-1 text-[13px] text-muted tabular">{coords}</span>}
      </div>
      {showReference && (
        <p className="mt-3 flex items-start gap-2.5 text-[14px] text-muted">
          <svg width="28" height="14" viewBox="0 0 28 14" className="mt-1 shrink-0" aria-hidden>
            <rect x="1" y="1" width="26" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
          <span>Dashed rectangle: the reference area used for NASA POWER climate data. It is calculated from your field and encloses all of it. The solid line is the real boundary.</span>
        </p>
      )}
      {layer && layerId && current && <MapLegend className="mt-4" title={`${LAYER_TITLE[layerId]} · ${monthLabel(current.period)}`} unit={layer.unit} legend={layer.legend} />}
    </div>
  )
}

/* ============================= Charts ============================= */

const tooltipStyle = {
  background: 'var(--c-surface)',
  border: '1px solid var(--c-line)',
  borderRadius: 12,
  color: 'var(--c-ink)',
  fontFamily: 'Atkinson Hyperlegible, sans-serif',
  fontSize: 15,
}

/** Monthly value vs. the historical normal, straight from `api.monthlyClimate`. */
export function SeriesChart({
  months,
  unit,
  valueName,
  refName,
  height = 'h-64',
  decimals = 0,
}: {
  months: MonthlyValue[]
  unit: string
  valueName: string
  refName: string
  height?: string
  decimals?: number
}) {
  const data = months.map((m) => ({ month: m.complete ? monthLabel(m.label, true) : `${monthLabel(m.label, true)}*`, v: m.value, r: m.normal }))
  const num = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  return (
    <div className={cx(height, 'w-full')}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -4 }}>
          <CartesianGrid stroke="var(--c-line)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={{ stroke: 'var(--c-line)' }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--c-muted)', fontSize: 13 }} tickLine={false} axisLine={false} width={56} tickFormatter={(n) => Number(n).toLocaleString('en-US')} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${num(Number(v))} ${unit}`, n]} labelStyle={{ fontWeight: 700 }} />
          <Legend wrapperStyle={{ fontSize: 15, color: 'var(--c-ink)', paddingTop: 8 }} iconType="plainline" />
          <Line isAnimationActive={false} type="monotone" dataKey="r" name={refName} stroke="var(--c-muted)" strokeWidth={2} strokeDasharray="6 5" dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey="v" name={valueName} stroke="var(--c-primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--c-primary)' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ======================== Timelines (12 months) ======================== */

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
  // Spread overlapping segments over separate lanes.
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

const BAND_STYLE: Partial<Record<CalendarBand['kind'], { cls: string; icon: LucideIcon }>> = {
  rain: { cls: 'bg-[#B7D6E8] text-[#123E66]', icon: CloudRain },
  plant: { cls: 'bg-primary text-on-primary', icon: Sprout },
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
          const st = BAND_STYLE[b.kind] ?? BAND_STYLE.rain!
          const Icon = st.icon
          return (
            <li key={b.id} className="grid grid-cols-[minmax(0,1fr)] items-center gap-1 md:grid-cols-[200px_minmax(0,1fr)] md:gap-3">
              <span className="inline-flex items-center gap-2 text-[15px] font-bold text-ink">
                <Icon className="size-4 shrink-0 text-primary" aria-hidden />
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
                      {b.label}: {MONTHS_SHORT[b.start]} to {MONTHS_SHORT[b.end]}
                    </span>
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-[14px] text-muted">
        <span className="inline-block h-4 w-0.5 bg-ink/70" aria-hidden /> Today ({MONTHS_SHORT[today]})
      </p>
    </div>
  )
}

/** Scores from 1 to 5 as icons. */
export function ScoreDots({ value, icon: Icon, label }: { value: number; icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] text-ink">{label}</span>
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${label}: score ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} className={cx('size-[18px]', n <= value ? 'text-primary' : 'text-line')} fill={n <= value ? 'currentColor' : 'none'} strokeWidth={n <= value ? 1.5 : 2} aria-hidden />
        ))}
        <span className="ml-1.5 w-7 text-right text-[14px] font-bold text-muted tabular">{value}/5</span>
      </span>
    </div>
  )
}
