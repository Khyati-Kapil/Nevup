import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import CoachingStream from '../components/CoachingStream'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { getSession, submitDebrief } from '../lib/api'

const STEPS = [
  'Trade Replay',
  'Emotional Tagging',
  'Plan Adherence',
  'Live Coaching',
  'Save Takeaway',
]

export default function DebriefPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [step, setStep] = useState(0)
  const [emotion, setEmotion] = useState('calm')
  const [adherence, setAdherence] = useState(3)
  const [takeaway, setTakeaway] = useState('')
  const [saving, setSaving] = useState(false)

  const totalSteps = STEPS.length
  const currentStep = useMemo(() => STEPS[step], [step])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getSession(sessionId)
      setSession(data)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [sessionId])

  const nextStep = () => setStep((prev) => Math.min(prev + 1, totalSteps - 1))
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0))

  const handleSave = async () => {
    try {
      setSaving(true)
      await submitDebrief(sessionId, { emotion, adherence, takeaway })
      navigate('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Session Debrief</h1>
        <Link to="/dashboard" className="link">
          Dashboard
        </Link>
      </header>

      {loading && <LoadingState label="Loading session..." />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && !session && <EmptyState message="No session found." />}

      {!loading && !error && session && (
        <section className="card">
          <p className="muted">
            Step {step + 1}/{totalSteps}: {currentStep}
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <pre>{JSON.stringify(session, null, 2)}</pre>}

              {step === 1 && (
                <label className="field">
                  Emotional state
                  <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                    <option value="calm">calm</option>
                    <option value="anxious">anxious</option>
                    <option value="greedy">greedy</option>
                    <option value="fearful">fearful</option>
                    <option value="neutral">neutral</option>
                  </select>
                </label>
              )}

              {step === 2 && (
                <label className="field">
                  Plan adherence (1-5)
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={adherence}
                    onChange={(e) => setAdherence(Number(e.target.value))}
                  />
                  <span>{adherence}</span>
                </label>
              )}

              {step === 3 && <CoachingStream sessionId={sessionId} />}

              {step === 4 && (
                <label className="field">
                  Key takeaway
                  <textarea
                    value={takeaway}
                    onChange={(e) => setTakeaway(e.target.value)}
                    rows={5}
                    placeholder="What will you do differently next session?"
                  />
                </label>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="actions">
            <button type="button" onClick={prevStep} disabled={step === 0}>
              Previous
            </button>
            {step < totalSteps - 1 ? (
              <button type="button" onClick={nextStep}>
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={saving || !takeaway.trim()}>
                {saving ? 'Saving...' : 'Save Debrief'}
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
