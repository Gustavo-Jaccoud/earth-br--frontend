import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { INITIAL_REPORTS, PROPERTIES, type Property, type Report } from '@/data/mock'

export type Toast = { id: number; message: string; action?: { label: string; to: string } }
export type QuickAnswers = Record<string, string | string[]>

type Persisted = {
  theme: 'light' | 'dark'
  largeText: boolean
  properties: Property[]
  activePropertyId: string
  reports: Report[]
}

type Store = Persisted & {
  activeProperty: Property
  toggleTheme: () => void
  setLargeText: (v: boolean) => void
  addProperty: (p: Property) => void
  updateProperty: (p: Property) => void
  /** Remove a propriedade e os relatórios ligados a ela. */
  deleteProperty: (id: string) => void
  setActiveProperty: (id: string) => void
  addReport: (r: Report) => void
  deleteReport: (id: string) => void
  clearReports: () => void
  resetDemo: () => void
  toasts: Toast[]
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  quickAnswers: QuickAnswers
  setQuickAnswers: (a: QuickAnswers) => void
  simulateError: boolean
  setSimulateError: (v: boolean) => void
}

const KEY = 'terra-plus-state-v1'

const DEFAULTS: Persisted = {
  theme: 'light',
  largeText: false,
  properties: PROPERTIES,
  activePropertyId: PROPERTIES[0].id,
  reports: INITIAL_REPORTS,
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [quickAnswers, setQuickAnswers] = useState<QuickAnswers>({})
  const [simulateError, setSimulateError] = useState(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
    document.documentElement.style.fontSize = state.largeText ? '112.5%' : ''
  }, [state.theme, state.largeText])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const pushToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((list) => [...list, { ...t, id }])
      window.setTimeout(() => dismissToast(id), 6000)
    },
    [dismissToast],
  )

  const value = useMemo<Store>(() => {
    const activeProperty = state.properties.find((p) => p.id === state.activePropertyId) ?? state.properties[0]
    return {
      ...state,
      activeProperty,
      toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLargeText: (v) => setState((s) => ({ ...s, largeText: v })),
      addProperty: (p) => setState((s) => ({ ...s, properties: [...s.properties, p], activePropertyId: p.id })),
      updateProperty: (p) => setState((s) => ({ ...s, properties: s.properties.map((x) => (x.id === p.id ? p : x)), activePropertyId: p.id })),
      deleteProperty: (id) =>
        setState((s) => {
          const properties = s.properties.filter((p) => p.id !== id)
          if (properties.length === 0) return s
          const activePropertyId = s.activePropertyId === id ? properties[0].id : s.activePropertyId
          return { ...s, properties, activePropertyId, reports: s.reports.filter((r) => r.propertyId !== id) }
        }),
      setActiveProperty: (id) => setState((s) => ({ ...s, activePropertyId: id })),
      addReport: (r) => setState((s) => ({ ...s, reports: [r, ...s.reports.filter((x) => x.id !== r.id)] })),
      deleteReport: (id) => setState((s) => ({ ...s, reports: s.reports.filter((r) => r.id !== id) })),
      clearReports: () => setState((s) => ({ ...s, reports: [] })),
      resetDemo: () => setState({ ...DEFAULTS, theme: state.theme, largeText: state.largeText }),
      toasts,
      pushToast,
      dismissToast,
      quickAnswers,
      setQuickAnswers,
      simulateError,
      setSimulateError,
    }
  }, [state, toasts, pushToast, dismissToast, quickAnswers, simulateError])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore precisa estar dentro de StoreProvider')
  return s
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function todayIso() {
  return '2026-11-14'
}
