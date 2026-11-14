import { ArrowLeft, ArrowRight, Check, Droplets, LocateFixed, MapPin, Pencil, Plus, Satellite, Sprout, Target, Trash2, Wallet, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { CITIES_BY_STATE, CROP_OPTIONS, PROCESSING_STEPS, STATES, type Goal, type Property, type SoilType, type WaterSource } from '@/data/mock'
import { Button, ButtonLink, Card, Dialog, Logo, SupportNote, cx } from '@/components/ui'
import { PropertyMap } from '@/components/viz'
import { ThemeToggle } from '@/components/AppShell'
import { Link, navigate, useRoute } from '@/lib/router'
import { useStore } from '@/lib/store'

function SimpleTop({ back }: { back?: { to: string; label: string } }) {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" aria-label="Terra+, página inicial">
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

/* ====================== Escolher propriedade ====================== */

export function PropertiesPage() {
  const { properties, reports, setActiveProperty, deleteProperty, pushToast } = useStore()
  const [toDelete, setToDelete] = useState<Property | null>(null)
  const linkedReports = toDelete ? reports.filter((r) => r.propertyId === toDelete.id).length : 0
  const onlyOne = properties.length === 1
  return (
    <div className="min-h-screen bg-tint-2">
      <SimpleTop back={{ to: '/', label: 'Início' }} />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-[32px] sm:text-[40px]">Olá! Qual terra vamos olhar hoje?</h1>
        <p className="mt-2 text-lg text-muted">Escolha uma propriedade que você já cadastrou ou cadastre uma nova.</p>

        <section aria-labelledby="minhas" className="mt-10">
          <h2 id="minhas" className="text-[24px]">
            Minhas propriedades
          </h2>
          <ul className="mt-5 grid gap-5 md:grid-cols-2">
            {properties.map((p) => (
              <Card as="li" key={p.id} className="flex overflow-hidden">
                <div className="w-32 shrink-0 border-r border-line sm:w-40">
                  <PropertyMap shape={p.shape} layer="none" showPin label={`Miniatura do mapa de ${p.name}`} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1 p-5">
                  <h3 className="truncate text-[20px]">{p.name}</h3>
                  <p className="flex items-center gap-1.5 text-muted">
                    <MapPin className="size-4 shrink-0" aria-hidden /> {p.city} – {p.state}
                  </p>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-[15px]">
                    <dt className="text-muted">Área</dt>
                    <dd className="font-bold tabular">{p.areaHa.toLocaleString('pt-BR')} ha</dd>
                    <dt className="text-muted">Cultura atual</dt>
                    <dd className="truncate font-bold">{p.currentCrop}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveProperty(p.id)
                        navigate('/app')
                      }}
                      aria-label={`Acessar ${p.name}`}
                      className="mr-1"
                    >
                      Acessar <ArrowRight className="size-[18px]" aria-hidden />
                    </Button>
                    <Link
                      to={`/propriedades/nova?editar=${p.id}&origem=lista`}
                      aria-label={`Editar ${p.name}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-ink hover:bg-tint"
                    >
                      <Pencil className="size-[18px]" aria-hidden /> Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => setToDelete(p)}
                      disabled={onlyOne}
                      title={onlyOne ? 'Você precisa ter pelo menos uma propriedade' : undefined}
                      aria-label={`Excluir ${p.name}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-crit-ink hover:bg-crit-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="size-[18px]" aria-hidden /> Excluir
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            <li>
              <Link
                to="/propriedades/nova"
                className="flex h-full min-h-48 flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-primary/50 bg-surface p-6 text-center hover:border-primary hover:bg-tint"
              >
                <span className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Plus className="size-7" aria-hidden />
                </span>
                <span className="font-display text-[20px] font-bold text-heading">Cadastrar nova propriedade</span>
                <span className="text-muted">3 passos rápidos · cerca de 3 minutos</span>
              </Link>
            </li>
          </ul>
        </section>
        {onlyOne && <p className="mt-4 text-[15px] text-muted">Para excluir esta propriedade, cadastre outra antes. Você precisa ter pelo menos uma.</p>}
        <SupportNote className="mt-10" />
      </main>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} title="Excluir propriedade?">
        <div className="p-6">
          <p className="text-ink">
            Você vai excluir <strong>“{toDelete?.name}”</strong>
            {linkedReports > 0 ? (
              <>
                {' '}
                e {linkedReports === 1 ? 'o relatório ligado a ela' : `os ${linkedReports} relatórios ligados a ela`}
              </>
            ) : null}
            . Essa ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteProperty(toDelete!.id)
                pushToast({ message: `“${toDelete!.name}” foi excluída` })
                setToDelete(null)
              }}
            >
              <Trash2 className="size-5" aria-hidden /> Sim, excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

/* ====================== Cadastro em 3 passos ====================== */

const SOILS: { id: SoilType; hint: string }[] = [
  { id: 'Arenoso', hint: 'Solta, escorre entre os dedos' },
  { id: 'Argiloso', hint: 'Gruda e racha quando seca' },
  { id: 'Misto', hint: 'Um pouco de cada' },
  { id: 'Não sei', hint: 'Sem problema' },
]
const WATERS: WaterSource[] = ['Só chuva', 'Poço', 'Cisterna', 'Açude', 'Irrigação']
const GOALS: { id: Goal; icon: LucideIcon }[] = [
  { id: 'Economizar água', icon: Droplets },
  { id: 'Melhorar o solo', icon: Sprout },
  { id: 'Reduzir riscos climáticos', icon: Target },
  { id: 'Aumentar a renda', icon: Wallet },
]

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

function ChoiceCard({ selected, onClick, children, role = 'radio' }: { selected: boolean; onClick: () => void; children: ReactNode; role?: 'radio' | 'checkbox' }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        'relative flex min-h-14 w-full items-center gap-3 rounded-[12px] border-2 px-4 py-3 text-left transition-colors',
        selected ? 'border-primary bg-tint' : 'border-line bg-surface hover:border-primary/50',
      )}
    >
      <span className={cx('inline-flex size-6 shrink-0 items-center justify-center border-2', role === 'radio' ? 'rounded-full' : 'rounded-[6px]', selected ? 'border-primary bg-primary text-on-primary' : 'border-muted/50')}>
        {selected && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  )
}

export function NewPropertyPage() {
  const { params } = useRoute()
  const { addProperty, updateProperty, properties, pushToast } = useStore()
  const fromList = params.get('origem') === 'lista'
  // Ao completar um cadastro existente, o formulário vem preenchido e salva como atualização.
  const editing = properties.find((p) => p.id === params.get('editar'))
  const [step, setStep] = useState(() => (editing ? Math.min(3, Math.max(1, Number(params.get('passo')) || 1)) : 1))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [f, setF] = useState({
    name: editing?.name ?? '',
    state: editing?.state ?? 'SE',
    city: editing?.city ?? '',
    area: editing ? String(editing.areaHa).replace('.', ',') : '',
    pin: (editing ? { x: 50, y: 46 } : null) as null | { x: number; y: number },
    locating: false,
    // "Arenoso-argiloso" não é uma opção do formulário: equivale a "Misto". "Não sei" fica em branco ao completar o cadastro.
    soil: (!editing ? '' : editing.soil === 'Arenoso-argiloso' ? 'Misto' : editing.soil === 'Não sei' && !fromList ? '' : editing.soil) as SoilType | '',
    water: editing?.water ?? ([] as WaterSource[]),
    irrigation: (editing ? (editing.irrigation ? 'sim' : 'nao') : '') as '' | 'sim' | 'nao',
    crops: editing ? editing.crops.filter((c) => CROP_OPTIONS.includes(c)) : ([] as string[]),
    otherCrop: '',
    rotation: editing?.rotation ?? '',
    goal: (editing?.goal ?? '') as Goal | '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const validate = () => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!f.name.trim()) e.name = 'Dê um nome para a propriedade.'
      if (!f.city) e.city = 'Escolha o município.'
      if (!(Number(f.area.replace(',', '.')) > 0)) e.area = 'Informe a área em hectares (ex.: 12).'
    }
    if (step === 2) {
      if (!f.soil) e.soil = 'Escolha um tipo de solo, ou “Não sei”.'
      if (f.water.length === 0) e.water = 'Marque pelo menos uma fonte de água.'
      if (!f.irrigation) e.irrigation = 'Responda sim ou não.'
    }
    if (step === 3) {
      if (f.crops.length === 0) e.crops = 'Escolha pelo menos uma cultura.'
      if (!f.goal) e.goal = 'Escolha o seu objetivo principal.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (step < 3) return setStep(step + 1)
    const crops = f.crops.map((c) => (c === 'Outra' && f.otherCrop.trim() ? f.otherCrop.trim() : c))
    const p: Property = {
      ...editing,
      id: editing?.id ?? `p-${Date.now()}`,
      name: f.name.trim(),
      state: f.state,
      city: f.city,
      areaHa: Number(f.area.replace(',', '.')),
      soil: f.soil || 'Não sei',
      soilEstimated: f.soil === 'Não sei',
      water: f.water,
      irrigation: f.irrigation === 'sim',
      crops,
      rotation: f.rotation,
      goal: f.goal || 'Economizar água',
      currentCrop: crops.join(' → '),
      coords: editing?.coords ?? (f.pin ? '10°14′S · 37°26′O' : 'A definir'),
      shape: editing?.shape ?? '20,20 70,16 86,42 78,80 40,86 14,60',
    }
    if (editing) updateProperty(p)
    else addProperty(p)
    if (editing && fromList) {
      pushToast({ message: 'Propriedade atualizada' })
      navigate('/propriedades')
      return
    }
    navigate('/carregando')
  }

  const locate = () => {
    set('locating', true)
    window.setTimeout(() => setF((s) => ({ ...s, locating: false, pin: { x: 50, y: 46 } })), 1100)
  }

  const titles = ['Localização', 'Solo e água', 'Produção']

  return (
    <div className="min-h-screen bg-tint-2">
      <SimpleTop back={{ to: fromList || !editing ? '/propriedades' : '/app', label: fromList || !editing ? 'Minhas propriedades' : 'Voltar ao painel' }} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <p className="font-bold text-primary">{editing ? `${fromList ? 'Editar propriedade' : 'Completar cadastro'} — ${editing.name}` : 'Cadastrar nova propriedade'}</p>
        <h1 className="mt-1 text-[32px] sm:text-[40px]">{titles[step - 1]}</h1>

        {/* Progresso */}
        <div className="mt-6" aria-label={`Passo ${step} de 3`}>
          <div className="flex justify-between text-[15px] text-muted">
            <span className="font-bold text-ink">Passo {step} de 3</span>
            <span>{titles[step - 1]}</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span key={n} className={cx('h-2 rounded-full', n <= step ? 'bg-primary' : 'bg-line')} />
            ))}
          </div>
          <ol className="mt-3 hidden grid-cols-3 gap-2 text-[14px] sm:grid">
            {titles.map((t, i) => (
              <li key={t} className={cx('flex items-center gap-1.5', i + 1 <= step ? 'text-ink' : 'text-muted')}>
                {i + 1 < step ? <Check className="size-4 text-primary" aria-hidden /> : <span className="tabular">{i + 1}.</span>} {t}
              </li>
            ))}
          </ol>
        </div>

        <Card className="mt-8 space-y-7 p-6 sm:p-8">
          {step === 1 && (
            <>
              <Field label="Nome da propriedade" htmlFor="nome" error={errors.name}>
                <input id="nome" className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Sítio Boa Esperança" aria-invalid={!!errors.name} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                <Field label="Estado" htmlFor="estado">
                  <select id="estado" className={inputCls} value={f.state} onChange={(e) => setF((s) => ({ ...s, state: e.target.value, city: '' }))}>
                    {STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Município" htmlFor="municipio" error={errors.city}>
                  <select id="municipio" className={inputCls} value={f.city} onChange={(e) => set('city', e.target.value)} aria-invalid={!!errors.city}>
                    <option value="">Escolha o município</option>
                    {(CITIES_BY_STATE[f.state] ?? []).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Onde fica a propriedade?" hint="Toque no mapa para marcar o local, ou use a localização do seu celular.">
                <div className="overflow-hidden rounded-[12px] border-2 border-line">
                  <button
                    type="button"
                    className="relative block aspect-[16/9] w-full cursor-crosshair"
                    aria-label="Marcar a propriedade no mapa"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      set('pin', { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
                    }}
                  >
                    <PropertyMap shape="2,2 98,2 98,98 2,98" layer="none" label="Mapa da região para marcar a propriedade" />
                    {f.pin && (
                      <MapPin className="absolute size-10 -translate-x-1/2 -translate-y-full fill-primary text-white drop-shadow" style={{ left: `${f.pin.x}%`, top: `${f.pin.y}%` }} aria-hidden />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-3 py-1 text-[14px] text-muted">[MAPA: região de {f.city || 'seu município'}]</span>
                  </button>
                  <div className="flex flex-wrap items-center gap-3 border-t border-line bg-surface p-3">
                    <Button variant="secondary" size="sm" onClick={locate} disabled={f.locating}>
                      <LocateFixed className={cx('size-[18px]', f.locating && 'animate-spin')} aria-hidden /> {f.locating ? 'Buscando…' : 'Usar minha localização'}
                    </Button>
                    <span className="text-[15px] text-muted" aria-live="polite">
                      {f.pin ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-ok-ink">
                          <Check className="size-4" aria-hidden /> Local marcado
                        </span>
                      ) : (
                        'Nenhum local marcado ainda (opcional)'
                      )}
                    </span>
                  </div>
                </div>
              </Field>
              <Field label="Área (em hectares)" htmlFor="area" error={errors.area} hint="Se não souber ao certo, um valor aproximado já ajuda.">
                <div className="relative max-w-56">
                  <input id="area" inputMode="decimal" className={cx(inputCls, 'pr-14 tabular')} value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="12" aria-invalid={!!errors.area} />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">ha</span>
                </div>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Tipo de solo" error={errors.soil}>
                <div role="radiogroup" aria-label="Tipo de solo" className="grid gap-3 sm:grid-cols-2">
                  {SOILS.map((s) => (
                    <ChoiceCard key={s.id} selected={f.soil === s.id} onClick={() => set('soil', s.id)}>
                      <span className="block font-bold">{s.id}</span>
                      <span className="block text-[15px] text-muted">{s.hint}</span>
                    </ChoiceCard>
                  ))}
                </div>
                {f.soil === 'Não sei' && (
                  <p className="animate-rise mt-3 flex items-start gap-2 rounded-[12px] bg-ok-bg p-4 text-ok-ink">
                    <Satellite className="mt-0.5 size-5 shrink-0" aria-hidden />
                    <span>
                      <strong>Tudo bem! Vamos estimar com dados do SoilGrids.</strong> Depois, um técnico pode confirmar com uma análise de solo.
                    </span>
                  </p>
                )}
              </Field>
              <Field label="De onde vem a água?" hint="Pode marcar mais de uma." error={errors.water}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Fontes de água">
                  {WATERS.map((w) => {
                    const on = f.water.includes(w)
                    return (
                      <button
                        key={w}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set('water', on ? f.water.filter((x) => x !== w) : [...f.water, w])}
                        className={cx('inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-5 font-bold', on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary/50')}
                      >
                        {on && <Check className="size-4" strokeWidth={3} aria-hidden />} {w}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field label="Possui equipamento de irrigação?" error={errors.irrigation}>
                <div role="radiogroup" aria-label="Possui equipamento de irrigação?" className="grid max-w-md grid-cols-2 gap-3">
                  <ChoiceCard selected={f.irrigation === 'sim'} onClick={() => set('irrigation', 'sim')}>
                    <span className="font-bold">Sim</span>
                  </ChoiceCard>
                  <ChoiceCard selected={f.irrigation === 'nao'} onClick={() => set('irrigation', 'nao')}>
                    <span className="font-bold">Não</span>
                  </ChoiceCard>
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="O que você planta hoje?" hint="Pode escolher mais de uma." error={errors.crops}>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Culturas atuais">
                  {CROP_OPTIONS.map((c) => {
                    const on = f.crops.includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set('crops', on ? f.crops.filter((x) => x !== c) : [...f.crops, c])}
                        className={cx('inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-5 font-bold', on ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:border-primary/50')}
                      >
                        {on && <Check className="size-4" strokeWidth={3} aria-hidden />} {c}
                      </button>
                    )
                  })}
                </div>
                {f.crops.includes('Outra') && (
                  <input className={cx(inputCls, 'mt-3')} aria-label="Qual outra cultura?" placeholder="Qual? Ex.: gergelim" value={f.otherCrop} onChange={(e) => set('otherCrop', e.target.value)} />
                )}
              </Field>
              <Field label="Que rotação você pratica hoje?" htmlFor="rotacao" hint="Conte do seu jeito, em poucas palavras.">
                <input id="rotacao" className={inputCls} maxLength={120} value={f.rotation} onChange={(e) => set('rotation', e.target.value)} placeholder="Ex.: milho nas águas, depois deixo descansar" />
              </Field>
              <Field label="Qual é o seu objetivo principal?" error={errors.goal}>
                <div role="radiogroup" aria-label="Objetivo principal" className="grid gap-3 sm:grid-cols-2">
                  {GOALS.map((g) => (
                    <ChoiceCard key={g.id} selected={f.goal === g.id} onClick={() => set('goal', g.id)}>
                      <span className="font-bold">{g.id}</span>
                    </ChoiceCard>
                  ))}
                </div>
              </Field>
            </>
          )}
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-5" aria-hidden /> Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={next}>
            {step < 3 ? 'Continuar' : editing ? 'Salvar alterações' : 'Concluir cadastro'} <ArrowRight className="size-5" aria-hidden />
          </Button>
        </div>
      </main>
    </div>
  )
}

/* ====================== Buscando dados de satélite ====================== */

export function FetchingPage() {
  const { activeProperty } = useStore()
  const [done, setDone] = useState(0)
  useEffect(() => {
    const timers = PROCESSING_STEPS.map((_, i) => window.setTimeout(() => setDone(i + 1), 900 * (i + 1)))
    const go = window.setTimeout(() => navigate('/app'), 900 * PROCESSING_STEPS.length + 900)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(go)
    }
  }, [])
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-12 text-center">
      <Orbit />
      <h1 className="mt-10 max-w-xl text-[28px] sm:text-[36px]">Estamos buscando os dados de satélite da sua região…</h1>
      <p className="mt-3 text-lg text-muted">
        {activeProperty.name} · {activeProperty.city} – {activeProperty.state}
      </p>
      <StepList done={done} className="mt-10" />
      <p className="sr-only" aria-live="polite">
        {done} de {PROCESSING_STEPS.length} etapas concluídas
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
                {s.label} {ok && <span className="sr-only">concluído</span>}
              </span>
              <span className="block text-[13px] text-muted">{s.detail}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
