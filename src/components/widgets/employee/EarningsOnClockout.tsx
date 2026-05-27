import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function EarningsOnClockout() {
  const { todayStats, thisWeek, hourlyRate } = EMPLOYEE_MOCK

  // Build per-day rows (only days with hours)
  const days = thisWeek.dailyHours
    .map((h, i) => ({ label: DAY_NAMES[i], hours: h, earnings: +(h * hourlyRate).toFixed(2), isToday: i === 0 }))
    .filter(d => d.hours > 0)

  return (
    <div className="flex flex-col gap-4">

      {/* Headline numbers */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Est. today</p>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">${todayStats.earnings.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">This week</p>
          <p className="text-xl font-bold text-gray-700 tabular-nums">${thisWeek.earnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Per-day breakdown as a text list */}
      <div className="flex flex-col gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className={`text-[12px] font-semibold ${d.isToday ? 'text-gray-900' : 'text-gray-500'}`}>
              {d.label}
              {d.isToday && <span className="ml-1.5 text-[10px] font-semibold text-[#3B71E8] bg-blue-50 px-1.5 py-0.5 rounded-full">Today</span>}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">{d.hours}h</span>
              <span className={`text-[12px] font-bold tabular-nums ${d.isToday ? 'text-gray-900' : 'text-gray-600'}`}>
                ${d.earnings.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400">At ${hourlyRate.toFixed(2)}/hr · Synced from TimeWorks Desktop</p>
    </div>
  )
}
