import { useEffect, useMemo, useRef, useState } from 'react'
import { buildCoachingSseUrl } from '../lib/api'

const MAX_RETRIES = 6

export default function CoachingStream({ sessionId }) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('connecting')
  const [retryCount, setRetryCount] = useState(0)
  const sourceRef = useRef(null)
  const timerRef = useRef(null)

  const retryDelayMs = useMemo(() => Math.min(1000 * 2 ** retryCount, 10000), [retryCount])

  useEffect(() => {
    let closed = false

    const connect = () => {
      if (closed) return
      setStatus(retryCount === 0 ? 'connecting' : `reconnecting (${retryCount})`)

      const source = new EventSource(buildCoachingSseUrl(sessionId))
      sourceRef.current = source

      source.onopen = () => {
        setStatus('live')
        setRetryCount(0)
      }

      source.onmessage = (event) => {
        if (!event.data) return
        setText((prev) => `${prev}${event.data}`)
      }

      source.onerror = () => {
        source.close()
        if (closed) return

        setStatus('reconnecting...')
        setRetryCount((prev) => {
          const next = prev + 1
          if (next > MAX_RETRIES) {
            setStatus('offline')
            return prev
          }
          return next
        })
      }
    }

    connect()

    return () => {
      closed = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (sourceRef.current) sourceRef.current.close()
    }
  }, [sessionId])

  useEffect(() => {
    if (status !== 'reconnecting...') return
    timerRef.current = setTimeout(() => {
      if (sourceRef.current) sourceRef.current.close()
      const source = new EventSource(buildCoachingSseUrl(sessionId))
      sourceRef.current = source

      source.onopen = () => {
        setStatus('live')
        setRetryCount(0)
      }
      source.onmessage = (event) => {
        if (!event.data) return
        setText((prev) => `${prev}${event.data}`)
      }
      source.onerror = () => {
        source.close()
        setStatus('reconnecting...')
        setRetryCount((prev) => Math.min(prev + 1, MAX_RETRIES))
      }
    }, retryDelayMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [retryDelayMs, sessionId, status])

  return (
    <section className="card">
      <h3>AI Coaching Stream</h3>
      <p className="muted">Status: {status}</p>
      <pre className="stream">{text || 'Waiting for tokens...'}</pre>
    </section>
  )
}
