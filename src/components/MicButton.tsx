import { Mic, Square } from 'lucide-react'
import { cx } from './ui'

/** Microphone toggle for dictating a question. Always shown: where the browser has no speech
 *  recognition, pressing it explains that instead of doing nothing. */
export default function MicButton({ listening, onStart, onStop, disabled, size = 'md' }: { listening: boolean; onStart: () => void; onStop: () => void; disabled?: boolean; size?: 'md' | 'lg' }) {
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? 'Stop dictating' : 'Dictate your question'}
      title={listening ? 'Stop dictating' : 'Dictate your question'}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full border transition-colors disabled:opacity-40',
        size === 'lg' ? 'size-12' : 'size-11',
        listening ? 'animate-pulse border-red-600 bg-red-600 text-white' : 'border-line bg-surface text-primary hover:bg-tint',
      )}>
      {listening ? <Square className="size-4 fill-current" aria-hidden /> : <Mic className="size-5" aria-hidden />}
    </button>
  )
}
