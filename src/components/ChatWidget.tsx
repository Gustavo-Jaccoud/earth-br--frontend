import { MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, type ChatAnswer } from '@/lib/api'
import { Link } from '@/lib/router'
import { useStore } from '@/lib/store'
import { cx } from './ui'

type Message = { id: number; from: 'user' | 'assistant' | 'error'; text: string; sources?: string[] }

const MAX_LENGTH = 500
/** Short pause so the answer does not flash in before the question settles. */
const MIN_WAIT_MS = 500

/**
 * Demo assistant popup. There is no AI: the backend picks a pre-written answer by keywords and
 * fills it with the active property's real data.
 */
export default function ChatWidget() {
  const { activeProperty } = useStore()
  const plotId = activeProperty?.plotId ?? null
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [greeting, setGreeting] = useState('')
  const [draft, setDraft] = useState('')
  const [waiting, setWaiting] = useState(false)
  const nextId = useRef(1)
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)

  // A new property means a new conversation.
  useEffect(() => {
    setMessages([])
    setDraft('')
  }, [plotId])

  // Greeting and starter questions, loaded the first time the chat opens.
  useEffect(() => {
    if (!open || greeting) return
    let cancelled = false
    api
      .chatIntro()
      .then((intro) => {
        if (cancelled) return
        setGreeting(intro.greeting)
        setSuggestions((current) => (current.length ? current : intro.suggestions))
      })
      .catch(() => {
        if (!cancelled) setGreeting('Hello! Ask me about the rain, the soil, the crops that suit your land or your reports.')
      })
    return () => {
      cancelled = true
    }
  }, [open, greeting])

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [messages, waiting, open])

  const add = (m: Omit<Message, 'id'>) => setMessages((all) => [...all, { ...m, id: nextId.current++ }])

  async function send(text: string) {
    const question = text.trim().slice(0, MAX_LENGTH)
    if (!question || waiting || plotId === null) return
    add({ from: 'user', text: question })
    setDraft('')
    setWaiting(true)
    try {
      const [answer] = await Promise.all([api.chat(plotId, question), new Promise((r) => window.setTimeout(r, MIN_WAIT_MS))])
      const reply = answer as ChatAnswer
      add({ from: 'assistant', text: reply.answer, sources: reply.sources })
      setSuggestions(reply.suggestions)
    } catch (e) {
      add({ from: 'error', text: e instanceof Error ? e.message : 'Something went wrong. Please try again.' })
      setDraft(question) // keep the question so it can be sent again
    } finally {
      setWaiting(false)
      input.current?.focus()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  return (
    <div className="no-print">
      {open && (
        <section
          role="dialog"
          aria-label="earth + BR assistant"
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col border border-line bg-surface shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-[16px] lg:bottom-24">
          <header className="flex items-start justify-between gap-3 rounded-t-[16px] bg-primary px-4 py-3 text-on-primary">
            <div>
              <h2 className="text-[17px] font-bold text-on-primary">earth + BR assistant</h2>
              <p className="mt-0.5 text-[13px] leading-snug opacity-90">Demo assistant · pre-written answers built from your property's data. Not an AI.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" className="-mr-1 rounded-full p-1.5 hover:bg-white/15">
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div ref={list} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {plotId === null ? (
              <p className="rounded-[12px] bg-tint px-3.5 py-2.5 text-[15px] text-ink">
                Register a property first so I can answer about your land.{' '}
                <Link to="/propriedades/nova" className="font-bold text-primary underline">
                  Register a property
                </Link>
              </p>
            ) : (
              <>
                {greeting && <p className="max-w-[88%] rounded-[12px] rounded-bl-[4px] bg-tint px-3.5 py-2.5 text-[15px] text-ink">{greeting}</p>}
                {messages.map((m) => (
                  <div key={m.id} className={cx('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cx(
                        'max-w-[88%] rounded-[12px] px-3.5 py-2.5 text-[15px] leading-relaxed',
                        m.from === 'user' && 'rounded-br-[4px] bg-primary text-on-primary',
                        m.from === 'assistant' && 'rounded-bl-[4px] bg-tint text-ink',
                        m.from === 'error' && 'rounded-bl-[4px] border border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
                      )}>
                      <p>{m.text}</p>
                      {m.sources && m.sources.length > 0 && <p className="mt-1.5 text-[12px] text-muted">Source: {m.sources.join(', ')}</p>}
                    </div>
                  </div>
                ))}
                {waiting && (
                  <p className="w-fit rounded-[12px] rounded-bl-[4px] bg-tint px-3.5 py-2.5 text-[15px] text-muted" aria-label="The assistant is answering">
                    <span className="animate-pulse">Looking at your data…</span>
                  </p>
                )}
                {!waiting && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="rounded-full border border-primary/40 px-3 py-1.5 text-left text-[13px] font-bold text-primary hover:bg-tint">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3">
            <input
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX_LENGTH}
              disabled={plotId === null}
              placeholder="Ask about your land…"
              aria-label="Your question"
              className="min-h-11 flex-1 rounded-full border border-line bg-bg px-4 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!draft.trim() || waiting || plotId === null}
              aria-label="Send"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40">
              <Send className="size-5" aria-hidden />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close the assistant' : 'Open the assistant'}
        className={cx(
          'fixed bottom-24 right-4 z-[70] inline-flex size-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-transform hover:scale-105 sm:right-6 lg:bottom-6',
          open && 'max-sm:hidden',
        )}>
        {open ? <X className="size-6" aria-hidden /> : <MessageCircle className="size-6" aria-hidden />}
      </button>
    </div>
  )
}
