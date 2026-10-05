import { useId, type CSSProperties } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTheme } from '@/hooks/useChartTheme'
import { formatNumber } from '@/lib/format'
import type { ChartDatum, TrendPoint } from '@/types'

type Surface = ReturnType<typeof useChartTheme>['surface']

function tooltipStyles(surface: Surface): {
  contentStyle: CSSProperties
  labelStyle: CSSProperties
  itemStyle: CSSProperties
} {
  return {
    contentStyle: {
      borderRadius: 10,
      border: `1px solid ${surface.tooltipBorder}`,
      background: surface.tooltipBg,
      color: surface.tooltipText,
      fontSize: 12,
      boxShadow: '0 12px 32px -12px rgb(0 0 0 / 0.45)',
      padding: '8px 12px',
    },
    labelStyle: { color: surface.tooltipText, fontWeight: 600, marginBottom: 2 },
    itemStyle: { color: surface.tooltipText, padding: 0 },
  }
}

const axisProps = (surface: Surface) => ({
  tick: { fontSize: 11, fill: surface.tick },
  axisLine: false,
  tickLine: false,
})

export function AdminDonut({ data }: { data: ChartDatum[] }) {
  const { colors, surface } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          stroke={surface.card}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatNumber(Number(value))} {...tooltipStyles(surface)} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: surface.tick, fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function AdminBar({ data, color }: { data: ChartDatum[]; color?: string }) {
  const { colors, surface } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke={surface.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="label" interval={0} {...axisProps(surface)} />
        <YAxis allowDecimals={false} {...axisProps(surface)} />
        <Tooltip
          cursor={{ fill: surface.cursor, opacity: 0.6 }}
          formatter={(value) => formatNumber(Number(value))}
          {...tooltipStyles(surface)}
        />
        <Bar dataKey="value" name="Count" fill={color ?? colors[0]} radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AdminLine({ data, color }: { data: TrendPoint[]; color?: string }) {
  const { colors, surface } = useChartTheme()
  const gradientId = `area-${useId().replace(/:/g, '')}`
  const stroke = color ?? colors[0]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={surface.grid} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="label" {...axisProps(surface)} />
        <YAxis allowDecimals={false} {...axisProps(surface)} />
        <Tooltip
          cursor={{ stroke: surface.grid, strokeWidth: 1 }}
          formatter={(value) => formatNumber(Number(value))}
          {...tooltipStyles(surface)}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Value"
          stroke={stroke}
          strokeWidth={2.2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, stroke: surface.card, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
