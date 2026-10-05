import { ApiError } from '@/lib/errors'

export interface ApiEnvelope<T = unknown> {
  success?: boolean
  message?: string
  data?: T
  errors?: Record<string, unknown>
}

const STATUS_FALLBACK: Record<number, string> = {
  400: 'The request could not be processed.',
  401: 'Invalid email or password.',
  403: 'You do not have permission to do that.',
  404: 'The requested record was not found.',
  405: 'This request method is not allowed by the API.',
  409: 'This action conflicts with the current data.',
  410: 'This link or record is no longer available.',
  422: 'Please check the highlighted fields and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'The server could not complete this request. Please try again.',
  502: 'The server is temporarily unavailable. Please try again shortly.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
  504: 'The server took too long to respond. Please try again.',
}

const MAX_MESSAGE_LENGTH = 240

/** Server messages that look like stack traces, SQL, or markup are never shown to admins. */
function isSafeMessage(message: string) {
  if (message.length > MAX_MESSAGE_LENGTH) return false
  return !/(<\/?[a-z][\s\S]*>|stack trace|exception|sqlstate|pdo|fatal error|warning:|notice:|on line \d+|\.php|#\d+ \/)/i.test(
    message,
  )
}

export function messageFromEnvelope(
  payload: ApiEnvelope | null,
  status: number,
  authRequest: boolean,
  method?: string,
  url?: string,
) {
  const fromFields = fieldMessages(payload?.errors)
  const message = payload?.message?.trim() ?? ''
  if (status >= 500) {
    // 500s are usually unhandled server faults; gateway-style errors (502/503) carry useful API text.
    if (status !== 500 && message && isSafeMessage(message)) return message
    return STATUS_FALLBACK[status] ?? STATUS_FALLBACK[500]
  }
  if (message && isSafeMessage(message)) {
    return fromFields ? `${message} ${fromFields}` : message
  }
  if (fromFields) return fromFields
  if (status === 401) {
    return authRequest
      ? 'Your session has expired. Please sign in again.'
      : 'Invalid email or password.'
  }
  if (status === 405) {
    const fallback = STATUS_FALLBACK[405]
    if (import.meta.env.DEV && method && url) return `${fallback} (${method} ${url})`
    return fallback
  }
  return STATUS_FALLBACK[status] ?? 'Something went wrong. Please try again.'
}

function fieldMessages(errors?: Record<string, unknown>) {
  if (!errors) return ''
  return Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value).trim())
    .filter((value) => value && isSafeMessage(value))
    .slice(0, 3)
    .join(' ')
}

export function asApiError(error: unknown, status = 400) {
  if (error instanceof ApiError) return error
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong. Please try again.', status)
}
