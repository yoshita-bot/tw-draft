import { Link } from 'react-router-dom'
import { SCHEDULE_EMPLOYEES, SCHEDULE_UNASSIGNED } from '../../data/dashboardData'
import { ROUTES } from '../../lib/routes'

const DAY_START = 7, DAY_END = 24, TOTAL_HRS = DAY_END - DAY_START
const NOW_H = 14.5
const nowPct = (NOW_H - DAY_START) / TOTAL_HRS * 100

const BAR_COLOR: Record<string, string>  = { active: '#639922', upcoming: '#378ADD', late: '#E24B4A', done: '#D1D5DB' }
const TEXT_COLOR: Record<string, string> = { active: '#173404', upcoming: '#042C53', late: '#501313', done: '#6B7280' }

function fmtH(h: number) {
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}${h >= 12 && h < 24 ? 'pm' : 'am'}`
}

const HOURS = [8, 10, 12, 14, 16, 18, 20, 22]

export function SchedulesWidget() {
  const nActive   = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'active').length
  const nUpcoming = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'upcoming').length
  const nLate     = SCHEDULE_EMPLOYEES.filter((e) => e.status === 'late').length

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Schedules</span>
        <Link to={ROUTES.schedule} className="widget-link">View all schedules →</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 500, background: '#F3F4F6', color: 'var(--muted)', borderRadius: 6, padding: '2px 8px' }}>
          🕑 2:30 PM
        </span>
      </div>

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
          {SCHEDULE_EMPLOYEES.map((e) => {
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
    </div>
  )
}
