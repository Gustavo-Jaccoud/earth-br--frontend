/**
 * Shared state of the demo assistant, used by both the chat popup and the full-page chat, so a
 * question asked in one shows up in the other and in the history.
 *
 * Conversations are kept only in this browser (localStorage); the answers come from the backend
 * chat endpoint.
 */
import { useEffect, useSyncExternalStore } from 'react'
import { api } from '@/lib/api'
import { loadConversations, newConversationId, saveConversations, type ChatMessage, type Conversation } from '@/lib/chatHistory'

const MAX_LENGTH = 500
/** Short pause so the answer does not flash in before the question settles. */
const MIN_WAIT_MS = 500
const FALLBACK_GREETING = 'Hello! Ask me about the rain, the soil, the crops that suit your land or your reports.'

type State = {
  all: Conversation[]
  /** Open conversation of each plot (not persisted: a new visit starts on a blank chat). */
  currentByPlot: Record<number, string | null>
  /** Conversation waiting for an answer, if any. */
  waitingId: string | null
  /** Follow-up questions offered after the last answer of a conversation. */
  followUps: Record<string, string[]>
  greeting: string
  starters: string[]
}

let state: State = { all: loadConversations(), currentByPlot: {}, waitingId: null, followUps: {}, greeting: '', starters: [] }
const listeners = new Set<() => void>()
let introRequested = false

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  if (patch.all) saveConversations(state.all)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function append(id: string, message: ChatMessage) {
  set({ all: state.all.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() } : c)) })
}

function loadIntro() {
  if (introRequested) return
  introRequested = true
  api
    .chatIntro()
    .then((intro) => set({ greeting: intro.greeting, starters: intro.suggestions }))
    .catch(() => {
      introRequested = false // try again the next time a chat is shown
      set({ greeting: FALLBACK_GREETING })
    })
}

function open(plotId: number, id: string | null) {
  set({ currentByPlot: { ...state.currentByPlot, [plotId]: id } })
}

function remove(plotId: number, id: string) {
  const currentByPlot = state.currentByPlot[plotId] === id ? { ...state.currentByPlot, [plotId]: null } : state.currentByPlot
  set({ all: state.all.filter((c) => c.id !== id), currentByPlot })
}

/** Sends a question in the plot's open conversation (creating one if needed). Resolves to the
 *  question text when it failed, so the caller can put it back in the input; null otherwise. */
async function send(plotId: number, text: string): Promise<string | null> {
  const question = text.trim().slice(0, MAX_LENGTH)
  if (!question || state.waitingId !== null) return null
  let id = state.currentByPlot[plotId] ?? null
  if (id === null || !state.all.some((c) => c.id === id)) {
    const created: Conversation = { id: newConversationId(), plotId, title: question, updatedAt: new Date().toISOString(), messages: [] }
    id = created.id
    set({ all: [created, ...state.all], currentByPlot: { ...state.currentByPlot, [plotId]: id } })
  }
  append(id, { from: 'user', text: question })
  set({ waitingId: id })
  try {
    const [reply] = await Promise.all([api.chat(plotId, question), new Promise((r) => window.setTimeout(r, MIN_WAIT_MS))])
    append(id, { from: 'assistant', text: reply.answer, sources: reply.sources })
    set({ waitingId: null, followUps: { ...state.followUps, [id]: reply.suggestions } })
    return null
  } catch (e) {
    append(id, { from: 'error', text: e instanceof Error ? e.message : 'Something went wrong. Please try again.' })
    set({ waitingId: null })
    return question
  }
}

/** Assistant state for one plot (null = no property registered yet). */
export function useAssistant(plotId: number | null) {
  const s = useSyncExternalStore(subscribe, () => state)
  useEffect(loadIntro, [])

  const conversations = plotId === null ? [] : s.all.filter((c) => c.plotId === plotId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const currentId = plotId === null ? null : (s.currentByPlot[plotId] ?? null)
  const current = conversations.find((c) => c.id === currentId) ?? null
  const messages = current?.messages ?? []
  const waiting = current !== null && s.waitingId === current.id

  return {
    conversations,
    current,
    messages,
    /** True while the open conversation waits for an answer. */
    waiting,
    /** True while any conversation waits (sending is blocked meanwhile). */
    busy: s.waitingId !== null,
    greeting: s.greeting,
    /** Starter questions on an empty chat, follow-ups after an answer. */
    suggestions: messages.length === 0 ? s.starters : current ? (s.followUps[current.id] ?? []) : [],
    send: (text: string) => (plotId === null ? Promise.resolve(null) : send(plotId, text)),
    newChat: () => plotId !== null && open(plotId, null),
    openConversation: (id: string) => plotId !== null && open(plotId, id),
    remove: (id: string) => plotId !== null && remove(plotId, id),
  }
}

export const ASSISTANT_MAX_LENGTH = MAX_LENGTH
