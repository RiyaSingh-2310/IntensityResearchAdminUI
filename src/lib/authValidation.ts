import { isValidEmail } from '@/lib/validators'

export const MAX_PASSWORD_LENGTH = 72
export const MAX_ADMIN_NAME_LENGTH = 80

export function validateAdminEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email address is required.'
  if (!isValidEmail(value)) return 'Please enter a valid email address.'
  return undefined
}

export function validateAdminPassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`
  }
  return undefined
}

export function validateAdminName(value: string): string | undefined {
  const name = value.trim()
  if (!name) return 'Name is required.'
  if (name.length > MAX_ADMIN_NAME_LENGTH) {
    return `Name must be ${MAX_ADMIN_NAME_LENGTH} characters or fewer.`
  }
  return undefined
}

export function validatePasswordConfirmation(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Confirm password is required.'
  if (password !== confirm) return 'New password and confirmation do not match.'
  return undefined
}
