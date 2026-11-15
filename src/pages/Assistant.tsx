import { MessageSquarePlus, Send, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { loadConversations, newConversationId, saveConversations, type ChatMessage, type Conversation } from '@/lib/chatHistory'
import { Link } from '@/lib/router'
import { formatDate, useStore } from '@/lib/store'
import { cx } from '@/components/ui'

const MAX_LENGTH = 500
const MIN_WAIT_MS = 500
const FALLBACK_GREETING = 'Hello! Ask me about the rain, the soil, the crops that suit your land or your reports.'

/**
 * Full-page assistant with a history of past conversations (kept in this browser only).
 * Same demo assistant as the popup: pre-written answers filled with the property's real data.
 */
export default function Assistant() {
  const { activeProperty } = useStore()
  const plotId = activeProperty?.plotId ?? null
  const [all, setAll] = useState<Conversation[]>(loadConversations)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [greeting, setGreeting] = useState('')
  const [starters, setStarters] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  /** Bumped whenever the open conversation changes, so a late answer is not shown in the wrong one. */
  const view = useRef(0)

  const mine = useMemo(() => all.filter((c) => c.plotId === plotId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [all, plotId])
  const current = mine.find((c) => c.id === currentId) ?? null
  const messages = current?.messages ?? []

  useEffect(() => saveConversations(all), [all])

  // Another property: start on a blank conversation.
  useEffect(() => {
    openConversation(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotId])

  useEffect(() => {
    let cancelled = false
    api
      .chatIntro()
      .then((intro) => {
        if (cancelled) return
        setGreeting(intro.greeting)
        setStarters(intro.suggestions)
      })
      .catch(() => {
        if (!cancelled) setGreeting(FALLBACK_GREETING)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [messages.length, waiting, currentId])

  function openConversation(id: string | null) {
    view.current += 1
    setCurrentId(id)
    setSuggestions([])
    setWaiting(false)
    setDraft('')
    input.current?.focus()
  }

  function append(id: string, message: ChatMessage) {
    setAll((list) => list.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() } : c)))
  }

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_LENGTH)
    if (!question || waiting || plotId === null) return
    let id = current?.id ?? null
    if (id === null) {
      const created: Conversation = { id: newConversationId(), plotId, title: question, updatedAt: new Date().toISOString(), messages: [] }
      id = created.id
      setAll((list) => [created, ...list])
      setCurrentId(id)
    }
    const asked = view.current
    append(id, { from: 'user', text: question })
    setDraft('')
    setWaiting(true)
    try {
      const [reply] = await Promise.all([api.chat(plotId, question), new Promise((r) => window.setTimeout(r, MIN_WAIT_MS))])
      append(id, { from: 'assistant', text: reply.answer, sources: reply.sources })
      if (asked === view.current) setSuggestions(reply.suggestions)
    } catch (e) {
      append(id, { from: 'error', text: e instanceof Error ? e.message : 'Something went wrong. Please try again.' })
      if (asked === view.current) setDraft(question)
    } finally {
      if (asked === view.current) {
        setWaiting(false)
        input.current?.focus()
      }
    }
  }

  function remove(id: string) {
    setAll((list) => list.filter((c) => c.id !== id))
    if (id === currentId) openConversation(null)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  if (plotId === null) {
    return (
      <p className="rounded-[12px] bg-tint px-4 py-3 text-ink">
        Register a property first so the assistant can answer about your land.{' '}
        <Link to="/propriedades/nova" className="font-bold text-primary underline">
          Register a property
        </Link>
      </p>
    )
  }

  const chips = messages.length === 0 ? starters : suggestions

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[420px] flex-col gap-4 lg:h-[calc(100dvh-5rem)] lg:flex-row">
      {/* History */}
      <aside className="flex shrink-0 flex-col gap-3 lg:w-72" aria-label="Conversation history">
        <button
          type="button"
          onClick={() => openConversation(null)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 font-bold text-on-primary">
          <MessageSquarePlus className="size-5" aria-hidden /> New chat
        </button>
        <div className="flex gap-2 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
          {mine.length === 0 && <p className="px-1 text-[14px] text-muted">Your past questions will appear here. They are saved only in this browser.</p>}
          {mine.map((c) => (
            <div
              key={c.id}
              className={cx(
                'group flex min-w-52 items-center gap-1 rounded-[12px] border px-3 py-2 lg:min-w-0',
                c.id === currentId ? 'border-primary bg-tint' : 'border-line bg-surface hover:bg-tint',
              )}>
              <button type="button" onClick={() => openConversation(c.id)} aria-current={c.id === currentId ? 'true' : undefined} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[15px] font-bold text-ink">{c.title}</span>
                <span className="block text-[12px] text-muted">
                  {formatDate(c.updatedAt)} · {c.messages.filter((m) => m.from === 'user').length} question(s)
                </span>
              </button>
              <button type="button" onClick={() => remove(c.id)} aria-label={`Delete the conversation "${c.title}"`} className="rounded-full p-1.5 text-muted hover:bg-line hover:text-ink">
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-line bg-surface" aria-label="Assistant conversation">
        <header className="border-b border-line px-5 py-3">
          <h1 className="text-[22px]">earth + BR assistant</h1>
          <p className="text-[14px] text-muted">
            Demo assistant · pre-written answers built from the data of {activeProperty?.name}. Not an AI.
          </p>
        </header>

        <div ref={list} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.length === 0 && greeting && <p className="max-w-[85%] rounded-[14px] rounded-bl-[4px] bg-tint px-4 py-3 text-ink">{greeting}</p>}
            {messages.map((m, i) => (
              <div key={i} className={cx('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cx(
                    'max-w-[85%] rounded-[14px] px-4 py-3 leading-relaxed',
                    m.from === 'user' && 'rounded-br-[4px] bg-primary text-on-primary',
                    m.from === 'assistant' && 'rounded-bl-[4px] bg-tint text-ink',
                    m.from === 'error' && 'rounded-bl-[4px] border border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
                  )}>
                  <p>{m.text}</p>
                  {m.sources && m.sources.length > 0 && <p className="mt-1.5 text-[13px] text-muted">Source: {m.sources.join(', ')}</p>}
                </div>
              </div>
            ))}
            {waiting && (
              <p role="status" className="w-fit rounded-[14px] rounded-bl-[4px] bg-tint px-4 py-3 text-muted">
                <span className="animate-pulse">Looking at your data…</span>
              </p>
            )}
            {!waiting && chips.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-primary/40 px-3.5 py-2 text-left text-[14px] font-bold text-primary hover:bg-tint">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="border-t border-line p-4">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <input
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="Ask about your land…"
              aria-label="Your question"
              className="min-h-12 flex-1 rounded-full border border-line bg-bg px-5 text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={!draft.trim() || waiting} aria-label="Send" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40">
              <Send className="size-5" aria-hidden />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
