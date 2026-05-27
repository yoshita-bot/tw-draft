import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus, Check, Link2, Upload, Calendar, Trash2, FileText, ChevronDown, ExternalLink } from 'lucide-react'
import { TEAM_MEMBERS, CURRENT_USER } from '../../data/mockProjects'
import type { Person, Task, ChecklistItem, Attachment } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { EXTERNAL_LINKS } from '../../config'
import { cn } from '../../lib/cn'

// ── tiny helpers ────────────────────────────────────────────────────────────

function Avatar({ person, size = 6 }: { person: Person; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ backgroundColor: person.color, fontSize: size <= 5 ? 9 : 10 }}
      title={person.name}
    >
      {person.initials}
    </div>
  )
}

// ── multi-select people picker ───────────────────────────────────────────────

function PeoplePicker({
  label,
  selected,
  onChange,
  exclude = [],
}: {
  label: string
  selected: Person[]
  onChange: (p: Person[]) => void
  exclude?: Person[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = TEAM_MEMBERS.filter(
    (p) =>
      !exclude.some((ex) => ex.initials === p.initials) &&
      p.name.toLowerCase().includes(query.toLowerCase())
  )

  const toggle = (person: Person) => {
    const already = selected.some((s) => s.initials === person.initials)
    onChange(already ? selected.filter((s) => s.initials !== person.initials) : [...selected, person])
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">{label}</label>

      {/* Chips + input trigger */}
      <div
        className="min-h-[38px] w-full flex flex-wrap gap-1.5 items-center px-3 py-2 rounded-xl border border-border bg-white cursor-text focus-within:ring-2 focus-within:ring-royal/25 focus-within:border-royal/50 transition-colors"
        onClick={() => { setOpen(true) }}
      >
        {selected.map((p) => (
          <span
            key={p.initials}
            className="flex items-center gap-1 h-6 pl-1 pr-1.5 rounded-full text-[11px] font-semibold text-white"
            style={{ backgroundColor: p.color }}
          >
            <span className="text-[10px] font-bold">{p.initials}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggle(p) }}
              className="opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X size={9} />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selected.length === 0 ? `Search ${label.toLowerCase()}…` : ''}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder:text-muted/60"
        />
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {filtered.map((p) => {
            const chosen = selected.some((s) => s.initials === p.initials)
            return (
              <button
                key={p.initials}
                type="button"
                onClick={() => { toggle(p); setQuery('') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-sky transition-colors text-left"
              >
                <Avatar person={p} size={6} />
                <span className="text-sm text-blackish flex-1">{p.name}</span>
                {chosen && <Check size={13} className="text-royal" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── upload attachment row ────────────────────────────────────────────────────



function AttachmentRow({ attach, onChange, onRemove }: {
  attach: Attachment
  onChange: (val: string) => void
  onRemove: () => void
}) {
  if (attach.type === 'file') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky border border-border">
        <FileText size={14} className="text-muted shrink-0" />
        <span className="text-sm text-blackish flex-1 truncate">{attach.fileName ?? attach.value}</span>
        <button type="button" onClick={onRemove} className="text-muted hover:text-red-500 transition-colors cursor-pointer shrink-0">
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-sky flex items-center justify-center shrink-0 text-muted">
        <Link2 size={13} />
      </div>
      <input
        value={attach.value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        className="flex-1 h-8 px-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors"
      />
      <button type="button" onClick={onRemove} className="text-muted hover:text-red-500 transition-colors cursor-pointer">
        <X size={14} />
      </button>
    </div>
  )
}

// ── drag-and-drop zone ────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-all select-none',
        dragging
          ? 'border-royal bg-royal/5 scale-[1.01]'
          : 'border-border bg-sky/50 hover:border-royal/40 hover:bg-royal/5'
      )}
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-colors', dragging ? 'bg-royal text-white' : 'bg-white text-muted border border-border')}>
        <Upload size={16} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-blackish/70">
          {dragging ? 'Drop to attach' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted mt-0.5">or <span className="text-royal font-medium">click to browse</span></p>
      </div>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleChange} />
    </div>
  )
}

// ── main modal ────────────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  defaultProjectId?: string | null
  onClose: () => void
}

export function CreateTaskModal({ defaultProjectId, onClose }: CreateTaskModalProps) {
  const addTask   = useTimerStore((s) => s.addTask)
  const projects  = useTimerStore((s) => s.projects)
  const today = new Date().toISOString().slice(0, 10)

  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId ?? projects[0]?.id ?? '')

  // Core fields
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [reviewer, setReviewer]       = useState<Person[]>([CURRENT_USER])
  const [members, setMembers]         = useState<Person[]>([])
  const [status, setStatus]           = useState<Task['status']>('todo')
  const [urgent, setUrgent]           = useState(false)

  // Deadline
  const [deadline, setDeadline] = useState('')

  // Checklist
  const [checklist, setChecklist]     = useState<ChecklistItem[]>([])
  const [checkInput, setCheckInput]   = useState('')

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Repeat
  const [repeat, setRepeat]           = useState(false)
  const [repeatFreq, setRepeatFreq]   = useState<'weekly' | 'monthly'>('weekly')
  const [repeatDays, setRepeatDays]   = useState<string[]>([])
  const [repeatMonthDay, setRepeatMonthDay] = useState<number | null>(null)
  const [repeatEnd, setRepeatEnd]     = useState('')

  // Created meta (read-only display)
  const createdBy   = CURRENT_USER
  const createdDate = today

  // ── checklist helpers
  const addCheckItem = () => {
    const t = checkInput.trim()
    if (!t) return
    setChecklist((c) => [...c, { label: t, done: false }])
    setCheckInput('')
  }
  const toggleCheck = (i: number) =>
    setChecklist((c) => c.map((item, idx) => idx === i ? { ...item, done: !item.done } : item))
  const removeCheck = (i: number) =>
    setChecklist((c) => c.filter((_, idx) => idx !== i))

  // ── attachment helpers
  const [linkDraft, setLinkDraft] = useState('')
  const commitLinkDraft = () => {
    const v = linkDraft.trim()
    if (!v) return
    setAttachments((a) => [...a, { id: crypto.randomUUID(), type: 'link' as const, value: v }])
    setLinkDraft('')
  }
  const addFiles = (files: File[]) =>
    setAttachments((a) => [
      ...a,
      ...files.map((f) => ({ id: crypto.randomUUID(), type: 'file' as const, value: f.name, fileName: f.name })),
    ])
  const updateAttachment = (id: string, value: string) =>
    setAttachments((a) => a.map((x) => x.id === id ? { ...x, value } : x))
  const removeAttachment = (id: string) =>
    setAttachments((a) => a.filter((x) => x.id !== id))

  // ── submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !selectedProjectId) return

    const task: Task = {
      id: crypto.randomUUID(),
      name: name.trim(),
      seconds: 0,
      secondsToday: 0,
      secondsThisWeek: 0,
      deadline: deadline || undefined,
      assignee: reviewer[0] ?? CURRENT_USER,
      members,
      status,
      priority: urgent ? 'urgent' : 'medium',
      checklist,
      attachments,
      createdAt: today,
    }

    addTask(selectedProjectId, task)
    onClose()
  }

  // ── keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-blackish/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl shadow-blackish/10 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            New Task
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky transition-colors cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Task name */}
          <div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name…"
              required
              className="w-full text-lg font-bold text-blackish placeholder:text-muted/40 bg-transparent border-0 border-b-2 border-border focus:outline-none focus:border-royal pb-2 transition-colors"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Project</label>
            {projects.length === 0 ? (
              /* ── No projects: disabled placeholder + link, same layout as normal ── */
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    disabled
                    className="w-full h-9 pl-3 pr-8 text-sm rounded-xl border border-border bg-gray-50 appearance-none text-muted/50 cursor-not-allowed"
                  >
                    <option>No projects yet</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted/30" />
                </div>
                <a
                  href={EXTERNAL_LINKS.createProject}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 h-9 px-3 rounded-xl bg-royal text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ExternalLink size={11} /> Create a Project
                </a>
              </div>
            ) : (
              /* ── Projects exist: dropdown + link ── */
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full h-9 pl-7 pr-8 text-sm rounded-xl border border-border bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  {(() => {
                    const proj = projects.find(p => p.id === selectedProjectId)
                    return proj ? (
                      <div
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ backgroundColor: proj.color }}
                      />
                    ) : null
                  })()}
                </div>
                <a
                  href={EXTERNAL_LINKS.createProject}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 h-9 px-3 rounded-xl border border-border text-xs font-semibold text-muted hover:text-royal hover:border-royal/40 transition-colors whitespace-nowrap shrink-0"
                >
                  <ExternalLink size={11} /> New Project
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-blackish rounded-xl border border-border bg-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors resize-none"
            />
          </div>

          {/* Attachments — right after description */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Attachments</label>

            {/* Dropped / added rows */}
            {attachments.length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {attachments.map((a) => (
                  <AttachmentRow
                    key={a.id}
                    attach={a}
                    onChange={(v) => updateAttachment(a.id, v)}
                    onRemove={() => removeAttachment(a.id)}
                  />
                ))}
              </div>
            )}

            {/* Drag-and-drop zone */}
            <DropZone onFiles={addFiles} />

            {/* Persistent link input */}
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

          {/* Reviewer + Members side by side */}
          <div className="grid grid-cols-2 gap-4">
            <PeoplePicker label="Reviewer" selected={reviewer} onChange={setReviewer} />
            <PeoplePicker label="Members" selected={members} onChange={setMembers} />
          </div>

          {/* Status + Urgent */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                  className="w-full h-9 pl-3 pr-8 text-sm rounded-xl border border-border bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors cursor-pointer"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Priority</label>
              <button
                type="button"
                onClick={() => setUrgent(!urgent)}
                className={cn(
                  'h-9 px-4 rounded-xl border text-sm font-semibold transition-colors cursor-pointer focus:outline-none',
                  urgent
                    ? 'bg-red-100 text-red-600 border-red-200'
                    : 'bg-white text-gray-400 border-border hover:border-red-200 hover:text-red-400'
                )}
              >
                ● Urgent
              </button>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Deadline</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={deadline}
                min={today}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 h-9 px-3 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors cursor-pointer"
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="h-9 px-3 rounded-xl border border-border text-xs text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            {!deadline && (
              <p className="text-[11px] text-muted/60 mt-1">Optional — leave blank if no deadline</p>
            )}
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Checklist</label>

            {checklist.length > 0 && (
              <ul className="flex flex-col gap-1 mb-2">
                {checklist.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 group/item">
                    <button
                      type="button"
                      onClick={() => toggleCheck(i)}
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors cursor-pointer',
                        item.done ? 'bg-teal border-teal' : 'border-gray-300 hover:border-teal'
                      )}
                    >
                      {item.done && <Check size={9} className="text-white" strokeWidth={3} />}
                    </button>
                    <span className={cn('text-sm flex-1', item.done ? 'line-through text-muted' : 'text-blackish')}>
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCheck(i)}
                      className="opacity-0 group-hover/item:opacity-100 text-muted hover:text-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2">
              <input
                value={checkInput}
                onChange={(e) => setCheckInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCheckItem() } }}
                placeholder="Add checklist item…"
                className="flex-1 h-8 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors"
              />
              <button
                type="button"
                onClick={addCheckItem}
                className="h-8 w-8 rounded-lg bg-sky flex items-center justify-center text-muted hover:bg-royal hover:text-white transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Repeat */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Repeat</label>
              {/* Toggle uses inline style — avoids Tailwind v4 dynamic class glitch */}
              <button
                type="button"
                onClick={() => setRepeat(!repeat)}
                role="switch"
                aria-checked={repeat}
                style={{
                  width: 36, height: 20, borderRadius: 10, padding: 0, border: 'none',
                  backgroundColor: repeat ? '#0863C9' : '#d1d5db',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background-color 0.2s', flexShrink: 0, outline: 'none',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2,
                  left: repeat ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>

            {repeat && (
              <div className="flex flex-col gap-4 p-4 bg-sky/50 rounded-xl border border-border">
                {/* Frequency toggle */}
                <div className="flex items-center bg-white rounded-lg p-0.5 border border-border self-start">
                  {(['weekly', 'monthly'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setRepeatFreq(f)}
                      className={cn(
                        'h-7 px-4 rounded-md text-xs font-semibold transition-all cursor-pointer capitalize',
                        repeatFreq === f ? 'bg-royal text-white shadow-sm' : 'text-muted hover:text-blackish'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {/* Day of week */}
                {repeatFreq === 'weekly' && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Repeat on</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                        const on = repeatDays.includes(day)
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setRepeatDays((d) => on ? d.filter((x) => x !== day) : [...d, day])}
                            className={cn(
                              'w-10 h-9 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                              on
                                ? 'bg-royal text-white'
                                : 'bg-white border border-border text-muted hover:border-royal/50 hover:text-royal'
                            )}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Day of month */}
                {repeatFreq === 'monthly' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted whitespace-nowrap">Repeat on day</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={repeatMonthDay ?? ''}
                      onChange={(e) => setRepeatMonthDay(e.target.value ? Math.min(31, Math.max(1, Number(e.target.value))) : null)}
                      placeholder="1–31"
                      className="w-20 h-8 px-3 text-sm font-semibold rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors"
                    />
                  </div>
                )}

                {/* End date */}
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-muted shrink-0" />
                  <span className="text-xs text-muted whitespace-nowrap">Ends on</span>
                  <input
                    type="date"
                    value={repeatEnd}
                    min={today}
                    onChange={(e) => setRepeatEnd(e.target.value)}
                    className="flex-1 h-8 px-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Created by / date (read-only) */}
          <div className="flex items-center gap-4 text-xs text-muted border-t border-border pt-4">
            <div className="flex items-center gap-1.5">
              <span>Created by</span>
              <Avatar person={createdBy} size={5} />
              <span className="font-medium text-blackish/70">{createdBy.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={11} />
              <span>{new Date(createdDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0 bg-sky/40">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl text-sm font-semibold text-muted hover:text-blackish hover:bg-sky transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            onClick={handleSubmit}
            disabled={projects.length === 0}
            className={cn(
              'h-9 px-5 rounded-xl text-sm font-semibold transition-colors focus:outline-none',
              projects.length === 0
                ? 'bg-gray-100 text-muted/40 cursor-not-allowed'
                : 'bg-royal text-white hover:bg-blue-700 cursor-pointer shadow-sm shadow-royal/20'
            )}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}
