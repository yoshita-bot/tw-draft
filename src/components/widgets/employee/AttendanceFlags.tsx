import { AlertTriangle, XCircle, LogOut, CheckCircle } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

type FlagType = 'tardy' | 'missed' | 'early-departure'

const FLAG_CONFIG: Record<FlagType, {
  label: string
  icon: React.ReactNode
  bg: string
  text: string
  border: string
  dotColor: string
}> = {
  tardy: {
    label: 'Late arrival',
    icon: <AlertTriangle size={11} />,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    dotColor: '#F59E0B',
  },
  missed: {
    label: 'Missed shift',
    icon: <XCircle size={11} />,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dotColor: '#EF4444',
  },
  'early-departure': {
    label: 'Left early',
    icon: <LogOut size={11} />,
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    dotColor: '#F97316',
  },
}

export function AttendanceFlags() {
  const { attendanceFlags } = EMPLOYEE_MOCK

  const tardyCount    = attendanceFlags.filter(f => f.type === 'tardy').length
  const missedCount   = attendanceFlags.filter(f => f.type === 'missed').length
  const earlyCount    = attendanceFlags.filter(f => f.type === 'early-departure').length

  if (attendanceFlags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <CheckCircle size={28} className="text-green-400" />
        <p className="text-sm font-semibold text-gray-700">Perfect attendance</p>
        <p className="text-[11px] text-gray-400">No flags this month</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {tardyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle size={10} className="text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-700">
              {tardyCount} late {tardyCount === 1 ? 'arrival' : 'arrivals'}
            </span>
          </div>
        )}
        {missedCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200">
            <XCircle size={10} className="text-red-500" />
            <span className="text-[11px] font-semibold text-red-700">
              {missedCount} missed {missedCount === 1 ? 'shift' : 'shifts'}
            </span>
          </div>
        )}
        {earlyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200">
            <LogOut size={10} className="text-orange-500" />
            <span className="text-[11px] font-semibold text-orange-700">
              {earlyCount} early {earlyCount === 1 ? 'departure' : 'departures'}
            </span>
          </div>
        )}
      </div>

      {/* Flag list */}
      <div className="flex flex-col gap-2">
        {attendanceFlags.map((flag, i) => {
          const cfg = FLAG_CONFIG[flag.type]
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border',
                cfg.bg, cfg.border,
              )}
            >
              {/* Icon */}
              <span className={cn('mt-0.5 shrink-0', cfg.text)}>
                {cfg.icon}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-[11px] font-bold uppercase tracking-wide', cfg.text)}>
                    {cfg.label}
                  </span>
                  {flag.delta && (
                    <span className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      cfg.bg, cfg.text,
                    )}>
                      {flag.delta}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600 mt-0.5">
                  <span className="font-medium">{flag.date}</span>
                  {flag.actualTime
                    ? <span className="text-gray-400"> · Scheduled {flag.scheduledTime} · Clocked in {flag.actualTime}</span>
                    : <span className="text-gray-400"> · Scheduled {flag.scheduledTime} · Did not clock in</span>
                  }
                </div>
                {flag.note && (
                  <div className="text-[10px] text-gray-400 mt-0.5 italic">{flag.note}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
