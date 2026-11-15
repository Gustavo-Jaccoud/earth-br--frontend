import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CloudOff,
  Info,
  OctagonAlert,
  RefreshCw,
  ShieldCheck,
  Satellite,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Minus,
  X,
  ClipboardPen,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { DATA_SOURCES, GLOSSARY, type GlossaryKey, type RiskLevel, type SourceId } from '@/data/mock'
import logoGreen from '@/assets/logo.png'
import logoWhite from '@/assets/logo-white.png'
import { Link, navigate } from '@/lib/router'
import { useStore } from '@/lib/store'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/* ------------------------------ Buttons ------------------------------ */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse'
type Size = 'md' | 'lg' | 'sm'

export function btn(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
    size === 'lg' && 'min-h-14 px-7 text-lg',
    size === 'md' && 'min-h-12 px-5 text-base',
    size === 'sm' && 'min-h-10 px-4 text-[15px]',
    variant === 'primary' && 'bg-primary text-on-primary hover:bg-primary-hover',
    variant === 'secondary' && 'border-2 border-primary text-primary bg-transparent hover:bg-tint',
    variant === 'ghost' && 'text-ink hover:bg-tint',
    variant === 'danger' && 'bg-crit text-white hover:opacity-90 dark:text-[#1a0806]',
    variant === 'inverse' && 'bg-white text-[#0F3D2A] hover:bg-[#E8F3EC]',
    extra,
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={btn(variant, size, className)} {...rest} />
}

export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  to: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={btn(variant, size, className)}>
      {children}
    </Link>
  )
}

/* ------------------------------ Cards ------------------------------ */

export function Card({ className, children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' | 'li' }) {
  return <As className={cx('rounded-[12px] border border-line bg-surface', className)}>{children}</As>
}

export function Logo({ inverse, size = 'md' }: { inverse?: boolean; size?: 'md' | 'lg' }) {
  const img = size === 'lg' ? 'size-9' : 'size-8'
  return (
    <span className={cx('inline-flex items-center gap-2 font-display font-extrabold tracking-tight whitespace-nowrap', size === 'lg' ? 'text-3xl' : 'text-2xl')}>
      {inverse ? (
        <img src={logoWhite} alt="" className={cx(img, 'object-contain')} />
      ) : (
        <>
          <img src={logoGreen} alt="" className={cx(img, 'object-contain dark:hidden')} />
          <img src={logoWhite} alt="" className={cx(img, 'hidden object-contain dark:block')} />
        </>
      )}
      <span className={inverse ? 'text-white' : 'text-heading'}>
        Earth<span className={inverse ? 'text-[#7FD3A5]' : 'text-primary'}>+</span>br
      </span>
    </span>
  )
}

/* -------------------------- Popover base -------------------------- */

function usePopover() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean }>({ top: 0, left: 0, above: false })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const w = Math.min(300, window.innerWidth - 24)
    const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12))
    const above = r.bottom + 180 > window.innerHeight && r.top > 200
    setPos({ top: above ? r.top - 8 : r.bottom + 8, left, above })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) setOpen(false)
    }
    const onScroll = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return { open, setOpen, pos, triggerRef, panelRef }
}

function PopoverPanel({
  id,
  pos,
  panelRef,
  children,
}: {
  id: string
  pos: { top: number; left: number; above: boolean }
  panelRef: React.RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  return (
    <div
      ref={panelRef}
      id={id}
      role="tooltip"
      className="fixed z-[60] w-[min(300px,calc(100vw-24px))] rounded-[12px] border border-line bg-surface p-4 text-left text-[15px] leading-normal text-ink shadow-xl"
      style={{ top: pos.top, left: pos.left, transform: pos.above ? 'translateY(-100%)' : undefined }}
    >
      {children}
    </div>
  )
}

/* ---------------------- "?" tooltip (glossary) ---------------------- */

export function InfoTip({ term, text, label }: { term?: GlossaryKey; text?: string; label?: string }) {
  const id = useId()
  const p = usePopover()
  const entry = term ? GLOSSARY[term] : undefined
  const title = label ?? entry?.term ?? 'Explanation'
  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={p.triggerRef}
        type="button"
        aria-label={`What is ${title}?`}
        aria-expanded={p.open}
        aria-describedby={p.open ? id : undefined}
        onClick={() => p.setOpen((o) => !o)}
        onMouseEnter={() => p.setOpen(true)}
        className="inline-flex size-7 items-center justify-center rounded-full text-muted hover:bg-tint hover:text-primary"
      >
        <CircleHelp className="size-[18px]" aria-hidden />
      </button>
      {p.open && (
        <PopoverPanel id={id} pos={p.pos} panelRef={p.panelRef}>
          <p className="mb-1 font-bold text-heading">{title}</p>
          <p className="text-muted">{text ?? entry?.plain}</p>
        </PopoverPanel>
      )}
    </span>
  )
}

/* ------------------------- Source badge ------------------------- */

export function SourceBadge({ ids, showDate = true, className }: { ids: SourceId[]; showDate?: boolean; className?: string }) {
  const id = useId()
  const p = usePopover()
  if (ids.length === 0) {
    return (
      <span className={cx('inline-flex items-center gap-1.5 rounded-full bg-tint-2 px-2.5 py-1 text-[13px] text-muted', className)}>
        <ClipboardPen className="size-3.5" aria-hidden /> Source: your answers
      </span>
    )
  }
  const sources = ids.map((s) => DATA_SOURCES[s])
  return (
    <span className={cx('inline-flex', className)}>
      <button
        ref={p.triggerRef}
        type="button"
        aria-expanded={p.open}
        aria-describedby={p.open ? id : undefined}
        onClick={() => p.setOpen((o) => !o)}
        className="inline-flex min-h-7 items-start gap-1.5 rounded-[10px] border border-line bg-tint-2 px-2.5 py-1 text-left text-[13px] leading-snug text-muted hover:border-primary hover:text-ink"
      >
        <Satellite className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          Source:{' '}
          {sources.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' / '}
              <span className="whitespace-nowrap font-bold text-ink">{s.name}</span>
            </span>
          ))}
          {showDate && <span className="whitespace-nowrap tabular"> · {sources[0].updatedAt}</span>}
        </span>
      </button>
      {p.open && (
        <PopoverPanel id={id} pos={p.pos} panelRef={p.panelRef}>
          <ul className="space-y-3">
            {sources.map((s) => (
              <li key={s.id}>
                <p className="font-bold text-heading">{s.name}</p>
                <p className="text-muted">{s.plain}</p>
                <p className="mt-1 text-[13px] text-muted tabular">
                  Resolution: {s.resolution} · Updated: {s.updatedAt}
                </p>
              </li>
            ))}
          </ul>
        </PopoverPanel>
      )}
    </span>
  )
}

/* ------------------------- Status / risk ------------------------- */

export type Tone = 'ok' | 'warn' | 'crit' | 'neutral'

const TONE_ICON: Record<Tone, LucideIcon> = { ok: CircleCheck, warn: TriangleAlert, crit: OctagonAlert, neutral: Info }

export function toneClasses(tone: Tone) {
  return {
    ok: 'bg-ok-bg text-ok-ink border-ok/30',
    warn: 'bg-warn-bg text-warn-ink border-warn/40',
    crit: 'bg-crit-bg text-crit-ink border-crit/30',
    neutral: 'bg-tint-2 text-muted border-line',
  }[tone]
}

export function StatusTag({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  const Icon = TONE_ICON[tone]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[14px] font-bold leading-tight', toneClasses(tone), className)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </span>
  )
}

export const RISK_META: Record<RiskLevel, { label: string; tone: Tone; icon: LucideIcon; bar: string }> = {
  baixo: { label: 'Low', tone: 'ok', icon: ShieldCheck, bar: 'bg-ok' },
  moderado: { label: 'Moderate', tone: 'warn', icon: TriangleAlert, bar: 'bg-warn' },
  alto: { label: 'High', tone: 'crit', icon: CircleAlert, bar: 'bg-crit' },
  critico: { label: 'Critical', tone: 'crit', icon: OctagonAlert, bar: 'bg-crit' },
}

export function RiskBadge({ level, prefix = 'risk', className }: { level: RiskLevel; prefix?: string; className?: string }) {
  const m = RISK_META[level]
  const Icon = m.icon
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[14px] font-bold leading-none',
        toneClasses(m.tone),
        level === 'critico' && 'border-2 border-crit',
        className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {prefix ? `${m.label} ${prefix.toLowerCase()}` : m.label}
    </span>
  )
}

/* ------------------------ Indicator card ------------------------ */

export type Indicator = {
  id: string
  label: string
  value: string
  unit: string
  comparison: string
  trend: 'up' | 'down' | 'flat'
  status: 'ok' | 'warn' | 'crit'
  statusLabel: string
  sources: SourceId[]
  help: GlossaryKey
}

export function IndicatorCard({ ind }: { ind: Indicator }) {
  const Trend = ind.trend === 'up' ? TrendingUp : ind.trend === 'down' ? TrendingDown : Minus
  const trendText = ind.trend === 'up' ? 'rising' : ind.trend === 'down' ? 'falling' : 'steady'
  return (
    <Card as="article" className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-[16px] font-bold text-muted">{ind.label}</h3>
        <InfoTip term={ind.help} />
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="font-display text-[44px] font-bold leading-none tracking-tight text-ink tabular">{ind.value}</span>
        {ind.unit && <span className="text-xl font-bold text-muted">{ind.unit}</span>}
        <span className="ml-auto inline-flex items-center gap-1 text-[14px] text-muted">
          <Trend className={cx('size-5', ind.status === 'ok' ? 'text-ok' : ind.status === 'warn' ? 'text-warn' : 'text-crit')} aria-hidden />
          {trendText}
        </span>
      </p>
      <StatusTag tone={ind.status} className="self-start">
        {ind.statusLabel}
      </StatusTag>
      <p className="text-[15px] text-muted tabular">{ind.comparison}</p>
      <div className="mt-auto pt-1">
        <SourceBadge ids={ind.sources} />
      </div>
    </Card>
  )
}

/* ------------------------------ Toasts ------------------------------ */

export function Toaster() {
  const { toasts, dismissToast } = useStore()
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[12px] bg-[#0F3D2A] px-4 py-3 text-white shadow-2xl dark:bg-[#E8F3EC] dark:text-[#0F3D2A]"
        >
          <CircleCheck className="size-6 shrink-0 text-[#7FD3A5] dark:text-[#1E7A4C]" aria-hidden />
          <p className="flex-1 font-bold">{t.message}</p>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                navigate(t.action!.to)
                dismissToast(t.id)
              }}
              className="rounded-full px-3 py-2 font-bold text-[#7FD3A5] underline underline-offset-4 hover:bg-white/10 dark:text-[#1E7A4C] dark:hover:bg-black/5"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={() => dismissToast(t.id)}
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-white/10 dark:hover:bg-black/5"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ---------------------- Skeleton / error / empty ---------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('animate-skeleton rounded-[8px] bg-line', className)} />
}

export function IndicatorSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5" as="div">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-11 w-1/2" />
      <Skeleton className="h-6 w-1/3 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-1/2 rounded-full" />
    </Card>
  )
}

/** `message` overrides the default text (e.g. an `ApiError` message). */
export function ErrorState({ onRetry, className, message }: { onRetry?: () => void; className?: string; message?: string | null }) {
  return (
    <div role="alert" className={cx('flex flex-col items-start gap-4 rounded-[12px] border border-crit/30 bg-crit-bg p-6 sm:flex-row sm:items-center', className)}>
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-crit">
        <CloudOff className="size-6" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-bold text-crit-ink">Could not load the data</p>
        <p className="text-ink">{message || 'We could not get the data right now. Please try again.'}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="size-5" aria-hidden /> Try again
        </Button>
      )}
    </div>
  )
}

export function InsufficientData({ className, to = '/propriedades/nova' }: { className?: string; to?: string }) {
  return (
    <div className={cx('flex flex-col items-start gap-4 rounded-[12px] border-2 border-dashed border-warn/60 bg-warn-bg p-6 sm:flex-row sm:items-center', className)}>
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-warn">
        <TriangleAlert className="size-6" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-bold text-warn-ink">Not enough data</p>
        <p className="text-ink">We need a registered property to show data for your land.</p>
      </div>
      <ButtonLink to={to} variant="secondary">
        Register a property
      </ButtonLink>
    </div>
  )
}

/* --------------------------- Placeholders --------------------------- */

export function ImagePlaceholder({ caption, className, compact }: { caption: string; className?: string; compact?: boolean }) {
  return (
    <div role="img" aria-label={caption} className={cx('placeholder-stripes flex items-center justify-center overflow-hidden rounded-[12px] p-4', className)}>
      <span className={cx('max-w-[90%] text-center font-bold text-placeholder-ink', compact ? 'text-[13px]' : 'text-[15px]')}>[IMAGE: {caption}]</span>
    </div>
  )
}

export function SupportNote({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <p className={cx('flex items-start gap-2 text-[15px] text-muted', className)}>
      <Info className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden />
      <span>{children ?? 'Earth+br supports, and does not replace, your own knowledge of the land and the guidance of local technical assistance.'}</span>
    </p>
  )
}

export function ValidationSeal({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/40 px-2.5 py-1 text-[13px] font-bold text-ink', className)}>
      <ClipboardPen className="size-4" aria-hidden /> Needs local technical validation
    </span>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <div className="mb-2 text-[15px] font-bold text-primary">{eyebrow}</div>}
        <h1 className="text-[32px] sm:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-2 text-lg text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

/** Simple accessible modal. */
export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'animate-rise flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[16px] bg-surface shadow-2xl outline-none sm:rounded-[16px]',
          wide ? 'max-w-5xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id={titleId} className="text-xl">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-tint">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
