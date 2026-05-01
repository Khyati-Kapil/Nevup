function prettifyMessage(message) {
  const msg = String(message || '')
  const lower = msg.toLowerCase()

  if (lower.includes('timeout') || lower.includes('econnaborted')) {
    return 'The API is waking up (Render cold start). Wait ~10-30s and retry.'
  }

  return msg || 'Something went wrong.'
}

export function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="state loading">
      <div className="pulse" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state error">
      <p>{prettifyMessage(message)}</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

export function EmptyState({ message }) {
  return (
    <div className="state empty">
      <p>{message || 'No data yet.'}</p>
    </div>
  )
}
