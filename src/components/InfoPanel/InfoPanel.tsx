import { useState, useRef, useEffect, useCallback } from 'react'
import { X, PanelBottomOpen, PanelRightOpen, Pencil, Check, Plus, Trash2, Link2, Upload, FileText, ChevronDown, Clock, CalendarClock } from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import type { TaskStatus, Attachment } from '../../data/mockProjects'
import { cn } from '../../lib/cn'

const STATUS_OPTIONS: { value: TaskStatus; label: string; cls: string }[] = [
  { value: 'todo',        label: 'To Do',       cls: 'bg-gray-100 text-gray-600' },
  { value: 'in-progress', label: 'In Progress', cls: 'bg-blue-50 text-blue-600' },
  { value: 'review',      label: 'Review',      cls: 'bg-yellow-50 text-yellow-700' },
  { value: 'done',        label: 'Done',        cls: 'bg-green-50 text-green-700' },
  { value: 'blocked',     label: 'Blocked',     cls: 'bg-red-50 text-red-600' },
]

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
        'flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 cursor-pointer transition-all select-none',
        dragging ? 'border-royal bg-royal/5' : 'border-border bg-sky/50 hover:border-royal/40'
      )}
    >
      <Upload size={13} className={dragging ? 'text-royal' : 'text-muted'} />
      <p className="text-xs text-muted">
        {dragging ? 'Drop to attach' : <span>Drop files or <span className="text-royal font-medium">browse</span></span>}
      </p>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = '' }} />
    </div>
  )
}

interface InfoPanelProps {
  projectId: string
  taskId: string
  position: 'right' | 'bottom'
  width?: number
  height?: number
  onClose: () => void
  onPositionChange: (pos: 'right' | 'bottom') => void
}

export function InfoPanel({ projectId, taskId, position, width, height, onClose, onPositionChange }: InfoPanelProps) {
  const { projects, updateTask } = useTimerStore()
  const project = projects.find(p => p.id === projectId)
  const task = project?.tasks.find(t => t.id === taskId)

  const [editing, setEditing] = useState(false)
  const [nameVal, setNameVal] = useState(task?.name ?? '')
  const [descVal, setDescVal] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'todo')
  const [isUrgent, setIsUrgent] = useState(task?.priority === 'urgent')
  const [deadlineVal, setDeadlineVal] = useState(task?.deadline ?? '')
  const [checklist, setChecklist] = useState(task?.checklist ?? [])
  const [newItem, setNewItem] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments ?? [])
  const [linkDraft, setLinkDraft] = useState('')

  // Sync when task changes
  useEffect(() => {
    if (task) {
      setNameVal(task.name)
      setDescVal(task.description ?? '')
      setStatus(task.status)
      setIsUrgent(task.priority === 'urgent')
      setDeadlineVal(task.deadline ?? '')
      setChecklist(task.checklist)
      setAttachments(task.attachments)
      setEditing(false)
    }
  }, [taskId])

  if (!task || !project) return null

  const today = new Date().toISOString().slice(0, 10)
  const isPastDeadline = task.deadline ? task.deadline < today && task.status !== 'done' : false
  const doneCount = checklist.filter(c => c.done).length
  const statusCfg = STATUS_OPTIONS.find(s => s.value === (editing ? status : task.status))!

  const handleSave = () => {
    updateTask(projectId, taskId, {
      name: nameVal.trim() || task.name,
      description: descVal,
      status,
      priority: isUrgent ? 'urgent' : 'medium',
      deadline: deadlineVal || undefined,
      checklist,
      attachments,
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setNameVal(task.name); setDescVal(task.description ?? '')
    setStatus(task.status); setIsUrgent(task.priority === 'urgent')
    setDeadlineVal(task.deadline ?? ''); setChecklist(task.checklist)
    setAttachments(task.attachments); setLinkDraft(''); setEditing(false)
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
  const commitLink = () => {
    const v = linkDraft.trim()
    if (!v) return
    setAttachments(a => [...a, { id: crypto.randomUUID(), type: 'link' as const, value: v }])
    setLinkDraft('')
  }
  const addFiles = (files: File[]) =>
    setAttachments(a => [...a, ...files.map(f => ({ id: crypto.randomUUID(), type: 'file' as const, value: f.name, fileName: f.name }))])
  const removeAttachment = (id: string) => setAttachments(a => a.filter(x => x.id !== id))
  const updateAttachment = (id: string, value: string) => setAttachments(a => a.map(x => x.id === id ? { ...x, value } : x))

  const isRight = position === 'right'

  const containerStyle = isRight
    ? { width: width ?? 360 }
    : { height: height ?? 360 }

  return (
    <div style={containerStyle} className="shrink-0 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-border shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        {editing ? (
          <input value={nameVal} onChange={e => setNameVal(e.target.value)}
            className="flex-1 text-sm font-bold bg-transparent border-b border-royal outline-none text-blackish min-w-0" />
        ) : (
          <h2 className="flex-1 text-sm font-bold text-blackish truncate min-w-0">{task.name}</h2>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="h-7 px-2.5 text-xs font-semibold text-white bg-royal rounded-lg hover:bg-blue-700 cursor-pointer">Save</button>
              <button onClick={handleCancel} className="h-7 px-2.5 text-xs font-semibold text-muted bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer">Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-royal hover:bg-sky cursor-pointer">
              <Pencil size={13} />
            </button>
          )}
          <button
            onClick={() => onPositionChange(isRight ? 'bottom' : 'right')}
            title={isRight ? 'Move to bottom' : 'Move to right'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky cursor-pointer"
          >
            {isRight ? <PanelBottomOpen size={14} /> : <PanelRightOpen size={14} />}
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky cursor-pointer">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable body — horizontal scroll for bottom panel */}
      <div className={cn('flex-1 overflow-y-auto', !isRight && 'flex flex-row gap-0')}>
        {isRight ? (
          <div className="px-4 py-4 flex flex-col gap-4">
            {/* Meta row — status + priority */}
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <div className="relative inline-flex items-center">
                  <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                    className={cn('text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg cursor-pointer appearance-none border focus:outline-none', statusCfg.cls)}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50" />
                </div>
              ) : (
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg', statusCfg.cls)}>{statusCfg.label}</span>
              )}
              {editing ? (
                <button onClick={() => setIsUrgent(!isUrgent)}
                  className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer transition-colors',
                    isUrgent ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-400 border-gray-200')}>
                  {isUrgent ? 'Urgent' : 'Normal'}
                </button>
              ) : (
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg',
                  task.priority === 'urgent' ? 'bg-red-100 text-red-600'
                  : task.priority === 'high'   ? 'bg-orange-50 text-orange-600'
                  : task.priority === 'medium' ? 'bg-amber-50 text-amber-600'
                  : 'bg-gray-100 text-gray-400')}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
              <span className="ml-auto text-xs text-muted truncate">{project.name}</span>
            </div>

            {/* Time stats — today + this week + total */}
            <div className="flex items-center gap-4 bg-sky rounded-xl px-4 py-2.5">
              {[['Today', task.secondsToday], ['This Week', task.secondsThisWeek], ['Total', task.seconds]].map(([label, s], i, arr) => {
                const secs = s as number
                const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
                const display = secs === 0 ? '—' : h ? `${h}h ${m}m` : `${m}m`
                return (
                  <div key={label as string} className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider leading-none mb-0.5">{label}</p>
                      <p className="text-sm font-bold text-blackish tabular-nums">{display}</p>
                    </div>
                    {i < arr.length - 1 && <div className="w-px h-6 bg-border" />}
                  </div>
                )
              })}
            </div>

            {/* Deadline (edit mode only shows input; read mode shows inline if set) */}
            {editing ? (
              <div className="flex items-center gap-1.5">
                <CalendarClock size={11} className="text-muted" />
                <input type="date" value={deadlineVal} onChange={e => setDeadlineVal(e.target.value)}
                  className="text-xs h-6 px-2 rounded-lg border border-border bg-white focus:outline-none cursor-pointer" />
                {deadlineVal && <button onClick={() => setDeadlineVal('')} className="text-xs text-muted hover:text-red-500 cursor-pointer">Clear</button>}
              </div>
            ) : task.deadline ? (
              <div className="flex items-center gap-1">
                <CalendarClock size={10} className={isPastDeadline ? 'text-red-400' : 'text-muted'} />
                <p className={cn('text-xs', isPastDeadline ? 'text-red-500 font-semibold' : 'text-muted')}>
                  {isPastDeadline ? 'Overdue · ' : 'Due '}{new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            ) : null}

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Description</p>
              {editing ? (
                <textarea value={descVal} onChange={e => setDescVal(e.target.value)} rows={3} placeholder="Add a description…"
                  className="w-full text-sm text-blackish bg-sky rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-royal/30 resize-none" />
              ) : (
                <p className={cn('text-sm px-1 leading-relaxed', task.description ? 'text-blackish/80' : 'text-muted/50 italic')}>
                  {task.description || 'No description.'}
                </p>
              )}
            </div>

            {/* Attachments — directly beneath description */}
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Attachments</p>
              {attachments.length > 0 ? (
                <div className="flex flex-col gap-1.5 mb-2">
                  {attachments.map(a => (
                    a.type === 'file' ? (
                      <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky border border-border">
                        <FileText size={12} className="text-muted shrink-0" />
                        <span className="text-xs text-blackish flex-1 truncate">{a.fileName ?? a.value}</span>
                        {editing && <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer"><X size={11} /></button>}
                      </div>
                    ) : (
                      <div key={a.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', editing ? 'border-border bg-white' : 'border-border bg-white hover:border-royal/40 cursor-pointer')}>
                        <Link2 size={12} className="text-royal shrink-0" />
                        {editing ? (
                          <>
                            <input value={a.value} onChange={e => updateAttachment(a.id, e.target.value)} placeholder="https://…"
                              className="flex-1 text-xs bg-transparent outline-none text-blackish" />
                            <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer"><X size={11} /></button>
                          </>
                        ) : (
                          <a href={a.value.startsWith('http') ? a.value : undefined} target="_blank" rel="noopener noreferrer"
                            className="flex-1 text-xs text-blackish truncate hover:text-royal">{a.value || '—'}</a>
                        )}
                      </div>
                    )
                  ))}
                </div>
              ) : !editing && (
                <p className="text-xs text-muted/40 italic px-1 mb-2">No attachments.</p>
              )}
              {editing && (
                <>
                  <DropZone onFiles={addFiles} />
                  <div className="flex items-center gap-2 mt-2 h-8 px-2.5 rounded-lg border border-border bg-white focus-within:ring-2 focus-within:ring-royal/25">
                    <Link2 size={11} className="text-muted shrink-0" />
                    <input value={linkDraft} onChange={e => setLinkDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), commitLink())}
                      onBlur={commitLink} placeholder="Paste a link…"
                      className="flex-1 text-xs bg-transparent outline-none text-blackish placeholder:text-muted/50" />
                  </div>
                </>
              )}
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Checklist</p>
                {checklist.length > 0 && <span className="text-[11px] text-muted">{doneCount}/{checklist.length}</span>}
              </div>
              {checklist.length > 0 && (
                <div className="h-0.5 bg-border rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 group/item py-0.5">
                    <button onClick={() => toggleCheck(idx)}
                      className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-all',
                        item.done ? 'bg-teal border-teal' : 'border-border hover:border-royal')}>
                      {item.done && <Check size={8} strokeWidth={3} className="text-white" />}
                    </button>
                    <span className={cn('text-sm flex-1 leading-snug', item.done ? 'line-through text-muted' : 'text-blackish')}>{item.label}</span>
                    <button onClick={() => removeCheck(idx)}
                      className="text-muted hover:text-red-500 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity mt-0.5">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheck()}
                  placeholder="Add an item…"
                  className="flex-1 text-sm bg-sky border border-border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-royal/30" />
                <button onClick={addCheck} disabled={!newItem.trim()}
                  className="w-7 h-7 rounded-lg bg-royal text-white flex items-center justify-center cursor-pointer disabled:opacity-40 hover:bg-blue-700 shrink-0">
                  <Plus size={12} />
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* ── Bottom panel — 4 fixed-width columns, readable at any screen size ── */
          <>
            {/* Col 1 · Task meta */}
            <div className="w-[220px] shrink-0 px-4 py-4 border-r border-border flex flex-col gap-4 overflow-y-auto">

              {/* Time tracked — hero card */}
              <div className="bg-sky rounded-xl px-3 py-3 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Time Tracked</p>
                {[['Today', task.secondsToday], ['This Week', task.secondsThisWeek], ['Total', task.seconds]].map(([label, s]) => {
                  const secs = s as number
                  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
                  const display = secs === 0 ? '—' : h ? `${h}h ${m}m` : `${m}m`
                  return (
                    <div key={label as string} className="flex items-center justify-between">
                      <span className="text-xs text-muted">{label as string}</span>
                      <span className="text-sm font-bold text-blackish tabular-nums">{display}</span>
                    </div>
                  )
                })}
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Status</p>
                {editing ? (
                  <div className="relative inline-flex items-center w-full">
                    <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                      className={cn('text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg cursor-pointer appearance-none border focus:outline-none w-full', statusCfg.cls)}>
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 opacity-50" />
                  </div>
                ) : (
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg self-start', statusCfg.cls)}>{statusCfg.label}</span>
                )}
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Priority</p>
                {editing ? (
                  <button onClick={() => setIsUrgent(!isUrgent)}
                    className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer self-start transition-colors',
                      isUrgent ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-400 border-gray-200')}>
                    {isUrgent ? 'Urgent' : 'Normal'}
                  </button>
                ) : (
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-lg self-start',
                    task.priority === 'urgent' ? 'bg-red-100 text-red-600'
                    : task.priority === 'high'   ? 'bg-orange-50 text-orange-600'
                    : task.priority === 'medium' ? 'bg-amber-50 text-amber-600'
                    : 'bg-gray-100 text-gray-400')}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}
              </div>

              {/* Deadline */}
              {(task.deadline || editing) && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Deadline</p>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <input type="date" value={deadlineVal} onChange={e => setDeadlineVal(e.target.value)}
                        className="text-xs h-6 px-2 rounded-lg border border-border bg-white focus:outline-none cursor-pointer w-full" />
                      {deadlineVal && <button onClick={() => setDeadlineVal('')} className="text-xs text-muted hover:text-red-500 cursor-pointer self-start">Clear</button>}
                    </div>
                  ) : task.deadline ? (
                    <p className={cn('text-xs font-medium leading-snug', isPastDeadline ? 'text-red-500' : 'text-blackish/70')}>
                      {isPastDeadline && <span className="mr-0.5">⚠</span>}
                      {new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  ) : null}
                </div>
              )}

            </div>

            {/* Col 2 · Description — flex-1, absorbs remaining space */}
            <div className="flex-1 min-w-[260px] px-4 py-3 border-r border-border flex flex-col gap-2 overflow-y-auto">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Description</p>
              {editing ? (
                <textarea
                  value={descVal} onChange={e => setDescVal(e.target.value)}
                  rows={8} placeholder="Add a description…"
                  className="flex-1 w-full text-sm text-blackish bg-sky rounded-xl border border-border px-3 py-2.5 outline-none focus:ring-2 focus:ring-royal/30 resize-none leading-relaxed"
                />
              ) : (
                <p className={cn('text-sm leading-relaxed', task.description ? 'text-blackish/80' : 'text-muted/40 italic')}>
                  {task.description || 'No description yet.'}
                </p>
              )}
            </div>

            {/* Col 3 · Attachments (260px) — next to description */}
            <div className="w-[320px] shrink-0 px-4 py-3 border-r border-border overflow-y-auto flex flex-col gap-2">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Attachments</p>
              {attachments.length === 0 && !editing && (
                <p className="text-xs text-muted/40 italic">No attachments.</p>
              )}
              <div className="flex flex-col gap-1.5">
                {attachments.map(a => (
                  a.type === 'file' ? (
                    <div key={a.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-sky border border-border">
                      <FileText size={11} className="text-muted shrink-0" />
                      <span className="text-xs text-blackish flex-1 truncate">{a.fileName ?? a.value}</span>
                      {editing && <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer shrink-0"><X size={10} /></button>}
                    </div>
                  ) : (
                    <div key={a.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border bg-white hover:border-royal/40">
                      <Link2 size={11} className="text-royal shrink-0" />
                      {editing ? (
                        <>
                          <input value={a.value} onChange={e => updateAttachment(a.id, e.target.value)}
                            className="flex-1 text-xs bg-transparent outline-none min-w-0" placeholder="https://…" />
                          <button onClick={() => removeAttachment(a.id)} className="text-muted hover:text-red-500 cursor-pointer shrink-0"><X size={10} /></button>
                        </>
                      ) : (
                        <a href={a.value.startsWith('http') ? a.value : undefined} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-xs text-blackish truncate hover:text-royal">{a.value || '—'}</a>
                      )}
                    </div>
                  )
                ))}
              </div>
              {editing && (
                <div className="flex flex-col gap-1.5 mt-auto pt-1">
                  <DropZone onFiles={addFiles} />
                  <div className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border bg-white focus-within:ring-1 focus-within:ring-royal/25">
                    <Link2 size={10} className="text-muted shrink-0" />
                    <input value={linkDraft} onChange={e => setLinkDraft(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), commitLink())} onBlur={commitLink}
                      placeholder="Paste a link…" className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted/50" />
                  </div>
                </div>
              )}
            </div>

            {/* Col 4 · Checklist — fixed width, compact */}
            <div className="w-[320px] shrink-0 px-4 py-3 overflow-y-auto flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} /> Checklist
                </p>
                {checklist.length > 0 && (
                  <span className="text-[11px] text-muted">{doneCount}/{checklist.length}</span>
                )}
              </div>
              {checklist.length > 0 && (
                <div className="h-0.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
                </div>
              )}
              <div className="flex flex-col gap-1">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 group/item py-0.5">
                    <button onClick={() => toggleCheck(idx)}
                      className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer mt-0.5 transition-all',
                        item.done ? 'bg-teal border-teal' : 'border-border hover:border-royal')}>
                      {item.done && <Check size={8} strokeWidth={3} className="text-white" />}
                    </button>
                    <span className={cn('text-sm flex-1 leading-snug', item.done ? 'line-through text-muted' : 'text-blackish')}>{item.label}</span>
                    <button onClick={() => removeCheck(idx)}
                      className="text-muted hover:text-red-500 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity mt-0.5 shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                {checklist.length === 0 && !editing && (
                  <p className="text-xs text-muted/40 italic">No checklist items.</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input value={newItem} onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCheck()}
                  placeholder="Add an item…"
                  className="flex-1 text-xs bg-sky border border-border rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-royal/30 min-w-0" />
                <button onClick={addCheck} disabled={!newItem.trim()}
                  className="w-7 h-7 rounded-lg bg-royal text-white flex items-center justify-center cursor-pointer disabled:opacity-40 hover:bg-blue-700 shrink-0">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
