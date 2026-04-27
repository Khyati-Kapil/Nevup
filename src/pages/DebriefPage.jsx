import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import CoachingStream from '../components/CoachingStream'
import { EmptyState, ErrorState, LoadingState } from '../components/States'
import { getSession, submitDebrief } from '../lib/api'
import { parseApiError } from '../lib/contracts'

const STEPS = [
  'Trade Replay',
  'Emotional Tagging',
  'Plan Adherence',
  'Live Coaching',
  'Save Takeaway',
]

const STEP_ANIMATIONS = [
  { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } },
  { initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } },
  { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -14 } },
  { initial: { opacity: 0, rotateX: -8 }, animate: { opacity: 1, rotateX: 0 }, exit: { opacity: 0, rotateX: 8 } },
  { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } },
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

  const stepHeadingRef = useRef(null)
  const emotionRef = useRef(null)
  const adherenceRef = useRef(null)
  const takeawayRef = useRef(null)

  const totalSteps = STEPS.length
  const currentStep = useMemo(() => STEPS[step], [step])

  const load = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError('')
      const data = await getSession(sessionId)
      setSession(data)
    } catch (e) {
      const parsed = parseApiError(e)
      setError(parsed.message)
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    const timer = setTimeout(() => {
      void load(false)
    }, 0)

    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    if (stepHeadingRef.current) {
      stepHeadingRef.current.focus()
    }

    if (step === 1 && emotionRef.current) emotionRef.current.focus()
    if (step === 2 && adherenceRef.current) adherenceRef.current.focus()
    if (step === 4 && takeawayRef.current) takeawayRef.current.focus()
  }, [step])

  const nextStep = () => {
    setStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const handleStepKeyDown = (event) => {
    if (event.key === 'Enter' && step < totalSteps - 1) {
      event.preventDefault()
      nextStep()
      return
    }

    if (event.key === 'ArrowRight' && step < totalSteps - 1) {
      event.preventDefault()
      nextStep()
      return
    }

    if (event.key === 'ArrowLeft' && step > 0) {
      event.preventDefault()
      prevStep()
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await submitDebrief(sessionId, { emotion, adherence, takeaway })
      navigate('/dashboard')
    } catch (e) {
      const parsed = parseApiError(e)
      setError(parsed.message)
    } finally {
      setSaving(false)
    }
  }

  const stepAnimation = STEP_ANIMATIONS[step]

  return (
    <main className="page">
      <header className="page-header">
        <h1>Session Debrief</h1>
        <Link to="/dashboard" className="link">
          Dashboard
        </Link>
      </header>

      {loading && <LoadingState label="Loading session..." />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(true)} />}
      {!loading && !error && !session && <EmptyState message="No session found." />}

      {!loading && !error && session && (
        <section className="card" onKeyDown={handleStepKeyDown}>
          <h2 className="step-heading" tabIndex="-1" ref={stepHeadingRef}>
            Step {step + 1}/{totalSteps}: {currentStep}
          </h2>
          <p className="muted">Use Tab / Shift+Tab, Enter, and Arrow keys to complete without mouse.</p>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={stepAnimation.initial}
              animate={stepAnimation.animate}
              exit={stepAnimation.exit}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div>
                  <p className="muted">{session.summary}</p>
                  <ul className="trade-list">
                    {session.trades.map((trade, idx) => (
                      <li key={trade.tradeId || idx}>
                        <span>{trade.asset}</span>
                        <span>{trade.direction}</span>
                        <span>{trade.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {step === 1 && (
                <label className="field">
                  Emotional state
                  <select ref={emotionRef} value={emotion} onChange={(e) => setEmotion(e.target.value)}>
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
                    ref={adherenceRef}
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
                    ref={takeawayRef}
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
