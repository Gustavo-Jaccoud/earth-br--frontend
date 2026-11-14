import { ArrowRight, LogIn, Satellite } from 'lucide-react'
import { DATA_SOURCES, LANDING, type SourceId } from '@/data/mock'
import { ButtonLink, Logo, SupportNote } from '@/components/ui'
import heroDesktop from '@/assets/hero-desktop.jpg'
import heroMobile from '@/assets/hero-mobile.jpg'
import { ThemeToggle } from '@/components/AppShell'
import { getIcon } from '@/lib/icons'
import { Link } from '@/lib/router'

const SOURCE_ORDER: SourceId[] = ['power', 'smap', 'gpm', 'modis', 'gaez']

export default function Landing() {
  return (
    <div className="bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link to="/" aria-label="earth + BR, home page">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {[
              ['#problema', 'The problem'],
              ['#como-funciona', 'How it works'],
              ['#dados', 'Data'],
            ].map(([href, label]) => (
              <a key={href} href={href} onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-full px-4 py-2.5 text-[16px] text-ink hover:bg-tint">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <ButtonLink to="/propriedades" variant="secondary" size="sm">
              <LogIn className="size-[18px]" aria-hidden /> Sign in
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate flex min-h-[calc(100svh-72px)] items-center overflow-hidden">
          <picture className="absolute inset-0 -z-10">
            <source media="(min-width: 768px)" srcSet={heroDesktop} />
            <img src={heroMobile} alt="" className="size-full object-cover object-center" />
          </picture>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(10,40,27,0.72)_0%,rgba(10,40,27,0.5)_55%,rgba(10,40,27,0.35)_100%)]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[rgba(10,40,27,0.6)] to-transparent" aria-hidden />
          <div className="animate-rise mx-auto flex max-w-4xl flex-col items-center px-5 py-20 text-center sm:px-8 lg:py-28">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[15px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
              <Satellite className="size-[18px]" aria-hidden /> NASA data for Brazil’s semi-arid region
            </p>
            <h1 className="text-[38px] leading-[1.1] !text-white sm:text-[52px] lg:text-[60px]">
              Plant with more confidence, even when the weather gives you none.
            </h1>
            <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-white/90 sm:text-[21px]">
              earth + BR uses NASA and FAO data to help you choose the best crop rotation for your land, saving water and protecting the soil.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink to="/propriedades" variant="inverse" size="lg" className="min-w-52">
                Get started <ArrowRight className="size-5" aria-hidden />
              </ButtonLink>
              <a href="#como-funciona" onClick={(e) => { e.preventDefault(); document.querySelector('#como-funciona')?.scrollIntoView({ behavior: 'smooth' }) }} className="rounded-full px-5 py-3 font-bold text-white underline-offset-4 hover:bg-white/10 hover:underline">
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* The problem */}
        <section id="problema" className="scroll-mt-20 bg-tint py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mb-3 font-bold text-primary">The problem</p>
            <h2 className="max-w-3xl text-[30px] sm:text-[36px]">The backlands have changed. The information exists, but it does not reach those who farm.</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {LANDING.problems.map((p) => {
                const Icon = getIcon(p.icon)
                return (
                  <article key={p.id} className="flex flex-col rounded-[12px] bg-surface p-7 shadow-[0_1px_0_var(--c-line)]">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-tint text-primary">
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <h3 className="text-[20px]">{p.title}</h3>
                    </div>
                    <p className="font-display text-[44px] font-bold leading-none text-heading tabular">{p.stat}</p>
                    <p className="mt-2 text-[16px] text-muted">{p.statLabel}</p>
                    <p className="mt-6 border-t border-line pt-4 text-[17px] text-ink">{p.text}</p>
                  </article>
                )
              })}
            </div>
            <p className="mt-6 text-[14px] text-muted">Sources: Inpe/Cemaden (2023) · IBGE, 2017 Agricultural Census · NASA POWER</p>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="scroll-mt-20 py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="mb-3 font-bold text-primary">How it works</p>
            <h2 className="max-w-3xl text-[30px] sm:text-[36px]">From space to your field, in four steps.</h2>
            <ol className="relative mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <div className="absolute left-6 right-6 top-6 hidden h-0.5 bg-line lg:block" aria-hidden />
              {LANDING.steps.map((s, i) => {
                const Icon = getIcon(s.icon)
                return (
                  <li key={s.title} className="relative">
                    <div className="relative mb-6 flex items-center gap-3">
                      <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-on-primary ring-8 ring-bg">
                        <Icon className="size-6" aria-hidden />
                      </span>
                      <span className="font-display text-[15px] font-bold text-muted">Step {i + 1}</span>
                    </div>
                    <h3 className="text-[20px]">{s.title}</h3>
                    <p className="mt-2 text-[17px] text-muted">{s.text}</p>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Real data */}
        <section id="dados" className="scroll-mt-20 bg-[#0F3D2A] py-20 text-white lg:py-24 dark:bg-[#0A1A12]">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
              <div>
                <p className="mb-3 font-bold text-[#7FD3A5]">Real data</p>
                <h2 className="text-[30px] !text-white sm:text-[36px]">Open science, explained in plain language.</h2>
              </div>
              <p className="text-[18px] text-white/80">
                Every number in earth + BR shows where it came from. Hover over (or tap) each source to learn what it measures.
              </p>
            </div>
            <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {SOURCE_ORDER.map((id) => {
                const s = DATA_SOURCES[id]
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="group relative flex h-full min-h-40 w-full flex-col items-start justify-between rounded-[12px] border border-white/15 bg-white/5 p-5 text-left transition-colors hover:bg-white focus-visible:bg-white"
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className="font-display text-[18px] font-bold text-white group-hover:text-[#0F3D2A] group-focus-visible:text-[#0F3D2A]">{s.name}</span>
                      </span>
                      <span className="mt-4 text-[15px] text-white/75 group-hover:hidden group-focus-visible:hidden">{s.measures}</span>
                      <span className="mt-4 hidden text-[15px] leading-snug text-[#0F3D2A] group-hover:block group-focus-visible:block">{s.plain}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 rounded-[24px] bg-tint p-8 sm:p-14 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-2xl text-[30px] sm:text-[40px]">Your land deserves decisions based on data.</h2>
              <p className="mt-3 text-[18px] text-muted">It takes less than 5 minutes to register your property.</p>
            </div>
            <ButtonLink to="/propriedades" size="lg" className="min-w-52">
              Get started <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 text-[16px] text-muted">Project built for the NASA Space Apps Challenge 2026 — “Field Shift: Adapting Farms with NASA Data” challenge.</p>
          </div>
          <div>
            <h2 className="mb-3 font-sans text-[16px] font-bold text-ink">Important notice</h2>
            <SupportNote>earth + BR is a decision-support tool and does not replace local technical guidance.</SupportNote>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-[14px] text-muted">Data: NASA, JAXA and FAO</div>
      </footer>
    </div>
  )
}
