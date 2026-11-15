import { Copy, Mail, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog } from './ui'
import { api } from '@/lib/api'
import { useStore } from '@/lib/store'

/**
 * Shares a report with a technician through the user's own e-mail app or WhatsApp.
 * Pass `reportId` (a saved report on the server) to include the link to its PDF.
 */
export function ShareDialog({ open, onClose, title, reportId }: { open: boolean; onClose: () => void; title: string; reportId?: number }) {
  const { pushToast } = useStore()
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const link = reportId === undefined ? null : api.reportPdfUrl(reportId)
  const body = [note.trim(), `Earth+br report: “${title}”`, link].filter(Boolean).join('\n\n')
  const done = (msg: string) => {
    pushToast({ message: msg })
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} title="Share with a technician">
      <form
        className="space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault()
          window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Earth+br report: ${title}`)}&body=${encodeURIComponent(body)}`
          done('Opening your e-mail app…')
        }}
      >
        <p className="text-muted">
          Send <strong className="text-ink">“{title}”</strong> to the technician from your rural extension service, cooperative or union.
        </p>
        <div>
          <label htmlFor="share-email" className="mb-1.5 block font-bold">
            Technician’s e-mail
          </label>
          <input
            id="share-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="technician@example.org"
            className="min-h-12 w-full rounded-[12px] border-2 border-line bg-surface px-4 text-[17px] focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="share-note" className="mb-1.5 block font-bold">
            Message (optional)
          </label>
          <textarea
            id="share-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Could you help me check this report on your next visit?"
            className="w-full rounded-[12px] border-2 border-line bg-surface px-4 py-3 text-[17px] focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            <Mail className="size-5" aria-hidden /> Send by e-mail
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              window.open(`https://wa.me/?text=${encodeURIComponent(body)}`, '_blank', 'noopener')
              done('Opening WhatsApp…')
            }}
          >
            <MessageCircle className="size-5" aria-hidden /> WhatsApp
          </Button>
          {link && (
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard
                  .writeText(link)
                  .then(() => done('Link copied'))
                  .catch(() => pushToast({ message: 'Could not copy the link' }))
              }}
            >
              <Copy className="size-5" aria-hidden /> Copy link
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  )
}
