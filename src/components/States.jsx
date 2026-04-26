export function LoadingState({ label = 'Loading...' }) {
  return <div className="state loading">{label}</div>
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
  return <div className="state empty">{message || 'No data yet.'}</div>
}
