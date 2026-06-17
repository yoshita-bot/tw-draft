import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { SCHEDULE_EMPLOYEES, SCHEDULE_UNASSIGNED } from '../data/dashboardData'
import { EMPLOYEES } from '../data/employeesData'
import { ROUTES } from '../lib/routes'

// ── Shared timeline constants ─────────────────────────────────────────────────

const DAY_START = 7, DAY_END = 24, TOTAL_HRS = DAY_END - DAY_START
const NOW_H = 15.5  // 3:30pm UTC — mid-shift for NY workers (14–22 UTC), post-shift for Manila (1–9 UTC)
const nowPct = (NOW_H - DAY_START) / TOTAL_HRS * 100

const BAR_COLOR: Record<string, string>  = { active: '#639922', upcoming: '#378ADD', late: '#E24B4A', done: '#D1D5DB', flex: '#A78BFA' }
const TEXT_COLOR: Record<string, string> = { active: '#ffffff', upcoming: '#ffffff', late: '#ffffff', done: '#6B7280', flex: '#ffffff' }

function fmtH(h: number) {
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}${h >= 12 && h < 24 ? 'pm' : 'am'}`
}

const HOURS = [8, 10, 12, 14, 16, 18, 20, 22]

// ── Filtered view ─────────────────────────────────────────────────────────────

// Build employee rows from real EMPLOYEES data
type FVRow = { id: string; name: string; firstName: string; initials: string; bg: string; fg: string; startH: number; endH: number; status: string }

// Mock status overrides: employees who should have started but haven't checked in (late),
// or whose shift starts in the next hour (upcoming).
const STATUS_OVERRIDES: Record<string, string> = {
  'e002': 'late',     // James Rivera — shift started, no check-in
  'e013': 'late',     // Marcus Webb — shift started, no check-in
  'e023': 'upcoming', // James Okafor — starts in 30 min
  'e011': 'upcoming', // Tomás García — starts in 45 min
}

function buildRows(): FVRow[] {
  return EMPLOYEES
    .filter(e => e.timeTrackingEnabled && e.status === 'active')
    .map(e => {
      let startH = e.shiftStartUTC ?? 9
      let endH   = e.shiftEndUTC   ?? 17
      // Clamp to display window (no timezone conversion — using UTC hours directly for demo)
      startH = Math.max(DAY_START, Math.min(startH, DAY_END - 1))
      endH   = Math.max(startH + 1, Math.min(endH, DAY_END))
      const derivedStatus = e.scheduleType === 'free' || e.scheduleType === 'free-overlap'
        ? 'flex'
        : NOW_H >= startH && NOW_H < endH ? 'active'
        : NOW_H >= endH ? 'done'
        : 'upcoming'
      const status = STATUS_OVERRIDES[e.id] ?? derivedStatus
      return { id: e.id, name: e.name, firstName: e.name.split(' ')[0], initials: e.initials, bg: e.bg, fg: e.fg, startH, endH, status }
    })
}

const ALL_ROWS = buildRows()


const ATTENTION_MAX = 5

function FilteredView() {
  const filtered = ALL_ROWS

  const nTotal    = filtered.length
  const nActive   = filtered.filter(e => e.status === 'active').length
  const nSoon     = filtered.filter(e => e.status === 'upcoming').length
  const nLate     = filtered.filter(e => e.status === 'late').length
  const nOffShift = filtered.filter(e => e.status === 'done' || e.status === 'flex').length

  // Stacked bar segments (% of total)
  const pct = (n: number) => nTotal > 0 ? (n / nTotal) * 100 : 0

  // Attention required: late first, then starting soon
  const attentionPool = [
    ...filtered.filter(e => e.status === 'late'),
    ...filtered.filter(e => e.status === 'upcoming'),
  ]
  const attentionShown = attentionPool.slice(0, ATTENTION_MAX)
  const attentionExtra = attentionPool.length - attentionShown.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Status cards */}
      <div className="sch-stats">
        <div className="sch-stat">
          <div className="sch-stat-label">Active now</div>
          <div className="sch-stat-val" style={{ color: '#639922' }}>{nActive}</div>
        </div>
        <div className="sch-stat">
          <div className="sch-stat-label">Starting soon</div>
          <div className="sch-stat-val" style={{ color: '#378ADD' }}>{nSoon}</div>
        </div>
        <div className="sch-stat">
          <div className="sch-stat-label">Running late</div>
          <div className="sch-stat-val" style={{ color: '#E24B4A' }}>{nLate}</div>
        </div>
      </div>

      {/* Workforce summary bar */}
      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Workforce Breakdown</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{nTotal} scheduled</span>
        </div>

        {/* Stacked progress bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', background: '#E5E7EB', marginBottom: 10 }}>
          {nActive   > 0 && <div style={{ width: `${pct(nActive)}%`,   background: '#639922', transition: 'width 0.3s' }} />}
          {nSoon     > 0 && <div style={{ width: `${pct(nSoon)}%`,     background: '#378ADD', transition: 'width 0.3s' }} />}
          {nLate     > 0 && <div style={{ width: `${pct(nLate)}%`,     background: '#E24B4A', transition: 'width 0.3s' }} />}
          {nOffShift > 0 && <div style={{ width: `${pct(nOffShift)}%`, background: '#D1D5DB', transition: 'width 0.3s' }} />}
        </div>

        {/* Legend row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Active',         n: nActive,   color: '#639922' },
            { label: 'Starting soon',  n: nSoon,     color: '#378ADD' },
            { label: 'Running late',   n: nLate,     color: '#E24B4A' },
            { label: 'Off-shift',      n: nOffShift, color: '#9CA3AF' },
          ].map(({ label, n, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: '#6B7280' }}>{label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151' }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attention Required */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: attentionPool.length > 0 ? '#E24B4A' : '#D1D5DB' }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Attention Required
          </span>
          {attentionPool.length > 0 && (
            <span style={{ marginLeft: 4, fontSize: 11, fontWeight: 700, background: '#FEE2E2', color: '#DC2626', borderRadius: 99, padding: '1px 7px' }}>
              {attentionPool.length}
            </span>
          )}
        </div>

        {attentionPool.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 12.5, color: '#16A34A', fontWeight: 600 }}>All scheduled employees are on track</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attentionShown.map(e => {
              const isLate = e.status === 'late'
              return (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 9,
                  background: isLate ? '#FFF5F5' : '#EFF6FF',
                  border: `1px solid ${isLate ? '#FECACA' : '#BFDBFE'}`,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: e.bg, color: e.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {e.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: isLate ? '#DC2626' : '#2563EB', marginTop: 1 }}>
                      {isLate ? `Should have started at ${fmtH(e.startH)}` : `Starting at ${fmtH(e.startH)}`}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, flexShrink: 0,
                    background: isLate ? '#FEE2E2' : '#DBEAFE',
                    color: isLate ? '#DC2626' : '#2563EB',
                  }}>
                    {isLate ? 'Late' : 'Soon'}
                  </span>
                </div>
              )
            })}

            {attentionExtra > 0 && (
              <div style={{ textAlign: 'center', fontSize: 12, color: '#6C63FF', fontWeight: 600, padding: '4px 0', cursor: 'pointer' }}>
                +{attentionExtra} more — View all schedules →
              </div>
            )}
          </div>
        )}
      </div>

      {/* View all schedules CTA */}
      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, textAlign: 'center' }}>
        <Link to={ROUTES.schedule} style={{ fontSize: 12.5, color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}>
          View all schedules →
        </Link>
      </div>

    </div>
  )
}

// ── View selector dropdown ────────────────────────────────────────────────────

type WidgetView = 'default' | 'filtered'

function ViewSelector({ value, onChange }: { value: WidgetView; onChange: (v: WidgetView) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const labels: Record<WidgetView, string> = { default: 'Overview', filtered: 'Filtered view' }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 7,
          border: '1px solid #E5E7EB', background: '#fff',
          fontSize: 12, fontWeight: 600, color: '#374151',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#C4B5FD')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
      >
        {labels[value]}
        <ChevronDown width={11} height={11} color="#9CA3AF" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 200, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 9, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', minWidth: 150, overflow: 'hidden' }}>
          {(['default', 'filtered'] as WidgetView[]).map(v => (
            <div
              key={v}
              onClick={() => { onChange(v); setOpen(false) }}
              style={{
                padding: '9px 14px', fontSize: 13,
                fontWeight: value === v ? 700 : 500,
                color: value === v ? '#6C63FF' : '#374151',
                background: value === v ? '#F5F3FF' : 'transparent',
                cursor: 'pointer',
                borderLeft: value === v ? '3px solid #6C63FF' : '3px solid transparent',
              }}
              onMouseEnter={e => { if (value !== v) e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={e => { if (value !== v) e.currentTarget.style.background = 'transparent' }}
            >
              {labels[v]}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main widget ───────────────────────────────────────────────────────────────

export function DSSchedulesWidget({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  const [view, setView] = useState<WidgetView>('default')

  const nActive   = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'active').length
  const nUpcoming = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'upcoming').length
  const nLate     = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'late').length

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Schedules</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={ROUTES.schedule} className="widget-link">View all schedules →</Link>
          <ViewSelector value={view} onChange={setView} />
          {gripNode}
        </div>
      </div>

      {view === 'default' && <>
        {/* Alert */}
        <div className="sch-alert">
          <div className="sch-alert-body">
            <div className="sch-alert-title">⚠ {SCHEDULE_UNASSIGNED.length} employees have no schedule assigned</div>
            <div className="sch-chips">
              {SCHEDULE_UNASSIGNED.map((u) => (
                <div className="sch-chip" key={u.name}>
                  <div className="sch-chip-av" style={{ background: u.bg, color: u.fg }}>{u.initials}</div>
                  <span className="sch-chip-name">{u.name}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="sch-alert-cta">Set up schedules</button>
        </div>

        {/* Stats */}
        <div className="sch-stats">
          <div className="sch-stat"><div className="sch-stat-label">Active now</div><div className="sch-stat-val" style={{ color: 'var(--success)' }}>{nActive}</div></div>
          <div className="sch-stat"><div className="sch-stat-label">Starting soon</div><div className="sch-stat-val" style={{ color: '#378ADD' }}>{nUpcoming}</div></div>
          <div className="sch-stat"><div className="sch-stat-label">Running late</div><div className="sch-stat-val" style={{ color: 'var(--danger)' }}>{nLate}</div></div>
        </div>

        <p className="sch-section">Today's shift timeline</p>

        <div className="tl-wrap">
          <div className="tl-header">
            {HOURS.map((h) => {
              const pct = (h - DAY_START) / TOTAL_HRS * 100
              return (
                <div key={h} className={`tl-hour-lbl${h === 14 ? ' now' : ''}`} style={{ left: `${pct}%` }}>
                  {fmtH(h)}
                </div>
              )
            })}
          </div>
          <div>
            {SCHEDULE_EMPLOYEES.slice(0, 5).map((e) => {
              const leftPct  = Math.max((e.startH - DAY_START) / TOTAL_HRS * 100, 0)
              const widthPct = Math.min((e.endH - e.startH) / TOTAL_HRS * 100, 100 - leftPct)
              return (
                <div className="tl-row" key={e.name}>
                  <div className="tl-person">
                    <div className="tl-av" style={{ background: e.bg, color: e.fg }}>{e.initials}</div>
                    <span className="tl-pname">{e.name.split(' ')[0]}</span>
                  </div>
                  <div className="tl-track">
                    <div className="tl-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: BAR_COLOR[e.status] }}>
                      <span className="tl-bar-lbl" style={{ color: TEXT_COLOR[e.status] }}>{fmtH(e.startH)} – {fmtH(e.endH)}</span>
                    </div>
                    <div className="tl-now-line" style={{ left: `${nowPct}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="sch-legend">
          <div className="sch-leg"><div className="sch-leg-dot" style={{ background: '#639922' }}></div>Active</div>
          <div className="sch-leg"><div className="sch-leg-dot" style={{ background: '#378ADD' }}></div>Starting soon</div>
          <div className="sch-leg"><div className="sch-leg-dot" style={{ background: '#E24B4A' }}></div>Running late</div>
          <div className="sch-leg"><div className="sch-leg-dot" style={{ background: '#D1D5DB' }}></div>Completed</div>
          <div className="sch-leg"><div style={{ width: 9, height: 9, borderLeft: '1.5px solid #E24B4A' }}></div>Now (2:30 PM)</div>
        </div>
      </>}

      {view === 'filtered' && (
        <FilteredView />
      )}
    </div>
  )
}
