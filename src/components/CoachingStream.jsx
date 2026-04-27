import { useEffect, useRef, useState } from 'react'
import { buildCoachingSseUrl } from '../lib/api'

const MAX_RETRIES = 6
const MAX_DELAY_MS = 10000

export default function CoachingStream({ sessionId }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const sourceRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }
    }

    const scheduleReconnect = (nextRetry) => {
      if (cancelled) return
      if (nextRetry > MAX_RETRIES) {
        setStatus('offline')
        return
      }

      setRetryCount(nextRetry)
      setStatus('reconnecting...')
      const delay = Math.min(1000 * 2 ** nextRetry, MAX_DELAY_MS)

      timerRef.current = setTimeout(() => {
        connect(nextRetry)
      }, delay)
    }

    const connect = (attempt = 0) => {
      if (cancelled) return
      const source = new EventSource(buildCoachingSseUrl(sessionId))
      sourceRef.current = source
      setStatus(attempt === 0 ? 'connecting' : `reconnecting (${attempt})`)

      source.onopen = () => {
        if (cancelled) return
        setStatus('live')
        setRetryCount(0)
      }

      source.onmessage = (event) => {
        if (cancelled) return
        if (!event.data) return
        setText((prev) => `${prev}${event.data}`)
      }

      source.onerror = () => {
        source.close()
        scheduleReconnect(attempt + 1)
      }
    }

    connect(0)

    return () => {
      cancelled = true
      cleanup()
    }
  }, [sessionId])

  return (
    <section className="card">
      <h3>AI Coaching Stream</h3>
      <p className="muted">Status: {status}</p>
      <p className="muted">Retry attempts: {retryCount}</p>
      <pre className="stream" aria-live="polite">
        {text || 'Waiting for tokens...'}
      </pre>
    </section>
  )
}
