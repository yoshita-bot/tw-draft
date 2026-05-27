import { useState } from 'react'
import { Clock, AlertTriangle, XCircle, CheckCircle2, LogOut } from 'lucide-react'
import { cn } from '../../lib/cn'
import { getFilteredEmployees, type Employee, type EmployeeStatus } from '../../data/mockData'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ emp, size = 7 }: { emp: Employee; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0`}
      style={{ backgroundColor: emp.avatarColor + '22', color: emp.avatarColor }}
    >
      {emp.initials}
    </div>
  )
}

// ── Employee detail cards per status ─────────────────────────────────────────

function ClockedInRow({ emp }: { emp: Employee }) {
  const actColor =
    emp.activityPct >= 80 ? '#10B981' :
    emp.activityPct >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Avatar emp={emp} />

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>

      {/* Details — clock-in, hours, activity */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Clock size={9} className="text-gray-300" />
          <span className="tabular-nums">{emp.clockInTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 tabular-nums">
            {emp.hoursToday != null ? fmtHours(emp.hoursToday) : '—'} today
          </span>
          <span
            className="text-[10px] font-semibold tabular-nums"
            style={{ color: actColor }}
          >
            {emp.activityPct}%
          </span>
        </div>
      </div>
    </div>
  )
}

function TardyRow({ emp }: { emp: Employee }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Avatar emp={emp} />

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>

      {/* Details — expected vs actual, minutes late */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-[11px]">
          <Clock size={9} className="text-amber-400" />
          <span className="tabular-nums text-amber-600 font-semibold">{emp.clockInTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {emp.expectedStartTime && (
            <span className="text-[10px] text-gray-400">
              Expected {emp.expectedStartTime}
            </span>
          )}
          {emp.minutesLate != null && (
            <span className="text-[10px] font-semibold text-amber-600 tabular-nums">
              +{emp.minutesLate}m late
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function AbsentRow({ emp }: { emp: Employee }) {
  const noticeFiled = emp.noticeFiled ?? false
  const days = emp.daysAbsentThisWeek ?? 1

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Avatar emp={emp} />

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>

      {/* Details — days absent, notice */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="text-[11px] font-semibold text-red-500 tabular-nums">
          {days === 1 ? '1 day' : `${days} days`} absent
        </span>
        <div className="flex items-center gap-1">
          {noticeFiled ? (
            <>
              <CheckCircle2 size={9} className="text-emerald-500" />
              <span className="text-[10px] text-emerald-600">Notice filed</span>
            </>
          ) : (
            <>
              <XCircle size={9} className="text-red-400" />
              <span className="text-[10px] text-red-500">No notice</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ClockedOutRow({ emp }: { emp: Employee }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Avatar emp={emp} />

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>

      {/* Details — clock-out time, hours today */}
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <LogOut size={9} className="text-gray-300" />
          <span className="tabular-nums">{emp.clockOutTime ?? '—'}</span>
        </div>
        {emp.hoursToday != null && (
          <span className="text-[10px] text-gray-400 tabular-nums">
            {fmtHours(emp.hoursToday)} tracked today
          </span>
        )}
      </div>
    </div>
  )
}

// ── Tab config ────────────────────────────────────────────────────────────────

type Tab = EmployeeStatus

const TABS: { id: Tab; label: string; dot: string }[] = [
  { id: 'clocked-in',  label: 'In',     dot: 'bg-emerald-400' },
  { id: 'tardy',       label: 'Tardy',  dot: 'bg-amber-400'   },
  { id: 'absent',      label: 'Absent', dot: 'bg-red-400'     },
  { id: 'clocked-out', label: 'Out',    dot: 'bg-gray-300'    },
]

const PREVIEW_LIMIT = 5

// ── Main component ────────────────────────────────────────────────────────────

interface AttendanceRosterProps { selectedGroup: string }

export function AttendanceRoster({ selectedGroup }: AttendanceRosterProps) {
  const [tab, setTab] = useState<Tab>('clocked-in')

  const all = getFilteredEmployees(selectedGroup)

  const byStatus: Record<EmployeeStatus, Employee[]> = {
    'clocked-in':  all.filter(e => e.status === 'clocked-in'),
    'tardy':       all.filter(e => e.status === 'tardy'),
    'absent':      all.filter(e => e.status === 'absent'),
    'clocked-out': all.filter(e => e.status === 'clocked-out'),
  }

  const counts: Record<Tab, number> = {
    'clocked-in':  byStatus['clocked-in'].length,
    tardy:         byStatus['tardy'].length,
    absent:        byStatus['absent'].length,
    'clocked-out': byStatus['clocked-out'].length,
  }

  // Rows for the active filtered tab
  const filtered: Employee[] = (byStatus[tab] ?? []).slice(0, PREVIEW_LIMIT)

  return (
    <div className="flex flex-col gap-0">

      {/* ── Tabs ── */}
      <div className="flex items-center gap-0.5 mb-3">
        {TABS.map(t => {
          const count = counts[t.id]
          if (t.id !== 'all' && count === 0) return null
          const isActive = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                isActive
                  ? 'bg-gray-100 text-gray-800'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
              )}
            >
              {t.dot && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', t.dot)} />
              )}
              {t.label}
              <span className={cn(
                'tabular-nums text-[10px]',
                isActive ? 'text-gray-500' : 'text-gray-300',
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Rows ── */}
      <div className="flex flex-col">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No employees in this group</p>
        )}

        {filtered.map(emp => {
          switch (emp.status) {
            case 'clocked-in':  return <ClockedInRow  key={emp.id} emp={emp} />
            case 'tardy':       return <TardyRow       key={emp.id} emp={emp} />
            case 'absent':      return <AbsentRow      key={emp.id} emp={emp} />
            case 'clocked-out': return <ClockedOutRow  key={emp.id} emp={emp} />
          }
        })}
      </div>
    </div>
  )
}

