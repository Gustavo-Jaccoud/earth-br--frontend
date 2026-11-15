import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { btn, cx } from './ui'

/**
 * Small guided tour: dims the page, spotlights one element at a time and shows an explanation
 * card with an arrow pointing at it. No dependencies.
 *
 * `target` is a CSS selector, or a bare name that stands for `[data-tour="name"]`.
 * Steps whose target is not on screen when the tour starts are left out.
 */
export type TourStep = { target: string; title: string; text: string }
export type TourCloseReason = 'done' | 'skip' | 'empty'

export function tourSeen(key: string) {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

export function markTourSeen(key: string) {
  try {
    localStorage.setItem(key, 'done')
  } catch {
    /* storage unavailable: the tour simply shows again next time */
  }
}

function findTarget(target: string): HTMLElement | null {
  const selector = /^[\w-]+$/.test(target) ? `[data-tour="${target}"]` : target
  let el: HTMLElement | null = null
  try {
    el = document.querySelector<HTMLElement>(selector)
  } catch {
    return null
  }
  return el && el.getClientRects().length > 0 ? el : null
}

function isFixed(el: HTMLElement) {
  for (let n: HTMLElement | null = el; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).position === 'fixed') return true
  }
  return false
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi))

type Side = 'top' | 'bottom' | 'left' | 'right'
type Geo = {
  spot: { top: number; left: number; width: number; height: number } | null
  card: { top: number; left: number }
  side: Side | null
  /** Arrow offset along the card edge, in px. */
  arrow: number
}

const MARGIN = 12 // minimum distance between the card and the viewport edge
const GAP = 16 // distance between the spotlight and the card (room for the arrow)
const PAD = 6 // spotlight padding around the target
const TOP_INSET = 88 // keeps tall targets clear of the sticky top bar on phones

function computeGeo(r: DOMRect | null, cw: number, ch: number, vw: number, vh: number): Geo {
  const centered: Geo = { spot: null, card: { top: clamp((vh - ch) / 2, MARGIN, vh - ch - MARGIN), left: clamp((vw - cw) / 2, MARGIN, vw - cw - MARGIN) }, side: null, arrow: 0 }
  if (!r) return centered
  const top = Math.max(4, r.top - PAD)
  const left = Math.max(4, r.left - PAD)
  const right = Math.min(vw - 4, r.right + PAD)
  let bottom = Math.min(vh - 4, r.bottom + PAD)
  if (bottom - top < 24 || right - left < 24) return centered // target is off screen (e.g. while scrolling)

  let side: Side
  if (bottom + GAP + ch <= vh - MARGIN) side = 'bottom'
  else if (top - GAP - ch >= MARGIN) side = 'top'
  else if (right + GAP + cw <= vw - MARGIN) side = 'right'
  else if (left - GAP - cw >= MARGIN) side = 'left'
  else {
    // Target taller than the room left: spotlight its upper part and put the card right below.
    bottom = Math.max(top + 72, vh - MARGIN - ch - GAP)
    side = 'bottom'
  }

  const cx0 = (left + right) / 2
  const cy0 = (top + bottom) / 2
  let ct: number
  let cl: number
  let arrow: number
  if (side === 'bottom' || side === 'top') {
    ct = clamp(side === 'bottom' ? bottom + GAP : top - GAP - ch, MARGIN, vh - ch - MARGIN)
    cl = clamp(cx0 - cw / 2, MARGIN, vw - cw - MARGIN)
    arrow = clamp(cx0 - cl, 24, cw - 24)
  } else {
    cl = clamp(side === 'right' ? right + GAP : left - GAP - cw, MARGIN, vw - cw - MARGIN)
    ct = clamp(cy0 - ch / 2, MARGIN, vh - ch - MARGIN)
    arrow = clamp(cy0 - ct, 24, ch - 24)
  }
  return { spot: { top, left, width: right - left, height: bottom - top }, card: { top: ct, left: cl }, side, arrow }
}

/** Arrow on the card edge that faces the target (a rotated square sharing the card's fill and border). */
function arrowStyle(side: Side, offset: number): React.CSSProperties {
  const half = 7
  switch (side) {
    case 'bottom':
      return { top: -half - 1, left: offset - half, borderLeftWidth: 1, borderTopWidth: 1 }
    case 'top':
      return { bottom: -half - 1, left: offset - half, borderRightWidth: 1, borderBottomWidth: 1 }
    case 'right':
      return { left: -half - 1, top: offset - half, borderLeftWidth: 1, borderBottomWidth: 1 }
    case 'left':
      return { right: -half - 1, top: offset - half, borderRightWidth: 1, borderTopWidth: 1 }
  }
}

export function Tour({ steps, open, onClose, label = 'Guided tour' }: { steps: TourStep[]; open: boolean; onClose: (reason: TourCloseReason) => void; label?: string }) {
  if (!open) return null
  return <TourRun steps={steps} onClose={onClose} label={label} />
}

function TourRun({ steps, onClose, label }: { steps: TourStep[]; onClose: (reason: TourCloseReason) => void; label: string }) {
  const [active] = useState(() => steps.filter((s) => findTarget(s.target)))
  const [index, setIndex] = useState(0)
  const [geo, setGeo] = useState<Geo | null>(null)
  const [radius, setRadius] = useState(14)
  const cardRef = useRef<HTMLDivElement>(null)
  const textId = useId()
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  const step = active[index] as TourStep | undefined
  const target = step?.target
  const isLast = index === active.length - 1

  const measure = useCallback(() => {
    const card = cardRef.current
    if (!card || !target) return
    const el = findTarget(target)
    // Round targets (e.g. a floating button) get a round spotlight.
    const own = el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 0
    setRadius(el && own >= Math.min(el.offsetWidth, el.offsetHeight) / 2 ? 9999 : 14)
    setGeo(computeGeo(el ? el.getBoundingClientRect() : null, card.offsetWidth, card.offsetHeight, document.documentElement.clientWidth, window.innerHeight))
  }, [target])

  // Nothing to show (no target on screen): close without marking anything.
  useEffect(() => {
    if (active.length === 0) closeRef.current('empty')
  }, [active.length])

  // Bring the step's target into view, then place the spotlight and the card.
  useLayoutEffect(() => {
    if (!target) return
    const el = findTarget(target)
    if (el && !isFixed(el)) {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const delta = r.height <= vh * 0.5 ? r.top - (vh - r.height) / 2 : r.top - TOP_INSET
      if (Math.abs(delta) > 4) window.scrollBy({ top: delta, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }
    measure()
  }, [target, measure])

  // Follow scrolling, resizing and layout changes.
  useEffect(() => {
    let frame = 0
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    window.addEventListener('scroll', schedule, { capture: true, passive: true })
    window.addEventListener('resize', schedule)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
    ro?.observe(document.body)
    if (cardRef.current) ro?.observe(cardRef.current)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      ro?.disconnect()
    }
  }, [measure])

  // Focus moves into the card and goes back where it was afterwards.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    cardRef.current?.focus({ preventScroll: true })
    return () => {
      if (prev && prev !== document.body && prev.isConnected) prev.focus({ preventScroll: true })
    }
  }, [])

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, active.length - 1)), [active.length])
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current('skip')
      } else if (e.key === 'ArrowRight') {
        next()
      } else if (e.key === 'ArrowLeft') {
        back()
      } else if (e.key === 'Tab') {
        // Keep keyboard focus inside the card while the tour is open.
        const card = cardRef.current
        if (!card) return
        const items = [...card.querySelectorAll<HTMLElement>('button:not([disabled])')]
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const current = document.activeElement
        if (!card.contains(current) || current === card) {
          e.preventDefault()
          ;(e.shiftKey ? last : first).focus()
        } else if (e.shiftKey && current === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && current === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back])

  if (!step) return null

  return createPortal(
    <div className="no-print" data-tour-root="">
      {/* Blocks clicks on the page while the tour is open; dims it when there is no spotlight. */}
      <div aria-hidden className={cx('fixed inset-0 z-[85]', !geo?.spot && 'bg-[rgba(6,16,10,0.66)]')} />
      {geo?.spot && (
        <div
          aria-hidden
          data-tour-spot=""
          className="pointer-events-none fixed z-[85]"
          style={{ ...geo.spot, borderRadius: radius, boxShadow: '0 0 0 3px var(--c-primary), 0 0 0 200vmax rgba(6,16,10,0.66)' }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${label}: ${step.title}`}
        aria-describedby={textId}
        tabIndex={-1}
        data-tour-card=""
        data-side={geo?.side ?? 'none'}
        className="fixed z-[86] w-[min(340px,calc(100vw-24px))] rounded-[12px] border border-line bg-surface p-5 text-ink shadow-2xl outline-none"
        style={geo ? { top: geo.card.top, left: geo.card.left } : { top: 0, left: 0, opacity: 0 }}
      >
        {geo?.side && <span aria-hidden data-tour-arrow="" className="absolute size-[14px] rotate-45 border-line bg-surface" style={arrowStyle(geo.side, geo.arrow)} />}
        <div key={index} className="animate-rise" aria-live="polite">
          <p className="text-[14px] font-bold text-primary tabular" data-tour-count="">
            {index + 1} of {active.length}
          </p>
          <h2 className="mt-1 text-[19px]">
            {step.title}
          </h2>
          <p id={textId} className="mt-1.5 text-[16px] text-muted">
            {step.text}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {!isLast && (
            <button type="button" onClick={() => onClose('skip')} className="-ml-2 inline-flex min-h-10 items-center rounded-full px-3 text-[15px] font-bold text-muted underline-offset-4 hover:bg-tint hover:text-ink hover:underline">
              Skip
            </button>
          )}
          <span className="flex-1" />
          {index > 0 && (
            <button type="button" onClick={back} className={btn('secondary', 'sm')}>
              Back
            </button>
          )}
          {isLast ? (
            <button type="button" onClick={() => onClose('done')} className={btn('primary', 'sm')}>
              Done
            </button>
          ) : (
            <button type="button" onClick={next} className={btn('primary', 'sm')}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
