import {
  BarChart3,
  ClipboardList,
  Gift,
  History,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'

export const ADMIN_NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/panelists', label: 'Panelists', icon: Users },
  { to: '/admin/projects', label: 'Assigned Projects', icon: ClipboardList },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift },
  { to: '/admin/reward-requests', label: 'Reward Requests', icon: Wallet },
  { to: '/admin/reward-history', label: 'Reward History', icon: History },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const

export const SIDEBAR_COLLAPSED_KEY = 'ir_admin_sidebar_collapsed'

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22 },
}
