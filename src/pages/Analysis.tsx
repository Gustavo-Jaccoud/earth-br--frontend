import { ArrowRight, Check, CircleCheck, Download, FileText, Gauge, Lightbulb, OctagonAlert, Pencil, Play, Satellite, ScanSearch, SlidersHorizontal, Sprout, TriangleAlert } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { DATA_SOURCES, type SourceId } from '@/data/mock'
import { Button, ButtonLink, Card, InfoTip, PageHeader, Skeleton, SourceBadge, SupportNote, btn, cx } from '@/components/ui'
import { FieldMap, SeriesChart, monthLabel } from '@/components/viz'
import { api, type Crop, type DryYears, type MonthlyClimate, type MonthlyVariable, type Report, type SignalColor, type Signals, type Suitability } from '@/lib/api'
import { formatDate, useStore, type Property } from '@/lib/store'
import { NoProperty, RequestError, completeMonths, errorMessage, monthsOf, num, useApi } from './Dashboard'

export type AnalysisConfig = {
  /** Months of history, 12 or 24 (the endpoint accepts 1–24). */
  months: 12 | 24
  vars: MonthlyVariable[]
}

/** `helps`: what the variable is useful for, shown under its name. */
const VARIABLES: { id: MonthlyVariable; label: string; helps: string; source: SourceId; unit: string; decimals: number }[] = [
  { id: 'rain', label: 'Rain', helps: 'Shows how much it rained compared with what is usual for each month.', source: 'power', unit: 'mm', decimals: 0 },
  { id: 'soil_moisture', label: 'Soil moisture (root zone)', helps: 'Shows how much water the roots can reach, as a share of the most the soil can hold (0% dry, 100% saturated).', source: 'power', unit: '%', decimals: 0 },
  { id: 'temperature', label: 'Air temperature', helps: 'Shows whether each month was warmer or cooler than usual.', source: 'power', unit: '°C', decimals: 1 },
  { id: 'water_balance', label: 'Water balance', helps: 'Identifies water deficit and the need to replenish water.', source: 'power', unit: 'mm', decimals: 0 },
  { id: 'rain_satellite', label: 'Satellite precipitation', helps: 'Helps monitor irregular rainfall and how it is distributed across the territory.', source: 'gpm', unit: 'mm', decimals: 0 },
  { id: 'soil_moisture_satellite', label: 'Satellite soil moisture', helps: 'Helps track how much water is available in the soil.', source: 'smap', unit: '%', decimals: 0 },
  { id: 'et0', label: 'Reference evapotranspiration', helps: 'Supports irrigation planning and the estimate of water demand.', source: 'power', unit: 'mm', decimals: 0 },
  { id: 'temperature_max', label: 'Maximum temperature', helps: 'Helps identify periods of excessive heat and risk of heat stress.', source: 'power', unit: '°C', decimals: 1 },
  { id: 'dry_spell', label: 'Longest dry spell', helps: 'Helps anticipate dry periods and plan the farming calendar.', source: 'power', unit: 'days', decimals: 0 },
  { id: 'ndvi', label: 'NDVI – Vegetation vigor', helps: 'Shows changes in the health and development of crops.', source: 'modis', unit: '', decimals: 2 },
]
const PERIODS: { months: AnalysisConfig['months']; label: string }[] = [
  { months: 12, label: 'Last 12 months' },
  { months: 24, label: 'Last 24 months' },
]
const AREA_LABEL = 'Whole property'
const COMPARISON_LABEL = 'vs. historical average (2001–2020)'

const DEFAULT_CONFIG: AnalysisConfig = { months: 12, vars: ['rain', 'soil_moisture', 'temperature'] }

const varMeta = (id: MonthlyVariable) => VARIABLES.find((v) => v.id === id)!
export const periodLabel = (c: AnalysisConfig) => PERIODS.find((p) => p.months === c.months)!.label

type AnalysisData = { climate: MonthlyClimate; signals: Signals; dry: DryYears; suitability: Suitability; crops: Crop[] }

const SUBTITLE = 'Explore the climate and crop data for your property in detail. Ideal for technicians and cooperatives.'

export default function Analysis() {
  const { activeProperty, status, error: storeError, reload } = useStore()
  const [draft, setDraft] = useState<AnalysisConfig>(DEFAULT_CONFIG)
  const [applied, setApplied] = useState<AnalysisConfig | null>(null)
  const [editing, setEditing] = useState(true)
  const [report, setReport] = useState<{ plotId: number; report: Report } | null>(null)
  const [error, setError] = useState('')

  const plotId = activeProperty?.plotId ?? null
  const months = applied?.months ?? null
  // Which satellite variables have no data for this field (a one-month request is enough to know).
  const availability = useApi<MonthlyVariable[]>(plotId !== null ? `availability:${plotId}` : null, async () => (await api.monthlyClimate(plotId as number, 1)).unavailable)
  const unavailable: MonthlyVariable[] = availability.status === 'ready' ? (availability.data ?? []) : []
  const req = useApi<AnalysisData>(months !== null && plotId !== null ? `${plotId}:${months}` : null, async () => {
    const id = plotId as number
    const [climate, signals, dry, suitability, crops] = await Promise.all([api.monthlyClimate(id, months as number), api.signals(id), api.dryYears(id), api.suitability(id), api.crops()])
    return { climate, signals, dry, suitability, crops }
  })

  if (!activeProperty) {
    return (
      <div>
        <PageHeader title="Land analysis" subtitle={SUBTITLE} />
        {status === 'loading' && <ResultSkeleton />}
        {status === 'error' && <RequestError error={storeError ?? 'Could not load your properties.'} onRetry={() => void reload()} />}
        {status === 'ready' && <NoProperty />}
      </div>
    )
  }

  const generate = () => {
    // Keep the order of the variable list, whatever order the boxes were ticked in.
    const vars = VARIABLES.map((v) => v.id).filter((id) => draft.vars.includes(id) && !unavailable.includes(id))
    if (vars.length === 0) return setError('Choose at least one variable.')
    setError('')
    setApplied({ ...draft, vars })
    setEditing(false)
    setReport(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // A report belongs to the property it was generated for.
  const saved = report && report.plotId === activeProperty.plotId ? report.report : null
  const step = !applied || editing ? 1 : saved ? 3 : 2

  return (
    <div>
      <PageHeader
        title="Land analysis"
        subtitle={SUBTITLE}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <ScanSearch className="size-4" aria-hidden /> {activeProperty.name}
          </span>
        }
      />
      <Stepper step={step} />

      {(editing || !applied) && (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
          <FilterPanel draft={draft} setDraft={setDraft} unavailable={unavailable} onGenerate={generate} error={error} onCancel={applied ? () => setEditing(false) : undefined} />
          <Card className="overflow-hidden p-6 lg:sticky lg:top-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[22px]">Selection preview</h2>
                <p className="text-muted">
                  {AREA_LABEL} · {periodLabel(draft)}
                </p>
              </div>
              <span className="rounded-full bg-tint px-3 py-1 text-[14px] font-bold text-primary tabular">
                {draft.vars.length} {draft.vars.length === 1 ? 'variable' : 'variables'}
              </span>
            </div>
            <FieldMap key={activeProperty.id} polygon={activeProperty.polygon} reference={activeProperty.queryPolygon} label={`Selection preview: ${activeProperty.name}`} />
            <div className="mt-6">
              <p className="mb-3 text-[15px] font-bold text-ink">Sources that will be used:</p>
              <div className="flex flex-wrap gap-2">
                {draft.vars.length > 0 && <SourceBadge ids={['power']} showDate={false} />}
                <SourceBadge ids={['gaez']} showDate={false} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {applied && !editing && (
        <>
          <Card className="mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <SlidersHorizontal className="hidden size-6 shrink-0 text-primary sm:block" aria-hidden />
            <dl className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-[15px]">
              <Summary label="Area" value={AREA_LABEL} />
              <Summary label="Period" value={periodLabel(applied)} />
              <Summary label="Comparison" value={COMPARISON_LABEL} />
              <Summary label="Variables" value={applied.vars.map((v) => varMeta(v).label).join(', ')} />
            </dl>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-[18px]" aria-hidden /> Edit selection
            </Button>
          </Card>

          {(req.status === 'loading' || req.status === 'idle') && <ResultSkeleton />}
          {req.status === 'error' && <RequestError error={req.error} onRetry={req.retry} />}
          {req.status === 'ready' && req.data && (
            <Results key={activeProperty.id} config={applied} property={activeProperty} data={req.data} report={saved} onReport={(r) => setReport({ plotId: activeProperty.plotId, report: r })} />
          )}
        </>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="inline text-muted">{label}: </dt>
      <dd className="inline font-bold text-ink">{value}</dd>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const steps = ['Choose the selection', 'See the result', 'Generate report']
  return (
    <ol className="mb-8 flex flex-wrap gap-2" aria-label="Analysis steps">
      {steps.map((s, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={s} aria-current={state === 'current' ? 'step' : undefined} className={cx('inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px]', state === 'current' ? 'bg-primary font-bold text-on-primary' : state === 'done' ? 'bg-tint font-bold text-primary' : 'bg-tint-2 text-muted')}>
            <span className={cx('inline-flex size-6 items-center justify-center rounded-full text-[13px] tabular', state === 'current' ? 'bg-on-primary/20' : 'bg-surface')}>{state === 'done' ? <Check className="size-4" strokeWidth={3} aria-hidden /> : n}</span>
            {s}
          </li>
        )
      })}
    </ol>
  )
}

/* ------------------------------ Filters ------------------------------ */

function Fieldset({ legend, children, help }: { legend: string; children: ReactNode; help?: ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-6 last:border-0">
      <legend className="mb-3 flex items-center gap-1 font-display text-[17px] font-bold text-heading">
        {legend} {help}
      </legend>
      {children}
    </fieldset>
  )
}

const selectCls = 'min-h-12 w-full rounded-[10px] border-2 border-line bg-surface px-3 text-[16px] focus:border-primary focus:outline-none'

function FilterPanel({ draft, setDraft, unavailable, onGenerate, error, onCancel }: { draft: AnalysisConfig; setDraft: (c: AnalysisConfig) => void; unavailable: MonthlyVariable[]; onGenerate: () => void; error: string; onCancel?: () => void }) {
  return (
    <Card as="div" className="p-5">
      <h2 className="mb-5 flex items-center gap-2 text-[20px]">
        <SlidersHorizontal className="size-5 text-primary" aria-hidden /> Choose the selection
      </h2>
      <div className="space-y-6">
        <Fieldset legend="Area">
          <p className="rounded-[10px] bg-tint px-3 py-3 text-[16px] font-bold">{AREA_LABEL}</p>
        </Fieldset>

        <Fieldset legend="Period">
          <select aria-label="Period" className={selectCls} value={draft.months} onChange={(e) => setDraft({ ...draft, months: Number(e.target.value) === 24 ? 24 : 12 })}>
            {PERIODS.map((p) => (
              <option key={p.months} value={p.months}>
                {p.label}
              </option>
            ))}
          </select>
        </Fieldset>

        <Fieldset legend="Variables">
          <div className="space-y-1">
            {/* Variables with no data for this property are left out of the list. */}
            {VARIABLES.filter((v) => !unavailable.includes(v.id)).map((v) => {
              const on = draft.vars.includes(v.id)
              return (
                <label key={v.id} className={cx('flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] px-3 py-2.5', on ? 'bg-tint' : 'hover:bg-tint-2')}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setDraft({ ...draft, vars: on ? draft.vars.filter((x) => x !== v.id) : [...draft.vars, v.id] })}
                    className="mt-0.5 size-5 shrink-0 accent-[var(--c-primary)]"
                  />
                  <span className="flex-1">
                    <span className={cx('block text-[16px]', on && 'font-bold')}>{v.label}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-muted">{v.helps}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[13px] text-muted">
                      <Satellite className="size-3.5 text-primary" aria-hidden /> {DATA_SOURCES[v.source].name}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </Fieldset>

        <Fieldset legend="Compared with" help={<InfoTip term="mediaHistorica" />}>
          <p className="rounded-[10px] bg-tint px-3 py-3 text-[16px] font-bold">{COMPARISON_LABEL}</p>
        </Fieldset>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-[10px] bg-crit-bg p-3 font-bold text-crit-ink">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" onClick={onGenerate} className="w-full">
          <Play className="size-5" aria-hidden /> Generate analysis
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancel
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------ Results ------------------------------ */

function ResultSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]" aria-busy="true" aria-label="Loading analysis">
      <div className="space-y-6">
        <Card className="space-y-4 p-6" as="div">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="aspect-[16/9] w-full" />
        </Card>
        <Card className="p-6" as="div">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
      <Card className="space-y-3 p-6" as="div">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-6 h-24 w-full" />
      </Card>
    </div>
  )
}

const SIGNAL_ICON: Record<SignalColor, { icon: typeof Check; cls: string; label: string }> = {
  red: { icon: OctagonAlert, cls: 'text-crit', label: 'Alert' },
  yellow: { icon: TriangleAlert, cls: 'text-warn', label: 'Warning' },
  green: { icon: CircleCheck, cls: 'text-ok', label: 'Normal' },
}

function Results({ config, property, data, report, onReport }: { config: AnalysisConfig; property: Property; data: AnalysisData; report: Report | null; onReport: (r: Report) => void }) {
  const { addReport, pushToast } = useStore()
  const [busy, setBusy] = useState(false)
  const [reportError, setReportError] = useState('')

  const createReport = async () => {
    setBusy(true)
    setReportError('')
    try {
      const created = await api.createAnalysisReport(property.plotId)
      addReport(created)
      onReport(created)
      pushToast({ message: 'Report saved to My reports', action: { label: 'View report', to: `/app/relatorios/${created.id}` } })
    } catch (e) {
      setReportError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const cropName = (id: string) => data.crops.find((c) => c.id === id)?.name ?? id
  const top = data.suitability.items.slice(0, 3)
  const partial = data.climate.variables[0]?.months.find((m) => !m.complete)

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {/* Map */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[22px]">Map — {AREA_LABEL.toLowerCase()}</h2>
            <p className="text-muted">The outline of the field at {property.name}. Drag to move, use the buttons to zoom.</p>
          </div>
          <FieldMap polygon={property.polygon} reference={property.queryPolygon} label={`Map of ${property.name}`} />
        </Card>

        {/* Charts */}
        {config.vars.map((id) => {
          const meta = varMeta(id)
          const series = data.climate.variables.find((v) => v.variable === id)
          const months = monthsOf(data.climate, id)
          const unit = series?.unit ?? meta.unit
          const last = completeMonths(months).at(-1)
          const diff = last ? last.value - last.normal : 0
          return (
            <Card key={id} className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[22px]">{meta.label} month by month</h2>
                  <p className="text-muted">{meta.helps}</p>
                  <p className="text-[15px] text-muted">
                    Monthly values, {periodLabel(config).toLowerCase()}, vs. historical average ({(series?.normal_period ?? '2001-2020').replace('-', '–')}).
                  </p>
                </div>
                <SourceBadge ids={[meta.source]} />
              </div>
              {series?.note && (
                <p role="note" className="mb-3 rounded-[8px] border border-amber-300 bg-amber-50 p-3 text-[15px] text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
                  <strong>Read with care:</strong> {series.note}
                </p>
              )}
              {months.length > 0 ? <SeriesChart months={months} unit={unit} valueName={property.name} refName={`Historical average (${(series?.normal_period ?? '2001-2020').replace('-', '–')})`} decimals={meta.decimals} /> : <p className="text-muted">No data for this variable in the period.</p>}
              {last && (
                <p className="mt-3 rounded-[8px] bg-tint-2 p-3 text-[16px] text-ink">
                  <strong>{monthLabel(last.label)}:</strong> {num(last.value, meta.decimals)} {unit}, against an average of {num(last.normal, meta.decimals)} {unit} ({Number(Math.abs(diff).toFixed(meta.decimals)) === 0 ? '' : diff > 0 ? '+' : '−'}
                  {num(Math.abs(diff), meta.decimals)} {unit}).
                </p>
              )}
            </Card>
          )
        })}
        {partial && (
          <p className="text-[14px] text-muted">
            * {monthLabel(partial.label)} is still in progress: it only has data up to {formatDate(data.climate.reference_date)}, so its values are partial.
          </p>
        )}
      </div>

      {/* Interpretation */}
      <aside className="space-y-4 xl:sticky xl:top-6">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[20px]">
            <Lightbulb className="size-5 text-primary" aria-hidden /> What the data says
          </h2>
          <p className="mt-1 text-[14px] text-muted">Data up to {formatDate(data.signals.reference_date)}.</p>
          <ul className="mt-4 space-y-3">
            {data.signals.signals.map((s) => {
              const st = SIGNAL_ICON[s.color]
              const Icon = st.icon
              return (
                <li key={s.kind} className="flex gap-2 text-[16px] text-ink">
                  <Icon className={cx('mt-1 size-4 shrink-0', st.cls)} aria-hidden />
                  <span>
                    <span className="sr-only">{st.label}: </span>
                    {s.message}
                  </span>
                </li>
              )
            })}
            {data.dry.message && (
              <li className="flex gap-2 text-[16px] text-ink">
                <ArrowRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden /> <span>{data.dry.message}</span>
              </li>
            )}
          </ul>
          <SourceBadge ids={['power']} className="mt-3" />

          <h3 className="mt-6 flex items-center gap-2 font-display text-[17px] font-bold text-heading">
            <Sprout className="size-5 text-primary" aria-hidden /> Best-suited crops here
          </h3>
          {top.length > 0 ? (
            <ol className="mt-3 space-y-2">
              {top.map((c, i) => (
                <li key={c.crop} className="rounded-[10px] bg-tint-2 px-3 py-2 text-[15px]">
                  <span className="block font-bold text-ink">
                    {i + 1}. {c.name}
                  </span>
                  <span className="block text-muted tabular">
                    Suitability {num(c.suitability)}/100 · {num(c.attainable_yield_kg_ha)} kg/ha attainable
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[15px] text-muted">FAO GAEZ has no crop suitability data for this location.</p>
          )}
          <p className="mt-2 text-[14px] text-muted">
            Rain-fed, low-input farming; attainable yield in kg of dry matter per hectare ({data.suitability.period.replace('-', '–')} climate).
            {data.suitability.without_data.length > 0 && top.length > 0 && <> No data at this location for: {data.suitability.without_data.map(cropName).join(', ')}.</>}
          </p>
          <SourceBadge ids={['gaez']} showDate={false} className="mt-3" />

          <div className="mt-5 rounded-[12px] border border-warn/40 bg-warn-bg p-4">
            <p className="flex items-center gap-2 font-bold text-warn-ink">
              <Gauge className="size-5 text-warn" aria-hidden /> How precise is this?
              <InfoTip term="resolucao" />
            </p>
            <p className="mt-1 text-[15px] text-ink">
              Rain, soil moisture and temperature come from NASA POWER, whose grid cells are about 50 km wide, so the values are a regional average and not a measurement of this exact field. Crop suitability comes from FAO GAEZ, at about 9 km.
              Use them to understand the season and the region; what you see on the ground can differ.
            </p>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-[18px]">{report ? 'Report saved' : 'Ready to save it?'}</h2>
          <p className="mt-1 text-[15px] text-muted">{report ? report.title : 'Generate a report with the current signals, the regional outlook and the crop suitability to show your technician.'}</p>
          {report && (
            <div className="mt-4 flex flex-col gap-2">
              <ButtonLink to={`/app/relatorios/${report.id}`} className="w-full">
                <FileText className="size-5" aria-hidden /> Open report
              </ButtonLink>
              <a href={api.reportPdfUrl(report.id)} target="_blank" rel="noreferrer" className={btn('secondary', 'md', 'w-full')}>
                <Download className="size-5" aria-hidden /> Download PDF
              </a>
            </div>
          )}
          <Button variant={report ? 'ghost' : 'primary'} className="mt-4 w-full" onClick={() => void createReport()} disabled={busy}>
            <FileText className="size-5" aria-hidden /> {busy ? 'Generating report…' : report ? 'Generate another report' : 'Generate report'}
          </Button>
          {reportError && (
            <p role="alert" className="mt-3 rounded-[10px] bg-crit-bg p-3 text-[15px] font-bold text-crit-ink">
              {reportError}
            </p>
          )}
        </Card>
        <SupportNote />
      </aside>
    </div>
  )
}
