import { LogOut, Mail } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BRAND } from '@/config/brand'
import { useAuth } from '@/context/AuthContext'
import { ADMIN_NAV_SECTIONS, type NavItem } from '@/lib/constants'
import { cn } from '@/lib/utils'

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate?: () => void
}) {
  const link = (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
          collapsed && 'justify-center px-2',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <item.icon
            className={cn(
              'size-[1.05rem] shrink-0 transition-colors',
              isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/55 group-hover:text-sidebar-foreground/85',
            )}
          />
          {!collapsed ? <span className="truncate font-medium">{item.label}</span> : null}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

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
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className={cn('flex h-16 items-center px-5', collapsed && 'justify-center px-3')}>
        <Logo inverted compact={collapsed} />
      </div>
      <div className="mx-4 h-px bg-sidebar-border" aria-hidden />

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-1">
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border first:hidden" aria-hidden />
            ) : (
              <p className="px-3 pb-1 text-[0.68rem] font-semibold tracking-[0.14em] text-sidebar-foreground/40 uppercase">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        {!collapsed && user ? (
          <div className="rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/55">{user.email || user.role}</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          className={cn(
            'w-full text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'justify-center px-0' : 'justify-start',
          )}
          onClick={() => {
            logout()
            navigate('/admin/login')
          }}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
          {!collapsed ? 'Sign out' : null}
        </Button>
        {!collapsed ? (
          <a
            href={`mailto:${BRAND.email}`}
            className="flex items-center gap-2 px-3 pb-1 text-[0.7rem] text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/75"
          >
            <Mail className="size-3" />
            {BRAND.email}
          </a>
        ) : null}
      </div>
    </div>
  )
}
