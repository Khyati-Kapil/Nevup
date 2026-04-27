import axios from 'axios'
import { API_BASE_URL } from './constants'
import { authHeaders, ensureDemoToken, getToken } from './auth'
import { parseMetrics, parseProfile, parseSession } from './contracts'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
})

api.interceptors.request.use(async (config) => {
  await ensureDemoToken()
  config.headers = { ...config.headers, ...authHeaders() }
  return config
})

export async function getUserMetrics(userId, options = {}) {
  const params = {
    from: options.from || '2025-01-01T00:00:00Z',
    to: options.to || '2026-12-31T23:59:59Z',
    granularity: options.granularity || 'daily',
  }
  const { data } = await api.get(`/api/users/${userId}/metrics`, { params })
  return parseMetrics(data)
}

export async function getUserProfile(userId) {
  const { data } = await api.get(`/api/users/${userId}/profile`)
  return parseProfile(data)
}

export async function getSession(sessionId) {
  const { data } = await api.get(`/api/sessions/${sessionId}`)
  return parseSession(data)
}

export async function submitDebrief(sessionId, payload) {
  const body = {
    overallMood: payload.emotion,
    keyMistake: payload.keyMistake || null,
    keyLesson: payload.takeaway || null,
    planAdherenceRating: payload.adherence,
    willReviewTomorrow: true,
  }
  const { data } = await api.post(`/api/sessions/${sessionId}/debrief`, body)
  return data
}

export async function buildCoachingSseUrl(sessionId) {
  await ensureDemoToken()
  const token = getToken()
  return `${API_BASE_URL}/api/sessions/${sessionId}/coaching?token=${encodeURIComponent(token)}`
}
