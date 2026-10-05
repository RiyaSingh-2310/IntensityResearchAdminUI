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
    readCssColor('--chart-1', '#1a5fd0'),
    readCssColor('--chart-2', '#13a3b4'),
    readCssColor('--chart-3', '#0d2b5e'),
    readCssColor('--chart-4', '#7fb0ee'),
    readCssColor('--chart-5', '#9aa8bb'),
  ]
}

export function getChartSurface() {
  return {
    grid: readCssColor('--border', '#e1e7ef'),
    tooltipBg: readCssColor('--popover', '#ffffff'),
    tooltipText: readCssColor('--popover-foreground', '#0d1f3c'),
    tooltipBorder: readCssColor('--border', '#e1e7ef'),
    tick: readCssColor('--muted-foreground', '#5a6a82'),
    legend: readCssColor('--foreground', '#0d1f3c'),
    cursor: readCssColor('--muted', '#f0f3f8'),
    card: readCssColor('--card', '#ffffff'),
  }
}
