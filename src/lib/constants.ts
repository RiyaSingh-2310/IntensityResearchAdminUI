import {
  BarChart3,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const ADMIN_NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Panel',
    items: [
      { to: '/admin/panelists', label: 'Panelists', icon: Users },
      { to: '/admin/projects', label: 'Survey Assignments', icon: ClipboardList },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { to: '/admin/reward-requests', label: 'Reward Requests', icon: Wallet },
      { to: '/admin/reward-history', label: 'Reward History', icon: History },
      { to: '/admin/rewards', label: 'Reward Methods', icon: CreditCard },
    ],
  },
  {
    label: 'System',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
]

export const SIDEBAR_COLLAPSED_KEY = 'ir_admin_sidebar_collapsed'

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22 },
}
