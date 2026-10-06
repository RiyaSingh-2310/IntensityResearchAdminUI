import { LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ADMIN_NAV } from '@/lib/constants'
import { roleLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'

export function AdminSidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn('px-5 pt-6 pb-5', collapsed && 'px-3')}>
        <Logo inverted compact={collapsed} />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ADMIN_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-label={item.label}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2',
                isActive &&
                  'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-primary/40',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('size-4 shrink-0', isActive && 'text-sidebar-primary')} />
                {!collapsed ? <span className="font-medium">{item.label}</span> : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4">
        {!collapsed ? (
          <div className="mb-3 rounded-2xl bg-sidebar-accent/70 px-3 py-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/65">{roleLabel(user?.role)}</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          className={cn(
            'w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start',
          )}
          onClick={() => {
            logout()
            navigate('/admin/login')
          }}
          aria-label="Logout"
        >
          <LogOut className="size-4" />
          {!collapsed ? 'Logout' : null}
        </Button>
      </div>
    </div>
  )
}
