import { ArrowLeft, CloudRain, Download, Droplets, FileText, FolderOpen, LayoutGrid, List, ScanSearch, Search, Sprout, Trophy, Waves, X, Zap, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DATA_SOURCES, type CropSegment, type SourceId } from '@/data/mock'
import { Button, ButtonLink, Card, ErrorState, ImagePlaceholder, PageHeader, Skeleton, SourceBadge, StatusTag, SupportNote, btn, cx, type Tone } from '@/components/ui'
import { CropTimeline } from '@/components/viz'
import { api, ApiError, type Crop, type CriterionName, type Report, type ReportKind, type ReportSection, type ReportSummary, type RotationOption, type Signal, type SuitabilityItem } from '@/lib/api'
import { Link, navigate } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'

const selectCls = 'min-h-12 rounded-full border-2 border-line bg-surface px-4 text-[16px] text-ink focus:border-primary focus:outline-none'

export const SUPPORT_TEXT = 'earth + BR supports, and does not replace, your knowledge of the land and the guidance of local agronomists.'

/* ------------------------------------------------------------------ */
/* Shared pieces (also used by the quick-start pages)                  */
/* ------------------------------------------------------------------ */

/** The shared error state with the server's own message, plus optional extra actions below it. */
export function RequestError({ message, onRetry, className, children }: { message: string; onRetry?: () => void; className?: string; children?: ReactNode }) {
  return (
    <div className={className}>
      <ErrorState message={message} onRetry={onRetry} className="text-left" />
      {children && <div className="mt-4 flex flex-wrap gap-3">{children}</div>}
    </div>
  )
}

export function errorMessage(e: unknown) {
  return e instanceof Error && e.message ? e.message : 'Unexpected error. Please try again.'
}

/** Shown by pages that need a property when none is registered yet. */
export function NoProperty({ what }: { what: string }) {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-center p-10 text-center">
      <Sprout className="size-10 text-primary" aria-hidden />
      <h1 className="mt-4 text-[26px]">Register a property first</h1>
      <p className="mt-2 text-muted">{what}</p>
      <ButtonLink to="/propriedades/nova" className="mt-6">
        Register a property
      </ButtonLink>
    </Card>
  )
}

export function PdfLink({ id, className }: { id: number; className?: string }) {
  return (
    <a href={api.reportPdfUrl(id)} target="_blank" rel="noopener noreferrer" className={cx(btn('secondary', 'md'), className)}>
      <Download className="size-5" aria-hidden /> Download PDF
    </a>
  )
}

export function TypeTag({ kind }: { kind: ReportKind }) {
  return kind === 'quiz' ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-tint px-2.5 py-1 text-[13px] font-bold text-primary">
      <Zap className="size-3.5" aria-hidden /> Quick start
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E6EEF7] px-2.5 py-1 text-[13px] font-bold text-[#1F4E79] dark:bg-[#18283A] dark:text-[#9CC3EA]">
      <ScanSearch className="size-3.5" aria-hidden /> Land analysis
    </span>
  )
}

/** "NASA POWER" → the matching source badge, or plain text when the source is not in the catalogue. */
export function SourceLabel({ source, className }: { source: string; className?: string }) {
  const s = source.toUpperCase()
  const id = (['power', 'smap', 'gpm', 'modis', 'gaez'] as SourceId[]).find((k) => s.includes(k.toUpperCase()))
  if (id && DATA_SOURCES[id]) return <SourceBadge ids={[id]} showDate={false} className={className} />
  return <span className={cx('inline-flex rounded-[10px] border border-line bg-tint-2 px-2.5 py-1 text-[13px] text-muted', className)}>Source: {source}</span>
}

const num = (v: number, digits = 0) => v.toLocaleString('en-US', { maximumFractionDigits: digits })

/* ----------------------------- signals ----------------------------- */

const SIGNAL_TONE: Record<string, { tone: Tone; label: string }> = {
  green: { tone: 'ok', label: 'Normal' },
  yellow: { tone: 'warn', label: 'Attention' },
  red: { tone: 'crit', label: 'High risk' },
}

function signalValue(s: Signal, v: number) {
  return s.kind === 'soil_moisture' ? `${num(v * 100)}%` : `${num(v, 1)} ${s.unit}`
}

/** The rain and soil-moisture traffic lights. */
export function SignalCards({ signals }: { signals: Signal[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {signals.map((s) => {
        const meta = SIGNAL_TONE[s.color] ?? { tone: 'neutral' as Tone, label: String(s.color) }
        const Icon = s.kind === 'rain' ? CloudRain : Waves
        const title = s.kind === 'rain' ? 'Rain' : s.kind === 'soil_moisture' ? 'Root-zone soil moisture' : String(s.kind)
        return (
          <div key={s.kind} className="rounded-[12px] border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-[18px] font-bold text-heading">
                <Icon className="size-5 text-primary" aria-hidden /> {title}
              </p>
              <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
            </div>
            <p className="mt-3 font-display text-[30px] font-bold leading-none text-ink tabular">{signalValue(s, s.value)}</p>
            <p className="mt-2 text-[15px] text-muted">
              Last {s.window_days} days · usual for this time of year: <span className="font-bold text-ink tabular">{signalValue(s, s.normal)}</span>
              {s.deviation_pct != null && (
                <>
                  {' '}
                  · <span className="font-bold text-ink tabular">{Math.round(s.deviation_pct) === 0 ? 'on average' : `${num(Math.abs(s.deviation_pct))}% ${s.deviation_pct < 0 ? 'below' : 'above'} average`}</span>
                </>
              )}
            </p>
            <SourceLabel source={s.source} className="mt-3" />
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------- rotation options ------------------------- */

const CRITERIA: Record<CriterionName, { label: string; icon: LucideIcon }> = {
  water: { label: 'Water', icon: Droplets },
  soil: { label: 'Soil', icon: Sprout },
  suitability: { label: 'Suitability', icon: Trophy },
}

export const optionKey = (crops: string[]) => crops.join('>')

/** 12-month timeline for a crop sequence: typical planting month of the first crop, then one crop after another. */
export function timelineFor(sequence: string[], crops: Crop[]): CropSegment[] | null {
  const segments: CropSegment[] = []
  let next: number | null = null
  for (const id of sequence) {
    const crop = crops.find((c) => c.id === id)
    if (!crop) return null
    const length = Math.min(12, Math.max(1, crop.kc.length))
    const start: number = next ?? (((crop.planting_month - 1) % 12) + 12) % 12
    const end = (start + length - 1) % 12
    segments.push({ crop: crop.name, start, end, tone: crop.soil_restoring ? 'legume' : crop.id === 'palma' ? 'cactus' : 'grain' })
    next = (end + 1) % 12
  }
  return segments
}

/**
 * The options of a rotation comparison, best first.
 * `crops` (from `api.crops()`) gives names and timelines; without it the crop ids are shown.
 * `current` marks the option that is the farmer's current practice.
 */
export function RotationCards({ options, crops, current }: { options: RotationOption[]; crops: Crop[] | null; current?: string[] | null }) {
  const sorted = [...options].sort((a, b) => a.rank - b.rank)
  const name = (id: string) => crops?.find((c) => c.id === id)?.name ?? id
  const missing = options.some((o) => o.scores.some((s) => s.score == null))
  return (
    <div>
      <ol className={cx('grid items-start gap-5', sorted.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2')}>
        {sorted.map((o) => {
          const isCurrent = !!current && optionKey(o.crops) === optionKey(current)
          const best = o.rank === 1
          const timeline = crops ? timelineFor(o.crops, crops) : null
          const available = o.scores.filter((s) => s.score != null).length
          return (
            <li key={optionKey(o.crops)} className={cx('print-avoid flex flex-col rounded-[16px] border bg-surface', best ? 'border-[3px] border-primary' : 'border-line')}>
              {best && (
                <p className="flex items-center gap-2 rounded-t-[12px] bg-primary px-5 py-3 font-bold text-on-primary">
                  <Trophy className="size-5 shrink-0" aria-hidden /> Highest total for this field
                </p>
              )}
              <div className="space-y-5 p-5">
                <header>
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-muted">
                    <span className="tabular">
                      Rank {o.rank} of {sorted.length}
                    </span>
                    {current && (isCurrent ? <StatusTag tone="neutral">Your current practice</StatusTag> : <StatusTag tone="ok">Alternative</StatusTag>)}
                  </p>
                  <h3 className="mt-1 text-[22px]">{o.crops.map(name).join(' → ')}</h3>
                  <p className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-[34px] font-bold leading-none text-primary tabular">{num(o.total, 1)}</span>
                    <span className="text-[15px] text-muted">total, out of 100{available < o.scores.length ? ` · from ${available} of ${o.scores.length} criteria` : ''}</span>
                  </p>
                </header>

                {timeline && (
                  <div>
                    <h4 className="mb-2 font-sans text-[15px] font-bold text-ink">Typical calendar</h4>
                    <CropTimeline segments={timeline} compact />
                  </div>
                )}

                <ul className="space-y-4">
                  {o.scores.map((s) => {
                    const meta = CRITERIA[s.name] ?? { label: String(s.name), icon: Sprout }
                    return (
                      <li key={s.name}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 font-bold text-ink">
                            <meta.icon className="size-[18px] text-primary" aria-hidden /> {meta.label}
                          </span>
                          {s.score == null ? <span className="text-[15px] font-bold text-muted">No data</span> : <span className="font-display text-[18px] font-bold text-ink tabular">{num(s.score, 1)}</span>}
                        </div>
                        <div
                          className={cx('mt-1.5 h-2.5 overflow-hidden rounded-full ring-1 ring-line', s.score == null ? 'border border-dashed border-muted/60' : 'bg-tint-2')}
                          role="img"
                          aria-label={s.score == null ? `${meta.label}: no data` : `${meta.label}: ${num(s.score, 1)} out of 100`}
                        >
                          {s.score != null && <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, s.score))}%` }} />}
                        </div>
                        <p className="mt-1.5 text-[15px] text-muted">{s.detail}</p>
                        <SourceLabel source={s.source} className="mt-1.5" />
                      </li>
                    )
                  })}
                </ul>
              </div>
            </li>
          )
        })}
      </ol>
      {missing && (
        <p className="mt-4 rounded-[12px] border-2 border-dashed border-muted/50 p-4 text-[15px] text-ink">
          <strong>Some criteria have no data for this field.</strong> Totals and ranks are computed only from the criteria that have data, so they tell less than a comparison with all three criteria would.
        </p>
      )}
      {crops && <p className="mt-3 text-[14px] text-muted">Calendars use each crop's typical planting month and cycle length, one crop after the other. Adjust them to your own planting dates.</p>}
    </div>
  )
}

/* --------------------------- section data --------------------------- */

const RISK_TONE: Record<string, { tone: Tone; label: string; bar: string }> = {
  low: { tone: 'ok', label: 'Low risk', bar: 'bg-ok' },
  medium: { tone: 'warn', label: 'Medium risk', bar: 'bg-warn' },
  high: { tone: 'crit', label: 'High risk', bar: 'bg-crit' },
}

export function riskMeta(level: unknown) {
  return RISK_TONE[String(level)] ?? { tone: 'neutral' as Tone, label: 'Risk', bar: 'bg-muted' }
}

export function RiskMeter({ risk, level }: { risk: number; level: unknown }) {
  const m = riskMeta(level)
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="font-display text-[40px] font-bold leading-none text-ink tabular">
        {num(risk)}
        <span className="text-[18px] font-normal text-muted"> / 100</span>
      </p>
      <div className="min-w-40 flex-1">
        <div className="h-4 overflow-hidden rounded-full bg-tint-2 ring-1 ring-line" role="img" aria-label={`${m.label}: ${num(risk)} out of 100`}>
          <div className={cx('h-full rounded-full', m.bar)} style={{ width: `${Math.max(0, Math.min(100, risk))}%` }} />
        </div>
      </div>
      <StatusTag tone={m.tone} className="text-[15px]">
        {m.label}
      </StatusTag>
    </div>
  )
}

/** The numbers behind the financial estimate; renders nothing when the backend could not estimate. */
export function FinancialFacts({ data, crops }: { data: Record<string, unknown>; crops: Crop[] | null }) {
  const loss = data.estimated_loss_brl_per_year
  if (typeof loss !== 'number') return null
  const cropId = typeof data.crop === 'string' ? data.crop : null
  const facts: [string, string][] = []
  if (cropId) facts.push(['Crop', crops?.find((c) => c.id === cropId)?.name ?? cropId])
  if (typeof data.attainable_yield_kg_ha === 'number') facts.push(['Attainable yield', `${num(data.attainable_yield_kg_ha)} kg/ha`])
  if (typeof data.water_coverage_pct === 'number') facts.push(['Crop water need covered by rain', `${num(data.water_coverage_pct, 1)}%`])
  return (
    <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-8">
      <div>
        <p className="text-[15px] text-muted">Estimated loss from water shortage</p>
        <p className="font-display text-[36px] font-bold leading-tight text-ink tabular">
          R$ {num(loss)}
          <span className="text-[18px] font-normal text-muted"> / year</span>
        </p>
      </div>
      {facts.length > 0 && (
        <dl className="grid gap-2 sm:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-[8px] bg-tint-2 px-3 py-2">
              <dt className="text-[14px] text-muted">{k}</dt>
              <dd className="font-display text-[18px] font-bold text-ink tabular">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function SuitabilityTable({ items, withoutData, crops }: { items: SuitabilityItem[]; withoutData: string[]; crops: Crop[] | null }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <caption className="sr-only">Crop suitability for this location</caption>
          <thead className="border-b border-line text-[14px] text-muted">
            <tr>
              <th scope="col" className="py-2 pr-4">Crop</th>
              <th scope="col" className="py-2 pr-4">Suitability (0–100)</th>
              <th scope="col" className="py-2 text-right">Attainable yield</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.crop} className="border-b border-line last:border-0">
                <th scope="row" className="py-3 pr-4 font-bold text-ink">{it.name}</th>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-full max-w-48 overflow-hidden rounded-full bg-tint-2 ring-1 ring-line" aria-hidden>
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, it.suitability))}%` }} />
                    </span>
                    <span className="font-bold tabular">{num(it.suitability)}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 text-right tabular">{num(it.attainable_yield_kg_ha)} kg/ha</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {withoutData.length > 0 && <p className="mt-3 text-[15px] text-muted">No suitability data for: {withoutData.map((id) => crops?.find((c) => c.id === id)?.name ?? id).join(', ')}.</p>}
    </div>
  )
}

type DryYear = { year: number; rain_mm: number; rain_anomaly_pct: number }

function DryYearsGrid({ years }: { years: DryYear[] }) {
  const tone = (a: number) => (a <= -25 ? 'crit' : a <= -10 ? 'warn' : 'neutral')
  const cls = { crit: 'border-crit/30 bg-crit-bg text-crit-ink', warn: 'border-warn/40 bg-warn-bg text-warn-ink', neutral: 'border-line bg-tint-2 text-ink' }
  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
        {years.map((y) => (
          <li key={y.year} className={cx('rounded-[8px] border px-2.5 py-2 text-center', cls[tone(y.rain_anomaly_pct)])}>
            <span className="block text-[13px] font-bold tabular">{y.year}</span>
            <span className="block font-display text-[17px] font-bold tabular">
              {y.rain_anomaly_pct > 0 ? '+' : ''}
              {num(y.rain_anomaly_pct)}%
            </span>
            <span className="block text-[12px] tabular">{num(y.rain_mm)} mm</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] text-muted">Rainy-season rainfall of each year compared with normal. Red: 25% or more below normal. Yellow: 10% to 25% below normal.</p>
    </div>
  )
}

export function BulletList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cx('list-disc space-y-2 pl-6 text-[17px] text-ink marker:text-primary', className)}>
      {items.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  )
}

/** Section text: bullet lines ("• …") become a list, everything else keeps its line breaks. */
export function SectionText({ text, className }: { text: string; className?: string }) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  const bullet = /^[•\-*]\s+/
  if (lines.every((l) => bullet.test(l))) return <BulletList items={lines.map((l) => l.replace(bullet, ''))} className={className} />
  return <p className={cx('whitespace-pre-line text-[17px] text-ink', className)}>{text.trim()}</p>
}

/** Structured data of a report section, for the shapes the backend is known to send. Unknown shapes render nothing. */
export function SectionData({ data, crops }: { data: Record<string, unknown>; crops: Crop[] | null }) {
  const blocks: ReactNode[] = []
  if (typeof data.risk === 'number') blocks.push(<RiskMeter key="risk" risk={data.risk} level={data.level} />)
  if (Array.isArray(data.signals) && data.signals.length > 0) blocks.push(<SignalCards key="signals" signals={data.signals as Signal[]} />)
  if (typeof data.estimated_loss_brl_per_year === 'number') blocks.push(<FinancialFacts key="fin" data={data} crops={crops} />)
  if (Array.isArray(data.options) && data.options.length > 0) blocks.push(<RotationCards key="rotation" options={data.options as RotationOption[]} crops={crops} />)
  if (Array.isArray(data.items) && data.items.length > 0) {
    blocks.push(<SuitabilityTable key="suit" items={data.items as SuitabilityItem[]} withoutData={Array.isArray(data.without_data) ? (data.without_data as string[]) : []} crops={crops} />)
  }
  if (Array.isArray(data.years) && data.years.length > 0) blocks.push(<DryYearsGrid key="years" years={data.years as DryYear[]} />)
  if (blocks.length === 0) return null
  return <div className="mt-5 space-y-5">{blocks}</div>
}

function sectionSource(s: ReportSection) {
  return typeof s.data.source === 'string' ? s.data.source : null
}

/* ------------------------------------------------------------------ */
/* Reports list                                                        */
/* ------------------------------------------------------------------ */

const daysAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86_400_000

export default function Reports() {
  const { status, error, reload, reports, properties } = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [plot, setPlot] = useState('all')
  const [period, setPeriod] = useState('all')
  const [view, setView] = useState<'cards' | 'table'>('cards')

  const filtered = useMemo(() => {
    const year = String(new Date().getFullYear())
    return reports
      .filter((r) => (kind === 'all' ? true : r.kind === kind))
      .filter((r) => (plot === 'all' ? true : String(r.plot_id) === plot))
      .filter((r) => {
        const d = daysAgo(r.created_at)
        return period === 'all' ? true : period === '30' ? d <= 30 : period === '90' ? d <= 90 : period === 'year' ? r.created_at.startsWith(year) : !r.created_at.startsWith(year)
      })
      .filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
  }, [reports, kind, plot, period, q])

  const propName = (plotId: number) => properties.find((p) => p.plotId === plotId)?.name ?? null
  const anyFilter = q || kind !== 'all' || plot !== 'all' || period !== 'all'
  const clear = () => {
    setQ('')
    setKind('all')
    setPlot('all')
    setPeriod('all')
  }

  if (status === 'loading') {
    return (
      <div>
        <PageHeader title="My reports" />
        <p className="sr-only" role="status">
          Loading your reports…
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} as="div" className="flex flex-col gap-4 p-5">
              <Skeleton className="h-6 w-1/3 rounded-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-2/3 rounded-full" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <PageHeader title="My reports" />
        <RequestError message={error ?? 'Could not load your reports.'} onRetry={() => void reload()} />
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div>
        <PageHeader title="My reports" />
        <Card className="mx-auto flex max-w-2xl flex-col items-center p-10 text-center">
          <ImagePlaceholder caption="illustration of a farmer looking at an empty clipboard" className="aspect-[4/3] w-full max-w-sm" />
          <h2 className="mt-8 text-[24px]">You don't have any reports yet.</h2>
          <p className="mt-2 text-lg text-muted">How about beginning with a Quick start? It is 10 simple questions.</p>
          <ButtonLink to="/app/partida" size="lg" className="mt-6">
            <Zap className="size-5" aria-hidden /> Do a Quick start
          </ButtonLink>
        </Card>
      </div>
    )
  }

  const actions = (r: ReportSummary) => (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink to={`/app/relatorios/${r.id}`} variant="secondary" size="sm">
        <FolderOpen className="size-[18px]" aria-hidden /> Open
      </ButtonLink>
      <a
        href={api.reportPdfUrl(r.id)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Download PDF: ${r.title}`}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-ink hover:bg-tint"
      >
        <Download className="size-[18px]" aria-hidden /> Download PDF
      </a>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="My reports"
        subtitle="Every report you have generated, in one place."
        actions={
          <>
            <ButtonLink to="/app/analise" variant="secondary">
              <ScanSearch className="size-5" aria-hidden /> New analysis
            </ButtonLink>
            <ButtonLink to="/app/partida">
              <Zap className="size-5" aria-hidden /> New Quick start
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="report-search" className="sr-only">
            Search by name
          </label>
          <input id="report-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="min-h-12 w-full rounded-full border-2 border-line bg-surface pl-12 pr-4 text-[16px] focus:border-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filter by type" className={selectCls} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All types</option>
            <option value="quiz">Quick start</option>
            <option value="analysis">Land analysis</option>
          </select>
          <select aria-label="Filter by property" className={selectCls} value={plot} onChange={(e) => setPlot(e.target.value)}>
            <option value="all">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={String(p.plotId)}>
                {p.name}
              </option>
            ))}
          </select>
          <select aria-label="Filter by period" className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">Any date</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="year">This year</option>
            <option value="before">Previous years</option>
          </select>
          <div role="group" aria-label="Display mode" className="inline-flex rounded-full border-2 border-line bg-surface p-0.5">
            {(
              [
                ['cards', LayoutGrid, 'Cards'],
                ['table', List, 'Table'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button key={id} type="button" aria-pressed={view === id} onClick={() => setView(id)} className={cx('inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold', view === id ? 'bg-primary text-on-primary' : 'text-muted')}>
                <Icon className="size-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between text-[15px] text-muted" aria-live="polite">
        <span>
          {filtered.length} {filtered.length === 1 ? 'report' : 'reports'}
        </span>
        {anyFilter && (
          <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-primary hover:bg-tint">
            <X className="size-4" aria-hidden /> Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center p-10 text-center">
          <Search className="size-10 text-muted" aria-hidden />
          <p className="mt-4 text-lg font-bold">No reports match these filters.</p>
          <Button variant="secondary" className="mt-4" onClick={clear}>
            Clear filters
          </Button>
        </Card>
      ) : view === 'cards' ? (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card as="li" key={r.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TypeTag kind={r.kind} />
                <span className="whitespace-nowrap text-[14px] text-muted tabular">{formatDate(r.created_at)}</span>
              </div>
              <h2 className="mt-3 text-[19px]">
                <Link to={`/app/relatorios/${r.id}`} className="hover:underline">
                  {r.title}
                </Link>
              </h2>
              <p className="mt-1 flex-1 text-[15px] text-muted">{propName(r.plot_id)}</p>
              <div className="mt-4 border-t border-line pt-3">{actions(r)}</div>
            </Card>
          ))}
        </ul>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <caption className="sr-only">List of reports</caption>
            <thead className="border-b border-line bg-tint-2 text-[14px] text-muted">
              <tr>
                <th scope="col" className="p-4">Title</th>
                <th scope="col" className="p-4">Type</th>
                <th scope="col" className="p-4">Property</th>
                <th scope="col" className="p-4">Date</th>
                <th scope="col" className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="max-w-sm p-4">
                    <p className="font-bold text-ink">{r.title}</p>
                  </td>
                  <td className="p-4">
                    <TypeTag kind={r.kind} />
                  </td>
                  <td className="p-4 text-[15px]">{propName(r.plot_id) ?? '—'}</td>
                  <td className="whitespace-nowrap p-4 text-[15px] tabular">{formatDate(r.created_at)}</td>
                  <td className="p-4">{actions(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SupportNote className="mt-10">{SUPPORT_TEXT}</SupportNote>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Open a report                                                       */
/* ------------------------------------------------------------------ */

type Loaded = { state: 'loading' } | { state: 'notfound' } | { state: 'error'; message: string } | { state: 'ready'; report: Report; crops: Crop[] | null }

export function ReportView({ id }: { id: string }) {
  const { properties } = useStore()
  const reportId = /^\d+$/.test(id) ? Number(id) : null
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (reportId == null) {
      setLoaded({ state: 'notfound' })
      return
    }
    let cancelled = false
    setLoaded({ state: 'loading' })
    // Crop names are a nicety: the report still renders (with crop ids) if that request fails.
    Promise.all([api.getReport(reportId), api.crops().catch(() => null)])
      .then(([report, crops]) => {
        if (!cancelled) setLoaded({ state: 'ready', report, crops })
      })
      .catch((e) => {
        if (cancelled) return
        setLoaded(e instanceof ApiError && e.status === 404 ? { state: 'notfound' } : { state: 'error', message: errorMessage(e) })
      })
    return () => {
      cancelled = true
    }
  }, [reportId, attempt])

  const back = (
    <button type="button" onClick={() => navigate('/app/relatorios')} className="no-print mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-primary hover:bg-tint">
      <ArrowLeft className="size-5" aria-hidden /> My reports
    </button>
  )

  if (loaded.state === 'notfound') {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <FileText className="mx-auto size-10 text-muted" aria-hidden />
        <h1 className="mt-4 text-[26px]">Report not found</h1>
        <p className="mt-2 text-muted">This report does not exist on the server.</p>
        <ButtonLink to="/app/relatorios" className="mt-6">
          Back to My reports
        </ButtonLink>
      </Card>
    )
  }

  if (loaded.state === 'error') {
    return (
      <div>
        {back}
        <RequestError message={loaded.message} onRetry={retry} />
      </div>
    )
  }

  if (loaded.state === 'loading') {
    return (
      <div>
        {back}
        <p className="sr-only" role="status">
          Loading report…
        </p>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-3 h-5 w-1/3" />
        <div className="mt-8 space-y-5">
          {[0, 1, 2].map((i) => (
            <Card key={i} as="div" className="space-y-3 p-6">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const { report, crops } = loaded
  const property = properties.find((p) => p.plotId === report.plot_id)
  return (
    <article>
      {back}
      <PageHeader
        title={report.title}
        eyebrow={<TypeTag kind={report.kind} />}
        subtitle={[property && `${property.name} · ${property.city} – ${property.state}`, `Generated on ${formatDate(report.created_at)}`].filter(Boolean).join(' · ')}
        actions={<PdfLink id={report.id} />}
      />
      <div className="space-y-5">
        {report.sections.map((s, i) => {
          const source = sectionSource(s)
          return (
            <Card key={`${s.title}-${i}`} className="print-avoid p-6">
              <h2 className="mb-3 text-[24px]">{s.title}</h2>
              <SectionText text={s.text} />
              <SectionData data={s.data} crops={crops} />
              {source && <SourceLabel source={source} className="mt-4" />}
            </Card>
          )
        })}
        {report.sections.length === 0 && (
          <Card className="p-6">
            <p className="text-muted">This report has no content.</p>
          </Card>
        )}
      </div>
      <SupportNote className="mt-10">{SUPPORT_TEXT}</SupportNote>
    </article>
  )
}
