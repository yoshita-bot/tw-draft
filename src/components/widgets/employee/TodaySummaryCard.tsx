import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'

function fmtHours(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

interface StatBlockProps {
  label: string
  value: string
  sub: string
  pct?: number
  barColor?: string
}

function StatBlock({ label, value, sub, pct, barColor = '#3B71E8' }: StatBlockProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-[22px] font-bold text-gray-900 leading-none tabular-nums">{value}</span>
      <span className="text-[11px] text-gray-500 leading-tight">{sub}</span>
      {/* no progress bars in the strip — keep it clean */}
    </div>
  )
}

export function TodaySummaryCard() {
  const { todayStats, thisWeek } = EMPLOYEE_MOCK

  const todayPct = Math.min((todayStats.hoursWorked / todayStats.expectedHours) * 100, 100)
  const weekPct  = Math.min((thisWeek.hoursWorked   / thisWeek.expectedHours)   * 100, 100)
  const weekLeft = Math.max(thisWeek.expectedHours - thisWeek.hoursWorked, 0)

  const statusColor = todayStats.status === 'active'
    ? 'bg-green-500'
    : todayStats.status === 'away'
      ? 'bg-amber-400'
      : 'bg-gray-300'

  const statusLabel = todayStats.status === 'active'
    ? `Active · Clocked in at ${todayStats.clockInTime}`
    : todayStats.status === 'away'
      ? 'Away'
      : 'Offline'

  return (
    <div className="flex flex-col gap-4">
      {/* Desktop sync indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
        <span className="text-[11px] font-semibold text-gray-600">{statusLabel}</span>
        <span className="text-[11px] text-gray-400">· Synced from TimeWorks Desktop</span>
      </div>

      {/* 4 stat blocks */}
      <div className="grid grid-cols-4 gap-6">
        <StatBlock
          label="Today's Hours"
          value={fmtHours(todayStats.hoursWorked)}
          sub={`of ${todayStats.expectedHours}h expected`}
          pct={todayPct}
          barColor="#3B71E8"
        />
        <StatBlock
          label="This Week"
          value={`${thisWeek.hoursWorked}h`}
          sub={`${weekLeft}h left · of ${thisWeek.expectedHours}h`}
          pct={weekPct}
          barColor="#F59E0B"
        />
        <StatBlock
          label="Activity Rate"
          value={`${todayStats.activityRate}%`}
          sub="Tracked today"
          pct={todayStats.activityRate}
          barColor="#10B981"
        />
        <StatBlock
          label="Today's Earnings"
          value={`$${todayStats.earnings.toFixed(2)}`}
          sub={`$${thisWeek.earnings.toFixed(2)} this week`}
        />
      </div>
    </div>
  )
}
