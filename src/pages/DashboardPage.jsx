import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Heatmap from '../components/Heatmap'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { getUserMetrics, getUserProfile } from '../lib/api'
import { DEMO_USER_ID } from '../lib/constants'
import { parseApiError } from '../lib/contracts'

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

  return (
    <main className="page">
      <header className="page-header">
        <h1>Behavioral Dashboard</h1>
        <Link to="/" className="link">
          Back Home
        </Link>
      </header>

      {loading && <LoadingState label="Loading dashboard..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(true)} />}
      {!loading && !error && !metrics && <EmptyState message="No metrics found yet." />}

      {!loading && !error && metrics && (
        <div className="grid">
          <section className="card">
            <h3>Profile</h3>
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </section>
          <Heatmap data={heatmapData} />
          <section className="card">
            <h3>Metrics Snapshot</h3>
            <pre>{JSON.stringify(metrics, null, 2)}</pre>
          </section>
        </div>
      )}
    </main>
  )
}
