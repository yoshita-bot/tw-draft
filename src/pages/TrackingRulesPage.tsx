import { useState, useMemo, useRef, useEffect } from 'react'
import { SlidersHorizontal, Search, X, ChevronDown, Check, Info } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES } from '../data/employeesData'
import { CLIENT_MAP } from '../data/clientsData'

// ── Types ──────────────────────────────────────────────────────────────────────

type Role = 'Employee' | 'Manager' | 'Admin' | 'Viewer'
type GracePeriod = '0 min' | '5 min' | '10 min' | '15 min' | '30 min' | '45 min'

interface TrackingRule {
  role: Role
  screenshotBlur: boolean
  screenshotDisable: boolean
  gracePeriod: GracePeriod
  hipaa: boolean
}

// ── Small components ───────────────────────────────────────────────────────────

function Avatar({ initials, bg, fg }: { initials: string; bg: string; fg: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', background: bg, color: fg,
      fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function Toggle({ checked, onChange, title }: { checked: boolean; onChange: (v: boolean) => void; title?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      title={title}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: checked ? '#6C63FF' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function SimpleDropdown<T extends string>({
  value, options, onChange,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
          border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`,
          borderRadius: 7, background: '#fff', cursor: 'pointer',
          fontSize: 12.5, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap',
        }}
      >
        {value}
        <ChevronDown
          width={12} height={12} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
          minWidth: 130,
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', cursor: 'pointer', fontSize: 12.5,
                color: opt === value ? '#6C63FF' : '#374151',
                fontWeight: opt === value ? 600 : 400,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MultiSelect({
  label, options, selected, onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const displayLabel = selected.size === 0
    ? label
    : selected.size === 1
      ? options.find(o => selected.has(o.value))?.label ?? label
      : `${label} (${selected.size})`

  function toggle(val: string) {
    const next = new Set(selected)
    next.has(val) ? next.delete(val) : next.add(val)
    onChange(next)
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
          border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`,
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          fontSize: 13, color: selected.size > 0 ? '#111827' : '#6B7280',
          fontWeight: selected.size > 0 ? 500 : 400, whiteSpace: 'nowrap',
        }}
      >
        {displayLabel}
        {selected.size > 0 && (
          <span
            onClick={e => { e.stopPropagation(); onChange(new Set()) }}
            style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF' }}
          >
            <X width={12} height={12} />
          </span>
        )}
        <ChevronDown
          width={13} height={13} color="#9CA3AF"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
          minWidth: 180, maxHeight: 260, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => toggle(opt.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                color: '#374151',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${selected.has(opt.value) ? '#6C63FF' : '#D1D5DB'}`,
                background: selected.has(opt.value) ? '#6C63FF' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected.has(opt.value) && <Check width={10} height={10} color="#fff" strokeWidth={2.5} />}
              </div>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── HIPAA info banner ─────────────────────────────────────────────────────────

function HipaaInfoBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div style={{
      background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
      padding: '14px 18px', marginBottom: 20,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#E0E7FF',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
      }}>
        <Info width={16} height={16} color="#4F46E5" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3730A3', marginBottom: 4 }}>
          HIPAA Compliance
        </div>
        <div style={{ fontSize: 12.5, color: '#4338CA', lineHeight: 1.55 }}>
          Members listed below have HIPAA compliance enabled. Their screenshots are retained for 90 days,
          visible only to explicitly authorized viewers, and two-factor authentication (2FA) is required
          for their accounts.
          <br />
          <span style={{ color: '#6366F1' }}>
            Disabling HIPAA compliance for a member will remove these enhanced data protection restrictions.
          </span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'center' }}
      >
        <X width={14} height={14} color="#818CF8" />
      </button>
    </div>
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES: Role[]         = ['Employee', 'Manager', 'Admin', 'Viewer']
const GRACE_PERIODS: GracePeriod[] = ['0 min', '5 min', '10 min', '15 min', '30 min', '45 min']

// ── Main page ─────────────────────────────────────────────────────────────────

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, indeterminate, onClick }: { checked: boolean; indeterminate?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 16, height: 16, borderRadius: 4, cursor: 'pointer', margin: '0 auto',
        border: `1.5px solid ${checked || indeterminate ? '#6C63FF' : '#D1D5DB'}`,
        background: checked ? '#6C63FF' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {checked && <Check width={10} height={10} color="#fff" strokeWidth={2.5} />}
      {indeterminate && !checked && <div style={{ width: 8, height: 2, background: '#6C63FF', borderRadius: 1 }} />}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function TrackingRulesPage() {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set())
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set())
  const [memberFilter, setMemberFilter] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [rules, setRules] = useState<Record<string, TrackingRule>>(() =>
    Object.fromEntries(EMPLOYEES.map(e => [e.id, {
      role: 'Employee' as Role,
      screenshotBlur: false,
      screenshotDisable: false,
      gracePeriod: '5 min' as GracePeriod,
      hipaa: false,
    }]))
  )

  const clientOptions = useMemo(() =>
    Object.values(CLIENT_MAP)
      .filter(c => c.id !== 'internal')
      .map(c => ({ value: c.id, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  const projectOptions = useMemo(() => {
    const all = new Set<string>()
    EMPLOYEES.forEach(e => e.projects.forEach(p => all.add(p)))
    return [...all].sort().map(p => ({ value: p, label: p }))
  }, [])

  const memberOptions = useMemo(() =>
    EMPLOYEES.map(e => ({ value: e.id, label: e.name })).sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return EMPLOYEES.filter(emp => {
      if (q && !emp.name.toLowerCase().includes(q) && !emp.email.toLowerCase().includes(q)) return false
      if (clientFilter.size > 0 && !clientFilter.has(emp.clientId)) return false
      if (projectFilter.size > 0 && !emp.projects.some(p => projectFilter.has(p))) return false
      if (memberFilter.size > 0 && !memberFilter.has(emp.id)) return false
      return true
    })
  }, [search, clientFilter, projectFilter, memberFilter])

  const allVisibleSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id))
  const someVisibleSelected = filtered.some(e => selected.has(e.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(prev => { const n = new Set(prev); filtered.forEach(e => n.delete(e.id)); return n })
    } else {
      setSelected(prev => new Set([...prev, ...filtered.map(e => e.id)]))
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function patchRule<K extends keyof TrackingRule>(id: string, key: K, value: TrackingRule[K]) {
    setRules(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }

  function bulkPatch<K extends keyof TrackingRule>(key: K, value: TrackingRule[K]) {
    setRules(prev => {
      const next = { ...prev }
      selected.forEach(id => { next[id] = { ...next[id], [key]: value } })
      return next
    })
  }

  const hipaaCount = Object.values(rules).filter(r => r.hipaa).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Settings' }, { label: 'Member Configurations' }]} />

      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F8FA' }}>

        {/* Page header */}
        <div style={{
          padding: '20px 32px 16px', background: '#fff',
          borderBottom: '1px solid #F0F0F0',
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: '#EEEDFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <SlidersHorizontal width={22} height={22} color="#6C63FF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 3 }}>
              Member Configurations
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Configure screenshot settings, roles, grace periods, and HIPAA compliance per member.
              {hipaaCount > 0 && (
                <> <span style={{ color: '#6C63FF', fontWeight: 600 }}>{hipaaCount}</span> member{hipaaCount !== 1 ? 's have' : ' has'} HIPAA compliance enabled.</>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 32px' }}>

          <HipaaInfoBanner />

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: '0 0 220px' }}>
              <Search width={14} height={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                style={{
                  width: '100%', paddingLeft: 32, paddingRight: search ? 28 : 10,
                  paddingTop: 7, paddingBottom: 7,
                  border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13,
                  outline: 'none', background: '#fff', color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  <X width={13} height={13} color="#9CA3AF" />
                </button>
              )}
            </div>

            <MultiSelect label="Client"  options={clientOptions}  selected={clientFilter}  onChange={setClientFilter}  />
            <MultiSelect label="Members" options={memberOptions}  selected={memberFilter}  onChange={setMemberFilter}  />
            <MultiSelect label="Project" options={projectOptions} selected={projectFilter} onChange={setProjectFilter} />

            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>
                  {selected.size} selected
                </span>

                <button onClick={() => bulkPatch('screenshotBlur', true)} style={bulkBtnStyle('#6C63FF', '#fff')}>
                  Blur On
                </button>
                <button onClick={() => bulkPatch('screenshotBlur', false)} style={bulkBtnStyle('#fff', '#374151', true)}>
                  Blur Off
                </button>

                <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />

                <button onClick={() => bulkPatch('screenshotDisable', true)} style={bulkBtnStyle('#6C63FF', '#fff')}>
                  Disable Screenshots
                </button>
                <button onClick={() => bulkPatch('screenshotDisable', false)} style={bulkBtnStyle('#fff', '#374151', true)}>
                  Enable Screenshots
                </button>

                <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />

                <button onClick={() => bulkPatch('hipaa', true)} style={bulkBtnStyle('#6C63FF', '#fff')}>
                  HIPAA On
                </button>
                <button onClick={() => bulkPatch('hipaa', false)} style={bulkBtnStyle('#fff', '#374151', true)}>
                  HIPAA Off
                </button>

                <button
                  onClick={() => setSelected(new Set())}
                  style={{
                    width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 7,
                    background: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                  title="Clear selection"
                >
                  <X width={13} height={13} color="#6B7280" />
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                    {/* Select-all checkbox */}
                    <th style={{ width: 44, padding: '11px 16px', textAlign: 'center' }}>
                      <Checkbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected && !allVisibleSelected}
                        onClick={toggleSelectAll}
                      />
                    </th>
                    {[
                      { label: 'Member',              width: 210 },
                      { label: 'Role',                width: 140 },
                      { label: 'Screenshot Blur',     width: 130 },
                      { label: 'Disable Screenshots', width: 150 },
                      { label: 'Grace Period',        width: 130 },
                      { label: 'HIPAA Compliance',    width: 140 },
                    ].map(h => (
                      <th key={h.label} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#9CA3AF',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap', width: h.width,
                      }}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                        No members match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp, i) => {
                      const rule = rules[emp.id]
                      const isSelected = selected.has(emp.id)
                      const isLast = i === filtered.length - 1

                      return (
                        <tr
                          key={emp.id}
                          style={{
                            borderBottom: isLast ? 'none' : '1px solid #F5F5F5',
                            background: isSelected ? '#F5F3FF' : rule.hipaa ? '#FAFAF8' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = rule.hipaa ? '#F5F3EA' : '#FAFAFA'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? '#F5F3FF' : rule.hipaa ? '#FAFAF8' : 'transparent'
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <Checkbox checked={isSelected} onClick={() => toggleSelect(emp.id)} />
                          </td>

                          {/* Member */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar initials={emp.initials} bg={emp.bg} fg={emp.fg} />
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{emp.name}</div>
                                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{emp.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '12px 16px' }}>
                            <SimpleDropdown<Role>
                              value={rule.role}
                              options={ROLES}
                              onChange={v => patchRule(emp.id, 'role', v)}
                            />
                          </td>

                          {/* Screenshot blur */}
                          <td style={{ padding: '12px 16px' }}>
                            <Toggle
                              checked={rule.screenshotBlur}
                              onChange={v => patchRule(emp.id, 'screenshotBlur', v)}
                              title={rule.screenshotBlur ? 'Disable screenshot blur' : 'Enable screenshot blur'}
                            />
                          </td>

                          {/* Screenshot disable */}
                          <td style={{ padding: '12px 16px' }}>
                            <Toggle
                              checked={rule.screenshotDisable}
                              onChange={v => patchRule(emp.id, 'screenshotDisable', v)}
                              title={rule.screenshotDisable ? 'Re-enable screenshots' : 'Disable screenshots'}
                            />
                          </td>

                          {/* Grace period */}
                          <td style={{ padding: '12px 16px' }}>
                            <SimpleDropdown<GracePeriod>
                              value={rule.gracePeriod}
                              options={GRACE_PERIODS}
                              onChange={v => patchRule(emp.id, 'gracePeriod', v)}
                            />
                          </td>

                          {/* HIPAA */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Toggle
                                checked={rule.hipaa}
                                onChange={v => patchRule(emp.id, 'hipaa', v)}
                                title={rule.hipaa ? 'Disable HIPAA compliance' : 'Enable HIPAA compliance'}
                              />
                              {rule.hipaa && (
                                <span style={{
                                  fontSize: 11, fontWeight: 600, padding: '2px 7px',
                                  borderRadius: 99, background: '#FEF9C3', color: '#92400E',
                                  whiteSpace: 'nowrap',
                                }}>
                                  HIPAA
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12.5, color: '#9CA3AF' }}>
            Showing {filtered.length} of {EMPLOYEES.length} members
          </div>
        </div>
      </div>
    </div>
  )
}

function bulkBtnStyle(bg: string, color: string, bordered = false): React.CSSProperties {
  return {
    padding: '6px 12px', border: bordered ? '1px solid #E5E7EB' : 'none',
    borderRadius: 7, background: bg, color, fontSize: 12.5,
    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  }
}
