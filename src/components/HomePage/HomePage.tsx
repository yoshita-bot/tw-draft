import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, Bell,
  Clock, Users, DollarSign, Activity, TrendingUp, TrendingDown, Minus,
  Target, CheckCircle2, AlertCircle, XCircle, Coffee, Building2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  DASHBOARD,
  type StatCard,
  type DailyBarPoint,
  type TeamMemberRow,
  type TeamMemberLive,
  type ActivitySegment,
  type ProjectBar,
  type AttendanceData,
  type OrgAttendance,
  type WorkforceStatus,
  type DepartmentRow,
} from '../../data/mockDashboard'

// ── Date helpers ──────────────────────────────────────────────────────────────

const BASE_START = new Date('2026-04-24T00:00:00')

function getDateRangeLabel(offset: number): string {
  const start = new Date(BASE_START.getTime() + offset * 7 * 86400000)
  const end   = new Date(start.getTime() + 6 * 86400000)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start).replace(', 2026', '')} – ${fmt(end)}`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function activityColor(pct: number) {
  if (pct >= 70) return '#10B981'
  if (pct >= 40) return '#F59E0B'
  return '#EF4444'
}

/** Format hours: ≥1000 → "2,840h", else "18h" */
function fmtH(h: number): string {
  return h >= 1000 ? `${h.toLocaleString()}h` : `${h}h`
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<StatCard['iconName'], React.FC<{ size?: number; className?: string }>> = {
  clock:    Clock,
  calendar: Calendar,
  users:    Users,
  dollar:   DollarSign,
  activity: Activity,
  target:   Target,
}

const ICON_BG: Record<StatCard['iconName'], string> = {
  clock:    'bg-royal-light text-royal',
  calendar: 'bg-teal-light text-teal',
  users:    'bg-royal-light text-royal',
  dollar:   'bg-green-light text-green',
  activity: 'bg-orange-light text-orange',
  target:   'bg-teal-light text-teal',
}

// ── Sub-component: StatsCards ─────────────────────────────────────────────────

function StatsCards({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = ICON_MAP[card.iconName]
        return (
          <div
            key={card.id}
            className={cn(
              'bg-white rounded-2xl border border-border p-5 flex flex-col gap-3',
              card.highlight && 'border-royal/30 shadow-sm shadow-royal/10',
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{card.label}</span>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', ICON_BG[card.iconName])}>
                <Icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-black text-blackish tabular-nums leading-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {card.value}
            </p>
            <div className="flex items-center gap-1.5">
              {card.trend === 'up'      && <TrendingUp   size={12} className="text-green shrink-0" />}
              {card.trend === 'down'    && <TrendingDown  size={12} className="text-red   shrink-0" />}
              {card.trend === 'neutral' && <Minus         size={12} className="text-muted shrink-0" />}
              <span className="text-[11px] text-muted">{card.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Sub-component: HoursBarChart (SVG, fully parameterised) ───────────────────

const CW = 700, CH = 220
const PAD = { top: 24, right: 20, bottom: 44, left: 52 }
const PW = CW - PAD.left - PAD.right
const PH = CH - PAD.top  - PAD.bottom
const BGAP = 10
const BW = (PW - BGAP * 6) / 7

interface HoursBarChartProps {
  points: DailyBarPoint[]
  maxY: number
  yTicks: number[]
  formatY?: (v: number) => string
  formatTooltip?: (h: number) => string
}

function HoursBarChart({ points, maxY, yTicks, formatY, formatTooltip }: HoursBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const fmtY   = formatY      ?? ((v) => `${v}h`)
  const fmtTip = formatTooltip ?? ((h) => `${h}h`)

  function yPx(h: number) { return PH - (h / maxY) * PH }

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Total Hours Worked Per Day
          </h2>
          <p className="text-[11px] text-muted mt-0.5">{DASHBOARD.dateRange.label}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#6366F1]" /> Tracked
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow" /> Manual
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full" style={{ height: 200 }}
        role="img" aria-label={`Bar chart: hours worked per day, ${DASHBOARD.dateRange.label}`}>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {yTicks.map(tick => (
            <g key={tick}>
              <line x1={0} y1={yPx(tick)} x2={PW} y2={yPx(tick)}
                stroke="#E5E7EB" strokeWidth={1} strokeDasharray={tick === 0 ? '0' : '3 3'} />
              <text x={-8} y={yPx(tick)} textAnchor="end" dominantBaseline="middle"
                style={{ fontSize: 10, fill: '#6B7280' }}>{fmtY(tick)}</text>
            </g>
          ))}
          {points.map((p, i) => {
            const x    = i * (BW + BGAP)
            const barH = (p.hours / maxY) * PH
            const y    = PH - barH
            const isH  = hovered === i
            const tipTxt = fmtTip(p.hours)
            const tipW = Math.max(52, tipTxt.length * 8 + 16)
            return (
              <g key={p.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                <rect x={x} y={0} width={BW} height={PH} fill="transparent" />
                {p.hours > 0
                  ? <rect x={x} y={y} width={BW} height={barH} rx={5} fill={isH ? '#4F46E5' : '#6366F1'} />
                  : <rect x={x} y={PH - 4} width={BW} height={4} rx={2} fill="#E5E7EB" />
                }
                <text x={x + BW / 2} y={PH + 16} textAnchor="middle" style={{ fontSize: 10, fill: '#6B7280' }}>{p.label}</text>
                <text x={x + BW / 2} y={PH + 28} textAnchor="middle" style={{ fontSize: 9,  fill: '#9CA3AF' }}>{p.dayLabel}</text>
                {isH && p.hours > 0 && (
                  <g>
                    <rect x={x + BW / 2 - tipW / 2} y={y - 38} width={tipW} height={30} rx={6} fill="#1A1A2E" />
                    <polygon points={`${x+BW/2-5},${y-8} ${x+BW/2+5},${y-8} ${x+BW/2},${y-2}`} fill="#1A1A2E" />
                    <text x={x + BW / 2} y={y - 24} textAnchor="middle" style={{ fontSize: 11, fill: 'white', fontWeight: 700 }}>{tipTxt}</text>
                    <text x={x + BW / 2} y={y - 13} textAnchor="middle" style={{ fontSize: 9,  fill: '#9CA3AF' }}>{p.dayLabel}</text>
                  </g>
                )}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// ── Sub-component: WhoIsWorking (Me view — team member list) ──────────────────

const STATUS_META: Record<TeamMemberLive['status'], { label: string; dot: string; textCls: string }> = {
  active:  { label: 'Active',  dot: 'bg-green animate-pulse', textCls: 'text-green'  },
  idle:    { label: 'Idle',    dot: 'bg-yellow',              textCls: 'text-yellow' },
  break:   { label: 'Break',   dot: 'bg-royal',               textCls: 'text-royal'  },
  offline: { label: 'Offline', dot: 'bg-muted/30',            textCls: 'text-muted'  },
}

function WhoIsWorking({ members }: { members: TeamMemberLive[] }) {
  const activeCount = members.filter(m => m.status === 'active').length

  return (
    <div className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
        <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Who's Working Now
        </h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          {activeCount} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {members.map(({ member, status, currentProject, currentTask, todayHours, activityPct, lastSeen }) => {
          const meta = STATUS_META[status]
          return (
            <div key={member.initials} className="flex items-center gap-3 px-4 py-3 hover:bg-sky/30 transition-colors">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ backgroundColor: member.color }}>
                  {member.initials}
                </div>
                <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white', meta.dot)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blackish truncate">{member.name}</p>
                <p className="text-[10px] text-muted truncate">
                  {currentProject
                    ? currentTask ? `${currentProject} · ${currentTask}` : currentProject
                    : lastSeen ? `Last seen ${lastSeen}` : meta.label
                  }
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {status !== 'offline' ? (
                  <>
                    <span className="text-xs font-semibold text-blackish tabular-nums">{todayHours}h today</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-sky overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${activityPct}%`, backgroundColor: activityColor(activityPct) }} />
                      </div>
                      <span className="text-[10px] tabular-nums" style={{ color: activityColor(activityPct) }}>
                        {activityPct}%
                      </span>
                    </div>
                  </>
                ) : (
                  <span className={cn('text-[10px] font-semibold', meta.textCls)}>{meta.label}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-component: WorkforceOverview (All view — org-scale live status) ───────

function WorkforceOverview({ status, departments }: { status: WorkforceStatus; departments: DepartmentRow[] }) {
  const onlinePct = Math.round(((status.active + status.idle + status.onBreak) / status.total) * 100)
  const topDepts  = [...departments].sort((a, b) => b.headcount - a.headcount).slice(0, 3)

  const segments = [
    { pct: (status.active  / status.total) * 100, color: '#10B981', label: 'Active'   },
    { pct: (status.idle    / status.total) * 100, color: '#F59E0B', label: 'Idle'     },
    { pct: (status.onBreak / status.total) * 100, color: '#0863C9', label: 'Break'    },
    { pct: (status.offline / status.total) * 100, color: '#E5E7EB', label: 'Offline'  },
  ]

  const statusBoxes = [
    { count: status.active,  label: 'Active',    bg: 'bg-green/5  border-green/20',  text: 'text-green',  dot: <span className="w-2 h-2 rounded-full bg-green animate-pulse" /> },
    { count: status.idle,    label: 'Idle',      bg: 'bg-yellow/5 border-yellow/20', text: 'text-yellow', dot: <span className="w-2 h-2 rounded-full bg-yellow" />              },
    { count: status.onBreak, label: 'On Break',  bg: 'bg-royal/5  border-royal/20',  text: 'text-royal',  dot: <Coffee size={12} className="text-royal" />                      },
    { count: status.offline, label: 'Offline',   bg: 'bg-sky      border-border',    text: 'text-muted',  dot: <span className="w-2 h-2 rounded-full bg-muted/30" />            },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
        <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Workforce Status
        </h2>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          Live · {status.total.toLocaleString()} employees
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Headline */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-blackish tabular-nums" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {onlinePct}%
          </span>
          <span className="text-xs text-muted">currently online</span>
        </div>

        {/* Stacked bar */}
        <div className="h-2.5 rounded-full overflow-hidden flex gap-0.5">
          {segments.map((seg) => (
            <div key={seg.label} style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} className="h-full first:rounded-l-full last:rounded-r-full" />
          ))}
        </div>

        {/* Status boxes 2×2 */}
        <div className="grid grid-cols-2 gap-2">
          {statusBoxes.map(({ count, label, bg, text, dot }) => (
            <div key={label} className={cn('flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border', bg)}>
              <span className={cn('text-xl font-black tabular-nums', text)} style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {count.toLocaleString()}
              </span>
              <span className={cn('flex items-center gap-1 text-[10px] font-semibold', text)}>
                {dot}
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Top departments */}
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Top Departments</p>
          <div className="flex flex-col gap-2">
            {topDepts.map((dept) => {
              const pct = Math.round((dept.online / dept.headcount) * 100)
              return (
                <div key={dept.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dept.color }} />
                  <span className="text-[11px] text-blackish/80 flex-1 truncate">{dept.name}</span>
                  <span className="text-[10px] text-muted tabular-nums shrink-0">{dept.online}/{dept.headcount}</span>
                  <div className="w-10 h-1.5 rounded-full bg-sky overflow-hidden shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: dept.color }} />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: dept.color }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: ActivityBreakdown ──────────────────────────────────────────

function ActivityBreakdown({ segments }: { segments: ActivitySegment[] }) {
  let cumulative = 0
  const stops = segments.map(s => {
    const start = cumulative
    cumulative += s.pct
    return `${s.color} ${start}% ${cumulative}%`
  })
  const gradient  = `conic-gradient(from -90deg, ${stops.join(', ')})`
  const productive = segments.find(s => s.label === 'Productive')?.pct ?? 0

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        Activity Breakdown
      </h2>

      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 shrink-0">
          <div className="w-full h-full rounded-full" style={{ background: gradient }} />
          <div className="absolute inset-[10px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-base font-black text-blackish tabular-nums" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {productive}%
            </span>
            <span className="text-[8px] text-muted font-semibold uppercase tracking-wide">active</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {segments.map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] text-muted flex-1">{s.label}</span>
              <span className="text-[11px] font-bold text-blackish tabular-nums">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: TopProjects ────────────────────────────────────────────────

function TopProjects({ projects }: { projects: ProjectBar[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
      <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        Top Projects
        <span className="text-muted font-medium text-xs ml-1.5">· This Week</span>
      </h2>

      <div className="flex flex-col gap-3">
        {projects.map(p => (
          <div key={p.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-[11px] font-medium text-blackish truncate">{p.name}</span>
              </div>
              <span className="text-[11px] font-bold text-blackish tabular-nums ml-2 shrink-0">{fmtH(p.hours)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-sky overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${(p.hours / p.maxHours) * 100}%`, backgroundColor: p.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sub-component: AttendanceCard (Me view — team avatars) ────────────────────

function AttendanceCard({ data }: { data: AttendanceData }) {
  const pillData = [
    { label: 'On Time', count: data.onTime,  members: data.onTimeMembers,  bg: 'bg-green-light',  text: 'text-green',  icon: CheckCircle2 },
    { label: 'Late',    count: data.late,    members: data.lateMembers,    bg: 'bg-yellow-light', text: 'text-yellow', icon: AlertCircle  },
    { label: 'Absent',  count: data.absent,  members: data.absentMembers,  bg: 'bg-red-light',    text: 'text-red',    icon: XCircle      },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Attendance
          <span className="text-muted font-medium text-xs ml-1.5">· Today</span>
        </h2>
        <span className="text-[11px] text-muted">{data.total} members</span>
      </div>

      <div className="flex flex-col gap-3">
        {pillData.map(({ label, count, members, bg, text, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3">
            <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 w-24', bg)}>
              <Icon size={12} className={text} />
              <span className={cn('text-xs font-bold', text)}>{count}</span>
              <span className={cn('text-[10px] font-medium', text)}>{label}</span>
            </div>
            <div className="flex items-center">
              {members.map((m, i) => (
                <div key={m.initials}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: m.color, marginLeft: i > 0 ? -6 : 0, zIndex: members.length - i }}
                  title={m.name}>
                  {m.initials.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sub-component: OrgAttendanceCard (All view — bars + numbers) ──────────────

function OrgAttendanceCard({ data }: { data: OrgAttendance }) {
  const rows = [
    { label: 'On Time', count: data.onTime,  color: '#10B981', icon: CheckCircle2, textCls: 'text-green'  },
    { label: 'Late',    count: data.late,    color: '#F59E0B', icon: AlertCircle,  textCls: 'text-yellow' },
    { label: 'Absent',  count: data.absent,  color: '#EF4444', icon: XCircle,      textCls: 'text-red'    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Attendance
          <span className="text-muted font-medium text-xs ml-1.5">· Today</span>
        </h2>
        <span className="text-[11px] text-muted">{data.total.toLocaleString()} employees</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {rows.map(({ label, count, color, icon: Icon, textCls }) => {
          const pct = (count / data.total) * 100
          return (
            <div key={label} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={textCls} />
                  <span className="text-[11px] font-medium text-muted">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tabular-nums text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted tabular-nums w-9 text-right">{pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-sky overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-component: TeamReportTable (Me view — individual rows) ────────────────

function TeamReportTable({ rows, points }: { rows: TeamMemberRow[]; points: DailyBarPoint[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-royal" />
          <div>
            <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>Daily Report</h2>
            <p className="text-[10px] text-muted">{DASHBOARD.dateRange.label} · America/New_York</p>
          </div>
        </div>
        <span className="text-xs text-muted">{rows.length} member{rows.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-sky/40">
              <th className="py-2.5 px-5 text-[11px] font-bold text-muted uppercase tracking-wider w-44">Member</th>
              {points.map(p => (
                <th key={p.date} className="py-2.5 px-3 text-[11px] font-bold text-muted uppercase tracking-wider text-center">
                  <div className="flex flex-col items-center leading-none gap-0.5">
                    <span className="text-blackish/70">{p.label.split(' ')[1]}</span>
                    <span className="text-[9px] font-medium">{p.dayLabel.toUpperCase()}</span>
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-5 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.member.initials} className={cn('border-b border-border/50 hover:bg-sky/30 transition-colors', ri % 2 !== 0 && 'bg-sky/20')}>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ backgroundColor: row.member.color }}>
                      {row.member.initials}
                    </div>
                    <span className="text-xs font-semibold text-blackish truncate max-w-[90px]">{row.member.name}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {row.hasTracked && <span className="w-1.5 h-1.5 rounded-full bg-royal" title="Auto-tracked" />}
                      {row.hasManual  && <span className="w-1.5 h-1.5 rounded-full bg-yellow" title="Manual entry" />}
                    </div>
                  </div>
                </td>
                {row.dailyHours.map((h, di) => (
                  <td key={di} className="py-3 px-3 text-center">
                    <span className={cn('text-xs tabular-nums', h === 0 ? 'text-muted/30' : 'text-blackish/80 font-medium')}>
                      {h === 0 ? '—' : `${h}h`}
                    </span>
                  </td>
                ))}
                <td className="py-3 px-5 text-right">
                  <span className={cn('text-xs tabular-nums font-semibold', row.totalHours === 0 ? 'text-muted/30' : 'text-blackish')}>
                    {row.totalHours === 0 ? '0h' : `${row.totalHours}h`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Sub-component: DepartmentTable (All view — org-scale dept summary) ────────

function DepartmentTable({ rows }: { rows: DepartmentRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-royal" />
          <div>
            <h2 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>Department Overview</h2>
            <p className="text-[10px] text-muted">{DASHBOARD.dateRange.label} · America/New_York</p>
          </div>
        </div>
        <span className="text-xs text-muted">{rows.length} departments</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-border bg-sky/40">
              <th className="py-2.5 px-5 text-[11px] font-bold text-muted uppercase tracking-wider">Department</th>
              <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-center">Headcount</th>
              <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider">Online Now</th>
              <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Hours Today</th>
              <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider">Avg Activity</th>
              <th className="py-2.5 px-5 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Billable %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const onlinePct   = Math.round((row.online / row.headcount) * 100)
              const actColor    = activityColor(row.avgActivity)
              return (
                <tr key={row.name} className={cn('border-b border-border/50 hover:bg-sky/30 transition-colors', ri % 2 !== 0 && 'bg-sky/20')}>
                  {/* Department */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-xs font-semibold text-blackish">{row.name}</span>
                    </div>
                  </td>

                  {/* Headcount */}
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-medium text-blackish/80 tabular-nums">{row.headcount.toLocaleString()}</span>
                  </td>

                  {/* Online Now */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-sky overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${onlinePct}%`, backgroundColor: row.color }} />
                      </div>
                      <span className="text-xs tabular-nums text-blackish/80">
                        <span className="font-semibold">{row.online}</span>
                        <span className="text-muted">/{row.headcount}</span>
                      </span>
                    </div>
                  </td>

                  {/* Hours Today */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-xs font-semibold text-blackish tabular-nums">
                      {row.hoursToday.toLocaleString()}h
                    </span>
                  </td>

                  {/* Avg Activity */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-sky overflow-hidden shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${row.avgActivity}%`, backgroundColor: actColor }} />
                      </div>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: actColor }}>
                        {row.avgActivity}%
                      </span>
                    </div>
                  </td>

                  {/* Billable % */}
                  <td className="py-3 px-5 text-right">
                    <span className={cn(
                      'text-xs font-semibold tabular-nums',
                      row.billablePct >= 80 ? 'text-green' : row.billablePct >= 60 ? 'text-blackish' : 'text-muted',
                    )}>
                      {row.billablePct}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main HomePage ─────────────────────────────────────────────────────────────

export function HomePage() {
  const [view, setView]               = useState<'me' | 'all'>('me')
  const [weekOffset, setWeekOffset]   = useState(0)
  const [activeQuick, setActiveQuick] = useState<'week' | 'month'>('week')

  const dateRangeLabel = weekOffset === 0 ? DASHBOARD.dateRange.label : getDateRangeLabel(weekOffset)

  const cards    = view === 'me' ? DASHBOARD.meStats             : DASHBOARD.allStats
  const activity = view === 'me' ? DASHBOARD.meActivityBreakdown : DASHBOARD.allActivityBreakdown
  const projects = view === 'me' ? DASHBOARD.myTopProjects       : DASHBOARD.topProjects

  // Chart config differs between Me (personal hours 0–12h) and All (org-scale 0–8,000h)
  const chartPoints  = view === 'me' ? DASHBOARD.chartPoints : DASHBOARD.allChartPoints
  const chartMaxY    = view === 'me' ? 12   : 8000
  const chartTicks   = view === 'me' ? [0, 3, 6, 9, 12] : [0, 2000, 4000, 6000, 8000]
  const chartFmtY    = view === 'me'
    ? (v: number) => `${v}h`
    : (v: number) => v === 0 ? '0' : `${v / 1000}K`
  const chartFmtTip  = view === 'me'
    ? (h: number) => `${h}h`
    : (h: number) => `${(h / 1000).toFixed(1)}K h`

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <header className="h-14 bg-white border-b border-border flex items-center px-6 gap-3 shrink-0">
        <h1 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>Home</h1>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer"
            aria-label="Previous week">
            <ChevronLeft size={13} />
          </button>

          <div className="flex items-center gap-1.5 px-3 h-7 rounded-lg border border-border text-xs text-blackish/80 font-medium whitespace-nowrap">
            <Calendar size={12} className="text-muted shrink-0" />
            {dateRangeLabel}
          </div>

          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer"
            aria-label="Next week">
            <ChevronRight size={13} />
          </button>

          <button
            onClick={() => { setWeekOffset(0); setActiveQuick('week') }}
            className={cn('h-7 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
              activeQuick === 'week' && weekOffset === 0 ? 'bg-royal text-white' : 'border border-border text-muted hover:bg-sky hover:text-blackish')}>
            Past Week
          </button>

          <button
            onClick={() => setActiveQuick('month')}
            className={cn('h-7 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
              activeQuick === 'month' ? 'bg-royal text-white' : 'border border-border text-muted hover:bg-sky hover:text-blackish')}>
            Past Month
          </button>

          <div className="w-px h-5 bg-border mx-1 shrink-0" />

          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky transition-colors cursor-pointer relative"
            aria-label="Notifications">
            <Bell size={15} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red" />
          </button>

          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-royal flex items-center justify-center text-white text-[10px] font-bold shrink-0">YR</div>
            <span className="text-sm font-medium text-blackish hidden lg:block">Hi, Yoshita</span>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto bg-sky">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex flex-col gap-5">

          {/* Me / All toggle */}
          <div className="flex items-center gap-3">
            <div className="inline-flex bg-white border border-border rounded-xl p-0.5">
              {(['me', 'all'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={cn('h-7 px-5 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize',
                    view === v ? 'bg-royal text-white shadow-sm' : 'text-muted hover:text-blackish')}>
                  {v === 'me' ? 'Me' : 'All'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">
              {view === 'me' ? 'Showing your personal activity' : `Showing organization-wide activity · ${DASHBOARD.workforceStatus.total.toLocaleString()} employees`}
            </span>
          </div>

          {/* Stats row */}
          <StatsCards cards={cards} />

          {/* Main row: Chart + Who's Working / Workforce Status */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
            <HoursBarChart
              points={chartPoints}
              maxY={chartMaxY}
              yTicks={chartTicks}
              formatY={chartFmtY}
              formatTooltip={chartFmtTip}
            />
            {view === 'me'
              ? <WhoIsWorking members={DASHBOARD.teamLive} />
              : <WorkforceOverview status={DASHBOARD.workforceStatus} departments={DASHBOARD.departmentRows} />
            }
          </div>

          {/* Secondary row: Activity + Top Projects + Attendance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ActivityBreakdown segments={activity} />
            <TopProjects projects={projects} />
            {view === 'me'
              ? <AttendanceCard data={DASHBOARD.attendance} />
              : <OrgAttendanceCard data={DASHBOARD.orgAttendance} />
            }
          </div>

          {/* Report table */}
          {view === 'me'
            ? <TeamReportTable rows={DASHBOARD.meRows} points={DASHBOARD.chartPoints} />
            : <DepartmentTable rows={DASHBOARD.departmentRows} />
          }

        </div>
      </div>
    </div>
  )
}
