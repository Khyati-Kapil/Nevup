import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { DEMO_SESSION_ID } from '../lib/constants'

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5 },
}

export default function HomePage() {
  return (
    <main className="landing-v4">
      <section className="hero-v4 section-screen" id="top">
        <div className="noise" aria-hidden="true" />
        <motion.div className="hero-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">NevUp · Track 3 System of Engagement</p>
          <h1>Behavioral Coaching Interface for Serious Traders</h1>
          <p>
            A full post-session workflow with replay, emotion tagging, plan scoring, and live coaching designed to make
            trading discipline visible and actionable.
          </p>
          <div className="actions">
            <Link className="btn" to="/dashboard">
              Open Dashboard
            </Link>
            <Link className="btn alt" to={`/debrief/${DEMO_SESSION_ID}`}>
              Start Debrief
            </Link>
            <a className="btn ghost" href="#overview">
              Explore Features
            </a>
          </div>
        </motion.div>
      </section>

      <section className="section-screen section-block" id="overview">
        <motion.div className="section-grid" {...fadeUp}>
          <article className="feature-panel">
            <h2>What This Product Delivers</h2>
            <ul>
              <li>5-step keyboard-complete debrief flow</li>
              <li>Token-streamed coaching with reconnect behavior</li>
              <li>90-day custom heatmap with session drill-down</li>
              <li>Error/loading/empty states in every data component</li>
            </ul>
          </article>
          <article className="feature-panel soft">
            <h3>User Story</h3>
            <p>
              A trader completes a session, replays decisions, tags emotional state, receives coaching in real time, and
              commits one behavioral takeaway before the next market day.
            </p>
          </article>
        </motion.div>
      </section>

      <section className="section-screen section-block">
        <motion.div className="timeline" {...fadeUp}>
          <h2>Debrief Journey</h2>
          <div className="timeline-row">
            <div><span>1</span>Replay Trades</div>
            <div><span>2</span>Tag Emotion</div>
            <div><span>3</span>Rate Plan Adherence</div>
            <div><span>4</span>Read Live Coach</div>
            <div><span>5</span>Save Takeaway</div>
          </div>
        </motion.div>
      </section>

      <section className="section-screen section-block">
        <motion.div className="cta-panel" {...fadeUp}>
          <h2>Ready for Review</h2>
          <p>
            Built against seeded data and real endpoints. Start from dashboard for analytics, then run one debrief to
            experience the complete behavior loop.
          </p>
          <div className="actions">
            <Link className="btn" to="/dashboard">
              Go to Dashboard
            </Link>
            <Link className="btn alt" to={`/debrief/${DEMO_SESSION_ID}`}>
              Run Debrief Now
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
