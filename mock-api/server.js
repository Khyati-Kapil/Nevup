import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'csv-parse/sync'
import { randomUUID } from 'node:crypto'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = Number(process.env.PORT || 4010)
const SEED_FILE = process.env.SEED_FILE || path.resolve(process.cwd(), '../data/nevup_seed_dataset.csv')

function toNum(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toTrade(row) {
  return {
    tradeId: row.tradeId,
    userId: row.userId,
    sessionId: row.sessionId,
    asset: row.asset,
    assetClass: row.assetClass,
    direction: row.direction,
    entryPrice: toNum(row.entryPrice),
    exitPrice: toNum(row.exitPrice),
    quantity: toNum(row.quantity),
    entryAt: row.entryAt,
    exitAt: row.exitAt || null,
    status: row.status,
    planAdherence: toNum(row.planAdherence),
    emotionalState: row.emotionalState || null,
    entryRationale: row.entryRationale || null,
    outcome: row.outcome || null,
    pnl: toNum(row.pnl),
    revengeFlag: String(row.revengeFlag).toLowerCase() === 'true',
    traderName: row.traderName || null,
    groundTruthPathologies: row.groundTruthPathologies || null,
    createdAt: row.entryAt,
    updatedAt: row.exitAt || row.entryAt,
  }
}

function loadData() {
  const raw = fs.readFileSync(SEED_FILE, 'utf8')
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true })
  const trades = rows.map(toTrade)
  const bySession = new Map()
  const byUser = new Map()

  for (const trade of trades) {
    if (!bySession.has(trade.sessionId)) bySession.set(trade.sessionId, [])
    bySession.get(trade.sessionId).push(trade)

    if (!byUser.has(trade.userId)) byUser.set(trade.userId, [])
    byUser.get(trade.userId).push(trade)
  }

  return { trades, bySession, byUser }
}

const store = loadData()
const debriefs = new Map()

function summarizeSession(sessionId) {
  const trades = store.bySession.get(sessionId)
  if (!trades || trades.length === 0) return null
  const userId = trades[0].userId
  const pnlValues = trades.map((t) => t.pnl || 0)
  const wins = trades.filter((t) => t.outcome === 'win').length
  return {
    sessionId,
    userId,
    date: trades[0].entryAt,
    notes: debriefs.get(sessionId)?.keyLesson || null,
    tradeCount: trades.length,
    winRate: trades.length ? Number((wins / trades.length).toFixed(4)) : 0,
    totalPnl: Number(pnlValues.reduce((a, b) => a + b, 0).toFixed(2)),
    trades,
    summary: `Session with ${trades.length} trades and ${wins} wins.`,
  }
}

function buildMetrics(userId, granularity = 'daily', from = null, to = null) {
  let trades = store.byUser.get(userId) || []
  if (from) trades = trades.filter((t) => new Date(t.entryAt) >= new Date(from))
  if (to) trades = trades.filter((t) => new Date(t.entryAt) <= new Date(to))

  const adherenceTrades = trades.filter((t) => Number.isFinite(t.planAdherence))
  const planAdherenceScore = adherenceTrades.length
    ? adherenceTrades.reduce((a, t) => a + t.planAdherence, 0) / adherenceTrades.length
    : 0

  const revengeTrades = trades.filter((t) => t.revengeFlag).length

  const byEmotion = {}
  for (const t of trades) {
    const emotion = t.emotionalState || 'neutral'
    if (!byEmotion[emotion]) byEmotion[emotion] = { wins: 0, losses: 0, winRate: 0 }
    if (t.outcome === 'win') byEmotion[emotion].wins += 1
    if (t.outcome === 'loss') byEmotion[emotion].losses += 1
  }
  for (const emotion of Object.keys(byEmotion)) {
    const entry = byEmotion[emotion]
    const total = entry.wins + entry.losses
    entry.winRate = total ? Number((entry.wins / total).toFixed(4)) : 0
  }

  const buckets = new Map()
  for (const t of trades) {
    const d = new Date(t.entryAt)
    const bucket =
      granularity === 'hourly'
        ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours())).toISOString()
        : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()

    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket).push(t)
  }

  const timeseries = Array.from(buckets.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([bucket, bucketTrades]) => {
      const wins = bucketTrades.filter((t) => t.outcome === 'win').length
      const pnl = bucketTrades.reduce((a, t) => a + (t.pnl || 0), 0)
      const paTrades = bucketTrades.filter((t) => Number.isFinite(t.planAdherence))
      const avgPlan = paTrades.length
        ? paTrades.reduce((a, t) => a + t.planAdherence, 0) / paTrades.length
        : 0
      return {
        bucket,
        tradeCount: bucketTrades.length,
        winRate: bucketTrades.length ? Number((wins / bucketTrades.length).toFixed(4)) : 0,
        pnl: Number(pnl.toFixed(2)),
        avgPlanAdherence: Number(avgPlan.toFixed(4)),
      }
    })

  const daily = timeseries.map((point) => ({
    date: point.bucket,
    score: Math.max(0, Math.min(100, Math.round((point.winRate * 60 + point.avgPlanAdherence * 8) * 1.2))),
    sessionId: (trades.find((t) => t.entryAt.startsWith(point.bucket.slice(0, 10))) || {}).sessionId || 'session-1',
  }))

  return {
    userId,
    granularity,
    from: from || (trades[0]?.entryAt ?? null),
    to: to || (trades[trades.length - 1]?.entryAt ?? null),
    planAdherenceScore: Number(planAdherenceScore.toFixed(4)),
    sessionTiltIndex: Number((trades.filter((t) => t.outcome === 'loss').length / Math.max(trades.length, 1)).toFixed(4)),
    winRateByEmotionalState: byEmotion,
    revengeTrades,
    overtradingEvents: 0,
    timeseries,
    daily,
  }
}

function buildProfile(userId) {
  const trades = store.byUser.get(userId) || []
  if (trades.length === 0) return null
  const pathology = trades[0].groundTruthPathologies || 'unknown'
  const sessions = [...new Set(trades.map((t) => t.sessionId))]
  return {
    userId,
    generatedAt: new Date().toISOString(),
    traderName: trades[0].traderName,
    dominantPathologies: [
      {
        pathology,
        confidence: 0.92,
        evidenceSessions: sessions.slice(0, 3),
      },
    ],
    summary: `${trades[0].traderName} shows repeated ${pathology} patterns in seeded data.`,
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', dbConnection: 'seeded-csv', queueLag: 0, timestamp: new Date().toISOString() })
})

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = summarizeSession(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' })
  res.json(session)
})

app.post('/api/sessions/:sessionId/debrief', (req, res) => {
  const session = summarizeSession(req.params.sessionId)
  if (!session) return res.status(404).json({ error: 'NOT_FOUND', message: 'Session not found' })
  const payload = req.body || {}
  debriefs.set(req.params.sessionId, payload)
  res.status(201).json({ debriefId: randomUUID(), sessionId: req.params.sessionId, savedAt: new Date().toISOString() })
})

app.get('/api/sessions/:sessionId/coaching', (req, res) => {
  const session = summarizeSession(req.params.sessionId)
  if (!session) return res.status(404).end()

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const msg = `You completed ${session.tradeCount} trades with win rate ${Math.round(session.winRate * 100)}%. Focus on repeating disciplined entries and tightening exits on weak setups.`
  const tokens = msg.split(' ')
  let index = 0

  const timer = setInterval(() => {
    if (index >= tokens.length) {
      res.write(`event: done\ndata: ${JSON.stringify({ fullMessage: msg })}\n\n`)
      clearInterval(timer)
      res.end()
      return
    }
    res.write(`event: token\ndata: ${JSON.stringify({ token: `${tokens[index]} `, index })}\n\n`)
    index += 1
  }, 120)

  req.on('close', () => clearInterval(timer))
})

app.get('/api/users/:userId/metrics', (req, res) => {
  const userId = req.params.userId
  const trades = store.byUser.get(userId)
  if (!trades || trades.length === 0) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' })
  }

  const { from, to, granularity = 'daily' } = req.query
  const metrics = buildMetrics(userId, String(granularity), from ? String(from) : null, to ? String(to) : null)
  res.json(metrics)
})

app.get('/api/users/:userId/profile', (req, res) => {
  const profile = buildProfile(req.params.userId)
  if (!profile) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' })
  res.json(profile)
})

app.listen(PORT, () => {
  console.log(`Seeded mock API listening on port ${PORT}`)
})
