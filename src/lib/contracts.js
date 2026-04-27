import { z } from 'zod'

const TradeSchema = z.object({
  tradeId: z.string().optional().default(''),
  asset: z.string().optional().default('Unknown'),
  direction: z.enum(['long', 'short']).optional().default('long'),
  status: z.enum(['open', 'closed', 'cancelled']).optional().default('closed'),
  planAdherence: z.number().int().min(1).max(5).nullable().optional().default(null),
  emotionalState: z
    .enum(['calm', 'anxious', 'greedy', 'fearful', 'neutral'])
    .nullable()
    .optional()
    .default(null),
})

const SessionSchema = z.object({
  sessionId: z.string().optional().default(''),
  summary: z.string().optional().default('No session summary provided.'),
  trades: z.array(TradeSchema).optional().default([]),
})

const DayMetricSchema = z.object({
  date: z.string().optional().default(''),
  score: z.number().optional().default(0),
  sessionId: z.string().optional().default('session-1'),
})

const TimeseriesPointSchema = z.object({
  bucket: z.string().optional().default(''),
  tradeCount: z.number().int().optional().default(0),
  winRate: z.number().optional().default(0),
  pnl: z.number().optional().default(0),
  avgPlanAdherence: z.number().optional().default(0),
})

const EmotionStatsSchema = z.object({
  wins: z.number().int().optional().default(0),
  losses: z.number().int().optional().default(0),
  winRate: z.number().optional().default(0),
})

const MetricsSchema = z.object({
  userId: z.string().optional().default(''),
  granularity: z.string().optional().default('daily'),
  from: z.string().nullable().optional().default(null),
  to: z.string().nullable().optional().default(null),
  planAdherenceScore: z.number().optional().default(0),
  sessionTiltIndex: z.number().optional().default(0),
  revengeTrades: z.number().int().optional().default(0),
  overtradingEvents: z.number().int().optional().default(0),
  daily: z.array(DayMetricSchema).optional().default([]),
  timeseries: z.array(TimeseriesPointSchema).optional().default([]),
  winRateByEmotionalState: z.record(z.string(), EmotionStatsSchema).optional().default({}),
})

const ProfileSchema = z.record(z.string(), z.unknown())

function toTrade(raw) {
  return {
    tradeId: raw?.tradeId || raw?.id || '',
    asset: raw?.asset || raw?.symbol || 'Unknown',
    direction: raw?.direction || 'long',
    status: raw?.status || 'closed',
    planAdherence: raw?.planAdherence ?? raw?.plan_score ?? null,
    emotionalState: raw?.emotionalState ?? raw?.emotion ?? null,
  }
}

export function parseSession(raw) {
  const normalized = {
    sessionId: raw?.sessionId || raw?.id || '',
    summary: raw?.summary || raw?.title || 'No session summary provided.',
    trades: Array.isArray(raw?.trades) ? raw.trades.map(toTrade) : [],
  }
  return SessionSchema.parse(normalized)
}

function normalizeTimeseries(raw) {
  const rows = Array.isArray(raw?.timeseries) ? raw.timeseries : []
  return rows.map((row) => ({
    bucket: row?.bucket || row?.date || row?.day || '',
    tradeCount: Number(row?.tradeCount ?? row?.count ?? 0),
    winRate: Number(row?.winRate ?? 0),
    pnl: Number(row?.pnl ?? 0),
    avgPlanAdherence: Number(row?.avgPlanAdherence ?? row?.planAdherence ?? 0),
  }))
}

function normalizeDaily(raw, fallbackTimeseries) {
  const dailyRows = Array.isArray(raw?.daily) ? raw.daily : []
  if (dailyRows.length > 0) {
    return dailyRows.map((row) => ({
      date: row?.date || row?.day || '',
      score: Number(row?.score ?? row?.quality ?? row?.value ?? 0),
      sessionId: row?.sessionId || row?.session_id || 'session-1',
    }))
  }

  return fallbackTimeseries.map((point) => ({
    date: point.bucket,
    score: Math.max(0, Math.min(100, Math.round(point.winRate * 70 + point.avgPlanAdherence * 10))),
    sessionId: 'session-1',
  }))
}

export function parseMetrics(raw) {
  const timeseries = normalizeTimeseries(raw)

  const normalized = {
    userId: raw?.userId || '',
    granularity: raw?.granularity || 'daily',
    from: raw?.from || null,
    to: raw?.to || null,
    planAdherenceScore: Number(raw?.planAdherenceScore ?? 0),
    sessionTiltIndex: Number(raw?.sessionTiltIndex ?? 0),
    revengeTrades: Number(raw?.revengeTrades ?? 0),
    overtradingEvents: Number(raw?.overtradingEvents ?? 0),
    timeseries,
    daily: normalizeDaily(raw, timeseries),
    winRateByEmotionalState: raw?.winRateByEmotionalState || {},
  }

  return MetricsSchema.parse(normalized)
}

export function parseProfile(raw) {
  return ProfileSchema.parse(raw || {})
}

export function parseApiError(error) {
  const status = error?.response?.status
  const traceId = error?.response?.data?.traceId || error?.response?.headers?.['x-trace-id']
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Request failed.'

  return {
    status,
    traceId,
    message: traceId ? `${message} (traceId: ${traceId})` : message,
  }
}
