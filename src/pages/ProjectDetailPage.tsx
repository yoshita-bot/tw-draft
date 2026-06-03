import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, DollarSign, CheckSquare } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { PROJECTS, getProjectMembers } from '../data/projectsData'
import { ROUTES } from '../lib/routes'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const project = PROJECTS.find(p => p.id === projectId)
  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar title="Project" subtitle="Project Management" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Project not found.
        </div>
      </div>
    )
  }

  const members = getProjectMembers(project)
  const managers = members.filter(m => m.role === 'manager')
  const regularMembers = members.filter(m => m.role === 'member')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title={project.name} subtitle="Project Management" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* back */}
        <button
          onClick={() => navigate(ROUTES.projects)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#111827'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
        >
          <ArrowLeft width={14} height={14} /> Back to Projects
        </button>

        {/* header card */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{project.name}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Client: <span style={{ color: '#374151', fontWeight: 500 }}>{project.client}</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: project.active ? '#DCFCE7' : '#F3F4F6',
                color: project.active ? '#16A34A' : '#6B7280',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: project.active ? '#16A34A' : '#9CA3AF' }} />
                {project.active ? 'Active' : 'Inactive'}
              </span>
              <span style={{
                display: 'inline-flex', padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: project.billable ? '#EFF6FF' : '#F3F4F6',
                color: project.billable ? '#1D4ED8' : '#6B7280',
              }}>
                {project.billable ? 'Billable' : 'Non-billable'}
              </span>
            </div>
          </div>

          {/* stat row */}
          <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 18, borderTop: '1px solid #F3F4F6' }}>
            <Stat icon={<Clock width={14} height={14} color="#6C63FF" />} label="Total hours" value={`${members.reduce((s, m) => s + m.hoursOnProject, 0)} hrs`} />
            <Stat icon={<DollarSign width={14} height={14} color="#16A34A" />} label="Avg. pay rate" value={members.length ? `$${Math.round(members.reduce((s, m) => s + m.payRate, 0) / members.length)}/hr` : '—'} />
            <Stat icon={<CheckSquare width={14} height={14} color="#F59E0B" />} label="Tasks" value={`${project.tasks.length}`} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

          {/* members table */}
          <div>
            {[{ title: 'Managers', list: managers }, { title: 'Members', list: regularMembers }].map(({ title, list }) =>
              list.length > 0 && (
                <div key={title} style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title} · {list.length}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
                        <Th>Person</Th>
                        <Th>Role</Th>
                        <Th>Pay Rate</Th>
                        <Th>Hours on Project</Th>
                        <Th>Current Task</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((m, idx) => (
                        <tr key={m.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.bg, color: m.fg, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {m.initials}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{m.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{
                              display: 'inline-flex', padding: '2px 8px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                              background: m.role === 'manager' ? '#EEEDFF' : '#F3F4F6',
                              color: m.role === 'manager' ? '#6C63FF' : '#6B7280',
                            }}>
                              {m.role === 'manager' ? 'Manager' : 'Member'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>${m.payRate}/hr</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>{m.hoursOnProject} hrs</td>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: m.currentTask ? '#374151' : '#9CA3AF', fontStyle: m.currentTask ? 'normal' : 'italic' }}>
                            {m.currentTask ?? 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

          {/* tasks sidebar */}
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #E8E8E8', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tasks · {project.tasks.length}
            </div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {project.tasks.length === 0 && (
                <div style={{ padding: '12px 4px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No tasks yet</div>
              )}
              {project.tasks.map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: '#FAFAFA', fontSize: 13, color: '#374151' }}>
                  <CheckSquare width={13} height={13} color="#6C63FF" style={{ flexShrink: 0 }} />
                  {task}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F7F8FA', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</div>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}
