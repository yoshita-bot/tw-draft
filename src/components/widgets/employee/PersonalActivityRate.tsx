import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function dotColor(val: number) {
  if (val === 0)   return { fill: '#E2E8F0', text: 'text-gray-300' }
  if (val >= 80)   return { fill: '#10B981', text: 'text-emerald-600' }
  if (val >= 60)   return { fill: '#F59E0B', text: 'text-amber-600' }
  return               { fill: '#EF4444', text: 'text-red-500' }
}

export function PersonalActivityRate() {
  const rate    = EMPLOYEE_MOCK.thisWeek.activityRate
  const history = EMPLOYEE_MOCK.activityHistory // last 7 days, today is last

  const label =
    rate >= 80 ? 'Active' :
    rate >= 60 ? 'Good'   :
    rate >= 40 ? 'Low'    : 'Very low'

  const mainColor =
    rate >= 80 ? 'text-emerald-600' :
    rate >= 60 ? 'text-amber-500'   :
                 'text-red-500'

  const badgeCn =
    rate >= 80 ? 'bg-green-50 text-emerald-700' :
    rate >= 60 ? 'bg-amber-50 text-amber-700'   :
                 'bg-red-50 text-red-600'

  return (
    <div className="flex flex-col gap-5">

      {/* Big rate */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-5xl font-black tabular-nums leading-none', mainColor)}>
            {rate}%
          </span>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', badgeCn)}>
            {label}
          </span>
        </div>
        <p className="text-[11px] text-muted mt-1.5">Based on your tracked time today</p>
      </div>

      {/* 7-day dot indicators */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Last 7 days
        </p>
        <div className="flex items-center gap-2">
          {history.map((val, i) => {
            const { fill, text } = dotColor(val)
            const isToday = i === history.length - 1
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                {/* Dot */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: fill + '22' }}
                  title={val > 0 ? `${val}%` : 'No data'}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: fill }}
                  />
                </div>
                {/* Value */}
                <span className={cn('text-[9px] font-semibold tabular-nums', val === 0 ? 'text-gray-300' : text)}>
                  {val > 0 ? `${val}%` : '—'}
                </span>
                {/* Day label */}
                <span className={cn(
                  'text-[9px] font-semibold',
                  isToday ? 'text-[#3B71E8]' : 'text-gray-400',
                )}>
                  {DAY_LABELS[i].slice(0, 1)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
