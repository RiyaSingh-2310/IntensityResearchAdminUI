const OFFICIAL_API_BASE_URL = 'https://intensityresearch.com/intensityapi'

export const API_BASE_URL = resolveApiBaseUrl()

export const apiConfig = {
  baseUrl: API_BASE_URL,
}

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') ?? ''
  if (configured === OFFICIAL_API_BASE_URL) return configured
  return OFFICIAL_API_BASE_URL
}

export function joinApiUrl(path: string) {
  const base = apiConfig.baseUrl.replace(/\/$/, '')
  let suffix = path.trim()
  if (!suffix) return base
  if (suffix.startsWith(base)) return suffix
  suffix = suffix.replace(/^https?:\/\/[^/]+/i, '')
  suffix = suffix.replace(/^\/intensityapi(?=\/|$)/, '')
  if (!suffix.startsWith('/')) suffix = `/${suffix}`
  return `${base}${suffix}`
}

/** Panelist photos may come back as absolute URLs or as paths relative to the API host. */
export function resolveMediaUrl(path?: string | null) {
  const value = path?.trim()
  if (!value) return ''
  if (/^https:\/\//i.test(value)) return value
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return ''
  if (value.startsWith('/')) return `${new URL(apiConfig.baseUrl).origin}${value}`
  return `${apiConfig.baseUrl.replace(/\/$/, '')}/${value}`
}
