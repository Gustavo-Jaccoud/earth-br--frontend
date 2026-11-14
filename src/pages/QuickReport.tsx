import { CircleCheck, FileText, FolderOpen, RotateCcw, Sparkles, TriangleAlert, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { GLOSSARY } from '@/data/mock'
import { ButtonLink, Card, Skeleton, StatusTag, SupportNote } from '@/components/ui'
import { api, type Crop, type Report, type ReportSection, type Rotation, type Signal, type SuitabilityItem } from '@/lib/api'
import { formatDate, useStore } from '@/lib/store'
import { BulletList, FinancialFacts, PdfLink, RequestError, RotationCards, SectionData, SectionText, SignalCards, errorMessage, optionKey, riskMeta } from './Reports'

/* ------------------------- rotation options ------------------------- */

/**
 * Builds the three crop sequences sent to the rotation comparison:
 * the current practice (when the property has a current crop) plus alternatives made of a
 * well-suited crop followed by a soil-restoring legume, both taken from the suitability ranking.
 */
function buildRotationOptions(currentCrop: string | null, crops: Crop[], suitability: SuitabilityItem[]): { options: string[][]; current: string[] | null } {
  const byId = new Map(crops.map((c) => [c.id, c]))
  // Best-suited first; crops without suitability data go last, in catalogue order.
  const ranked = [...suitability.map((s) => s.crop).filter((id) => byId.has(id)), ...crops.map((c) => c.id).filter((id) => !suitability.some((s) => s.crop === id))]
  const mains = ranked.filter((id) => !byId.get(id)!.soil_restoring)
  const legumes = ranked.filter((id) => byId.get(id)!.soil_restoring)
  const months = (ids: string[]) => ids.reduce((sum, id) => sum + byId.get(id)!.kc.length, 0)

  // Every "crop → legume" pair, the best-ranked combinations first.
  const pairs: string[][] = []
  for (let sum = 0; sum <= mains.length + legumes.length; sum++) {
    for (let i = 0; i <= sum; i++) {
      if (mains[i] && legumes[sum - i]) pairs.push([mains[i], legumes[sum - i]])
    }
  }

  const current = currentCrop && byId.has(currentCrop) ? [currentCrop] : null
  const options: string[][] = current ? [current] : []
  const usedMains = new Set<string>()
  const usedLegumes = new Set<string>()
  const remaining = [...pairs]
  while (options.length < 3 && remaining.length > 0) {
    // Prefer sequences that fit in one year, then crops not yet used by another alternative.
    const penalty = (p: string[]) => (months(p) > 12 ? 4 : 0) + (usedMains.has(p[0]) ? 2 : 0) + (usedLegumes.has(p[1]) ? 1 : 0)
    let best = 0
    remaining.forEach((p, i) => {
      if (penalty(p) < penalty(remaining[best])) best = i
    })
    const [pick] = remaining.splice(best, 1)
    options.push(pick)
    usedMains.add(pick[0])
    usedLegumes.add(pick[1])
  }
  // Not enough pairs (e.g. no legume in the catalogue): complete with single crops.
  for (const id of ranked) {
    if (options.length >= 3) break
    if (!options.some((o) => optionKey(o) === id)) options.push([id])
  }
  return { options, current }
}

type Comparison = { state: 'loading' } | { state: 'error'; message: string } | { state: 'unavailable' } | { state: 'ready'; rotation: Rotation; crops: Crop[]; current: string[] | null }

function useRotationComparison(plotId: number | null, currentCrop: string | null) {
  const [comparison, setComparison] = useState<Comparison>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (plotId == null) return
    let cancelled = false
    setComparison({ state: 'loading' })
    ;(async () => {
      // Without the suitability ranking the options are still built, in catalogue order.
      const [crops, suitability] = await Promise.all([api.crops(), api.suitability(plotId).catch(() => null)])
      const { options, current } = buildRotationOptions(currentCrop, crops, suitability?.items ?? [])
      if (options.length < 2) return { state: 'unavailable' } as const
      const rotation = await api.compareRotation(plotId, options)
      return { state: 'ready', rotation, crops, current } as const
    })()
      .then((result) => {
        if (!cancelled) setComparison(result)
      })
      .catch((e) => {
        if (!cancelled) setComparison({ state: 'error', message: errorMessage(e) })
      })
    return () => {
      cancelled = true
    }
  }, [plotId, currentCrop, attempt])

  return { comparison, retry }
}

/* ------------------------------ page ------------------------------ */

const GLOSSARY_KEYS = ['pousio', 'palhada', 'adubacaoVerde', 'curvaNivel', 'ndvi', 'mediaHistorica']

const section = (report: Report, title: string) => report.sections.find((s) => s.title.toLowerCase() === title.toLowerCase())
const KNOWN_SECTIONS = ['risk', 'environmental impact', 'financial impact', 'suggestions']

export default function QuickReport() {
  const { status, quickReport: report, properties } = useStore()
  const property = report ? properties.find((p) => p.plotId === report.plot_id) ?? null : null
  const { comparison, retry } = useRotationComparison(report?.plot_id ?? null, property?.currentCrop ?? null)

  if (!report) {
    if (status === 'loading') {
      return (
        <div className="space-y-5">
          <p className="sr-only" role="status">
            Loading…
          </p>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40 w-full rounded-[20px]" />
        </div>
      )
    }
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <FileText className="mx-auto size-10 text-muted" aria-hidden />
        <h1 className="mt-4 text-[26px]">No quick-start report open</h1>
        <p className="mt-2 text-muted">Reports you have already generated are saved in My reports. You can also answer the 10 questions again to get a new one.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/app/partida">
            <Zap className="size-5" aria-hidden /> Start a Quick start
          </ButtonLink>
          <ButtonLink to="/app/relatorios" variant="secondary">
            <FolderOpen className="size-5" aria-hidden /> My reports
          </ButtonLink>
        </div>
      </Card>
    )
  }

  const risk = section(report, 'Risk')
  const environmental = section(report, 'Environmental impact')
  const financial = section(report, 'Financial impact')
  const suggestions = section(report, 'Suggestions')
  const others = report.sections.filter((s) => !KNOWN_SECTIONS.includes(s.title.toLowerCase()))

  const crops = comparison.state === 'ready' ? comparison.crops : null
  const riskValue = typeof risk?.data.risk === 'number' ? risk.data.risk : null
  const level = riskMeta(risk?.data.level)
  const signals = Array.isArray(environmental?.data.signals) ? (environmental.data.signals as Signal[]) : []
  const referenceDate = typeof environmental?.data.reference_date === 'string' ? environmental.data.reference_date : null
  const hasEstimate = typeof financial?.data.estimated_loss_brl_per_year === 'number'
  const suggestionList = Array.isArray(suggestions?.data.suggestions) ? (suggestions.data.suggestions as unknown[]).filter((s): s is string => typeof s === 'string') : []

  const sources = [...new Set([...signals.map((s) => s.source), ...(comparison.state === 'ready' ? comparison.rotation.options.flatMap((o) => o.scores.map((s) => s.source)) : [])])]
  const glossary = GLOSSARY_KEYS.map((k) => (GLOSSARY as Record<string, { term: string; plain: string } | undefined>)[k]).filter((g) => !!g)

  let n = 0
  const next = () => String(++n)

  return (
    <article className="space-y-10">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-[15px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 font-bold text-primary">
            <Sparkles className="size-4" aria-hidden /> Quick start report
          </span>
          <span>
            {property ? `${property.name} · ${property.city} – ${property.state} · ` : ''}Generated on {formatDate(report.created_at)}
          </span>
        </div>
        <div className="no-print flex flex-wrap items-center gap-3">
          <ButtonLink to={`/app/relatorios/${report.id}`}>
            <CircleCheck className="size-5" aria-hidden /> Saved — open in My reports
          </ButtonLink>
          <PdfLink id={report.id} />
          <ButtonLink to="/app/partida" variant="ghost">
            <RotateCcw className="size-5" aria-hidden /> Redo Quick start
          </ButtonLink>
        </div>
        <p className="no-print text-[15px] text-muted">This report was saved automatically when it was generated. You can find it any time in My reports.</p>
      </header>

      {/* Overall risk */}
      <section aria-labelledby="overall-risk" className="rounded-[20px] bg-[#0F3D2A] p-7 text-white sm:p-10 dark:bg-[#173022]">
        <h1 id="overall-risk" className="mb-4 font-sans text-[16px] font-bold uppercase tracking-wider !text-[#7FD3A5]">
          Overall risk
        </h1>
        {riskValue != null && (
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <p className="font-display text-[56px] font-bold leading-none tabular">
              {Math.round(riskValue)}
              <span className="text-[22px] font-normal text-white/70"> / 100</span>
            </p>
            <StatusTag tone={level.tone} className="text-[16px]">
              {level.label}
            </StatusTag>
          </div>
        )}
        {riskValue != null && (
          <div className="mb-6 h-3 max-w-xl overflow-hidden rounded-full bg-white/15" role="img" aria-label={`${level.label}: ${Math.round(riskValue)} out of 100`}>
            <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${Math.max(0, Math.min(100, riskValue))}%` }} />
          </div>
        )}
        <p className="max-w-4xl font-display text-[24px] font-semibold leading-snug sm:text-[28px]">{risk?.text || 'The server did not return a risk assessment for this report.'}</p>
        <p className="mt-5 text-[16px] text-white/80">Computed from your answers to the 10 quick-start questions. 0 is the lowest risk, 100 the highest.</p>
      </section>

      {environmental && (
        <section aria-labelledby="environmental" className="print-avoid">
          <SectionTitle id="environmental" n={next()} title="Environmental impact" subtitle={referenceDate ? `Rain and soil moisture at your field, with data up to ${formatDate(referenceDate)}.` : 'Rain and soil moisture at your field.'} />
          <Card className="space-y-5 p-6">
            <SectionText text={environmental.text} />
            {signals.length > 0 && <SignalCards signals={signals} />}
          </Card>
        </section>
      )}

      {financial && (
        <section aria-labelledby="financial" className="print-avoid">
          <SectionTitle id="financial" n={next()} title="Financial impact" subtitle="What water shortage is estimated to cost on this field." />
          <Card className="overflow-hidden">
            <div className="space-y-5 p-6">
              <SectionText text={financial.text} />
              <FinancialFacts data={financial.data} crops={crops} />
            </div>
            {hasEstimate && (
              <p className="flex items-center gap-2 border-t border-line p-4 text-[15px] font-bold text-warn-ink">
                <TriangleAlert className="size-5 shrink-0 text-warn" aria-hidden /> This is an estimate. Check it with local technical assistance.
              </p>
            )}
          </Card>
        </section>
      )}

      <section aria-labelledby="strategies">
        <SectionTitle
          id="strategies"
          n={next()}
          title="Rotation strategies compared"
          subtitle={
            (comparison.state === 'ready' ? !comparison.current : !property?.currentCrop)
              ? 'Three crop sequences for this field, scored on water, soil and suitability.'
              : 'Your current practice and two alternatives, scored on water, soil and suitability.'
          }
        />
        {comparison.state === 'loading' && (
          <div className="grid gap-5 lg:grid-cols-3">
            <p className="sr-only" role="status">
              Comparing rotation strategies…
            </p>
            {[0, 1, 2].map((i) => (
              <Card key={i} as="div" className="space-y-4 p-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </Card>
            ))}
          </div>
        )}
        {comparison.state === 'error' && <RequestError message={comparison.message} onRetry={retry} />}
        {comparison.state === 'unavailable' && (
          <Card className="p-6">
            <p className="text-muted">There are not enough crops in the catalogue to compare rotation strategies for this field.</p>
          </Card>
        )}
        {comparison.state === 'ready' && (
          <div className="space-y-5">
            <p className="rounded-[12px] bg-tint p-5 font-display text-[20px] font-semibold text-heading">{comparison.rotation.verdict}</p>
            <RotationCards options={comparison.rotation.options} crops={comparison.crops} current={comparison.current} />
            <p className="text-[15px] text-muted">
              How the alternatives were chosen: the crops best suited to this location (FAO GAEZ suitability), each followed by a soil-restoring legume.
              {!comparison.current && ' This property has no current crop registered, so there is no current practice to compare against.'}
            </p>
          </div>
        )}
      </section>

      {suggestions && (
        <section aria-labelledby="suggestions" className="print-avoid">
          <SectionTitle id="suggestions" n={next()} title="Suggestions" subtitle="Practical steps to reduce the damage, based on your answers." />
          <Card className="p-6">{suggestionList.length > 0 ? <BulletList items={suggestionList} /> : <SectionText text={suggestions.text} />}</Card>
        </section>
      )}

      {others.map((s: ReportSection, i) => (
        <section key={`${s.title}-${i}`} aria-labelledby={`extra-${i}`} className="print-avoid">
          <SectionTitle id={`extra-${i}`} n={next()} title={s.title} />
          <Card className="p-6">
            <SectionText text={s.text} />
            <SectionData data={s.data} crops={crops} />
          </Card>
        </section>
      ))}

      {glossary.length > 0 && (
        <section aria-labelledby="glossary" className="print-avoid">
          <SectionTitle id="glossary" n={next()} title="Quick glossary" subtitle="Farming and satellite terms related to this report, in plain words." />
          <Card className="p-2">
            <dl className="grid gap-x-8 sm:grid-cols-2">
              {glossary.map((g) => (
                <div key={g.term} className="border-b border-line p-4 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                  <dt className="font-display text-[17px] font-bold text-heading">{g.term}</dt>
                  <dd className="mt-1 text-[16px] text-muted">{g.plain}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>
      )}

      <footer className="space-y-4 rounded-[12px] border border-line bg-tint-2 p-6">
        {sources.length > 0 && (
          <>
            <h2 className="font-sans text-[16px] font-bold text-ink">Data sources used</h2>
            <p className="text-[15px] text-muted">
              Your answers to the quick-start questions · {sources.join(' · ')}
            </p>
          </>
        )}
        <p className="text-[15px] text-muted">Report generated on {formatDate(report.created_at)} by earth + BR.</p>
        <SupportNote>This report supports your decisions. It does not replace your knowledge of the land or the guidance of local agronomists.</SupportNote>
      </footer>
    </article>
  )
}

function SectionTitle({ id, n, title, subtitle }: { id: string; n: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tint font-display text-[15px] font-bold text-primary tabular" aria-hidden>
        {n}
      </span>
      <div>
        <h2 id={id} className="text-[26px] sm:text-[28px]">
          {title}
        </h2>
        {subtitle && <p className="text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
