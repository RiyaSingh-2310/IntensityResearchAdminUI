import { apiRequest } from '@/lib/apiClient'
import { ApiError } from '@/lib/errors'
import { mapAuthSession } from '@/lib/mappers'
import { readSession } from '@/lib/session'
import type { AdminUser, AuthSession, LoginInput } from '@/types'
import type { ApiLoginData } from '@/types/api'

/**
 * Admin auth against the Intensity Research OpenAPI contract
 * (https://intensityresearch.com/intensityapi/docs/).
 *
 * Documented admin auth surface: POST /admin/login only.
 * The Intensity API has no admin change-password, admin forgot-password, admin profile-update,
 * admin photo-upload, admin "me", or admin logout route (all verified 404 on the live API).
 * The panelist routes (/me/password is not published at all; /auth/forgot-password targets
 * panelist accounts) must not be used for administrators.
 */
export const adminAuthService = {
  async login(input: LoginInput): Promise<AuthSession> {
    const data = await apiRequest<ApiLoginData>('/admin/login', {
      method: 'POST',
      body: { email: input.email, password: input.password },
      auth: false,
    })
    if (!data?.token || !data.admin) {
      throw new ApiError('Login did not return a session token. Please try again.', 502)
    }
    return mapAuthSession(data, input)
  },
  /**
   * Restore the signed-in admin from the local session.
   * There is no admin profile endpoint; the token is validated by the first protected request,
   * and any 401 clears the session through the API client.
   */
  async me(): Promise<AdminUser> {
    const session = readSession()
    if (!session?.token) throw new ApiError('Your session has expired. Please sign in again.', 401)
    return session.user
  },
}
