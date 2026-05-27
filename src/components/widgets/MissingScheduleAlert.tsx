import { CalendarX, ArrowRight, CheckCircle2 } from 'lucide-react'
import { EMPLOYEES } from '../../data/mockData'

const PREVIEW_LIMIT = 3

export function MissingScheduleAlert() {
  const missing = EMPLOYEES.filter(e => !e.hasSchedule)
  const preview = missing.slice(0, PREVIEW_LIMIT)

  if (!missing.length) {
    return (
      <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={15} className="text-emerald-600" />
        </div>
        <div>
          <div className="text-xs font-semibold text-emerald-700">All schedules assigned</div>
          <div className="text-[11px] text-emerald-600/70 mt-0.5">Every employee has a schedule for next week</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Banner */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
        <CalendarX size={13} className="text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-800">
            {missing.length} employee{missing.length !== 1 ? 's' : ''} without a schedule
          </span>
          <span className="text-[10px] text-gray-500 ml-1.5">next week</span>
        </div>
      </div>

      {/* Employee rows */}
      <div className="flex flex-col gap-1">
        {preview.map(emp => (
          <div key={emp.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: emp.avatarColor }}
            >
              {emp.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-800 truncate">{emp.name}</div>
              <div className="text-[10px] text-gray-400">{emp.team} · {emp.title}</div>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1 bg-royal/10 text-royal text-[10px] font-semibold rounded-lg hover:bg-royal hover:text-white transition-colors cursor-pointer shrink-0 border border-royal/20 hover:border-royal">
              Assign <ArrowRight size={9} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
