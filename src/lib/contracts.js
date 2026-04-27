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

const MetricsSchema = z.object({
  daily: z.array(DayMetricSchema).optional().default([]),
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

export function parseMetrics(raw) {
  const dailyRows =
    raw?.daily ||
    raw?.timeseries ||
    raw?.data ||
    []

  const normalized = {
    daily: Array.isArray(dailyRows)
      ? dailyRows.map((row) => ({
          date: row?.date || row?.day || '',
          score: Number(row?.score ?? row?.quality ?? row?.value ?? 0),
          sessionId: row?.sessionId || row?.session_id || 'session-1',
        }))
      : [],
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
