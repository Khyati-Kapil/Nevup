import { Link } from 'react-router-dom'

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
  const cells = buildGrid(data)

  return (
    <section className="card">
      <h3>90-Day Trade Quality Heatmap</h3>
      <svg viewBox="0 0 340 150" className="heatmap" role="img" aria-label="Trade quality heatmap">
        {cells.map((cell, idx) => (
          <Link key={`${cell.date}-${idx}`} to={`/debrief/${cell.sessionId}`}>
            <g>
              <rect
                x={cell.x}
                y={cell.y}
                width="18"
                height="18"
                rx="3"
                style={{ fill: `rgba(10, 107, 78, ${cell.intensity})` }}
              >
                <title>{`${cell.date}: score ${cell.score}`}</title>
              </rect>
            </g>
          </Link>
        ))}
      </svg>
    </section>
  )
}
