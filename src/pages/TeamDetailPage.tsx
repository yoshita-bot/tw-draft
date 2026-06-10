import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Briefcase, Calendar, Crown, Clock, Pencil, Search, X } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { TEAM_MAP, updateTeam, TEAM_COLORS, type TeamRecord } from '../data/teamsData'
import { EMPLOYEES, EMPLOYEE_MAP, SCHEDULE_TYPE_LABELS } from '../data/employeesData'
import { PROJECTS } from '../data/projectsData'
import { ROUTES, peopleProfile } from '../lib/routes'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px', ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  )
}

const STATUS_STYLES = {
  active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A', label: 'Active' },
  inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Inactive' },
  onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04', label: 'Onboarding' },
}

function StatusBadge({ status }: { status: 'active' | 'inactive' | 'onboarding' }) {
  const s = STATUS_STYLES[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function StatItem({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{sub}</div>}
    </div>
  )
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ empId, isLead, teamColor }: { empId: string; isLead: boolean; teamColor: string }) {
  const navigate = useNavigate()
  const emp = EMPLOYEE_MAP[empId]
  if (!emp) return null
  return (
    <div
      onClick={() => navigate(peopleProfile(emp.id))}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 10,
        border: `1px solid ${isLead ? teamColor + '40' : '#F3F4F6'}`,
        background: isLead ? teamColor + '08' : '#FAFAFA',
        cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = teamColor + '12'; e.currentTarget.style.borderColor = teamColor + '60' }}
      onMouseLeave={e => { e.currentTarget.style.background = isLead ? teamColor + '08' : '#FAFAFA'; e.currentTarget.style.borderColor = isLead ? teamColor + '40' : '#F3F4F6' }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, position: 'relative' }}>
        {emp.initials}
        {isLead && (
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: teamColor, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown width={8} height={8} color="#fff" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</span>
          {isLead && <span style={{ fontSize: 10.5, fontWeight: 600, color: teamColor, flexShrink: 0 }}>Lead</span>}
        </div>
        <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 1 }}>{emp.role}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <StatusBadge status={emp.status} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF' }}>
          <Clock width={10} height={10} />
          <span>{SCHEDULE_TYPE_LABELS[emp.scheduleType]}</span>
        </div>
      </div>
    </div>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ projectId }: { projectId: string }) {
  const project = PROJECTS.find(p => p.id === projectId)
  if (!project) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1px solid #F3F4F6', background: '#FAFAFA' }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: project.active ? '#EEF2FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Briefcase width={14} height={14} color={project.active ? '#6C63FF' : '#9CA3AF'} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.name}</div>
        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{project.client}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: project.active ? '#DCFCE7' : '#F3F4F6', color: project.active ? '#16A34A' : '#6B7280' }}>
          {project.active ? 'Active' : 'Inactive'}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{project.billable ? 'Billable' : 'Non-billable'}</span>
      </div>
    </div>
  )
}

// ── Shared form styles ────────────────────────────────────────────────────────

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
const cancelBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }

// ── Multi-select ──────────────────────────────────────────────────────────────

function MultiSelect<T extends { id: string; label: string; sub?: string }>({
  label, options, selected, onToggle,
}: {
  label: string
  options: T[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [q, setQ] = useState('')
  const filtered = q
    ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()) || o.sub?.toLowerCase().includes(q.toLowerCase()))
    : options

  return (
    <div>
      <label style={lbl}>{label}</label>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {selected.map(id => {
            const opt = options.find(o => o.id === id)
            if (!opt) return null
            return (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#EEF2FF', color: '#4338CA' }}>
                {opt.label}
                <button onClick={() => onToggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1', padding: 0, lineHeight: 1, display: 'flex' }}>
                  <X width={11} height={11} />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
          <Search width={13} height={13} color="#9CA3AF" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: '#111827', width: '100%' }} />
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto' }}>
          {filtered.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12.5, color: '#9CA3AF' }}>No results</div>}
          {filtered.map(opt => {
            const active = selected.includes(opt.id)
            return (
              <div
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', background: active ? '#F5F3FF' : 'transparent', borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? '#F5F3FF' : 'transparent' }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${active ? '#6C63FF' : '#D1D5DB'}`, background: active ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                  {active && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: '#111827' }}>{opt.label}</div>
                  {opt.sub && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{opt.sub}</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Edit Team Modal ───────────────────────────────────────────────────────────

function EditTeamModal({ team, onClose, onSave }: { team: TeamRecord; onClose: () => void; onSave: (t: TeamRecord) => void }) {
  const [name, setName] = useState(team.name)
  const [description, setDescription] = useState(team.description)
  const [color, setColor] = useState(team.color)
  const [leadId, setLeadId] = useState(team.leadId ?? '')
  const [memberIds, setMemberIds] = useState<string[]>([...team.memberIds])
  const [projectIds, setProjectIds] = useState<string[]>([...team.projectIds])

  const empOptions = EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: e.role }))
  const projOptions = PROJECTS.map(p => ({ id: p.id, label: p.name, sub: p.client }))

  function toggleMember(id: string) { setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  function toggleProject(id: string) { setProjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  function handleSave() {
    onSave({ ...team, name: name.trim(), description: description.trim(), color, leadId: leadId || null, memberIds, projectIds })
    onClose()
  }

  const canSave = name.trim().length > 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: color + '25', border: `2px solid ${color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users width={13} height={13} color={color} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Edit Team</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <X width={16} height={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {/* Name */}
          <div>
            <label style={lbl}>Team name <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ ...inp, fontSize: 16, fontWeight: 700 }} autoFocus />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          {/* Color */}
          <div>
            <label style={lbl}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                    cursor: 'pointer', flexShrink: 0,
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2, transition: 'outline 0.1s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Lead */}
          <div>
            <label style={lbl}>Team Lead</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="">— No lead —</option>
              {EMPLOYEES.map(e => (
                <option key={e.id} value={e.id}>{e.name} · {e.role}</option>
              ))}
            </select>
          </div>

          {/* Members */}
          <MultiSelect label="Members" options={empOptions} selected={memberIds} onToggle={toggleMember} />

          {/* Projects */}
          <MultiSelect label="Projects" options={projOptions} selected={projectIds} onToggle={toggleProject} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSave ? '#6C63FF' : '#E5E7EB',
              color: canSave ? '#fff' : '#9CA3AF',
              fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()

  const initial = teamId ? TEAM_MAP[teamId] : undefined
  const [team, setTeam] = useState<TeamRecord | undefined>(initial)
  const [editing, setEditing] = useState(false)

  if (!team) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar crumbs={[{ label: 'Teams', path: ROUTES.teams }, { label: 'Not found' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Team not found.
        </div>
      </div>
    )
  }

  function handleSave(updated: TeamRecord) {
    updateTeam(updated)
    setTeam({ ...updated })
  }

  const lead = team.leadId ? EMPLOYEE_MAP[team.leadId] : null
  const members = team.memberIds.map(id => EMPLOYEES.find(e => e.id === id)).filter(Boolean)
  const activeMembers = members.filter(e => e!.status === 'active').length
  const sortedMemberIds = [...team.memberIds].sort((a, b) => (a === team.leadId ? -1 : b === team.leadId ? 1 : 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar crumbs={[{ label: 'Teams', path: ROUTES.teams }, { label: team.name }]} />

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header card ── */}
        <Card style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 13,
              background: team.color + '20', border: `2px solid ${team.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Users width={22} height={22} color={team.color} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{team.name}</div>
              <div style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.5 }}>{team.description || <span style={{ color: '#D1D5DB', fontStyle: 'italic' }}>No description</span>}</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => setEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#fff',
                  fontSize: 13, fontWeight: 600, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F3FF')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <Pencil width={13} height={13} /> Edit
              </button>
              <button
                onClick={() => navigate(ROUTES.teams)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#fff',
                  fontSize: 13, fontWeight: 600, color: '#374151',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <ArrowLeft width={13} height={13} /> Back
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 24, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
            <StatItem icon={<Users width={14} height={14} color={team.color} />} label="Members" value={`${team.memberIds.length}`} sub={`${activeMembers} active`} />
            <StatItem icon={<Briefcase width={14} height={14} color="#0EA5E9" />} label="Projects" value={`${team.projectIds.length}`} />
            {lead ? (
              <StatItem icon={<Crown width={14} height={14} color="#F59E0B" />} label="Team Lead" value={lead.name} sub={lead.role} />
            ) : (
              <StatItem icon={<Crown width={14} height={14} color="#D1D5DB" />} label="Team Lead" value="—" />
            )}
            <StatItem icon={<Calendar width={14} height={14} color="#9CA3AF" />} label="Created" value={formatDate(team.createdAt)} />
          </div>
        </Card>

        {/* ── Content ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Members */}
          <Card>
            <SectionTitle>Members ({team.memberIds.length})</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedMemberIds.map(id => (
                <MemberCard key={id} empId={id} isLead={id === team.leadId} teamColor={team.color} />
              ))}
              {team.memberIds.length === 0 && (
                <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No members yet.</div>
              )}
            </div>
          </Card>

          {/* Projects */}
          <Card>
            <SectionTitle>Projects ({team.projectIds.length})</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {team.projectIds.map(pid => <ProjectCard key={pid} projectId={pid} />)}
              {team.projectIds.length === 0 && (
                <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No projects assigned yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {editing && (
        <EditTeamModal
          team={team}
          onClose={() => setEditing(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
