import { ArrowRight, CalendarDays, ChevronDown, FileText, Map as MapIcon, ScanSearch, TriangleAlert, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { INDICATORS, LAND_CALENDAR, MAIN_ALERT, MONTHS_LONG, RAIN_12M, TODAY, USER } from '@/data/mock'
import { ButtonLink, Card, ErrorState, IndicatorCard, IndicatorSkeleton, InfoTip, InsufficientData, Skeleton, SourceBadge, SupportNote, cx } from '@/components/ui'
import { LandCalendar, MapLegend, PropertyMap, RainChart } from '@/components/viz'
import { Link } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** Simula a busca de dados ao trocar de propriedade. */
export function useFakeFetch(key: string, ms = 700) {
  const { simulateError } = useStore()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    setState('loading')
    const t = window.setTimeout(() => setState(simulateError ? 'error' : 'ready'), ms)
    return () => clearTimeout(t)
  }, [key, attempt, simulateError, ms])
  return { state, retry: () => setAttempt((a) => a + 1) }
}

export default function Dashboard() {
  const { activeProperty, reports } = useStore()
  const { state, retry } = useFakeFetch(activeProperty.id)
  const [alertOpen, setAlertOpen] = useState(false)
  const last = reports.filter((r) => r.propertyId === activeProperty.id).sort((a, b) => b.date.localeCompare(a.date))[0]
  const dateLabel = TODAY.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const monthName = MONTHS_LONG[TODAY.getMonth()]

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <p className="text-[16px] text-muted first-letter:uppercase">{dateLabel}</p>
        <h1 className="text-[30px] sm:text-[40px]">
          {greeting()}, {USER.firstName}. <span className="text-primary">Veja como está sua terra hoje.</span>
        </h1>
        <p className="text-lg text-muted">
          {activeProperty.name} · {activeProperty.city} – {activeProperty.state} · {activeProperty.areaHa.toLocaleString('pt-BR')} ha · {activeProperty.currentCrop}
        </p>
      </header>

      {activeProperty.soilEstimated && <InsufficientData />}

      {state === 'error' && <ErrorState onRetry={retry} />}

      {/* Alerta principal */}
      {state === 'ready' && (
        <section aria-label="Alerta principal" className="rounded-[12px] border-l-[6px] border-warn bg-warn-bg">
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <TriangleAlert className="size-7 shrink-0 text-warn" aria-hidden />
            <p className="flex-1 text-[18px] font-bold text-warn-ink">
              <span className="sr-only">Alerta: </span>
              {MAIN_ALERT.text}
            </p>
            <button
              type="button"
              aria-expanded={alertOpen}
              aria-controls="alerta-detalhe"
              onClick={() => setAlertOpen((o) => !o)}
              className="inline-flex min-h-12 items-center gap-1.5 self-start rounded-full px-4 font-bold text-warn-ink underline underline-offset-4 hover:bg-warn/10 sm:self-auto"
            >
              Entender <ChevronDown className={cx('size-5 transition-transform', alertOpen && 'rotate-180')} aria-hidden />
            </button>
          </div>
          {alertOpen && (
            <div id="alerta-detalhe" className="animate-rise space-y-3 border-t border-warn/30 px-5 py-4 sm:pl-[60px]">
              <p className="max-w-3xl text-[17px] text-ink">{MAIN_ALERT.explanation}</p>
              <SourceBadge ids={[MAIN_ALERT.source]} />
            </div>
          )}
        </section>
      )}

      {/* Indicadores */}
      <section aria-labelledby="ind-title">
        <h2 id="ind-title" className="sr-only">
          Indicadores da sua terra
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {state === 'loading' ? INDICATORS.map((i) => <IndicatorSkeleton key={i.id} />) : state === 'ready' ? INDICATORS.map((i) => <IndicatorCard key={i.id} ind={i} />) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Gráfico de chuva */}
        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-1 text-[22px]">
                Chuva mês a mês <InfoTip term="mediaHistorica" />
              </h2>
              <p className="text-muted">Últimos 12 meses comparados com a média de 20 anos</p>
            </div>
            <SourceBadge ids={['gpm', 'power']} />
          </div>
          {state === 'loading' ? <Skeleton className="h-72 w-full" /> : <RainChart data={RAIN_12M} />}
          <p className="mt-3 rounded-[8px] bg-tint-2 p-3 text-[16px] text-ink">
            <strong>Em resumo:</strong> choveu menos que o normal em 11 dos 12 meses. De setembro a novembro, a chuva ficou <strong>52% abaixo</strong> da média.
          </p>
        </Card>

        {/* Mapa */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-[22px]">
                <MapIcon className="size-5 text-primary" aria-hidden /> Mapa da propriedade
              </h2>
              <p className="flex items-center gap-1 text-muted">
                Camada: umidade do solo <InfoTip term="umidadeSolo" />
              </p>
            </div>
            <SourceBadge ids={['smap']} />
          </div>
          <div className="relative mx-6 aspect-[16/10] overflow-hidden rounded-[12px] border border-line">
            {state === 'loading' ? <Skeleton className="size-full rounded-none" /> : <PropertyMap shape={activeProperty.shape} layer="umidade" intensity={0.75} label={`Mapa de ${activeProperty.name} com camada de umidade do solo`} />}
            <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2.5 py-1 text-[13px] text-muted tabular">{activeProperty.coords}</span>
          </div>
          <div className="p-6 pt-4">
            <MapLegend layer="umidade" />
            <Link to="/app/analise" className="mt-4 inline-flex min-h-12 items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline">
              Explorar o mapa em detalhe <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </Card>
      </div>

      {/* Calendário */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[22px]">
              <CalendarDays className="size-5 text-primary" aria-hidden /> Calendário da sua terra
            </h2>
            <p className="text-muted">Como o ano costuma ser na sua região, com base em 20 anos de dados. Estamos em {monthName}.</p>
          </div>
          <SourceBadge ids={['gpm', 'smap', 'modis']} />
        </div>
        <LandCalendar bands={LAND_CALENDAR} today={TODAY.getMonth()} />
        <p className="mt-4 flex items-start gap-2 rounded-[8px] border border-crit/30 bg-crit-bg p-3 text-[16px] text-crit-ink">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong>Risco de erosão:</strong> a terra fica descoberta de setembro a março. Uma cobertura de palhada ou adubo verde protege o solo nesse período.
          </span>
        </p>
      </Card>

      {/* Atalhos */}
      <section aria-label="Atalhos" className="grid gap-5 md:grid-cols-2">
        <Link to="/app/partida" className="group flex items-center gap-5 rounded-[16px] bg-[#0F3D2A] p-6 text-white transition-transform hover:-translate-y-0.5 sm:p-8 dark:bg-[#173022]">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[#7FD3A5] text-[#0F3D2A]">
            <Zap className="size-8" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-[22px] font-bold">Fazer uma Partida rápida</span>
            <span className="block text-white/80">10 perguntas simples · cerca de 4 minutos</span>
          </span>
          <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
        <Link to="/app/analise" className="group flex items-center gap-5 rounded-[16px] border-2 border-primary bg-surface p-6 transition-transform hover:-translate-y-0.5 sm:p-8">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
            <ScanSearch className="size-8" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-[22px] font-bold text-heading">Analisar meus dados</span>
            <span className="block text-muted">Mapas, gráficos e simulações em detalhe</span>
          </span>
          <ArrowRight className="size-6 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </section>

      {/* Último relatório */}
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
          <FileText className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="font-sans text-[15px] font-bold text-muted">Último relatório</h2>
          {last ? (
            <>
              <p className="font-display text-[19px] font-bold text-heading">{last.title}</p>
              <p className="text-ink">{last.conclusion}</p>
              <p className="text-[14px] text-muted">{formatDate(last.date)}</p>
            </>
          ) : (
            <p className="text-ink">Você ainda não tem relatórios para esta propriedade.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {last && (
            <ButtonLink to={`/app/relatorios/${last.id}`} variant="secondary" size="sm">
              Abrir
            </ButtonLink>
          )}
          <ButtonLink to="/app/relatorios" variant="ghost" size="sm">
            Meus relatórios <ArrowRight className="size-[18px]" aria-hidden />
          </ButtonLink>
        </div>
      </Card>

      <SupportNote />
    </div>
  )
}
