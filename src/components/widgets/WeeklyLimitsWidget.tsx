import { Link } from 'react-router-dom'
import { WEEKLY_LIMITS } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

export function WeeklyLimitsWidget() {
  const sorted = [...WEEKLY_LIMITS].sort((a, b) => (b.used / b.cap) - (a.used / a.cap))

  let nCritical = 0, nWarning = 0, nSafe = 0
  sorted.forEach((p) => {
    const r = p.used / p.cap
    if (r >= 0.95) nCritical++
    else if (r >= 0.80) nWarning++
    else nSafe++
  })

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Weekly limits</span>
        <Link to={ROUTES.settings} className="widget-link">Manage limits →</Link>
      </div>

      <div className="wl-stats">
        <div className="wl-stat"><div className="wl-stat-label">At limit</div><div className="wl-stat-val danger">{nCritical}</div></div>
        <div className="wl-stat"><div className="wl-stat-label">Near limit</div><div className="wl-stat-val warning">{nWarning}</div></div>
        <div className="wl-stat"><div className="wl-stat-label">On track</div><div className="wl-stat-val safe">{nSafe}</div></div>
      </div>

      <div>
        {sorted.map((p) => {
          const pct     = p.used / p.cap
          const pctDisp = Math.round(pct * 100)
          const rem     = p.cap - p.used
          let barColor: string, pillClass: string, pillLabel: string
          if (pct >= 0.95) {
            barColor = '#E24B4A'; pillClass = 'critical'
            pillLabel = rem <= 0 ? 'At limit' : `${rem}h left`
          } else if (pct >= 0.80) {
            barColor = '#BA7517'; pillClass = 'warning'; pillLabel = `${rem}h left`
          } else {
            barColor = '#639922'; pillClass = 'safe'; pillLabel = `${rem}h left`
          }
          const s = avatarStyle(p.name)
          return (
            <div className="wl-row" key={p.name}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, fontWeight: 700, flexShrink: 0, background: s.bg, color: s.color }}>{initials(p.name)}</div>
              <div className="wl-info">
                <div className="wl-name">{p.name}</div>
                <div className="wl-role">{p.role}</div>
              </div>
              <div className="wl-bar-col">
                <div className="wl-bar-track">
                  <div className="wl-bar-fill" style={{ width: `${Math.min(pctDisp, 100)}%`, background: barColor }}></div>
                </div>
                <div className="wl-bar-meta">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.client}</span>
                  <span style={{ flexShrink: 0, paddingLeft: 4 }}>{p.used}h / {p.cap}h</span>
                </div>
              </div>
              <span className={`wl-pill ${pillClass}`}>{pillLabel}</span>
            </div>
          )
        })}
      </div>

      <div className="wl-legend">
        <div className="wl-legend-item"><div className="wl-legend-dot" style={{ background: '#E24B4A' }}></div>Critical ≥95%</div>
        <div className="wl-legend-item"><div className="wl-legend-dot" style={{ background: '#BA7517' }}></div>Warning ≥80%</div>
        <div className="wl-legend-item"><div className="wl-legend-dot" style={{ background: '#639922' }}></div>On track</div>
      </div>
    </div>
  )
}
