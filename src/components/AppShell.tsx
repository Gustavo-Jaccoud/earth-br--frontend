import { Check, ChevronDown, Files, LayoutDashboard, LogOut, Moon, Plus, ScanSearch, Settings, Sun, Zap, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { USER } from '@/data/mock'
import { Link, navigate, useRoute } from '@/lib/router'
import { useStore } from '@/lib/store'
import { Logo, cx } from './ui'

type NavItem = { to: string; label: string; short: string; icon: LucideIcon; match: (p: string) => boolean }

export const NAV: NavItem[] = [
  { to: '/app', label: 'Dashboard', short: 'Início', icon: LayoutDashboard, match: (p) => p === '/app' },
  { to: '/app/partida', label: 'Partida rápida', short: 'Partida', icon: Zap, match: (p) => p.startsWith('/app/partida') },
  { to: '/app/analise', label: 'Análise da terra', short: 'Análise', icon: ScanSearch, match: (p) => p.startsWith('/app/analise') },
  { to: '/app/relatorios', label: 'Meus relatórios', short: 'Relatórios', icon: Files, match: (p) => p.startsWith('/app/relatorios') },
]

export function ThemeToggle({ compact, onDark }: { compact?: boolean; onDark?: boolean }) {
  const { theme, toggleTheme } = useStore()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={compact ? (dark ? 'Mudar para modo claro' : 'Mudar para modo escuro') : undefined}
      className={cx(
        'inline-flex min-h-12 items-center gap-3 rounded-full font-bold transition-colors',
        compact ? 'size-12 justify-center' : 'w-full px-4',
        onDark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-tint',
      )}
    >
      {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      {!compact && <span>{dark ? 'Modo claro' : 'Modo escuro'}</span>}
    </button>
  )
}

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

export function PropertySwitcher({ onDark = true, compact }: { onDark?: boolean; compact?: boolean }) {
  const { properties, activeProperty, setActiveProperty } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex w-full items-center gap-3 rounded-[12px] text-left',
          compact ? 'min-h-12 px-3 py-1.5' : 'min-h-14 px-4 py-2',
          onDark ? 'bg-white/10 text-white hover:bg-white/15' : 'border border-line bg-surface text-ink hover:bg-tint',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className={cx('block text-[13px]', onDark ? 'text-white/70' : 'text-muted', compact && 'sr-only sm:not-sr-only')}>Propriedade ativa</span>
          <span className="block truncate font-bold">{activeProperty.name}</span>
        </span>
        <ChevronDown className={cx('size-5 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 min-w-64 overflow-hidden rounded-[12px] border border-line bg-surface text-ink shadow-2xl">
          <ul role="listbox" aria-label="Escolher propriedade" className="max-h-72 overflow-y-auto p-1.5">
            {properties.map((p) => (
              <li key={p.id} role="option" aria-selected={p.id === activeProperty.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveProperty(p.id)
                    setOpen(false)
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left hover:bg-tint"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{p.name}</span>
                    <span className="block truncate text-[14px] text-muted">
                      {p.city} – {p.state} · {p.areaHa.toLocaleString('pt-BR')} ha
                    </span>
                  </span>
                  {p.id === activeProperty.id && <Check className="size-5 text-primary" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-1.5">
            <Link to="/propriedades/nova" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-2 rounded-[8px] px-3 font-bold text-primary hover:bg-tint">
              <Plus className="size-5" aria-hidden /> Cadastrar nova propriedade
            </Link>
            <Link to="/propriedades" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-2 rounded-[8px] px-3 text-ink hover:bg-tint">
              Ver todas as propriedades
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileMenu({ onDark = true, up = true }: { onDark?: boolean; up?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Perfil de ${USER.fullName}`}
        onClick={() => setOpen((o) => !o)}
        className={cx('flex min-h-12 w-full items-center gap-3 rounded-full p-1.5 pr-4 text-left', onDark ? 'text-white hover:bg-white/10' : 'hover:bg-tint')}
      >
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#7FD3A5] font-bold text-[#0F3D2A]">{USER.initials}</span>
        {up && (
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{USER.fullName}</span>
            <span className={cx('block text-[13px]', onDark ? 'text-white/70' : 'text-muted')}>{USER.role}</span>
          </span>
        )}
      </button>
      {open && (
        <div role="menu" className={cx('absolute z-50 w-64 overflow-hidden rounded-[12px] border border-line bg-surface p-1.5 text-ink shadow-2xl', up ? 'bottom-full left-0 mb-2' : 'right-0 top-full mt-2')}>
          <p className="px-3 py-2 text-[14px] text-muted">
            Conectada como <span className="font-bold text-ink">{USER.fullName}</span>
          </p>
          <Link role="menuitem" to="/app/configuracoes" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-2 rounded-[8px] px-3 hover:bg-tint">
            <Settings className="size-5" aria-hidden /> Configurações
          </Link>
          <button role="menuitem" type="button" onClick={() => navigate('/')} className="flex min-h-12 w-full items-center gap-2 rounded-[8px] px-3 text-left hover:bg-tint">
            <LogOut className="size-5" aria-hidden /> Sair
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { path } = useRoute()
  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('conteudo')?.focus()
        }}
        className="sr-only z-[90] rounded-full bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Pular para o conteúdo
      </a>

      {/* Menu lateral (desktop) */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-sidebar text-white lg:flex">
        <div className="px-6 pb-4 pt-6">
          <Link to="/app" aria-label="Terra+, ir ao Dashboard">
            <Logo inverse />
          </Link>
        </div>
        <div className="px-4">
          <PropertySwitcher />
        </div>
        <nav aria-label="Menu do sistema" className="mt-6 flex-1 px-4">
          <ul className="space-y-1">
            {NAV.map((n) => {
              const active = n.match(path)
              const Icon = n.icon
              return (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex min-h-12 items-center gap-3 rounded-full px-4 text-[17px] transition-colors',
                      active ? 'bg-white font-bold text-[#0F3D2A]' : 'text-white/90 hover:bg-white/10',
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {n.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="space-y-1 border-t border-white/15 px-4 py-4">
          <Link
            to="/app/configuracoes"
            aria-current={path === '/app/configuracoes' ? 'page' : undefined}
            className={cx('flex min-h-12 items-center gap-3 rounded-full px-4 font-bold', path === '/app/configuracoes' ? 'bg-white text-[#0F3D2A]' : 'text-white hover:bg-white/10')}
          >
            <Settings className="size-5" aria-hidden /> Configurações
          </Link>
          <ThemeToggle onDark />
          <div className="pt-2">
            <ProfileMenu />
          </div>
        </div>
      </aside>

      {/* Topo (tablet e celular) */}
      <header className="no-print sticky top-0 z-40 flex items-center gap-2 border-b border-white/10 bg-sidebar px-4 py-2 text-white lg:hidden">
        <Link to="/app" aria-label="Terra+, ir ao Dashboard" className="shrink-0">
          <Logo inverse />
        </Link>
        <div className="ml-1 min-w-0 flex-1 sm:max-w-xs">
          <PropertySwitcher compact />
        </div>
        <ThemeToggle compact onDark />
        <Link to="/app/configuracoes" aria-label="Configurações" className="hidden size-12 items-center justify-center rounded-full hover:bg-white/10 sm:inline-flex">
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      <main id="conteudo" tabIndex={-1} className="pb-28 outline-none lg:pb-0 lg:pl-72">
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </main>

      {/* Barra inferior (celular/tablet) */}
      <nav aria-label="Menu do sistema" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="grid grid-cols-4">
          {NAV.map((n) => {
            const active = n.match(path)
            const Icon = n.icon
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  aria-current={active ? 'page' : undefined}
                  className={cx('flex min-h-16 flex-col items-center justify-center gap-1 text-[13px]', active ? 'font-bold text-primary' : 'text-muted')}
                >
                  <span className={cx('inline-flex h-8 w-14 items-center justify-center rounded-full', active && 'bg-tint')}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {n.short}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
