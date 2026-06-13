import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, X, ChevronDown, Check, GripVertical, Rows3 } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES, type Employee, type PayType, type EmploymentType } from '../data/employeesData'
import { CLIENTS, CLIENT_MAP } from '../data/clientsData'
import { peopleProfile, ROUTES } from '../lib/routes'
import { avatarStyle } from '../utils/avatar'

// ── Types ─────────────────────────────────────────────────────────────────────

type ColId =
  | 'name' | 'role' | 'client' | 'projects'
  | 'employmentType' | 'payType' | 'billRate' | 'payRate'
  | 'timeTracking' | 'status' | 'dateJoined'

type ColDef = {
  id: ColId
  label: string
  locked?: boolean
  minWidth?: number
}

const ALL_COLS: ColDef[] = [
  { id: 'name',           label: 'Name',         locked: true,  minWidth: 180 },
  { id: 'role',           label: 'Role',                        minWidth: 120 },
  { id: 'client',         label: 'Client',                      minWidth: 90  },
  { id: 'projects',       label: 'Projects',                    minWidth: 80  },
  { id: 'employmentType', label: 'Employment',                  minWidth: 100 },
  { id: 'payType',        label: 'Pay Type',                    minWidth: 85  },
  { id: 'billRate',       label: 'Bill Rate',                   minWidth: 80  },
  { id: 'payRate',        label: 'Pay Rate',                    minWidth: 80  },
  { id: 'timeTracking',   label: 'Tracking',                    minWidth: 90  },
  { id: 'status',         label: 'Status',                      minWidth: 90  },
  { id: 'dateJoined',     label: 'Joined',                      minWidth: 95  },
]

const DEFAULT_VISIBLE: Set<ColId> = new Set([
  'name', 'role', 'client', 'projects',
  'employmentType', 'payType', 'billRate', 'payRate',
  'timeTracking', 'status', 'dateJoined',
])

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`
}

function fmtRate(rate: number, payType: PayType) {
  if (rate === 0) return <span style={{ color: '#D1D5DB' }}>—</span>
  return payType === 'monthly'
    ? `$${rate.toLocaleString()}/mo`
    : `$${rate}/hr`
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, bg, fg }: { initials: string; bg: string; fg: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%', background: bg, color: fg,
      fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  active:     { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A', label: 'Active' },
  inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Inactive' },
  onboarding: { bg: '#FEF3C7', color: '#92400E', dot: '#CA8A04', label: 'Onboarding' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.inactive
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Employment type badge ─────────────────────────────────────────────────────

const EMP_TYPE_STYLES: Record<EmploymentType, { bg: string; color: string; label: string }> = {
  'full-time':  { bg: '#EFF6FF', color: '#1D4ED8', label: 'Full-time' },
  'part-time':  { bg: '#FEF3C7', color: '#92400E', label: 'Part-time' },
  'contractor': { bg: '#F5F3FF', color: '#6D28D9', label: 'Contractor' },
}

function EmpTypeBadge({ type }: { type: EmploymentType }) {
  const s = EMP_TYPE_STYLES[type]
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  )
}

// ── Pay type badge ────────────────────────────────────────────────────────────

function PayTypeBadge({ payType }: { payType: PayType }) {
  const isHourly = payType === 'hourly'
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', borderRadius: 99,
      fontSize: 11.5, fontWeight: 600,
      background: isHourly ? '#F0FDF4' : '#FFF1F2',
      color: isHourly ? '#15803D' : '#BE185D',
    }}>
      {isHourly ? 'Hourly' : 'Monthly'}
    </span>
  )
}

// ── Column manager ────────────────────────────────────────────────────────────

function ColumnManager({
  cols, visible, onToggle, onReorder,
}: {
  cols: ColDef[]
  visible: Set<ColId>
  onToggle: (id: ColId) => void
  onReorder: (cols: ColDef[]) => void
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

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...cols]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    onReorder(next)
    setDragIdx(null); setOverIdx(null)
  }

  const activeCount = cols.filter(c => !c.locked && visible.has(c.id)).length

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openPanel()}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 12px', border: `1px solid ${open ? '#6C63FF' : '#E8E8E8'}`,
          borderRadius: 8, background: open ? '#EEEDFF' : '#fff',
          color: open ? '#6C63FF' : '#6B7280', fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        <Rows3 width={14} height={14} />
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
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setOverIdx(idx) }}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 7, cursor: 'grab',
                    background: isOver ? '#F0EEFF' : dragIdx === idx ? '#F9FAFB' : 'transparent',
                    borderTop: isOver ? '2px solid #6C63FF' : '2px solid transparent',
                    opacity: dragIdx === idx ? 0.5 : 1,
                  }}
                >
                  <GripVertical width={12} height={12} color="#D1D5DB" />
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

// ── Projects tooltip cell ────────────────────────────────────────────────────

function ProjectsCell({ projects }: { projects: string[] }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  function showTooltip() {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.left })
    setVisible(true)
  }

  if (projects.length === 0) return <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setVisible(false)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'default' }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
          background: '#EEEDFF', color: '#6C63FF', whiteSpace: 'nowrap',
        }}>
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </span>
      </div>
      {visible && pos && (
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          background: '#1F2937', borderRadius: 8, padding: '8px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', pointerEvents: 'none',
          minWidth: 160, maxWidth: 260,
        }}>
          {projects.map(p => (
            <div key={p} style={{ fontSize: 12.5, color: '#F9FAFB', padding: '3px 0', lineHeight: 1.4 }}>
              {p}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── Multi-select filter ───────────────────────────────────────────────────────

function MultiFilterSelect({
  label, selected, options, onChange,
}: {
  label: string
  selected: string[]
  options: { value: string; label: string }[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const isActive = selected.length > 0

  function openDropdown() {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const dropH = Math.min(260, window.innerHeight * 0.5)
    const top = spaceBelow >= dropH ? r.bottom + 4 : r.top - dropH - 4
    setPos({ top, left: r.left })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (btnRef.current?.contains(e.target as Node) || dropRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
  }

  const allSelected = options.every(o => selected.includes(o.value))

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => open ? setOpen(false) : openDropdown()}
        style={{
          appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 10px',
          border: `1px solid ${isActive ? '#6C63FF' : '#E8E8E8'}`,
          borderRadius: 8, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer',
          background: isActive ? '#EEEDFF' : '#fff',
          color: isActive ? '#6C63FF' : '#6B7280',
          fontWeight: isActive ? 600 : 400, outline: 'none',
        }}
      >
        {isActive ? `${label} (${selected.length})` : label}
        <ChevronDown width={11} height={11} color={isActive ? '#6C63FF' : '#9CA3AF'} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && pos && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            background: '#fff', border: '1px solid #D1D5DB', borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)', width: 220,
          }}
        >
          {/* select all */}
          <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid #F3F4F6' }}>
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : options.map(o => o.value))}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 8px', borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${allSelected ? '#6C63FF' : '#D1D5DB'}`,
                background: allSelected ? '#6C63FF' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {allSelected && <Check width={9} height={9} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </span>
            </button>
          </div>
          {/* options */}
          <div style={{ maxHeight: 210, overflowY: 'auto', padding: '4px 10px 8px' }}>
            {options.map(o => {
              const checked = selected.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '6px 8px', borderRadius: 6, border: 'none',
                    background: checked ? '#F0EEFF' : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = checked ? '#F0EEFF' : 'transparent' }}
                >
                  <div style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`,
                    background: checked ? '#6C63FF' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <Check width={9} height={9} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 12.5, color: '#374151' }}>{o.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

function Cell({ col, emp, onNavigate }: { col: ColDef; emp: Employee; onNavigate: (id: string) => void }) {
  const client = CLIENT_MAP[emp.clientId]
  const td = (content: React.ReactNode, extra?: React.CSSProperties) => (
    <td key={col.id} style={{ padding: '12px 14px', verticalAlign: 'middle', ...extra }}>
      {content}
    </td>
  )

  switch (col.id) {
    case 'name':
      return td(
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar initials={emp.initials} bg={avatarStyle(emp.name).bg} fg={avatarStyle(emp.name).color} />
          <div style={{ minWidth: 0 }}>
            <button
              onClick={() => onNavigate(emp.id)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 600, color: '#6C63FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.textDecoration = 'underline' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.textDecoration = 'none' }}
              >{emp.name}</div>
            </button>
            <a href={`mailto:${emp.email}`} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
            >
              {emp.email}
            </a>
          </div>
        </div>
      )

    case 'role':
      return td(<span style={{ fontSize: 12.5, color: '#374151' }}>{emp.role}</span>)

    case 'client':
      return td(
        client ? (
          <Link
            to={`${ROUTES.people}?client=${encodeURIComponent(client.name)}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget.lastChild as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={e => { (e.currentTarget.lastChild as HTMLElement).style.textDecoration = 'none' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: client.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#6C63FF', fontWeight: 500 }}>{client.shortName}</span>
          </Link>
        ) : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
      )

    case 'projects':
      return td(<ProjectsCell projects={emp.projects} />)

    case 'employmentType':
      return td(<EmpTypeBadge type={emp.employmentType} />)

    case 'payType':
      return td(<PayTypeBadge payType={emp.payType} />)

    case 'billRate':
      return td(<span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{fmtRate(emp.billRate, 'hourly')}</span>)

    case 'payRate':
      return td(<span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{fmtRate(emp.payRate, emp.payType)}</span>)

    case 'timeTracking':
      return td(
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
          borderRadius: 99, fontSize: 11.5, fontWeight: 600,
          background: emp.timeTrackingEnabled ? '#F0FDF4' : '#F3F4F6',
          color: emp.timeTrackingEnabled ? '#15803D' : '#9CA3AF',
        }}>
          {emp.timeTrackingEnabled ? (
            <Check width={11} height={11} strokeWidth={2.5} />
          ) : (
            <X width={11} height={11} strokeWidth={2.5} />
          )}
          {emp.timeTrackingEnabled ? 'Enabled' : 'Disabled'}
        </span>
      )

    case 'status':
      return td(<StatusBadge status={emp.status} />)

    case 'dateJoined':
      return td(<span style={{ fontSize: 12, color: '#6B7280' }}>{fmtDate(emp.dateJoined)}</span>)

    default:
      return td(null)
  }
}

// ── Unique project names ──────────────────────────────────────────────────────

const ALL_PROJECTS = [...new Set(EMPLOYEES.flatMap(e => e.projects))].sort()

// ── Main page ─────────────────────────────────────────────────────────────────

export function PeoplePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterClients, setFilterClients] = useState<string[]>([])
  const [filterProjects, setFilterProjects] = useState<string[]>([])
  const [filterPayTypes, setFilterPayTypes] = useState<string[]>([])
  const [filterEmpTypes, setFilterEmpTypes] = useState<string[]>([])

  const [colOrder, setColOrder] = useState<ColDef[]>(ALL_COLS)
  const [visibleCols, setVisibleCols] = useState<Set<ColId>>(new Set(DEFAULT_VISIBLE))

  function toggleCol(id: ColId) {
    setVisibleCols(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const activeCols = colOrder.filter(c => c.locked || visibleCols.has(c.id))

  const activeFilterCount = [filterClients, filterProjects, filterPayTypes, filterEmpTypes].filter(a => a.length > 0).length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return EMPLOYEES.filter(e => {
      if (q) {
        const client = CLIENT_MAP[e.clientId]
        const matchName = e.name.toLowerCase().includes(q)
        const matchEmail = e.email.toLowerCase().includes(q)
        const matchRole = e.role.toLowerCase().includes(q)
        const matchClient = client?.name.toLowerCase().includes(q)
        const matchProject = e.projects.some(p => p.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchRole && !matchClient && !matchProject) return false
      }
      if (filterClients.length > 0 && !filterClients.includes(e.clientId)) return false
      if (filterProjects.length > 0 && !filterProjects.some(p => e.projects.includes(p))) return false
      if (filterPayTypes.length > 0 && !filterPayTypes.includes(e.payType)) return false
      if (filterEmpTypes.length > 0 && !filterEmpTypes.includes(e.employmentType)) return false
      return true
    })
  }, [search, filterClients, filterProjects, filterPayTypes, filterEmpTypes])

  function clearFilters() {
    setFilterClients([]); setFilterProjects([]); setFilterPayTypes([]); setFilterEmpTypes([])
  }

  const clientOptions = CLIENTS
    .filter(c => EMPLOYEES.some(e => e.clientId === c.id))
    .map(c => ({ value: c.id, label: c.name }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'People' }, { label: 'Members' }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#F7F8FA' }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ position: 'relative', width: 260 }}>
            <Search width={13} height={13} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, role, client…"
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}>
                <X width={12} height={12} />
              </button>
            )}
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <ColumnManager cols={colOrder} visible={visibleCols} onToggle={toggleCol} onReorder={setColOrder} />
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <MultiFilterSelect
            label="All clients"
            selected={filterClients}
            options={clientOptions}
            onChange={setFilterClients}
          />
          <MultiFilterSelect
            label="All projects"
            selected={filterProjects}
            options={ALL_PROJECTS.map(p => ({ value: p, label: p }))}
            onChange={setFilterProjects}
          />
          <MultiFilterSelect
            label="Pay type"
            selected={filterPayTypes}
            options={[{ value: 'hourly', label: 'Hourly' }, { value: 'monthly', label: 'Monthly' }]}
            onChange={setFilterPayTypes}
          />
          <MultiFilterSelect
            label="Employment type"
            selected={filterEmpTypes}
            options={[
              { value: 'full-time', label: 'Full-time' },
              { value: 'part-time', label: 'Part-time' },
              { value: 'contractor', label: 'Contractor' },
            ]}
            onChange={setFilterEmpTypes}
          />
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FEF2F2', color: '#EF4444', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <X width={11} height={11} /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {activeCols.map(col => (
                    <th
                      key={col.id}
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap', borderBottom: '1px solid #E8E8E8', background: '#FAFAFA',
                        color: '#9CA3AF',
                        minWidth: col.minWidth,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {activeCols.map(col => <Cell key={col.id} col={col} emp={emp} onNavigate={id => navigate(peopleProfile(id))} />)}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={activeCols.length} style={{ padding: '48px 14px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                      No members match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
          Showing {filtered.length} of {EMPLOYEES.length} member{EMPLOYEES.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
