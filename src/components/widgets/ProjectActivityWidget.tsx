import { Link } from 'react-router-dom'
import { PROJECT_ACTIVITY } from '../../data/dashboardData'
import { ROUTES } from '../../lib/routes'

export function ProjectActivityWidget({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Current project activity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Link to={ROUTES.projects} className="widget-link">View projects →</Link>{gripNode}</div>
      </div>
      <div className="widget-list">
        {PROJECT_ACTIVITY.slice(0, 7).map((r) => {
          const barClass = r.pct >= 70 ? 'bar-ok' : r.pct >= 40 ? 'bar-warn' : 'bar-low'
          return (
            <div className="list-row" key={r.name}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                <div style={{ marginTop: 4 }}>
                  <div className="activity-bar-bg">
                    <div className={`activity-bar-fill ${barClass}`} style={{ width: `${r.pct}%` }}></div>
                  </div>
                </div>
              </div>
              <span className="badge-pill badge-team" style={{ marginLeft: 8 }}>{r.team}</span>
              <span className="row-meta" style={{ marginLeft: 8, minWidth: 48, textAlign: 'right' }}>{r.pct}% · {r.hrs}h</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
