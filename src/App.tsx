import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppRoutes } from '@/routes/AppRoutes'

export default function App() {
  return (
    <ErrorBoundary className="mx-auto grid min-h-svh max-w-lg content-center p-6">
      <AppRoutes />
    </ErrorBoundary>
  )
}
