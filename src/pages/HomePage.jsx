import { Link } from 'react-router-dom'
import { DEMO_SESSION_ID } from '../lib/constants'

export default function HomePage() {
  return (
    <main className="page">
      <h1>NevUp Track 3</h1>
      <p>System of Engagement starter with routing and Prism API integration.</p>
      <div className="actions">
        <Link className="btn" to="/dashboard">
          Open Dashboard
        </Link>
        <Link className="btn secondary" to={`/debrief/${DEMO_SESSION_ID}`}>
          Open Debrief Flow
        </Link>
      </div>
    </main>
  )
}
