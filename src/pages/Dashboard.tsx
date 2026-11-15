import { ArrowRight, CalendarDays, ChevronDown, CircleCheck, CircleHelp, FileText, Map as MapIcon, OctagonAlert, ScanSearch, TriangleAlert, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MONTHS_LONG, USER, type CalendarBand } from '@/data/mock'
import { ButtonLink, Card, ErrorState, IndicatorCard, IndicatorSkeleton, InfoTip, Skeleton, SourceBadge, SupportNote, cx, type Indicator } from '@/components/ui'
import { Tour, markTourSeen, tourSeen, type TourCloseReason, type TourStep } from '@/components/Tour'
import { FieldMap, LandCalendar, SeriesChart, monthLabel } from '@/components/viz'
import { ApiError, api, type Crop, type DryYears, type MonthlyClimate, type MonthlyValue, type MonthlyVariable, type Signal, type SignalColor, type Signals } from '@/lib/api'
import { Link } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

/* ------------------------- shared data helpers ------------------------- */

type ApiState<T> = { status: 'idle' | 'loading' | 'ready' | 'error'; data: T | null; error: unknown }

/**
 * Runs `load` whenever `key` changes (and on `retry`). A null `key` means "nothing to load yet".
 * `load` may change identity between renders; only `key` triggers a new request.
 */
export function useApi<T>(key: string | number | null, load: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ status: key === null ? 'idle' : 'loading', data: null, error: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (key === null) {
      setState({ status: 'idle', data: null, error: null })
      return
    }
    let alive = true
    setState({ status: 'loading', data: null, error: null })
    load().then(
      (data) => alive && setState({ status: 'ready', data, error: null }),
      (error: unknown) => alive && setState({ status: 'error', data: null, error }),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])
  return { ...state, retry: () => setAttempt((a) => a + 1) }
}

/** User-readable reason for a failed request. */
export function errorMessage(e: unknown) {
  if (e instanceof ApiError && e.status === 503) return 'NASA POWER, the climate data service, is unavailable right now. Please try again in a few minutes.'
  return e instanceof Error ? e.message : 'Unexpected error.'
}

/** `ErrorState` plus the specific reason (the shared component has a fixed text). */
export function RequestError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="space-y-2">
      <ErrorState onRetry={onRetry} />
      <p className="text-[15px] text-muted">{typeof error === 'string' ? error : errorMessage(error)}</p>
    </div>
  )
}

/** Shown when the account has no property yet. */
export function NoProperty() {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
        <MapIcon className="size-6" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-bold text-heading">No property registered yet</p>
        <p className="text-ink">Add your property so we can fetch the climate and crop data for your land.</p>
      </div>
      <ButtonLink to="/propriedades/nova">Add a property</ButtonLink>
    </Card>
  )
}

export const num = (n: number, decimals = 0) => n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })

export function monthsOf(climate: MonthlyClimate, variable: MonthlyVariable) {
  return climate.variables.find((v) => v.variable === variable)?.months ?? []
}

type FullMonth = MonthlyValue & { value: number; normal: number }
const hasBoth = (m: MonthlyValue): m is FullMonth => m.value !== null && m.normal !== null
/** Complete months that have both a value and a normal, oldest first. */
export const completeMonths = (months: MonthlyValue[]) => months.filter((m) => m.complete).filter(hasBoth)

const TONE: Record<SignalColor, Indicator['status']> = { green: 'ok', yellow: 'warn', red: 'crit' }
const SEVERITY: Record<SignalColor, number> = { green: 0, yellow: 1, red: 2 }

function trendOf(months: MonthlyValue[]): Indicator['trend'] {
  const done = completeMonths(months)
  if (done.length < 2) return 'flat'
  const [prev, last] = done.slice(-2)
  const change = last.value - prev.value
  if (Math.abs(change) <= Math.max(Math.abs(prev.value) * 0.05, 0.1)) return 'flat'
  return change > 0 ? 'up' : 'down'
}

function deviationLabel(s: Signal) {
  if (s.deviation_pct === null) return s.color === 'green' ? 'Within normal' : 'Outside normal'
  const pct = Math.round(Math.abs(s.deviation_pct))
  if (pct === 0) return 'At the average'
  return `${pct}% ${s.deviation_pct < 0 ? 'below' : 'above'} average`
}

function buildIndicators(signals: Signals, climate: MonthlyClimate): Indicator[] {
  const out: Indicator[] = []
  const rain = signals.signals.find((s) => s.kind === 'rain')
  if (rain) {
    out.push({
      id: 'rain',
      label: `Rain in the last ${rain.window_days} days`,
      value: num(rain.value, 1),
      unit: rain.unit,
      comparison: `Normal for this time of year: ${num(rain.normal, 1)} ${rain.unit}`,
      trend: trendOf(monthsOf(climate, 'rain')),
      status: TONE[rain.color],
      statusLabel: deviationLabel(rain),
      sources: ['power'],
      help: 'mediaHistorica',
    })
  }
  const soil = signals.signals.find((s) => s.kind === 'soil_moisture')
  if (soil) {
    out.push({
      id: 'soil',
      label: `Root-zone soil moisture (last ${soil.window_days} days)`,
      value: num(soil.value * 100),
      unit: '% of saturation',
      comparison: `Normal for this time of year: ${num(soil.normal * 100)}% of saturation`,
      trend: trendOf(monthsOf(climate, 'soil_moisture')),
      status: TONE[soil.color],
      statusLabel: deviationLabel(soil),
      sources: ['power'],
      help: 'umidadeSolo',
    })
  }
  const tempMonths = monthsOf(climate, 'temperature')
  const temp = completeMonths(tempMonths).at(-1)
  if (temp) {
    const diff = temp.value - temp.normal
    out.push({
      id: 'temperature',
      label: `Air temperature (${monthLabel(temp.label)} average)`,
      value: num(temp.value, 1),
      unit: '°C',
      comparison: `Normal for the month: ${num(temp.normal, 1)} °C`,
      trend: trendOf(tempMonths),
      status: diff >= 1.5 ? 'warn' : 'ok',
      statusLabel: Math.abs(diff) < 0.5 ? 'Close to normal' : `${num(Math.abs(diff), 1)} °C ${diff > 0 ? 'above' : 'below'} normal`,
      sources: ['power'],
      help: 'mediaHistorica',
    })
  }
  return out
}

/** Calendar bands backed by data: rainy season (dry-years endpoint) and the current crop's planting month. */
function buildCalendar(dry: DryYears, crop: Crop | undefined): CalendarBand[] {
  const bands: CalendarBand[] = []
  const wet = new Set(dry.rainy_season_months)
  if (wet.size > 0 && wet.size < 12) {
    const prev = (m: number) => (m === 1 ? 12 : m - 1)
    const next = (m: number) => (m === 12 ? 1 : m + 1)
    const start = dry.rainy_season_months.find((m) => !wet.has(prev(m)))
    const end = dry.rainy_season_months.find((m) => !wet.has(next(m)))
    if (start !== undefined && end !== undefined) bands.push({ id: 'rain', label: 'Rainy season', start: start - 1, end: end - 1, kind: 'rain' })
  }
  if (crop) bands.push({ id: 'plant', label: `Planting window (${crop.name})`, start: crop.planting_month - 1, end: crop.planting_month - 1, kind: 'plant' })
  return bands
}

function rainSummary(months: MonthlyValue[]) {
  const done = completeMonths(months)
  if (done.length === 0) return null
  const below = done.filter((m) => m.value < m.normal).length
  const total = done.reduce((a, m) => a + m.value, 0)
  const normal = done.reduce((a, m) => a + m.normal, 0)
  const pct = normal > 0 ? Math.round(((total - normal) / normal) * 100) : null
  return { below, count: done.length, total, pct }
}

const ALERT_STYLE: Record<SignalColor, { box: string; icon: typeof TriangleAlert; iconCls: string; text: string; divider: string; prefix: string }> = {
  red: { box: 'border-crit bg-crit-bg', icon: OctagonAlert, iconCls: 'text-crit', text: 'text-crit-ink', divider: 'border-crit/30', prefix: 'Alert: ' },
  yellow: { box: 'border-warn bg-warn-bg', icon: TriangleAlert, iconCls: 'text-warn', text: 'text-warn-ink', divider: 'border-warn/30', prefix: 'Warning: ' },
  green: { box: 'border-ok bg-ok-bg', icon: CircleCheck, iconCls: 'text-ok', text: 'text-ok-ink', divider: 'border-ok/30', prefix: '' },
}

/* ------------------------------ first-access tour ------------------------------ */

const TOUR_KEY = 'earth-br-tour-v1'

/** Targets are `data-tour` names on this page, except the assistant button, which lives in the app shell. */
const TOUR_STEPS: TourStep[] = [
  { target: 'alert', title: 'Start here: the main alert', text: 'The most important thing about your land right now, based on recent rain and soil moisture. Use Details to see each signal.' },
  { target: 'indicators', title: 'Key indicators', text: 'Recent rain, soil moisture and temperature, each compared with what is normal for this time of year. The ? explains each term.' },
  { target: 'rain', title: 'Rain month by month', text: 'The last 12 months of rain against the historical average, with a short summary below the chart.' },
  { target: 'map', title: 'Property map', text: 'The outline of your field. Drag to move it and use the buttons to zoom.' },
  { target: 'shortcuts', title: 'Where to go next', text: 'Quick start asks a few simple questions (about 4 minutes). Analyze my data opens the maps and charts in detail.' },
  { target: 'button[aria-label="Open the assistant"]', title: 'Ask the assistant', text: 'Open it at any time to ask about your land. It is a demo with pre-written answers built from your property\u2019s data.' },
]

type DashboardData = { signals: Signals; climate: MonthlyClimate; dry: DryYears; crops: Crop[] }

export default function Dashboard() {
  const { activeProperty, reports, status, error, reload } = useStore()
  const plotId = activeProperty?.plotId ?? null
  const req = useApi<DashboardData>(plotId, async () => {
    const id = plotId as number
    const [signals, climate, dry, crops] = await Promise.all([api.signals(id), api.monthlyClimate(id, 12), api.dryYears(id), api.crops()])
    return { signals, climate, dry, crops }
  })
  const [alertOpen, setAlertOpen] = useState(false)

  // The tour starts by itself once, on the first visit, and only when the real content is on screen.
  const [tourOpen, setTourOpen] = useState(false)
  const contentReady = Boolean(activeProperty && req.data)
  useEffect(() => {
    if (!contentReady || tourSeen(TOUR_KEY)) return
    const t = window.setTimeout(() => setTourOpen(true), 600)
    return () => window.clearTimeout(t)
  }, [contentReady])
  const closeTour = (reason: TourCloseReason) => {
    setTourOpen(false)
    if (reason === 'empty') return
    markTourSeen(TOUR_KEY)
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const today = new Date()
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const monthName = MONTHS_LONG[today.getMonth()]

  const header = (subtitle?: string) => (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        <p className="text-[16px] text-muted first-letter:uppercase">{dateLabel}</p>
        {contentReady && (
          <button
            type="button"
            onClick={() => setTourOpen(true)}
            className="no-print -mx-2 inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-[15px] text-muted underline-offset-4 hover:bg-tint hover:text-primary hover:underline"
          >
            <CircleHelp className="size-[18px]" aria-hidden /> Show the tour again
          </button>
        )}
      </div>
      <h1 className="text-[30px] sm:text-[40px]">
        {greeting()}, {USER.firstName}. <span className="text-primary">See how your land is doing today.</span>
      </h1>
      {subtitle && <p className="text-lg text-muted">{subtitle}</p>}
    </header>
  )

  if (!activeProperty) {
    return (
      <div className="space-y-8">
        {header()}
        {status === 'loading' && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading your properties">
            {[1, 2, 3].map((i) => (
              <IndicatorSkeleton key={i} />
            ))}
          </div>
        )}
        {status === 'error' && <RequestError error={error ?? 'Could not load your properties.'} onRetry={() => void reload()} />}
        {status === 'ready' && <NoProperty />}
      </div>
    )
  }

  const data = req.data
  const loading = req.status === 'loading' || req.status === 'idle'
  const crop = data?.crops.find((c) => c.id === activeProperty.currentCrop)
  const last = reports.find((r) => r.plot_id === activeProperty.plotId)

  const sorted = data ? [...data.signals.signals].sort((a, b) => SEVERITY[b.color] - SEVERITY[a.color]) : []
  const worst = sorted[0]
  const calm = !worst || worst.color === 'green'
  const alert = ALERT_STYLE[worst?.color ?? 'green']
  const AlertIcon = alert.icon
  const indicators = data ? buildIndicators(data.signals, data.climate) : []
  const rainMonths = data ? monthsOf(data.climate, 'rain') : []
  const partial = rainMonths.find((m) => !m.complete)
  const summary = rainSummary(rainMonths)
  const bands = data ? buildCalendar(data.dry, crop) : []
  const cropLabel = crop?.name ?? activeProperty.currentCrop

  return (
    <div className="space-y-8">
      {header([activeProperty.name, `${activeProperty.city} – ${activeProperty.state}`, `${num(activeProperty.areaHa, 1)} ha`, cropLabel].filter(Boolean).join(' · '))}

      {req.status === 'error' && <RequestError error={req.error} onRetry={req.retry} />}

      {/* Main alert */}
      {loading && <Skeleton className="h-20 w-full rounded-[12px]" />}
      {data && (
        <section aria-label="Main alert" data-tour="alert" className={cx('rounded-[12px] border-l-[6px]', alert.box)}>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <AlertIcon className={cx('size-7 shrink-0', alert.iconCls)} aria-hidden />
            <div className="flex-1">
              <p className={cx('text-[18px] font-bold', alert.text)}>
                <span className="sr-only">{alert.prefix}</span>
                {calm ? 'No alerts right now: rain and soil moisture are within the normal range for this time of year.' : worst.message}
              </p>
              <p className="mt-1 text-[14px] text-ink">
                Data up to {formatDate(data.signals.reference_date)}. NASA POWER data arrives about 2 days behind.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={alertOpen}
              aria-controls="alert-detail"
              onClick={() => setAlertOpen((o) => !o)}
              className={cx('inline-flex min-h-12 items-center gap-1.5 self-start rounded-full px-4 font-bold underline underline-offset-4 hover:bg-ink/5 sm:self-auto', alert.text)}
            >
              Details <ChevronDown className={cx('size-5 transition-transform', alertOpen && 'rotate-180')} aria-hidden />
            </button>
          </div>
          {alertOpen && (
            <div id="alert-detail" className={cx('animate-rise space-y-3 border-t px-5 py-4 sm:pl-[60px]', alert.divider)}>
              <ul className="max-w-3xl space-y-2 text-[17px] text-ink">
                {sorted.map((s) => (
                  <li key={s.kind}>
                    <strong>{s.kind === 'rain' ? 'Rain' : 'Soil moisture'}</strong> (last {s.window_days} days): {s.message}
                  </li>
                ))}
              </ul>
              <SourceBadge ids={['power']} />
            </div>
          )}
        </section>
      )}

      {/* Indicators */}
      {req.status !== 'error' && (
        <section aria-labelledby="ind-title" data-tour="indicators">
          <h2 id="ind-title" className="sr-only">
            Indicators for your land
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{loading ? [1, 2, 3].map((i) => <IndicatorSkeleton key={i} />) : indicators.map((i) => <IndicatorCard key={i.id} ind={i} />)}</div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Rain chart */}
        {req.status !== 'error' && (
          <div data-tour="rain">
          <Card className="h-full p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-1 text-[22px]">
                  Rain month by month <InfoTip term="mediaHistorica" />
                </h2>
                <p className="text-muted">Last 12 months compared with the {data?.climate.normal_period.replace('-', '–') ?? '2001–2020'} average</p>
              </div>
              <SourceBadge ids={['power']} />
            </div>
            {data ? <SeriesChart months={rainMonths} unit="mm" valueName="Rain" refName="Historical average" height="h-72" /> : <Skeleton className="h-72 w-full" />}
            {data && summary && (
              <p className="mt-3 rounded-[8px] bg-tint-2 p-3 text-[16px] text-ink">
                <strong>In short:</strong> it rained less than average in {summary.below} of the last {summary.count} complete months.
                {summary.pct !== null && (
                  <>
                    {' '}
                    Over that period the total was {num(summary.total)} mm,{' '}
                    <strong>{summary.pct === 0 ? 'in line with' : `${Math.abs(summary.pct)}% ${summary.pct < 0 ? 'below' : 'above'}`}</strong> the average.
                  </>
                )}
              </p>
            )}
            {data && partial && (
              <p className="mt-2 text-[14px] text-muted">
                * {monthLabel(partial.label)} is still in progress: it only has data up to {formatDate(data.climate.reference_date)}, so its total is partial.
              </p>
            )}
          </Card>
          </div>
        )}

        {/* Map */}
        <div data-tour="map" className={cx(req.status === 'error' && 'xl:col-span-2')}>
        <Card className="flex h-full flex-col overflow-hidden p-6">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-[22px]">
              <MapIcon className="size-5 text-primary" aria-hidden /> Property map
            </h2>
            <p className="text-muted">The outline of your field. Drag to move, use the buttons to zoom.</p>
          </div>
          <FieldMap key={activeProperty.id} polygon={activeProperty.polygon} reference={activeProperty.queryPolygon} label={`Map of ${activeProperty.name}`} coords={`${activeProperty.lat.toFixed(4)}, ${activeProperty.lon.toFixed(4)}`} />
          <Link to="/app/analise" className="mt-4 inline-flex min-h-12 items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline">
            Explore the data in detail <ArrowRight className="size-5" aria-hidden />
          </Link>
        </Card>
        </div>
      </div>

      {/* Calendar */}
      {req.status !== 'error' && (
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[22px]">
                <CalendarDays className="size-5 text-primary" aria-hidden /> Your land's calendar
              </h2>
              <p className="text-muted">
                How the year usually goes in your region, based on the climate record. It is now <span className="capitalize">{monthName}</span>.
              </p>
            </div>
            <SourceBadge ids={['power']} />
          </div>
          {!data ? <Skeleton className="h-28 w-full" /> : bands.length > 0 ? <LandCalendar bands={bands} today={today.getMonth()} /> : <p className="text-muted">There is no seasonal pattern to show for this location.</p>}
          {data && crop && <p className="mt-3 text-[14px] text-muted">The planting window is the usual planting month for {crop.name.toLowerCase()}, the crop registered for this property.</p>}
        </Card>
      )}

      {/* Shortcuts */}
      <section aria-label="Shortcuts" data-tour="shortcuts" className="grid gap-5 md:grid-cols-2">
        <Link to="/app/partida" className="group flex items-center gap-5 rounded-[16px] bg-[#0F3D2A] p-6 text-white transition-transform hover:-translate-y-0.5 sm:p-8 dark:bg-[#173022]">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[#7FD3A5] text-[#0F3D2A]">
            <Zap className="size-8" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-[22px] font-bold">Do a Quick start</span>
            <span className="block text-white/80">A few simple questions · about 4 minutes</span>
          </span>
          <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
        <Link to="/app/analise" className="group flex items-center gap-5 rounded-[16px] border-2 border-primary bg-surface p-6 transition-transform hover:-translate-y-0.5 sm:p-8">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
            <ScanSearch className="size-8" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-[22px] font-bold text-heading">Analyze my data</span>
            <span className="block text-muted">Maps and charts in detail</span>
          </span>
          <ArrowRight className="size-6 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>

      {/* Latest report */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
          <FileText className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="font-sans text-[15px] font-bold text-muted">Latest report</h2>
          {last ? (
            <>
              <p className="font-display text-[19px] font-bold text-heading">{last.title}</p>
              <p className="text-[14px] text-muted">{formatDate(last.created_at)}</p>
            </>
          ) : (
            <p className="text-ink">You have no reports for this property yet.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {last && (
            <ButtonLink to={`/app/relatorios/${last.id}`} variant="secondary" size="sm">
              Open
            </ButtonLink>
          )}
          <ButtonLink to="/app/relatorios" variant="ghost" size="sm">
            My reports <ArrowRight className="size-[18px]" aria-hidden />
          </ButtonLink>
        </div>
      </Card>

      <SupportNote />

      <Tour steps={TOUR_STEPS} open={tourOpen && contentReady} onClose={closeTour} label="Dashboard tour" />
    </div>
  )
}
