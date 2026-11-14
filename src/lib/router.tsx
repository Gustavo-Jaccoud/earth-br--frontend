import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

function getPath() {
  const raw = window.location.hash.replace(/^#/, '')
  return raw === '' ? '/' : raw
}

export function useRoute() {
  const path = useSyncExternalStore(subscribe, getPath, () => '/')
  const [pathname, query = ''] = path.split('?')
  return { path: pathname, params: new URLSearchParams(query) }
}

export function navigate(to: string) {
  if (getPath() === to) return
  window.location.hash = to
}

/** Volta ao topo a cada troca de rota. */
export function useScrollTop(path: string) {
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [path])
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={`#${to}`}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
      }}
      {...rest}
    />
  )
}
