import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Globe, Briefcase, Calendar, Mail,
  Search, X, Users, Clock, CheckSquare, Plus, TrendingUp, TrendingDown,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { CLIENT_MAP, type ClientStatus } from '../data/clientsData'
import { EMPLOYEES } from '../data/employeesData'
import { PROJECTS, getProjectMembers } from '../data/projectsData'
import { ROUTES, peopleProfile } from '../lib/routes'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatUSD(n: number) {
  return '$' + n.toLocaleString('en-US')
}

function mockTransactions(clientId: string, avg: number, thisMonth: number) {
  if (avg === 0 && thisMonth === 0) return []
  const seed = clientId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const base = avg > 0 ? avg : thisMonth
  const descs = ['Monthly retainer', 'Project milestone', 'Design services', 'Development hours', 'Consulting fee', 'Support & maintenance']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  return Array.from({ length: 6 }, (_, i) => {
    const variance = ((seed * (i + 3)) % 15) - 7
    const amount = Math.round(base * (1 + variance / 100) / 100) * 100
    return { id: `tx-${clientId}-${i}`, date: `${months[5 - i]} 1, 2026`, description: descs[(seed + i) % descs.length], amount, status: i === 0 ? 'pending' : 'paid' }
  })
}

// ── UI primitives ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ClientStatus, { bg: string; color: string; dot: string; label: string }> = {
  active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A', label: 'Active' },
  inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Inactive' },
  onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04', label: 'Onboarding' },
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function InitialAvatar({ name, bg, fg }: { name: string; bg: string; fg: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', ...style }}>
      {children}
    </div>
  )
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function AddModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', minWidth: 380, maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
            <X width={16} height={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [projectQuery, setProjectQuery] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [addingMember, setAddingMember] = useState(false)

  const client = CLIENT_MAP[clientId ?? '']
  if (!client) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar crumbs={[{ label: 'Clients', path: ROUTES.clients }, { label: 'Not found' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>Client not found.</div>
      </div>
    )
  }

  const allMembers = EMPLOYEES.filter(e => e.clientId === client.id)
  const allProjects = PROJECTS.filter(p => p.client === client.name || p.client === client.shortName)
  const activeProjects = allProjects.filter(p => p.active)
  const activeMembers = allMembers.filter(m => m.status === 'active')

  const filteredProjects = projectQuery
    ? allProjects.filter(p => p.name.toLowerCase().includes(projectQuery.toLowerCase()))
    : allProjects
  const filteredMembers = memberQuery
    ? allMembers.filter(e => e.name.toLowerCase().includes(memberQuery.toLowerCase()) || e.email.toLowerCase().includes(memberQuery.toLowerCase()) || e.role.toLowerCase().includes(memberQuery.toLowerCase()))
    : allMembers

  const diff = client.thisMonthBilling - client.avgMonthlyBilling
  const diffColor = diff > 0 ? '#16A34A' : '#DC2626'
  const utcSign = client.utcOffset >= 0 ? '+' : ''
  const transactions = mockTransactions(client.id, client.avgMonthlyBilling, client.thisMonthBilling)

  const seed = client.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const thisMonthHours = 80 + ((seed * 13) % 120)

  function getMemberHoursForClient(empId: string) {
    const seed = empId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return 40 + ((seed * 7) % 200)
  }
  const statusDot: Record<string, string> = { active: '#16A34A', inactive: '#9CA3AF', onboarding: '#CA8A04' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar crumbs={[{ label: 'Clients', path: ROUTES.clients }, { label: client.name }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* Back */}
        <button
          onClick={() => navigate(ROUTES.clients)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#111827')}
          onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
        >
          <ArrowLeft width={14} height={14} /> Back to Clients
        </button>

        {/* Header — identity left, billing right */}
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>

            {/* Identity */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: client.color + '22', border: `2px solid ${client.color}44`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: client.color }} />
              </div>
              <div>
                {/* Row 1 — name + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{client.name}</span>
                  <StatusBadge status={client.status} />
                </div>

                {/* Row 2 — descriptive meta (smaller, muted) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
                    <Calendar width={12} height={12} /> Joined {formatDate(client.joinedAt)}
                  </span>
                  <span style={{ color: '#E5E7EB' }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
                    <Globe width={12} height={12} /> {client.timezone.replace(/_/g, ' ')} · UTC{utcSign}{client.utcOffset}
                  </span>
                  <span style={{ color: '#E5E7EB' }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9CA3AF' }}>
                    <Briefcase width={12} height={12} /> {client.industry}
                  </span>
                </div>

                {/* Row 3 — stat chips (slightly more weight) */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F3FF', borderRadius: 7, padding: '5px 10px' }}>
                    <Users width={13} height={13} color="#6C63FF" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6C63FF' }}>{allMembers.length}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>members</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>({activeMembers.length} active)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', borderRadius: 7, padding: '5px 10px' }}>
                    <Briefcase width={13} height={13} color="#0EA5E9" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0EA5E9' }}>{allProjects.length}</span>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>projects</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>({activeProjects.length} active)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* Projects + Members */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Projects */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flex: 1 }}>
                Projects <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({allProjects.length})</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 7, padding: '5px 9px' }}>
                <Search width={12} height={12} color="#9CA3AF" />
                <input value={projectQuery} onChange={e => setProjectQuery(e.target.value)} placeholder="Filter…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#111827', width: 90 }} />
                {projectQuery && <X width={11} height={11} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setProjectQuery('')} />}
              </div>
              <button
                onClick={() => setAddingProject(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
              >
                <Plus width={13} height={13} /> Add
              </button>
            </div>
            {filteredProjects.length === 0 ? (
              <div style={{ color: '#9CA3AF', fontSize: 13 }}>{allProjects.length === 0 ? 'No projects yet.' : 'No matches.'}</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 380, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
                {filteredProjects.map(project => {
                  const pm = getProjectMembers(project)
                  const totalHours = pm.reduce((s, m) => s + m.hoursOnProject, 0)
                  return (
                    <div key={project.id} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Link to={`${ROUTES.projects}/${project.id}`}
                          style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#111827')}
                        >
                          {project.name}
                        </Link>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: project.active ? '#DCFCE7' : '#F3F4F6', color: project.active ? '#16A34A' : '#6B7280', flexShrink: 0 }}>
                          {project.active ? 'Active' : 'Inactive'}
                        </span>
                        {project.billable && (
                          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 99, background: '#EFF6FF', color: '#1D4ED8', flexShrink: 0 }}>Billable</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><Users width={11} height={11} /> {pm.length} members</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><Clock width={11} height={11} /> {totalHours}h logged</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><CheckSquare width={11} height={11} /> {project.tasks.length} tasks</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Members */}
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', flex: 1 }}>
                Members <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({allMembers.length})</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 7, padding: '5px 9px' }}>
                <Search width={12} height={12} color="#9CA3AF" />
                <input value={memberQuery} onChange={e => setMemberQuery(e.target.value)} placeholder="Filter…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#111827', width: 90 }} />
                {memberQuery && <X width={11} height={11} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setMemberQuery('')} />}
              </div>
              <button
                onClick={() => setAddingMember(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151' }}
              >
                <Plus width={13} height={13} /> Add
              </button>
            </div>
            {filteredMembers.length === 0 ? (
              <div style={{ color: '#9CA3AF', fontSize: 13 }}>{allMembers.length === 0 ? 'No members assigned.' : 'No matches.'}</div>
            ) : (
              <div style={{ overflowY: 'auto', maxHeight: 380 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Member', 'Role', 'Projects', 'Hours'].map(h => (
                        <th key={h} style={{ textAlign: h === 'Hours' ? 'right' : 'left', padding: '0 10px 8px', fontSize: 11.5, fontWeight: 600, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((emp, i) => {
                      const empProjects = allProjects.filter(p => p.memberIds.includes(emp.id.replace('e', 'm')))
                      const empHours = getMemberHoursForClient(emp.id)
                      return (
                        <tr key={emp.id} style={{ background: i % 2 === 1 ? '#FAFAFA' : '#fff' }}>
                          {/* Member */}
                          <td style={{ padding: '9px 10px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <InitialAvatar name={emp.name} bg={emp.bg} fg={emp.fg} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Link to={peopleProfile(emp.id)}
                                    style={{ fontSize: 13, fontWeight: 600, color: '#111827', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#111827')}
                                  >
                                    {emp.name}
                                  </Link>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot[emp.status] ?? '#9CA3AF', flexShrink: 0 }} />
                                </div>
                                <a href={`mailto:${emp.email}`} style={{ fontSize: 11.5, color: '#9CA3AF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                                  onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                                  onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                                >
                                  <Mail width={10} height={10} />{emp.email}
                                </a>
                              </div>
                            </div>
                          </td>
                          {/* Role */}
                          <td style={{ padding: '9px 10px', fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                            {emp.role}
                          </td>
                          {/* Projects */}
                          <td style={{ padding: '9px 10px', verticalAlign: 'middle' }}>
                            {empProjects.length === 0 ? (
                              <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                            ) : (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {empProjects.map(p => (
                                  <Link key={p.id} to={`${ROUTES.projects}/${p.id}`}
                                    style={{ fontSize: 11.5, fontWeight: 500, padding: '2px 7px', borderRadius: 99, background: p.active ? '#EFF6FF' : '#F3F4F6', color: p.active ? '#1D4ED8' : '#6B7280', textDecoration: 'none', whiteSpace: 'nowrap' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                  >
                                    {p.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </td>
                          {/* Hours */}
                          <td style={{ padding: '9px 10px', textAlign: 'right', verticalAlign: 'middle' }}>
                            {empHours > 0 && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', borderRadius: 6, padding: '3px 8px' }}>
                                <Clock width={10} height={10} />{empHours}h
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Billing + Recent Transactions */}
        {(transactions.length > 0 || client.avgMonthlyBilling > 0 || client.thisMonthBilling > 0) && (
          <Card>
            {/* Billing summary */}
            {(client.thisMonthBilling > 0 || client.avgMonthlyBilling > 0) && (
              <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F3F4F6' }}>
                {/* This month */}
                <div style={{ flex: 1, paddingRight: 32 }}>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>This month</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 6 }}>
                    {client.thisMonthBilling > 0 ? formatUSD(client.thisMonthBilling) : '—'}
                  </div>
                  {diff !== 0 && client.thisMonthBilling > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: diffColor, fontWeight: 600, background: diff > 0 ? '#F0FDF4' : '#FEF2F2', padding: '3px 8px', borderRadius: 6 }}>
                      {diff > 0 ? <TrendingUp width={12} height={12} /> : <TrendingDown width={12} height={12} />}
                      {diff > 0 ? '+' : ''}{formatUSD(diff)} vs avg
                    </div>
                  )}
                </div>

                <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', flexShrink: 0 }} />

                {/* Avg / month */}
                <div style={{ flex: 1, paddingLeft: 32, paddingRight: 32 }}>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg / month</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#374151', lineHeight: 1, marginBottom: 6 }}>
                    {client.avgMonthlyBilling > 0 ? formatUSD(client.avgMonthlyBilling) : '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>last 6 months</div>
                </div>

                {thisMonthHours > 0 && (
                  <>
                    <div style={{ width: 1, background: '#F3F4F6', alignSelf: 'stretch', flexShrink: 0 }} />
                    {/* Worked hours */}
                    <div style={{ flex: 1, paddingLeft: 32 }}>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Worked hours</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#374151', lineHeight: 1, marginBottom: 6 }}>
                        {thisMonthHours}h
                      </div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>this month</div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Recent Transactions</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date', 'Description', 'Amount', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left', padding: '0 12px 10px', fontSize: 11.5, fontWeight: 600, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} style={{ background: i % 2 === 1 ? '#FAFAFA' : '#fff' }}>
                    <td style={{ padding: '11px 12px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>{tx.date}</td>
                    <td style={{ padding: '11px 12px', fontSize: 13, color: '#374151' }}>{tx.description}</td>
                    <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatUSD(tx.amount)}</td>
                    <td style={{ padding: '11px 12px' }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: tx.status === 'paid' ? '#DCFCE7' : '#FEF9C3', color: tx.status === 'paid' ? '#16A34A' : '#A16207' }}>
                        {tx.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Add Project modal */}
      {addingProject && (
        <AddModal title="Add Project" onClose={() => setAddingProject(false)}>
          <AddProjectForm clientName={client.name} onClose={() => setAddingProject(false)} />
        </AddModal>
      )}

      {/* Add Member modal */}
      {addingMember && (
        <AddModal title="Add Member" onClose={() => setAddingMember(false)}>
          <AddMemberForm onClose={() => setAddingMember(false)} />
        </AddModal>
      )}
    </div>
  )
}

// ── Add Project form ──────────────────────────────────────────────────────────

function AddProjectForm({ clientName, onClose }: { clientName: string; onClose: () => void }) {
  const [name, setName] = useState('')
  const [billable, setBillable] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Project name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Client</label>
        <input value={clientName} disabled style={{ ...inputStyle, background: '#F9FAFB', color: '#9CA3AF' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" id="billable" checked={billable} onChange={e => setBillable(e.target.checked)} style={{ width: 14, height: 14, cursor: 'pointer' }} />
        <label htmlFor="billable" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Billable project</label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button onClick={onClose} style={submitBtnStyle(!!name)}>Add Project</button>
      </div>
    </div>
  )
}

// ── Add Member form ───────────────────────────────────────────────────────────

function AddMemberForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Smith" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" type="email" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Role</label>
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Frontend Developer" style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button onClick={onClose} style={submitBtnStyle(!!(name && email))}>Add Member</button>
      </div>
    </div>
  )
}

// ── Shared form styles ────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #E5E7EB',
  fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff',
  fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
}

function submitBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 7, border: 'none',
    background: enabled ? '#6C63FF' : '#E5E7EB',
    fontSize: 13, fontWeight: 600, color: enabled ? '#fff' : '#9CA3AF',
    cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit',
  }
}
