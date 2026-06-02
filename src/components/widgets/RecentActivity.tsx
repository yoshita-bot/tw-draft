import { Link } from 'react-router-dom'
import { SCREENSHOTS_PEOPLE } from '../../data/dashboardData'
import { avatarStyle } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

export function RecentActivity() {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Recent activity</span>
        <Link to={ROUTES.timesheets} className="widget-link">View all →</Link>
      </div>
      <div>
        {SCREENSHOTS_PEOPLE.map((p) => {
          const s = avatarStyle(p.name)
          const inits = p.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div className="ss-person" key={p.name}>
              <div className="ss-person-header">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: s.bg, color: s.color }}>{inits}</div>
                <div className="ss-person-info">
                  <div className="ss-person-name">{p.name}</div>
                  <div className="ss-person-meta">{p.project} · {p.client}</div>
                </div>
                <Link to={ROUTES.activity} className="ss-view-link">View all ›</Link>
              </div>
              <div className="ss-thumbs">
                {p.shots.map((sh) => (
                  <div className="ss-thumb" key={sh.time}>
                    <div className="ss-thumb-screen">
                      <div className="ss-thumb-bar long"></div>
                      <div className="ss-thumb-bar med"></div>
                      <div className="ss-thumb-bar short"></div>
                      <div className="ss-thumb-bar long"></div>
                      <div className="ss-thumb-bar med"></div>
                    </div>
                    <span className="ss-thumb-time">{sh.time}</span>
                    <span className={`ss-badge ${sh.level}`}>{sh.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
