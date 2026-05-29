import { EXEC_ATTENDANCE_KPI } from '../../../data/executiveMockData'
import { TrendBadge, type TrendDirection } from '../TrendBadge'

interface KPIItemProps {
  label: string
  value: string
  trend: number
  higherIsBad?: boolean
  last?: boolean
}

function KPIItem({ label, value, trend, higherIsBad = true, last }: KPIItemProps) {
  const direction: TrendDirection = higherIsBad
    ? (trend > 0 ? 'worse' : 'better')
    : (trend > 0 ? 'better' : 'worse')

  return (
    <div className={`px-8 py-7 flex flex-col gap-2 flex-1 basis-1/5 min-w-[20%] ${last ? '' : 'border-r border-black/[0.06]'}`}>
      <span className="text-xs font-medium text-ink-secondary uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[32px] font-semibold leading-none text-ink tabular-nums">
        {value}
      </span>
      <TrendBadge delta={trend} direction={direction} />
    </div>
  )
}

export function AttendanceKPICard() {
  const { absent, tardy, shrinkage, lostHours } = EXEC_ATTENDANCE_KPI

  return (
    <div className="flex flex-wrap">
      <KPIItem label="Absent"     value={String(absent.value)}      trend={absent.trend}    />
      <KPIItem label="Tardy"      value={String(tardy.value)}       trend={tardy.trend}     />
      <KPIItem label="Shrinkage"  value={`${shrinkage.value}%`}     trend={shrinkage.trend} />
      <KPIItem label="Lost Hours" value={`${lostHours.value} hrs`}  trend={lostHours.trend} last />
    </div>
  )
}
