import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PageTransition } from '@/components/common/PageTransition'
import { AdminHeader } from '@/components/navigation/AdminHeader'
import { AdminSidebar } from '@/components/navigation/AdminSidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SIDEBAR_COLLAPSED_KEY } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true',
  )

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
  }

  return (
    <div
      className={cn(
        'admin-canvas min-h-svh lg:grid',
        'transition-[grid-template-columns] duration-200',
        collapsed ? 'lg:grid-cols-[76px_1fr]' : 'lg:grid-cols-[256px_1fr]',
      )}
    >
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-svh">
        <AdminSidebar collapsed={collapsed} />
      </aside>

      <div className="min-w-0">
        <AdminHeader
          collapsed={collapsed}
          onOpenMobile={() => setMobileOpen(true)}
          onToggleCollapsed={toggleCollapsed}
        />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[86%] max-w-xs border-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs [&>button]:top-5" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
