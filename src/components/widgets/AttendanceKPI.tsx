import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { ATTENDANCE_KPI } from '../../data/mockData'

interface StatRowProps {
  label: string
  value: string
  trend: number
  higherIsBad?: boolean
}

function StatRow({ label, value, trend, higherIsBad = true }: StatRowProps) {
  const isUp   = trend > 0
  const isBad  = higherIsBad ? isUp : !isUp
  const TrendIcon = isUp ? TrendingUp : TrendingDown

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-gray-500 flex-1">{label}</span>
      <span className="text-sm font-bold text-gray-900 tabular-nums">{value}</span>
      <div className={cn('flex items-center gap-1 text-[11px] font-medium w-24 justify-end', isBad ? 'text-red-500' : 'text-emerald-600')}>
        <TrendIcon size={10} />
        <span>{Math.abs(trend)}% vs last wk</span>
      </div>
    </div>
  )
}

export function AttendanceKPI() {
  const { absent, tardy, shrinkage, lostHours } = ATTENDANCE_KPI
  return (
    <div className="flex flex-col">
      <StatRow label="Absent today"  value={String(absent.value)}      trend={absent.trend}    higherIsBad />
      <StatRow label="Tardy"         value={String(tardy.value)}       trend={tardy.trend}     higherIsBad />
      <StatRow label="Shrinkage"     value={`${shrinkage.value}%`}     trend={shrinkage.trend} higherIsBad />
      <StatRow label="Lost hours"    value={`${lostHours.value}h`}     trend={lostHours.trend} higherIsBad />
    </div>
  )
}
