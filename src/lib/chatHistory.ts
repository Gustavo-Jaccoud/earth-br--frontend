/**
 * Assistant conversations, kept only in this browser (localStorage). The answers themselves
 * come from the backend chat endpoint; nothing here is sent to or stored on the server.
 */

export type ChatMessage = { from: 'user' | 'assistant' | 'error'; text: string; sources?: string[] }
export type Conversation = {
  id: string
  /** Backend plot id the conversation is about. */
  plotId: number
  /** First question, used as the title in the history list. */
  title: string
  /** ISO timestamp of the last message. */
  updatedAt: string
  messages: ChatMessage[]
}

const KEY = 'earth-br-chats-v1'
const MAX_CONVERSATIONS = 50

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Conversation[]) : []
  } catch {
    return []
  }
}

export function saveConversations(all: Conversation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX_CONVERSATIONS)))
  } catch {
    /* storage full or blocked: the history simply is not kept */
  }
}

export function newConversationId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
