import { ArrowLeft, Download, FileText, FolderOpen, LayoutGrid, List, ScanSearch, Search, Share2, Trash2, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ANALYSIS_AREAS, ANALYSIS_PERIODS, ANALYSIS_VARIABLES, TALHOES, type Report, type VariableId } from '@/data/mock'
import { Button, ButtonLink, Card, Dialog, ImagePlaceholder, PageHeader, SupportNote, cx } from '@/components/ui'
import { ShareDialog } from '@/components/ShareDialog'
import { Link, navigate } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'
import QuickReport from './QuickReport'
import { AnalysisDocument, type AnalysisConfig } from './Analysis'

const selectCls = 'min-h-12 rounded-full border-2 border-line bg-surface px-4 text-[16px] text-ink focus:border-primary focus:outline-none'

export function TypeTag({ type }: { type: Report['type'] }) {
  return type === 'partida' ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-tint px-2.5 py-1 text-[13px] font-bold text-primary">
      <Zap className="size-3.5" aria-hidden /> Partida rápida
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E6EEF7] px-2.5 py-1 text-[13px] font-bold text-[#1F4E79] dark:bg-[#18283A] dark:text-[#9CC3EA]">
      <ScanSearch className="size-3.5" aria-hidden /> Análise da terra
    </span>
  )
}

const DAYS = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round((new Date(2026, 10, 14).getTime() - new Date(y, m - 1, d).getTime()) / 86400000)
}

export default function Reports() {
  const { reports, properties, deleteReport, pushToast } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('todos')
  const [prop, setProp] = useState('todas')
  const [period, setPeriod] = useState('todos')
  const [view, setView] = useState<'cards' | 'tabela'>('cards')
  const [toDelete, setToDelete] = useState<Report | null>(null)
  const [toShare, setToShare] = useState<Report | null>(null)

  const filtered = useMemo(
    () =>
      reports
        .filter((r) => (type === 'todos' ? true : r.type === type))
        .filter((r) => (prop === 'todas' ? true : r.propertyId === prop))
        .filter((r) => {
          const d = DAYS(r.date)
          return period === 'todos' ? true : period === '30' ? d <= 30 : period === '90' ? d <= 90 : period === 'ano' ? r.date.startsWith('2026') : !r.date.startsWith('2026')
        })
        .filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reports, type, prop, period, q],
  )

  const propName = (id: string) => properties.find((p) => p.id === id)?.name ?? 'Propriedade removida'
  const anyFilter = q || type !== 'todos' || prop !== 'todas' || period !== 'todos'
  const clear = () => {
    setQ('')
    setType('todos')
    setProp('todas')
    setPeriod('todos')
  }
  const download = (r: Report) => pushToast({ message: `Baixando “${r.title}” em PDF…` })

  if (reports.length === 0) {
    return (
      <div>
        <PageHeader title="Meus relatórios" />
        <Card className="mx-auto flex max-w-2xl flex-col items-center p-10 text-center">
          <ImagePlaceholder caption="ilustração de agricultora olhando uma prancheta vazia" className="aspect-[4/3] w-full max-w-sm" />
          <h2 className="mt-8 text-[24px]">Você ainda não tem relatórios.</h2>
          <p className="mt-2 text-lg text-muted">Que tal começar com uma Partida rápida? São 10 perguntas simples.</p>
          <ButtonLink to="/app/partida" size="lg" className="mt-6">
            <Zap className="size-5" aria-hidden /> Fazer uma Partida rápida
          </ButtonLink>
        </Card>
      </div>
    )
  }

  const Actions = ({ r, compact }: { r: Report; compact?: boolean }) => (
    <div className="flex flex-wrap items-center gap-1">
      <ButtonLink to={`/app/relatorios/${r.id}`} variant="secondary" size="sm">
        <FolderOpen className="size-[18px]" aria-hidden /> Abrir
      </ButtonLink>
      {[
        { label: 'Baixar PDF', icon: Download, on: () => download(r) },
        { label: 'Compartilhar', icon: Share2, on: () => setToShare(r) },
        { label: 'Excluir', icon: Trash2, on: () => setToDelete(r), danger: true },
      ].map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.on}
          aria-label={compact ? `${a.label}: ${r.title}` : undefined}
          title={a.label}
          className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold hover:bg-tint', a.danger ? 'text-crit-ink hover:bg-crit-bg' : 'text-ink', compact && 'size-11 justify-center px-0')}
        >
          <a.icon className="size-[18px]" aria-hidden /> {!compact && a.label}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Meus relatórios"
        subtitle="Todos os relatórios que você gerou, em um só lugar."
        actions={
          <>
            <ButtonLink to="/app/analise" variant="secondary">
              <ScanSearch className="size-5" aria-hidden /> Nova análise
            </ButtonLink>
            <ButtonLink to="/app/partida">
              <Zap className="size-5" aria-hidden /> Nova Partida rápida
            </ButtonLink>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="busca" className="sr-only">
            Buscar por nome
          </label>
          <input id="busca" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome" className="min-h-12 w-full rounded-full border-2 border-line bg-surface pl-12 pr-4 text-[16px] focus:border-primary focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Filtrar por tipo" className={selectCls} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            <option value="partida">Partida rápida</option>
            <option value="analise">Análise da terra</option>
          </select>
          <select aria-label="Filtrar por propriedade" className={selectCls} value={prop} onChange={(e) => setProp(e.target.value)}>
            <option value="todas">Todas as propriedades</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select aria-label="Filtrar por período" className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="todos">Qualquer data</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 3 meses</option>
            <option value="ano">Este ano</option>
            <option value="antes">Anos anteriores</option>
          </select>
          <div role="group" aria-label="Modo de exibição" className="inline-flex rounded-full border-2 border-line bg-surface p-0.5">
            {(
              [
                ['cards', LayoutGrid, 'Cards'],
                ['tabela', List, 'Tabela'],
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
          {filtered.length} {filtered.length === 1 ? 'relatório' : 'relatórios'}
        </span>
        {anyFilter && (
          <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-bold text-primary hover:bg-tint">
            <X className="size-4" aria-hidden /> Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center p-10 text-center">
          <Search className="size-10 text-muted" aria-hidden />
          <p className="mt-4 text-lg font-bold">Nenhum relatório encontrado com esses filtros.</p>
          <Button variant="secondary" className="mt-4" onClick={clear}>
            Limpar filtros
          </Button>
        </Card>
      ) : view === 'cards' ? (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card as="li" key={r.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TypeTag type={r.type} />
                <span className="whitespace-nowrap text-[14px] text-muted tabular">{formatDate(r.date)}</span>
              </div>
              <h2 className="mt-3 text-[19px]">
                <Link to={`/app/relatorios/${r.id}`} className="hover:underline">
                  {r.title}
                </Link>
              </h2>
              <p className="mt-1 text-[15px] text-muted">{propName(r.propertyId)}</p>
              <p className="mt-3 flex-1 text-[16px] text-ink">{r.conclusion}</p>
              <div className="mt-4 border-t border-line pt-3">
                <Actions r={r} />
              </div>
            </Card>
          ))}
        </ul>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <caption className="sr-only">Lista de relatórios</caption>
            <thead className="border-b border-line bg-tint-2 text-[14px] text-muted">
              <tr>
                <th scope="col" className="p-4">Título</th>
                <th scope="col" className="p-4">Tipo</th>
                <th scope="col" className="p-4">Propriedade</th>
                <th scope="col" className="p-4">Data</th>
                <th scope="col" className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-line align-top last:border-0">
                  <td className="max-w-sm p-4">
                    <p className="font-bold text-ink">{r.title}</p>
                    <p className="mt-0.5 text-[15px] text-muted">{r.conclusion}</p>
                  </td>
                  <td className="p-4">
                    <TypeTag type={r.type} />
                  </td>
                  <td className="p-4 text-[15px]">{propName(r.propertyId)}</td>
                  <td className="whitespace-nowrap p-4 text-[15px] tabular">{formatDate(r.date)}</td>
                  <td className="p-4">
                    <Actions r={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SupportNote className="mt-10" />

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir relatório?">
        <div className="p-6">
          <p className="text-ink">
            Você vai excluir <strong>“{toDelete?.title}”</strong>. Essa ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteReport(toDelete!.id)
                pushToast({ message: 'Relatório excluído' })
                setToDelete(null)
              }}
            >
              <Trash2 className="size-5" aria-hidden /> Sim, excluir
            </Button>
          </div>
        </div>
      </Dialog>
      {toShare && <ShareDialog open onClose={() => setToShare(null)} title={toShare.title} />}
    </div>
  )
}

/* --------------------------- Abrir relatório --------------------------- */

function configFromReport(r: Report): AnalysisConfig {
  const m = r.meta ?? {}
  const byLabel = <T extends { id: string; label: string }>(list: T[], v?: string) => list.find((x) => x.id === v || x.label === v)?.id
  const talhao = TALHOES.find((t) => t === m.area || t === m.talhao)
  const vars = (m.vars ?? '')
    .split(',')
    .map((s) => s.trim())
    .map((s) => ANALYSIS_VARIABLES.find((v) => v.id === s || v.label === s)?.id)
    .filter(Boolean) as VariableId[]
  return {
    area: talhao ? 'talhao' : byLabel(ANALYSIS_AREAS, m.area) ?? 'propriedade',
    talhao: talhao ?? TALHOES[0],
    period: byLabel(ANALYSIS_PERIODS, m.period) ?? '10a',
    from: m.from ?? '2020-01',
    to: m.to ?? '2026-11',
    vars: vars.length ? vars : ['umidade', 'precip'],
    comparison: m.comparison ?? 'historico',
  }
}

export function ReportView({ id }: { id: string }) {
  const { reports, properties, activeProperty } = useStore()
  const [share, setShare] = useState(false)
  const r = reports.find((x) => x.id === id)
  if (!r) {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center">
        <FileText className="mx-auto size-10 text-muted" aria-hidden />
        <h1 className="mt-4 text-[26px]">Relatório não encontrado</h1>
        <p className="mt-2 text-muted">Ele pode ter sido excluído.</p>
        <ButtonLink to="/app/relatorios" className="mt-6">
          Voltar para Meus relatórios
        </ButtonLink>
      </Card>
    )
  }
  const back = (
    <button type="button" onClick={() => navigate('/app/relatorios')} className="no-print mb-6 inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-primary hover:bg-tint">
      <ArrowLeft className="size-5" aria-hidden /> Meus relatórios
    </button>
  )
  if (r.type === 'partida') {
    return (
      <div>
        {back}
        <QuickReport saved={r} />
      </div>
    )
  }
  const property = properties.find((p) => p.id === r.propertyId) ?? activeProperty
  return (
    <div>
      {back}
      <PageHeader
        title={r.title}
        eyebrow={<TypeTag type="analise" />}
        subtitle={`${property.name} · ${formatDate(r.date)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="size-5" aria-hidden /> Baixar PDF
            </Button>
            <Button variant="secondary" onClick={() => setShare(true)}>
              <Share2 className="size-5" aria-hidden /> Compartilhar com técnico
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[12px] border border-line shadow-xl">
        <AnalysisDocument config={configFromReport(r)} property={property} date={r.date} />
      </div>
      <ShareDialog open={share} onClose={() => setShare(false)} title={r.title} />
    </div>
  )
}
