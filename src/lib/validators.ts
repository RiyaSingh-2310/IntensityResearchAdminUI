export const POINTS_MAX_DIGITS = 6
export const POINTS_MAX = 999_999
export const PHONE_MAX_DIGITS = 10
export const SURVEY_NAME_MAX_LENGTH = 60

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email.trim())
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function required(value: string, label: string) {
  return value.trim() ? undefined : `${label} is required.`
}

export function digitsOnly(value: string, maxDigits: number) {
  return value.replace(/\D/g, '').slice(0, maxDigits)
}

export function sanitizePointsInput(value: string) {
  return digitsOnly(value, POINTS_MAX_DIGITS)
}

export function sanitizePhoneInput(value: string) {
  return digitsOnly(value, PHONE_MAX_DIGITS)
}

export function validatePoints(value: string | number, label = 'Points') {
  const raw = String(value).trim()
  if (!raw) return `${label} is required.`
  if (!/^\d+$/.test(raw)) return `Enter a whole number for ${label.toLowerCase()}.`
  if (raw.length > POINTS_MAX_DIGITS) return `${label} cannot exceed ${POINTS_MAX_DIGITS} digits.`
  const points = Number(raw)
  if (!Number.isInteger(points) || points <= 0) return `Enter a positive whole number for ${label.toLowerCase()}.`
  if (points > POINTS_MAX) return `${label} cannot exceed ${POINTS_MAX.toLocaleString('en-US')}.`
  return undefined
}

/** Whole-number points that may be zero (settings / thresholds). */
export function validateNonNegativePoints(value: string | number, label = 'Points') {
  const raw = String(value).trim()
  if (raw === '') return `${label} is required.`
  if (!/^\d+$/.test(raw)) return `Enter a whole number for ${label.toLowerCase()}.`
  if (raw.length > POINTS_MAX_DIGITS) return `${label} cannot exceed ${POINTS_MAX_DIGITS} digits.`
  const points = Number(raw)
  if (!Number.isInteger(points) || points < 0) return `Enter a whole number of 0 or more for ${label.toLowerCase()}.`
  if (points > POINTS_MAX) return `${label} cannot exceed ${POINTS_MAX.toLocaleString('en-US')}.`
  return undefined
}

export function validateOptionalPhone(value: string) {
  const phone = value.trim()
  if (!phone) return undefined
  if (!/^\d{1,10}$/.test(phone)) return 'Phone must be up to 10 digits.'
  return undefined
}

export function validateSurveyName(value: string, requiredField = true) {
  const name = value.trim()
  if (!name) return requiredField ? 'Enter a survey or project name.' : undefined
  if (name.length > SURVEY_NAME_MAX_LENGTH) {
    return `Survey / project name must be ${SURVEY_NAME_MAX_LENGTH} characters or fewer.`
  }
  return undefined
}

export function validateSurveyUrl(value: string) {
  const url = value.trim()
  if (!url) return 'Enter a survey URL.'
  if (!isValidUrl(url)) return 'Enter a valid http(s) URL.'
  return undefined
}
