import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { GuestRoute, ProtectedRoute } from '@/routes/ProtectedRoute'

const LoginPage = lazy(() => import('@/pages/auth/AdminLogin').then((module) => ({ default: module.AdminLogin })))
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const PanelistsPage = lazy(() =>
  import('@/pages/panelists/PanelistsPage').then((module) => ({ default: module.PanelistsPage })),
)
const PanelistDetailPage = lazy(() =>
  import('@/pages/panelists/PanelistDetailPage').then((module) => ({ default: module.PanelistDetailPage })),
)
const ProjectsPage = lazy(() =>
  import('@/pages/projects/ProjectsPage').then((module) => ({ default: module.ProjectsPage })),
)
const RewardsPage = lazy(() =>
  import('@/pages/rewards/RewardsPage').then((module) => ({ default: module.RewardsPage })),
)
const RewardRequestsPage = lazy(() =>
  import('@/pages/reward-requests/RewardRequestsPage').then((module) => ({ default: module.RewardRequestsPage })),
)
const RewardHistoryPage = lazy(() =>
  import('@/pages/reward-history/RewardHistoryPage').then((module) => ({ default: module.RewardHistoryPage })),
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function RouteFallback() {
  return (
    <div className="space-y-3 p-2">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/panelists" element={<PanelistsPage />} />
            <Route path="/admin/panelists/:id" element={<PanelistDetailPage />} />
            <Route path="/admin/projects" element={<ProjectsPage />} />
            <Route path="/admin/rewards" element={<RewardsPage />} />
            <Route path="/admin/reward-requests" element={<RewardRequestsPage />} />
            <Route path="/admin/reward-history" element={<RewardHistoryPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
