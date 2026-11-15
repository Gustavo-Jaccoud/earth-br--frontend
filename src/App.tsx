import { useEffect } from 'react'
import AppShell from '@/components/AppShell'
import { Toaster } from '@/components/ui'
import { StoreProvider } from '@/lib/store'
import { useRoute, useScrollTop } from '@/lib/router'
import Landing from '@/pages/Landing'
import { FetchingPage, NewPropertyPage, PropertiesPage } from '@/pages/Properties'
import Dashboard from '@/pages/Dashboard'
import QuickStart from '@/pages/QuickStart'
import QuickReport from '@/pages/QuickReport'
import Analysis from '@/pages/Analysis'
import Reports, { ReportView } from '@/pages/Reports'
import Settings from '@/pages/Settings'
import Assistant from '@/pages/Assistant'

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'earth + BR — Environmental intelligence for adaptive farming'],
  [/^\/propriedades\/nova/, 'Register property · earth + BR'],
  [/^\/propriedades/, 'My properties · earth + BR'],
  [/^\/carregando/, 'Fetching data · earth + BR'],
  [/^\/app\/partida\/relatorio/, 'Quick start report · earth + BR'],
  [/^\/app\/partida/, 'Quick start · earth + BR'],
  [/^\/app\/analise/, 'Land analysis · earth + BR'],
  [/^\/app\/relatorios/, 'My reports · earth + BR'],
  [/^\/app\/configuracoes/, 'Settings · earth + BR'],
  [/^\/app\/assistente/, 'Assistant · earth + BR'],
  [/^\/app/, 'Dashboard · earth + BR'],
]

function Routes() {
  const { path } = useRoute()
  useScrollTop(path)
  useEffect(() => {
    document.title = TITLES.find(([re]) => re.test(path))?.[1] ?? 'earth + BR'
  }, [path])

  if (path === '/') return <Landing />
  if (path === '/propriedades') return <PropertiesPage />
  if (path === '/propriedades/nova') return <NewPropertyPage />
  if (path === '/carregando') return <FetchingPage />

  if (path.startsWith('/app')) {
    let page
    const reportMatch = path.match(/^\/app\/relatorios\/(.+)$/)
    if (path === '/app') page = <Dashboard />
    else if (path === '/app/partida') page = <QuickStart key={path} />
    else if (path === '/app/partida/relatorio') page = <QuickReport />
    else if (path === '/app/analise') page = <Analysis />
    else if (path === '/app/relatorios') page = <Reports />
    else if (reportMatch) page = <ReportView id={reportMatch[1]} />
    else if (path === '/app/configuracoes') page = <Settings />
    else if (path === '/app/assistente') page = <Assistant />
    else page = <Dashboard />
    return <AppShell>{page}</AppShell>
  }
  return <Landing />
}

export default function App() {
  return (
    <StoreProvider>
      <Routes />
      <Toaster />
    </StoreProvider>
  )
}
