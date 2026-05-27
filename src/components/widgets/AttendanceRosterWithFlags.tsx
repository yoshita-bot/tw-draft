import { useState } from 'react'
import { Clock, XCircle, CheckCircle2, LogOut, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  getFilteredEmployees,
  type Employee,
  type EmployeeStatus,
  EXCEPTION_FLAGS,
  getEmployeeById,
  type ExceptionFlag,
} from '../../data/mockData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

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

// ── Roster row variants ───────────────────────────────────────────────────────

function ClockedInRow({ emp }: { emp: Employee }) {
  const actColor =
    emp.activityPct >= 80 ? '#10B981' :
    emp.activityPct >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <Avatar emp={emp} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-[11px] text-gray-500">
          <Clock size={9} className="text-gray-300" />
          <span className="tabular-nums">{emp.clockInTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 tabular-nums">
            {emp.hoursToday != null ? fmtHours(emp.hoursToday) : '—'} today
          </span>
          <span className="text-[10px] font-semibold tabular-nums" style={{ color: actColor }}>
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1 text-[11px]">
          <Clock size={9} className="text-amber-400" />
          <span className="tabular-nums text-amber-600 font-semibold">{emp.clockInTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {emp.expectedStartTime && (
            <span className="text-[10px] text-gray-400">Expected {emp.expectedStartTime}</span>
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-gray-800 truncate">{emp.name}</span>
          <span className="text-[10px] text-gray-400">{emp.team}</span>
        </div>
        <p className="text-[10px] text-gray-400 truncate">{emp.title}</p>
      </div>
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

// ── Roster tab config ─────────────────────────────────────────────────────────

type Tab = EmployeeStatus

const TABS: { id: Tab; label: string; dot: string }[] = [
  { id: 'clocked-in',  label: 'In',     dot: 'bg-emerald-400' },
  { id: 'tardy',       label: 'Tardy',  dot: 'bg-amber-400'   },
  { id: 'absent',      label: 'Absent', dot: 'bg-red-400'     },
  { id: 'clocked-out', label: 'Out',    dot: 'bg-gray-300'    },
]

const PREVIEW_LIMIT = 5

// ── Exception Flags config ────────────────────────────────────────────────────

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

const FLAGS_LIMIT = 4

// ── ViewAll link ──────────────────────────────────────────────────────────────

function ViewAll({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-[11px] text-[#3B71E8] font-semibold hover:text-blue-700 transition-colors cursor-pointer group">
      {label}
      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

// ── Combined component ────────────────────────────────────────────────────────

interface Props { selectedGroup: string }

export function AttendanceRosterWithFlags({ selectedGroup }: Props) {
  const [tab, setTab] = useState<Tab>('clocked-in')

  // ── Roster data ──────────────────────────────────────────────────────────────
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

  const filtered = (byStatus[tab] ?? []).slice(0, PREVIEW_LIMIT)

  // ── Flags data ───────────────────────────────────────────────────────────────
  const filteredIds = new Set(all.map(e => e.id))
  const flags = EXCEPTION_FLAGS
    .filter(f => filteredIds.has(f.employeeId))
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, FLAGS_LIMIT)

  return (
    <div className="flex gap-0 min-h-0">

      {/* ── Left: Roster ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-0 min-w-0 pr-5">

        {/* Sub-heading */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
          Roster
        </p>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 mb-3">
          {TABS.map(t => {
            const count = counts[t.id]
            if (count === 0) return null
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
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', t.dot)} />
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

        {/* Rows */}
        <div className="flex flex-col flex-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No employees in this group</p>
          ) : (
            filtered.map(emp => {
              switch (emp.status) {
                case 'clocked-in':  return <ClockedInRow  key={emp.id} emp={emp} />
                case 'tardy':       return <TardyRow       key={emp.id} emp={emp} />
                case 'absent':      return <AbsentRow      key={emp.id} emp={emp} />
                case 'clocked-out': return <ClockedOutRow  key={emp.id} emp={emp} />
              }
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <ViewAll label="View full roster" />
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="w-px bg-gray-100 shrink-0 self-stretch" />

      {/* ── Right: Exception Flags ────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col gap-0 pl-5">

        {/* Sub-heading */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
          Exception Flags
        </p>

        {/* Flags list */}
        <div className="flex flex-col gap-2 flex-1">
          {flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <p className="text-xs font-medium text-gray-600">No active flags</p>
              <p className="text-[11px] text-gray-400 text-center">All employees meeting expectations</p>
            </div>
          ) : (
            flags.map(flag => {
              const emp = getEmployeeById(flag.employeeId)
              return (
                <div
                  key={flag.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5 rounded-lg border border-gray-100 border-l-2 bg-white',
                    PRIORITY_BORDER[flag.priority],
                  )}
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', PRIORITY_DOT[flag.priority])} />
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
                  <button className="text-[11px] font-semibold text-[#3B71E8] hover:text-blue-700 transition-colors cursor-pointer shrink-0 mt-0.5 whitespace-nowrap">
                    {flag.action}
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <ViewAll label="View all flags" />
        </div>
      </div>
    </div>
  )
}
