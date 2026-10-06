import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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

export function AdminDonut({ data }: { data: ChartDatum[] }) {
  const { colors, surface } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={3}>
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatNumber(Number(value))}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${surface.tooltipBorder}`,
            background: surface.tooltipBg,
            color: surface.tooltipText,
            fontSize: 12,
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function AdminBar({ data, color }: { data: ChartDatum[]; color?: string }) {
  const { colors, surface } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke={surface.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: surface.tick }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: surface.tick }} />
        <Tooltip
          formatter={(value) => formatNumber(Number(value))}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${surface.tooltipBorder}`,
            background: surface.tooltipBg,
            color: surface.tooltipText,
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill={color ?? colors[0]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AdminLine({ data, color }: { data: TrendPoint[]; color?: string }) {
  const { colors, surface } = useChartTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke={surface.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: surface.tick }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: surface.tick }} />
        <Tooltip
          formatter={(value) => formatNumber(Number(value))}
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${surface.tooltipBorder}`,
            background: surface.tooltipBg,
            color: surface.tooltipText,
            fontSize: 12,
          }}
        />
        <Line type="monotone" dataKey="value" stroke={color ?? colors[0]} strokeWidth={2.4} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
