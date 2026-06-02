import { Link } from 'react-router-dom'
import { LOW_ACTIVITY_ROWS } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

function barClass(pct: number) { return pct < 35 ? 'bar-low' : pct < 45 ? 'bar-warn' : 'bar-gray' }
function rateColor(pct: number) { return pct < 35 ? 'var(--danger)' : pct < 45 ? 'var(--warning)' : 'var(--muted)' }

export function LowActivityWidget() {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Low activity</span>
        <Link to={`${ROUTES.timesheets}?worker=${LOW_ACTIVITY_ROWS[0].workerId}&filter=low-activity`} className="widget-link">View in timesheets →</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span className="kpi-pill pill-warning" style={{ fontSize: 11, padding: '2px 8px' }}>{LOW_ACTIVITY_ROWS.length} flagged</span>
      </div>
      <div>
        {LOW_ACTIVITY_ROWS.map((r) => {
          const s = avatarStyle(r.name)
          const trendIcon  = r.trend < 0 ? '↘' : '—'
          const trendClass = r.trend < 0 ? 'down' : 'flat'
          return (
            <Link to={`${ROUTES.timesheets}?worker=${r.workerId}&filter=low-activity`} className="la-row" key={r.name} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 'inherit' }}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 11, fontWeight: 700, flexShrink: 0, background: s.bg, color: s.color }}>{initials(r.name)}</div>
              <div className="la-info">
                <div className="la-name">{r.name}</div>
                <div className="la-role">{r.role}</div>
              </div>
              <div className="activity-bar-wrap">
                <div className="activity-bar-bg">
                  <div className={`activity-bar-fill ${barClass(r.pct)}`} style={{ width: `${r.pct}%` }}></div>
                </div>
                <div className="la-bar-label">{r.hours}</div>
              </div>
              <span className="la-rate" style={{ color: rateColor(r.pct) }}>{r.pct}%</span>
              <span className={`la-trend ${trendClass}`} title={r.trend < 0 ? `${r.trend}% vs last week` : 'No change'}>{trendIcon}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
