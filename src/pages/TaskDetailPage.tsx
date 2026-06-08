import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Clock, Calendar, Paperclip, RefreshCw, AlertCircle,
  Edit2, Check, X, ChevronDown, ExternalLink,
  User, Users, Briefcase, Flag,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import {
  TASKS, getMemberById, formatMinutes, repeatLabel,
  type Task, type TaskStatus, type TaskPriority, type RepeatConfig,
} from '../data/tasksData'
import { PROJECTS, ALL_MEMBERS } from '../data/projectsData'
import { ROUTES, peopleProfile, clientPage, getStateCrumbs, type Crumb } from '../lib/routes'

// ─── Shared module-level store ────────────────────────────────────────────────
let _tasks: Task[] = TASKS
let _listeners: Array<() => void> = []
export function getSharedTasks() { return _tasks }
export function setSharedTasks(fn: (prev: Task[]) => Task[]) {
  _tasks = fn(_tasks)
  _listeners.forEach(l => l())
}
export function useSharedTasks() {
  const [, forceUpdate] = useState(0)
  const listener = () => forceUpdate(n => n + 1)
  if (!_listeners.includes(listener)) _listeners.push(listener)
  return { tasks: _tasks, setTasks: setSharedTasks }
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const STATUS_META: Record<TaskStatus, { label: string; bg: string; color: string; dot: string; border: string }> = {
  inprogress: { label: 'In Progress', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE' },
  review:     { label: 'In Review',   bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', border: '#FED7AA' },
  done:       { label: 'Done',        bg: '#DCFCE7', color: '#15803D', dot: '#22C55E', border: '#BBF7D0' },
}
const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string; icon: string }> = {
  urgent: { label: 'Urgent', bg: '#FEF2F2', color: '#DC2626', icon: '🔴' },
  normal: { label: 'Normal', bg: '#F3F4F6', color: '#6B7280', icon: '🔵' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ initials, bg, fg, size = 28 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function FieldSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '100%' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', border: '1px solid #E5E7EB', borderRadius: 6,
        padding: '6px 28px 6px 10px', fontSize: 13, color: '#374151',
        background: '#fff', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', width: '100%',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: '#9CA3AF' }} />
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #D0D7DE', borderRadius: 6, padding: '8px 12px',
  fontSize: 14, color: '#1F2328', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', background: '#fff',
}

// ─── Repeat modal ─────────────────────────────────────────────────────────────
const WD_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function ordStr(n: number) {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v-20)%10] || s[v] || s[0])
}

type RepeatPreset = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

function repeatToPreset(r: RepeatConfig): RepeatPreset {
  if (!r.enabled) return 'none'
  if (r.mode === 'daily' && r.dailyEvery === 1 && r.dailyUnit === 'days') return 'daily'
  if (r.mode === 'weekly' && r.weeklyEvery === 1) return 'weekly'
  if (r.mode === 'monthly' && r.monthlyEvery === 1) return 'monthly'
  return 'custom'
}

function repeatPresetLabel(r: RepeatConfig, dow: number, dom: number): string {
  const p = repeatToPreset(r)
  if (p === 'none')    return 'Does not repeat'
  if (p === 'daily')   return 'Daily'
  if (p === 'weekly')  return `Weekly on ${WD_FULL[dow]}`
  if (p === 'monthly') return `Monthly on day ${dom}`
  return repeatLabel(r) || 'Custom'
}

function RepeatModal({ value, onClose, onSave }: {
  value: RepeatConfig
  onClose: () => void
  onSave: (r: RepeatConfig) => void
}) {
  const today = new Date()
  const dow = today.getDay()
  const dom = today.getDate()

  const [draft, setDraft] = useState<RepeatConfig>({ ...value })
  const initPreset = repeatToPreset(value)
  const [forceCustom, setForceCustom] = useState(initPreset === 'custom')
  const preset = forceCustom ? 'custom' : repeatToPreset(draft)

  const sb: React.CSSProperties = {
    width: '100%', border: '1px solid #D0D7DE', borderRadius: 6, padding: '7px 28px 7px 11px',
    fontSize: 13.5, color: '#1F2328', fontFamily: 'inherit', outline: 'none',
    appearance: 'none', background: '#fff', cursor: 'pointer',
  }
  const ib: React.CSSProperties = {
    border: '1px solid #D0D7DE', borderRadius: 6, padding: '7px 10px',
    fontSize: 13.5, color: '#1F2328', fontFamily: 'inherit', outline: 'none', background: '#fff',
  }

  function applyPreset(p: RepeatPreset) {
    if (p === 'none')    { setForceCustom(false); setDraft(d => ({ ...d, enabled: false })); return }
    if (p === 'daily')   { setForceCustom(false); setDraft(d => ({ ...d, enabled: true, mode: 'daily',   dailyEvery: 1,   dailyUnit: 'days' })); return }
    if (p === 'weekly')  { setForceCustom(false); setDraft(d => ({ ...d, enabled: true, mode: 'weekly',  weeklyEvery: 1,  weekDays: [dow] })); return }
    if (p === 'monthly') { setForceCustom(false); setDraft(d => ({ ...d, enabled: true, mode: 'monthly', monthlyEvery: 1, monthType: 'date', monthDay: dom })); return }
    setForceCustom(true)
    setDraft(d => ({ ...d, enabled: true }))
  }

  function set<K extends keyof RepeatConfig>(key: K, val: RepeatConfig[K]) {
    setDraft(d => ({ ...d, [key]: val }))
  }

  function toggleDay(i: number) {
    setDraft(d => {
      const days = d.weekDays.includes(i) ? d.weekDays.filter(x => x !== i) : [...d.weekDays, i].sort((a,b)=>a-b)
      return { ...d, weekDays: days }
    })
  }

  const everyN = draft.mode === 'weekly' ? draft.weeklyEvery : draft.mode === 'monthly' ? draft.monthlyEvery : draft.dailyEvery

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1F2328' }}>Repeat</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C8FA3', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Preset selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#8C8FA3', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Frequency</label>
            <div style={{ position: 'relative' }}>
              <select value={preset} onChange={e => applyPreset(e.target.value as RepeatPreset)} style={sb}>
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly on {WD_FULL[dow]}</option>
                <option value="monthly">Monthly on day {dom}</option>
                <option value="custom">Custom…</option>
              </select>
              <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8C8FA3' }} />
            </div>
          </div>

          {/* Custom panel */}
          {preset === 'custom' && (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#8C8FA3', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Repeats every</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" min={1} value={everyN}
                    onChange={e => {
                      const n = Math.max(1, +e.target.value || 1)
                      if (draft.mode === 'daily')   set('dailyEvery', n)
                      if (draft.mode === 'weekly')  set('weeklyEvery', n)
                      if (draft.mode === 'monthly') set('monthlyEvery', n)
                    }}
                    style={{ ...ib, width: 64, textAlign: 'center' }} />
                  <div style={{ position: 'relative', flex: 1 }}>
                    <select
                      value={draft.mode === 'monthly' ? 'month' : draft.mode === 'weekly' ? 'week' : 'day'}
                      onChange={e => {
                        const u = e.target.value
                        if (u === 'day')   setDraft(d => ({ ...d, mode: 'daily',   dailyEvery: 1,   dailyUnit: 'days' }))
                        if (u === 'week')  setDraft(d => ({ ...d, mode: 'weekly',  weeklyEvery: 1,  weekDays: d.weekDays.length ? d.weekDays : [dow] }))
                        if (u === 'month') setDraft(d => ({ ...d, mode: 'monthly', monthlyEvery: 1, monthType: 'date', monthDay: dom }))
                      }}
                      style={sb}>
                      <option value="day">day(s)</option>
                      <option value="week">week(s)</option>
                      <option value="month">month(s)</option>
                    </select>
                    <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8C8FA3' }} />
                  </div>
                </div>
              </div>

              {/* Weekly day chips */}
              {draft.mode === 'weekly' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8C8FA3', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>On</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {WD_LABELS.map((d, i) => {
                      const on = draft.weekDays.includes(i)
                      return (
                        <button key={i} type="button" onClick={() => toggleDay(i)} style={{
                          width: 36, height: 36, borderRadius: '50%',
                          border: `1px solid ${on ? '#1D9E75' : '#D0D7DE'}`,
                          background: on ? '#1D9E75' : '#fff',
                          color: on ? '#fff' : '#57606A',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}>{d[0]}</button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Monthly options */}
              {draft.mode === 'monthly' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#8C8FA3', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>On</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(['date', 'weekday', 'last'] as const).map(t => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, cursor: 'pointer', color: '#1F2328' }}>
                        <input type="radio" name="mtype-modal" checked={draft.monthType === t} onChange={() => set('monthType', t)}
                          style={{ width: 16, height: 16, accentColor: '#1D9E75', flexShrink: 0 }} />
                        {t === 'date'    && `Day ${draft.monthDay} of the month`}
                        {t === 'weekday' && `${['1st','2nd','3rd','4th'][draft.monthOrd-1]} ${WD_FULL[draft.monthWd]}`}
                        {t === 'last'    && 'Last day of month'}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary */}
          {draft.enabled && (
            <div style={{ fontSize: 12.5, color: '#57606A', background: '#F6F8FA', borderRadius: 6, padding: '8px 12px' }}>
              {repeatLabel(draft)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid #D0D7DE', background: '#fff', color: '#374151', fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={() => { onSave(draft); onClose() }}
            style={{ padding: '7px 20px', borderRadius: 20, border: 'none', background: '#1D9E75', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Compact person picker ────────────────────────────────────────────────────
function PersonPicker({ ids, onChange, pool }: {
  ids: string[]; onChange: (ids: string[]) => void; pool: typeof ALL_MEMBERS
}) {
  const sel = pool.filter(m => ids.includes(m.id))
  const unsel = pool.filter(m => !ids.includes(m.id))
  return (
    <div>
      {/* Selected as removable chips */}
      {sel.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: unsel.length ? 6 : 0 }}>
          {sel.map(m => (
            <span key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px 2px 4px', borderRadius: 99, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12, color: '#1D4ED8' }}>
              <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={16} />
              {m.name}
              <button type="button" onClick={() => onChange(ids.filter(id => id !== m.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', padding: 0, lineHeight: 1, fontSize: 14, marginLeft: 1 }}>×</button>
            </span>
          ))}
        </div>
      )}
      {/* Add dropdown */}
      {unsel.length > 0 && (
        <div style={{ position: 'relative' }}>
          <select value="" onChange={e => { if (e.target.value) onChange([...ids, e.target.value]) }}
            style={{ width: '100%', border: '1px dashed #D0D7DE', borderRadius: 6, padding: '5px 28px 5px 10px', fontSize: 12, color: '#57606A', fontFamily: 'inherit', outline: 'none', appearance: 'none', background: '#fff', cursor: 'pointer' }}>
            <option value="">+ Add person…</option>
            {unsel.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <ChevronDown width={10} height={10} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
        </div>
      )}
    </div>
  )
}

function SidebarRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ color: '#8C8FA3', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8C8FA3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
        <div>{children}</div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const ancestorCrumbs: Crumb[] = getStateCrumbs(location.state) ?? [
    { label: 'Project Management' },
    { label: 'Tasks', path: ROUTES.todos },
  ]
  const { tasks, setTasks } = useSharedTasks()

  const task = tasks.find(t => t.id === taskId)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Task | null>(null)
  const [repeatModalOpen, setRepeatModalOpen] = useState(false)

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar crumbs={[...ancestorCrumbs, { label: 'Task' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Task not found.
        </div>
      </div>
    )
  }

  const active = editing && form ? form : task
  const project = PROJECTS.find(p => p.id === active.projectId)
  const creator = getMemberById(active.createdById)
  const SM = STATUS_META[active.status]
  const PM = PRIORITY_META[active.priority]

  function startEdit() { setForm({ ...task }); setEditing(true) }
  function cancelEdit() { setForm(null); setEditing(false) }
  function saveEdit() {
    if (!form?.title.trim()) return
    setTasks(prev => prev.map(t => t.id === form.id ? form : t))
    setEditing(false); setForm(null)
  }
  function deleteTask() {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    navigate(ROUTES.todos)
  }
  function fieldUpdate<K extends keyof Task>(key: K, val: Task[K]) {
    setForm(f => f ? { ...f, [key]: val } : f)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[...ancestorCrumbs, { label: active.title }]} />

      <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F7' }}>

        {/* ── Sub-header bar ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E1E4E8', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }} />

          {/* Open in desktop app */}
          <a
            href={`timeworks://tasks/${task.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 6,
              border: '1px solid #D0D7DE', background: '#fff',
              color: '#374151', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <ExternalLink width={13} height={13} />
            Open in app
          </a>

          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveEdit} disabled={!form?.title.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: 'none', borderRadius: 6, background: '#0969DA', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Check width={13} height={13} /> Save
              </button>
              <button onClick={cancelEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #D0D7DE', borderRadius: 6, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                <X width={13} height={13} /> Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={startEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #D0D7DE', borderRadius: 6, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                <Edit2 width={12} height={12} /> Edit
              </button>
              <button onClick={deleteTask}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', border: '1px solid #FEE2E2', borderRadius: 6, background: '#FFF5F5', color: '#DC2626', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: 'flex', gap: 0, maxWidth: 1200, margin: '0 auto', padding: '0', minHeight: 'calc(100vh - 120px)' }}>

          {/* ── Left: main content ── */}
          <div style={{ flex: 1, minWidth: 0, padding: '28px 32px', borderRight: '1px solid #E1E4E8', background: '#fff' }}>

            {/* Title */}
            {editing ? (
              <input style={{ ...inputStyle, fontSize: 22, fontWeight: 700, marginBottom: 12, border: '1.5px solid #0969DA' }}
                value={form?.title ?? ''} onChange={e => fieldUpdate('title', e.target.value)} />
            ) : (
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2328', margin: '0 0 8px', lineHeight: 1.3 }}>{active.title}</h1>
            )}

            {/* Badges row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
              {editing ? (
                <>
                  <FieldSelect value={form?.status ?? active.status} onChange={v => fieldUpdate('status', v as TaskStatus)}
                    options={[{ value: 'inprogress', label: 'In Progress' }, { value: 'review', label: 'In Review' }, { value: 'done', label: 'Done' }]} />
                  <FieldSelect value={form?.priority ?? active.priority} onChange={v => fieldUpdate('priority', v as TaskPriority)}
                    options={[{ value: 'urgent', label: 'Urgent' }, { value: 'normal', label: 'Normal' }]} />
                </>
              ) : (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: SM.bg, color: SM.color, border: `1px solid ${SM.border}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: SM.dot, flexShrink: 0 }} />{SM.label}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: PM.bg, color: PM.color }}>
                    {active.priority === 'urgent' && <AlertCircle width={11} height={11} />}{PM.label}
                  </span>
                  {active.repeat.enabled && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#F0EFFE', color: '#4F46E5' }}>
                      <RefreshCw width={11} height={11} />{repeatLabel(active.repeat)}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#57606A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Description</div>
              {editing ? (
                <textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical', lineHeight: 1.6 }}
                  value={form?.description ?? ''} placeholder="Add a description…"
                  onChange={e => fieldUpdate('description', e.target.value)} />
              ) : (
                <div style={{ fontSize: 14, color: active.description ? '#1F2328' : '#8C8FA3', lineHeight: 1.75, background: active.description ? 'transparent' : '#FAFAFA', padding: active.description ? 0 : '12px 14px', borderRadius: 6, border: active.description ? 'none' : '1px dashed #D0D7DE' }}>
                  {active.description || 'No description.'}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#57606A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip width={12} height={12} /> Attachments
                {active.attachments.length > 0 && (
                  <span style={{ background: '#E1E4E8', color: '#57606A', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{active.attachments.length}</span>
                )}
              </div>
              {active.attachments.length === 0 ? (
                <div style={{ fontSize: 13, color: '#8C8FA3' }}>No attachments.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {active.attachments.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F6F8FA', borderRadius: 7, border: '1px solid #E1E4E8', fontSize: 13 }}>
                      <Paperclip width={13} height={13} color="#8C8FA3" />
                      <span style={{ flex: 1, fontWeight: 500, color: '#1F2328' }}>{a.name}</span>
                      <span style={{ color: '#8C8FA3', fontSize: 12 }}>{a.size}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Right: details sidebar ── */}
          <div style={{ width: 280, flexShrink: 0, padding: '28px 20px', background: '#F6F8FA', alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1F2328', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Details</div>

            <SidebarRow icon={<Flag width={14} height={14} />} label="Status">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: SM.bg, color: SM.color, border: `1px solid ${SM.border}` }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: SM.dot }} />{SM.label}
              </span>
            </SidebarRow>

            <SidebarRow icon={<AlertCircle width={14} height={14} />} label="Priority">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: PM.bg, color: PM.color }}>
                {active.priority === 'urgent' && <AlertCircle width={11} height={11} />}{PM.label}
              </span>
            </SidebarRow>

            <SidebarRow icon={<Briefcase width={14} height={14} />} label="Project">
              {project ? (
                <div>
                  <div onClick={() => navigate(`${ROUTES.projects}/${project.id}`)}
                    style={{ fontSize: 13, fontWeight: 600, color: '#6C63FF', cursor: 'pointer', display: 'inline' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >{project.name}</div>
                  <div onClick={() => navigate(clientPage(project.client))}
                    style={{ fontSize: 11.5, color: '#8C8FA3', marginTop: 2, cursor: 'pointer', display: 'inline-block' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >{project.client}</div>
                </div>
              ) : (
                <span style={{ fontSize: 13, color: '#8C8FA3' }}>—</span>
              )}
              {editing && (
                <div style={{ marginTop: 6 }}>
                  <FieldSelect value={form?.projectId ?? active.projectId} onChange={v => fieldUpdate('projectId', v)}
                    options={PROJECTS.map(p => ({ value: p.id, label: p.name }))} />
                </div>
              )}
            </SidebarRow>

            <SidebarRow icon={<Calendar width={14} height={14} />} label="Deadline">
              {editing ? (
                <input type="date" style={{ ...inputStyle, fontSize: 13 }} value={form?.deadline ?? ''} onChange={e => fieldUpdate('deadline', e.target.value)} />
              ) : (
                <span style={{ fontSize: 13, color: active.deadline ? '#1F2328' : '#8C8FA3' }}>
                  {active.deadline || 'No deadline'}
                </span>
              )}
            </SidebarRow>

            <SidebarRow icon={<User width={14} height={14} />} label="Managers">
              {editing ? (
                <PersonPicker
                  ids={form?.managerIds ?? []}
                  onChange={ids => fieldUpdate('managerIds', ids)}
                  pool={ALL_MEMBERS.filter(m => m.role === 'manager')}
                />
              ) : active.managerIds.length === 0 ? (
                <span style={{ fontSize: 13, color: '#8C8FA3' }}>None</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {active.managerIds.map(id => {
                    const m = getMemberById(id)
                    return m ? (
                      <div key={id} onClick={() => navigate(peopleProfile(id))}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.querySelector('span') as HTMLElement).style.textDecoration = 'underline'}
                        onMouseLeave={e => (e.currentTarget.querySelector('span') as HTMLElement).style.textDecoration = 'none'}
                      >
                        <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={22} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#6C63FF' }}>{m.name}</span>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </SidebarRow>

            <SidebarRow icon={<Users width={14} height={14} />} label="Members">
              {editing ? (
                <PersonPicker
                  ids={form?.memberIds ?? []}
                  onChange={ids => fieldUpdate('memberIds', ids)}
                  pool={ALL_MEMBERS}
                />
              ) : active.memberIds.length === 0 ? (
                <span style={{ fontSize: 13, color: '#8C8FA3' }}>None</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {active.memberIds.map(id => {
                    const m = getMemberById(id)
                    return m ? (
                      <div key={id} onClick={() => navigate(peopleProfile(id))}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.querySelector('span') as HTMLElement).style.textDecoration = 'underline'}
                        onMouseLeave={e => (e.currentTarget.querySelector('span') as HTMLElement).style.textDecoration = 'none'}
                      >
                        <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={22} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#6C63FF' }}>{m.name}</span>
                      </div>
                    ) : null
                  })}
                </div>
              )}
            </SidebarRow>

            <SidebarRow icon={<User width={14} height={14} />} label="Created by">
              {creator ? (
                <div onClick={() => navigate(peopleProfile(active.createdById))}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.querySelector('div') as HTMLElement).style.textDecoration = 'underline'}
                  onMouseLeave={e => (e.currentTarget.querySelector('div') as HTMLElement).style.textDecoration = 'none'}
                >
                  <Avatar initials={creator.initials} bg={creator.bg} fg={creator.fg} size={24} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#6C63FF' }}>{creator.name}</div>
                    <div style={{ fontSize: 11.5, color: '#8C8FA3' }}>{active.createdAt}</div>
                  </div>
                </div>
              ) : <span style={{ fontSize: 13, color: '#8C8FA3' }}>—</span>}
            </SidebarRow>

            <SidebarRow icon={<Clock width={14} height={14} />} label="Time Tracked">
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Today', mins: active.timeToday },
                  { label: 'Week', mins: active.timeWeek },
                  { label: 'Total', mins: active.timeTotal },
                ].map(({ label, mins }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: '#8C8FA3', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: mins > 0 ? '#1F2328' : '#D0D7DE' }}>{formatMinutes(mins)}</div>
                  </div>
                ))}
              </div>
            </SidebarRow>

            <SidebarRow icon={<RefreshCw width={14} height={14} />} label="Repeat">
              {editing ? (
                <button onClick={() => setRepeatModalOpen(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 99,
                  border: `1px solid ${active.repeat.enabled ? '#C4B5FD' : '#D0D7DE'}`,
                  background: active.repeat.enabled ? '#F5F3FF' : '#fff',
                  color: active.repeat.enabled ? '#4F46E5' : '#57606A',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <RefreshCw width={11} height={11} />
                  {repeatPresetLabel(form?.repeat ?? active.repeat, new Date().getDay(), new Date().getDate())}
                </button>
              ) : active.repeat.enabled ? (
                <span style={{ fontSize: 13, color: '#4F46E5', fontWeight: 500 }}>{repeatLabel(active.repeat)}</span>
              ) : (
                <span style={{ fontSize: 13, color: '#8C8FA3' }}>Not set</span>
              )}
            </SidebarRow>
          </div>
        </div>
      </div>

      {repeatModalOpen && (
        <RepeatModal
          value={form?.repeat ?? active.repeat}
          onClose={() => setRepeatModalOpen(false)}
          onSave={r => fieldUpdate('repeat', r)}
        />
      )}
    </div>
  )
}
