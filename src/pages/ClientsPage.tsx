import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Globe, Users, Briefcase, Calendar, Plus, Upload, ImageIcon } from 'lucide-react'
import { TopBar, type Crumb } from '../components/TopBar'
import { CLIENTS, type Client, type ClientStatus } from '../data/clientsData'
import { EMPLOYEES } from '../data/employeesData'
import { PROJECTS } from '../data/projectsData'
import { ROUTES } from '../lib/routes'

// ── Derived data ──────────────────────────────────────────────────────────────

function buildClientStats() {
  const empCount: Record<string, number> = {}
  const projectCount: Record<string, number> = {}

  EMPLOYEES.forEach(e => {
    empCount[e.clientId] = (empCount[e.clientId] ?? 0) + 1
  })

  PROJECTS.forEach(p => {
    const client = CLIENTS.find(c => c.name === p.client || c.shortName === p.client)
    if (client) projectCount[client.id] = (projectCount[client.id] ?? 0) + 1
  })

  return { empCount, projectCount }
}

const { empCount, projectCount } = buildClientStats()

// ── Badge helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ClientStatus, { bg: string; color: string; dot: string; label: string }> = {
  active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A', label: 'Active' },
  inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF', label: 'Inactive' },
  onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04', label: 'Onboarding' },
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
      borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

function ClientDot({ color }: { color: string }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: color + '22',
      border: `2px solid ${color}44`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
    </div>
  )
}

function UtcChip({ offset }: { offset: number }) {
  const sign = offset >= 0 ? '+' : ''
  return (
    <span style={{ fontSize: 12, color: '#6B7280', fontVariantNumeric: 'tabular-nums' }}>
      UTC{sign}{offset}
    </span>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 13px', borderRadius: 99, border: 'none', cursor: 'pointer',
        fontSize: 12.5, fontWeight: 600,
        background: active ? '#6C63FF' : '#F3F4F6',
        color: active ? '#fff' : '#374151',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatJoined(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Main page ─────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'employees' | 'projects' | 'status' | 'joined' | 'avgBilling' | 'thisMonth'
type SortDir = 'asc' | 'desc'

export function ClientsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' })
  const [addingClient, setAddingClient] = useState(false)

  const filtered = useMemo(() => {
    let list = CLIENTS
    if (query) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter)

    return [...list].sort((a, b) => {
      let cmp = 0
      if (sort.key === 'name') cmp = a.name.localeCompare(b.name)
      else if (sort.key === 'employees') cmp = (empCount[a.id] ?? 0) - (empCount[b.id] ?? 0)
      else if (sort.key === 'projects') cmp = (projectCount[a.id] ?? 0) - (projectCount[b.id] ?? 0)
      else if (sort.key === 'status') cmp = a.status.localeCompare(b.status)
      else if (sort.key === 'joined') cmp = a.joinedAt.localeCompare(b.joinedAt)
      else if (sort.key === 'avgBilling') cmp = a.avgMonthlyBilling - b.avgMonthlyBilling
      else if (sort.key === 'thisMonth') cmp = a.thisMonthBilling - b.thisMonthBilling
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [query, statusFilter, sort])

  function toggleSort(key: SortKey) {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  function SortArrow({ colKey }: { colKey: SortKey }) {
    if (sort.key !== colKey) return <span style={{ color: '#D1D5DB', fontSize: 10 }}>↕</span>
    return <span style={{ color: '#6C63FF', fontSize: 10 }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
  }

  const thStyle = (colKey: SortKey): React.CSSProperties => ({
    padding: '12px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600,
    color: '#6B7280', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar crumbs={[{ label: 'Clients' }] satisfies Crumb[]} />

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px 0',
        flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '7px 11px', minWidth: 220,
        }}>
          <Search width={14} height={14} color="#9CA3AF" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search clients…"
            style={{
              border: 'none', background: 'transparent', outline: 'none',
              fontSize: 13, color: '#111827', width: '100%',
            }}
          />
          {query && (
            <X width={13} height={13} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={() => setQuery('')} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Status:</span>
          {(['all', 'active', 'onboarding', 'inactive'] as const).map(s => (
            <FilterPill
              key={s}
              label={s === 'all' ? 'All' : STATUS_STYLES[s].label}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            />
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#9CA3AF', fontWeight: 500 }}>
          {filtered.length} client{filtered.length !== 1 ? 's' : ''}
        </span>

        <button
          onClick={() => setAddingClient(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: '#6C63FF', color: '#fff', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#5B53EE')}
          onMouseLeave={e => (e.currentTarget.style.background = '#6C63FF')}
        >
          <Plus width={14} height={14} /> Add Client
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '24%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
              <th style={{ ...thStyle('name'), paddingLeft: 14, borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('name')}>
                Client <SortArrow colKey="name" />
              </th>
              <th style={{ ...thStyle('status'), borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('status')}>
                Status <SortArrow colKey="status" />
              </th>
              <th style={{ ...thStyle('joined'), borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('joined')}>
                Joined <SortArrow colKey="joined" />
              </th>
              <th style={{ ...thStyle('employees'), borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('employees')}>
                Users <SortArrow colKey="employees" />
              </th>
              <th style={{ ...thStyle('projects'), borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('projects')}>
                Projects <SortArrow colKey="projects" />
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' }}>
                Timezone
              </th>
              <th style={{ ...thStyle('thisMonth'), borderBottom: '1px solid #F3F4F6' }}
                onClick={() => toggleSort('thisMonth')}>
                Billing <SortArrow colKey="thisMonth" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px 0', color: '#9CA3AF', fontSize: 14 }}>
                  No clients match your filters.
                </td>
              </tr>
            )}
            {filtered.map((client, i) => (
              <ClientRow
                key={client.id}
                client={client}
                employees={empCount[client.id] ?? 0}
                projects={projectCount[client.id] ?? 0}
                zebra={i % 2 === 1}
                onClick={() => navigate(`${ROUTES.clients}/${client.id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {addingClient && <AddClientModal onClose={() => setAddingClient(false)} />}
    </div>
  )
}

// ── Add Client Modal ──────────────────────────────────────────────────────────

function AddClientModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [status, setStatus] = useState<ClientStatus>('active')
  const [website, setWebsite] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const canSubmit = name.trim().length > 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, width: 520, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.16)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 24px 0' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', flex: 1 }}>Add Client</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6 }}>
            <X width={16} height={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Logo upload */}
          <div>
            <label style={lbl}>Brand Logo</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                border: '1.5px dashed #E5E7EB', borderRadius: 10,
                padding: '14px 18px', cursor: 'pointer', background: '#FAFAFA',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6C63FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'contain', background: '#F3F4F6' }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon width={22} height={22} color="#D1D5DB" />
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 3 }}>
                  <Upload width={13} height={13} color="#6C63FF" />
                  {logoPreview ? 'Change logo' : 'Upload logo'}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>PNG, JPG or SVG · Drag & drop or click</div>
              </div>
              {logoPreview && (
                <button
                  onClick={e => { e.stopPropagation(); setLogoPreview(null) }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                >
                  <X width={14} height={14} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>

          {/* Client name — prominent */}
          <div>
            <label style={{ ...lbl, fontSize: 13 }}>Client name <Required /></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              style={{ ...inp, fontSize: 18, fontWeight: 700, padding: '11px 14px', color: '#111827' }}
              autoFocus
            />
          </div>

          {/* Status */}
          <div>
            <label style={lbl}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ClientStatus)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Timezone + Website */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {[
                  'America/New_York', 'America/Chicago', 'America/Denver',
                  'America/Los_Angeles', 'America/Toronto', 'Europe/London',
                  'Europe/Amsterdam', 'Asia/Manila', 'Asia/Tokyo', 'Australia/Sydney',
                ].map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Website</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" style={inp} />
            </div>
          </div>

          {/* Primary contact */}
          <div>
            <label style={{ ...lbl, marginBottom: 10 }}>Primary contact</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact name" style={inp} />
              <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Contact email" type="email" style={inp} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes about this client…"
              rows={3}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 24px', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={onClose}
            disabled={!canSubmit}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSubmit ? '#6C63FF' : '#E5E7EB',
              color: canSubmit ? '#fff' : '#9CA3AF',
              fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  )
}

function Required() {
  return <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5,
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 7, border: '1px solid #E5E7EB',
  fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  background: '#fff',
}

const cancelBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB',
  background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151',
  cursor: 'pointer', fontFamily: 'inherit',
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ClientRow({
  client, employees, projects, zebra, onClick,
}: {
  client: Client
  employees: number
  projects: number
  zebra: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const diff = client.thisMonthBilling - client.avgMonthlyBilling
  const diffColor = diff > 0 ? '#16A34A' : '#DC2626'

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#F5F3FF' : zebra ? '#FAFAFA' : '#fff',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      {/* Client name */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClientDot color={client.color} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{client.name}</div>
            {client.shortName !== client.name && (
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>{client.shortName}</div>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <StatusBadge status={client.status} />
      </td>

      {/* Joined */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar width={12} height={12} color="#9CA3AF" />
          <span style={{ fontSize: 12.5, color: '#374151' }}>{formatJoined(client.joinedAt)}</span>
        </div>
      </td>

      {/* Users */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        {employees > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users width={12} height={12} color="#6C63FF" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{employees}</span>
          </div>
        ) : (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        )}
      </td>

      {/* Projects */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        {projects > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Briefcase width={12} height={12} color="#0EA5E9" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{projects}</span>
          </div>
        ) : (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        )}
      </td>

      {/* Timezone */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Globe width={12} height={12} color="#9CA3AF" />
          <UtcChip offset={client.utcOffset} />
        </div>
      </td>

      {/* Billing — avg + this month */}
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #F3F4F6' }}>
        {client.avgMonthlyBilling > 0 || client.thisMonthBilling > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', width: 62 }}>This month</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                {client.thisMonthBilling > 0 ? `$${client.thisMonthBilling.toLocaleString('en-US')}` : '—'}
              </span>
              {client.avgMonthlyBilling > 0 && client.thisMonthBilling > 0 && diff !== 0 && (
                <span style={{ fontSize: 11, color: diffColor, fontWeight: 600 }}>
                  {diff > 0 ? '+' : ''}{diff.toLocaleString('en-US')}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', width: 62 }}>Avg / mo</span>
              <span style={{ fontSize: 12.5, color: '#6B7280' }}>
                {client.avgMonthlyBilling > 0 ? `$${client.avgMonthlyBilling.toLocaleString('en-US')}` : '—'}
              </span>
            </div>
          </div>
        ) : (
          <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
        )}
      </td>
    </tr>
  )
}
