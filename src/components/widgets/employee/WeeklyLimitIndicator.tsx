import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

export function WeeklyLimitIndicator() {
  const { weeklyCapHours } = EMPLOYEE_MOCK
  const { hoursWorked } = EMPLOYEE_MOCK.thisWeek

  if (!weeklyCapHours) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-lg">∞</span>
        </div>
        <span className="text-sm font-semibold text-muted">No limit set</span>
        <span className="text-xs text-gray-400 text-center">Your client has not set a weekly hour cap.</span>
      </div>
    )
  }

  const pct = Math.min((hoursWorked / weeklyCapHours) * 100, 100)
  const remaining = Math.max(weeklyCapHours - hoursWorked, 0)
  const reached = hoursWorked >= weeklyCapHours

  const fillColor =
    pct >= 100 ? 'bg-red' :
    pct >= 80  ? 'bg-yellow' :
                 'bg-green'

  const textColor =
    pct >= 100 ? 'text-red' :
    pct >= 80  ? 'text-yellow' :
                 'text-green'

  return (
    <div className="flex flex-col gap-4">
      {/* Percentage display */}
      <div className="flex items-baseline gap-2">
        <span className={cn('text-4xl font-black tabular-nums', textColor)}>
          {Math.round(pct)}%
        </span>
        <span className="text-sm text-muted">of {weeklyCapHours}h cap</span>
      </div>

      {/* Fraction */}
      <div className="text-xs text-muted -mt-2">{hoursWorked}h used</div>

      {/* Progress bar */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', fillColor)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Warning text */}
      <div
        className={cn(
          'text-xs font-semibold px-3 py-2 rounded-lg',
          reached
            ? 'bg-red-light text-red'
            : pct >= 80
              ? 'bg-yellow-light text-yellow-700'
              : 'bg-green-light text-green',
        )}
      >
        {reached
          ? "You've reached your weekly limit"
          : `You're ${remaining}h from your weekly limit`}
      </div>
    </div>
  )
}
