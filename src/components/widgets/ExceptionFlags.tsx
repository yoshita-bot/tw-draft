import { CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { EXCEPTION_FLAGS, getEmployeeById, getFilteredEmployees, type ExceptionFlag } from '../../data/mockData'

const PRIORITY_BORDER: Record<string, string> = {
  high:   'border-l-red-400',
  medium: 'border-l-amber-400',
  low:    'border-l-gray-300',
}

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
}

const TYPE_LABELS: Record<ExceptionFlag['type'], string> = {
  'absent':           'Absent',
  'hour-cap':         'Hour Cap',
  'low-activity':     'Low Activity',
  'missing-schedule': 'No Schedule',
}

const PREVIEW_LIMIT = 4

interface ExceptionFlagsProps { selectedGroup: string }

export function ExceptionFlags({ selectedGroup }: ExceptionFlagsProps) {
  const filtered     = getFilteredEmployees(selectedGroup)
  const filteredIds  = new Set(filtered.map(e => e.id))

  const flags = EXCEPTION_FLAGS
    .filter(f => filteredIds.has(f.employeeId))
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, PREVIEW_LIMIT)

  if (!flags.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <CheckCircle2 size={22} className="text-emerald-400" />
        <p className="text-xs font-medium text-gray-600">No active flags</p>
        <p className="text-[11px] text-gray-400 text-center">All employees are meeting expectations</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {flags.map(flag => {
        const emp = getEmployeeById(flag.employeeId)

        return (
          <div
            key={flag.id}
            className={cn(
              'flex items-start gap-3 px-3 py-2.5 rounded-lg border border-gray-100 border-l-2 bg-white',
              PRIORITY_BORDER[flag.priority],
            )}
          >
            {/* Priority dot */}
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', PRIORITY_DOT[flag.priority])} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  {TYPE_LABELS[flag.type]}
                </span>
                {emp && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400">{emp.name}</span>
                  </>
                )}
              </div>
              <p className="text-[12px] text-gray-700 leading-snug">{flag.message}</p>
            </div>

            {/* Action */}
            <button className="text-[11px] font-semibold text-[#3B71E8] hover:text-blue-700 transition-colors cursor-pointer shrink-0 mt-0.5 whitespace-nowrap">
              {flag.action}
            </button>
          </div>
        )
      })}
    </div>
  )
}
