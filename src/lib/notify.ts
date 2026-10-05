import { toast } from 'sonner'
import { SESSION_EXPIRED_MESSAGE } from '@/lib/apiClient'
import { ApiError, getErrorMessage } from '@/lib/errors'

export const notify = {
  success(message: string) {
    toast.success(message)
  },
  error(error: unknown, fallback?: string) {
    // Expired sessions already raise a single global toast and redirect to sign-in.
    if (error instanceof ApiError && error.message === SESSION_EXPIRED_MESSAGE) return
    toast.error(getErrorMessage(error, fallback))
  },
  info(message: string) {
    toast.info(message)
  },
}
