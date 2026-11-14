import {
  Beef,
  CalendarClock,
  Check,
  CircleDashed,
  Download,
  Droplets,
  FileSearch,
  Hammer,
  Leaf,
  RotateCcw,
  Save,
  Share2,
  Sparkles,
  Sprout,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { DATA_SOURCES, GLOSSARY, QUICK_QUESTIONS, QUICK_REPORT, STRATEGIES, type Report, type SourceId, type Strategy } from '@/data/mock'
import { Button, ButtonLink, Card, InfoTip, InsufficientData, RISK_META, RiskBadge, SourceBadge, StatusTag, SupportNote, ValidationSeal, cx } from '@/components/ui'
import { CropTimeline, ScoreDots } from '@/components/viz'
import { ShareDialog } from '@/components/ShareDialog'
import { getIcon } from '@/lib/icons'
import { formatDate, todayIso, useStore, type QuickAnswers } from '@/lib/store'

const PRIORITY_MAP: Record<string, { strategy: Strategy['id']; goal: string }> = {
  agua: { strategy: 'a', goal: 'economizar água' },
  solo: { strategy: 'b', goal: 'recuperar o solo' },
  renda: { strategy: 'a', goal: 'ter renda extra' },
  animais: { strategy: 'b', goal: 'alimentar os animais' },
}

function optionLabel(qid: string, id: string) {
  return QUICK_QUESTIONS.find((q) => q.id === qid)?.options.find((o) => o.id === id)?.label
}

/** Personaliza o relatório mock com as respostas da Partida rápida. */
function buildReport(a: QuickAnswers) {
  const ranking = (a.q10 as string[] | undefined) ?? ['agua', 'solo', 'renda', 'animais']
  const pref = PRIORITY_MAP[ranking[0]] ?? PRIORITY_MAP.agua
  const erosionSigns = ((a.q4 as string[] | undefined) ?? []).filter((x) => x !== 'nao').map((x) => optionLabel('q4', x)!)
  const after = a.q3 ? optionLabel('q3', a.q3 as string) : undefined
  const risks = QUICK_REPORT.risks.map((r) => {
    if (r.id === 'erosao') {
      const basedOn = [after ? `Depois da colheita: ${after.toLowerCase()}` : r.basedOn[0], erosionSigns.length ? `Sinais que você viu: ${erosionSigns.join(', ').toLowerCase()}` : 'Imagens de satélite mostram solo exposto']
      return { ...r, basedOn }
    }
    if (r.id === 'hidrico' && a.q5) return { ...r, basedOn: [`Água no período seco: ${optionLabel('q5', a.q5 as string)!.toLowerCase()}`, r.basedOn[1]] }
    if (r.id === 'pragas' && a.q7 === 'sempre') return { ...r, level: 'moderado' as const, value: 50, basedOn: ['Você relatou pragas que voltam todo ano'] }
    return r
  })
  return { ...QUICK_REPORT, risks, aligned: pref.strategy, alignedGoal: pref.goal, ranking }
}

const SCORE_ICONS = { water: Droplets, soil: Sprout, income: Wallet, forage: Beef }
const SCORE_LABEL = { water: 'Economia de água', soil: 'Saúde do solo', income: 'Renda', forage: 'Forragem' }

export default function QuickReport({ saved }: { saved?: Report }) {
  const { quickAnswers, activeProperty, properties, addReport, pushToast, reports } = useStore()
  const property = saved ? properties.find((p) => p.id === saved.propertyId) ?? activeProperty : activeProperty
  const data = buildReport(saved ? {} : quickAnswers)
  const [savedId, setSavedId] = useState<string | null>(saved?.id ?? null)
  const [share, setShare] = useState(false)
  const [tab, setTab] = useState<Strategy['id']>(data.aligned)
  const generated = saved?.date ?? todayIso()
  const isSaved = !!savedId && reports.some((r) => r.id === savedId)

  const save = () => {
    const id = `r-${Date.now()}`
    addReport({
      id,
      title: `Partida rápida — ${property.name}`,
      type: 'partida',
      propertyId: property.id,
      date: todayIso(),
      conclusion: `${STRATEGIES.find((s) => s.id === data.aligned)!.name} é a mais alinhada à sua prioridade: ${data.alignedGoal}.`,
    })
    setSavedId(id)
    pushToast({ message: 'Relatório salvo em Meus relatórios', action: { label: 'Ver', to: '/app/relatorios' } })
  }

  const allSources: SourceId[] = ['power', 'smap', 'gpm', 'modis', 'ecostress', 'soilgrids']

  return (
    <article className="space-y-10">
      {/* Cabeçalho */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-[15px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 font-bold text-primary">
            <Sparkles className="size-4" aria-hidden /> Relatório da Partida rápida
          </span>
          <span>
            {property.name} · {property.city} – {property.state} · Gerado em {formatDate(generated)}
          </span>
        </div>
        <div className="no-print flex flex-wrap gap-3">
          <Button onClick={save} disabled={isSaved}>
            {isSaved ? <Check className="size-5" aria-hidden /> : <Save className="size-5" aria-hidden />}
            {isSaved ? 'Salvo em Meus relatórios' : 'Salvar em Meus relatórios'}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Download className="size-5" aria-hidden /> Baixar PDF
          </Button>
          <Button variant="secondary" onClick={() => setShare(true)}>
            <Share2 className="size-5" aria-hidden /> Compartilhar com técnico
          </Button>
          <ButtonLink to="/app/partida" variant="ghost">
            <RotateCcw className="size-5" aria-hidden /> Refazer Partida rápida
          </ButtonLink>
        </div>
      </header>

      {/* a) Resumo */}
      <section aria-labelledby="resumo" className="rounded-[20px] bg-[#0F3D2A] p-7 text-white sm:p-10 dark:bg-[#173022]">
        <h1 id="resumo" className="mb-4 font-sans text-[16px] font-bold uppercase tracking-wider !text-[#7FD3A5]">
          Resumo para você
        </h1>
        <p className="max-w-4xl font-display text-[24px] font-semibold leading-snug sm:text-[30px]">{data.summary}</p>
        <p className="mt-5 text-[16px] text-white/80">Com base nas suas respostas e em 20 anos de dados de satélite da sua região.</p>
      </section>

      {property.soilEstimated && <InsufficientData />}

      {/* b) Termômetro de riscos */}
      <section aria-labelledby="riscos" className="print-avoid">
        <SectionTitle id="riscos" n="1" title="Termômetro de riscos" subtitle="Quanto maior a barra, maior o risco para a próxima safra." />
        <Card className="divide-y divide-line">
          {data.risks.map((r) => {
            const m = RISK_META[r.level]
            return (
              <div key={r.id} className="grid gap-3 p-5 md:grid-cols-[200px_1fr_130px] md:items-center md:gap-6">
                <p className="font-display text-[19px] font-bold text-heading">{r.label}</p>
                <div>
                  <div className="h-4 overflow-hidden rounded-full bg-tint-2 ring-1 ring-line" role="img" aria-label={`${r.label}: ${m.label}, ${r.value} de 100`}>
                    <div className={cx('h-full rounded-full', m.bar)} style={{ width: `${r.value}%` }} />
                  </div>
                  <p className="mt-2 text-[15px] text-muted">
                    <span className="font-bold text-ink">Baseado em:</span> {r.basedOn.join(' · ')}
                  </p>
                  <SourceBadge ids={r.sources} className="mt-2" showDate={false} />
                </div>
                <RiskBadge level={r.level} prefix="" className="justify-self-start text-[15px] md:justify-self-end" />
              </div>
            )
          })}
        </Card>
      </section>

      {/* c) Impactos ambientais */}
      <section aria-labelledby="ambiental" className="print-avoid">
        <SectionTitle id="ambiental" n="2" title="Impactos ambientais" subtitle="Hoje vs. com a rotação sugerida (valores estimados)." />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {data.environmental.map((e) => {
            const Icon = getIcon(e.icon)
            return (
              <Card as="article" key={e.id} className="p-5">
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-tint text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[18px]">{e.label}</h3>
                <dl className="mt-3 space-y-2">
                  <div className="flex items-baseline justify-between gap-3 rounded-[8px] bg-tint-2 px-3 py-2">
                    <dt className="text-[14px] text-muted">Hoje</dt>
                    <dd className="text-right font-display text-[18px] font-bold text-ink tabular">{e.now}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 rounded-[8px] bg-ok-bg px-3 py-2">
                    <dt className="text-[14px] text-ok-ink">Com a rotação</dt>
                    <dd className="text-right font-display text-[18px] font-bold text-ok-ink tabular">{e.after}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[15px] text-muted">{e.explain}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* d) Impactos financeiros */}
      <section aria-labelledby="financeiro" className="print-avoid">
        <SectionTitle id="financeiro" n="3" title="Impactos financeiros" subtitle="Por safra, para os 12 hectares. Valores de exemplo." />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <caption className="sr-only">Comparação financeira entre continuar como está e a rotação sugerida</caption>
              <thead>
                <tr className="border-b border-line bg-tint-2 text-[15px]">
                  <th scope="col" className="p-4 font-bold text-muted">
                    Item
                  </th>
                  <th scope="col" className="p-4 font-bold text-ink">
                    Se continuar como está
                  </th>
                  <th scope="col" className="p-4 font-bold text-primary">
                    Com a rotação sugerida
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.financial.rows.map((r) => (
                  <tr key={r.label} className="border-b border-line">
                    <th scope="row" className="p-4 font-normal">
                      <span className="block font-bold text-ink">{r.label}</span>
                      <span className="block text-[14px] text-muted">{r.note}</span>
                    </th>
                    <td className="p-4 font-display text-[20px] font-bold tabular">{r.current}</td>
                    <td className="p-4 font-display text-[20px] font-bold text-primary tabular">{r.suggested}</td>
                  </tr>
                ))}
                <tr className="bg-tint-2">
                  <th scope="row" className="p-4 font-bold">
                    Saldo em um ano seco
                  </th>
                  <td className="p-4">
                    <StatusTag tone="crit">{data.financial.balanceCurrent}</StatusTag>
                  </td>
                  <td className="p-4">
                    <StatusTag tone="ok">{data.financial.balanceSuggested}</StatusTag>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="flex items-center gap-2 border-t border-line p-4 text-[15px] font-bold text-warn-ink">
            <TriangleAlert className="size-5 shrink-0 text-warn" aria-hidden /> Estimativa, valide com assistência técnica.
          </p>
        </Card>
      </section>

      {/* e) Estratégias */}
      <section aria-labelledby="estrategias">
        <SectionTitle id="estrategias" n="4" title="Comparação de estratégias de rotação" subtitle="Três caminhos possíveis para os próximos 12 meses." />
        <div role="tablist" aria-label="Estratégias" className="no-print mb-4 grid grid-cols-3 gap-1 rounded-full bg-tint-2 p-1 lg:hidden">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={tab === s.id}
              aria-controls={`estr-${s.id}`}
              onClick={() => setTab(s.id)}
              className={cx('min-h-12 rounded-full px-2 text-[15px] font-bold leading-tight', tab === s.id ? 'bg-surface text-primary shadow' : 'text-muted')}
            >
              {s.id === 'atual' ? 'Atual' : s.name.replace('Estratégia ', 'Estrat. ')}
            </button>
          ))}
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-3">
          {STRATEGIES.map((s) => (
            <StrategyColumn key={s.id} s={s} aligned={s.id === data.aligned} alignedGoal={data.alignedGoal} hidden={tab !== s.id} />
          ))}
        </div>
      </section>

      {/* f) Contenção de danos */}
      <section aria-labelledby="acoes" className="print-avoid">
        <SectionTitle id="acoes" n="5" title="O que fazer para reduzir os danos" subtitle="Ações práticas, da mais urgente para a mais adiante." />
        <div className="grid gap-5 lg:grid-cols-3">
          {(['Agora', 'Próximos 3 meses', 'Próxima safra'] as const).map((when, wi) => (
            <Card key={when} className="p-5">
              <h3 className="flex items-center gap-2 text-[19px]">
                <span className={cx('inline-flex size-8 items-center justify-center rounded-full text-[15px] font-bold', wi === 0 ? 'bg-crit text-white' : wi === 1 ? 'bg-warn text-[#2B1C04]' : 'bg-primary text-on-primary')}>
                  <CalendarClock className="size-4" aria-hidden />
                </span>
                {when}
              </h3>
              <ul className="mt-4 space-y-4">
                {data.actions
                  .filter((a) => a.when === when)
                  .map((a) => {
                    const Icon = getIcon(a.icon)
                    return (
                      <li key={a.id} className="rounded-[12px] border border-line p-4">
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 size-6 shrink-0 text-primary" aria-hidden />
                          <div>
                            <p className="font-bold text-ink">{a.title}</p>
                            <p className="mt-1 text-[15px] text-muted">{a.detail}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                              <Chip icon={Wallet} label={`Custo ${a.cost.toLowerCase()}`} />
                              <Chip icon={Hammer} label={`Esforço ${a.effort.toLowerCase()}`} />
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* g) Glossário */}
      <section aria-labelledby="glossario" className="print-avoid">
        <SectionTitle id="glossario" n="6" title="Glossário rápido" subtitle="Os termos técnicos usados neste relatório, em palavras simples." />
        <Card className="p-2">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {data.glossary.map((k) => (
              <div key={k} className="border-b border-line p-4 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                <dt className="font-display text-[17px] font-bold text-heading">{GLOSSARY[k].term}</dt>
                <dd className="mt-1 text-[16px] text-muted">{GLOSSARY[k].plain}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* h) Rodapé */}
      <footer className="space-y-4 rounded-[12px] border border-line bg-tint-2 p-6">
        <h2 className="font-sans text-[16px] font-bold text-ink">Fontes de dados usadas</h2>
        <ul className="grid gap-2 text-[15px] text-muted sm:grid-cols-2 lg:grid-cols-3">
          {allSources.map((id) => (
            <li key={id}>
              <span className="font-bold text-ink">{DATA_SOURCES[id].name}</span> — {DATA_SOURCES[id].measures.toLowerCase()} · atualizado em {DATA_SOURCES[id].updatedAt}
            </li>
          ))}
        </ul>
        <p className="text-[15px] text-muted">Relatório gerado em {formatDate(generated)} pelo Terra+ (protótipo — dados fictícios).</p>
        <SupportNote>Este relatório é um apoio à decisão. Ele não substitui o seu conhecimento da terra nem a orientação de um técnico agrícola local.</SupportNote>
      </footer>

      <ShareDialog open={share} onClose={() => setShare(false)} title={`Partida rápida — ${property.name}`} />
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

function Chip({ icon: Icon, label }: { icon: typeof Wallet; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-tint-2 px-2.5 py-1 font-bold text-ink ring-1 ring-line">
      <Icon className="size-3.5" aria-hidden /> {label}
    </span>
  )
}

function StrategyColumn({ s, aligned, alignedGoal, hidden }: { s: Strategy; aligned: boolean; alignedGoal: string; hidden: boolean }) {
  return (
    <article
      id={`estr-${s.id}`}
      role="tabpanel"
      aria-label={s.name}
      className={cx(
        'print-avoid flex-col rounded-[16px] border bg-surface lg:flex',
        aligned ? 'border-[3px] border-primary shadow-[0_8px_30px_-12px_var(--c-primary)]' : 'border-line',
        hidden ? 'hidden print:flex' : 'flex',
      )}
    >
      {aligned && (
        <p className="flex items-center gap-2 rounded-t-[13px] bg-primary px-5 py-3 font-bold text-on-primary">
          <Check className="size-5 shrink-0" strokeWidth={3} aria-hidden /> Melhor alinhada às suas prioridades: {alignedGoal}
        </p>
      )}
      <div className="space-y-6 p-5">
        <header>
          <p className="text-[15px] font-bold text-muted">{s.name}</p>
          <h3 className="text-[22px]">{s.subtitle}</h3>
          <p className="mt-1 text-[17px] font-bold text-primary">{s.sequence}</p>
          {s.needsValidation && <ValidationSeal className="mt-3" />}
        </header>

        <div>
          <h4 className="mb-2 font-sans text-[15px] font-bold text-ink">Linha do tempo (12 meses)</h4>
          <CropTimeline segments={s.timeline} compact />
        </div>

        <div>
          <h4 className="mb-1 font-sans text-[15px] font-bold text-ink">{s.id === 'atual' ? 'Como funciona hoje' : 'Por que sugerimos'}</h4>
          <p className="text-[16px] text-ink">{s.why}</p>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-[15px] font-bold text-ink">
            <FileSearch className="size-4 text-primary" aria-hidden /> Evidências
          </h4>
          <ul className="space-y-3">
            {s.evidence.map((e) => (
              <li key={e.text} className="text-[15px] text-ink">
                <p>{e.text}</p>
                <SourceBadge ids={[e.source]} showDate={false} className="mt-1" />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-[15px] font-bold text-ink">
            <Leaf className="size-4 text-primary" aria-hidden /> Benefícios
          </h4>
          <div className="space-y-2 rounded-[12px] bg-tint-2 p-3">
            {(Object.keys(s.scores) as (keyof Strategy['scores'])[]).map((k) => (
              <ScoreDots key={k} value={s.scores[k]} icon={SCORE_ICONS[k]} label={SCORE_LABEL[k]} />
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-warn/40 bg-warn-bg p-4">
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-[15px] font-bold text-warn-ink">
            <TriangleAlert className="size-4 text-warn" aria-hidden /> Riscos
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-ink marker:text-warn">
            {s.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-[12px] border-2 border-dashed border-muted/50 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 font-sans text-[15px] font-bold text-ink">
            <CircleDashed className="size-4" aria-hidden /> O que ainda não sabemos
            <InfoTip label="Lacunas de informação" text="Coisas que os satélites e suas respostas não conseguem mostrar. Um técnico pode ajudar a descobrir." />
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-muted">
            {s.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
