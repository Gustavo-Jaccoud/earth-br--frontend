import { Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '@/components/ui'
import type { Crop } from '@/lib/api'

/** Group headings, in the order they are listed. Categories the server adds later go to the end. */
const CATEGORY_LABEL: Record<string, string> = {
  grain: 'Grains',
  legume: 'Legumes',
  root: 'Roots and tubers',
  oilseed: 'Oilseeds',
  fibre: 'Fibre',
  vegetable: 'Vegetables',
  fruit: 'Fruit',
  forage: 'Forage',
  other: 'Other',
}
const CATEGORY_ORDER = Object.keys(CATEGORY_LABEL)

const categoryLabel = (c: string) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1)

/** Lower case, without accents, so "acai" finds "Açaí". */
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Value of the "not growing anything" choice. */
export const NO_CROP = ''

type Props = {
  crops: Crop[]
  /** Crop id, `NO_CROP` ('') for "none", or null while nothing has been chosen. */
  value: string | null
  onChange: (value: string | null) => void
  /** Id given to the search box, so an outer <label> can point at it. */
  id: string
  invalid?: boolean
}

/** Single-choice crop list with a search box; the whole catalogue stays browsable, grouped by category. */
export default function CropPicker({ crops, value, onChange, id, invalid = false }: Props) {
  const [query, setQuery] = useState('')
  /** Index in `options` of the option the arrow keys are on; -1 = none yet. */
  const [active, setActiveState] = useState(-1)
  /** Same value, readable at once: several key presses can arrive before the next render. */
  const activeNow = useRef(-1)
  const setActive = (i: number) => {
    activeNow.current = i
    setActiveState(i)
  }
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const q = plain(query)
  const groups = useMemo(() => {
    const match = (c: Crop) => !q || [c.name, categoryLabel(c.category), c.category].some((t) => plain(t).includes(q))
    const byCategory = new Map<string, Crop[]>()
    for (const c of crops) if (match(c)) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c])
    const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length)
    return [...byCategory.entries()]
      .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
      .map(([category, items]) => ({ category, items: items.sort((a, b) => a.name.localeCompare(b.name)) }))
  }, [crops, q])

  /** Every option in the order shown: "none" first, then the crops group by group. */
  const options = useMemo(() => [NO_CROP, ...groups.flatMap((g) => g.items.map((c) => c.id))], [groups])
  const found = options.length - 1
  const optionId = (v: string) => `${id}-opt-${v || 'none'}`

  // Typing a search puts the keyboard on the first crop found, so Enter chooses it.
  useEffect(() => {
    setActive(q && found > 0 ? 1 : -1)
    if (list.current) list.current.scrollTop = 0
  }, [q, found])

  const move = (to: number) => {
    const i = Math.max(0, Math.min(options.length - 1, to))
    setActive(i)
    document.getElementById(optionId(options[i]))?.scrollIntoView({ block: 'nearest' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const at = activeNow.current
    if (e.key === 'ArrowDown') move(at + 1)
    else if (e.key === 'ArrowUp') move(at - 1)
    else if (e.key === 'Home' && at >= 0) move(0)
    else if (e.key === 'End' && at >= 0) move(options.length - 1)
    else if (e.key === 'Enter' && at >= 0 && at < options.length) onChange(options[at])
    else if (e.key === 'Escape' && query) setQuery('')
    else return
    e.preventDefault()
  }

  const selected = value ? crops.find((c) => c.id === value) : undefined
  const activeValue = active >= 0 ? options[active] : undefined

  const option = (v: string, title: string, detail?: string, note?: string) => {
    const isSelected = value === v
    return (
      <li
        key={v}
        id={optionId(v)}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          onChange(v)
          setActive(options.indexOf(v))
        }}
        className={cx(
          'flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border-2 px-3 py-2',
          isSelected ? 'border-primary bg-tint' : 'border-transparent hover:bg-tint-2',
          activeValue === v && 'outline-2 -outline-offset-2 outline-primary',
        )}
      >
        <span className={cx('inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2', isSelected ? 'border-primary bg-primary text-on-primary' : 'border-muted/50')}>
          {isSelected && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3">
          <span>
            <span className="font-bold text-ink">{title}</span>
            {detail && <span className="block text-[15px] text-muted">{detail}</span>}
          </span>
          {note && <span className="text-[13px] text-muted">{note}</span>}
        </span>
      </li>
    )
  }

  return (
    <div>
      {/* Current choice: always visible, with a way to undo it. */}
      <div
        className={cx(
          'mb-3 flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[12px] border-2 px-4 py-2',
          value === null ? 'border-dashed border-line bg-tint-2' : 'border-primary bg-tint',
        )}
      >
        <p className="min-w-0" aria-live="polite">
          <span className="block text-[13px] text-muted">Your choice</span>
          {value === null ? (
            <span className="text-muted">Nothing chosen yet</span>
          ) : (
            <span className="font-bold text-ink">
              {value === NO_CROP ? 'None — not growing anything now' : (selected?.name ?? value)}
              {selected && <span className="font-normal text-muted"> · {categoryLabel(selected.category)}</span>}
            </span>
          )}
        </p>
        {value !== null && (
          <button
            type="button"
            onClick={() => {
              onChange(null)
              input.current?.focus()
            }}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-primary hover:bg-surface"
          >
            <X className="size-[18px]" aria-hidden /> Clear choice
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={input}
          id={id}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeValue !== undefined ? optionId(activeValue) : undefined}
          aria-describedby={`${id}-count`}
          aria-invalid={invalid}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search a crop, e.g. maize, cotton, fruit"
          className="min-h-12 w-full rounded-[12px] border-2 border-line bg-surface pl-12 pr-12 text-[17px] text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none aria-[invalid=true]:border-crit"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear the search"
            onClick={() => {
              setQuery('')
              input.current?.focus()
            }}
            className="absolute right-1.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-tint hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>
      <p id={`${id}-count`} className="mt-1.5 text-[14px] text-muted" aria-live="polite">
        {q ? `${found} of ${crops.length} crops match “${query.trim()}”` : `${crops.length} crops · type to search, or browse the list`}
      </p>

      <div
        ref={list}
        id={`${id}-list`}
        role="listbox"
        aria-label="Current crop"
        className="mt-2 max-h-[min(26rem,65vh)] overflow-y-auto overscroll-contain rounded-[12px] border-2 border-line bg-surface p-2"
      >
        <ul role="presentation">{option(NO_CROP, 'None', 'Not growing anything now, or a crop that is not in the list')}</ul>
        {groups.map((g) => (
          <ul key={g.category} role="group" aria-labelledby={`${id}-group-${g.category}`} className="mt-2">
            <li role="presentation" id={`${id}-group-${g.category}`} className="sticky -top-2 z-[1] bg-surface px-3 pb-1 pt-2 text-[13px] font-bold uppercase tracking-wide text-muted">
              {categoryLabel(g.category)}
            </li>
            {g.items.map((c) => option(c.id, c.name, undefined, c.gaez_name === null ? 'No suitability data yet' : undefined))}
          </ul>
        ))}
        {q && found === 0 && (
          <div role="status" className="mt-2 rounded-[10px] bg-tint-2 px-4 py-5 text-center">
            <p className="font-bold text-ink">No crop matches “{query.trim()}”</p>
            <p className="mt-1 text-[15px] text-muted">Check the spelling or try another name. If your crop is not in the list, choose “None” above.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                input.current?.focus()
              }}
              className="mt-3 inline-flex min-h-10 items-center rounded-full border-2 border-primary px-4 text-[15px] font-bold text-primary hover:bg-tint"
            >
              Show all crops
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
