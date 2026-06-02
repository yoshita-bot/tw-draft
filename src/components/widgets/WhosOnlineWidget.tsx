import { Link } from 'react-router-dom'
import { WHOS_ONLINE } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

export function WhosOnlineWidget() {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Who's online</span>
        <Link to={ROUTES.people} className="widget-link">View all members →</Link>
      </div>
      <div className="online-list">
        <div className="online-list-header">
          <span>Member</span>
          <span>Project · Client</span>
          <span>Today</span>
          <span>Activity</span>
        </div>
        {WHOS_ONLINE.map((p) => {
          const s = avatarStyle(p.name)
          const badgeClass = p.activityPct >= 70 ? 'high' : p.activityPct >= 45 ? 'medium' : 'low'
          return (
            <div className="online-row" key={p.name}>
              <div className="online-person">
                <div className="avatar-wrap" style={{ flexShrink: 0 }}>
                  <div className="avatar" style={{ width: 34, height: 34, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{initials(p.name)}</div>
                  <div className="online-dot"></div>
                </div>
                <div className="online-person-info">
                  <div className="online-name">{p.name}</div>
                  <div className="online-task">{p.task}</div>
                </div>
              </div>
              <div className="online-person-info" style={{ minWidth: 0 }}>
                <div className="online-project" style={{ fontWeight: 600 }}>{p.project}</div>
                <div className="online-task">{p.client}</div>
              </div>
              <div className="online-hours-cell">
                {p.hoursToday}
                <div className="online-hours-sub">{p.hoursWeek} wk</div>
              </div>
              <div className="online-activity-cell">
                <span className={`activity-badge ${badgeClass}`}>{p.activityPct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
