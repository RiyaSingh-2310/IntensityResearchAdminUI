import type { AuthSession } from '@/types'

const SESSION_KEY = 'ir_admin_session'

export function readSession(): AuthSession | null {
  const raw =
    window.localStorage.getItem(SESSION_KEY) ??
    window.sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (!session.token || !session.expiresAt || !session.user) return null
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function writeSession(session: AuthSession) {
  const payload = JSON.stringify(session)
  clearSession()
  const storage = session.remember ? window.localStorage : window.sessionStorage
  storage.setItem(SESSION_KEY, payload)
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY)
  window.sessionStorage.removeItem(SESSION_KEY)
}

export function getAccessToken() {
  return readSession()?.token ?? null
}
