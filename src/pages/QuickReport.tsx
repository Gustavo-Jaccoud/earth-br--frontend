import { CircleCheck, FileText, FolderOpen, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ButtonLink, Card, Skeleton } from '@/components/ui'
import { api, type Crop } from '@/lib/api'
import { Link } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'
import { PdfLink, ReportBody } from './Reports'

/**
 * The report shown right after the Quick start.
 * Its content is rendered by `ReportBody`, the same component the saved report under My reports uses,
 * from the sections the server saved with the report. Nothing is computed here.
 */
export default function QuickReport() {
  const { status, quickReport: report, properties } = useStore()
  const property = report ? properties.find((p) => p.plotId === report.plot_id) ?? null : null
  // Crop names and calendars are a nicety: the report still renders (with crop ids) if this request fails.
  const [crops, setCrops] = useState<Crop[] | null>(null)
  useEffect(() => {
    let cancelled = false
    api
      .crops()
      .then((list) => {
        if (!cancelled) setCrops(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
        <p className="no-print text-[15px] text-muted">
          This report and its PDF were saved automatically when it was generated. You can open the same report, with the same content, any time under{' '}
          <Link to={`/app/relatorios/${report.id}`} className="font-bold text-primary underline">
            My reports
          </Link>
          .
        </p>
      </header>

      <ReportBody report={report} crops={crops} riskHeading="h1" />
    </article>
  )
}
