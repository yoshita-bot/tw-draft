import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { setSharedTasks } from '../pages/TaskDetailPage'
import { ALL_MEMBERS, PROJECTS } from '../data/projectsData'
import { getMemberById, defaultRepeat, repeatLabel, type Task, type TaskStatus, type TaskPriority, type RepeatConfig, type RepeatMode } from '../data/tasksData'

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

// ─── Repeat section (prototype design) ───────────────────────────────────────
const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MODES: { key: RepeatMode; label: string }[] = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'after',   label: 'After done' },
  { key: 'custom',  label: 'On a date' },
]

function RepeatSection({ value, onChange }: { value: RepeatConfig; onChange: (r: RepeatConfig) => void }) {
  function set<K extends keyof RepeatConfig>(key: K, val: RepeatConfig[K]) {
    onChange({ ...value, [key]: val })
  }

  const GREEN = '#1D9E75'
  const inputBase: React.CSSProperties = {
    border: '0.5px solid #E5E7EB', borderRadius: 6, padding: '7px 9px',
    fontSize: 13.5, color: '#111827', fontFamily: 'inherit', outline: 'none', background: '#fff',
  }
  const numInput: React.CSSProperties = { ...inputBase, width: 72, textAlign: 'center' }
  const selInput: React.CSSProperties = { ...inputBase, width: '100%', appearance: 'none', cursor: 'pointer' }
  const subLabel: React.CSSProperties = { fontSize: 12, color: '#6B7280', marginBottom: 6, marginTop: 10 }

  function toggleDay(i: number) {
    const days = value.weekDays.includes(i)
      ? value.weekDays.filter(d => d !== i)
      : [...value.weekDays, i].sort((a, b) => a - b)
    set('weekDays', days)
  }

  // mode-specific config panel
  function renderConfig() {
    if (value.mode === 'daily') return (
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Repeat every</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="number" min={1} value={value.dailyEvery}
            onChange={e => set('dailyEvery', Math.max(1, parseInt(e.target.value) || 1))}
            style={numInput} />
          <div style={{ position: 'relative', flex: 1 }}>
            <select value={value.dailyUnit} onChange={e => set('dailyUnit', e.target.value as RepeatConfig['dailyUnit'])} style={selInput}>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
            </select>
            <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
          </div>
        </div>
      </div>
    )

    if (value.mode === 'weekly') return (
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Repeat every</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="number" min={1} value={value.weeklyEvery}
            onChange={e => set('weeklyEvery', Math.max(1, parseInt(e.target.value) || 1))}
            style={numInput} />
          <div style={{ ...inputBase, flex: 1, opacity: 0.5, display: 'flex', alignItems: 'center' }}>week(s)</div>
        </div>
        <div style={subLabel}>On which days?</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {WEEK_DAY_LABELS.map((d, i) => {
            const on = value.weekDays.includes(i)
            return (
              <button key={i} type="button" onClick={() => toggleDay(i)} style={{
                padding: '5px 11px', borderRadius: 20, border: `0.5px solid ${on ? GREEN : '#E5E7EB'}`,
                background: on ? GREEN : '#fff', color: on ? '#fff' : '#6B7280',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{d}</button>
            )
          })}
        </div>
      </div>
    )

    if (value.mode === 'monthly') return (
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Repeat every</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="number" min={1} max={12} value={value.monthlyEvery}
            onChange={e => set('monthlyEvery', Math.max(1, parseInt(e.target.value) || 1))}
            style={numInput} />
          <div style={{ ...inputBase, flex: 1, opacity: 0.5, display: 'flex', alignItems: 'center' }}>month(s)</div>
        </div>
        <div style={subLabel}>On which day?</div>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <select value={value.monthType} onChange={e => set('monthType', e.target.value as RepeatConfig['monthType'])} style={selInput}>
            <option value="date">Specific date — e.g. the 3rd</option>
            <option value="weekday">Specific weekday — e.g. 2nd Tuesday</option>
            <option value="last">Last day of month</option>
          </select>
          <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
        </div>
        {value.monthType === 'date' && (
          <div style={{ position: 'relative' }}>
            <select value={value.monthDay}
              onChange={e => set('monthDay', parseInt(e.target.value))} style={selInput}>
              {Array.from({ length: 28 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{ordStr(i + 1)} of the month</option>
              ))}
              <option value={29}>Last day of the month</option>
            </select>
            <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
          </div>
        )}
        {value.monthType === 'weekday' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <select value={value.monthOrd} onChange={e => set('monthOrd', parseInt(e.target.value) as 1|2|3|4)} style={selInput}>
                {[1,2,3,4].map(n => <option key={n} value={n}>{['1st','2nd','3rd','4th'][n-1]}</option>)}
              </select>
              <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <select value={value.monthWd} onChange={e => set('monthWd', parseInt(e.target.value))} style={selInput}>
                {WEEK_DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
              <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
            </div>
          </div>
        )}
      </div>
    )

    if (value.mode === 'after') return (
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Reschedule after completion by</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="number" min={1} value={value.afterN}
            onChange={e => set('afterN', Math.max(1, parseInt(e.target.value) || 1))}
            style={numInput} />
          <div style={{ position: 'relative', flex: 1 }}>
            <select value={value.afterUnit} onChange={e => set('afterUnit', e.target.value as RepeatConfig['afterUnit'])} style={selInput}>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
              <option value="years">years</option>
            </select>
            <ChevronDown width={12} height={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9CA3AF' }} />
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
          Next due date is set the moment someone marks this task complete.
        </div>
      </div>
    )

    if (value.mode === 'custom') return (
      <div>
        <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>Next due date</div>
        <input type="date" value={value.customDate}
          onChange={e => set('customDate', e.target.value)}
          style={{ ...inputBase, width: '100%', marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
          Set the date manually each time. Good for irregular schedules.
        </div>
      </div>
    )

    return null
  }

  const summary = value.enabled ? repeatLabel(value) : ''

  return (
    <div style={{ borderTop: '0.5px solid #E5E7EB', paddingTop: 18 }}>
      {/* Toggle */}
      <div
        onClick={() => set('enabled', !value.enabled)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', marginBottom: value.enabled ? 16 : 0 }}
      >
        <div style={{ width: 36, height: 20, borderRadius: 10, background: value.enabled ? GREEN : '#D1D5DB', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value.enabled ? 18 : 2, transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Repeat this task</span>
      </div>

      {value.enabled && (
        <>
          {/* Segmented mode picker */}
          <div style={{ display: 'flex', border: '0.5px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            {MODES.map(m => (
              <button key={m.key} type="button" onClick={() => set('mode', m.key)} style={{
                flex: 1, padding: '7px 2px', fontSize: 12, textAlign: 'center', cursor: 'pointer',
                background: value.mode === m.key ? '#F3F4F6' : '#fff',
                color: value.mode === m.key ? '#111827' : '#6B7280',
                fontWeight: value.mode === m.key ? 500 : 400,
                border: 'none', borderRight: '0.5px solid #E5E7EB', fontFamily: 'inherit',
              }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Mode config */}
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: summary ? 10 : 0 }}>
            {renderConfig()}
          </div>

          {/* Live summary */}
          {summary && (
            <div style={{ padding: '8px 12px', border: '0.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#6B7280', background: '#fff' }}>
              Repeats: <span style={{ color: '#111827', fontWeight: 500 }}>{summary}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ordStr(n: number): string {
  const v = n % 100, s = ['th', 'st', 'nd', 'rd']
  return n + (s[(v - 20) % 10] || s[v] || s[0])
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
