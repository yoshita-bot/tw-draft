import { useState, useMemo, useRef, useEffect } from 'react'
import { Shield, Search, X, ChevronDown, Check } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES } from '../data/employeesData'
import { CLIENT_MAP } from '../data/clientsData'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TwoFARecord {
  employeeId: string
  enabled: boolean
}

// ── Avatar ────────────────────────────────────────────────────────────────────

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

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: checked ? '#6C63FF' : '#D1D5DB',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0,
      }}
      title={checked ? 'Disable 2FA' : 'Enable 2FA'}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── Multi-select dropdown ──────────────────────────────────────────────────────

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
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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

// ── Main page ─────────────────────────────────────────────────────────────────

export function SecurityPage() {
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set())
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set())
  const [memberFilter, setMemberFilter] = useState<Set<string>>(new Set())

  const [twoFA, setTwoFA] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EMPLOYEES.map(e => [e.id, false]))
  )

  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Build filter option lists
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

  // Filtered employee list
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

  const filteredIds = useMemo(() => new Set(filtered.map(e => e.id)), [filtered])
  const allVisibleSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id))
  const someVisibleSelected = filtered.some(e => selected.has(e.id))

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(e => next.delete(e.id))
        return next
      })
    } else {
      setSelected(prev => new Set([...prev, ...filtered.map(e => e.id)]))
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function bulkSet(enabled: boolean) {
    setTwoFA(prev => {
      const next = { ...prev }
      selected.forEach(id => { next[id] = enabled })
      return next
    })
  }

  const enabledCount = Object.values(twoFA).filter(Boolean).length
  const selectedArr = [...selected]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Settings' }, { label: 'Security & Login' }]} />

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
            <Shield width={22} height={22} color="#6C63FF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Security &amp; Login</div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              Manage two-factor authentication (2FA) for all employees.
              {' '}<span style={{ color: '#6C63FF', fontWeight: 600 }}>{enabledCount}</span> of {EMPLOYEES.length} employees have 2FA enabled.
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 32px' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            flexWrap: 'wrap',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '0 0 220px' }}>
              <Search width={14} height={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search employees…"
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

            <MultiSelect label="Client" options={clientOptions} selected={clientFilter} onChange={setClientFilter} />
            <MultiSelect label="Project" options={projectOptions} selected={projectFilter} onChange={setProjectFilter} />
            <MultiSelect label="Members" options={memberOptions} selected={memberFilter} onChange={setMemberFilter} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {selected.size > 0 && (
                <>
                  <span style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {selected.size} selected
                  </span>
                  <button
                    onClick={() => bulkSet(true)}
                    style={{
                      padding: '6px 14px', border: 'none', borderRadius: 7,
                      background: '#6C63FF', color: '#fff', fontSize: 12.5,
                      fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Enable 2FA
                  </button>
                  <button
                    onClick={() => bulkSet(false)}
                    style={{
                      padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 7,
                      background: '#fff', color: '#374151', fontSize: 12.5,
                      fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Disable 2FA
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    style={{
                      width: 28, height: 28, border: '1px solid #E5E7EB', borderRadius: 7,
                      background: '#fff', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                    title="Clear selection"
                  >
                    <X width={13} height={13} color="#6B7280" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                  <th style={{ width: 44, padding: '11px 16px', textAlign: 'center' }}>
                    <div
                      onClick={toggleSelectAll}
                      style={{
                        width: 16, height: 16, borderRadius: 4, cursor: 'pointer', margin: '0 auto',
                        border: `1.5px solid ${allVisibleSelected ? '#6C63FF' : someVisibleSelected ? '#6C63FF' : '#D1D5DB'}`,
                        background: allVisibleSelected ? '#6C63FF' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {allVisibleSelected && <Check width={10} height={10} color="#fff" strokeWidth={2.5} />}
                      {someVisibleSelected && !allVisibleSelected && (
                        <div style={{ width: 8, height: 2, background: '#6C63FF', borderRadius: 1 }} />
                      )}
                    </div>
                  </th>
                  {['Employee', 'Client', 'Projects', '2FA Status', 'Enable 2FA'].map(h => (
                    <th key={h} style={{
                      padding: '11px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, color: '#9CA3AF',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                      No employees match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, i) => {
                    const client = CLIENT_MAP[emp.clientId]
                    const isSelected = selected.has(emp.id)
                    const isEnabled = twoFA[emp.id]

                    return (
                      <tr
                        key={emp.id}
                        style={{
                          borderBottom: i < filtered.length - 1 ? '1px solid #F5F5F5' : 'none',
                          background: isSelected ? '#F5F3FF' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAFA' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isSelected ? '#F5F3FF' : 'transparent' }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div
                            onClick={() => toggleSelect(emp.id)}
                            style={{
                              width: 16, height: 16, borderRadius: 4, cursor: 'pointer', margin: '0 auto',
                              border: `1.5px solid ${isSelected ? '#6C63FF' : '#D1D5DB'}`,
                              background: isSelected ? '#6C63FF' : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {isSelected && <Check width={10} height={10} color="#fff" strokeWidth={2.5} />}
                          </div>
                        </td>

                        {/* Employee */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar initials={emp.initials} bg={emp.bg} fg={emp.fg} />
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{emp.name}</div>
                              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{emp.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Client */}
                        <td style={{ padding: '12px 16px' }}>
                          {client ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: client.color, flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: '#374151' }}>{client.name}</span>
                            </div>
                          ) : (
                            <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                          )}
                        </td>

                        {/* Projects */}
                        <td style={{ padding: '12px 16px' }}>
                          {emp.projects.length === 0 ? (
                            <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {emp.projects.map(p => (
                                <span key={p} style={{
                                  padding: '2px 8px', borderRadius: 99, fontSize: 11.5,
                                  background: '#F3F4F6', color: '#374151', fontWeight: 500,
                                  whiteSpace: 'nowrap',
                                }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* 2FA Status */}
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 99, fontSize: 12,
                            fontWeight: 600,
                            background: isEnabled ? '#DCFCE7' : '#F3F4F6',
                            color: isEnabled ? '#15803D' : '#6B7280',
                          }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%',
                              background: isEnabled ? '#16A34A' : '#9CA3AF',
                            }} />
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>

                        {/* Toggle */}
                        <td style={{ padding: '12px 16px' }}>
                          <Toggle
                            checked={isEnabled}
                            onChange={v => setTwoFA(prev => ({ ...prev, [emp.id]: v }))}
                          />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div style={{ marginTop: 10, fontSize: 12.5, color: '#9CA3AF' }}>
            Showing {filtered.length} of {EMPLOYEES.length} employees
          </div>
        </div>
      </div>
    </div>
  )
}
