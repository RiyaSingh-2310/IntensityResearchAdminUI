export function decodeJwtExpiry(token: string) {
  try {
    const parts = token.split('.')
    const payload = parts.length >= 3 ? parts[1] : parts[0]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const parsed = JSON.parse(atob(padded)) as { exp?: number }
    return typeof parsed.exp === 'number' ? parsed.exp * 1000 : null
  } catch {
    return null
  }
}
