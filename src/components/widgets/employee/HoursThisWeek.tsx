import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const TODAY_INDEX = 0

export function HoursThisWeek() {
  const { hoursWorked, expectedHours, dailyHours } = EMPLOYEE_MOCK.thisWeek
  const { weeklyCapHours } = EMPLOYEE_MOCK

  const capPct    = weeklyCapHours ? Math.min((hoursWorked / weeklyCapHours) * 100, 100) : null
  const capLeft   = weeklyCapHours ? Math.max(weeklyCapHours - hoursWorked, 0) : null

  const barColor =
    capPct === null  ? '#3B71E8' :
    capPct >= 100    ? '#EF4444' :
    capPct >= 80     ? '#F59E0B' :
                       '#10B981'

  const capLabel =
    capPct === null   ? null :
    capPct >= 100     ? 'Cap reached' :
    capPct >= 80      ? `${Math.round(capPct)}% of cap — ${capLeft}h left` :
                        `${Math.round(capPct)}% of ${weeklyCapHours}h cap`

  const maxDaily = Math.max(...dailyHours, 1)

  return (
    <div className="flex flex-col gap-5">

      {/* Headline */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-[32px] font-black text-gray-900 tabular-nums leading-none">
            {hoursWorked}h
          </span>
          <span className="text-xs text-muted font-medium">of {expectedHours}h expected</span>
        </div>
        {capLabel && (
          <p className="text-[11px] text-muted mt-1.5">{capLabel}</p>
        )}
      </div>

      {/* Daily chart */}
      <div className="flex items-end gap-1.5">
        {dailyHours.map((hours, i) => {
          const barH    = hours > 0 ? Math.max((hours / maxDaily) * 52, 8) : 4
          const isToday = i === TODAY_INDEX

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${barH}px`,
                  backgroundColor:
                    hours === 0 ? '#F1F5F9' :
                    isToday    ? '#3B71E8' :
                                 '#86EFAC',
                }}
              />
              <span className="text-[9px] text-gray-400 tabular-nums">
                {hours > 0 ? `${hours}h` : '—'}
              </span>
              <span className={cn(
                'text-[10px] font-semibold',
                isToday ? 'text-[#3B71E8]' : 'text-gray-400',
              )}>
                {DAY_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
