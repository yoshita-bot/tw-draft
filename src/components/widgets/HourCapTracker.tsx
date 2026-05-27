import { cn } from '../../lib/cn'
import { getFilteredEmployees } from '../../data/mockData'

const PREVIEW_LIMIT = 5

interface HourCapTrackerProps { selectedGroup: string }

export function HourCapTracker({ selectedGroup }: HourCapTrackerProps) {
  const employees = getFilteredEmployees(selectedGroup)
  const sorted    = [...employees]
    .sort((a, b) => (b.hoursThisWeek / b.hourCap) - (a.hoursThisWeek / a.hourCap))
    .slice(0, PREVIEW_LIMIT)

  if (!sorted.length) return <p className="text-xs text-gray-400 text-center py-6">No data</p>

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(emp => {
        const pct       = Math.min(Math.round((emp.hoursThisWeek / emp.hourCap) * 100), 110)
        const barPct    = Math.min(pct, 100)
        const isOver    = pct >= 100
        const isWarning = !isOver && pct >= 80

        return (
          <div key={emp.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              {/* Soft avatar */}
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ backgroundColor: emp.avatarColor + '22', color: emp.avatarColor }}
              >
                {emp.initials.charAt(0)}
              </div>

              <span className="text-[12px] font-medium text-gray-800 truncate flex-1">{emp.name}</span>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {emp.hoursThisWeek}h
                  <span className="text-gray-300"> / {emp.hourCap}h</span>
                </span>
                <span className={cn(
                  'text-[11px] font-semibold tabular-nums w-8 text-right',
                  isOver    ? 'text-red-500'    :
                  isWarning ? 'text-amber-600'  : 'text-gray-400',
                )}>
                  {pct}%
                </span>
              </div>
            </div>

            {/* Bar — blue normally, amber near cap, red over cap */}
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden ml-[34px]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: isOver ? '#EF4444' : isWarning ? '#F59E0B' : '#3B71E8',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
