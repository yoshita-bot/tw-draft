import { cn } from '../../lib/cn'
import { getFilteredEmployees } from '../../data/mockData'

const PREVIEW_LIMIT = 5

interface ActivityAuditProps { selectedGroup: string }

export function ActivityAudit({ selectedGroup }: ActivityAuditProps) {
  const employees = getFilteredEmployees(selectedGroup)
  const sorted    = [...employees]
    .sort((a, b) => a.activityPct - b.activityPct)
    .slice(0, PREVIEW_LIMIT)

  if (!sorted.length) return <p className="text-xs text-gray-400 text-center py-6">No data</p>

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(emp => {
        const isAbsent  = emp.activityPct === 0
        const isFlagged = !isAbsent && emp.activityPct < 70

        return (
          <div key={emp.id} className="flex items-center gap-2.5">
            {/* Soft avatar */}
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: emp.avatarColor + '22', color: emp.avatarColor }}
            >
              {emp.initials.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[12px] font-medium text-gray-800 truncate">{emp.name}</span>
                  <span className="text-[10px] text-gray-400">{emp.team}</span>
                </div>
                {/* Value — red text only when flagged, otherwise muted */}
                <span className={cn(
                  'text-[11px] font-semibold tabular-nums ml-2 shrink-0',
                  isAbsent  ? 'text-gray-300' :
                  isFlagged ? 'text-red-500'  : 'text-gray-500',
                )}>
                  {isAbsent ? '—' : `${emp.activityPct}%`}
                </span>
              </div>
              {/* Single-color bar — red only when flagged */}
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${emp.activityPct}%`,
                    backgroundColor: isFlagged ? '#EF4444' : '#3B71E8',
                    opacity: isAbsent ? 0 : 1,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
