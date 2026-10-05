export const THEME_STORAGE_KEY = 'ir_admin_theme'

export type ThemeMode = 'light' | 'dark'

export const DEFAULT_THEME: ThemeMode = 'dark'

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
    readCssColor('--chart-1', '#5c8dff'),
    readCssColor('--chart-2', '#46c2e6'),
    readCssColor('--chart-3', '#9d86ff'),
    readCssColor('--chart-4', '#4fd1a0'),
    readCssColor('--chart-5', '#f3bd4f'),
  ]
}

export function getChartSurface() {
  return {
    grid: readCssColor('--border', '#1d2840'),
    tooltipBg: readCssColor('--popover', '#101a2e'),
    tooltipText: readCssColor('--popover-foreground', '#e7ecf6'),
    tooltipBorder: readCssColor('--border', '#1d2840'),
    tick: readCssColor('--muted-foreground', '#93a0ba'),
    legend: readCssColor('--foreground', '#e7ecf6'),
    cursor: readCssColor('--muted', '#131c30'),
    card: readCssColor('--card', '#0d1424'),
  }
}
