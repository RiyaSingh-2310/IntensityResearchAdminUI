import { LogOut, Menu, PanelLeft } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { roleLabel } from '@/lib/labels'
import { useNavigate } from 'react-router-dom'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AdminHeader({
  onOpenMobile,
  onToggleCollapsed,
}: {
  onOpenMobile: () => void
  onToggleCollapsed: () => void
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/80 bg-surface/90 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobile}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
        <div className="lg:hidden">
          <Logo compact />
        </div>
        {/* <p className="hidden text-sm text-muted-foreground md:block">Internal administration</p> */}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto gap-3 px-2 py-1" aria-label="Admin menu">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-medium">{user?.name}</span>
                <span className="block text-xs text-muted-foreground">{user?.email}</span>
              </span>
              <Avatar size="lg">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user ? initials(user.name) : 'IR'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p>{user?.name}</p>
              <p className="text-xs font-normal text-muted-foreground">{roleLabel(user?.role)}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate('/admin/login')
              }}
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
