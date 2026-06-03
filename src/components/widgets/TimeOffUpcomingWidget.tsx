import { Link } from 'react-router-dom'
import { TO2_UPCOMING, TO2_TYPE_LABEL, TO2_TYPE_CLASS } from '../../data/dashboardData'
import { ROUTES } from '../../lib/routes'

export function TimeOffUpcomingWidget() {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Upcoming leaves</span>
        <Link to={ROUTES.attendance} className="widget-link">View all →</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TO2_UPCOMING.map((u, idx) => (
          <div className={u.holiday ? 'to2-card to2-card-holiday' : 'to2-card'} key={idx}>
            <div className="to2-up-date-mini">
              <div className="to2-up-month">{u.startM}</div>
              <div className="to2-up-day">{u.startD}</div>
            </div>
            {u.holiday ? (
              <span style={{ fontSize: 15, flexShrink: 0 }}>☀️</span>
            ) : (
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, flexShrink: 0, background: u.bg, color: u.fg }}>
                {u.initials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="to2-card-name">{u.name}</div>
              <div className="to2-card-meta">{u.role} · {u.days}d</div>
            </div>
            <span className={`to2-type-pill ${TO2_TYPE_CLASS[u.type]}`}>{TO2_TYPE_LABEL[u.type]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
