import { useState, useRef } from 'react'
import { GripVertical, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ManageWidgetsDrawer } from '../components/ManageWidgetsDrawer'
import { SmallWidget } from '../components/widgets/SmallWidget'
import { ScreenshotImage } from './ActivityPage'
import { ME } from '../data/meMockData'
import { ROUTES } from '../lib/routes'

// ─── widget definitions ──────────────────────────────────────────────────────

export const ME_SMALL_WIDGETS = [
  { id: 'me-sw-hours-today',     label: 'Hours Worked (Today)'  },
  { id: 'me-sw-hours-week',      label: 'Hours Worked (Weekly)' },
  { id: 'me-sw-activity-today',  label: 'Activity Rate (Today)' },
  { id: 'me-sw-activity-week',   label: 'Activity Rate (Weekly)'},
  { id: 'me-sw-earnings-today',  label: 'Earnings (Today)'      },
  { id: 'me-sw-earnings-week',   label: 'Earnings (Weekly)'     },
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

const ME_SW_MAP = Object.fromEntries(ME.smallWidgets.map(w => [w.id, w]))

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
        <button onClick={() => setWeekOffset(w => w - 1)} className="me-week-nav-btn" style={{ border: 'none', background: '#F3F4F6', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          {weekOffset === 0 ? 'This week' : weekLabel} · {week[0].date.slice(0,7).replace('-', '/')}
        </span>
        <button onClick={() => setWeekOffset(w => Math.min(0, w + 1))} className="me-week-nav-btn" style={{ border: 'none', background: weekOffset === 0 ? '#F9FAFB' : '#F3F4F6', borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', color: weekOffset === 0 ? '#D1D5DB' : '#6B7280' }}>
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
          <div key={p.label} className="me-ts-pill" style={{ flex: 1, background: '#F5F3FF', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
            <div className="me-ts-pill-val" style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{p.value}</div>
            <div className="me-ts-pill-lbl" style={{ fontSize: 10, color: '#7C3AED', marginTop: 1 }}>{p.label}</div>
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
            <div className={e.idle ? '' : 'me-entry-bar-active'} style={{ width: 3, height: 24, borderRadius: 99, background: e.idle ? '#FDE68A' : '#6C63FF', flexShrink: 0 }} />
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
      <Link to={ROUTES.timesheets} style={{ display: 'block', marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6271FF', textDecoration: 'none', padding: '8px', borderRadius: 8, border: '1px solid rgba(98,113,255,.25)', background: 'rgba(98,113,255,.04)' }}>
        View full timesheet →
      </Link>
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
          <button className="me-add-task-btn" style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11.5, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontWeight: 500 }}>
            <Plus size={12} /> Add task
          </button>
        </div>
      ))}
      <Link to={ROUTES.todos} style={{ display: 'block', marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6271FF', textDecoration: 'none', padding: '8px', borderRadius: 8, border: '1px solid rgba(98,113,255,.25)', background: 'rgba(98,113,255,.04)' }}>
        View all tasks →
      </Link>
    </div>
  )
}

// ─── Upcoming Time Off ────────────────────────────────────────────────────────

function TimeOffWidget() {
  return (
    <div>
      {/* My leave requests */}
      <div style={{ marginBottom: 18 }}>
        <div className="me-sub-label" style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>My Leave</div>
        {ME.myLeave.length === 0 ? (
          <div style={{ fontSize: 12, color: '#D1D5DB' }}>No upcoming leave</div>
        ) : ME.myLeave.map(l => (
          <div key={l.id} className="me-leave-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #E5E7EB', marginBottom: 6 }}>
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
        <div className="me-sub-label" style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Public Holidays</div>
        {ME.publicHolidays.map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < ME.publicHolidays.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="me-holiday-bar" style={{ width: 3, height: 24, borderRadius: 99, background: '#6C63FF', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{h.name}</span>
            </div>
            <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{fmtDate(h.date)}</span>
          </div>
        ))}
      </div>
      <Link to={ROUTES.myTimeOff} style={{ display: 'block', marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6271FF', textDecoration: 'none', padding: '8px', borderRadius: 8, border: '1px solid rgba(98,113,255,.25)', background: 'rgba(98,113,255,.04)' }}>
        Manage time off →
      </Link>
    </div>
  )
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function MeScreenshotCard({ s }: { s: typeof ME.screenshots[0] }) {
  const [hovered, setHovered] = useState(false)
  const color = actColor(s.activity)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#C7C3FF' : '#E8E8E8'}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(108,99,255,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Project chip */}
      <div style={{ padding: '7px 10px 5px' }}>
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: s.hue,
          background: `${s.hue}18`, padding: '2px 8px', borderRadius: 99,
          display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis', maxWidth: '100%',
        }}>{s.project}</span>
      </div>

      {/* Screenshot */}
      <div style={{ position: 'relative' }}>
        <ScreenshotImage
          seed={s.seed}
          width={320} height={200}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(108,99,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'rgba(108,99,255,0.85)', color: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 11.5, fontWeight: 600 }}>
              View screenshot
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>{fmtClock(s.time)}</span>
        <span style={{
          fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99, color: '#fff',
          background: color,
        }}>{s.activity}%</span>
      </div>
    </div>
  )
}

function RecentActivityWidget() {
  const shots = ME.screenshots
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>{shots.length} screenshots today · Yoshita Jeswal</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {shots.slice(0, 6).map(s => <MeScreenshotCard key={s.id} s={s} />)}
      </div>
      <Link to={ROUTES.activityScreenshots} style={{ display: 'block', marginTop: 14, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6271FF', textDecoration: 'none', padding: '8px', borderRadius: 8, border: '1px solid rgba(98,113,255,.25)', background: 'rgba(98,113,255,.04)' }}>
        View all screenshots →
      </Link>
    </div>
  )
}

// ─── large widget dispatcher ──────────────────────────────────────────────────

export function WidgetContent({ id }: { id: string }) {
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
      <div className="small-widgets-zone">
        {ME_SMALL_WIDGETS.map(w => {
          const d = ME_SW_MAP[w.id]
          return d ? <SmallWidget key={w.id} {...d} visible={smallVisible.has(w.id)} /> : null
        })}
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
