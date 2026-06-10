import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { setSharedTasks } from '../pages/TaskDetailPage'
import { ALL_MEMBERS, PROJECTS } from '../data/projectsData'
import { getMemberById, defaultRepeat, repeatLabel, type Task, type TaskStatus, type TaskPriority, type RepeatConfig } from '../data/tasksData'

const CURRENT_USER_ID = 'm1'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ initials, bg, fg, size = 22 }: { initials: string; bg: string; fg: string; size?: number }) {
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

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 32px 9px 12px',
    fontSize: 13.5, color: '#111827', fontFamily: 'inherit', outline: 'none',
    appearance: 'none', background: '#fff', cursor: 'pointer',
  }
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'block' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown width={14} height={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
      </div>
    </div>
  )
}

// ─── Repeat section ───────────────────────────────────────────────────────────
const WD_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

type RepeatPreset = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

function repeatToPreset(r: RepeatConfig): RepeatPreset {
  if (!r.enabled) return 'none'
  if (r.mode === 'daily' && r.dailyEvery === 1 && r.dailyUnit === 'days') return 'daily'
  if (r.mode === 'weekly' && r.weeklyEvery === 1) return 'weekly'
  if (r.mode === 'monthly' && r.monthlyEvery === 1) return 'monthly'
  return 'custom'
}

function RepeatSection({ value, onChange }: { value: RepeatConfig; onChange: (r: RepeatConfig) => void }) {
  const today = new Date()
  const dow = today.getDay()
  const dom = today.getDate()

  const [forceCustom, setForceCustom] = useState(repeatToPreset(value) === 'custom')
  const preset = forceCustom ? 'custom' : repeatToPreset(value)

  const sb: React.CSSProperties = {
    width: '100%', border: '1px solid #E5E7EB', borderRadius: 6, padding: '7px 28px 7px 11px',
    fontSize: 13.5, color: '#1F2328', fontFamily: 'inherit', outline: 'none',
    appearance: 'none', background: '#fff', cursor: 'pointer',
  }
  const ib: React.CSSProperties = {
    border: '1px solid #E5E7EB', borderRadius: 6, padding: '7px 10px',
    fontSize: 13.5, color: '#1F2328', fontFamily: 'inherit', outline: 'none', background: '#fff',
  }

  function set<K extends keyof RepeatConfig>(key: K, val: RepeatConfig[K]) {
    onChange({ ...value, [key]: val })
  }

  function applyPreset(p: RepeatPreset) {
    if (p === 'none')    { setForceCustom(false); onChange({ ...value, enabled: false }); return }
    if (p === 'daily')   { setForceCustom(false); onChange({ ...value, enabled: true, mode: 'daily',   dailyEvery: 1,   dailyUnit: 'days' }); return }
    if (p === 'weekly')  { setForceCustom(false); onChange({ ...value, enabled: true, mode: 'weekly',  weeklyEvery: 1,  weekDays: [dow] }); return }
    if (p === 'monthly') { setForceCustom(false); onChange({ ...value, enabled: true, mode: 'monthly', monthlyEvery: 1, monthType: 'date', monthDays: [dom] }); return }
    setForceCustom(true)
    onChange({ ...value, enabled: true })
  }

  function toggleDay(i: number) {
    const days = value.weekDays.includes(i)
      ? value.weekDays.filter(d => d !== i)
      : [...value.weekDays, i].sort((a, b) => a - b)
    set('weekDays', days)
  }

  function toggleMonthDay(d: number) {
    const days = value.monthDays.includes(d)
      ? value.monthDays.filter(x => x !== d)
      : [...value.monthDays, d].sort((a, b) => a - b)
    set('monthDays', days)
  }

  const everyN = value.mode === 'weekly' ? value.weeklyEvery : value.mode === 'monthly' ? value.monthlyEvery : value.dailyEvery

  return (
    <div style={{ borderTop: '0.5px solid #E5E7EB', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Frequency dropdown */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Frequency</label>
        <div style={{ position: 'relative' }}>
          <select value={preset} onChange={e => applyPreset(e.target.value as RepeatPreset)} style={sb}>
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly on {WD_FULL[dow]}</option>
            <option value="monthly">Monthly on day {dom}</option>
            <option value="custom">Custom…</option>
          </select>
          <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
        </div>
      </div>

      {/* Custom panel */}
      {preset === 'custom' && (
        <>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Repeats every</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min={1} value={everyN}
                onChange={e => {
                  const n = Math.max(1, +e.target.value || 1)
                  if (value.mode === 'daily')   set('dailyEvery', n)
                  if (value.mode === 'weekly')  set('weeklyEvery', n)
                  if (value.mode === 'monthly') set('monthlyEvery', n)
                }}
                style={{ ...ib, width: 64, textAlign: 'center' }} />
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={value.mode === 'monthly' ? 'month' : value.mode === 'weekly' ? 'week' : 'day'}
                  onChange={e => {
                    const u = e.target.value
                    if (u === 'day')   onChange({ ...value, mode: 'daily',   dailyEvery: 1,   dailyUnit: 'days' })
                    if (u === 'week')  onChange({ ...value, mode: 'weekly',  weeklyEvery: 1,  weekDays: value.weekDays.length ? value.weekDays : [dow] })
                    if (u === 'month') onChange({ ...value, mode: 'monthly', monthlyEvery: 1, monthType: 'date', monthDays: [dom] })
                  }}
                  style={sb}>
                  <option value="day">day(s)</option>
                  <option value="week">week(s)</option>
                  <option value="month">month(s)</option>
                </select>
                <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
              </div>
            </div>
          </div>

          {value.mode === 'weekly' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>On</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {WD_LABELS.map((d, i) => {
                  const on = value.weekDays.includes(i)
                  return (
                    <button key={i} type="button" onClick={() => toggleDay(i)} style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: `1px solid ${on ? '#1D9E75' : '#E5E7EB'}`,
                      background: on ? '#1D9E75' : '#fff',
                      color: on ? '#fff' : '#6B7280',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{d[0]}</button>
                  )
                })}
              </div>
            </div>
          )}

          {value.mode === 'monthly' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>On</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = i + 1
                  const on = value.monthDays.includes(d)
                  return (
                    <button key={d} type="button" onClick={() => toggleMonthDay(d)} style={{
                      width: 34, height: 30, borderRadius: 6,
                      border: `1px solid ${on ? '#1D9E75' : '#E5E7EB'}`,
                      background: on ? '#1D9E75' : '#fff',
                      color: on ? '#fff' : '#6B7280',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}>{d}</button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      {value.enabled && (
        <div style={{ fontSize: 12.5, color: '#57606A', background: '#F6F8FA', borderRadius: 6, padding: '8px 12px' }}>
          {repeatLabel(value)}
        </div>
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function NewTaskModal({ onClose, defaultProjectId }: { onClose: () => void; defaultProjectId?: string }) {
  const [form, setForm] = useState<Omit<Task, 'id'>>({
    title: '', description: '',
    projectId: defaultProjectId ?? PROJECTS[0]?.id ?? '',
    status: 'inprogress', priority: 'normal',
    deadline: '', repeat: defaultRepeat(),
    attachments: [],
    managerIds: [CURRENT_USER_ID], memberIds: [],
    createdById: CURRENT_USER_ID,
    createdAt: new Date().toISOString().slice(0, 10),
    timeToday: 0, timeWeek: 0, timeTotal: 0,
  })

  function field<K extends keyof Task>(key: K, val: Task[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function togglePerson(key: 'managerIds' | 'memberIds', id: string) {
    setForm(f => {
      const arr = f[key] as string[]
      return { ...f, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] }
    })
  }

  function create() {
    if (!form.title.trim()) return
    setSharedTasks(prev => [...prev, { id: `t${Date.now()}`, ...form }])
    onClose()
  }

  const creator = getMemberById(form.createdById)

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 12px',
    fontSize: 13.5, color: '#111827', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box', background: '#fff',
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: 6, display: 'block',
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 620, maxHeight: '92vh', background: '#fff', borderRadius: 14, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 24px 16px', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#111827', flex: 1 }}>New Task</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', borderRadius: 6 }}>
            <X width={20} height={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title — prominent, underline style */}
          <div>
            <input
              style={{ ...inputStyle, fontSize: 18, fontWeight: 700, border: 'none', borderBottom: '2px solid #2563EB', borderRadius: 0, padding: '4px 0', background: 'transparent' }}
              value={form.title}
              placeholder="Task title"
              onChange={e => field('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Project */}
          <SelectField
            label="Project"
            value={form.projectId}
            onChange={v => field('projectId', v)}
            options={PROJECTS.map(p => ({ value: p.id, label: `${p.name} · ${p.client}` }))}
          />

          {/* Description */}
          <div>
            <label style={sectionLabel}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.description}
              placeholder="What needs to be done?"
              onChange={e => field('description', e.target.value)}
            />
          </div>

          {/* Managers + Members */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={sectionLabel}>Managers</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_MEMBERS.filter(m => m.role === 'manager').map(m => {
                  const sel = form.managerIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => togglePerson('managerIds', m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${sel ? '#2563EB' : '#E5E7EB'}`, background: sel ? '#EFF6FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: sel ? '#1D4ED8' : '#374151' }}>
                      <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={20} />{m.name}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={sectionLabel}>Members</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ALL_MEMBERS.map(m => {
                  const sel = form.memberIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" onClick={() => togglePerson('memberIds', m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${sel ? '#2563EB' : '#E5E7EB'}`, background: sel ? '#EFF6FF' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, color: sel ? '#1D4ED8' : '#374151' }}>
                      <Avatar initials={m.initials} bg={m.bg} fg={m.fg} size={20} />{m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Status + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <SelectField label="Status" value={form.status} onChange={v => field('status', v as TaskStatus)}
              options={[{ value: 'inprogress', label: 'In Progress' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' }]} />
            <div>
              <label style={sectionLabel}>Priority</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['urgent', 'normal'] as TaskPriority[]).map(p => (
                  <button key={p} type="button" onClick={() => field('priority', p)} style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${form.priority === p ? (p === 'urgent' ? '#DC2626' : '#2563EB') : '#E5E7EB'}`,
                    background: form.priority === p ? (p === 'urgent' ? '#FEF2F2' : '#EFF6FF') : '#fff',
                    color: form.priority === p ? (p === 'urgent' ? '#DC2626' : '#1D4ED8') : '#6B7280',
                  }}>
                    {p === 'urgent' ? '🔴 Urgent' : 'Normal'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label style={sectionLabel}>Deadline</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="date" value={form.deadline} onChange={e => field('deadline', e.target.value)}
                style={{ ...inputStyle, flex: 1 }} />
              {form.deadline && (
                <button type="button" onClick={() => field('deadline', '')}
                  style={{ padding: '9px 14px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', color: '#6B7280', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Repeat */}
          <RepeatSection value={form.repeat} onChange={r => field('repeat', r)} />

          {/* Created by (auto) */}
          <div style={{ display: 'flex', gap: 24, paddingTop: 4, borderTop: '1px solid #F3F4F6', fontSize: 12.5, color: '#9CA3AF', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span>Created by</span>
              {creator && <Avatar initials={creator.initials} bg={creator.bg} fg={creator.fg} size={20} />}
              <span style={{ color: '#374151', fontWeight: 500 }}>{creator?.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🗓</span>
              <span style={{ color: '#374151' }}>{form.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={create} disabled={!form.title.trim()} style={{
            flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
            background: form.title.trim() ? '#2563EB' : '#E5E7EB',
            color: form.title.trim() ? '#fff' : '#9CA3AF',
            fontWeight: 700, fontSize: 14, cursor: form.title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}>
            Create Task
          </button>
        </div>
      </div>
    </div>
  )
}
