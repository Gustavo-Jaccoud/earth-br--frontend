import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ChevronDown, GripVertical, Lightbulb, Sprout } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { QUICK_QUESTIONS, PROCESSING_STEPS, USER } from '@/data/mock'
import { Button, ImagePlaceholder, Skeleton, SupportNote, cx } from '@/components/ui'
import { Orbit, StepList } from './Properties'
import { NoProperty, RequestError, SUPPORT_TEXT, errorMessage } from './Reports'
import { api, type Question, type QuizAnswers } from '@/lib/api'
import { ICONS } from '@/lib/icons'
import { navigate } from '@/lib/router'
import { useStore } from '@/lib/store'

/* ------------------------------------------------------------------ */
/* Questions: text and options from the API, presentation from mock    */
/* ------------------------------------------------------------------ */

type ViewOption = { id: string; label: string; icon?: string; image?: string }
type ViewQuestion = { id: string; text: string; type: Question['type']; options: ViewOption[]; why?: string; note?: string }

/** Presentational metadata only (icon, why, note, image), matched to the API questions by id. */
type QuestionMeta = { id: string; why?: string; note?: string; options?: { id: string; icon?: string; image?: string }[] }
const META: QuestionMeta[] = QUICK_QUESTIONS

function withMeta(q: Question): ViewQuestion {
  const meta = META.find((m) => m.id === q.id)
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    why: meta?.why,
    note: meta?.note,
    options: q.options.map((o) => {
      const m = meta?.options?.find((x) => x.id === o.id)
      return { id: o.id, label: o.label, icon: m?.icon, image: m?.image }
    }),
  }
}

/** A stored answer is kept only if it is still valid for the question the server sent. */
function validAnswer(q: ViewQuestion, value: string | string[] | undefined): string | string[] | undefined {
  const ids = q.options.map((o) => o.id)
  if (q.type === 'single') return typeof value === 'string' && ids.includes(value) ? value : undefined
  if (!Array.isArray(value)) return undefined
  const picked = value.filter((v, i) => ids.includes(v) && value.indexOf(v) === i)
  if (q.type === 'multi') return picked.length > 0 ? picked : undefined
  return picked.length === ids.length ? picked : undefined
}

const MIN_PROCESSING_MS = 1800
const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

type Phase = { name: 'questions' } | { name: 'submitting' } | { name: 'failed'; message: string }

export default function QuickStart() {
  const { status, error, reload, quickAnswers, setQuickAnswers, setQuickReport, addReport, activeProperty } = useStore()
  const [questions, setQuestions] = useState<ViewQuestion[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [idx, setIdx] = useState(-1) // -1 = welcome
  const [answers, setAnswers] = useState<QuizAnswers>(quickAnswers)
  const [phase, setPhase] = useState<Phase>({ name: 'questions' })
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadError(null)
    api
      .quiz()
      .then((list) => {
        if (!cancelled) setQuestions(list.map(withMeta))
      })
      .catch((e) => {
        if (!cancelled) setLoadError(errorMessage(e))
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [idx, phase.name])

  const submit = useCallback(
    async (plotId: number, final: QuizAnswers) => {
      setPhase({ name: 'submitting' })
      try {
        // The processing screen lasts as long as the request, with a short minimum so it does not flash.
        const [report] = await Promise.all([api.submitQuiz(plotId, final), sleep(MIN_PROCESSING_MS)])
        setQuickReport(report)
        addReport(report)
        if (mounted.current) navigate('/app/partida/relatorio')
      } catch (e) {
        if (mounted.current) setPhase({ name: 'failed', message: errorMessage(e) })
      }
    },
    [setQuickReport, addReport],
  )

  if (status === 'error') return <RequestError message={error ?? 'Could not load your data.'} onRetry={() => void reload()} className="mx-auto max-w-3xl" />
  if (loadError) return <RequestError message={loadError} onRetry={() => setAttempt((n) => n + 1)} className="mx-auto max-w-3xl" />
  if (status === 'loading' || !questions) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6">
        <p className="sr-only" role="status">
          Loading the questions…
        </p>
        <Skeleton className="h-24 w-full max-w-2xl rounded-[20px]" />
        <Skeleton className="h-20 w-full max-w-2xl rounded-[20px]" />
        <Skeleton className="h-14 w-48 rounded-full" />
      </div>
    )
  }
  if (!activeProperty) return <NoProperty what="The Quick start crosses your answers with satellite data for your field, so it needs a registered property." />
  if (questions.length === 0) return <RequestError message="The server returned no questions." onRetry={() => setAttempt((n) => n + 1)} className="mx-auto max-w-3xl" />

  const total = questions.length

  /** Answers in the format the API expects; a rank question left untouched keeps the order shown. */
  const finalAnswers = (a: QuizAnswers): QuizAnswers => {
    const final: QuizAnswers = {}
    for (const question of questions) {
      const v = validAnswer(question, a[question.id]) ?? (question.type === 'rank' ? question.options.map((o) => o.id) : undefined)
      if (v !== undefined) final[question.id] = v
    }
    return final
  }

  if (phase.name !== 'questions') {
    return (
      <Processing
        error={phase.name === 'failed' ? phase.message : null}
        onRetry={() => void submit(activeProperty.plotId, finalAnswers(answers))}
        onBack={() => {
          setPhase({ name: 'questions' })
          setIdx(total - 1)
        }}
      />
    )
  }

  if (idx === -1) {
    return (
      <div className="mx-auto max-w-3xl py-6">
        <Bubble>
          <p>
            Hi, {USER.firstName}! I am going to ask{' '}
            <strong>
              {total} quick {total === 1 ? 'question' : 'questions'}
            </strong>{' '}
            about {activeProperty.name}. There are no right or wrong answers — answer in your own way.
          </p>
        </Bubble>
        <Bubble delay>
          <p>Then I combine your answers with rain and soil-moisture data for your field and show your risk, the likely impacts and a comparison of rotation options.</p>
        </Bubble>
        <div className="mt-10 flex flex-wrap items-center gap-4 pl-0 sm:pl-16">
          <Button size="lg" onClick={() => setIdx(0)}>
            Let's start <ArrowRight className="size-5" aria-hidden />
          </Button>
          <span className="text-muted">It takes about 4 minutes</span>
        </div>
        <SupportNote className="mt-12 sm:pl-16">{SUPPORT_TEXT}</SupportNote>
      </div>
    )
  }

  const q = questions[Math.min(idx, total - 1)]
  const value = validAnswer(q, answers[q.id])
  const answered = q.type === 'rank' || value !== undefined
  const update = (v: string | string[]) => setAnswers((a) => ({ ...a, [q.id]: v }))
  const last = idx >= total - 1
  const goNext = () => {
    if (!last) return setIdx(idx + 1)
    const final = finalAnswers(answers)
    setQuickAnswers(final)
    const missing = questions.findIndex((x) => final[x.id] === undefined)
    if (missing >= 0) return setIdx(missing)
    void submit(activeProperty.plotId, final)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[16px]">
          <span className="font-bold text-ink tabular">
            Question {idx + 1} of {total}
          </span>
          <span className="text-muted tabular">{Math.round((idx / total) * 100)}% complete</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={idx + 1} aria-label="Quick start progress">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div key={q.id} className="animate-rise">
        <div className="flex items-start gap-4">
          <Avatar />
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] leading-tight sm:text-[34px]">{q.text}</h1>
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
          <ArrowLeft className="size-5" aria-hidden /> Back
        </Button>
        <Button size="lg" disabled={!answered} onClick={goNext}>
          {last ? 'See my result' : 'Continue'} <ArrowRight className="size-5" aria-hidden />
        </Button>
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

function Bubble({ children, delay }: { children: ReactNode; delay?: boolean }) {
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
        <Lightbulb className="size-5" aria-hidden /> Why do we ask this?
        <ChevronDown className={cx('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && <p className="animate-rise mt-2 max-w-2xl rounded-[12px] bg-tint-2 p-4 text-[17px] text-ink">{text}</p>}
    </div>
  )
}

/** Icon for an option, or nothing when the option has no presentational metadata. */
function OptionIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? ICONS[name] : undefined
  return Icon ? <Icon className={className} aria-hidden /> : null
}

function OptionCard({ selected, onClick, icon, label, role, children }: { selected: boolean; onClick: () => void; icon?: string; label: string; role: 'radio' | 'checkbox'; children?: ReactNode }) {
  const hasIcon = !!icon && !!ICONS[icon]
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
        {hasIcon && (
          <span className={cx('inline-flex size-12 shrink-0 items-center justify-center rounded-full transition-colors', selected ? 'bg-primary text-on-primary' : 'bg-tint text-primary')}>
            <OptionIcon name={icon} className="size-6" />
          </span>
        )}
        <span className="flex-1 text-[19px] font-bold leading-snug text-ink">{label}</span>
        <span className={cx('inline-flex size-7 shrink-0 items-center justify-center border-2', role === 'radio' ? 'rounded-full' : 'rounded-[8px]', selected ? 'border-primary bg-primary text-on-primary' : 'border-muted/40')}>
          {selected && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </span>
      </span>
    </button>
  )
}

function SingleOptions({ q, value, onChange }: { q: ViewQuestion; value?: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label={q.text} className={cx('grid gap-4', q.options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {q.options.map((o) => (
        <OptionCard key={o.id} role="radio" selected={value === o.id} onClick={() => onChange(o.id)} icon={o.icon} label={o.label} />
      ))}
    </div>
  )
}

/** Option id that means "none of these": choosing it clears the others, and vice versa. */
const NONE_OPTION = 'nao'

function MultiOptions({ q, value, onChange }: { q: ViewQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => {
    if (id === NONE_OPTION) return onChange(value.includes(NONE_OPTION) ? [] : [NONE_OPTION])
    const base = value.filter((v) => v !== NONE_OPTION)
    onChange(base.includes(id) ? base.filter((v) => v !== id) : [...base, id])
  }
  return (
    <div role="group" aria-label={q.text} className="grid gap-4 sm:grid-cols-2">
      {q.options.map((o) => (
        <OptionCard key={o.id} role="checkbox" selected={value.includes(o.id)} onClick={() => toggle(o.id)} icon={o.icon} label={o.label}>
          {o.image && <ImagePlaceholder caption={o.image} compact className="aspect-[4/3] rounded-none" />}
        </OptionCard>
      ))}
    </div>
  )
}

function RankOptions({ q, value, onChange }: { q: ViewQuestion; value: string[]; onChange: (v: string[]) => void }) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const byId = Object.fromEntries(q.options.map((o) => [o.id, o]))

  const move = (from: number, to: number) => {
    if (from < 0 || to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    setAnnounce(`${byId[item].label} is now in position ${to + 1}`)
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
              <span className={cx('inline-flex size-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold tabular', i === 0 ? 'bg-primary text-on-primary' : 'bg-tint text-primary')}>{i + 1}</span>
              <OptionIcon name={o.icon} className="hidden size-6 shrink-0 text-primary sm:block" />
              <span className="flex-1 text-[19px] font-bold text-ink">
                {o.label}
                {i === 0 && <span className="ml-2 align-middle text-[14px] font-normal text-primary">most important</span>}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${o.label} up`} className="inline-flex size-12 items-center justify-center rounded-full text-ink hover:bg-tint disabled:opacity-30">
                  <ArrowUp className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label={`Move ${o.label} down`} className="inline-flex size-12 items-center justify-center rounded-full text-ink hover:bg-tint disabled:opacity-30">
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

/** Shown while the answers are being sent; the steps advance on a timer and the last one waits for the server. */
function Processing({ error, onRetry, onBack }: { error: string | null; onRetry: () => void; onBack: () => void }) {
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (error) return
    setDone(0)
    const timers = PROCESSING_STEPS.slice(0, -1).map((_, i) => window.setTimeout(() => setDone(i + 1), 500 * (i + 1)))
    return () => timers.forEach(clearTimeout)
  }, [error])

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center">
        <h1 className="mb-6 text-[26px] sm:text-[34px]">We could not generate your report</h1>
        <RequestError message={error} onRetry={onRetry}>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-5" aria-hidden /> Back to the questions
          </Button>
        </RequestError>
        <p className="mt-4 text-muted">Your answers are still here — nothing was lost.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <Orbit />
      <h1 className="mt-10 max-w-2xl text-[26px] sm:text-[34px]">Combining your answers with climate data for your field…</h1>
      <StepList done={done} className="mt-10" />
      <p className="sr-only" role="status">
        Generating your report…
      </p>
    </div>
  )
}
