import { DEMO_USER_ID } from './constants'

const TOKEN_KEY = 'nevup_token'
const SECRET = '97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02'

function toBase64Url(input) {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function hmacSha256(secret, data) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  const bytes = Array.from(new Uint8Array(signature))
  const raw = String.fromCharCode(...bytes)
  return btoa(raw).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function parsePayload(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export async function ensureDemoToken(userId = DEMO_USER_ID) {
  const existing = getToken()
  const payload = existing ? parsePayload(existing) : null
  const now = Math.floor(Date.now() / 1000)

  if (payload?.sub === userId && Number(payload?.exp || 0) > now + 120) {
    return existing
  }

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = toBase64Url(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + 86400,
      role: 'trader',
      name: 'Demo Trader',
    }),
  )

  const sig = await hmacSha256(SECRET, `${header}.${body}`)
  const token = `${header}.${body}.${sig}`
  setToken(token)
  return token
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
