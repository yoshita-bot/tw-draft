import { Link } from 'react-router-dom'
import { Clock, Check, X } from 'lucide-react'
import { TO2_REQUESTS, TO2_TYPE_LABEL } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

const TYPE_COLOR: Record<string, string> = {
  leave:   '#6C63FF',
  sick:    '#EC4899',
  holiday: '#10B981',
  client:  '#F59E0B',
}

const STATUS_CFG = {
  pending:  { bg: '#FFF7ED', color: '#D97706', border: '#FDE68A', label: 'Pending',  Icon: Clock },
  approved: { bg: '#F0FDF4', color: '#059669', border: '#6EE7B7', label: 'Approved', Icon: Check },
  declined: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Declined', Icon: X },
}

const COL = '2fr 1.2fr 1.4fr 52px 100px'

export function TimeOffRequestsWidget({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  const nPending = TO2_REQUESTS.filter((r) => r.status === 'pending').length

  return (
    <div className="large-widget">
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="widget-title">Time off requests</span>
          {nPending > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A' }}>
              {nPending} pending
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to={ROUTES.attendance} className="widget-link">View all →</Link>
          {gripNode}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
        {['Employee', 'Policy', 'Dates', 'Days', 'Status'].map(h => (
          <span key={h} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {TO2_REQUESTS.slice(0, 6).map((r, i) => {
        const av = avatarStyle(r.name)
        const typeColor = TYPE_COLOR[r.type] ?? '#6B7280'
        const statusCfg = STATUS_CFG[r.status] ?? STATUS_CFG.pending
        const StatusIcon = statusCfg.Icon
        const dateStr = r.from === r.to ? r.from : `${r.from} – ${r.to}`
        return (
          <div
            key={r.id}
            style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, alignItems: 'center', padding: '9px 0', borderBottom: i < TO2_REQUESTS.length - 1 ? '1px solid #F3F4F6' : 'none' }}
          >
            {/* Employee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, fontWeight: 700, flexShrink: 0, background: av.bg, color: av.color }}>{initials(r.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.role}</div>
              </div>
            </div>
            {/* Policy */}
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: `${typeColor}18`, color: typeColor, border: `1px solid ${typeColor}33`, display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {TO2_TYPE_LABEL[r.type]}
            </span>
            {/* Dates */}
            <span style={{ fontSize: 12, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateStr}</span>
            {/* Days */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{r.days}d</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{r.hours}h</div>
            </div>
            {/* Status */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, whiteSpace: 'nowrap' }}>
              <StatusIcon width={10} height={10} />
              {statusCfg.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
