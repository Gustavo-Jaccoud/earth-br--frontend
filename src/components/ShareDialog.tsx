import { Copy, Mail, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Button, Dialog } from './ui'
import { useStore } from '@/lib/store'

export function ShareDialog({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const { pushToast } = useStore()
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const link = `https://terramais.app/r/${title.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').slice(0, 28)}`
  const done = (msg: string) => {
    pushToast({ message: msg })
    onClose()
  }
  return (
    <Dialog open={open} onClose={onClose} title="Compartilhar com técnico">
      <form
        className="space-y-5 p-6"
        onSubmit={(e) => {
          e.preventDefault()
          done(`Relatório enviado para ${email || 'o técnico'}`)
        }}
      >
        <p className="text-muted">
          Envie <strong className="text-ink">“{title}”</strong> para o técnico da assistência rural, da cooperativa ou do sindicato.
        </p>
        <div>
          <label htmlFor="share-email" className="mb-1.5 block font-bold">
            E-mail do técnico
          </label>
          <input
            id="share-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tecnico@emdagro.se.gov.br"
            className="min-h-12 w-full rounded-[12px] border-2 border-line bg-surface px-4 text-[17px] focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="share-note" className="mb-1.5 block font-bold">
            Recado (opcional)
          </label>
          <textarea
            id="share-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: Pode me ajudar a conferir a Estratégia A na próxima visita?"
            className="w-full rounded-[12px] border-2 border-line bg-surface px-4 py-3 text-[17px] focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            <Mail className="size-5" aria-hidden /> Enviar por e-mail
          </Button>
          <Button variant="secondary" onClick={() => done('Abrindo o WhatsApp…')}>
            <MessageCircle className="size-5" aria-hidden /> WhatsApp
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              navigator.clipboard?.writeText(link).catch(() => {})
              done('Link copiado')
            }}
          >
            <Copy className="size-5" aria-hidden /> Copiar link
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
