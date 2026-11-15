/**
 * Voice to text for the assistant, using the browser's own speech recognition (Web Speech API).
 * Nothing is sent to the Earth+br backend: the browser transcribes and we only receive text.
 * Supported by Chrome, Edge and Safari; not by Firefox (the microphone button is hidden there).
 */
import { useCallback, useEffect, useRef, useState } from 'react'

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function speechSupported() {
  return typeof window !== 'undefined' && recognitionCtor() !== null
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access was blocked. Allow it in your browser to dictate a question.',
  'service-not-allowed': 'Microphone access was blocked. Allow it in your browser to dictate a question.',
  'no-speech': 'I did not hear anything. Try again and speak close to the microphone.',
  'audio-capture': 'No microphone was found on this device.',
  network: 'Voice recognition needs an internet connection. Check it and try again.',
}

/**
 * `onText(text, final)` receives the transcript as it is recognised: partial text while the
 * person speaks (`final` false) and the complete sentence at the end (`final` true).
 */
export function useSpeechToText(onText: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognition = useRef<Recognition | null>(null)
  const handler = useRef(onText)
  handler.current = onText

  const stop = useCallback(() => recognition.current?.stop(), [])

  const start = useCallback(() => {
    const Ctor = recognitionCtor()
    if (!Ctor || recognition.current) return
    const r = new Ctor()
    // The person's own language: Portuguese speakers can dictate in Portuguese (the assistant
    // understands questions in English and Portuguese).
    r.lang = navigator.language || 'en-US'
    r.interimResults = true
    r.continuous = false
    r.maxAlternatives = 1
    let finalText = ''
    r.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interim += result[0].transcript
      }
      handler.current((finalText + interim).trim(), false)
    }
    r.onerror = (e) => {
      if (e.error !== 'aborted') setError(ERRORS[e.error] ?? 'Voice recognition failed. Please try again or type your question.')
    }
    r.onend = () => {
      recognition.current = null
      setListening(false)
      if (finalText.trim()) handler.current(finalText.trim(), true)
    }
    recognition.current = r
    setError('')
    setListening(true)
    try {
      r.start()
    } catch {
      recognition.current = null
      setListening(false)
      setError('Voice recognition could not start. Please try again or type your question.')
    }
  }, [])

  // Stop listening when the chat closes or the page changes.
  useEffect(() => () => recognition.current?.abort(), [])

  return { supported: speechSupported(), listening, error, start, stop, clearError: () => setError('') }
}
