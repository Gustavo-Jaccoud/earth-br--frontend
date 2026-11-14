import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, GripVertical, Lightbulb, SkipForward, Sprout } from 'lucide-react'
import { useEffect, useState, type DragEvent } from 'react'
import { QUICK_QUESTIONS, PROCESSING_STEPS, USER, type QuickQuestion } from '@/data/mock'
import { Button, ImagePlaceholder, SupportNote, cx } from '@/components/ui'
import { Orbit, StepList } from './Properties'
import { getIcon } from '@/lib/icons'
import { navigate } from '@/lib/router'
import { useStore, type QuickAnswers } from '@/lib/store'

const TOTAL = QUICK_QUESTIONS.length

export default function QuickStart() {
  const { quickAnswers, setQuickAnswers, activeProperty } = useStore()
  const [idx, setIdx] = useState(-1) // -1 = boas-vindas; TOTAL = processamento
  const [answers, setAnswers] = useState<QuickAnswers>(quickAnswers)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [idx])

  if (idx === -1) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <Bubble>
          <p>
            Oi, {USER.firstName}! Vou fazer <strong>10 perguntas rápidas</strong> sobre o {activeProperty.name}. Não existe resposta certa ou errada — responda do seu jeito.
          </p>
        </Bubble>
        <Bubble delay>
          <p>Depois, eu cruzo suas respostas com 20 anos de dados de satélite da sua região e mostro as melhores opções de rotação para você.</p>
        </Bubble>
        <div className="mt-10 flex flex-wrap items-center gap-4 pl-0 sm:pl-16">
          <Button size="lg" onClick={() => setIdx(0)}>
            Vamos começar <ArrowRight className="size-5" aria-hidden />
          </Button>
          <span className="text-muted">Leva cerca de 4 minutos</span>
        </div>
        <SupportNote className="mt-12 sm:pl-16" />
      </div>
    )
  }

  if (idx >= TOTAL) return <Processing />

  const q = QUICK_QUESTIONS[idx]
  const value = answers[q.id]
  const answered = q.type === 'rank' ? true : Array.isArray(value) ? value.length > 0 : !!value
  const update = (v: string | string[]) => setAnswers((a) => ({ ...a, [q.id]: v }))
  const goNext = (a = answers) => {
    if (idx === TOTAL - 1) {
      const final = { ...a }
      if (!final[q.id]) final[q.id] = q.options.map((o) => o.id)
      setQuickAnswers(final)
    }
    setIdx(idx + 1)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progresso */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[16px]">
          <span className="font-bold text-ink tabular">
            Pergunta {idx + 1} de {TOTAL}
          </span>
          <span className="text-muted tabular">{Math.round((idx / TOTAL) * 100)}% concluído</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={idx + 1} aria-label="Progresso da Partida rápida">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((idx + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      <div key={q.id} className="animate-rise">
        <div className="flex items-start gap-4">
          <Avatar />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] leading-tight sm:text-[34px]">{q.title}</h1>
            {q.note && <p className="mt-2 text-[17px] text-muted">{q.note}</p>}
          </div>
        </div>

        {q.why && <Why text={q.why} />}

        <div className="mt-8">
          {q.type === 'single' && <SingleOptions q={q} value={value as string | undefined} onChange={update} />}
          {q.type === 'multi' && <MultiOptions q={q} value={(value as string[] | undefined) ?? []} onChange={update} />}
          {q.type === 'rank' && <RankOptions q={q} value={(value as string[] | undefined) ?? q.options.map((o) => o.id)} onChange={update} />}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <Button variant="ghost" onClick={() => setIdx(idx - 1)}>
          <ArrowLeft className="size-5" aria-hidden /> Voltar
        </Button>
        <div className="flex flex-wrap gap-3">
          {q.type !== 'rank' && (
            <Button
              variant="ghost"
              onClick={() => {
                const a = { ...answers }
                delete a[q.id]
                setAnswers(a)
                goNext(a)
              }}
            >
              Pular <SkipForward className="size-5" aria-hidden />
            </Button>
          )}
          <Button size="lg" disabled={!answered} onClick={() => goNext()}>
            {idx === TOTAL - 1 ? 'Ver meu resultado' : 'Continuar'} <ArrowRight className="size-5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary" aria-hidden>
      <Sprout className="size-6" />
    </span>
  )
}

function Bubble({ children, delay }: { children: React.ReactNode; delay?: boolean }) {
  return (
    <div className="animate-rise mt-4 flex items-start gap-4" style={delay ? { animationDelay: '0.35s' } : undefined}>
      {!delay ? <Avatar /> : <span className="hidden size-12 shrink-0 sm:block" />}
      <div className="max-w-2xl rounded-[4px_20px_20px_20px] bg-tint px-6 py-5 text-[19px] leading-relaxed text-ink">{children}</div>
    </div>
  )
}

function Why({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4 sm:pl-16">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-primary hover:bg-tint">
        <Lightbulb className="size-5" aria-hidden /> Por que perguntamos isso?
        <ChevronDown className={cx('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <p className="animate-rise mt-2 max-w-2xl rounded-[12px] bg-tint-2 p-4 text-[17px] text-ink">{text}</p>}
    </div>
  )
}

function OptionCard({ selected, onClick, icon, label, role, children }: { selected: boolean; onClick: () => void; icon: string; label: string; role: 'radio' | 'checkbox'; children?: React.ReactNode }) {
  const Icon = getIcon(icon)
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-[16px] border-2 text-left transition-all',
        selected ? 'border-primary bg-tint shadow-[0_0_0_3px_var(--c-tint)]' : 'border-line bg-surface hover:-translate-y-0.5 hover:border-primary/60',
      )}
    >
      {children}
      <span className="flex min-h-20 flex-1 items-center gap-4 p-5">
        <span className={cx('inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-colors', selected ? 'bg-primary text-on-primary' : 'bg-tint text-primary')}>
          <Icon className="size-6" aria-hidden />
        </span>
        <span className="flex-1 text-[19px] font-bold leading-snug text-ink">{label}</span>
        <span className={cx('inline-flex size-7 shrink-0 items-center justify-center border-2', role === 'radio' ? 'rounded-full' : 'rounded-[8px]', selected ? 'border-primary bg-primary text-on-primary' : 'border-muted/40')}>
          {selected && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </span>
      </span>
    </button>
  )
}

function SingleOptions({ q, value, onChange }: { q: QuickQuestion; value?: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={q.title} className={cx('grid gap-4', q.options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {q.options.map((o) => (
        <OptionCard key={o.id} role="radio" selected={value === o.id} onClick={() => onChange(o.id)} icon={o.icon} label={o.label} />
      ))}
    </div>
  )
}

function MultiOptions({ q, value, onChange }: { q: QuickQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => {
    if (id === 'nao') return onChange(value.includes('nao') ? [] : ['nao'])
    const base = value.filter((v) => v !== 'nao')
    onChange(base.includes(id) ? base.filter((v) => v !== id) : [...base, id])
  }
  return (
    <div role="group" aria-label={q.title} className="grid gap-4 sm:grid-cols-2">
      {q.options.map((o) => (
        <OptionCard key={o.id} role="checkbox" selected={value.includes(o.id)} onClick={() => toggle(o.id)} icon={o.icon} label={o.label}>
          {o.image && <ImagePlaceholder caption={o.image} compact className="aspect-[4/3] rounded-none" />}
        </OptionCard>
      ))}
    </div>
  )
}

function RankOptions({ q, value, onChange }: { q: QuickQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const byId = Object.fromEntries(q.options.map((o) => [o.id, o]))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    setAnnounce(`${byId[item].label} agora está na posição ${to + 1}`)
  }

  const onDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragging) return
    move(value.indexOf(dragging), value.indexOf(targetId))
    setDragging(null)
    setOver(null)
  }

  return (
    <>
      <ol className="space-y-3">
        {value.map((id, i) => {
          const o = byId[id]
          const Icon = getIcon(o.icon)
          return (
            <li
              key={id}
              draggable
              onDragStart={(e) => {
                setDragging(id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => {
                setDragging(null)
                setOver(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(id)
              }}
              onDrop={(e) => onDrop(e, id)}
              className={cx(
                'flex cursor-grab items-center gap-3 rounded-[16px] border-2 bg-surface p-3 pr-2 transition-all active:cursor-grabbing sm:gap-4 sm:p-4',
                i === 0 ? 'border-primary' : 'border-line',
                dragging === id && 'opacity-40',
                over === id && dragging !== id && 'translate-x-1 border-dashed border-primary bg-tint',
              )}
            >
              <GripVertical className="size-6 shrink-0 text-muted" aria-hidden />
              <span className={cx('inline-flex size-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold tabular', i === 0 ? 'bg-primary text-on-primary' : 'bg-tint text-primary')}>{i + 1}º</span>
              <Icon className="hidden size-6 shrink-0 text-primary sm:block" aria-hidden />
              <span className="flex-1 text-[19px] font-bold text-ink">
                {o.label}
                {i === 0 && <span className="ml-2 align-middle text-[14px] font-normal text-primary">mais importante</span>}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Subir ${o.label}`} className="inline-flex size-12 items-center justify-center rounded-full text-ink hover:bg-tint disabled:opacity-30">
                  <ArrowUp className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Descer ${o.label}`} className="inline-flex size-12 items-center justify-center rounded-full text-ink hover:bg-tint disabled:opacity-30">
                  <ArrowDown className="size-5" aria-hidden />
                </button>
              </span>
            </li>
          )
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </>
  )
}

function Processing() {
  const [done, setDone] = useState(0)
  useEffect(() => {
    const t = PROCESSING_STEPS.map((_, i) => window.setTimeout(() => setDone(i + 1), 850 * (i + 1)))
    const end = window.setTimeout(() => navigate('/app/partida/relatorio'), 850 * PROCESSING_STEPS.length + 1000)
    return () => {
      t.forEach(clearTimeout)
      clearTimeout(end)
    }
  }, [])
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <Orbit />
      <h1 className="mt-10 max-w-2xl text-[26px] sm:text-[34px]">Cruzando suas respostas com 20 anos de dados de satélite da sua região…</h1>
      <StepList done={done} className="mt-10" />
      <p className="sr-only" aria-live="polite">
        {done > 0 ? `${PROCESSING_STEPS[done - 1].label} concluído` : ''}
      </p>
    </div>
  )
}
