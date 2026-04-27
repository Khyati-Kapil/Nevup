import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function buildGrid(data = []) {
  const max = Math.max(...data.map((d) => Number(d?.score ?? 0)), 1)
  return data.slice(0, 90).map((item, index) => ({
    x: (index % 15) * 22,
    y: Math.floor(index / 15) * 22,
    score: Number(item?.score ?? 0),
    date: item?.date || `Day ${index + 1}`,
    sessionId: item?.sessionId || 'session-1',
    intensity: Math.max(0.15, Number(item?.score ?? 0) / max),
  }))
}

export default function Heatmap({ data }) {
  const navigate = useNavigate()
  const cells = useMemo(() => buildGrid(data), [data])
  const [activeCell, setActiveCell] = useState(null)

  if (!cells.length) {
    return (
      <section className="card">
        <h3>90-Day Trade Quality Heatmap</h3>
        <p className="muted">No heatmap data available for this period.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h3>90-Day Trade Quality Heatmap</h3>
      <p className="muted">Hover or focus a cell to inspect a day. Click to open that session debrief.</p>
      <svg viewBox="0 0 340 150" className="heatmap" role="img" aria-label="Trade quality heatmap">
        {cells.map((cell, idx) => (
          <g
            key={`${cell.date}-${idx}`}
            tabIndex={0}
            role="button"
            onMouseEnter={() => setActiveCell(cell)}
            onFocus={() => setActiveCell(cell)}
            onMouseLeave={() => setActiveCell((prev) => (prev?.sessionId === cell.sessionId ? null : prev))}
            onBlur={() => setActiveCell((prev) => (prev?.sessionId === cell.sessionId ? null : prev))}
            onClick={() => navigate(`/debrief/${cell.sessionId}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                navigate(`/debrief/${cell.sessionId}`)
              }
            }}
          >
            <rect
              x={cell.x}
              y={cell.y}
              width="18"
              height="18"
              rx="3"
              style={{ fill: `rgba(10, 107, 78, ${cell.intensity})`, cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>

      {activeCell && (
        <div className="heatmap-tooltip" aria-live="polite">
          <strong>{new Date(activeCell.date).toLocaleDateString()}</strong>
          <span>Quality score: {activeCell.score}</span>
          <span>Session: {activeCell.sessionId}</span>
        </div>
      )}
    </section>
  )
}
