import { Link } from 'react-router-dom'
import { TO2_REQUESTS, TO2_TYPE_LABEL, TO2_TYPE_CLASS } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

const STATUS_CLASS: Record<string, string> = {
  pending: 'to2-pending',
  approved: 'to2-approved',
  declined: 'to2-declined',
}

export function TimeOffRequestsWidget() {
  const nPending = TO2_REQUESTS.filter((r) => r.status === 'pending').length

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Time off requests</span>
        <Link to={ROUTES.attendance} className="widget-link">View all →</Link>
      </div>
      {nPending > 0 && (
        <div style={{ marginBottom: 10 }}>
          <span className="kpi-pill pill-warning" style={{ fontSize: 11, padding: '2px 9px' }}>{nPending} pending</span>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TO2_REQUESTS.map((r) => {
          const av = avatarStyle(r.name)
          return (
            <div className="to2-card" key={r.id}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0, background: av.bg, color: av.color }}>
                {initials(r.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="to2-card-name">{r.name}</div>
                <div className="to2-card-meta">{r.from}{r.from !== r.to ? ` – ${r.to}` : ''} · {r.days}d</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                <span className={`to2-type-pill ${TO2_TYPE_CLASS[r.type]}`}>{TO2_TYPE_LABEL[r.type]}</span>
                <span className={`to2-status-pill ${STATUS_CLASS[r.status]}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
