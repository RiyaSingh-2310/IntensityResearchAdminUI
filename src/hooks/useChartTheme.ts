import { getChartColors, getChartSurface } from '@/config/theme'
import { useTheme } from '@/hooks/useTheme'

export function useChartTheme() {
  const { theme } = useTheme()
  return {
    theme,
    colors: getChartColors(),
    surface: getChartSurface(),
  }
}
