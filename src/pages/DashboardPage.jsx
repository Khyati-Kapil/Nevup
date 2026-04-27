import { motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import Heatmap from '../components/Heatmap'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { getUserMetrics, getUserProfile } from '../lib/api'
import { DEMO_SESSION_ID, DEMO_USER_ID } from '../lib/constants'
import { parseApiError } from '../lib/contracts'

function formatPnl(value) {
  const num = Number(value || 0)
  return `${num >= 0 ? '+' : ''}${num.toFixed(2)}`
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`
}

function buildInsights(metrics) {
  const notes = []

  const tilt = Number(metrics?.sessionTiltIndex || 0)
  const revenge = Number(metrics?.revengeTrades || 0)
  const plan = Number(metrics?.planAdherenceScore || 0)
  const emotion = metrics?.winRateByEmotionalState || {}

  if (tilt > 0.55) notes.push('Session tilt is elevated. Add a hard stop after two consecutive losses.')
  if (revenge > 5) notes.push('Revenge trading frequency is high. Add a 3-minute cooldown before any re-entry.')
  if (plan < 2.6) notes.push('Plan discipline is low. Pre-trade checklist should be mandatory before entry.')

  const anxiousWin = Number(emotion?.anxious?.winRate || 0)
  const calmWin = Number(emotion?.calm?.winRate || 0)
  if (calmWin - anxiousWin > 0.25) {
    notes.push('Performance gap between calm and anxious states is large. Trigger lower size in anxious sessions.')
  }

  if (!notes.length) {
    notes.push('Behavioral consistency looks stable. Focus on scaling what already works with strict risk controls.')
  }

  return notes.slice(0, 3)
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError('')
      const [p, m] = await Promise.all([getUserProfile(DEMO_USER_ID), getUserMetrics(DEMO_USER_ID)])
      setProfile(p)
      setMetrics(m)
    } catch (e) {
      const parsed = parseApiError(e)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(false)
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  const heatmapData = useMemo(() => metrics?.daily || [], [metrics])

  const timeseries = useMemo(
    () =>
      (metrics?.timeseries || []).map((point) => ({
        ...point,
        dateLabel: point.bucket ? new Date(point.bucket).toLocaleDateString() : '-',
        winRatePercent: Number((point.winRate || 0) * 100),
      })),
    [metrics],
  )

  const emotionData = useMemo(() => {
    const map = metrics?.winRateByEmotionalState || {}
    return Object.entries(map).map(([state, value]) => ({
      state,
      wins: Number(value?.wins || 0),
      losses: Number(value?.losses || 0),
      winRatePercent: Number((value?.winRate || 0) * 100),
    }))
  }, [metrics])

  const stats = useMemo(() => {
    const totalPnl = (metrics?.timeseries || []).reduce((sum, p) => sum + Number(p.pnl || 0), 0)
    const avgWinRate = timeseries.length
      ? timeseries.reduce((sum, p) => sum + Number(p.winRatePercent || 0), 0) / timeseries.length
      : 0

    return [
      { label: 'Plan Discipline', value: Number(metrics?.planAdherenceScore || 0).toFixed(2), tone: 'mint' },
      { label: 'Avg Win Rate', value: `${avgWinRate.toFixed(1)}%`, tone: 'sky' },
      { label: 'Revenge Flags', value: String(metrics?.revengeTrades || 0), tone: 'amber' },
      { label: 'Net PnL', value: formatPnl(totalPnl), tone: totalPnl >= 0 ? 'mint' : 'rose' },
    ]
  }, [metrics, timeseries])

  const insights = useMemo(() => buildInsights(metrics), [metrics])

  return (
    <main className="page dashboard-page v3">
      <header className="page-header dashboard-header cinematic">
        <div>
          <p className="eyebrow hot">Behavioral Performance Layer</p>
          <h1>Trading Command Center</h1>
          <p className="muted maxline">
            Real post-session intelligence: quality trend, emotional edge, and actionable behavior interventions.
          </p>
        </div>
        <div className="actions compact">
          <Link to={`/debrief/${DEMO_SESSION_ID}`} className="btn alt">
            New Debrief
          </Link>
          <Link to="/" className="btn">
            Home
          </Link>
        </div>
      </header>

      {loading && <LoadingState label="Loading dashboard intelligence..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(true)} />}
      {!loading && !error && !metrics && <EmptyState message="No metrics found yet." />}

      {!loading && !error && metrics && (
        <>
          <section className="stats-grid v2">
            {stats.map((item, idx) => (
              <motion.article
                className={`stat-card tone-${item.tone}`}
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * idx }}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </motion.article>
            ))}
          </section>

          <section className="grid dashboard-grid v3">
            <article className="card profile-card spotlight">
              <h3>Dominant Pattern</h3>
              <p className="muted">{profile?.summary || 'No profile summary available.'}</p>
              <div className="chip-row">
                {(profile?.dominantPathologies || []).map((item) => (
                  <span className="chip" key={item.pathology}>
                    {item.pathology} ({Math.round((item.confidence || 0) * 100)}%)
                  </span>
                ))}
              </div>
            </article>

            <article className="card chart-card">
              <h3>Execution Quality Trend</h3>
              <p className="muted">Win rate and plan adherence across recent buckets.</p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={timeseries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 5]} />
                    <Tooltip />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="winRatePercent"
                      stroke="#0a8f6b"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      name="Win Rate %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgPlanAdherence"
                      stroke="#ef5b3f"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      name="Avg Plan Adherence"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card chart-card">
              <h3>Session PnL by Bucket</h3>
              <p className="muted">How outcomes evolve over time.</p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={timeseries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatPnl(value)} />
                    <Bar dataKey="pnl" fill="#1f7ae0" radius={[6, 6, 0, 0]} name="PnL" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <Heatmap data={heatmapData} />

            <article className="card chart-card">
              <h3>Win Rate by Emotional State</h3>
              <p className="muted">Behavior-driven edge profile.</p>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={emotionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d7e2dc" />
                    <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar dataKey="winRatePercent" fill="#f26a3d" radius={[6, 6, 0, 0]} name="Win Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card insights-card">
              <h3>Coaching Priorities</h3>
              <ul className="insight-list">
                {insights.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="muted">
                Current emotional win rates:{' '}
                {Object.entries(metrics.winRateByEmotionalState || {})
                  .map(([state, value]) => `${state} ${formatPercent(value?.winRate)}`)
                  .join(' · ')}
              </p>
            </article>
          </section>
        </>
      )}
    </main>
  )
}
