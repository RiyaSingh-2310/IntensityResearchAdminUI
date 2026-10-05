import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

function AuthBoot() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="w-full max-w-sm space-y-3 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function ProtectedRoute() {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <AuthBoot />
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestRoute() {
  const { user, ready } = useAuth()
  if (!ready) return <AuthBoot />
  if (user) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}
