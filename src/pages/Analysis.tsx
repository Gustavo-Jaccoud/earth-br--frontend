import { ArrowRight, Check, ClipboardCheck, Info, FileText, Gauge, Lightbulb, Pencil, Play, ScanSearch, SlidersHorizontal, Thermometer, CloudRain, Satellite } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ANALYSIS_AREAS,
  ANALYSIS_COMPARISONS,
  ANALYSIS_INSIGHTS,
  ANALYSIS_PERIODS,
  ANALYSIS_SERIES,
  ANALYSIS_VARIABLES,
  DATA_SOURCES,
  MAP_ZONES,
  MONTHS_LONG,
  TALHOES,
  type Property,
  type RiskLevel,
  type VariableId,
} from '@/data/mock'
import { Button, Card, Dialog, ErrorState, InfoTip, PageHeader, RiskBadge, Skeleton, SourceBadge, SupportNote, cx } from '@/components/ui'
import { MapLegend, PropertyMap, SeriesChart, ZONE_STYLE, type Zone } from '@/components/viz'
import { formatDate, todayIso, useStore } from '@/lib/store'

export type AnalysisConfig = {
  area: string
  talhao: string
  period: string
  from: string
  to: string
  vars: VariableId[]
  comparison: string
}

const DEFAULT_CONFIG: AnalysisConfig = {
  area: 'propriedade',
  talhao: TALHOES[1],
  period: '10a',
  from: '2020-01',
  to: '2026-11',
  vars: ['precip', 'umidade', 'tsup', 'ndvi'],
  comparison: 'historico',
}

const MUNICIPIO_SHAPE = '6,20 30,6 62,10 92,18 96,52 84,88 48,96 14,84 4,52'
const TALHAO_SHAPE = '30,24 72,20 80,58 56,80 26,70'

export function areaLabel(c: AnalysisConfig) {
  if (c.area === 'talhao') return c.talhao
  return ANALYSIS_AREAS.find((a) => a.id === c.area)!.label
}
export function periodLabel(c: AnalysisConfig) {
  if (c.period === 'custom') return `${c.from.split('-').reverse().join('/')} a ${c.to.split('-').reverse().join('/')}`
  return ANALYSIS_PERIODS.find((p) => p.id === c.period)!.label
}
export function comparisonLabel(c: AnalysisConfig) {
  return ANALYSIS_COMPARISONS.find((x) => x.id === c.comparison)!.label
}
function refName(c: AnalysisConfig) {
  return c.comparison === 'historico' ? 'Média histórica (20 anos)' : c.comparison === 'safra' ? 'Safra anterior' : 'Média do município'
}
function shapeFor(c: AnalysisConfig, p: Property) {
  return c.area === 'municipio' ? MUNICIPIO_SHAPE : c.area === 'talhao' ? TALHAO_SHAPE : p.shape
}
const varMeta = (id: VariableId) => ANALYSIS_VARIABLES.find((v) => v.id === id)!
const fmt = (n: number, unit: string, id: VariableId) => `${n.toLocaleString('pt-BR', { maximumFractionDigits: id === 'ndvi' ? 2 : 1, minimumFractionDigits: id === 'ndvi' ? 2 : 0 })}${unit ? ` ${unit}` : ''}`

export default function Analysis() {
  const { activeProperty, addReport, pushToast, simulateError } = useStore()
  const [draft, setDraft] = useState<AnalysisConfig>(DEFAULT_CONFIG)
  const [applied, setApplied] = useState<AnalysisConfig | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [editing, setEditing] = useState(true)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [savedPdf, setSavedPdf] = useState(false)
  const [error, setError] = useState('')

  const generate = () => {
    if (draft.vars.length === 0) return setError('Escolha pelo menos uma variável.')
    if (draft.period === 'custom' && (!draft.from || !draft.to || draft.from > draft.to)) return setError('Confira as datas do período personalizado.')
    setError('')
    setApplied(draft)
    setEditing(false)
    setSavedPdf(false)
    setStatus('loading')
    window.setTimeout(() => setStatus(simulateError ? 'error' : 'ready'), 1200)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const step = status === 'idle' || editing ? 1 : pdfOpen || savedPdf ? 3 : 2

  return (
    <div>
      <PageHeader
        title="Análise da terra"
        subtitle="Explore os dados de satélite da sua propriedade em detalhe. Ideal para técnicos e cooperativas."
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <ScanSearch className="size-4" aria-hidden /> {activeProperty.name}
          </span>
        }
      />
      <Stepper step={step} />

      {(editing || !applied) && (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
          <FilterPanel draft={draft} setDraft={setDraft} onGenerate={generate} error={error} onCancel={applied ? () => setEditing(false) : undefined} />
          <Card className="overflow-hidden lg:sticky lg:top-6">
            <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
              <div>
                <h2 className="text-[22px]">Prévia do recorte</h2>
                <p className="text-muted">
                  {areaLabel(draft)} · {periodLabel(draft)}
                </p>
              </div>
              <span className="rounded-full bg-tint px-3 py-1 text-[14px] font-bold text-primary tabular">
                {draft.vars.length} {draft.vars.length === 1 ? 'variável' : 'variáveis'}
              </span>
            </div>
            <div className="relative mx-6 aspect-[16/10] overflow-hidden rounded-[12px] border border-line">
              <PropertyMap shape={shapeFor(draft, activeProperty)} layer="none" label={`Prévia do recorte: ${areaLabel(draft)}`} />
              {draft.area === 'municipio' && <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-[14px] text-muted">Município de {activeProperty.city}</span>}
            </div>
            <div className="p-6">
              <p className="mb-3 text-[15px] font-bold text-ink">Fontes que serão usadas:</p>
              <div className="flex flex-wrap gap-2">
                {draft.vars.map((v) => (
                  <SourceBadge key={v} ids={[varMeta(v).source]} showDate={false} />
                ))}
                {draft.vars.length === 0 && <p className="text-muted">Nenhuma variável escolhida.</p>}
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
              <Summary label="Área" value={areaLabel(applied)} />
              <Summary label="Período" value={periodLabel(applied)} />
              <Summary label="Comparativo" value={comparisonLabel(applied)} />
              <Summary label="Variáveis" value={applied.vars.map((v) => varMeta(v).label).join(', ')} />
            </dl>
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-[18px]" aria-hidden /> Editar recorte
            </Button>
          </Card>

          {status === 'loading' && <ResultSkeleton />}
          {status === 'error' && <ErrorState onRetry={generate} />}
          {status === 'ready' && <Results config={applied} property={activeProperty} onPdf={() => setPdfOpen(true)} saved={savedPdf} />}
        </>
      )}

      <Dialog open={pdfOpen} onClose={() => setPdfOpen(false)} title="Prévia do relatório em PDF" wide>
        {applied && (
          <>
            <div className="bg-tint-2 p-4 sm:p-8">
              <div className="mx-auto max-w-3xl shadow-xl">
                <AnalysisDocument config={applied} property={activeProperty} date={todayIso()} />
              </div>
            </div>
            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-line bg-surface px-6 py-4">
              <Button variant="ghost" onClick={() => setPdfOpen(false)}>
                Voltar e ajustar
              </Button>
              <Button
                onClick={() => {
                  addReport({
                    id: `r-${Date.now()}`,
                    title: `${applied.vars.map((v) => varMeta(v).label).slice(0, 2).join(' e ')} — ${periodLabel(applied).toLowerCase()}`,
                    type: 'analise',
                    propertyId: activeProperty.id,
                    date: todayIso(),
                    conclusion: ANALYSIS_INSIGHTS.findings[0],
                    meta: { ...applied, vars: applied.vars.join(','), areaLabel: areaLabel(applied) } as unknown as Record<string, string>,
                  })
                  setPdfOpen(false)
                  setSavedPdf(true)
                  pushToast({ message: 'PDF salvo em Meus relatórios', action: { label: 'Ver relatórios', to: '/app/relatorios' } })
                }}
              >
                <Check className="size-5" aria-hidden /> Confirmar e salvar PDF
              </Button>
            </div>
          </>
        )}
      </Dialog>
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
  const steps = ['Escolher o recorte', 'Ver o resultado', 'Gerar relatório']
  return (
    <ol className="mb-8 flex flex-wrap gap-2" aria-label="Etapas da análise">
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

/* ------------------------------ Filtros ------------------------------ */

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

function Radio({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className={cx('flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2', checked ? 'bg-tint' : 'hover:bg-tint-2')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-[var(--c-primary)]" />
      <span className={cx('text-[16px]', checked && 'font-bold')}>{children}</span>
    </label>
  )
}

const selectCls = 'min-h-12 w-full rounded-[10px] border-2 border-line bg-surface px-3 text-[16px] focus:border-primary focus:outline-none'

function FilterPanel({ draft, setDraft, onGenerate, error, onCancel }: { draft: AnalysisConfig; setDraft: (c: AnalysisConfig) => void; onGenerate: () => void; error: string; onCancel?: () => void }) {
  const set = <K extends keyof AnalysisConfig>(k: K, v: AnalysisConfig[K]) => setDraft({ ...draft, [k]: v })
  return (
    <Card as="div" className="p-5">
      <h2 className="mb-5 flex items-center gap-2 text-[20px]">
        <SlidersHorizontal className="size-5 text-primary" aria-hidden /> Escolha o recorte
      </h2>
      <div className="space-y-6">
        <Fieldset legend="Área" help={<InfoTip term="talhao" />}>
          {ANALYSIS_AREAS.map((a) => (
            <Radio key={a.id} name="area" checked={draft.area === a.id} onChange={() => set('area', a.id)}>
              {a.label}
            </Radio>
          ))}
          {draft.area === 'talhao' && (
            <select aria-label="Escolha o talhão" className={cx(selectCls, 'mt-2')} value={draft.talhao} onChange={(e) => set('talhao', e.target.value)}>
              {TALHOES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          )}
        </Fieldset>

        <Fieldset legend="Período">
          <select aria-label="Período" className={selectCls} value={draft.period} onChange={(e) => set('period', e.target.value)}>
            {ANALYSIS_PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          {draft.period === 'custom' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-[14px] text-muted">
                De
                <input type="month" className={cx(selectCls, 'mt-1')} value={draft.from} onChange={(e) => set('from', e.target.value)} />
              </label>
              <label className="text-[14px] text-muted">
                Até
                <input type="month" className={cx(selectCls, 'mt-1')} value={draft.to} onChange={(e) => set('to', e.target.value)} />
              </label>
            </div>
          )}
        </Fieldset>

        <Fieldset legend="Variáveis">
          <div className="space-y-1">
            {ANALYSIS_VARIABLES.map((v) => {
              const on = draft.vars.includes(v.id)
              return (
                <label key={v.id} className={cx('flex min-h-12 cursor-pointer items-start gap-3 rounded-[10px] px-3 py-2.5', on ? 'bg-tint' : 'hover:bg-tint-2')}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set('vars', on ? draft.vars.filter((x) => x !== v.id) : [...draft.vars, v.id])}
                    className="mt-0.5 size-5 shrink-0 accent-[var(--c-primary)]"
                  />
                  <span className="flex-1">
                    <span className={cx('block text-[16px]', on && 'font-bold')}>{v.label}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted">
                      <Satellite className="size-3.5 text-primary" aria-hidden /> {DATA_SOURCES[v.source].name}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </Fieldset>

        <Fieldset legend="Comparar com">
          {ANALYSIS_COMPARISONS.map((c) => (
            <Radio key={c.id} name="comp" checked={draft.comparison === c.id} onChange={() => set('comparison', c.id)}>
              {c.label}
            </Radio>
          ))}
        </Fieldset>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-[10px] bg-crit-bg p-3 font-bold text-crit-ink">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" onClick={onGenerate} className="w-full">
          <Play className="size-5" aria-hidden /> Gerar análise
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ------------------------------ Resultado ------------------------------ */

function ResultSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]" aria-busy="true" aria-label="Carregando análise">
      <div className="space-y-6">
        <Card className="space-y-4 p-6" as="div">
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-28 rounded-full" />
            ))}
          </div>
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-8 w-full" />
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

function intensityFor(id: VariableId, month: number) {
  const s = ANALYSIS_SERIES[id].value
  const min = Math.min(...s)
  const max = Math.max(...s)
  return max === min ? 0.6 : 0.25 + ((s[month] - min) / (max - min)) * 1.0
}

export function riskFromScenario(rainDrop: number, tempRise: number) {
  const water = Math.min(100, 68 + rainDrop * 0.75 + tempRise * 4)
  const heat = Math.min(100, 45 + tempRise * 12 + rainDrop * 0.15)
  const crop = Math.min(100, (water + heat) / 2 + 4)
  const level = (v: number): RiskLevel => (v >= 85 ? 'critico' : v >= 65 ? 'alto' : v >= 40 ? 'moderado' : 'baixo')
  return { water, heat, crop, lw: level(water), lh: level(heat), lc: level(crop) }
}

function Results({ config, property, onPdf, saved }: { config: AnalysisConfig; property: Property; onPdf: () => void; saved: boolean }) {
  const [layer, setLayer] = useState<VariableId>(config.vars.includes('umidade') ? 'umidade' : config.vars[0])
  const [month, setMonth] = useState(10)
  const [playing, setPlaying] = useState(false)
  const [zonesOn, setZonesOn] = useState<Record<Zone['kind'], boolean>>({ water: true, erosion: true, heat: true })
  const [rainDrop, setRainDrop] = useState(0)
  const [tempRise, setTempRise] = useState(0)

  useEffect(() => {
    if (!config.vars.includes(layer)) setLayer(config.vars[0])
  }, [config.vars, layer])

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => setMonth((m) => (m + 1) % 12), 900)
    return () => clearInterval(t)
  }, [playing])

  const meta = varMeta(layer)
  const series = ANALYSIS_SERIES[layer]
  const zones = MAP_ZONES.filter((z) => zonesOn[z.kind])
  const scen = useMemo(() => riskFromScenario(rainDrop, tempRise), [rainDrop, tempRise])
  const diff = series.value[month] - series.ref[month]

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {/* Mapa */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px]">Mapa — {areaLabel(config)}</h2>
              <p className="text-muted">Escolha a camada que quer ver no mapa.</p>
            </div>
            <SourceBadge ids={[meta.source]} />
          </div>
          <div role="group" aria-label="Camadas do mapa" className="mb-4 flex flex-wrap gap-2">
            {config.vars.map((v) => {
              const m = varMeta(v)
              const on = v === layer
              return (
                <button key={v} type="button" aria-pressed={on} onClick={() => setLayer(v)} className={cx('inline-flex min-h-11 items-center gap-2 rounded-full border-2 px-4 text-[15px] font-bold', on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary/50')}>
                  {on && <Check className="size-4" strokeWidth={3} aria-hidden />} {m.layer}
                </button>
              )
            })}
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[12px] border border-line">
            <PropertyMap shape={shapeFor(config, property)} layer={layer} intensity={intensityFor(layer, month)} zones={config.area === 'municipio' ? [] : zones} label={`Mapa de ${meta.label.toLowerCase()} em ${MONTHS_LONG[month]}`} />
            <div className="absolute left-3 top-3 rounded-[10px] bg-surface/95 px-3 py-2 shadow">
              <p className="text-[13px] capitalize text-muted">{MONTHS_LONG[month]}</p>
              <p className="font-display text-[20px] font-bold text-ink tabular">{fmt(series.value[month], meta.unit, layer)}</p>
              <p className={cx('text-[13px] font-bold tabular', diff < 0 ? 'text-warn-ink' : 'text-ok-ink')}>
                {diff >= 0 ? '+' : ''}
                {fmt(Number(diff.toFixed(2)), meta.unit, layer)} vs. referência
              </p>
            </div>
          </div>

          {/* Linha do tempo */}
          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => setPlaying((p) => !p)} aria-pressed={playing} className="shrink-0">
              <Play className="size-4" aria-hidden /> {playing ? 'Pausar' : 'Animar'}
            </Button>
            <div className="flex-1">
              <label htmlFor="mes" className="sr-only">
                Mês exibido no mapa
              </label>
              <input id="mes" type="range" min={0} max={11} value={month} onChange={(e) => setMonth(Number(e.target.value))} aria-valuetext={MONTHS_LONG[month]} className="w-full accent-[var(--c-primary)]" />
              <div className="flex justify-between text-[12px] text-muted" aria-hidden>
                {MONTHS_LONG.map((m, i) => (
                  <span key={m} className={cx(i === month && 'font-bold text-primary')}>
                    {m.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 lg:flex-row lg:items-start lg:justify-between">
            <MapLegend layer={layer} />
            {config.area !== 'municipio' && (
              <div role="group" aria-label="Zonas destacadas" className="flex flex-wrap gap-2">
                {(Object.keys(ZONE_STYLE) as Zone['kind'][]).map((k) => {
                  const st = ZONE_STYLE[k]
                  const Icon = st.icon
                  return (
                    <label key={k} className={cx('inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-[14px]', zonesOn[k] ? 'border-ink/30 bg-tint-2 font-bold' : 'border-line')}>
                      <input type="checkbox" checked={zonesOn[k]} onChange={() => setZonesOn({ ...zonesOn, [k]: !zonesOn[k] })} className="size-4 accent-[var(--c-primary)]" />
                      <Icon className="size-4" style={{ color: st.color }} aria-hidden /> {st.short}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          {config.area !== 'municipio' && zones.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {zones.map((z) => (
                <li key={z.id} className="rounded-[10px] bg-tint-2 p-3 text-[14px]">
                  <p className="font-bold text-ink">{z.label}</p>
                  <p className="text-muted">{z.note}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Gráfico */}
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[22px]">{meta.label} ao longo do ano</h2>
              <p className="text-muted">
                {config.period === '30d' || config.period === 'safra' || config.period === '1a' ? 'Valores mensais' : `Média mensal — ${periodLabel(config).toLowerCase()}`} vs. {refName(config).toLowerCase()}. A linha âmbar marca o mês no mapa.
              </p>
            </div>
            {layer === 'ndvi' && <InfoTip term="ndvi" />}
          </div>
          <SeriesChart value={series.value} reference={series.ref} unit={meta.unit} valueName={config.area === 'municipio' ? 'Município' : property.name} refName={refName(config)} cursor={month} decimals={layer === 'ndvi' ? 2 : layer === 'tar' || layer === 'solo' ? 1 : 0} />
        </Card>

        {/* Simulador */}
        <Card className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[22px]">
            <Gauge className="size-5 text-primary" aria-hidden /> Simulador de cenário
          </h2>
          <p className="text-muted">Mexa nos controles e veja como o risco mudaria.</p>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <Slider id="sim-chuva" icon={CloudRain} label="E se chover menos?" value={rainDrop} min={0} max={50} step={5} display={`${rainDrop}% menos chuva`} onChange={setRainDrop} />
            <Slider id="sim-temp" icon={Thermometer} label="E se a temperatura subir?" value={tempRise} min={0} max={4} step={0.5} display={`+${tempRise.toLocaleString('pt-BR')} °C`} onChange={setTempRise} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-live="polite">
            <ScenarioRisk label="Risco hídrico" value={scen.water} level={scen.lw} />
            <ScenarioRisk label="Estresse térmico" value={scen.heat} level={scen.lh} />
            <ScenarioRisk label="Risco para o milho" value={scen.crop} level={scen.lc} />
          </div>
          <p className="mt-4 rounded-[10px] bg-tint-2 p-4 text-[16px] text-ink">
            {rainDrop === 0 && tempRise === 0
              ? 'Este é o cenário atual, com base nos dados de satélite. Mova os controles para simular.'
              : `Com ${rainDrop}% menos chuva e ${tempRise.toLocaleString('pt-BR')} °C a mais, a umidade do solo ficaria abaixo de 12% por cerca de ${Math.min(9, 4 + Math.round(rainDrop / 12 + tempRise / 1.5))} meses do ano. ${scen.lc === 'alto' || scen.lc === 'critico' ? 'Culturas de ciclo curto e tolerantes à seca ficam ainda mais importantes.' : ''}`}
          </p>
        </Card>
      </div>

      {/* Interpretação */}
      <aside className="space-y-4 xl:sticky xl:top-6">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-[20px]">
            <Lightbulb className="size-5 text-primary" aria-hidden /> O que esses dados dizem
          </h2>
          <ul className="mt-4 space-y-3">
            {ANALYSIS_INSIGHTS.findings.map((f) => (
              <li key={f} className="flex gap-2 text-[16px] text-ink">
                <ArrowRight className="mt-1 size-4 shrink-0 text-primary" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-[12px] border border-warn/40 bg-warn-bg p-4">
            <p className="flex items-center gap-2 font-bold text-warn-ink">
              <Gauge className="size-5 text-warn" aria-hidden /> Nível de confiança: {ANALYSIS_INSIGHTS.confidence.level.toLowerCase()}
              <InfoTip term="resolucao" />
            </p>
            <p className="mt-1 text-[15px] text-ink">{ANALYSIS_INSIGHTS.confidence.why}</p>
          </div>
          <div className="mt-4 rounded-[12px] border-2 border-dashed border-muted/50 p-4">
            <p className="flex items-center gap-2 font-bold text-ink">
              <ClipboardCheck className="size-5 text-primary" aria-hidden /> Onde um especialista deve validar
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted">
              {ANALYSIS_INSIGHTS.validate.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-[18px]">Pronto para guardar?</h2>
          <p className="mt-1 text-[15px] text-muted">Gere um PDF com o mapa, os gráficos e a interpretação para mostrar ao técnico.</p>
          <Button className="mt-4 w-full" onClick={onPdf}>
            <FileText className="size-5" aria-hidden /> {saved ? 'Gerar outro PDF' : 'Gerar relatório em PDF'}
          </Button>
        </Card>
        <SupportNote />
      </aside>
    </div>
  )
}

function Slider({ id, icon: Icon, label, value, min, max, step, display, onChange }: { id: string; icon: typeof CloudRain; label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 font-bold text-ink">
          <Icon className="size-5 text-primary" aria-hidden /> {label}
        </label>
        <span className="whitespace-nowrap rounded-full bg-tint px-3 py-1 font-display font-bold text-primary tabular">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={display} className="w-full accent-[var(--c-primary)]" />
    </div>
  )
}

function ScenarioRisk({ label, value, level }: { label: string; value: number; level: RiskLevel }) {
  const bar = level === 'baixo' ? 'bg-ok' : level === 'moderado' ? 'bg-warn' : 'bg-crit'
  return (
    <div className="rounded-[12px] border border-line p-4">
      <p className="text-[15px] font-bold text-muted">{label}</p>
      <RiskBadge level={level} prefix="" className="mt-2" />
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-tint-2 ring-1 ring-line" aria-hidden>
        <div className={cx('h-full rounded-full transition-all duration-300', bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

/* ------------------------------ Documento PDF ------------------------------ */

export function AnalysisDocument({ config, property, date }: { config: AnalysisConfig; property: Property; date: string }) {
  const main = config.vars.includes('umidade') ? 'umidade' : config.vars[0]
  const meta = varMeta(main)
  return (
    <div className="bg-white text-[#111511]" style={{ colorScheme: 'light' }}>
      {/* Capa */}
      <section className="bg-[#0F3D2A] p-8 text-white sm:p-10">
        <p className="font-display text-xl font-extrabold">
          Terra<span className="text-[#7FD3A5]">+</span>
        </p>
        <p className="mt-10 text-[14px] uppercase tracking-wider text-[#7FD3A5]">Relatório de análise da terra</p>
        <h1 className="mt-2 text-[30px] !text-white">{property.name}</h1>
        <p className="mt-1 text-white/80">
          {property.city} – {property.state} · {property.areaHa.toLocaleString('pt-BR')} ha
        </p>
        <dl className="mt-8 grid gap-3 text-[14px] sm:grid-cols-2">
          <div>
            <dt className="text-white/60">Recorte</dt>
            <dd className="font-bold">{areaLabel(config)}</dd>
          </div>
          <div>
            <dt className="text-white/60">Período</dt>
            <dd className="font-bold">{periodLabel(config)}</dd>
          </div>
          <div>
            <dt className="text-white/60">Comparativo</dt>
            <dd className="font-bold">{comparisonLabel(config)}</dd>
          </div>
          <div>
            <dt className="text-white/60">Gerado em</dt>
            <dd className="font-bold">{formatDate(date)}</dd>
          </div>
        </dl>
      </section>
      <div className="space-y-8 p-8 sm:p-10">
        <section>
          <h2 className="mb-3 text-[20px] !text-[#0F3D2A]">Mapa — {meta.label}</h2>
          <div className="aspect-[16/9] overflow-hidden rounded-[10px] border border-[#E3E7E4] [--c-tint-2:#F4F9F6] [--c-line:#E3E7E4] [--c-muted:#5B635D] [--c-deep:#0F3D2A]">
            <PropertyMap shape={shapeFor(config, property)} layer={main} intensity={0.7} zones={config.area === 'municipio' ? [] : MAP_ZONES} label={`Mapa de ${meta.label}`} />
          </div>
        </section>
        <section className="[--c-line:#E3E7E4] [--c-muted:#5B635D] [--c-primary:#1E7A4C] [--c-warn:#B7791F] [--c-surface:#fff] [--c-ink:#111511]">
          <h2 className="mb-3 text-[20px] !text-[#0F3D2A]">Gráficos</h2>
          <div className="grid gap-6">
            {config.vars.slice(0, 2).map((v) => {
              const m = varMeta(v)
              return (
                <div key={v}>
                  <p className="mb-1 font-bold">{m.label} <span className="font-normal text-[#5B635D]">({DATA_SOURCES[m.source].name})</span></p>
                  <SeriesChart value={ANALYSIS_SERIES[v].value} reference={ANALYSIS_SERIES[v].ref} unit={m.unit} valueName={property.name} refName={refName(config)} height="h-48" decimals={v === 'ndvi' ? 2 : 0} />
                </div>
              )
            })}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-[20px] !text-[#0F3D2A]">Interpretação</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            {ANALYSIS_INSIGHTS.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-[8px] bg-[#FBF3E4] p-3 text-[15px]">
            <strong className="text-[#7A4F0E]">Nível de confiança: {ANALYSIS_INSIGHTS.confidence.level.toLowerCase()}.</strong> {ANALYSIS_INSIGHTS.confidence.why}
          </p>
          <p className="mt-3 font-bold">Onde um especialista deve validar:</p>
          <ul className="list-disc pl-5 text-[15px] text-[#5B635D]">
            {ANALYSIS_INSIGHTS.validate.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </section>
        <section className="border-t border-[#E3E7E4] pt-6 text-[14px] text-[#5B635D]">
          <p className="font-bold text-[#111511]">Fontes</p>
          <p>
            {config.vars.map((v) => `${DATA_SOURCES[varMeta(v).source].name} (${varMeta(v).label.toLowerCase()}, atualizado em ${DATA_SOURCES[varMeta(v).source].updatedAt})`).join(' · ')}
          </p>
          <p className="mt-4 flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> O Terra+ é uma ferramenta de apoio à decisão e não substitui o conhecimento do agricultor nem a orientação da assistência técnica local. Protótipo — dados fictícios.
          </p>
        </section>
      </div>
    </div>
  )
}
