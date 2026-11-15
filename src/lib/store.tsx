import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, squareAround, type Farm, type LonLat, type Plot, type QuizAnswers, type Report, type ReportSummary } from '@/lib/api'
import { ringToPolygon } from '@/lib/geo'

export type Toast = { id: number; message: string; action?: { label: string; to: string } }

/** A property = one backend farm with its (single) field. */
export type Property = {
  /** Backend farm id. */
  id: number
  /** Backend plot id — every data endpoint takes this. */
  plotId: number
  name: string
  state: string
  city: string
  areaHa: number
  /** Backend crop id (see `api.crops()`), or null. */
  currentCrop: string | null
  /** Centre of the query square. */
  lat: number
  lon: number
  /** Real boundary of the field, GeoJSON ring ([lon, lat] pairs) — what maps show. */
  polygon: LonLat[]
  /** Server-made rectangle that encloses the whole boundary: the reference area for NASA POWER queries. Not the field outline. */
  queryPolygon: LonLat[]
}

/** The field is either a square of `areaHa` around a point, or an outline drawn by the user. */
export type NewProperty = { name: string; state: string; city: string; currentCrop: string | null } & (
  | { areaHa: number; lat: number; lon: number; boundary?: undefined }
  /** Corners of the drawn outline, in order, [lon, lat] pairs, not closed (at least 3). */
  | { boundary: LonLat[] }
)

function toProperty(farm: Farm, plot: Plot): Property {
  return {
    id: farm.id,
    plotId: plot.id,
    name: farm.name,
    state: farm.state,
    city: farm.municipality,
    areaHa: plot.area_ha,
    currentCrop: plot.current_crop,
    lat: plot.centroid[1],
    lon: plot.centroid[0],
    polygon: plot.geometry.coordinates[0],
    // Older servers do not send the query square; it then equals the boundary.
    queryPolygon: (plot.query_geometry ?? plot.geometry).coordinates[0],
  }
}

type Prefs = { theme: 'light' | 'dark'; largeText: boolean; activePropertyId: number | null }

type Store = {
  theme: Prefs['theme']
  largeText: boolean
  toggleTheme: () => void
  setLargeText: (v: boolean) => void

  /** 'loading' until the first server load ends; 'error' when the server could not be reached. */
  status: 'loading' | 'ready' | 'error'
  /** Server error message when status is 'error'. */
  error: string | null
  /** Reloads properties and reports from the server. */
  reload: () => Promise<void>

  properties: Property[]
  /** null while loading or when no property exists yet. */
  activeProperty: Property | null
  setActiveProperty: (id: number) => void
  /** Creates the farm and its field on the server and makes it active. Rejects with ApiError. */
  addProperty: (p: NewProperty) => Promise<Property>

  /** Saved reports (newest first), from the server. `plot_id` links to `Property.plotId`. */
  reports: ReportSummary[]
  /** Call after creating a report so lists update without a full reload. */
  addReport: (r: Report | ReportSummary) => void

  toasts: Toast[]
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void

  /** Quick-start answers in progress (not persisted). */
  quickAnswers: QuizAnswers
  setQuickAnswers: (a: QuizAnswers) => void
  /** Last quick-start report returned by the server, shown by the report page. */
  quickReport: Report | null
  setQuickReport: (r: Report | null) => void
}

const KEY = 'earth-br-prefs-v1'
const DEFAULT_PREFS: Prefs = { theme: 'light', largeText: false, activePropertyId: null }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

async function fetchProperties(): Promise<Property[]> {
  const farms = await api.listFarms()
  const plots = await Promise.all(farms.map((f) => api.listPlots(f.id)))
  return farms.flatMap((farm, i) => {
    const plot = plots[i][0]
    if (!plot) return []
    return [toProperty(farm, plot)]
  })
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [status, setStatus] = useState<Store['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [quickAnswers, setQuickAnswers] = useState<QuizAnswers>({})
  const [quickReport, setQuickReport] = useState<Report | null>(null)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  }, [prefs])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark')
    document.documentElement.style.fontSize = prefs.largeText ? '112.5%' : ''
  }, [prefs.theme, prefs.largeText])

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const [props, reps] = await Promise.all([fetchProperties(), api.listReports()])
      setProperties(props)
      setReports(reps)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const pushToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((list) => [...list, { ...t, id }])
      window.setTimeout(() => dismissToast(id), 6000)
    },
    [dismissToast],
  )

  // Farm already created by an attempt whose field was rejected: reused on retry so no empty farm is left behind twice.
  const pendingFarm = useRef<Farm | null>(null)
  const addProperty = useCallback(async (p: NewProperty): Promise<Property> => {
    const kept = pendingFarm.current
    const farm = kept && kept.name === p.name && kept.municipality === p.city && kept.state === p.state ? kept : await api.createFarm({ name: p.name, municipality: p.city, state: p.state })
    pendingFarm.current = farm
    // `geometry` is the real boundary; the server derives the query square from it.
    const geometry = p.boundary ? ringToPolygon(p.boundary) : squareAround(p.lat, p.lon, p.areaHa)
    const plot = await api.createPlot(farm.id, { name: p.name, current_crop: p.currentCrop, geometry })
    pendingFarm.current = null
    const property = toProperty(farm, plot)
    setProperties((list) => [...list, property])
    setPrefs((s) => ({ ...s, activePropertyId: property.id }))
    return property
  }, [])

  const addReport = useCallback((r: Report | ReportSummary) => {
    const summary: ReportSummary = { id: r.id, plot_id: r.plot_id, kind: r.kind, title: r.title, created_at: r.created_at }
    setReports((list) => [summary, ...list.filter((x) => x.id !== r.id)])
  }, [])

  const value = useMemo<Store>(() => {
    const activeProperty = properties.find((p) => p.id === prefs.activePropertyId) ?? properties[0] ?? null
    return {
      theme: prefs.theme,
      largeText: prefs.largeText,
      toggleTheme: () => setPrefs((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setLargeText: (v) => setPrefs((s) => ({ ...s, largeText: v })),
      status,
      error,
      reload,
      properties,
      activeProperty,
      setActiveProperty: (id) => setPrefs((s) => ({ ...s, activePropertyId: id })),
      addProperty,
      reports,
      addReport,
      toasts,
      pushToast,
      dismissToast,
      quickAnswers,
      setQuickAnswers,
      quickReport,
      setQuickReport,
    }
  }, [prefs, status, error, reload, properties, addProperty, reports, addReport, toasts, pushToast, dismissToast, quickAnswers, quickReport])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}

/** "2026-11-14" or an ISO timestamp → "Nov 14, 2026". */
export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
