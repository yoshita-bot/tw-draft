import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check, Plus, Trash2, Clock, CalendarClock, User, Pencil, Link2, Upload, FileText, ChevronDown } from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import type { TaskStatus, Person } from '../../data/mockProjects'
import { TEAM_MEMBERS } from '../../data/mockProjects'
import { formatTimeShort } from '../shared/formatTime'
import { cn } from '../../lib/cn'

import type { Attachment } from '../../data/mockProjects'


function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles])
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 cursor-pointer transition-all select-none',
        dragging ? 'border-royal bg-royal/5' : 'border-border bg-sky/50 hover:border-royal/40 hover:bg-royal/5'
      )}
    >
      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0', dragging ? 'bg-royal text-white' : 'bg-white text-muted border border-border')}>
        <Upload size={13} />
      </div>
      <div>
        <p className="text-xs font-semibold text-blackish/70">{dragging ? 'Drop to attach' : 'Drag & drop files'}</p>
        <p className="text-[11px] text-muted">or <span className="text-royal font-medium">click to browse</span></p>
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = '' }} />
    </div>
  )
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; cls: string }[] = [
  { value: 'todo',        label: 'To Do',       cls: 'bg-gray-100 text-gray-600' },
  { value: 'in-progress', label: 'In Progress', cls: 'bg-blue-50 text-blue-600' },
  { value: 'review',      label: 'Review',      cls: 'bg-yellow-50 text-yellow-700' },
  { value: 'done',        label: 'Done',        cls: 'bg-green-50 text-green-700' },
  { value: 'blocked',     label: 'Blocked',     cls: 'bg-red-50 text-red-600' },
]

function PeoplePicker({ label, selected, onChange }: { label: string; selected: Person[]; onChange: (p: Person[]) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = TEAM_MEMBERS.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) && !selected.find((s) => s.initials === m.initials)
  )

  const toggle = (person: Person) => {
    onChange(selected.find((s) => s.initials === person.initials)
      ? selected.filter((s) => s.initials !== person.initials)
      : [...selected, person])
  }

  return (
    <div ref={ref} className="relative">
      <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">{label}</p>
      <div
        className="flex flex-wrap gap-1.5 min-h-[34px] p-2 rounded-xl border border-border bg-sky cursor-text"
        onClick={() => setOpen(true)}
      >
        {selected.map((p) => (
          <span key={p.initials} className="flex items-center gap-1 text-[11px] font-semibold pl-1 pr-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: p.color }}>
            {p.initials}
            <button onClick={(e) => { e.stopPropagation(); toggle(p) }} className="opacity-70 hover:opacity-100 cursor-pointer"><X size={9} /></button>
          </span>
        ))}
        <input value={search} onChange={(e) => { setSearch(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? 'Search...' : ''} className="flex-1 min-w-[60px] text-xs bg-transparent outline-none text-blackish placeholder:text-muted" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl border border-border shadow-lg overflow-hidden">
          {filtered.map((m) => (
            <button key={m.initials} onMouseDown={(e) => { e.preventDefault(); toggle(m); setSearch('') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-blackish hover:bg-sky cursor-pointer">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: m.color }}>{m.initials}</div>
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ViewTaskModalProps {
  projectId: string
  taskId: string
  onClose: () => void
}

export function ViewTaskModal({ projectId, taskId, onClose }: ViewTaskModalProps) {
  const {
    projects, activeProjectId, activeTaskId, globalRunning,
    startTask, pauseGlobal, updateTask,
  } = useTimerStore()

  const project    = projects.find((p) => p.id === projectId)
  const task       = project?.tasks.find((t) => t.id === taskId)
  const isActive   = activeProjectId === projectId && activeTaskId === taskId
  const isRunning  = isActive && globalRunning
  const liveSeconds = project?.tasks.find((t) => t.id === taskId)?.seconds ?? 0

  const [editing, setEditing]     = useState(false)
  const [nameVal, setNameVal]     = useState(task?.name ?? '')
  const [descVal, setDescVal]     = useState(task?.description ?? '')
  const [status, setStatus]       = useState<TaskStatus>(task?.status ?? 'todo')
  const [isUrgent, setIsUrgent]   = useState(task?.priority === 'urgent')
  const [deadlineVal, setDeadlineVal] = useState(task?.deadline ?? '')
  const [reviewer, setReviewer]   = useState<Person[]>(task ? [task.assignee] : [])
  const [members, setMembers]     = useState<Person[]>(task?.members ?? [])
  const [checklist, setChecklist]   = useState(task?.checklist ?? [])
  const [newItem, setNewItem]       = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments ?? [])
  const [linkDraft, setLinkDraft] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const commitLinkDraft = () => {
    const v = linkDraft.trim()
    if (!v) return
    setAttachments((a) => [...a, { id: crypto.randomUUID(), type: 'link' as const, value: v }])
    setLinkDraft('')
  }
  const addFiles = (files: File[]) =>
    setAttachments((a) => [...a, ...files.map((f) => ({ id: crypto.randomUUID(), type: 'file' as const, value: f.name, fileName: f.name }))])
  const updateAttachment = (id: string, value: string) =>
    setAttachments((a) => a.map((x) => x.id === id ? { ...x, value } : x))
  const removeAttachment = (id: string) =>
    setAttachments((a) => a.filter((x) => x.id !== id))

  useEffect(() => { if (editing) nameRef.current?.focus() }, [editing])

  if (!task || !project) return null

  const today = new Date().toISOString().slice(0, 10)
  const isPastDeadline = task.deadline ? task.deadline < today && task.status !== 'done' : false
  const doneCount  = checklist.filter((c) => c.done).length
  const statusCfg  = STATUS_OPTIONS.find((s) => s.value === (editing ? status : task.status))!

  const handleSave = () => {
    updateTask(projectId, taskId, {
      name:        nameVal.trim() || task.name,
      description: descVal,
      status,
      priority:    isUrgent ? 'urgent' : 'medium',
      deadline:     deadlineVal || undefined,
      assignee:     reviewer[0] ?? task.assignee,
      members,
      checklist,
      attachments,
    })
    setEditing(false)
  }

  const handleCancelEdit = () => {
    setNameVal(task.name)
    setDescVal(task.description ?? '')
    setStatus(task.status)
    setIsUrgent(task.priority === 'urgent')
    setDeadlineVal(task.deadline ?? '')
    setReviewer([task.assignee])
    setMembers(task.members)
    setChecklist(task.checklist)
    setAttachments(task.attachments)
    setLinkDraft('')
    setEditing(false)
  }

  const toggleCheck = (idx: number) => {
    const next = checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c)
    setChecklist(next)
    if (!editing) updateTask(projectId, taskId, { checklist: next })
  }

  const addCheck = () => {
    if (!newItem.trim()) return
    const next = [...checklist, { label: newItem.trim(), done: false }]
    setChecklist(next)
    if (!editing) updateTask(projectId, taskId, { checklist: next })
    setNewItem('')
  }

  const removeCheck = (idx: number) => {
    const next = checklist.filter((_, i) => i !== idx)
    setChecklist(next)
    if (!editing) updateTask(projectId, taskId, { checklist: next })
  }

  const displayUrgent  = editing ? isUrgent    : task.priority === 'urgent'
  const displayReviewer = editing ? reviewer   : [task.assignee]
  const displayMembers  = editing ? members    : task.members

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26,26,46,0.4)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: project.color }} />

          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                ref={nameRef}
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && handleCancelEdit()}
                className="w-full text-lg font-bold text-blackish bg-transparent border-0 border-b-2 border-royal outline-none pb-0.5"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
            ) : (
              <h2 className="text-lg font-bold text-blackish leading-snug" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {task.name}
              </h2>
            )}
            <p className="text-xs text-muted mt-0.5">{project.name}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {editing ? (
              <>
                <button onClick={handleSave}
                  className="text-xs font-semibold text-white bg-royal px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  Save
                </button>
                <button onClick={handleCancelEdit}
                  className="text-xs font-semibold text-muted bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => { setNameVal(task.name); setDescVal(task.description ?? ''); setStatus(task.status); setIsUrgent(task.priority === 'urgent'); setDeadlineVal(task.deadline ?? ''); setReviewer([task.assignee]); setMembers(task.members); setChecklist(task.checklist); setEditing(true) }}
                aria-label="Edit task"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-royal hover:bg-sky transition-colors cursor-pointer"
                title="Edit task"
              >
                <Pencil size={14} />
              </button>
            )}
            <button onClick={onClose} aria-label="Close"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky transition-colors cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Status + Priority */}
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <div className="relative inline-flex items-center">
                <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={cn('text-xs font-semibold pl-3 pr-7 py-1.5 rounded-xl cursor-pointer appearance-none border focus:outline-none focus:ring-2 focus:ring-royal/30', statusCfg.cls)}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60" />
              </div>
            ) : (
              <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl', statusCfg.cls)}>
                {statusCfg.label}
              </span>
            )}

            {editing ? (
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer focus:outline-none',
                  isUrgent ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-400 border-gray-200 hover:border-red-200 hover:text-red-400'
                )}>
                Urgent
              </button>
            ) : (
              displayUrgent && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-100 text-red-600">Urgent</span>
              )
            )}

            {task.createdAt && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-muted">
                <CalendarClock size={11} />
                {new Date(task.createdAt + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center gap-5 bg-sky rounded-2xl px-5 py-4">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Time Tracked</p>
              <div className="flex items-center gap-2">
                <span className={cn('text-2xl font-bold tabular-nums', isRunning ? 'text-teal' : 'text-blackish')}>
                  {formatTimeShort(liveSeconds)}
                </span>
                {isRunning && <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />}
              </div>
              {editing ? (
                <div className="flex items-center gap-2 mt-2">
                  <CalendarClock size={12} className="text-muted shrink-0" />
                  <input
                    type="date"
                    value={deadlineVal}
                    onChange={(e) => setDeadlineVal(e.target.value)}
                    className="text-xs h-7 px-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 cursor-pointer"
                  />
                  {deadlineVal && (
                    <button onClick={() => setDeadlineVal('')} className="text-xs text-muted hover:text-red-500 cursor-pointer">Clear</button>
                  )}
                </div>
              ) : task.deadline ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <CalendarClock size={11} className={cn('shrink-0', isPastDeadline ? 'text-red-400' : 'text-muted')} />
                  <p className={cn('text-xs', isPastDeadline ? 'text-red-500 font-semibold' : 'text-muted')}>
                    {isPastDeadline ? 'Overdue · ' : 'Due '}
                    {new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted/50 mt-1">No deadline set</p>
              )}
            </div>
            <button
              onClick={() => isRunning ? pauseGlobal() : startTask(projectId, taskId)}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              className={cn('w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none shadow-sm',
                isRunning ? 'bg-teal text-white shadow-teal/20' : 'bg-royal text-white shadow-royal/20 hover:bg-blue-700'
              )}>
              {isRunning
                ? <span className="flex gap-0.5"><span className="w-1.5 h-4 rounded-sm bg-white" /><span className="w-1.5 h-4 rounded-sm bg-white" /></span>
                : <span className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent border-l-white ml-0.5" />
              }
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Description</p>
            {editing ? (
              <textarea value={descVal} onChange={(e) => setDescVal(e.target.value)} rows={3}
                placeholder="Add a description..."
                className="w-full text-sm text-blackish bg-sky rounded-xl border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-royal/30 resize-none" />
            ) : (
              <p className={cn('text-sm px-3 py-2', task.description ? 'text-blackish/80' : 'text-muted italic')}>
                {task.description || 'No description.'}
              </p>
            )}
          </div>

          {/* Attachments — always visible in edit mode; read view shows count if any */}
          {editing ? (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Attachments</p>
              {attachments.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {attachments.map((a) => (
                    a.type === 'file' ? (
                      <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky border border-border">
                        <FileText size={13} className="text-muted shrink-0" />
                        <span className="text-sm text-blackish flex-1 truncate">{a.fileName ?? a.value}</span>
                        <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer shrink-0"><X size={12} /></button>
                      </div>
                    ) : (
                      <div key={a.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky flex items-center justify-center shrink-0 text-muted">
                          <Link2 size={12} />
                        </div>
                        <input
                          value={a.value}
                          onChange={(e) => updateAttachment(a.id, e.target.value)}
                          placeholder="https://…"
                          className="flex-1 h-8 px-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 transition-colors"
                        />
                        <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer"><X size={13} /></button>
                      </div>
                    )
                  ))}
                </div>
              )}
              <DropZone onFiles={addFiles} />
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2 flex-1 h-8 px-2.5 rounded-lg border border-border bg-white focus-within:ring-2 focus-within:ring-royal/25 focus-within:border-royal/50 transition-colors">
                  <Link2 size={12} className="text-muted shrink-0" />
                  <input
                    value={linkDraft}
                    onChange={(e) => setLinkDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commitLinkDraft())}
                    onBlur={commitLinkDraft}
                    placeholder="Paste a link…"
                    className="flex-1 text-sm bg-transparent outline-none text-blackish placeholder:text-muted/50"
                  />
                </div>
              </div>
            </div>
          ) : attachments.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Attachments</p>
              <div className="flex flex-col gap-2">
                {attachments.map((a) => {
                  const isFile = a.type === 'file'
                  const label = (a.fileName ?? a.value) || '—'
                  return (
                    <a
                      key={a.id}
                      href={!isFile && a.value.startsWith('http') ? a.value : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-white hover:border-royal/40 hover:shadow-sm transition-all group/att"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isFile ? '#f1f5f9' : '#e8f4ff', color: isFile ? '#64748b' : '#0863C9' }}>
                        {isFile ? <FileText size={15} /> : <Link2 size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">
                          {isFile ? 'File' : 'Link'}
                        </p>
                        <p className="text-sm text-blackish font-medium truncate group-hover/att:text-royal transition-colors">
                          {label}
                        </p>
                      </div>
                      {!isFile && a.value.startsWith('http') && (
                        <svg className="w-3.5 h-3.5 text-muted shrink-0 opacity-0 group-hover/att:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* People */}
          {editing ? (
            <div className="grid grid-cols-2 gap-4">
              <PeoplePicker label="Reviewer" selected={reviewer} onChange={setReviewer} />
              <PeoplePicker label="Members"  selected={members}  onChange={setMembers}  />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                  <User size={10} /> Reviewer
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: displayReviewer[0]?.color }} title={displayReviewer[0]?.name}>
                    {displayReviewer[0]?.initials}
                  </div>
                  <span className="text-sm text-blackish font-medium">{displayReviewer[0]?.name}</span>
                </div>
              </div>
              {displayMembers.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Members</p>
                  <div className="flex flex-wrap gap-2">
                    {displayMembers.map((m) => (
                      <div key={m.initials} className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: m.color }} title={m.name}>{m.initials}</div>
                        <span className="text-xs text-blackish/70">{m.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> Checklist
              </p>
              {checklist.length > 0 && (
                <span className="text-[11px] text-muted">{doneCount}/{checklist.length} done</span>
              )}
            </div>

            {checklist.length > 0 && (
              <div className="h-1 bg-border rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 group/item py-1">
                  <button onClick={() => toggleCheck(idx)}
                    className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all',
                      item.done ? 'bg-teal border-teal' : 'border-border hover:border-royal')}>
                    {item.done && <Check size={9} strokeWidth={3} className="text-white" />}
                  </button>
                  <span className={cn('text-sm flex-1', item.done ? 'line-through text-muted' : 'text-blackish')}>
                    {item.label}
                  </span>
                  <button onClick={() => removeCheck(idx)}
                    className="text-muted hover:text-red-500 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheck()}
                placeholder="Add an item..."
                className="flex-1 text-sm bg-sky border border-border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-royal/30" />
              <button onClick={addCheck} disabled={!newItem.trim()}
                className="w-8 h-8 rounded-xl bg-royal text-white flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default shrink-0">
                <Plus size={13} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
