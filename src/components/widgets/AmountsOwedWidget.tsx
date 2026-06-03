import { Link } from 'react-router-dom'
import { AMOUNTS_OWED } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

const STATUS_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  'due-today': 'Due today',
  upcoming: '',
}
const STATUS_CLASS: Record<string, string> = {
  overdue: 'aw-badge-overdue',
  'due-today': 'aw-badge-due-today',
  upcoming: 'aw-badge-upcoming',
}

export function AmountsOwedWidget() {
  const total = AMOUNTS_OWED.reduce((s, r) => s + r.amt, 0)
  const nOverdue = AMOUNTS_OWED.filter((r) => r.status === 'overdue').length

  return (
    <div className="large-widget aw-card">
      {/* Header band */}
      <div className="aw-top">
        <div>
          <div className="aw-eyebrow">Pending Payments</div>
          <div className="aw-total">${total.toLocaleString()}</div>
          <div className="aw-sub">{AMOUNTS_OWED.length} employees · this pay cycle</div>
        </div>
        <div className="aw-top-right">
          {nOverdue > 0 && (
            <div className="aw-overdue-chip">
              <div className="aw-overdue-dot" />
              <span>{nOverdue} overdue</span>
            </div>
          )}
          <Link to={ROUTES.payments} className="widget-link">View all →</Link>
        </div>
      </div>

      {/* People rows */}
      <div className="aw-list">
        {AMOUNTS_OWED.map((r) => {
          const av = avatarStyle(r.name)
          const label = r.status === 'upcoming' ? (r.dueLabel ?? '') : STATUS_LABEL[r.status]
          return (
            <div className="aw-row" key={r.name}>
              <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0, background: av.bg, color: av.color }}>
                {initials(r.name)}
              </div>
              <div className="aw-info">
                <div className="aw-name">{r.name}</div>
                <div className="aw-role">{r.role} · {r.client}</div>
              </div>
              <div className="aw-right">
                <div style={{ textAlign: 'right' }}>
                  <div className="aw-amount">${r.amt.toLocaleString()}</div>
                  <div className="aw-period">{r.period}</div>
                </div>
                <span className={`aw-badge ${STATUS_CLASS[r.status]}`}>{label}</span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
