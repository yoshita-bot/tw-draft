import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'
import { CalendarDays } from 'lucide-react'

export function UpcomingSchedule() {
  const { upcomingSchedule } = EMPLOYEE_MOCK

  if (upcomingSchedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
        <CalendarDays size={24} className="text-gray-300" />
        <span className="text-sm font-semibold text-muted">No upcoming shifts</span>
        <span className="text-xs text-gray-400">Your schedule is empty right now.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {upcomingSchedule.map((shift, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-sky/60 border border-border/50"
        >
          <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
            <CalendarDays size={14} className="text-muted" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-blackish">{shift.date}</div>
            <div className="text-[11px] text-muted mt-0.5">{shift.time}</div>
          </div>

          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0',
              shift.type === 'Fixed'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-yellow-light text-yellow-700',
            )}
          >
            {shift.type}
          </span>
        </div>
      ))}
    </div>
  )
}
