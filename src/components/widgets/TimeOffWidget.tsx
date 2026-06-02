import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TO2_REQUESTS, TO2_UPCOMING, TO2_TYPE_LABEL, TO2_TYPE_CLASS } from '../../data/dashboardData'
import { avatarStyle, initials } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'

type Status = 'pending' | 'approved' | 'declined'
type Filter = 'all' | 'pending' | 'approved' | 'declined' | 'leave' | 'sick' | 'client'

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All', pending: 'Pending', approved: 'Approved', declined: 'Declined',
  leave: 'Leave', sick: 'Sick leave', client: 'Client-provided',
}

export function TimeOffWidget() {
  const [tab, setTab] = useState<'requests' | 'upcoming'>('requests')
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(TO2_REQUESTS.map((r) => [r.id, r.status]))
  )

  const nPending  = TO2_REQUESTS.filter((r) => statuses[r.id] === 'pending').length
  const nApproved = TO2_REQUESTS.filter((r) => statuses[r.id] === 'approved').length
  const nDeclined = TO2_REQUESTS.filter((r) => statuses[r.id] === 'declined').length

  const filtered = TO2_REQUESTS.filter((r) => {
    const s = statuses[r.id]
    if (filter === 'all') return true
    if (['pending', 'approved', 'declined'].includes(filter)) return s === filter
    return r.type === filter
  })

  function approve(id: number) {
    setStatuses((prev) => ({ ...prev, [id]: 'approved' }))
    setExpanded((prev) => ({ ...prev, [id]: false }))
  }
  function decline(id: number) {
    setStatuses((prev) => ({ ...prev, [id]: 'declined' }))
    setExpanded((prev) => ({ ...prev, [id]: false }))
  }
  function toggleExpand(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Group upcoming by month
  const byMonth: Record<string, typeof TO2_UPCOMING> = {}
  TO2_UPCOMING.forEach((u) => {
    if (!byMonth[u.startM]) byMonth[u.startM] = []
    byMonth[u.startM].push(u)
  })

  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Time off</span>
        <Link to={ROUTES.attendance} className="widget-link">View all →</Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 10 }}>
        <span className="kpi-pill pill-warning" style={{ fontSize: 11, padding: '2px 9px' }}>{nPending} pending</span>
      </div>

      <div className="to2-tab-bar">
        <button className={`to2-tab${tab === 'requests' ? ' active' : ''}`} onClick={() => setTab('requests')}>📥 Requests</button>
        <button className={`to2-tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>📅 Upcoming leaves</button>
      </div>

      {tab === 'requests' && (
        <div>
          <div className="to2-stats">
            <div className="to2-stat"><div className="to2-stat-label">Pending</div><div className="to2-stat-val" style={{ color: 'var(--warning)' }}>{nPending}</div></div>
            <div className="to2-stat"><div className="to2-stat-label">Approved</div><div className="to2-stat-val" style={{ color: 'var(--success)' }}>{nApproved}</div></div>
            <div className="to2-stat"><div className="to2-stat-label">Declined</div><div className="to2-stat-val" style={{ color: 'var(--danger)' }}>{nDeclined}</div></div>
          </div>
          <div className="to2-filters">
            {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
              <button key={f} className={`to2-filter${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{FILTER_LABELS[f]}</button>
            ))}
          </div>
          <div>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', padding: '24px 0' }}>No requests match this filter</div>
            ) : filtered.map((r) => {
              const s = statuses[r.id]
              const isOpen = !!expanded[r.id]
              const isPending = s === 'pending'
              const av = avatarStyle(r.name)
              const scClass = { pending: 'to2-pending', approved: 'to2-approved', declined: 'to2-declined' }[s] || ''
              return (
                <div className="to2-row" key={r.id}>
                  <div className="to2-row-top">
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0, background: av.bg, color: av.color }}>{initials(r.name)}</div>
                    <div className="to2-info">
                      <div className="to2-name">{r.name}</div>
                      <div className="to2-meta">{r.role} · {r.from}{r.from !== r.to ? ` – ${r.to}` : ''} · {r.days}d / {r.hours}h</div>
                    </div>
                    <span className={`to2-type-pill ${TO2_TYPE_CLASS[r.type]}`}>{TO2_TYPE_LABEL[r.type]}</span>
                    <span className={`to2-status-pill ${scClass}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                    <button className="to2-expand" onClick={() => toggleExpand(r.id)}>{isOpen ? '▲' : '▽'}</button>
                  </div>
                  <div className={`to2-detail${isOpen ? ' open' : ''}`}>
                    <div className="to2-detail-inner">
                      <div><div className="to2-detail-label">Date range</div><div className="to2-detail-val">{r.from} – {r.to}</div></div>
                      <div><div className="to2-detail-label">Duration</div><div className="to2-detail-val">{r.days} day{r.days > 1 ? 's' : ''} · {r.hours}h</div></div>
                      <div><div className="to2-detail-label">Leave type</div><div className="to2-detail-val">{TO2_TYPE_LABEL[r.type]}</div></div>
                      <div><div className="to2-detail-label">Submitted</div><div className="to2-detail-val">{r.submitted}</div></div>
                      <div style={{ gridColumn: '1/-1' }}>
                        <div className="to2-detail-label">Reason</div>
                        <div className="to2-reason">{r.reason}</div>
                      </div>
                      <div className="to2-actions">
                        {isPending ? (
                          <>
                            <button className="to2-act approve" onClick={() => approve(r.id)}>✓ Approve</button>
                            <button className="to2-act decline" onClick={() => decline(r.id)}>✗ Decline</button>
                          </>
                        ) : (
                          <button className="to2-act" disabled>{s === 'approved' ? '✓ Approved' : '✗ Declined'}</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'upcoming' && (
        <div>
          <div className="to2-info-banner">No action needed — shown for team planning. Holidays apply to everyone.</div>
          {Object.entries(byMonth).map(([month, items]) => (
            <div key={month}>
              <div className="to2-section-label">{month}</div>
              {items.map((u, idx) =>
                u.holiday ? (
                  <div className="to2-holiday-row" key={idx}>
                    <div className="to2-up-date">
                      <div className="to2-up-month">{u.startM}</div>
                      <div className="to2-up-day">{u.startD}</div>
                    </div>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>☀️</span>
                    <div className="to2-up-info">
                      <div className="to2-up-name">{u.name}</div>
                      <div className="to2-up-meta">{u.note} · applies to all</div>
                    </div>
                    <span className="to2-type-pill to2-holiday">Holiday</span>
                  </div>
                ) : (
                  <div className="to2-up-row" key={idx}>
                    <div className="to2-up-date">
                      <div className="to2-up-month">{u.startM}</div>
                      <div className="to2-up-day">{u.startD}</div>
                    </div>
                    <div className="avatar" style={{ width: 30, height: 30, fontSize: 10, flexShrink: 0, background: u.bg, color: u.fg }}>{u.initials}</div>
                    <div className="to2-up-info">
                      <div className="to2-up-name">{u.name}</div>
                      <div className="to2-up-meta">{u.role} · {u.from}{u.from !== u.to ? ` – ${u.to}` : ''}</div>
                    </div>
                    <span className={`to2-type-pill ${TO2_TYPE_CLASS[u.type]}`}>{TO2_TYPE_LABEL[u.type]}</span>
                    <span className="to2-up-dur">{u.days}d</span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
