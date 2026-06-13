import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Plus, Search, Clock, AlertCircle, ChevronDown,
  Calendar, RefreshCw, LayoutGrid, List, Filter, Paperclip,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { getMemberById, formatMinutes, repeatLabel, type TaskStatus, type TaskPriority } from '../data/tasksData'
import { PROJECTS } from '../data/projectsData'
import { ROUTES, peopleProfile, clientPage, getStateCrumbs, type Crumb } from '../lib/routes'
import { useSharedTasks } from './TaskDetailPage'
import { NewTaskModal } from '../components/NewTaskModal'

// ─── Colour tokens ────────────────────────────────────────────────────────────
const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string; dot: string }> = {
  inprogress: { label: 'In Progress', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  review:     { label: 'Review',      bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  done:       { label: 'Done',        bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
}
const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', color: '#DC2626' },
  normal: { label: 'Normal', bg: '#F3F4F6', color: '#6B7280' },
}
const STATUS_ORDER: TaskStatus[] = ['inprogress', 'review', 'done']

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Avatar({ initials, bg, fg, size = 26 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, border: '1.5px solid #fff',
    }}>
      {initials}
    </div>
  )
}

function AvatarRow({ ids, navigate }: { ids: string[]; navigate: (path: string) => void }) {
  return (
    <div style={{ display: 'flex' }}>
      {ids.slice(0, 4).map((id, i) => {
        const m = getMemberById(id)
        return m ? (
          <div key={id} title={m.name} style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 4 - i, cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); navigate(peopleProfile(id)) }}>
            <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={24} />
          </div>
        ) : null
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const m = STATUS_META[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: m.bg, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />{m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const m = PRIORITY_META[priority]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: m.bg, color: m.color }}>
      {priority === 'urgent' && <AlertCircle width={11} height={11} />}{m.label}
    </span>
  )
}

function Select({ value, onChange, options, style }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; style?: React.CSSProperties
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', border: '1px solid #E5E7EB', borderRadius: 7, padding: '7px 30px 7px 11px',
        fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown width={13} height={13} style={{ position: 'absolute', right: 9, pointerEvents: 'none', color: '#9CA3AF' }} />
    </div>
  )
}

// ─── Column definitions ───────────────────────────────────────────────────────
type ColId = 'task' | 'project' | 'status' | 'priority' | 'deadline' | 'time' | 'repeat' | 'people'

type ColDef = { id: ColId; label: string; locked?: boolean }

const ALL_TASK_COLS: ColDef[] = [
  { id: 'task',     label: 'Task',        locked: true },
  { id: 'project',  label: 'Project' },
  { id: 'status',   label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'deadline', label: 'Deadline' },
  { id: 'time',     label: 'Time (total)' },
  { id: 'repeat',   label: 'Repeat' },
  { id: 'people',   label: 'People' },
]

const DEFAULT_VISIBLE = new Set<ColId>(['task', 'project', 'status', 'priority', 'deadline', 'time', 'people'])

// ─── Column manager ───────────────────────────────────────────────────────────
function ColumnManager({
  cols, visible, onToggle, onReorder,
}: {
  cols: ColDef[]
  visible: Set<ColId>
  onToggle: (id: ColId) => void
  onReorder: (next: ColDef[]) => void
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
      <button ref={btnRef} onClick={() => open ? setOpen(false) : openPanel()} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
        border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 7,
        background: open ? '#EEEDFF' : '#fff', color: open ? '#6C63FF' : '#6B7280',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6.5" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/>
        </svg>
        Columns
        {activeCount > 0 && (
          <span style={{ background: '#6C63FF', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 99, padding: '0 5px', lineHeight: '16px' }}>
            {activeCount}
          </span>
        )}
      </button>

      {open && pos && (
        <div ref={panelRef} style={{
          position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999,
          background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', width: 240, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Manage columns</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Drag to reorder</span>
          </div>
          <div style={{ padding: '6px 8px 8px' }}>
            {cols.map((col, idx) => {
              const isOver = overIdx === idx && dragIdx !== idx
              return (
                <div key={col.id} draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={e => { e.preventDefault(); setOverIdx(idx) }}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                    borderRadius: 7, cursor: 'grab',
                    background: isOver ? '#F0EEFF' : dragIdx === idx ? '#F9FAFB' : 'transparent',
                    borderTop: isOver ? '2px solid #6C63FF' : '2px solid transparent',
                    opacity: dragIdx === idx ? 0.5 : 1,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="#D1D5DB">
                    <circle cx="4" cy="3" r="1.2"/><circle cx="8" cy="3" r="1.2"/>
                    <circle cx="4" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
                    <circle cx="4" cy="9" r="1.2"/><circle cx="8" cy="9" r="1.2"/>
                  </svg>
                  <span style={{ flex: 1, fontSize: 13, color: col.locked ? '#9CA3AF' : '#374151', fontWeight: 500 }}>{col.label}</span>
                  {col.locked ? (
                    <span style={{ fontSize: 10, color: '#D1D5DB', fontWeight: 500 }}>always</span>
                  ) : (
                    <label style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={visible.has(col.id)} onChange={() => onToggle(col.id)} />
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

// ─── Main page ────────────────────────────────────────────────────────────────
type ViewMode = 'kanban' | 'table'

export function TasksPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { tasks } = useSharedTasks()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')
  const [searchParams] = useSearchParams()
  const [filterProject, setFilterProject] = useState<string>(searchParams.get('project') ?? 'all')
  const ancestorCrumbs: Crumb[] = getStateCrumbs(location.state) ?? [{ label: 'Project Management' }]
  const selfCrumb: Crumb = { label: 'Tasks', path: ROUTES.todos }
  const [view, setView] = useState<ViewMode>(searchParams.get('project') ? 'table' : 'kanban')
  const [creatingNew, setCreatingNew] = useState(false)
  const [colOrder, setColOrder] = useState<ColDef[]>(ALL_TASK_COLS)
  const [visibleCols, setVisibleCols] = useState<Set<ColId>>(DEFAULT_VISIBLE)
  function toggleCol(id: ColId) {
    setVisibleCols(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const activeCols = colOrder.filter(c => c.locked || visibleCols.has(c.id))

  const filtered = useMemo(() => {
    let list = tasks
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    if (filterStatus !== 'all')   list = list.filter(t => t.status === filterStatus)
    if (filterPriority !== 'all') list = list.filter(t => t.priority === filterPriority)
    if (filterProject !== 'all')  list = list.filter(t => t.projectId === filterProject)
    return list
  }, [tasks, search, filterStatus, filterPriority, filterProject])

  const grouped = useMemo(() => ({
    inprogress: filtered.filter(t => t.status === 'inprogress'),
    review:     filtered.filter(t => t.status === 'review'),
    done:       filtered.filter(t => t.status === 'done'),
  }), [filtered])

  function goToTask(id: string) {
    navigate(`/todos/${id}`, { state: { crumbs: [...ancestorCrumbs, selfCrumb] } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[...ancestorCrumbs, { label: 'Tasks' }]} />

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, minWidth: 820 }}>
          <div style={{ position: 'relative', width: 220, flexShrink: 0 }}>
            <Search width={14} height={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              style={{ width: '100%', padding: '8px 11px 8px 32px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }} />
          </div>

          <Filter width={14} height={14} color="#9CA3AF" style={{ flexShrink: 0 }} />

          <Select value={filterStatus} onChange={v => setFilterStatus(v as TaskStatus | 'all')} options={[
            { value: 'all', label: 'All statuses' },
            { value: 'inprogress', label: 'In Progress' },
            { value: 'review', label: 'Review' },
            { value: 'done', label: 'Done' },
          ]} />
          <Select value={filterPriority} onChange={v => setFilterPriority(v as TaskPriority | 'all')} options={[
            { value: 'all', label: 'All priorities' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'normal', label: 'Normal' },
          ]} />
          <Select value={filterProject} onChange={v => setFilterProject(v)} options={[
            { value: 'all', label: 'All projects' },
            ...PROJECTS.map(p => ({ value: p.id, label: p.name })),
          ]} />

          <div style={{ flex: 1 }} />

          {/* view toggle */}
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            {(['kanban', 'table'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                background: view === v ? '#6C63FF' : '#fff',
                color: view === v ? '#fff' : '#6B7280',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
              }}>
                {v === 'kanban' ? <LayoutGrid width={14} height={14} /> : <List width={14} height={14} />}
                {v === 'kanban' ? 'Board' : 'Table'}
              </button>
            ))}
          </div>

          {view === 'table' && (
            <ColumnManager cols={colOrder} visible={visibleCols} onToggle={toggleCol} onReorder={setColOrder} />
          )}

          <button onClick={() => setCreatingNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <Plus width={16} height={16} /> New Task
          </button>
        </div>

        {/* ── KANBAN VIEW ── */}
        {view === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))', gap: 16, alignItems: 'start', minWidth: 820 }}>
            {STATUS_ORDER.map(status => {
              const meta = STATUS_META[status]
              const group = grouped[status]
              return (
                <div key={status} style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#111827', flex: 1 }}>{meta.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: '#F3F4F6', borderRadius: 99, padding: '2px 8px' }}>{group.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#D1D5DB' }}>No tasks</div>
                    ) : group.map((task, i) => {
                      const proj = PROJECTS.find(p => p.id === task.projectId)
                      return (
                        <button key={task.id} onClick={() => goToTask(task.id)}
                          style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px', background: 'none', border: 'none', borderBottom: i < group.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: '#111827', lineHeight: 1.4, wordBreak: 'break-word' }}>{task.title}</span>
                            {task.priority === 'urgent' && <AlertCircle width={14} height={14} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />}
                          </div>
                          {proj && (
                            <div style={{ fontSize: 11.5, color: '#9CA3AF', display: 'flex', gap: 4, alignItems: 'center' }}>
                              <span onClick={e => { e.stopPropagation(); navigate(`${ROUTES.projects}/${proj.id}`) }}
                                style={{ cursor: 'pointer', color: '#6C63FF' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                              >{proj.name}</span>
                              <span>·</span>
                              <span onClick={e => { e.stopPropagation(); navigate(clientPage(proj.client)) }}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                              >{proj.client}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {task.timeTotal > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B7280' }}>
                                <Clock width={11} height={11} />{formatMinutes(task.timeTotal)}
                              </div>
                            )}
                            {task.deadline && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#6B7280' }}>
                                <Calendar width={11} height={11} />{task.deadline}
                              </div>
                            )}
                            {task.repeat.enabled && <RefreshCw width={11} height={11} color="#9CA3AF" />}
                            <div style={{ marginLeft: 'auto' }}>
                              <AvatarRow ids={[...task.managerIds, ...task.memberIds]} navigate={navigate} />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {view === 'table' && (
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden', minWidth: 600 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
                  {activeCols.map(col => (
                    <th key={col.id} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={activeCols.length} style={{ padding: '40px 14px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                      No tasks match your filters.
                    </td>
                  </tr>
                ) : filtered.map((task, idx) => {
                  const proj = PROJECTS.find(p => p.id === task.projectId)
                  return (
                    <tr key={task.id} onClick={() => goToTask(task.id)}
                      style={{ borderTop: idx === 0 ? 'none' : '1px solid #F3F4F6', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {activeCols.map(col => {
                        if (col.id === 'task') return (
                          <td key="task" style={{ padding: '12px 14px', maxWidth: 240 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{task.title}</span>
                              {task.repeat.enabled && <RefreshCw width={11} height={11} color="#9CA3AF" style={{ flexShrink: 0 }} />}
                              {task.attachments.length > 0 && <Paperclip width={11} height={11} color="#9CA3AF" style={{ flexShrink: 0 }} />}
                            </div>
                          </td>
                        )
                        if (col.id === 'project') return (
                          <td key="project" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            {proj ? (
                              <>
                                <div onClick={() => navigate(`${ROUTES.projects}/${proj.id}`)}
                                  style={{ fontSize: 13, color: '#6C63FF', fontWeight: 500, cursor: 'pointer', display: 'inline' }}
                                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >{proj.name}</div>
                                <div onClick={() => navigate(clientPage(proj.client))}
                                  style={{ fontSize: 11.5, color: '#9CA3AF', cursor: 'pointer', marginTop: 1 }}
                                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                >{proj.client}</div>
                              </>
                            ) : <span style={{ fontSize: 13, color: '#9CA3AF' }}>—</span>}
                          </td>
                        )
                        if (col.id === 'status') return (
                          <td key="status" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <StatusBadge status={task.status} />
                          </td>
                        )
                        if (col.id === 'priority') return (
                          <td key="priority" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <PriorityBadge priority={task.priority} />
                          </td>
                        )
                        if (col.id === 'deadline') return (
                          <td key="deadline" style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280', whiteSpace: 'nowrap' }}>
                            {task.deadline ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <Calendar width={12} height={12} color="#9CA3AF" />{task.deadline}
                              </div>
                            ) : '—'}
                          </td>
                        )
                        if (col.id === 'time') return (
                          <td key="time" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: task.timeTotal > 0 ? '#111827' : '#D1D5DB', fontWeight: task.timeTotal > 0 ? 600 : 400 }}>
                              <Clock width={12} height={12} color="#9CA3AF" />{formatMinutes(task.timeTotal)}
                            </div>
                          </td>
                        )
                        if (col.id === 'repeat') return (
                          <td key="repeat" style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: 13, color: '#6B7280' }}>
                            {task.repeat.enabled ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <RefreshCw width={12} height={12} color="#9CA3AF" />{repeatLabel(task.repeat)}
                              </div>
                            ) : '—'}
                          </td>
                        )
                        if (col.id === 'people') return (
                          <td key="people" style={{ padding: '12px 14px' }}>
                            <AvatarRow ids={[...task.managerIds, ...task.memberIds]} navigate={navigate} />
                          </td>
                        )
                        return null
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', fontSize: 12, color: '#9CA3AF' }}>
                {filtered.length} task{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {creatingNew && <NewTaskModal onClose={() => setCreatingNew(false)} />}
    </div>
  )
}
