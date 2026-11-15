import { Maximize2, MessageCircle, MessageSquarePlus, Send, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ASSISTANT_MAX_LENGTH, useAssistant } from '@/lib/assistant'
import { useSpeechToText } from '@/lib/speech'
import { Link } from '@/lib/router'
import { useStore } from '@/lib/store'
import MicButton from './MicButton'
import { cx } from './ui'

/**
 * Demo assistant popup. There is no AI: the backend picks a pre-written answer by keywords and
 * fills it with the active property's real data. The conversation is shared with the full-page
 * assistant (see lib/assistant.ts).
 */
export default function ChatWidget() {
  const { activeProperty } = useStore()
  const plotId = activeProperty?.plotId ?? null
  const chat = useAssistant(plotId)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  // Dictation fills the question field; the person reviews it and sends.
  const speech = useSpeechToText((text) => setDraft(text.slice(0, ASSISTANT_MAX_LENGTH)))

  useEffect(() => setDraft(''), [plotId, chat.current?.id])

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
  }, [chat.messages.length, chat.waiting, open])

  async function send(text: string) {
    speech.stop()
    setDraft('')
    const failed = await chat.send(text)
    if (failed) setDraft(failed) // keep the question so it can be sent again
    input.current?.focus()
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
          aria-label="Earth+br assistant"
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col border border-line bg-surface shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-[16px] lg:bottom-24">
          <header className="flex items-start justify-between gap-2 rounded-t-[16px] bg-primary px-4 py-3 text-on-primary">
            <div>
              <h2 className="text-[17px] font-bold text-on-primary">Earth+br assistant</h2>
              <p className="mt-0.5 text-[13px] leading-snug opacity-90">Demo assistant · pre-written answers built from your property's data. Not an AI.</p>
            </div>
            <div className="-mr-1 flex shrink-0 items-center">
              <button type="button" onClick={() => chat.newChat()} aria-label="New chat" title="New chat" className="rounded-full p-1.5 hover:bg-white/15">
                <MessageSquarePlus className="size-5" aria-hidden />
              </button>
              <Link to="/app/assistente" onClick={() => setOpen(false)} aria-label="Open the full assistant with history" title="Open full screen" className="rounded-full p-1.5 hover:bg-white/15">
                <Maximize2 className="size-5" aria-hidden />
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close the assistant" title="Close" className="rounded-full p-1.5 hover:bg-white/15">
                <X className="size-5" aria-hidden />
              </button>
            </div>
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
                {chat.messages.length === 0 && chat.greeting && (
                  <p className="max-w-[88%] rounded-[12px] rounded-bl-[4px] bg-tint px-3.5 py-2.5 text-[15px] text-ink">{chat.greeting}</p>
                )}
                {chat.messages.map((m, i) => (
                  <div key={i} className={cx('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
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
                {chat.waiting && (
                  <p role="status" className="w-fit rounded-[12px] rounded-bl-[4px] bg-tint px-3.5 py-2.5 text-[15px] text-muted">
                    <span className="animate-pulse">Looking at your data…</span>
                  </p>
                )}
                {!chat.waiting && chat.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {chat.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={chat.busy}
                        onClick={() => void send(s)}
                        className="rounded-full border border-primary/40 px-3 py-1.5 text-left text-[13px] font-bold text-primary hover:bg-tint disabled:opacity-50">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {(speech.listening || speech.error) && (
            <p role="status" className={cx('border-t border-line px-4 py-2 text-[13px]', speech.error ? 'text-red-800 dark:text-red-200' : 'text-muted')}>
              {speech.error || 'Listening… speak your question, then check the text and send.'}
            </p>
          )}
          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <input
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={ASSISTANT_MAX_LENGTH}
              disabled={plotId === null}
              placeholder="Ask about your land…"
              aria-label="Your question"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
            />
            <MicButton listening={speech.listening} onStart={speech.start} onStop={speech.stop} disabled={plotId === null || chat.busy} />
            <button
              type="submit"
              disabled={!draft.trim() || chat.busy || plotId === null}
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
