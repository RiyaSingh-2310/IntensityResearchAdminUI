export const THEME_STORAGE_KEY = 'ir_admin_theme'

export type ThemeMode = 'light' | 'dark'

export const DEFAULT_THEME: ThemeMode = 'light'

export const CHART_COLOR_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const

export function readCssColor(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export function getChartColors() {
  return [
    readCssColor('--chart-1', '#3f5f45'),
    readCssColor('--chart-2', '#7d9a6f'),
    readCssColor('--chart-3', '#9a9b4f'),
    readCssColor('--chart-4', '#4c524e'),
    readCssColor('--chart-5', '#b8cab0'),
  ]
}

export function getChartSurface() {
  return {
    grid: readCssColor('--border', '#e1dfd7'),
    tooltipBg: readCssColor('--popover', '#ffffff'),
    tooltipText: readCssColor('--popover-foreground', '#1f2421'),
    tooltipBorder: readCssColor('--border', '#e1dfd7'),
    tick: readCssColor('--muted-foreground', '#646b66'),
    legend: readCssColor('--foreground', '#1f2421'),
    cursor: readCssColor('--muted', '#eeede7'),
    card: readCssColor('--card', '#ffffff'),
  }
}
