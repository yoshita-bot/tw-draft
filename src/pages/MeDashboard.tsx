import { useState, useRef } from 'react'
import { GripVertical, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ManageWidgetsDrawer } from '../components/ManageWidgetsDrawer'
import { ME } from '../data/meMockData'

// ─── widget definitions ──────────────────────────────────────────────────────

export const ME_SMALL_WIDGETS = [
  { id: 'me-sw-hours',    label: 'Hours Worked'    },
  { id: 'me-sw-activity', label: 'Activity Rate'   },
  { id: 'me-sw-earnings', label: 'Earnings'        },
  { id: 'me-sw-projects', label: 'Projects Worked' },
]

export const ME_LARGE_WIDGETS = [
  { id: 'me-lw-timesheet', label: 'My Timesheet'        },
  { id: 'me-lw-work',      label: 'My Work'             },
  { id: 'me-lw-timeoff',   label: 'Upcoming Time Off'   },
  { id: 'me-lw-activity',  label: 'Recent Activity'     },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtH(h: number) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}
function fmtDur(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}
function fmtClock(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm', h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
function actColor(r: number) {
  return r >= 75 ? '#10B981' : r >= 50 ? '#F59E0B' : '#EF4444'
}
function statusPill(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    'in-progress': { bg: '#EFF6FF', color: '#3B82F6', label: 'In progress' },
    'done':        { bg: '#ECFDF5', color: '#10B981', label: 'Done'        },
    'to-do':       { bg: '#F9FAFB', color: '#6B7280', label: 'To do'       },
    'blocked':     { bg: '#FEF2F2', color: '#EF4444', label: 'Blocked'     },
  }
  return map[status] ?? map['to-do']
}
function statusDot(status: string) {
  const map: Record<string, string> = {
    'in-progress': '#3B82F6', 'done': '#10B981', 'to-do': '#D1D5DB', 'blocked': '#EF4444',
  }
  return map[status] ?? '#D1D5DB'
}

// ─── small widgets ────────────────────────────────────────────────────────────

const SW_CARD: import('react').CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: '12px 14px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
  minWidth: 0,
}

function HoursWorkedSmall() {
  const { todayStats, thisWeek } = ME
  return (
    <div style={SW_CARD}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Hours Worked</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{fmtH(todayStats.hoursWorked)}</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: '#E5E7EB' }} />
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>This week</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{thisWeek.hoursWorked}<span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}> hrs</span></div>
        </div>
      </div>
    </div>
  )
}

function ActivityRateSmall() {
  const today = ME.todayStats.activityRate
  const week  = ME.thisWeek.activityRate
  return (
    <div style={SW_CARD}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Activity Rate</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, flex: 1 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: actColor(today), letterSpacing: '-0.5px', lineHeight: 1.1 }}>{today}%</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: '#E5E7EB' }} />
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Weekly avg</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: actColor(week), letterSpacing: '-0.5px', lineHeight: 1.1 }}>{week}%</div>
        </div>
      </div>
    </div>
  )
}

function EarningsSmall() {
  const { todayStats, thisWeek } = ME
  return (
    <div style={SW_CARD}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Earnings</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>${todayStats.earnings.toFixed(2)}</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: '#E5E7EB' }} />
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3 }}>This week</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1.1 }}>${thisWeek.earnings.toFixed(2)}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Clocked out {ME.clockOutTime}</div>
    </div>
  )
}

function WeeklyLimitSmall() {
  const { hoursWorked, cap } = ME.thisWeek
  const pct = Math.min(100, Math.round((hoursWorked / cap) * 100))
  const remaining = Math.max(0, cap - hoursWorked)
  const isNear = pct >= 90
  const barColor = isNear ? '#EF4444' : '#6C63FF'
  return (
    <div style={SW_CARD}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Weekly Limit</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: isNear ? '#EF4444' : '#111827', lineHeight: 1.1 }}>{hoursWorked} <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>/ {cap} hrs</span></span>
        <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 11, color: isNear ? '#EF4444' : '#9CA3AF' }}>
        {remaining > 0 ? `${fmtH(remaining)} remaining` : 'Limit reached'}
      </div>
    </div>
  )
}

function ProjectsWorkedSmall() {
  const projects = ME.projects
  return (
    <div style={SW_CARD}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: '#9CA3AF', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Projects Worked</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
        {projects.map(p => (
          <div key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', flexShrink: 0, marginLeft: 6 }}>{fmtH(p.hoursThisWeek)}</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p.progress}%`, background: p.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SmallWidgetById({ id }: { id: string }) {
  switch (id) {
    case 'me-sw-hours':    return <HoursWorkedSmall />
    case 'me-sw-activity': return <ActivityRateSmall />
    case 'me-sw-earnings': return <EarningsSmall />
    case 'me-sw-projects': return <ProjectsWorkedSmall />
    default: return null
  }
}

// ─── My Timesheet ─────────────────────────────────────────────────────────────

function MyTimesheetWidget() {
  const [selectedDayIdx, setSelectedDayIdx] = useState(4) // Friday = index 4
  const [weekOffset, setWeekOffset] = useState(0)
  const week = ME.weeklyHours
  const maxHours = Math.max(...week.map(d => d.hours), 1)
  const totalHours = week.reduce((s, d) => s + d.hours, 0)
  const totalEarnings = week.reduce((s, d) => s + d.earnings, 0)
  const avgPerDay = totalHours / 5

  const selectedDay = week[selectedDayIdx]
  const entries = ME.timesheetEntries[selectedDay?.date] ?? []

  const weekLabel = weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${Math.abs(weekOffset)}w ago`

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ border: 'none', background: '#F3F4F6', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {weekOffset === 0 ? 'This week' : weekLabel} · {week[0].date.slice(0,7).replace('-', '/')}
        </span>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} style={{ border: 'none', background: weekOffset === 0 ? '#F9FAFB' : '#F3F4F6', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', color: weekOffset === 0 ? '#D1D5DB' : '#6B7280' }}>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* 7-day bar chart */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {week.map((d, i) => {
          const barH = d.hours > 0 ? Math.max(8, (d.hours / maxHours) * 52) : 4
          const isSelected = i === selectedDayIdx
          const isToday = i === 4
          return (
            <button
              key={d.day}
              onClick={() => setSelectedDayIdx(i)}
              style={{ flex: 1, textAlign: 'center', border: 'none', background: 'none', cursor: 'pointer', padding: '0 1px' }}
            >
              <div style={{ height: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 4 }}>
                <div style={{
                  width: '100%', maxWidth: 24,
                  height: `${barH}px`,
                  background: isSelected ? '#6C63FF' : isToday ? '#A5B4FC' : d.hours > 0 ? '#C7D2FE' : '#E5E7EB',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.2s',
                }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: isSelected ? 700 : 400, color: isSelected ? '#6C63FF' : '#9CA3AF' }}>{d.day}</div>
              <div style={{ fontSize: 9.5, color: isSelected ? '#6C63FF' : '#C4B5FD' }}>
                {d.hours > 0 ? fmtH(d.hours) : '–'}
              </div>
            </button>
          )
        })}
      </div>

      {/* Summary pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { label: 'Total hours',      value: fmtH(totalHours)           },
          { label: 'Week earned',      value: `$${totalEarnings.toFixed(2)}` },
          { label: 'Avg / day',        value: fmtH(avgPerDay)            },
        ].map(p => (
          <div key={p.label} style={{ flex: 1, background: '#F5F3FF', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{p.value}</div>
            <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 1 }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Day detail */}
      <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8 }}>
          {selectedDay?.day} {fmtDate(selectedDay?.date)} · {entries.length} entries
        </div>
        {entries.length === 0 ? (
          <div style={{ fontSize: 12, color: '#D1D5DB', textAlign: 'center', padding: '12px 0' }}>No entries recorded</div>
        ) : entries.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < entries.length - 1 ? '1px solid #F9F9F9' : 'none' }}>
            <div style={{ width: 3, height: 24, borderRadius: 99, background: e.idle ? '#FDE68A' : '#6C63FF', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.project}</div>
              <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{fmtClock(e.start)} – {fmtClock(e.end)}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{fmtDur(e.duration)}</div>
              {!e.idle && <div style={{ fontSize: 10, color: actColor(e.activity) }}>{e.activity}%</div>}
              {e.billable && !e.idle && (
                <div style={{ fontSize: 9.5, color: '#10B981' }}>${((e.duration / 60) * ME.hourlyRate).toFixed(2)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── My Work ──────────────────────────────────────────────────────────────────

function MyWorkWidget() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {ME.projects.map(p => (
        <div key={p.id}>
          {/* Project header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{p.name}</span>
              <span style={{ fontSize: 11, background: '#F3F4F6', color: '#6B7280', padding: '1px 7px', borderRadius: 99, fontWeight: 500 }}>{p.client}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{fmtH(p.hoursThisWeek)} <span style={{ fontWeight: 400, color: '#9CA3AF' }}>this wk</span></span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${p.progress}%`, background: p.color, borderRadius: 99 }} />
          </div>

          {/* Tasks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {p.tasks.map((t, i) => {
              const pill = statusPill(t.status)
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < p.tasks.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusDot(t.status), flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: pill.color, background: pill.bg, padding: '2px 7px', borderRadius: 99, flexShrink: 0 }}>{pill.label}</span>
                  <span style={{ fontSize: 10.5, color: '#9CA3AF', flexShrink: 0 }}>{fmtDate(t.due)}</span>
                </div>
              )
            })}
          </div>

          {/* Add task */}
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11.5, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 500 }}>
            <Plus size={12} /> Add task
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Upcoming Time Off ────────────────────────────────────────────────────────

function TimeOffWidget() {
  return (
    <div>
      {/* My leave requests */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>My Leave</div>
        {ME.myLeave.length === 0 ? (
          <div style={{ fontSize: 12, color: '#D1D5DB' }}>No upcoming leave</div>
        ) : ME.myLeave.map(l => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{l.type}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{fmtDate(l.start)} – {fmtDate(l.end)} · {l.days}d</div>
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
              background: l.status === 'approved' ? '#ECFDF5' : '#FEF3C7',
              color:      l.status === 'approved' ? '#10B981'  : '#D97706',
            }}>
              {l.status === 'approved' ? 'Approved' : 'Pending'}
            </span>
          </div>
        ))}
      </div>

      {/* Public holidays */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Public Holidays</div>
        {ME.publicHolidays.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < ME.publicHolidays.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 24, borderRadius: 99, background: '#6C63FF', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{h.name}</span>
            </div>
            <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{fmtDate(h.date)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivityWidget() {
  const shots = ME.screenshots
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>{shots.length} screenshots today · Yoshita Jeswal</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {shots.map(s => {
          const color = actColor(s.activity)
          return (
            <div key={s.id} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Thumbnail placeholder */}
              <div style={{ height: 58, background: `linear-gradient(135deg, ${s.hue}22, ${s.hue}11)`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Simulated screen content */}
                <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ height: 5, background: `${s.hue}55`, borderRadius: 2, width: '100%' }} />
                  <div style={{ height: 4, background: `${s.hue}33`, borderRadius: 2, width: '75%' }} />
                  <div style={{ height: 4, background: `${s.hue}22`, borderRadius: 2, width: '90%' }} />
                  <div style={{ height: 4, background: `${s.hue}33`, borderRadius: 2, width: '60%' }} />
                </div>
                {/* Activity badge */}
                <div style={{
                  position: 'absolute', top: 5, right: 5,
                  background: color, color: '#fff',
                  fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 99,
                }}>
                  {s.activity}%
                </div>
              </div>
              {/* Caption */}
              <div style={{ padding: '5px 7px', background: '#fff' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.project}</div>
                <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>{fmtClock(s.time)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── large widget dispatcher ──────────────────────────────────────────────────

function WidgetContent({ id }: { id: string }) {
  switch (id) {
    case 'me-lw-timesheet': return <MyTimesheetWidget />
    case 'me-lw-work':      return <MyWorkWidget />
    case 'me-lw-timeoff':   return <TimeOffWidget />
    case 'me-lw-activity':  return <RecentActivityWidget />
    default: return null
  }
}

// ─── main export ─────────────────────────────────────────────────────────────

export function MeDashboard() {
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [smallVisible, setSmallVisible] = useState(new Set(ME_SMALL_WIDGETS.map(w => w.id)))
  const [largeVisible, setLargeVisible] = useState(new Set(ME_LARGE_WIDGETS.map(w => w.id)))
  const [largeOrder, setLargeOrder]     = useState(ME_LARGE_WIDGETS.map(w => w.id))

  const draggingId = useRef<string | null>(null)
  const [dragOver, setDragOver]   = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)

  function handleToggle(id: string, zone: 'small' | 'large', show: boolean) {
    if (zone === 'small') {
      setSmallVisible(prev => { const n = new Set(prev); show ? n.add(id) : n.delete(id); return n })
    } else {
      setLargeVisible(prev => { const n = new Set(prev); show ? n.add(id) : n.delete(id); return n })
    }
  }

  function onDragStart(id: string) { draggingId.current = id; setIsDragging(id) }
  function onDragEnd()  { draggingId.current = null; setIsDragging(null); setDragOver(null) }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggingId.current && draggingId.current !== id) setDragOver(id)
  }
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const fromId = draggingId.current
    if (!fromId || fromId === targetId) { onDragEnd(); return }
    setLargeOrder(prev => {
      const next = [...prev]
      const fromIdx = next.indexOf(fromId), toIdx = next.indexOf(targetId)
      next.splice(fromIdx, 1); next.splice(toIdx, 0, fromId)
      return next
    })
    onDragEnd()
  }

  const visibleLarge = largeOrder.filter(id => largeVisible.has(id))
  const widgetLabel  = (id: string) => ME_LARGE_WIDGETS.find(w => w.id === id)?.label ?? id

  return (
    <>
      <div className="section-header">
        <span className="section-title">Overview</span>
        <button className="manage-btn" onClick={() => setDrawerOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Manage widgets
        </button>
      </div>

      {/* Small widget bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {ME_SMALL_WIDGETS.filter(w => smallVisible.has(w.id)).map(w => (
          <SmallWidgetById key={w.id} id={w.id} />
        ))}
      </div>

      {/* Large widgets */}
      <div style={{ marginTop: 24 }}>
        <div className="section-title" style={{ marginBottom: 14 }}>My Workspace</div>
        <div className="large-widgets-zone" onDragOver={e => e.preventDefault()}>
          {visibleLarge.map(id => (
            <div
              key={id}
              draggable
              onDragStart={() => onDragStart(id)}
              onDragEnd={onDragEnd}
              onDragOver={e => onDragOver(e, id)}
              onDrop={e => onDrop(e, id)}
              style={{
                opacity: isDragging === id ? 0.4 : 1,
                outline: dragOver === id ? '2px solid #6C63FF' : 'none',
                outlineOffset: 2,
                borderRadius: 10,
                transition: 'opacity 0.15s',
              }}
            >
              <div className="large-widget">
                <div className="widget-header">
                  <span className="widget-title">{widgetLabel(id)}</span>
                  <div style={{ cursor: 'grab', color: '#D1D5DB', display: 'flex', alignItems: 'center' }} title="Drag to reorder">
                    <GripVertical width={14} height={14} />
                  </div>
                </div>
                <WidgetContent id={id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ManageWidgetsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        smallWidgets={ME_SMALL_WIDGETS}
        largeWidgets={ME_LARGE_WIDGETS}
        smallVisible={smallVisible}
        largeVisible={largeVisible}
        onToggle={handleToggle}
      />
    </>
  )
}
