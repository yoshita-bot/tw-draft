import { Link } from 'react-router-dom'
import { AMOUNTS_OWED } from '../../data/dashboardData'
import { ROUTES } from '../../lib/routes'

export function AmountsOwedWidget() {
  const total = AMOUNTS_OWED.reduce((s, r) => s + r.amt, 0)
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Amounts owed</span>
        <Link to={ROUTES.payments} className="widget-link">View payroll →</Link>
      </div>
      <div className="amounts-total">${total.toLocaleString()}</div>
      <div className="widget-list">
        {AMOUNTS_OWED.map((r) => (
          <div className="list-row" key={r.name}>
            <span className="row-name">{r.name}</span>
            <span className="row-meta">{r.hrs}h</span>
            <span className="row-meta">${r.rate}/h</span>
            <span className="row-meta" style={{ fontWeight: 600, color: 'var(--text)' }}>${r.amt.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
