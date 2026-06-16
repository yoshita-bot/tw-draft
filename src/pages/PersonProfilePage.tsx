import React, { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Mail, Phone, MapPin, Globe, Calendar, Monitor,
  DollarSign, Clock, AlertTriangle, Check, Pencil, X, Plus, Trash2,
  Briefcase, Camera,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import {
  EMPLOYEE_MAP, SCHEDULE_TYPE_LABELS,
  getWorkDayList,
  type Employee,
} from '../data/employeesData'
import { CLIENT_MAP, CLIENTS } from '../data/clientsData'
import type { EmploymentType as EmpType } from '../data/employeesData'
import type { PayType } from '../data/employeesData'
import { PROJECTS } from '../data/projectsData'
import { PROFILE_MAP, type PaymentRecord } from '../data/profileData'
import { ROUTES, activityForWorker, workSessionsForMember, timeEditsForMember, timeOffForMember } from '../lib/routes'
import { avatarStyle } from '../utils/avatar'
import {
  _hash, TodaysScreenshotsWidget, WorkSessionsWidget,
  TimeEditsWidget, LeavesWidget, ScheduleCard, TODAY_WS,
  generateSessionsPreview,
} from '../components/profileWidgets'


const inputStyle: React.CSSProperties = {
  fontSize: 13, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 6,
  outline: 'none', width: '100%', color: '#111827', background: '#fff',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

function InfoRow({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 12.5, color: '#6B7280', fontWeight: 500, flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontFamily: mono ? 'monospace' : undefined, textAlign: 'right' }}>{children}</span>
    </div>
  )
}

const numInputStyle: React.CSSProperties = {
  fontSize: 13, padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: 6,
  outline: 'none', width: 90, color: '#111827', background: '#fff',
}

const PAY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: '#F0FDF4', color: '#15803D', label: 'Paid' },
  pending: { bg: '#FFFBEB', color: '#B45309', label: 'Pending' },
  failed:  { bg: '#FEF2F2', color: '#DC2626', label: 'Failed' },
}
function PayBadge({ status }: { status: string }) {
  const s = PAY_BADGE[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: s.bg, color: s.color }}>{s.label}</span>
}

const PROJECT_CLIENT_BY_NAME: Record<string, string> = Object.fromEntries(
  PROJECTS.map(p => [p.name, p.client])
)
const PROJECT_ID_BY_NAME: Record<string, string> = Object.fromEntries(
  PROJECTS.map(p => [p.name, p.id])
)

function ProjectEditPanel({ assigned, onAdd, onRemove }: { assigned: string[]; onAdd: (p: string) => void; onRemove: (p: string) => void }) {
  const all = PROJECTS.map(p => p.name)
  const unassigned = all.filter(p => !assigned.includes(p))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {assigned.map(p => (
        <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F0EFFE', borderRadius: 8, border: '1px solid #DDD9FD' }}>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{p}</span>
          <button onClick={() => onRemove(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 2, display: 'flex' }}>
            <X width={13} height={13} />
          </button>
        </div>
      ))}
      {unassigned.length > 0 && (
        <select onChange={e => { if (e.target.value) { onAdd(e.target.value); e.target.value = '' } }}
          style={{ ...inputStyle, color: '#6B7280', marginTop: 4 }}>
          <option value="">+ Add project…</option>
          {unassigned.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
    </div>
  )
}

let _payIdCounter = 0
function newPayId() { return `pay-${Date.now()}-${++_payIdCounter}` }

function fmtDate(ds: string | undefined) {
  if (!ds) return '—'
  const [y, m, d] = ds.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`
}

function fmtTz(tz: string | undefined) {
  if (!tz) return '—'
  return tz.replace(/_/g, ' ')
}

function Avatar({ initials, bg, fg, size = 32 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

const SCHED_BADGE: Record<string, { bg: string; color: string }> = {
  fixed:          { bg: '#EFF6FF', color: '#1D4ED8' },
  free:           { bg: '#F0FDF4', color: '#15803D' },
  'free-overlap': { bg: '#FEF3C7', color: '#92400E' },
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'info' | 'activity' | 'payments' | 'worktime' | 'client'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Activity',           icon: <Camera width={14} height={14} /> },
  { id: 'worktime', label: 'Work Time & Limits', icon: <Clock width={14} height={14} /> },
  { id: 'payments', label: 'Payments',           icon: <DollarSign width={14} height={14} /> },
  { id: 'client',   label: 'Client & Projects',  icon: <Briefcase width={14} height={14} /> },
  { id: 'info',     label: 'Info',               icon: <Monitor width={14} height={14} /> },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export function PersonProfilePage() {
  const { workerId } = useParams<{ workerId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('activity')
  const [isEditing, setIsEditing] = useState(false)

  const emp = workerId ? EMPLOYEE_MAP[workerId] : undefined
  const profile = workerId ? PROFILE_MAP[workerId] : undefined

  const buildDraft = useCallback((): Draft => ({
    name: emp!.name,
    role: emp!.role,
    status: emp!.status as Status,
    email: emp!.email,
    dateJoined: emp!.dateJoined,
    homeTimezone: emp!.homeTimezone,
    employmentType: emp!.employmentType as EmpType,
    payType: emp!.payType as PayType,
    location: profile!.location,
    workPhone: profile!.phones.work,
    personalPhone: profile!.phones.personal,
    projects: [...emp!.projects],
    billRate: emp!.billRate,
    payRate: emp!.payRate,
    paymentHistory: profile!.paymentHistory.map(r => ({ ...r })),
    maxHoursPerDay: profile!.workLimits.maxHoursPerDay,
    maxHoursPerWeek: profile!.workLimits.maxHoursPerWeek,
    breakRequiredAfterH: profile!.workLimits.breakRequiredAfterH,
    allowedDaysNote: profile!.workLimits.allowedDaysNote,
    timeTrackingEnabled: emp!.timeTrackingEnabled,
    notes: profile!.workLimits.notes,
  }), [emp, profile])

  const [draft, setDraft] = useState<Draft>(() => emp && profile ? buildDraft() : {} as Draft)
  const [saved, setSaved] = useState<Draft>(() => emp && profile ? buildDraft() : {} as Draft)

  if (!emp || !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <TopBar crumbs={[{ label: 'People', path: ROUTES.people }, { label: 'Profile' }]} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14 }}>
          Member not found.
        </div>
      </div>
    )
  }

  function set<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft(d => ({ ...d, [key]: val }))
  }

  function handleSave() {
    setSaved({ ...draft })
    setIsEditing(false)
  }

  function handleCancel() {
    setDraft({ ...saved })
    setIsEditing(false)
  }

  const statusColors: Record<Status, { bg: string; color: string; dot: string }> = {
    active:     { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
    inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
    onboarding: { bg: '#FEF3C7', color: '#92400E', dot: '#CA8A04' },
  }
  const sc = statusColors[saved.status]
  const empTypeLabel: Record<EmpType, string> = {
    'full-time': 'Full-time', 'part-time': 'Part-time', 'contractor': 'Contractor',
  }
  const schedBadge = SCHED_BADGE[emp.scheduleType] ?? SCHED_BADGE.free
  const workDays = getWorkDayList(emp)
  const client = CLIENT_MAP[emp.clientId]

  // Add / remove project
  function toggleProject(name: string) {
    const has = draft.projects.includes(name)
    set('projects', has ? draft.projects.filter(p => p !== name) : [...draft.projects, name])
  }

  // Payment row helpers
  function updatePayRec(idx: number, field: keyof PaymentRecord, val: string | number) {
    const next = draft.paymentHistory.map((r, i) => i === idx ? { ...r, [field]: val } : r)
    set('paymentHistory', next)
  }
  function addPayRec() {
    set('paymentHistory', [...draft.paymentHistory, {
      id: newPayId(), date: new Date().toISOString().slice(0, 10),
      amount: 0, period: '', method: 'Bank transfer', status: 'pending' as const,
    }])
  }
  function removePayRec(idx: number) {
    set('paymentHistory', draft.paymentHistory.filter((_, i) => i !== idx))
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
  }
  const btnSecondary: React.CSSProperties = {
    ...btnBase, padding: '8px 14px', fontWeight: 500,
    background: '#fff', border: '1px solid #D1D5DB', color: '#374151',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'People', path: ROUTES.people }, { label: emp.name }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* Back */}
        <button
          onClick={() => navigate(ROUTES.people)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', marginBottom: 20, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#111827' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
        >
          <ArrowLeft width={14} height={14} /> Back to People
        </button>

        {/* ── Hero card ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '24px 28px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Avatar — larger */}
          <Avatar initials={emp.initials} bg={avatarStyle(emp.name).bg} fg={avatarStyle(emp.name).color} size={64} />

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>{emp.name}</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: sc.bg, color: sc.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
              </span>
            </div>

            {/* Role */}
            <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500, marginBottom: 14 }}>{emp.role}</div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F3F4F6', marginBottom: 14 }} />

            {/* Tags row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {client && (
                <a href={`${ROUTES.people}?client=${encodeURIComponent(client.name)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#374151', textDecoration: 'none', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: client.color, flexShrink: 0 }} />
                  {client.name}
                </a>
              )}
              <span style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                {empTypeLabel[emp.employmentType as EmpType]}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: emp.payType === 'hourly' ? '#F0FDF4' : '#FFF1F2', color: emp.payType === 'hourly' ? '#15803D' : '#BE185D', border: `1px solid ${emp.payType === 'hourly' ? '#BBF7D0' : '#FECDD3'}` }}>
                {emp.payType === 'hourly' ? 'Hourly' : 'Monthly salary'}
              </span>
            </div>
          </div>

          {/* Key meta — pill grid */}
          <div style={{ borderLeft: '1px solid #F3F4F6', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {[
              { icon: <MapPin   width={12} height={12} />, label: 'Location',  val: profile.location },
              { icon: <Mail     width={12} height={12} />, label: 'Email',     val: emp.email,         href: `mailto:${emp.email}` },
              { icon: <Globe    width={12} height={12} />, label: 'Timezone',  val: fmtTz(emp.homeTimezone) },
              { icon: <Phone    width={12} height={12} />, label: 'Phone',     val: profile.phones.work },
              { icon: <Calendar width={12} height={12} />, label: 'Joined',    val: fmtDate(emp.dateJoined) },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 8,
                background: '#F9FAFB', border: '1px solid #F0F0F0',
              }}>
                <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 50 }}>{item.label}</span>
                <span style={{ width: 1, height: 12, background: '#E5E7EB', flexShrink: 0 }} />
                {item.href
                  ? <a href={item.href} style={{ fontSize: 12.5, fontWeight: 500, color: '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#374151' }}
                    >{item.val}</a>
                  : <span style={{ fontSize: 12.5, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>{item.val}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar + edit controls ── */}
        <div style={{ background: '#fff', borderLeft: '1px solid #E8E8E8', borderRight: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', borderRadius: '0 0 10px 10px', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); if (isEditing) handleCancel() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '12px 20px', border: 'none', background: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500,
                    color: active ? '#6C63FF' : '#6B7280',
                    borderBottom: active ? '2px solid #6C63FF' : '2px solid transparent',
                    marginBottom: -1, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#374151' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#6B7280' }}
                >
                  <span style={{ color: active ? '#6C63FF' : '#9CA3AF', display: 'flex' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Edit / Save / Cancel */}
          <div style={{ display: 'flex', gap: 8, padding: '0 16px' }}>
            {isEditing ? (
              <>
                <button onClick={handleSave} style={{ ...btnBase, background: '#6C63FF', color: '#fff' }}>
                  <Check width={13} height={13} /> Save
                </button>
                <button onClick={handleCancel} style={btnSecondary}>
                  <X width={13} height={13} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={btnSecondary}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                <Pencil width={13} height={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Contact */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Contact & Identity</div>

              <InfoRow label="Personal Phone">
                {isEditing
                  ? <input value={draft.personalPhone} onChange={e => set('personalPhone', e.target.value)} style={inputStyle} />
                  : saved.personalPhone}
              </InfoRow>

              <InfoRow label="IP Address" mono>
                {profile.ipAddress}
              </InfoRow>

              <InfoRow label="App Version" mono>
                {profile.appVersion}
              </InfoRow>

              <InfoRow label="Operating System">
                {profile.operatingSystem}
              </InfoRow>

              {isEditing && <>
                <InfoRow label="Email">
                  <input value={draft.email} onChange={e => set('email', e.target.value)} style={inputStyle} type="email" />
                </InfoRow>
                <InfoRow label="Work Phone">
                  <input value={draft.workPhone} onChange={e => set('workPhone', e.target.value)} style={inputStyle} />
                </InfoRow>
                <InfoRow label="Location">
                  <input value={draft.location} onChange={e => set('location', e.target.value)} style={inputStyle} />
                </InfoRow>
                <InfoRow label="Timezone">
                  <input value={draft.homeTimezone} onChange={e => set('homeTimezone', e.target.value)} style={inputStyle} placeholder="e.g. America/New_York" />
                </InfoRow>
                <InfoRow label="Date Joined">
                  <input value={draft.dateJoined} onChange={e => set('dateJoined', e.target.value)} style={inputStyle} type="date" />
                </InfoRow>
              </>}
            </div>

            <LeavesWidget empId={workerId!} empName={emp.name} />

            {/* Security & Access */}
            {(() => {
              const s = _hash(`${workerId}_security`)
              const twoFAEnabled   = s % 3 !== 0
              const twoFARequired  = s % 5 !== 0
              const sessionTimeout = [15, 30, 60, 120, 240][s % 5]
              const loginMethods   = ['Email + Password', ...(s % 4 !== 0 ? ['Google SSO'] : []), ...(s % 7 === 0 ? ['Microsoft SSO'] : [])]
              const daysAgo        = 1 + (s % 14)
              const [lyr, lmo, ldy] = TODAY_WS.split('-').map(Number)
              const lastLoginDate   = new Date(Date.UTC(lyr, lmo - 1, ldy))
              lastLoginDate.setUTCDate(lastLoginDate.getUTCDate() - daysAgo)
              const lastLogin = lastLoginDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
              const failedAttempts = s % 10 === 0 ? 2 + (s % 3) : 0

              const StatusPill = ({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: on ? '#F0FDF4' : '#F3F4F6', color: on ? '#15803D' : '#9CA3AF' }}>
                  {on ? <Check width={10} height={10} strokeWidth={2.5} /> : null}
                  {on ? onLabel : offLabel}
                </span>
              )

              return (
                <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Security & Access</div>

                  <InfoRow label="2FA Required">
                    {isEditing
                      ? <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked={twoFARequired} style={{ accentColor: '#6C63FF', width: 15, height: 15 }} />
                          <span style={{ fontSize: 13, color: '#374151' }}>Required for this account</span>
                        </label>
                      : <StatusPill on={twoFARequired} onLabel="Required" offLabel="Not required" />}
                  </InfoRow>

                  <InfoRow label="2FA Status">
                    <StatusPill on={twoFAEnabled} onLabel="Enabled" offLabel="Not set up" />
                  </InfoRow>

                  <InfoRow label="Login Methods">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {loginMethods.map(m => (
                        <span key={m} style={{ fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 6, background: '#F3F4F6', color: '#374151' }}>{m}</span>
                      ))}
                    </div>
                  </InfoRow>

                  <InfoRow label="Session Timeout">
                    {isEditing
                      ? <select defaultValue={sessionTimeout} style={{ ...selectStyle, width: 160 }}>
                          {[15, 30, 60, 120, 240].map(m => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h`}</option>)}
                        </select>
                      : <span style={{ fontSize: 13, color: '#374151' }}>{sessionTimeout < 60 ? `${sessionTimeout} min` : `${sessionTimeout / 60}h`}</span>}
                  </InfoRow>

                  <InfoRow label="Last Login">
                    <span style={{ fontSize: 13, color: '#374151' }}>{lastLogin}</span>
                  </InfoRow>

                  {failedAttempts > 0 && (
                    <InfoRow label="Failed Logins">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#DC2626' }}>
                        <AlertTriangle width={13} height={13} />
                        {failedAttempts} failed attempt{failedAttempts !== 1 ? 's' : ''} recently
                      </span>
                    </InfoRow>
                  )}
                </div>
              )
            })()}

          </div>
        )}

        {/* ── Tab: Client & Projects ── */}
        {activeTab === 'client' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Clients widget */}
            {(() => {
              const clientNames = [...new Set(
                saved.projects.map(p => PROJECT_CLIENT_BY_NAME[p]).filter(Boolean)
              )]
              const clientObjs = clientNames
                .map(name => CLIENTS.find(c => c.name === name || c.shortName === name))
                .filter(Boolean) as typeof CLIENTS

              if (clientObjs.length === 0) return null

              const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
                active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' },
                inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
                onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04' },
              }

              return (
                <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                    Clients
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {clientObjs.map(c => {
                      const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.inactive
                      const clientProjects = saved.projects.filter(p =>
                        PROJECT_CLIENT_BY_NAME[p] === c.name || PROJECT_CLIENT_BY_NAME[p] === c.shortName
                      )
                      const s2 = _hash(`${workerId}_${c.id}_joined`)
                      const daysBack = 180 + (s2 % 900)
                      const [jyr, jmo, jdy] = TODAY_WS.split('-').map(Number)
                      const addedDate = new Date(Date.UTC(jyr, jmo - 1, jdy))
                      addedDate.setUTCDate(addedDate.getUTCDate() - daysBack)
                      const addedLabel = addedDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })

                      const totalMins = 60 + (s2 % 18000)
                      const totalH = Math.floor(totalMins / 60), totalM = totalMins % 60
                      const totalLabel = totalH > 0 ? `${totalH}h${totalM > 0 ? ` ${totalM}m` : ''}` : `${totalM}m`

                      const industry = c.industry !== '—' ? c.industry : null

                      return (
                        <div key={c.id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + '22', border: `1.5px solid ${c.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ width: 11, height: 11, borderRadius: '50%', background: c.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link
                                  to={`${ROUTES.clients}/${c.id}`}
                                  style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', textDecoration: 'none' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6C63FF' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#111827' }}
                                >
                                  {c.name}
                                </Link>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot }} />
                                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                </span>
                                {industry && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{industry}</span>}
                              </div>
                            </div>
                            <Link
                              to={`${ROUTES.clients}/${c.id}`}
                              style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', textDecoration: 'none', flexShrink: 0 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6C63FF' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                            >
                              <ArrowRight width={15} height={15} />
                            </Link>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #EBEBEB' }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Projects</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{clientProjects.length}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Added</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{addedLabel}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Total time</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{totalLabel}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Projects</div>

              {isEditing ? (
                <ProjectEditPanel
                  assigned={draft.projects}
                  onAdd={p => set('projects', [...draft.projects, p])}
                  onRemove={p => set('projects', draft.projects.filter(x => x !== p))}
                />
              ) : saved.projects.length === 0
                ? <span style={{ fontSize: 13, color: '#9CA3AF' }}>No projects assigned.</span>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {saved.projects.map(p => {
                      const pid    = PROJECT_ID_BY_NAME[p]
                      const client = PROJECT_CLIENT_BY_NAME[p] ?? CLIENT_MAP[emp.clientId]?.name ?? null

                      const weekDates: string[] = []
                      for (let i = 0; i < 7; i++) {
                        const [yr, mo, dy] = TODAY_WS.split('-').map(Number)
                        const d = new Date(Date.UTC(yr, mo - 1, dy))
                        d.setUTCDate(d.getUTCDate() - i)
                        weekDates.push(d.toISOString().split('T')[0])
                      }
                      const allSessions = weekDates.flatMap(date =>
                        generateSessionsPreview(workerId!, date, saved.projects).filter(s => s.project === p)
                      )
                      const weekMins = allSessions.reduce((a, s) => a + s.durationMins, 0)
                      const weekH = Math.floor(weekMins / 60), weekM = weekMins % 60
                      const weekLabel = weekMins === 0 ? 'No time this week'
                        : weekH > 0 ? `${weekH}h${weekM > 0 ? ` ${weekM}m` : ''} this week`
                        : `${weekM}m this week`
                      const barPct = Math.min(100, Math.round(weekMins / (40 * 60) * 100))

                      const taskMap = new Map<string, number>()
                      for (const s of allSessions) {
                        const key = s.task || '(no task)'
                        taskMap.set(key, (taskMap.get(key) ?? 0) + s.durationMins)
                      }
                      const tasks = Array.from(taskMap.entries()).sort((a, b) => b[1] - a[1])

                      return (
                        <div key={p} style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              {pid
                                ? <Link to={`${ROUTES.projects}/${pid}`} style={{ fontSize: 13, color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                                  >{p}</Link>
                                : <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{p}</span>}
                              {client && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{client}</span>}
                            </div>
                            {weekMins > 0
                              ? <Link to={pid ? `${ROUTES.projects}/${pid}` : workSessionsForMember(workerId!)} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: '#6C63FF', fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0 }}>
                                  {weekLabel} <ArrowRight width={11} height={11} />
                                </Link>
                              : <span style={{ fontSize: 11.5, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{weekLabel}</span>
                            }
                          </div>

                          {weekMins > 0 && (
                            <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barPct}%`, background: '#6C63FF', borderRadius: 99, opacity: 0.7 }} />
                            </div>
                          )}

                          {tasks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '1px solid #EBEBEB' }}>
                              {tasks.map(([task, mins]) => {
                                const h = Math.floor(mins / 60), m = mins % 60
                                const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
                                const pct = weekMins > 0 ? Math.round(mins / weekMins * 100) : 0
                                return (
                                  <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ flex: 1, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</span>
                                    <span style={{ fontSize: 11.5, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>{dur}</span>
                                    <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── Tab: Activity ── */}
        {activeTab === 'activity' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <TodaysScreenshotsWidget workerName={emp.name} workerId={workerId!} projects={emp.projects ?? []} workerColor={emp.fg ?? '#6C63FF'} />
            <WorkSessionsWidget empId={workerId!} projects={emp.projects ?? []} />
          </div>
        )}

        {/* ── Tab: Payments ── */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Rate cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Bill Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.billRate} onChange={e => set('billRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>/hr</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.billRate === 0 ? '—' : `$${saved.billRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>charged to client</div>
              </div>

              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Pay Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.payRate} onChange={e => set('payRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>{saved.payType === 'monthly' ? '/mo' : '/hr'}</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.payRate === 0 ? '—' : saved.payType === 'monthly' ? `$${saved.payRate.toLocaleString()}/mo` : `$${saved.payRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{saved.payType === 'monthly' ? 'monthly salary' : 'per hour worked'}</div>
              </div>

              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Pay Type</div>
                {isEditing
                  ? <select value={draft.payType} onChange={e => set('payType', e.target.value as PayType)} style={{ ...selectStyle, fontSize: 16, fontWeight: 700 }}>
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.payType === 'hourly' ? 'Hourly' : 'Monthly'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{empTypeLabel[saved.employmentType]}</div>
              </div>
            </div>

            {/* Payment history */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</div>
                {isEditing && (
                  <button onClick={addPayRec} style={{ ...btnBase, padding: '5px 12px', background: '#F0FDF4', color: '#15803D', fontSize: 12 }}>
                    <Plus width={12} height={12} /> Add record
                  </button>
                )}
              </div>

              {(isEditing ? draft : saved).paymentHistory.length === 0
                ? <div style={{ padding: '40px 24px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>No payment records.</div>
                : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA' }}>
                        {['Date', 'Period', 'Amount', 'Method', 'Status', ...(isEditing ? [''] : [])].map((h, i) => (
                          <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? draft : saved).paymentHistory.map((rec, i) => (
                        <tr key={rec.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F3F4F6' }}
                          onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = '#FAFAFA' }}
                          onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input type="date" value={rec.date} onChange={e => updatePayRec(i, 'date', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{fmtDate(rec.date)}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input value={rec.period} onChange={e => updatePayRec(i, 'period', e.target.value)} style={{ ...inputStyle, width: 130 }} placeholder="e.g. Jun 2025" />
                              : <span style={{ fontSize: 13, color: '#374151' }}>{rec.period}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ color: '#374151' }}>$</span>
                                  <input type="number" min={0} value={rec.amount} onChange={e => updatePayRec(i, 'amount', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle }} />
                                </div>
                              : <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>${rec.amount.toLocaleString()}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input value={rec.method} onChange={e => updatePayRec(i, 'method', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{rec.method}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <select value={rec.status} onChange={e => updatePayRec(i, 'status', e.target.value as PaymentRecord['status'])} style={{ ...selectStyle, width: 110 }}>
                                  <option value="paid">Paid</option>
                                  <option value="pending">Pending</option>
                                  <option value="failed">Failed</option>
                                </select>
                              : <PayBadge status={rec.status} />}
                          </td>
                          {isEditing && (
                            <td style={{ padding: '12px 14px' }}>
                              <button onClick={() => removePayRec(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 4, display: 'flex' }}>
                                <Trash2 width={14} height={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>

          </div>
        )}

        {/* ── Tab: Work Time & Limits ── */}
        {activeTab === 'worktime' && (
          <div style={{ display: 'grid', gap: 16 }}>

            {/* 1. Limit cards — top */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Max Hours / Day</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.maxHoursPerDay ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerDay', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.maxHoursPerDay != null ? `${saved.maxHoursPerDay}h` : 'No limit'}</div>}
              </div>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Max Hours / Week</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={168} value={draft.maxHoursPerWeek ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerWeek', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.maxHoursPerWeek != null ? `${saved.maxHoursPerWeek}h` : 'No limit'}</div>}
              </div>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Break Required</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.breakRequiredAfterH ?? ''} placeholder="None" onChange={e => set('breakRequiredAfterH', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.breakRequiredAfterH != null ? `${saved.breakRequiredAfterH}h` : 'None'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  {saved.breakRequiredAfterH != null ? 'continuous work limit' : 'no mandatory break'}
                </div>
              </div>
            </div>

            {/* 2. Schedule Rules (1) + Schedule widget (2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'stretch' }}>
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Schedule Rules</div>
                <InfoRow label="Allowed Days">
                  {isEditing
                    ? <input value={draft.allowedDaysNote} onChange={e => set('allowedDaysNote', e.target.value)} style={inputStyle} placeholder="e.g. Mon–Fri" />
                    : saved.allowedDaysNote || '—'}
                </InfoRow>
                <InfoRow label="Schedule Type">
                  <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: schedBadge.bg, color: schedBadge.color }}>
                    {SCHEDULE_TYPE_LABELS[emp.scheduleType]}
                  </span>
                </InfoRow>
                <InfoRow label="Employment">
                  {isEditing
                    ? <select value={draft.employmentType} onChange={e => set('employmentType', e.target.value as EmpType)} style={{ ...selectStyle, width: 160 }}>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contractor">Contractor</option>
                      </select>
                    : empTypeLabel[saved.employmentType]}
                </InfoRow>
                <InfoRow label="Time Tracking">
                  {isEditing
                    ? <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={draft.timeTrackingEnabled} onChange={e => set('timeTrackingEnabled', e.target.checked)} style={{ accentColor: '#6C63FF', width: 15, height: 15 }} />
                        <span style={{ fontSize: 13, color: '#374151' }}>Enabled</span>
                      </label>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: saved.timeTrackingEnabled ? '#F0FDF4' : '#F3F4F6', color: saved.timeTrackingEnabled ? '#15803D' : '#9CA3AF' }}>
                        {saved.timeTrackingEnabled ? <Check width={11} height={11} strokeWidth={2.5} /> : null}
                        {saved.timeTrackingEnabled ? 'Enabled' : 'Disabled'}
                      </span>}
                </InfoRow>
              </div>
              <ScheduleCard emp={emp} />
            </div>

            {/* 3. Notes & Restrictions (1) + Time Edits (2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'stretch' }}>
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Notes & Restrictions</div>
                {isEditing
                  ? <textarea
                      value={draft.notes}
                      onChange={e => set('notes', e.target.value)}
                      rows={4}
                      placeholder="Any additional work restrictions or notes..."
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    />
                  : saved.notes
                    ? <div style={{ display: 'flex', gap: 12, padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
                        <AlertTriangle width={16} height={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 13, color: '#92400E' }}>{saved.notes}</span>
                      </div>
                    : <span style={{ fontSize: 13, color: '#9CA3AF' }}>No notes.</span>}
              </div>
              <TimeEditsWidget empId={workerId!} shiftStartUTC={emp.shiftStartUTC ?? 9} />
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
