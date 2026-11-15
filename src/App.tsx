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
  [/^\/$/, 'Earth+br — Environmental intelligence for adaptive farming'],
  [/^\/propriedades\/nova/, 'Register property · Earth+br'],
  [/^\/propriedades/, 'My properties · Earth+br'],
  [/^\/carregando/, 'Fetching data · Earth+br'],
  [/^\/app\/partida\/relatorio/, 'Quick start report · Earth+br'],
  [/^\/app\/partida/, 'Quick start · Earth+br'],
  [/^\/app\/analise/, 'Land analysis · Earth+br'],
  [/^\/app\/relatorios/, 'My reports · Earth+br'],
  [/^\/app\/configuracoes/, 'Settings · Earth+br'],
  [/^\/app\/assistente/, 'Assistant · Earth+br'],
  [/^\/app/, 'Dashboard · Earth+br'],
]

function Routes() {
  const { path } = useRoute()
  useScrollTop(path)
  useEffect(() => {
    document.title = TITLES.find(([re]) => re.test(path))?.[1] ?? 'Earth+br'
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
