import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Clock, DollarSign, CheckSquare, TrendingUp, Plus, ExternalLink } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { PROJECTS, getProjectMembers } from '../data/projectsData'
import { ROUTES, peopleProfile, clientPage, type Crumb } from '../lib/routes'
import { NewTaskModal } from '../components/NewTaskModal'
import { getSharedTasks } from './TaskDetailPage'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [addingTask, setAddingTask] = useState(false)
  const projectCrumbs: Crumb[] = [
    { label: 'Project Management' },
    { label: 'Projects', path: ROUTES.projects },
  ]

  const project = PROJECTS.find(p => p.id === projectId)
  if (!project) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar crumbs={[{ label: 'Project Management' }, { label: 'Projects', path: ROUTES.projects }, { label: 'Project' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Project not found.
        </div>
      </div>
    )
  }

  const members = getProjectMembers(project)
  const managers = members.filter(m => m.role === 'manager')
  const regularMembers = members.filter(m => m.role === 'member')

  const avgPayRate  = members.length ? Math.round(members.reduce((s, m) => s + m.payRate, 0)  / members.length) : 0
  const avgBillRate = members.length ? Math.round(members.reduce((s, m) => s + m.billRate, 0) / members.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Project Management' }, { label: 'Projects', path: ROUTES.projects }, { label: project.name }]} />

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
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{project.name}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                Client:{' '}
                <button
                  onClick={() => navigate(clientPage(project.client))}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6C63FF', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.textDecorationColor = '#6C63FF'}
                  onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                >
                  {project.client}
                </button>
              </div>
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
          <div style={{ display: 'flex', gap: 24, marginTop: 18, paddingTop: 18, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
            <Stat icon={<Clock width={14} height={14} color="#6C63FF" />}      label="Total hours"    value={`${members.reduce((s, m) => s + m.hoursOnProject, 0)} hrs`} />
            <Stat icon={<DollarSign width={14} height={14} color="#16A34A" />} label="Avg. pay rate"  value={members.length ? `$${avgPayRate}/hr`  : '—'} />
            <Stat icon={<TrendingUp width={14} height={14} color="#F59E0B" />} label="Avg. bill rate" value={members.length ? `$${avgBillRate}/hr` : '—'} />
            <Stat icon={<CheckSquare width={14} height={14} color="#6C63FF" />} label="Tasks"         value={`${getSharedTasks().filter(t => t.projectId === project.id).length}`} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

          {/* members tables */}
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
                        <Th>Bill Rate</Th>
                        <Th>Hours</Th>
                        <Th>Current Task</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((m, idx) => (
                        <tr
                          key={m.id}
                          style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '11px 16px' }}>
                            <button
                              onClick={() => navigate(peopleProfile(m.id))}
                              style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            >
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: m.bg, color: m.fg, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {m.initials}
                              </div>
                              <span
                                style={{ fontSize: 13, fontWeight: 500, color: '#6C63FF', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecorationColor = '#6C63FF')}
                                onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
                              >
                                {m.name}
                              </span>
                            </button>
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
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>${m.billRate}/hr</span>
                          </td>
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
          {(() => {
            const allTasks = getSharedTasks().filter(t => t.projectId === project.id)
            return (
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>
                    Tasks · {allTasks.length}
                  </span>
                  {allTasks.length > 0 && (
                    <button
                      onClick={() => navigate(`${ROUTES.todos}?project=${project.id}`, { state: { crumbs: [...projectCrumbs, { label: project.name, path: `${ROUTES.projects}/${project.id}` }] } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', color: '#6C63FF', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <ExternalLink width={11} height={11} /> View all
                    </button>
                  )}
                  <button
                    onClick={() => setAddingTask(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', color: '#6C63FF', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <Plus width={12} height={12} /> Add Task
                  </button>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {allTasks.length === 0 && (
                    <div style={{ padding: '12px 4px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No tasks yet</div>
                  )}
                  {allTasks.map(task => (
                    <button key={task.id} onClick={() => navigate(`/todos/${task.id}`, { state: { crumbs: [...projectCrumbs, { label: project.name, path: `${ROUTES.projects}/${project.id}` }] } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: '#FAFAFA', fontSize: 13, color: '#374151', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F0EFFE'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FAFAFA'}
                    >
                      <CheckSquare width={13} height={13} color="#6C63FF" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{task.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })()}

        </div>
      </div>
      {addingTask && <NewTaskModal onClose={() => setAddingTask(false)} defaultProjectId={projectId} />}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F7F8FA', border: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
