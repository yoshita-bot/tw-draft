import { useState, useRef, Fragment } from 'react'
import {
  Search, LayoutGrid, ExternalLink, Pin, ArrowUpDown,
  ChevronRight, Play, Pause, GripVertical, Plus,
} from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import { EXTERNAL_LINKS } from '../../config'
import { cn } from '../../lib/cn'
import { CreateTaskModal } from '../TasksPanel/CreateTaskModal'

interface ProjectsPanelProps {
  onTaskClick: (projectId: string, taskId: string) => void
  selectedTaskId: { projectId: string; taskId: string } | null
}

// ── helpers ────────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; cls: string }> = {
  todo:         { label: 'To Do',       cls: 'text-gray-500 bg-gray-100' },
  'in-progress':{ label: 'In Progress', cls: 'text-royal bg-royal/10' },
  review:       { label: 'Review',      cls: 'text-amber-600 bg-amber-50' },
  done:         { label: 'Done',        cls: 'text-emerald-600 bg-emerald-50' },
  blocked:      { label: 'Blocked',     cls: 'text-red-600 bg-red-50' },
}


function fmtH(s: number): React.ReactNode {
  if (s === 0) return <span className="text-muted/30">—</span>
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtDate(d?: string): React.ReactNode {
  if (!d) return <span className="text-muted/30">—</span>
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(d?: string, status?: string) {
  if (!d || status === 'done') return false
  return new Date(d + 'T00:00:00') < new Date()
}

// ── drag state type ────────────────────────────────────────────────────────────

interface DropTarget {
  projectId: string | null   // null = drop at end of section
  pinned: boolean            // which section
}

// ── component ─────────────────────────────────────────────────────────────────

export function ProjectsPanel({ onTaskClick, selectedTaskId }: ProjectsPanelProps) {
  const [search,            setSearch]            = useState('')
  const [sortBy,            setSortBy]            = useState<'name' | 'hoursThisWeek' | 'lastWorked'>('name')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showCreate,        setShowCreate]        = useState(false)

  // drag-and-drop state
  const [dragId,     setDragId]     = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)

  const dragIdRef = useRef<string | null>(null)

  const {
    projects, sortProjects, toggleProjectPin, repositionProject,
    startProject, startTask, pauseGlobal,
    globalRunning, activeProjectId, activeTaskId,
  } = useTimerStore()

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const pinned   = filtered.filter(p => p.pinned)
  const unpinned = filtered.filter(p => !p.pinned)

  const handleSort = (by: typeof sortBy) => { setSortBy(by); sortProjects(by) }

  const handleProjectClick = (id: string) => {
    setSelectedProjectId(prev => prev === id ? null : id)
  }

  const handleProjectPlay = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    if (globalRunning && activeProjectId === projectId && activeTaskId === null) {
      pauseGlobal()
    } else {
      startProject(projectId)
    }
  }

  const handleTaskPlay = (e: React.MouseEvent, projectId: string, taskId: string) => {
    e.stopPropagation()
    if (globalRunning && activeProjectId === projectId && activeTaskId === taskId) {
      pauseGlobal()
    } else {
      startTask(projectId, taskId)
    }
  }

  // ── drag handlers ────────────────────────────────────────────────────────────

  const onDragStart = (e: React.DragEvent, id: string) => {
    dragIdRef.current = id
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(target)
  }

  const onDrop = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault()
    const id = dragIdRef.current
    if (id && (id !== target.projectId)) {
      repositionProject(id, target.projectId, target.pinned)
    }
    setDragId(null)
    setDropTarget(null)
    dragIdRef.current = null
  }

  const onDragEnd = () => {
    setDragId(null)
    setDropTarget(null)
    dragIdRef.current = null
  }

  const isDropping = (target: DropTarget) =>
    dropTarget?.projectId === target.projectId && dropTarget?.pinned === target.pinned

  // ── render project row ───────────────────────────────────────────────────────

  const renderProjectRow = (p: typeof projects[0]) => {
    const isSelected    = selectedProjectId === p.id
    const isActiveProj  = globalRunning && activeProjectId === p.id && activeTaskId === null
    const hasActiveTask = globalRunning && activeProjectId === p.id && activeTaskId !== null
    const isDragging    = dragId === p.id
    const dropBefore    = isDropping({ projectId: p.id, pinned: p.pinned })

    return (
      <Fragment key={p.id}>
        {/* drop indicator line */}
        {dropBefore && dragId !== p.id && (
          <tr className="h-0 pointer-events-none">
            <td colSpan={8}><div className="h-0.5 bg-royal mx-2 rounded-full" /></td>
          </tr>
        )}

        {/* project row */}
        <tr
          draggable
          onDragStart={e => onDragStart(e, p.id)}
          onDragOver={e => onDragOver(e, { projectId: p.id, pinned: p.pinned })}
          onDrop={e => onDrop(e, { projectId: p.id, pinned: p.pinned })}
          onDragEnd={onDragEnd}
          onClick={() => handleProjectClick(p.id)}
          className={cn(
            'border-b border-border/50 cursor-pointer group transition-colors',
            isSelected ? 'bg-royal/5' : 'hover:bg-sky/40',
            isDragging && 'opacity-30',
          )}
        >
          {/* grip */}
          <td className="py-3 px-2 w-8">
            <GripVertical size={13} className="text-muted/20 group-hover:text-muted/50 cursor-grab active:cursor-grabbing" />
          </td>

          {/* play */}
          <td className="py-3 px-2 w-8" onClick={e => handleProjectPlay(e, p.id)}>
            <button
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0',
                isActiveProj
                  ? 'bg-royal text-white shadow-sm shadow-royal/30'
                  : hasActiveTask
                  ? 'bg-sky text-royal border border-royal/30'
                  : 'text-muted/30 hover:text-royal hover:bg-royal/10 opacity-0 group-hover:opacity-100'
              )}
            >
              {isActiveProj
                ? <Pause size={10} fill="currentColor" />
                : <Play size={10} fill="currentColor" />
              }
            </button>
          </td>

          {/* name */}
          <td className="py-3 px-4">
            <div className="flex items-center gap-2.5">
              <ChevronRight
                size={13}
                className={cn('text-muted/40 shrink-0 transition-transform duration-150', isSelected && 'rotate-90')}
              />
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className={cn('text-sm font-semibold', isSelected ? 'text-royal' : 'text-blackish')}>
                {p.name}
              </span>
              {hasActiveTask && <span className="w-1.5 h-1.5 rounded-full bg-royal animate-pulse shrink-0" />}
            </div>
          </td>

          {/* deadline */}
          <td className="py-3 px-4 text-xs tabular-nums">
            <span className={cn(isOverdue(p.deadline) ? 'text-red-500 font-medium' : 'text-muted')}>
              {fmtDate(p.deadline)}
            </span>
          </td>

          {/* tasks */}
          <td className="py-3 px-4 text-center">
            <span className="text-sm text-blackish/60">{p.totalTasks}</span>
          </td>

          {/* today */}
          <td className="py-3 px-4 text-right">
            <span className="text-xs font-medium tabular-nums text-blackish/70">{fmtH(p.secondsToday)}</span>
          </td>

          {/* this week */}
          <td className="py-3 px-4 text-right">
            <span className="text-xs font-medium tabular-nums text-blackish/70">{fmtH(p.secondsThisWeek)}</span>
          </td>

          {/* total */}
          <td className="py-3 px-4 text-right">
            <span className="text-xs font-semibold tabular-nums text-blackish">{fmtH(p.seconds)}</span>
          </td>

          {/* last active + pin */}
          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted">{fmtDate(p.lastWorkedAt)}</span>
              <button
                onClick={e => { e.stopPropagation(); toggleProjectPin(p.id) }}
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer',
                  p.pinned ? 'text-royal' : 'text-transparent group-hover:text-muted/50 hover:!text-royal hover:bg-sky'
                )}
              >
                <Pin size={11} fill={p.pinned ? 'currentColor' : 'none'} />
              </button>
            </div>
          </td>
        </tr>

        {/* task cards */}
        {isSelected && (
          <tr className="border-b border-border/30">
            <td colSpan={9} className="p-0">
              <div className="px-6 py-4 bg-sky/30 border-l-2 border-l-royal/20">
                {p.tasks.length === 0 ? (
                  <p className="text-xs text-muted/60 italic">
                    No tasks yet — click <strong className="font-semibold not-italic text-muted">New Task</strong> to add one.
                  </p>
                ) : (
                  <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {p.tasks.map(t => {
                      const isSelTask = selectedTaskId?.projectId === p.id && selectedTaskId?.taskId === t.id
                      const isActiveT = globalRunning && activeProjectId === p.id && activeTaskId === t.id
                      const st = statusConfig[t.status] ?? statusConfig.todo
                      const priorityBorder: Record<string, string> = {
                        urgent: 'border-l-red-400',
                        high:   'border-l-orange-400',
                        medium: 'border-l-amber-400',
                        low:    'border-l-gray-300',
                      }
                      return (
                        <div
                          key={t.id}
                          onClick={() => onTaskClick(p.id, t.id)}
                          className={cn(
                            'bg-white rounded-xl border border-l-2 p-3.5 cursor-pointer transition-all group/card flex flex-col gap-2.5',
                            priorityBorder[t.priority] ?? 'border-l-gray-300',
                            isSelTask
                              ? 'border-royal border-l-royal shadow-sm shadow-royal/10'
                              : 'border-border hover:border-royal/30 hover:shadow-sm'
                          )}
                        >
                          {/* play + name */}
                          <div className="flex items-start gap-2">
                            <button
                              onClick={e => handleTaskPlay(e, p.id, t.id)}
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5',
                                isActiveT
                                  ? 'bg-royal text-white'
                                  : 'text-muted/30 hover:text-royal hover:bg-royal/10 opacity-0 group-hover/card:opacity-100'
                              )}
                            >
                              {isActiveT
                                ? <Pause size={8} fill="currentColor" />
                                : <Play size={8} fill="currentColor" />
                              }
                            </button>
                            <p className={cn('text-sm font-semibold leading-snug flex-1', isSelTask ? 'text-royal' : 'text-blackish')}>
                              {t.name}
                            </p>
                          </div>
                          {/* status badge */}
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full self-start', st.cls)}>
                            {st.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Top header ── */}
      <div className="flex items-center gap-3 px-6 h-12 border-b border-border shrink-0">
        <LayoutGrid size={15} className="text-muted shrink-0" />
        <h1 className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>Projects</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.open(EXTERNAL_LINKS.profile, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-royal text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
          >
            <ExternalLink size={12} /> Portal View
          </button>
          <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer">Y</div>
        </div>
      </div>

      {/* ── Filter bar — hidden when no projects ── */}
      {projects.length > 0 && <div className="flex items-center gap-2 px-5 h-11 border-b border-border bg-white shrink-0">
        {/* sort */}
        <div className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-border bg-white text-xs text-muted">
          <ArrowUpDown size={11} />
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as typeof sortBy)}
            className="bg-transparent text-xs text-muted cursor-pointer focus:outline-none appearance-none pr-1"
          >
            <option value="name">Name</option>
            <option value="hoursThisWeek">Hours this week</option>
            <option value="lastWorked">Last active</option>
          </select>
        </div>

        {/* search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 pl-7 pr-3 w-44 rounded-lg border border-border bg-sky text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-royal/25"
          />
        </div>

        {/* new task */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all bg-royal text-white hover:bg-blue-700 cursor-pointer shadow-sm shadow-royal/20"
        >
          <Plus size={12} /> New Task
        </button>
      </div>}

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden p-5 bg-sky flex flex-col gap-4">
        {projects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm">
              <LayoutGrid size={22} className="text-muted/30" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-sm font-bold text-blackish">You don't have any projects yet</p>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Once projects are set up in your workspace, they'll appear here. Check back soon.
              </p>
            </div>
            <a
              href={EXTERNAL_LINKS.createProject}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-royal transition-colors"
            >
              <ExternalLink size={11} /> Manage projects in the portal
            </a>
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-2xl border border-border bg-white shadow-sm flex flex-col">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-border">
                  <th className="py-2.5 px-2 w-8" />
                  <th className="py-2.5 px-2 w-8" />
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider">Project</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider">Deadline</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-center">Tasks</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Today</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-right">This Week</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Total</th>
                  <th className="py-2.5 px-4 text-[11px] font-bold text-muted uppercase tracking-wider text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {/* pinned section */}
                {pinned.length > 0 && (
                  <>
                    <tr
                      className="border-b border-border/40 bg-sky/60"
                      onDragOver={e => onDragOver(e, { projectId: null, pinned: true })}
                      onDrop={e => onDrop(e, { projectId: null, pinned: true })}
                    >
                      <td colSpan={9} className="py-1.5 px-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                          <Pin size={9} /> Pinned
                        </span>
                      </td>
                    </tr>
                    {pinned.map(p => renderProjectRow(p))}
                  </>
                )}

                {/* all projects section */}
                {unpinned.length > 0 && (
                  <>
                    <tr
                      className="border-b border-border/40 bg-sky/60"
                      onDragOver={e => onDragOver(e, { projectId: null, pinned: false })}
                      onDrop={e => onDrop(e, { projectId: null, pinned: false })}
                    >
                      <td colSpan={9} className="py-1.5 px-4">
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">All Projects</span>
                      </td>
                    </tr>
                    {unpinned.map(p => renderProjectRow(p))}

                    {/* drop at end of unpinned */}
                    <tr
                      className="h-4"
                      onDragOver={e => onDragOver(e, { projectId: null, pinned: false })}
                      onDrop={e => onDrop(e, { projectId: null, pinned: false })}
                    >
                      <td colSpan={9} />
                    </tr>
                  </>
                )}

                {pinned.length === 0 && unpinned.length === 0 && (
                  <tr><td colSpan={9} className="py-16 text-center text-sm text-muted">No projects found</td></tr>
                )}
              </tbody>
            </table>

          </div>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal defaultProjectId={selectedProjectId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
