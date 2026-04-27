import axios from 'axios'
import { API_BASE_URL } from './constants'
import { authHeaders } from './auth'
import { parseMetrics, parseProfile, parseSession } from './contracts'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
})

api.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...authHeaders() }
  return config
})

export async function getUserMetrics(userId) {
  const { data } = await api.get(`/api/users/${userId}/metrics`)
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
  const { data } = await api.post(`/api/sessions/${sessionId}/debrief`, payload)
  return data
}

export function buildCoachingSseUrl(sessionId) {
  return `${API_BASE_URL}/api/sessions/${sessionId}/coaching`
}
