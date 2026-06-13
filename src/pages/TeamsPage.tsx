import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, Briefcase, Calendar, Plus, ChevronRight } from 'lucide-react'
import { TopBar, type Crumb } from '../components/TopBar'
import { TEAMS, addTeam, TEAM_COLORS, type TeamRecord } from '../data/teamsData'
import { EMPLOYEES, EMPLOYEE_MAP } from '../data/employeesData'
import { PROJECTS } from '../data/projectsData'
import { ROUTES } from '../lib/routes'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Avatar strip ──────────────────────────────────────────────────────────────

function AvatarStrip({ memberIds, max = 4 }: { memberIds: string[]; max?: number }) {
  const shown = memberIds.slice(0, max)
  const rest = memberIds.length - shown.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((id, i) => {
        const emp = EMPLOYEE_MAP[id]
        if (!emp) return null
        return (
          <div key={id} title={emp.name} style={{
            width: 26, height: 26, borderRadius: '50%',
            background: emp.bg, color: emp.fg,
            border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9.5, fontWeight: 700,
            marginLeft: i === 0 ? 0 : -8, flexShrink: 0,
            zIndex: shown.length - i,
          }}>
            {emp.initials}
          </div>
        )
      })}
      {rest > 0 && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#F3F4F6', color: '#6B7280',
          border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9.5, fontWeight: 700, marginLeft: -8,
        }}>
          +{rest}
        </div>
      )}
    </div>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, footer }: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px 0' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <X width={16} height={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {children}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
          {footer}
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }
const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #E5E7EB', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' }
const cancelBtn: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }

// ── Multi-select pill list ─────────────────────────────────────────────────────

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
              <span key={id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: '#EEF2FF', color: '#4338CA',
              }}>
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
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Search…`}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, color: '#111827', width: '100%' }}
          />
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 12.5, color: '#9CA3AF' }}>No results</div>
          )}
          {filtered.map(opt => {
            const active = selected.includes(opt.id)
            return (
              <div
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', cursor: 'pointer',
                  background: active ? '#F5F3FF' : 'transparent',
                  borderBottom: '1px solid #F9FAFB',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? '#F5F3FF' : 'transparent' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `2px solid ${active ? '#6C63FF' : '#D1D5DB'}`,
                  background: active ? '#6C63FF' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.1s',
                }}>
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

// ── Add Team Modal ─────────────────────────────────────────────────────────────

function AddTeamModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: TeamRecord) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(TEAM_COLORS[0])
  const [leadId, setLeadId] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [projectIds, setProjectIds] = useState<string[]>([])

  const empOptions = EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: e.role }))
  const projOptions = PROJECTS.map(p => ({ id: p.id, label: p.name, sub: p.client }))

  function toggleMember(id: string) {
    setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleProject(id: string) {
    setProjectIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    const today = new Date().toISOString().slice(0, 10)
    const newTeam: TeamRecord = {
      id: 'tm-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      color,
      leadId: leadId || null,
      memberIds,
      projectIds,
      createdAt: today,
    }
    onAdd(newTeam)
    onClose()
  }

  const canSubmit = name.trim().length > 0

  return (
    <Modal
      title="New Team"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSubmit ? '#6C63FF' : '#E5E7EB',
              color: canSubmit ? '#fff' : '#9CA3AF',
              fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            Create Team
          </button>
        </>
      }
    >
      {/* Name */}
      <div>
        <label style={lbl}>Team name <span style={{ color: '#EF4444' }}>*</span></label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Frontend Guild"
          autoFocus
          style={{ ...inp, fontSize: 16, fontWeight: 700 }}
        />
      </div>

      {/* Description */}
      <div>
        <label style={lbl}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this team do?"
          rows={2}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
        />
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
                outlineOffset: 2,
                transition: 'outline 0.1s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Lead */}
      <div>
        <label style={lbl}>Team Lead</label>
        <select
          value={leadId}
          onChange={e => setLeadId(e.target.value)}
          style={{ ...inp, cursor: 'pointer' }}
        >
          <option value="">— No lead —</option>
          {EMPLOYEES.map(e => (
            <option key={e.id} value={e.id}>{e.name} · {e.role}</option>
          ))}
        </select>
      </div>

      {/* Members */}
      <MultiSelect
        label="Members"
        options={empOptions}
        selected={memberIds}
        onToggle={toggleMember}
      />

      {/* Projects */}
      <MultiSelect
        label="Projects"
        options={projOptions}
        selected={projectIds}
        onToggle={toggleProject}
      />
    </Modal>
  )
}

// ── Team row ──────────────────────────────────────────────────────────────────

function TeamRow({ team, zebra }: { team: TeamRecord; zebra: boolean }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const lead = team.leadId ? EMPLOYEE_MAP[team.leadId] : null

  return (
    <tr
      onClick={() => navigate(`${ROUTES.teams}/${team.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#F5F3FF' : zebra ? '#FAFAFA' : '#fff',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: team.color + '20', border: `2px solid ${team.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Users width={16} height={16} color={team.color} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{team.name}</div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1, lineHeight: 1.4 }}>{team.description}</div>
          </div>
        </div>
      </td>

      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users width={12} height={12} color="#6C63FF" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{team.memberIds.length}</span>
          </div>
          <AvatarStrip memberIds={team.memberIds} />
        </div>
      </td>

      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Briefcase width={12} height={12} color="#0EA5E9" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{team.projectIds.length}</span>
        </div>
      </td>

      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6' }}>
        {lead ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: lead.bg, color: lead.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9.5, fontWeight: 700, flexShrink: 0,
            }}>
              {lead.initials}
            </div>
            <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{lead.name}</span>
          </div>
        ) : (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        )}
      </td>

      <td style={{ padding: '13px 16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar width={12} height={12} color="#9CA3AF" />
          <span style={{ fontSize: 12.5, color: '#374151' }}>{formatDate(team.createdAt)}</span>
        </div>
      </td>

      <td style={{ padding: '13px 12px', borderBottom: '1px solid #F3F4F6', width: 32 }}>
        <ChevronRight width={14} height={14} color={hovered ? '#6C63FF' : '#D1D5DB'} />
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'members' | 'projects' | 'created'
type SortDir = 'asc' | 'desc'

export function TeamsPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' })
  const [teams, setTeams] = useState<TeamRecord[]>([...TEAMS])
  const [showAdd, setShowAdd] = useState(false)

  function handleAdd(team: TeamRecord) {
    addTeam(team)
    setTeams([...TEAMS])
  }

  const filtered = useMemo(() => {
    let list = teams
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sort.key === 'name') cmp = a.name.localeCompare(b.name)
      else if (sort.key === 'members') cmp = a.memberIds.length - b.memberIds.length
      else if (sort.key === 'projects') cmp = a.projectIds.length - b.projectIds.length
      else if (sort.key === 'created') cmp = a.createdAt.localeCompare(b.createdAt)
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [query, sort, teams])

  function toggleSort(key: SortKey) {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
  }

  function SortArrow({ colKey }: { colKey: SortKey }) {
    if (sort.key !== colKey) return <span style={{ color: '#D1D5DB', fontSize: 10 }}>↕</span>
    return <span style={{ color: '#6C63FF', fontSize: 10 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
  }

  const thBase: React.CSSProperties = {
    padding: '12px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600,
    color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    borderBottom: '1px solid #F3F4F6',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar crumbs={[{ label: 'Teams' }] satisfies Crumb[]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#F7F8FA' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
          <Search width={13} height={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search teams…"
            style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }}
          />
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}><X width={12} height={12} /></button>}
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12.5, color: '#9CA3AF', fontWeight: 500 }}>
          {filtered.length} team{filtered.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#6C63FF', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#5B53EE')}
          onMouseLeave={e => (e.currentTarget.style.background = '#6C63FF')}
        >
          <Plus width={14} height={14} /> New Team
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
              <th style={{ ...thBase, width: '36%' }} onClick={() => toggleSort('name')}>Team <SortArrow colKey="name" /></th>
              <th style={{ ...thBase, width: '22%' }} onClick={() => toggleSort('members')}>Members <SortArrow colKey="members" /></th>
              <th style={{ ...thBase, width: '10%' }} onClick={() => toggleSort('projects')}>Projects <SortArrow colKey="projects" /></th>
              <th style={{ ...thBase, width: '18%', cursor: 'default' }}>Lead</th>
              <th style={{ ...thBase, width: '14%' }} onClick={() => toggleSort('created')}>Created <SortArrow colKey="created" /></th>
              <th style={{ ...thBase, width: 32, cursor: 'default' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 14 }}>
                  No teams match your search.
                </td>
              </tr>
            )}
            {filtered.map((team, i) => (
              <TeamRow key={team.id} team={team} zebra={i % 2 === 1} />
            ))}
          </tbody>
        </table>
      </div>

      </div>{/* end content wrapper */}

      {showAdd && <AddTeamModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
