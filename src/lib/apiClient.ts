import { joinApiUrl } from '@/config/api'
import { ApiError } from '@/lib/errors'
import { messageFromEnvelope, type ApiEnvelope } from '@/lib/apiEnvelope'
import { clearSession, getAccessToken } from '@/lib/session'

const UNAUTHORIZED_EVENT = 'ir:unauthorized'
const REQUEST_TIMEOUT_MS = 20_000

export function emitUnauthorized() {
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
}

export function onUnauthorized(handler: () => void) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
}

export function toSearch(query: object = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue
    params.set(key, String(value))
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const authRequest = options.auth !== false
  const url = joinApiUrl(path)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (authRequest) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'omit',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new ApiError('The request timed out. Please try again.', 0)
    }
    throw new ApiError('Unable to reach the server. Check your connection and try again.', 0)
  }

  if (response.status === 204) return undefined as T

  const raw = await readPayload(response)
  if (raw === UNPARSEABLE) {
    throw new ApiError('The server returned an unexpected response. Please try again.', 502)
  }
  const payload = raw

  if (response.status === 401) {
    if (authRequest) {
      clearSession()
      emitUnauthorized()
      throw new ApiError(SESSION_EXPIRED_MESSAGE, 401)
    }
    throw new ApiError(messageFromEnvelope(payload, response.status, authRequest), 401)
  }

  if (!response.ok) {
    throw new ApiError(messageFromEnvelope(payload, response.status, authRequest, method, url), response.status)
  }

  if (payload && typeof payload === 'object' && payload.success === false) {
    throw new ApiError(messageFromEnvelope(payload, 400, authRequest, method, url), 400)
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }
  return payload as T
}

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

const UNPARSEABLE = Symbol('unparseable')

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

async function readPayload(response: Response): Promise<ApiEnvelope | null | typeof UNPARSEABLE> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    const text = await response.text()
    return { data: text as unknown as undefined }
  }
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as ApiEnvelope
  } catch {
    // Error bodies are replaced by status-based copy; success bodies must be JSON.
    return response.ok ? UNPARSEABLE : null
  }
}
