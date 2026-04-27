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
      <p>{message || 'Something went wrong.'}</p>
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
