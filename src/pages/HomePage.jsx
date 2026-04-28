import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DEMO_SESSION_ID } from '../lib/constants'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45 },
}

const statTiles = [
  { label: 'Sessions Tracked', value: '52', sub: 'Seeded reference sessions' },
  { label: 'Total Trades', value: '388', sub: 'Across 10 traders' },
  { label: 'Debrief Steps', value: '5', sub: 'Keyboard-complete flow' },
  { label: 'Insight Window', value: '90D', sub: 'Custom heatmap range' },
]

export default function HomePage() {
  return (
    <main className="landing-v5">
      <header className="nav-shell">
        <nav className="top-nav">
          <a className="brand" href="#top">NevUp</a>
          <div className="nav-links">
            <a href="#stats">Metrics</a>
            <a href="#architecture">Features</a>
            <a href="#journey">Journey</a>
          </div>
          <div className="nav-actions">
            <Link className="btn ghost" to="/dashboard">Dashboard</Link>
            <Link className="btn" to={`/debrief/${DEMO_SESSION_ID}`}>Debrief</Link>
          </div>
        </nav>
      </header>

      <section className="hero-v5 section-tight" id="top">
        <div className="noise" aria-hidden="true" />
        <motion.div className="hero-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">NevUp · Track 3 · System of Engagement</p>
          <h1>Behavioral Coaching Interface for Traders Who Want Measurable Growth</h1>
          <p>Replay decisions, tag emotions, score plan adherence, stream coaching, and save one behavioral takeaway.</p>
          <div className="actions">
            <Link className="btn" to="/dashboard">Open Dashboard</Link>
            <Link className="btn alt" to={`/debrief/${DEMO_SESSION_ID}`}>Start Debrief</Link>
          </div>
        </motion.div>
      </section>

      <section className="section-tight dense-grid" id="stats">
        {statTiles.map((tile, idx) => (
          <motion.article key={tile.label} className="metric-tile" {...fadeUp} transition={{ delay: 0.05 * idx }}>
            <span>{tile.label}</span><strong>{tile.value}</strong><p>{tile.sub}</p>
          </motion.article>
        ))}
      </section>

      <section className="section-tight section-panel" id="architecture">
        <motion.div className="panel-head" {...fadeUp}>
          <h2>Product Narrative, Not Just UI Screens</h2>
          <p>Each section reveals behavior patterns, explains causes, and recommends what to change next session.</p>
        </motion.div>
      </section>

      <section className="section-tight timeline-band" id="journey">
        <motion.div className="panel-head" {...fadeUp}>
          <h2>Debrief Sequence</h2>
        </motion.div>
        <div className="timeline-row">
          <div><span>1</span>Trade Replay</div><div><span>2</span>Emotion Tagging</div><div><span>3</span>Plan Scoring</div><div><span>4</span>Live Coaching</div><div><span>5</span>Takeaway Commit</div>
        </div>
      </section>
    </main>
  )
}
