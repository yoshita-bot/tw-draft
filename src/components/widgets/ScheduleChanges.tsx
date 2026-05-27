import { useState } from 'react'
import { Check, X, CalendarDays } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SCHEDULE_CHANGE_REQUESTS, getEmployeeById, type ScheduleRequestType } from '../../data/mockData'

const TYPE_CONFIG: Record<ScheduleRequestType, { label: string; color: string; bg: string }> = {
  'swap':         { label: 'Day Swap',     color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100'   },
  'time-off':     { label: 'Time Off',     color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100'  },
  'overtime':     { label: 'Overtime',     color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  'shift-change': { label: 'Shift Change', color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-100'   },
}

const PREVIEW_LIMIT = 3

export function ScheduleChanges() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const visible = SCHEDULE_CHANGE_REQUESTS.filter(r => !dismissed.has(r.id)).slice(0, PREVIEW_LIMIT)

  const handle = (id: string) => setDismissed(prev => new Set([...prev, id]))

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Check size={16} className="text-emerald-500" />
        </div>
        <p className="text-xs font-medium text-gray-500">All caught up</p>
        <p className="text-[11px] text-gray-400">No pending schedule requests</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map(req => {
        const emp = getEmployeeById(req.employeeId)
        const typeCfg = TYPE_CONFIG[req.type]
        return (
          <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 transition-colors">
            {emp && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: emp.avatarColor }}
              >
                {emp.initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-gray-800 truncate">{emp?.name ?? 'Unknown'}</span>
                <span className={cn('px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0 border', typeCfg.bg, typeCfg.color)}>
                  {typeCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <CalendarDays size={9} className="shrink-0" />
                <span className="truncate">{req.from} → {req.to}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handle(req.id)}
                className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors cursor-pointer"
                title="Approve"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => handle(req.id)}
                className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                title="Deny"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
