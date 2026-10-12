/** Only in-app admin paths may be used after sign-in. External and auth URLs fall back to the dashboard. */
export function safeAdminReturnPath(from: unknown) {
  if (typeof from !== 'string' || !from.startsWith('/admin/') || from.startsWith('//')) return '/admin/dashboard'
  if (from === '/admin/login' || from === '/admin/forgot-password') return '/admin/dashboard'
  return from
}
