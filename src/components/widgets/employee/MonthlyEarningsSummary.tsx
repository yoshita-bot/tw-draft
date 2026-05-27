import { ArrowRight } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

const TODAY_DAY = 26 // May 26

export function MonthlyEarningsSummary() {
  const { total, daily } = EMPLOYEE_MOCK.monthlyEarnings

  const maxEarnings = Math.max(...daily, 1)
  const workingDays = daily.filter(d => d > 0).length
  const avgDaily = workingDays > 0 ? total / workingDays : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header numbers */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="text-3xl font-black text-blackish tabular-nums">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted mt-0.5">earned this month (May)</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-muted tabular-nums">
            ${avgDaily.toFixed(2)} avg / day
          </div>
          <div className="text-[10px] text-gray-400">{workingDays} working days</div>
        </div>
      </div>

      {/* Day-by-day bar chart */}
      <div className="flex items-end gap-0.5" style={{ height: 64 }}>
        {daily.map((earned, i) => {
          const day = i + 1
          const isToday = day === TODAY_DAY
          const barH = earned > 0 ? Math.max((earned / maxEarnings) * 56, 4) : 2

          const barBg =
            earned === 0
              ? 'bg-gray-100'
              : isToday
                ? 'bg-emerald-500'
                : 'bg-royal/70'

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end"
              style={{ height: 64 }}
              title={`May ${day}: ${earned > 0 ? `$${earned.toFixed(2)}` : 'No earnings'}`}
            >
              <div
                className={cn('w-full rounded-sm transition-all', barBg, isToday && 'ring-1 ring-emerald-400/60')}
                style={{ height: `${barH}px` }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels: show every 5th day */}
      <div className="flex">
        {daily.map((_, i) => {
          const day = i + 1
          const show = day === 1 || day % 5 === 0 || day === TODAY_DAY
          return (
            <div key={i} className="flex-1 flex justify-center">
              {show && (
                <span
                  className={cn(
                    'text-[9px] font-semibold',
                    day === TODAY_DAY ? 'text-emerald-600' : 'text-gray-400',
                  )}
                >
                  {day}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <button className="flex items-center gap-1 text-[11px] text-royal font-semibold hover:text-blue-700 transition-colors cursor-pointer group w-fit">
        View full report
        <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}
