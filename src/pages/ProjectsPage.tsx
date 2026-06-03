import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { PROJECTS, ALL_MEMBERS, type Project, type ProjectMember } from '../data/projectsData'
import { ROUTES } from '../lib/routes'

// Pre-compute client + project associations for each member
function buildMemberMeta() {
  const clientsMap: Record<string, Set<string>> = {}
  const projectsMap: Record<string, Set<string>> = {}
  PROJECTS.forEach(p => {
    p.memberIds.forEach(id => {
      if (!clientsMap[id]) clientsMap[id] = new Set()
      if (!projectsMap[id]) projectsMap[id] = new Set()
      clientsMap[id].add(p.client)
      projectsMap[id].add(p.name)
    })
  })
  return { clientsMap, projectsMap }
}
const { clientsMap, projectsMap } = buildMemberMeta()

function memberMatchesQuery(m: ProjectMember, q: string) {
  if (!q) return true
  const lower = q.toLowerCase()
  if (m.name.toLowerCase().includes(lower)) return true
  const clients = clientsMap[m.id]
  if (clients && [...clients].some(c => c.toLowerCase().includes(lower))) return true
  const projects = projectsMap[m.id]
  if (projects && [...projects].some(p => p.toLowerCase().includes(lower))) return true
  return false
}

type SortKey = 'name' | 'client' | 'tasks'

function Avatar({ initials, bg, fg, size = 26 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, border: '1.5px solid #fff',
    }}>
      {initials}
    </div>
  )
}

function AvatarStack({ ids, projectManagerIds }: { ids: string[]; projectManagerIds: string[] }) {
  const members = ids.slice(0, 4).map(id => ALL_MEMBERS.find(m => m.id === id)).filter(Boolean)
  const extra = ids.length - 4
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {members.map((m, i) => m && (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: members.length - i }}>
          <Avatar initials={m.initials} bg={m.bg} fg={m.fg} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: '#E5E7EB', color: '#6B7280',
          fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginLeft: -8, border: '1.5px solid #fff', flexShrink: 0,
        }}>+{extra}</div>
      )}
    </div>
  )
}

// ── Multi-select member picker ─────────────────────────────────────────────

function MemberPicker({
  label,
  selected,
  onChange,
}: {
  label: string
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = ALL_MEMBERS.filter(m => memberMatchesQuery(m, query))
  const allFilteredIds = filtered.map(m => m.id)
  const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.includes(id))

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      onChange(selected.filter(id => !allFilteredIds.includes(id)))
    } else {
      const merged = [...new Set([...selected, ...allFilteredIds])]
      onChange(merged)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}
      </label>

      {/* selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {selected.map(id => {
            const m = ALL_MEMBERS.find(x => x.id === id)
            if (!m) return null
            return (
              <span key={id} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: '#EEEDFF', color: '#6C63FF', fontSize: 11.5, fontWeight: 500,
                padding: '3px 6px 3px 8px', borderRadius: 99,
              }}>
                {m.name}
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6C63FF', display: 'flex', padding: 0, marginTop: 1 }}
                >
                  <X width={10} height={10} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 7, background: '#fff',
          cursor: 'pointer', fontSize: 13, color: selected.length ? '#374151' : '#9CA3AF', fontFamily: 'inherit',
        }}
      >
        <span>{selected.length === 0 ? `Select ${label.toLowerCase()}…` : `${selected.length} selected`}</span>
        <ChevronDown width={13} height={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8, marginTop: 4,
          boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
        }}>
          <div style={{ padding: '8px 8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 8px', background: '#F9FAFB' }}>
              <Search width={12} height={12} color="#9CA3AF" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, client, or project…"
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12.5, width: '100%', fontFamily: 'inherit', color: '#374151' }}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0, flexShrink: 0 }}>
                  <X width={11} height={11} />
                </button>
              )}
            </div>
          </div>

          {/* select all row */}
          {filtered.length > 0 && (
            <div style={{ padding: '6px 8px 2px', borderBottom: '1px solid #F3F4F6' }}>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 6, border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, border: `2px solid ${allFilteredSelected ? '#6C63FF' : '#D1D5DB'}`,
                  background: allFilteredSelected ? '#6C63FF' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {allFilteredSelected && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>
                  {allFilteredSelected ? 'Deselect all' : `Select all${query ? ' matching' : ''}`}
                  {' '}
                  <span style={{ color: '#9CA3AF' }}>({filtered.length})</span>
                </span>
              </button>
            </div>
          )}

          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 8px 8px' }}>
            {filtered.map(m => {
              const isSelected = selected.includes(m.id)
              const memberClients = clientsMap[m.id] ? [...clientsMap[m.id]] : []
              const memberProjects = projectsMap[m.id] ? [...projectsMap[m.id]] : []
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 6, border: 'none',
                    background: isSelected ? '#F0EEFF' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={24} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#374151', fontWeight: isSelected ? 600 : 400 }}>{m.name}</div>
                    {(memberClients.length > 0 || memberProjects.length > 0) && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {memberClients.join(', ')}
                        {memberClients.length > 0 && memberProjects.length > 0 && ' · '}
                        {memberProjects.join(', ')}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check width={13} height={13} color="#6C63FF" style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '10px 8px', fontSize: 12.5, color: '#9CA3AF', textAlign: 'center' }}>No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add / Edit modal ───────────────────────────────────────────────────────

const CLIENTS = ['Acme Corp', 'Vero Health', 'BlueSky Ltd', 'Novu Media', 'Internal', 'Brex Inc']

type FormState = {
  name: string
  client: string
  billable: boolean
  active: boolean
  memberIds: string[]
  managerIds: string[]
}

function emptyForm(): FormState {
  return { name: '', client: '', billable: true, active: true, memberIds: [], managerIds: [] }
}

function projectToForm(p: Project): FormState {
  return {
    name: p.name,
    client: p.client,
    billable: p.billable,
    active: p.active,
    memberIds: p.memberIds,
    managerIds: p.managerIds,
  }
}

function ProjectModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: 'add' | 'edit'
  initial: FormState
  onClose: () => void
  onSave: (f: FormState) => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.client) e.client = 'Client is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    onSave(form)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.3)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{mode === 'add' ? 'Add Project' : 'Edit Project'}</div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: '1px solid #E8E8E8', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <X width={14} height={14} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Project Name</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Client Portal Redesign"
                style={{
                  width: '100%', padding: '8px 10px', border: `1px solid ${errors.name ? '#EF4444' : '#D1D5DB'}`, borderRadius: 7,
                  fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#111827',
                }}
              />
              {errors.name && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3 }}>{errors.name}</div>}
            </div>

            {/* client */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Client</label>
              <select
                value={form.client}
                onChange={e => set('client', e.target.value)}
                style={{
                  width: '100%', padding: '8px 10px', border: `1px solid ${errors.client ? '#EF4444' : '#D1D5DB'}`, borderRadius: 7,
                  fontSize: 13, fontFamily: 'inherit', outline: 'none', color: form.client ? '#111827' : '#9CA3AF', background: '#fff',
                }}
              >
                <option value="">Select a client…</option>
                {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.client && <div style={{ fontSize: 11, color: '#EF4444', marginTop: 3 }}>{errors.client}</div>}
            </div>

            {/* toggles */}
            <div style={{ display: 'flex', gap: 20 }}>
              {([['billable', 'Billable'], ['active', 'Active']] as [keyof FormState, string][]).map(([key, lbl]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                  <span className="toggle">
                    <input type="checkbox" checked={form[key] as boolean} onChange={e => set(key, e.target.checked)} />
                    <span className="toggle-slider" />
                  </span>
                  {lbl}
                </label>
              ))}
            </div>

            {/* members */}
            <MemberPicker label="Members" selected={form.memberIds} onChange={ids => set('memberIds', ids)} />

            {/* managers */}
            <MemberPicker label="Managers" selected={form.managerIds} onChange={ids => set('managerIds', ids)} />

          </div>
          {/* spacer so last field clears scroll area */}
          <div style={{ height: 16 }} />
        </form>

        {/* footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E8E8E8', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} type="button" style={{ padding: '8px 18px', border: '1px solid #D1D5DB', borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} type="button" style={{ padding: '8px 18px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {mode === 'add' ? 'Add Project' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; project: Project }>(null)

  const filtered = useMemo(() => {
    let list = projects.filter(p => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)
    })
    if (filterStatus === 'active') list = list.filter(p => p.active)
    if (filterStatus === 'inactive') list = list.filter(p => !p.active)
    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'client') return a.client.localeCompare(b.client)
      if (sortKey === 'tasks') return b.tasks.length - a.tasks.length
      return 0
    })
    return list
  }, [projects, search, filterStatus, sortKey])

  function handleSave(form: FormState) {
    if (modal?.mode === 'add') {
      const id = `p${Date.now()}`
      setProjects(prev => [...prev, {
        id, name: form.name, client: form.client, active: form.active, billable: form.billable,
        memberIds: form.memberIds, managerIds: form.managerIds, tasks: [],
      }])
    } else if (modal?.mode === 'edit') {
      setProjects(prev => prev.map(p =>
        p.id === modal.project.id
          ? { ...p, name: form.name, client: form.client, active: form.active, billable: form.billable, memberIds: form.memberIds, managerIds: form.managerIds }
          : p
      ))
    }
    setModal(null)
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this project?')) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      onClick={() => setSortKey(col)}
      style={{ cursor: 'pointer', userSelect: 'none', padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: sortKey === col ? '#6C63FF' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}
    >
      {label} {sortKey === col ? '↑' : ''}
    </th>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="Projects" subtitle="Project Management" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search width={13} height={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or client…"
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111827' }}
            />
          </div>

          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '7px 14px', borderRadius: 7, border: '1px solid', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              borderColor: filterStatus === s ? '#6C63FF' : '#E8E8E8',
              background: filterStatus === s ? '#EEEDFF' : '#fff',
              color: filterStatus === s ? '#6C63FF' : '#6B7280',
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setModal({ mode: 'add' })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus width={14} height={14} />
              Add Project
            </button>
          </div>
        </div>

        {/* table */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <SortTh col="name" label="Project" />
                <SortTh col="client" label="Client" />
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}>Members</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}>Managers</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}>Billing</th>
                <SortTh col="tasks" label="Tasks" />
                <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, idx) => {
                const memberOnly = project.memberIds.filter(id => !project.managerIds.includes(id))
                return (
                  <tr
                    key={project.id}
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        onClick={() => navigate(`${ROUTES.projects}/${project.id}`)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                      >
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6C63FF' }}>{project.name}</div>
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{project.client}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <AvatarStack ids={memberOnly} projectManagerIds={project.managerIds} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <AvatarStack ids={project.managerIds} projectManagerIds={project.managerIds} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
                        borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                        background: project.active ? '#DCFCE7' : '#F3F4F6',
                        color: project.active ? '#16A34A' : '#6B7280',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: project.active ? '#16A34A' : '#9CA3AF' }} />
                        {project.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex', padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
                        background: project.billable ? '#EFF6FF' : '#F3F4F6',
                        color: project.billable ? '#1D4ED8' : '#6B7280',
                      }}>
                        {project.billable ? 'Billable' : 'Non-billable'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{project.tasks.length}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <ActionBtn icon={<Eye width={13} height={13} />} title="View" onClick={() => navigate(`${ROUTES.projects}/${project.id}`)} />
                        <ActionBtn icon={<Pencil width={13} height={13} />} title="Edit" onClick={() => setModal({ mode: 'edit', project })} />
                        <ActionBtn icon={<Trash2 width={13} height={13} />} title="Delete" onClick={() => handleDelete(project.id)} danger />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 14px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                    No projects match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {modal && (
        <ProjectModal
          mode={modal.mode}
          initial={modal.mode === 'edit' ? projectToForm(modal.project) : emptyForm()}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function ActionBtn({ icon, title, onClick, danger }: { icon: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #E8E8E8', borderRadius: 6, background: '#fff', cursor: 'pointer',
        color: danger ? '#EF4444' : '#6B7280', transition: 'background 0.12s, border-color 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : '#F3F4F6'; e.currentTarget.style.borderColor = danger ? '#FCA5A5' : '#D1D5DB' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E8E8E8' }}
    >
      {icon}
    </button>
  )
}
