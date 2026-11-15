import { ArrowLeft, ArrowRight, Check, LoaderCircle, LocateFixed, MapPin, Plus, Satellite, Trash2, TriangleAlert, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { CITIES_BY_STATE, PROCESSING_STEPS, STATES } from '@/data/mock'
import { Button, ButtonLink, Card, ErrorState, Logo, Skeleton, SupportNote, cx } from '@/components/ui'
import LeafletMap from '@/components/LeafletMap'
import { ThemeToggle, formatHa } from '@/components/AppShell'
import { ApiError, api, squareAround, type Crop, type LonLat } from '@/lib/api'
import { ringAreaHa, ringCrossesItself } from '@/lib/geo'
import { Link, navigate } from '@/lib/router'
import { useStore } from '@/lib/store'

function SimpleTop({ back }: { back?: { to: string; label: string } }) {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" aria-label="Earth+br, home page">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {back && (
            <ButtonLink to={back.to} variant="ghost" size="sm">
              <ArrowLeft className="size-[18px]" aria-hidden /> {back.label}
            </ButtonLink>
          )}
          <ThemeToggle compact />
        </div>
      </div>
    </header>
  )
}

/** Crop list from the server; `error` is set when it could not be loaded. */
function useCrops() {
  const [crops, setCrops] = useState<Crop[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(() => {
    setError(null)
    api
      .crops()
      .then(setCrops)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load the crop list.'))
  }, [])
  useEffect(load, [load])
  return { crops, error, reload: load }
}

/* ====================== Choose a property ====================== */

export function PropertiesPage() {
  const { properties, status, error, reload, setActiveProperty } = useStore()
  const { crops } = useCrops()
  const cropName = (id: string | null) => (id ? (crops?.find((c) => c.id === id)?.name ?? id) : 'None')
  return (
    <div className="min-h-screen bg-tint-2">
      <SimpleTop back={{ to: '/', label: 'Home' }} />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-[32px] sm:text-[40px]">Hello! Which land shall we look at today?</h1>
        <p className="mt-2 text-lg text-muted">Choose a property you have already registered, or register a new one.</p>

        <section aria-labelledby="minhas" className="mt-10">
          <h2 id="minhas" className="text-[24px]">
            My properties
          </h2>
          {status === 'error' ? (
            <ErrorState className="mt-5" message={error} onRetry={() => void reload()} />
          ) : (
            <ul className="mt-5 grid gap-5 md:grid-cols-2" aria-busy={status === 'loading'}>
              {status === 'loading' &&
                [0, 1].map((i) => (
                  <li key={i}>
                    <span className="sr-only">Loading your properties…</span>
                    <Skeleton className="h-48 rounded-[12px]" />
                  </li>
                ))}
              {status === 'ready' &&
                properties.map((p) => (
                  <Card as="li" key={p.id} className="flex overflow-hidden">
                    <div className="w-32 shrink-0 border-r border-line sm:w-40">
                      <LeafletMap polygon={p.polygon} interactive={false} className="size-full" label={`Map thumbnail of ${p.name}`} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1 p-5">
                      <h3 className="truncate text-[20px]">{p.name}</h3>
                      <p className="flex items-center gap-1.5 text-muted">
                        <MapPin className="size-4 shrink-0" aria-hidden /> {p.city} – {p.state}
                      </p>
                      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[15px]">
                        <dt className="text-muted">Area</dt>
                        <dd className="font-bold tabular">{formatHa(p.areaHa)} ha</dd>
                        <dt className="text-muted">Current crop</dt>
                        <dd className="truncate font-bold">{cropName(p.currentCrop)}</dd>
                      </dl>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveProperty(p.id)
                            navigate('/app')
                          }}
                          aria-label={`Open ${p.name}`}
                        >
                          Open <ArrowRight className="size-[18px]" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              {status === 'ready' && (
                <li>
                  <Link
                    to="/propriedades/nova"
                    className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-primary/50 bg-surface p-6 text-center hover:border-primary hover:bg-tint"
                  >
                    <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Plus className="size-7" aria-hidden />
                    </span>
                    <span className="font-display text-[20px] font-bold text-heading">{properties.length === 0 ? 'Register your first property' : 'Register a new property'}</span>
                    <span className="text-muted">2 quick steps · about 2 minutes</span>
                  </Link>
                </li>
              )}
            </ul>
          )}
        </section>
        <SupportNote className="mt-10" />
      </main>
    </div>
  )
}

/* ====================== Registration in 2 steps ====================== */

function Field({ label, htmlFor, children, hint, error }: { label: string; htmlFor?: string; children: ReactNode; hint?: string; error?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-bold text-ink">
        {label}
      </label>
      {hint && <p className="mb-2 text-[15px] text-muted">{hint}</p>}
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-[15px] font-bold text-crit-ink">
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls =
  'min-h-12 w-full rounded-[12px] border-2 border-line bg-surface px-4 text-[17px] text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none aria-[invalid=true]:border-crit'

function ChoiceCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        'relative flex min-h-14 w-full items-center gap-3 rounded-[12px] border-2 px-4 py-3 text-left transition-colors',
        selected ? 'border-primary bg-tint' : 'border-line bg-surface hover:border-primary/50',
      )}
    >
      <span className={cx('inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2', selected ? 'border-primary bg-primary text-on-primary' : 'border-muted/50')}>
        {selected && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  )
}

const parseArea = (v: string) => Number(v.trim().replace(',', '.'))

function geolocationMessage(e: GeolocationPositionError) {
  if (e.code === e.PERMISSION_DENIED) return 'Location access was denied. Allow it in your browser, or tap the map to mark the place.'
  if (e.code === e.TIMEOUT) return 'Finding your location took too long. Try again, or tap the map to mark the place.'
  return 'Your location is not available right now. Tap the map to mark the place.'
}

const STEP_TITLES = ['Location', 'Production']

export function NewPropertyPage() {
  const { addProperty } = useStore()
  const cropList = useCrops()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  /** Where the map should move to (the device's location) while drawing; no marker is placed. */
  const [focus, setFocus] = useState<null | [number, number]>(null)
  /** Explains why the last tap or drag on the map was refused. */
  const [drawNote, setDrawNote] = useState<string | null>(null)
  const [f, setF] = useState({
    name: '',
    state: 'SE',
    city: '',
    area: '',
    pin: null as null | [number, number],
    /** How the field outline is defined: a square around `pin`, or the corners in `vertices`. */
    mode: 'auto' as 'auto' | 'draw',
    /** Corners of the drawn outline, in order, [lon, lat]. */
    vertices: [] as LonLat[],
    /** Crop id from the server, '' = none, null = not answered yet. */
    crop: null as null | string,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const area = parseArea(f.area)
  const areaOk = Number.isFinite(area) && area > 0
  // Outline the server will store: a square of the typed area around the marked point.
  const outline = f.mode === 'auto' && f.pin && areaOk ? squareAround(f.pin[0], f.pin[1], area).coordinates[0] : undefined

  const drawing = f.mode === 'draw'
  const corners = f.vertices.length
  const drawnCrossed = ringCrossesItself(f.vertices)
  const drawnArea = ringAreaHa(f.vertices)
  const drawnOk = corners >= 3 && !drawnCrossed && drawnArea > 0
  const setVertices = (vertices: LonLat[]) => {
    setF((s) => ({ ...s, vertices }))
    setDrawNote(null)
    setErrors((e) => ({ ...e, boundary: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!f.name.trim()) e.name = 'Give the property a name.'
      if (!f.city) e.city = 'Choose the municipality.'
      if (drawing) {
        if (corners < 3) e.boundary = 'Tap the map to mark at least 3 corners of the property.'
        else if (!drawnOk) e.boundary = 'The outline crosses itself. Drag a corner, undo the last point or clear and start again.'
      } else {
        if (!f.pin) e.pin = 'Tap the map to mark where the property is, or use your location.'
        if (!areaOk) e.area = 'Enter the area in hectares (e.g. 12).'
      }
    }
    if (step === 2 && f.crop === null) e.crop = 'Choose the current crop, or “None”.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = async () => {
    if (saving || !validate()) return
    if (step < 2) return setStep(step + 1)
    if (drawing ? !drawnOk : !f.pin) return setStep(1)
    setSaving(true)
    setSaveError(null)
    try {
      const common = { name: f.name.trim(), state: f.state, city: f.city, currentCrop: f.crop || null }
      await addProperty(drawing || !f.pin ? { ...common, boundary: f.vertices } : { ...common, areaHa: area, lat: f.pin[0], lon: f.pin[1] })
      navigate('/carregando')
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'Could not save the property. Please try again.')
      setSaving(false)
    }
  }

  const locate = () => {
    setLocateError(null)
    if (!('geolocation' in navigator)) {
      setLocateError('This device cannot share its location. Tap the map to mark the place.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        // Automatic area: the location becomes the marked place. Drawing: the map just moves there.
        if (drawing) setFocus([...here])
        else setF((s) => ({ ...s, pin: here }))
        setErrors((e) => ({ ...e, pin: '' }))
      },
      (err) => {
        setLocating(false)
        setLocateError(geolocationMessage(err))
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="min-h-screen bg-tint-2">
      <SimpleTop back={{ to: '/propriedades', label: 'My properties' }} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <p className="font-bold text-primary">Register a new property</p>
        <h1 className="mt-1 text-[32px] sm:text-[40px]">{STEP_TITLES[step - 1]}</h1>

        {/* Progress */}
        <div className="mt-6" aria-label={`Step ${step} of ${STEP_TITLES.length}`}>
          <div className="flex justify-between text-[15px] text-muted">
            <span className="font-bold text-ink">
              Step {step} of {STEP_TITLES.length}
            </span>
            <span>{STEP_TITLES[step - 1]}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2" aria-hidden>
            {STEP_TITLES.map((t, i) => (
              <span key={t} className={cx('h-2 rounded-full', i + 1 <= step ? 'bg-primary' : 'bg-line')} />
            ))}
          </div>
          <ol className="mt-3 hidden grid-cols-2 gap-2 text-[14px] sm:grid">
            {STEP_TITLES.map((t, i) => (
              <li key={t} className={cx('flex items-center gap-1.5', i + 1 <= step ? 'text-ink' : 'text-muted')}>
                {i + 1 < step ? <Check className="size-4 text-primary" aria-hidden /> : <span className="tabular">{i + 1}.</span>} {t}
              </li>
            ))}
          </ol>
        </div>

        <Card className="mt-8 space-y-7 p-6 sm:p-8">
          {step === 1 && (
            <>
              <Field label="Property name" htmlFor="nome" error={errors.name}>
                <input id="nome" className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Green Valley Farm" aria-invalid={!!errors.name} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                <Field label="State" htmlFor="estado">
                  <select id="estado" className={inputCls} value={f.state} onChange={(e) => setF((s) => ({ ...s, state: e.target.value, city: '' }))}>
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Municipality" htmlFor="municipio" error={errors.city}>
                  <select id="municipio" className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)} aria-invalid={!!errors.city}>
                    <option value="">Choose the municipality</option>
                    {(CITIES_BY_STATE[f.state] ?? []).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div>
                <p id="modo-area" className="mb-1.5 font-bold text-ink">
                  How do you want to mark the area?
                </p>
                <div role="radiogroup" aria-labelledby="modo-area" className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard selected={!drawing} onClick={() => set('mode', 'auto')}>
                    <span className="font-bold">Automatic area</span>
                    <span className="block text-[15px] text-muted">Mark one point and type the size. We draw a square around it.</span>
                  </ChoiceCard>
                  <ChoiceCard selected={drawing} onClick={() => set('mode', 'draw')}>
                    <span className="font-bold">Draw the boundary</span>
                    <span className="block text-[15px] text-muted">Tap the corners of your land on the map, one by one.</span>
                  </ChoiceCard>
                </div>
              </div>
              <Field
                label={drawing ? 'Draw the boundary of the property' : 'Where is the property?'}
                hint={
                  drawing
                    ? 'Zoom in on your land, then tap each corner in order, going around the property. Drag a numbered corner to adjust it. “Satellite” shows the land as seen from space.'
                    : 'Tap the map to mark the place, or use your phone’s location. Zoom in to be more precise.'
                }
                error={drawing ? errors.boundary : errors.pin}
              >
                <div className={cx('overflow-hidden rounded-[12px] border-2', (drawing ? errors.boundary : errors.pin) ? 'border-crit' : 'border-line')}>
                  <LeafletMap
                    className="aspect-[4/3] w-full sm:aspect-[16/9]"
                    pin={drawing ? null : f.pin}
                    polygon={outline}
                    onPick={(lat, lon) => {
                      set('pin', [lat, lon])
                      setLocateError(null)
                      setErrors((e) => ({ ...e, pin: '' }))
                    }}
                    draw={drawing}
                    vertices={f.vertices}
                    onVerticesChange={setVertices}
                    onDrawRejected={() => setDrawNote('That point would make the outline cross itself, so it was not added. Mark the corners in order, going around the property.')}
                    drawInvalid={drawnCrossed}
                    focus={focus}
                    label={drawing ? 'Map to draw the boundary of the property' : 'Map to mark where the property is'}
                  />
                  <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface p-3">
                    <Button variant="secondary" size="sm" onClick={locate} disabled={locating}>
                      <LocateFixed className={cx('size-[18px]', locating && 'animate-spin')} aria-hidden /> {locating ? 'Finding you…' : drawing ? 'Go to my location' : 'Use my location'}
                    </Button>
                    {drawing && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => setVertices(f.vertices.slice(0, -1))} disabled={corners === 0}>
                          <Undo2 className="size-[18px]" aria-hidden /> Undo last point
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setVertices([])} disabled={corners === 0}>
                          <Trash2 className="size-[18px]" aria-hidden /> Clear
                        </Button>
                      </>
                    )}
                    <span className="text-[15px] text-muted" aria-live="polite">
                      {drawing ? (
                        drawnCrossed ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-crit-ink">
                            <TriangleAlert className="size-4 shrink-0" aria-hidden /> {corners} corners · the outline crosses itself
                          </span>
                        ) : drawnOk ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-ok-ink tabular">
                            <Check className="size-4 shrink-0" aria-hidden /> {corners} corners · outline ready
                          </span>
                        ) : corners === 0 ? (
                          'No corners yet · tap the map to place the first'
                        ) : (
                          `${corners} of at least 3 corners · keep tapping the map`
                        )
                      ) : f.pin ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-ok-ink tabular">
                          <Check className="size-4" aria-hidden /> Place marked · {f.pin[0].toFixed(4)}, {f.pin[1].toFixed(4)}
                        </span>
                      ) : (
                        'No place marked yet'
                      )}
                    </span>
                  </div>
                  {drawing && (drawNote || drawnCrossed) && (
                    <p role="alert" className="border-t border-line bg-warn-bg px-4 py-3 text-[15px] text-warn-ink">
                      {drawNote ?? 'The line that closes the outline (from the last corner back to corner 1) crosses another side. Add the next corner, drag one, or undo the last point.'}
                    </p>
                  )}
                  {locateError && (
                    <p role="alert" className="border-t border-line bg-warn-bg px-4 py-3 text-[15px] text-warn-ink">
                      {locateError}
                    </p>
                  )}
                </div>
              </Field>
              {drawing ? (
                <div>
                  <p className="mb-1.5 font-bold text-ink">Area (calculated from your drawing)</p>
                  <p className="mb-2 text-[15px] text-muted">It updates as you add or move corners. You do not need to type it.</p>
                  <output aria-live="polite" className="flex min-h-12 max-w-56 items-center justify-between rounded-[12px] border-2 border-line bg-tint-2 px-4 text-[17px] text-ink tabular">
                    <span className="font-bold">{drawnOk ? drawnArea.toLocaleString('en-US', { maximumFractionDigits: drawnArea < 10 ? 2 : 1 }) : '—'}</span>
                    <span className="text-muted">ha</span>
                  </output>
                </div>
              ) : (
                <Field
                  label="Area (in hectares)"
                  htmlFor="area"
                  error={errors.area}
                  hint="If you are not sure, an approximate value already helps. The field is drawn on the map as a square of this size around the place you marked."
                >
                  <div className="relative max-w-56">
                    <input id="area" inputMode="decimal" className={cx(inputCls, 'pr-14 tabular')} value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="12" aria-invalid={!!errors.area} />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">ha</span>
                  </div>
                </Field>
              )}
            </>
          )}

          {step === 2 && (
            <Field label="What are you growing now?" hint="Choose the main crop on this land today." error={errors.crop}>
              {cropList.error ? (
                <ErrorState message={cropList.error} onRetry={cropList.reload} />
              ) : !cropList.crops ? (
                <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading crops">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-[12px]" />
                  ))}
                </div>
              ) : (
                <div role="radiogroup" aria-label="Current crop" className="grid gap-3 sm:grid-cols-2">
                  {cropList.crops.map((c) => (
                    <ChoiceCard key={c.id} selected={f.crop === c.id} onClick={() => set('crop', c.id)}>
                      <span className="font-bold">{c.name}</span>
                    </ChoiceCard>
                  ))}
                  <ChoiceCard selected={f.crop === ''} onClick={() => set('crop', '')}>
                    <span className="font-bold">None</span>
                    <span className="block text-[15px] text-muted">Nothing planted, or another crop</span>
                  </ChoiceCard>
                </div>
              )}
            </Field>
          )}
        </Card>

        {saveError && (
          <div role="alert" className="mt-6 rounded-[12px] border border-crit/30 bg-crit-bg p-4">
            <p className="font-bold text-crit-ink">The property was not saved</p>
            <p className="text-ink">{saveError}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft className="size-5" aria-hidden /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={() => void next()} disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden /> Saving…
              </>
            ) : (
              <>
                {step < 2 ? 'Continue' : saveError ? 'Try again' : 'Finish registration'} <ArrowRight className="size-5" aria-hidden />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

/* ====================== Fetching the data ====================== */

/** Steps of PROCESSING_STEPS answered by each request: climate covers rain, soil moisture and temperature. */
const CLIMATE_STEPS = 3

export function FetchingPage() {
  const { activeProperty, status, error, reload } = useStore()
  const plotId = activeProperty?.plotId
  const [climate, setClimate] = useState(false)
  const [suitability, setSuitability] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (status === 'ready' && plotId === undefined) navigate('/propriedades/nova')
  }, [status, plotId])

  useEffect(() => {
    if (plotId === undefined) return
    let cancelled = false
    setClimate(false)
    setSuitability(false)
    setFailure(null)
    const fail = (e: unknown) => {
      if (!cancelled) setFailure(e instanceof Error ? e.message : 'Unexpected error.')
    }
    api
      .monthlyClimate(plotId)
      .then(() => !cancelled && setClimate(true))
      .catch(fail)
    api
      .suitability(plotId)
      .then(() => !cancelled && setSuitability(true))
      .catch(fail)
    return () => {
      cancelled = true
    }
  }, [plotId, attempt])

  const done = (climate ? CLIMATE_STEPS : 0) + (suitability ? PROCESSING_STEPS.length - CLIMATE_STEPS : 0)
  const finished = climate && suitability
  useEffect(() => {
    if (!finished) return
    const go = window.setTimeout(() => navigate('/app'), 700)
    return () => clearTimeout(go)
  }, [finished])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-12 text-center">
      <Orbit />
      <h1 className="mt-10 max-w-xl text-[28px] sm:text-[36px]">We are fetching the data for your region…</h1>
      {activeProperty && (
        <p className="mt-3 text-lg text-muted">
          {activeProperty.name} · {activeProperty.city} – {activeProperty.state}
        </p>
      )}
      {status === 'error' ? (
        <ErrorState className="mt-10 max-w-xl text-left" message={error} onRetry={() => void reload()} />
      ) : failure ? (
        <div className="mt-10 flex max-w-xl flex-col items-center gap-4">
          <ErrorState className="text-left" message={failure} onRetry={() => setAttempt((n) => n + 1)} />
          <ButtonLink to="/app" variant="ghost">
            Go to the dashboard anyway <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      ) : (
        <StepList done={done} className="mt-10" />
      )}
      <p className="sr-only" aria-live="polite">
        {done} of {PROCESSING_STEPS.length} steps done
      </p>
    </div>
  )
}

export function Orbit() {
  return (
    <div className="relative size-40" aria-hidden>
      <div className="absolute inset-6 rounded-full bg-tint" />
      <div className="absolute inset-10 overflow-hidden rounded-full bg-primary">
        <svg viewBox="0 0 40 40" className="size-full">
          <path d="M0 24 C 10 18, 18 30, 40 20 L40 40 L0 40Z" fill="#0F3D2A" opacity="0.6" />
          <path d="M6 10 C 14 6, 20 14, 30 9" stroke="#E8F3EC" strokeOpacity="0.6" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div className="animate-orbit absolute inset-0 rounded-full border-2 border-dashed border-primary/40">
        <span className="absolute -top-4 left-1/2 inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full bg-surface text-primary shadow-lg ring-1 ring-line">
          <Satellite className="size-5" />
        </span>
      </div>
    </div>
  )
}

export function StepList({ done, className }: { done: number; className?: string }) {
  return (
    <ul className={cx('flex flex-wrap justify-center gap-3', className)}>
      {PROCESSING_STEPS.map((s, i) => {
        const ok = i < done
        const active = i === done
        return (
          <li
            key={s.id}
            className={cx(
              'flex min-w-40 items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-all',
              ok ? 'animate-rise border-primary/40 bg-tint' : active ? 'border-line bg-surface' : 'border-line bg-surface opacity-50',
            )}
          >
            <span className={cx('inline-flex size-8 shrink-0 items-center justify-center rounded-full', ok ? 'bg-primary text-on-primary' : 'bg-line text-muted')}>
              {ok ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <span className={cx('size-3 rounded-full bg-muted/60', active && 'animate-skeleton')} />}
            </span>
            <span>
              <span className="block font-bold text-ink">
                {s.label} {ok && <span className="sr-only">done</span>}
              </span>
              <span className="block text-[13px] text-muted">{s.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
