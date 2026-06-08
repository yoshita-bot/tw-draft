import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Pencil, Trash2, X, Check, ChevronDown } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { PROJECTS, ALL_MEMBERS, type Project, type ProjectMember } from '../data/projectsData'
import { ROUTES, clientPage } from '../lib/routes'
import { getSharedTasks } from './TaskDetailPage'

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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = ALL_MEMBERS.filter(m => memberMatchesQuery(m, query))
  const allFilteredIds = filtered.map(m => m.id)
  const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.includes(id))

  // Position the fixed dropdown under the trigger button
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    // prefer opening downward; if not enough space, open upward
    const spaceBelow = window.innerHeight - r.bottom
    const dropH = Math.min(320, window.innerHeight * 0.5)
    const top = spaceBelow >= dropH ? r.bottom + 4 : r.top - dropH - 4
    setDropdownPos({ top, left: r.left, width: r.width })
  }, [])

  function openDropdown() {
    updatePos()
    setOpen(true)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
      setQuery('')
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open, updatePos])

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      onChange(selected.filter(id => !allFilteredIds.includes(id)))
    } else {
      onChange([...new Set([...selected, ...allFilteredIds])])
    }
  }

  return (
    <div>
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
                display: 'inline-flex', alignItems: 'center', gap: 4,
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
        ref={triggerRef}
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', border: `1px solid ${open ? '#6C63FF' : '#D1D5DB'}`, borderRadius: 8,
          background: '#fff', cursor: 'pointer', fontSize: 13,
          color: selected.length ? '#374151' : '#9CA3AF', fontFamily: 'inherit',
          boxShadow: open ? '0 0 0 3px rgba(108,99,255,0.12)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span>{selected.length === 0 ? `Select ${label.toLowerCase()}…` : `${selected.length} selected`}</span>
        <ChevronDown
          width={13} height={13} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
        />
      </button>

      {/* Fixed-position dropdown — renders outside modal overflow context */}
      {open && dropdownPos && (
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #D1D5DB',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          }}
        >
          {/* search */}
          <div style={{ padding: '10px 10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E5E7EB', borderRadius: 7, padding: '6px 10px', background: '#F9FAFB' }}>
              <Search width={12} height={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
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

          {/* select all */}
          {filtered.length > 0 && (
            <div style={{ padding: '6px 10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 8px', borderRadius: 6, border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  marginBottom: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `2px solid ${allFilteredSelected ? '#6C63FF' : '#D1D5DB'}`,
                  background: allFilteredSelected ? '#6C63FF' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {allFilteredSelected && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
                </div>
                <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                  {allFilteredSelected ? 'Deselect all' : `Select all${query ? ' matching' : ''}`}
                  <span style={{ color: '#9CA3AF', fontWeight: 400, marginLeft: 4 }}>({filtered.length})</span>
                </span>
              </button>
            </div>
          )}

          {/* member list */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px 10px 8px' }}>
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
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 8px', borderRadius: 7, border: 'none',
                    background: isSelected ? '#F0EEFF' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#F0EEFF' : 'transparent' }}
                >
                  <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#111827', fontWeight: isSelected ? 600 : 400 }}>{m.name}</div>
                    {(memberClients.length > 0 || memberProjects.length > 0) && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {memberClients.join(', ')}
                        {memberClients.length > 0 && memberProjects.length > 0 && ' · '}
                        {memberProjects.join(', ')}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check width={14} height={14} color="#6C63FF" style={{ flexShrink: 0 }} />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '14px 8px', fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>No results</div>
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
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 600, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        {/* header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{mode === 'add' ? 'Add Project' : 'Edit Project'}</div>
          <button onClick={onClose} style={{ width: 28, height: 28, border: '1px solid #E8E8E8', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <X width={14} height={14} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
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

// ── Column definitions ────────────────────────────────────────────────────

type ColId = 'name' | 'client' | 'members' | 'managers' | 'status' | 'billing' | 'tasks' | 'actions'

type ColDef = {
  id: ColId
  label: string
  sortKey?: SortKey
  locked?: boolean   // always shown, can't hide
  align?: 'right'
}

const ALL_COLS: ColDef[] = [
  { id: 'name',     label: 'Project',  sortKey: 'name',   locked: true },
  { id: 'client',   label: 'Client',   sortKey: 'client' },
  { id: 'members',  label: 'Members' },
  { id: 'managers', label: 'Managers' },
  { id: 'status',   label: 'Status' },
  { id: 'billing',  label: 'Billing' },
  { id: 'tasks',    label: 'Tasks',    sortKey: 'tasks' },
  { id: 'actions',  label: 'Actions',  locked: true, align: 'right' },
]

// ── Filter dropdown (generic) ─────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const isActive = value !== ''
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          padding: '7px 28px 7px 10px',
          border: `1px solid ${isActive ? '#6C63FF' : '#E8E8E8'}`,
          borderRadius: 7, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer',
          background: isActive ? '#EEEDFF' : '#fff',
          color: isActive ? '#6C63FF' : '#6B7280',
          fontWeight: isActive ? 600 : 400,
          outline: 'none',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown width={11} height={11} color={isActive ? '#6C63FF' : '#9CA3AF'} style={{ position: 'absolute', right: 8, pointerEvents: 'none' }} />
    </div>
  )
}

// ── Column manager panel ──────────────────────────────────────────────────

function ColumnManager({
  cols,
  visible,
  onToggle,
  onReorder,
}: {
  cols: ColDef[]
  visible: Set<ColId>
  onToggle: (id: ColId) => void
  onReorder: (newOrder: ColDef[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)

  function openPanel() {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node) || panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const activeCount = cols.filter(c => !c.locked && visible.has(c.id)).length

  function handleDragStart(idx: number) { setDragIdx(idx) }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setOverIdx(idx) }
  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...cols]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    onReorder(next)
    setDragIdx(null); setOverIdx(null)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openPanel()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', border: `1px solid ${open ? '#6C63FF' : '#E8E8E8'}`,
          borderRadius: 7, background: open ? '#EEEDFF' : '#fff',
          color: open ? '#6C63FF' : '#6B7280', fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6.5" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/>
        </svg>
        Columns
        {activeCount > 0 && (
          <span style={{ background: '#6C63FF', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '0px 5px', lineHeight: '16px' }}>
            {activeCount}
          </span>
        )}
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999,
            background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: 240, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Manage columns</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Drag to reorder</span>
          </div>
          <div style={{ padding: '6px 8px 8px' }}>
            {cols.map((col, idx) => {
              const isOver = overIdx === idx && dragIdx !== idx
              return (
                <div
                  key={col.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 7, cursor: 'grab',
                    background: isOver ? '#F0EEFF' : dragIdx === idx ? '#F9FAFB' : 'transparent',
                    borderTop: isOver ? '2px solid #6C63FF' : '2px solid transparent',
                    transition: 'background 0.1s',
                    opacity: dragIdx === idx ? 0.5 : 1,
                  }}
                >
                  {/* drag handle */}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="#D1D5DB">
                    <circle cx="4" cy="3" r="1.2"/><circle cx="8" cy="3" r="1.2"/>
                    <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
                    <circle cx="4" cy="9" r="1.2"/><circle cx="8" cy="9" r="1.2"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: col.locked ? '#9CA3AF' : '#374151', fontWeight: 500 }}>{col.label}</span>
                  {col.locked ? (
                    <span style={{ fontSize: 10, color: '#D1D5DB', fontWeight: 500 }}>always</span>
                  ) : (
                    <label className="toggle" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={visible.has(col.id)} onChange={() => onToggle(col.id)} />
                      <span className="toggle-slider" />
                    </label>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

const ALL_CLIENTS = [...new Set(PROJECTS.map(p => p.client))].sort()

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(PROJECTS)
  const [search, setSearch]         = useState('')
  const [filterClient, setFilterClient]   = useState('')
  const [filterStatus, setFilterStatus]   = useState('')   // '' | 'active' | 'inactive'
  const [filterBillable, setFilterBillable] = useState('') // '' | 'billable' | 'non-billable'
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [modal, setModal] = useState<null | { mode: 'add' } | { mode: 'edit'; project: Project }>(null)

  // Column visibility + order
  const [colOrder, setColOrder] = useState<ColDef[]>(ALL_COLS)
  const [visibleCols, setVisibleCols] = useState<Set<ColId>>(
    new Set(ALL_COLS.map(c => c.id))
  )

  function toggleCol(id: ColId) {
    setVisibleCols(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Derived: active columns in order
  const activeCols = colOrder.filter(c => c.locked || visibleCols.has(c.id))

  const activeFilters = [filterClient, filterStatus, filterBillable].filter(Boolean).length

  const filtered = useMemo(() => {
    let list = projects.filter(p => {
      const q = search.toLowerCase()
      if (q && !p.name.toLowerCase().includes(q) && !p.client.toLowerCase().includes(q)) return false
      if (filterClient && p.client !== filterClient) return false
      if (filterStatus === 'active' && !p.active) return false
      if (filterStatus === 'inactive' && p.active) return false
      if (filterBillable === 'billable' && !p.billable) return false
      if (filterBillable === 'non-billable' && p.billable) return false
      return true
    })
    list = [...list].sort((a, b) => {
      if (sortKey === 'name')   return a.name.localeCompare(b.name)
      if (sortKey === 'client') return a.client.localeCompare(b.client)
      if (sortKey === 'tasks')  return b.tasks.length - a.tasks.length
      return 0
    })
    return list
  }, [projects, search, filterClient, filterStatus, filterBillable, sortKey])

  function clearFilters() {
    setFilterClient(''); setFilterStatus(''); setFilterBillable('')
  }

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

  // Render a single cell for a column
  function renderCell(col: ColDef, project: Project) {
    const memberOnly = project.memberIds.filter(id => !project.managerIds.includes(id))
    switch (col.id) {
      case 'name':
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
            <button
              onClick={() => navigate(`${ROUTES.projects}/${project.id}`)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6C63FF' }}>{project.name}</div>
            </button>
          </td>
        )
      case 'client':
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
            <button
              onClick={() => navigate(clientPage(project.client))}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#374151', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'color 0.15s, text-decoration-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF'; e.currentTarget.style.textDecorationColor = '#6C63FF' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.textDecorationColor = 'transparent' }}
            >
              {project.client}
            </button>
          </td>
        )
      case 'members':
        return <td key={col.id} style={{ padding: '12px 14px' }}><AvatarStack ids={memberOnly} projectManagerIds={project.managerIds} /></td>
      case 'managers':
        return <td key={col.id} style={{ padding: '12px 14px' }}><AvatarStack ids={project.managerIds} projectManagerIds={project.managerIds} /></td>
      case 'status':
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
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
        )
      case 'billing':
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
            <span style={{
              display: 'inline-flex', padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600,
              background: project.billable ? '#EFF6FF' : '#F3F4F6',
              color: project.billable ? '#1D4ED8' : '#6B7280',
            }}>
              {project.billable ? 'Billable' : 'Non-billable'}
            </span>
          </td>
        )
      case 'tasks': {
        const taskCount = getSharedTasks().filter(t => t.projectId === project.id).length
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
            {taskCount > 0 ? (
              <button
                onClick={e => { e.stopPropagation(); navigate(`${ROUTES.todos}?project=${project.id}`, { state: { crumbs: [{ label: 'Project Management' }, { label: 'Projects', path: ROUTES.projects }] } }) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, color: '#6C63FF', fontSize: 13, fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                {taskCount} task{taskCount !== 1 ? 's' : ''}
              </button>
            ) : (
              <span style={{ fontSize: 13, color: '#D1D5DB' }}>—</span>
            )}
          </td>
        )
      }
      case 'actions':
        return (
          <td key={col.id} style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <ActionBtn icon={<Eye width={13} height={13} />}    title="View"   onClick={() => navigate(`${ROUTES.projects}/${project.id}`)} />
              <ActionBtn icon={<Pencil width={13} height={13} />} title="Edit"   onClick={() => setModal({ mode: 'edit', project })} />
              <ActionBtn icon={<Trash2 width={13} height={13} />} title="Delete" onClick={() => handleDelete(project.id)} danger />
            </div>
          </td>
        )
      default: return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Project Management' }, { label: 'Projects' }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* ── Toolbar row 1: search + actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search width={13} height={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or client…"
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111827' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <ColumnManager cols={colOrder} visible={visibleCols} onToggle={toggleCol} onReorder={setColOrder} />
            <button
              onClick={() => setModal({ mode: 'add' })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Plus width={14} height={14} /> Add Project
            </button>
          </div>
        </div>

        {/* ── Toolbar row 2: filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <FilterSelect
            label="All clients"
            value={filterClient}
            options={ALL_CLIENTS.map(c => ({ value: c, label: c }))}
            onChange={setFilterClient}
          />
          <FilterSelect
            label="Any status"
            value={filterStatus}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            onChange={setFilterStatus}
          />
          <FilterSelect
            label="Any billing"
            value={filterBillable}
            options={[{ value: 'billable', label: 'Billable' }, { value: 'non-billable', label: 'Non-billable' }]}
            onChange={setFilterBillable}
          />
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', border: '1px solid #FCA5A5', borderRadius: 7, background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <X width={11} height={11} /> Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {activeCols.map(col => {
                  const isSorted = col.sortKey && sortKey === col.sortKey
                  return (
                    <th
                      key={col.id}
                      onClick={() => col.sortKey && setSortKey(col.sortKey)}
                      style={{
                        padding: '10px 14px', textAlign: col.align === 'right' ? 'right' : 'left',
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA',
                        color: isSorted ? '#6C63FF' : '#9CA3AF',
                        cursor: col.sortKey ? 'pointer' : 'default', userSelect: 'none',
                      }}
                    >
                      {col.label}{isSorted ? ' ↑' : ''}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, idx) => (
                <tr
                  key={project.id}
                  style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {activeCols.map(col => renderCell(col, project))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={activeCols.length} style={{ padding: '40px 14px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                    No projects match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
          Showing {filtered.length} of {projects.length} project{projects.length !== 1 ? 's' : ''}
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
