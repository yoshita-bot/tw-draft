import { useState, useRef, useEffect } from 'react'
import {
  Building2, Upload, Check, ChevronDown, Plus, Trash2, Edit2, X,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'information' | 'permissions'

interface OrgInfo {
  name: string
  currency: string
  weekStart: string
  timezone: string
  logoUrl: string | null
}

interface Permission {
  id: string
  section: string
  label: string
}

interface Role {
  id: string
  name: string
  isBuiltIn: boolean
}

type PermValue = 'on' | 'default' | 'off' | 'na'

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENCIES = ['USD — US Dollar', 'EUR — Euro', 'GBP — British Pound', 'AUD — Australian Dollar', 'CAD — Canadian Dollar', 'INR — Indian Rupee', 'SGD — Singapore Dollar']
const WEEK_STARTS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney',
]

const BUILT_IN_ROLES: Role[] = [
  { id: 'org-manager', name: 'Org Manager', isBuiltIn: true },
  { id: 'project-manager', name: 'Project Manager', isBuiltIn: true },
  { id: 'project-viewer', name: 'Project Viewer', isBuiltIn: true },
]

const PERMISSIONS: Permission[] = [
  { id: 'org-permissions', section: 'ORGANIZATION', label: 'Change org level permissions (view and edit permissions tab)' },
  { id: 'invite-members', section: 'MEMBERS', label: 'Invite members or create member accounts' },
  { id: 'remove-members', section: 'MEMBERS', label: 'Remove members from the organisation' },
  { id: 'edit-member-roles', section: 'MEMBERS', label: 'Edit member roles' },
  { id: 'view-activity', section: 'ACTIVITY', label: 'View screenshots/activity for other members' },
  { id: 'delete-activity', section: 'ACTIVITY', label: 'Delete screenshots or activity records' },
  { id: 'manage-financials', section: 'FINANCIALS', label: 'Manage financials' },
  { id: 'view-financials', section: 'FINANCIALS', label: 'View financial reports' },
  { id: 'create-projects', section: 'PROJECTS', label: 'Create and archive projects' },
  { id: 'edit-projects', section: 'PROJECTS', label: 'Edit project settings' },
  { id: 'assign-members', section: 'PROJECTS', label: 'Assign members to projects' },
  { id: 'view-reports', section: 'REPORTS', label: 'View all member reports' },
  { id: 'export-reports', section: 'REPORTS', label: 'Export reports' },
  { id: 'manage-tracking', section: 'SETTINGS', label: 'Manage tracking rules' },
  { id: 'manage-security', section: 'SETTINGS', label: 'Manage security & login settings' },
]

const DEFAULT_PERM_MAP: Record<string, Record<string, PermValue>> = {
  'org-manager': {
    'org-permissions': 'on', 'invite-members': 'on', 'remove-members': 'on', 'edit-member-roles': 'on',
    'view-activity': 'on', 'delete-activity': 'on', 'manage-financials': 'on', 'view-financials': 'on',
    'create-projects': 'on', 'edit-projects': 'on', 'assign-members': 'on',
    'view-reports': 'on', 'export-reports': 'on', 'manage-tracking': 'on', 'manage-security': 'on',
  },
  'project-manager': {
    'org-permissions': 'na', 'invite-members': 'na', 'remove-members': 'na', 'edit-member-roles': 'na',
    'view-activity': 'default', 'delete-activity': 'off', 'manage-financials': 'na', 'view-financials': 'off',
    'create-projects': 'on', 'edit-projects': 'on', 'assign-members': 'on',
    'view-reports': 'on', 'export-reports': 'on', 'manage-tracking': 'off', 'manage-security': 'na',
  },
  'project-viewer': {
    'org-permissions': 'na', 'invite-members': 'na', 'remove-members': 'na', 'edit-member-roles': 'na',
    'view-activity': 'default', 'delete-activity': 'off', 'manage-financials': 'na', 'view-financials': 'off',
    'create-projects': 'off', 'edit-projects': 'off', 'assign-members': 'off',
    'view-reports': 'on', 'export-reports': 'off', 'manage-tracking': 'na', 'manage-security': 'na',
  },
}

// ── Shared: Dropdown ──────────────────────────────────────────────────────────

function Dropdown({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '8px 12px', width: '100%',
          border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`,
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          fontSize: 13, color: '#111827', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <ChevronDown width={14} height={14} color="#9CA3AF" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
        }}>
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                cursor: 'pointer', fontSize: 13,
                color: opt === value ? '#6C63FF' : '#374151',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {opt === value ? <Check width={12} height={12} style={{ flexShrink: 0 }} /> : <span style={{ width: 12 }} />}
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Information tab ────────────────────────────────────────────────────────────

function InformationTab() {
  const [info, setInfo] = useState<OrgInfo>({
    name: 'Abroadworks',
    currency: 'USD — US Dollar',
    weekStart: 'Monday',
    timezone: 'America/New_York',
    logoUrl: null,
  })
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{
        background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10,
        padding: '24px 28px', maxWidth: 560,
      }}>
        {/* Org name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Organisation name
          </label>
          <input
            value={info.name}
            onChange={e => setInfo(p => ({ ...p, name: e.target.value }))}
            style={{
              width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB',
              borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
            onFocus={e => (e.target.style.borderColor = '#6C63FF')}
            onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Logo
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 10, border: '1px solid #E5E7EB',
              background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {info.logoUrl
                ? <img src={info.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Building2 width={26} height={26} color="#D1D5DB" />}
            </div>
            <div>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff',
                  fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <Upload width={13} height={13} /> Upload logo
              </button>
              <p style={{ fontSize: 11.5, color: '#9CA3AF', margin: '5px 0 0' }}>PNG or JPG, max 2 MB</p>
              <input
                ref={fileRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) setInfo(p => ({ ...p, logoUrl: URL.createObjectURL(file) }))
                }}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #F3F4F6', margin: '20px 0' }} />

        {/* Currency */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Currency</label>
          <Dropdown value={info.currency} options={CURRENCIES} onChange={v => setInfo(p => ({ ...p, currency: v }))} />
        </div>

        {/* Week starts on */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Week starts on</label>
          <Dropdown value={info.weekStart} options={WEEK_STARTS} onChange={v => setInfo(p => ({ ...p, weekStart: v }))} />
        </div>

        {/* Timezone */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Time zone</label>
          <Dropdown value={info.timezone} options={TIMEZONES} onChange={v => setInfo(p => ({ ...p, timezone: v }))} />
        </div>

        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px',
            background: saved ? '#10B981' : '#6C63FF', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit',
          }}
        >
          {saved ? <><Check width={13} height={13} /> Saved</> : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ── Permission cell ────────────────────────────────────────────────────────────

function PermCell({ value, onChange, locked }: { value: PermValue; onChange?: (v: PermValue) => void; locked?: boolean }) {
  if (value === 'na') return <span style={{ color: '#9CA3AF', fontSize: 15, lineHeight: 1 }}>—</span>

  const cycle: PermValue[] = ['on', 'default', 'off']
  const next = () => { const i = cycle.indexOf(value); return cycle[(i + 1) % cycle.length] }

  const bgMap: Record<PermValue, string> = { on: '#3B82F6', default: '#93C5FD', off: 'transparent', na: 'transparent' }
  const borderMap: Record<PermValue, string> = { on: '#3B82F6', default: '#93C5FD', off: '#D1D5DB', na: '#D1D5DB' }

  return (
    <button
      onClick={() => !locked && onChange?.(next())}
      title={locked ? 'Built-in role — read only' : undefined}
      style={{
        width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${borderMap[value]}`,
        background: bgMap[value], cursor: locked ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0,
      }}
    >
      {(value === 'on' || value === 'default') && <Check width={11} height={11} color="#fff" strokeWidth={3} />}
    </button>
  )
}

// ── Permissions tab ────────────────────────────────────────────────────────────

function PermissionsTab() {
  const [roles, setRoles] = useState<Role[]>(BUILT_IN_ROLES)
  const [permMap, setPermMap] = useState<Record<string, Record<string, PermValue>>>(DEFAULT_PERM_MAP)
  const [addingRole, setAddingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const sections = Array.from(new Set(PERMISSIONS.map(p => p.section)))

  const handleAddRole = () => {
    const name = newRoleName.trim()
    if (!name) return
    const id = `custom-${Date.now()}`
    const defaults: Record<string, PermValue> = {}
    PERMISSIONS.forEach(p => { defaults[p.id] = 'off' })
    setRoles(r => [...r, { id, name, isBuiltIn: false }])
    setPermMap(m => ({ ...m, [id]: defaults }))
    setNewRoleName('')
    setAddingRole(false)
  }

  const handleDeleteRole = (id: string) => {
    setRoles(r => r.filter(role => role.id !== id))
    setPermMap(m => { const next = { ...m }; delete next[id]; return next })
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Left: role list */}
        <div style={{
          width: 200, flexShrink: 0,
          background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10,
          padding: '16px 12px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', margin: '0 0 10px 4px' }}>ROLES</p>
          {roles.map(role => (
            <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              {editingId === role.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const n = editName.trim()
                      if (n) setRoles(r => r.map(ro => ro.id === role.id ? { ...ro, name: n } : ro))
                      setEditingId(null)
                    }
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => setEditingId(null)}
                  style={{
                    flex: 1, padding: '6px 8px', border: '1px solid #6C63FF', borderRadius: 7,
                    fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <span style={{
                  flex: 1, padding: '6px 8px', fontSize: 13, color: '#374151',
                  borderRadius: 7, cursor: 'default',
                }}>
                  {role.name}
                </span>
              )}
              {!role.isBuiltIn && editingId !== role.id && (
                <>
                  <button onClick={() => { setEditingId(role.id); setEditName(role.name) }}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 3, color: '#9CA3AF', display: 'flex' }}>
                    <Edit2 width={12} height={12} />
                  </button>
                  <button onClick={() => handleDeleteRole(role.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 3, color: '#9CA3AF', display: 'flex' }}>
                    <Trash2 width={12} height={12} />
                  </button>
                </>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8, borderTop: '1px solid #F3F4F6', paddingTop: 10 }}>
            {addingRole ? (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  autoFocus placeholder="Role name"
                  value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddRole(); if (e.key === 'Escape') { setAddingRole(false); setNewRoleName('') } }}
                  style={{ flex: 1, padding: '5px 8px', border: '1px solid #6C63FF', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
                <button onClick={handleAddRole} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6C63FF', display: 'flex', padding: 3 }}><Check width={14} height={14} /></button>
                <button onClick={() => { setAddingRole(false); setNewRoleName('') }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 3 }}><X width={14} height={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setAddingRole(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px',
                  border: '1px dashed #D1D5DB', borderRadius: 7, background: 'transparent',
                  fontSize: 13, color: '#6B7280', cursor: 'pointer', width: '100%', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
              >
                <Plus width={13} height={13} /> Custom role
              </button>
            )}
          </div>
        </div>

        {/* Right: permissions table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', width: '50%' }}>
                    Permission
                  </th>
                  {roles.map(role => (
                    <th key={role.id} style={{ padding: '12px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sections.map(section => (
                  <>
                    <tr key={`sec-${section}`} style={{ background: '#F9FAFB' }}>
                      <td colSpan={roles.length + 1} style={{ padding: '8px 20px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em' }}>
                        {section}
                      </td>
                    </tr>
                    {PERMISSIONS.filter(p => p.section === section).map((perm, i, arr) => (
                      <tr
                        key={perm.id}
                        style={{ borderBottom: i < arr.length - 1 ? '1px solid #F5F5F5' : '1px solid #F0F0F0' }}
                      >
                        <td style={{ padding: '11px 20px', fontSize: 13, color: '#374151' }}>{perm.label}</td>
                        {roles.map(role => (
                          <td key={role.id} style={{ padding: '11px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <PermCell
                                value={permMap[role.id]?.[perm.id] ?? 'na'}
                                onChange={val => setPermMap(m => ({ ...m, [role.id]: { ...m[role.id], [perm.id]: val } }))}
                                locked={role.isBuiltIn}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrganisationPage() {
  const [tab, setTab] = useState<Tab>('information')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Settings' }, { label: 'Organisation' }]} />

      <div style={{ flex: 1, overflowY: 'auto', background: '#F7F8FA' }}>

        {/* Page header */}
        <div style={{
          padding: '20px 32px 0', background: '#fff',
          borderBottom: '1px solid #F0F0F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: '#EEEDFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 width={22} height={22} color="#6C63FF" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Organisation</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>Manage your organisation details and role-based permissions.</div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 0 }}>
            {(['information', 'permissions'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '0 20px', height: 44, border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13.5, fontWeight: 600,
                  color: tab === t ? '#6C63FF' : '#9CA3AF',
                  borderBottom: tab === t ? '2px solid #6C63FF' : '2px solid transparent',
                  fontFamily: 'inherit',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tab === 'information' && <InformationTab />}
        {tab === 'permissions' && <PermissionsTab />}
      </div>
    </div>
  )
}
