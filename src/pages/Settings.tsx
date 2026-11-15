import { LogOut, Moon, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import { DATA_SOURCES, USER } from '@/data/mock'
import { Button, Card, PageHeader, SupportNote, cx } from '@/components/ui'
import { navigate } from '@/lib/router'
import { useStore } from '@/lib/store'

function Toggle({ id, checked, onChange, label, desc, icon }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; desc: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-4 p-5">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-tint text-primary">{icon}</span>
      <div className="flex-1">
        <label htmlFor={id} className="font-bold text-ink">
          {label}
        </label>
        <p className="text-[15px] text-muted">{desc}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-primary' : 'bg-line')}
      >
        <span className={cx('inline-block size-6 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-7' : 'translate-x-1')} />
      </button>
    </div>
  )
}

export default function Settings() {
  const s = useStore()
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Set up Earth+br the way you like it." />

      <Card className="mb-6 flex items-center gap-4 p-5">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-[#7FD3A5] font-display text-xl font-bold text-[#0F3D2A]">{USER.initials}</span>
        <div className="flex-1">
          <p className="font-display text-[19px] font-bold text-heading">{USER.fullName}</p>
          <p className="text-muted">{USER.role}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')}>
          <LogOut className="size-5" aria-hidden /> Sign out
        </Button>
      </Card>

      <h2 className="mb-3 text-[20px]">Appearance and reading</h2>
      <Card className="mb-8 divide-y divide-line">
        <Toggle id="t-dark" checked={s.theme === 'dark'} onChange={() => s.toggleTheme()} label="Dark mode" desc="Dark background, good for use at night." icon={<Moon className="size-5" aria-hidden />} />
        <Toggle id="t-large" checked={s.largeText} onChange={s.setLargeText} label="Larger text" desc="Makes all text and buttons 12% bigger." icon={<Type className="size-5" aria-hidden />} />
      </Card>

      <h2 className="mb-3 text-[20px]">Data sources</h2>
      <Card className="mb-8 divide-y divide-line">
        {Object.values(DATA_SOURCES).map((d) => (
          <div key={d.id} className="p-5">
            <p className="font-bold text-ink">
              {d.name} <span className="font-normal text-muted">· {d.org}</span>
            </p>
            <p className="text-[15px] text-muted">{d.plain}</p>
            <p className="mt-1 text-[14px] text-muted tabular">
              Resolution {d.resolution} · Updated: {d.updatedAt}
            </p>
          </div>
        ))}
      </Card>
      <SupportNote />
    </div>
  )
}
