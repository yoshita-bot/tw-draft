import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Globe, Calendar, Monitor,
  DollarSign, Clock, AlertTriangle, Check, Pencil, X, Plus, Trash2,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import {
  EMPLOYEE_MAP, SCHEDULE_TYPE_LABELS,
  getWorkDayList, getScheduleForDay,
  type DayOfWeek,
} from '../data/employeesData'
import { CLIENT_MAP } from '../data/clientsData'
import { PROJECTS } from '../data/projectsData'
import { PROFILE_MAP, type PaymentRecord } from '../data/profileData'
import { ROUTES } from '../lib/routes'

const PROJECT_ID_BY_NAME = Object.fromEntries(PROJECTS.map(p => [p.name, p.id]))
const ALL_PROJECT_NAMES = PROJECTS.map(p => p.name)

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`
}

function fmtTz(tz: string) {
  try {
    const offset = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName')?.value ?? tz
    return `${offset} · ${tz.replace(/_/g, ' ')}`
  } catch { return tz }
}

function localH(utcH: number, tz: string): string {
  const base = new Date(Date.UTC(2024, 0, 1, Math.floor(utcH), Math.round((utcH % 1) * 60)))
  return base.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz })
}

function durationH(startUTC: number, endUTC: number): string {
  const diff = ((endUTC - startUTC) + 24) % 24
  const h = Math.floor(diff)
  const m = Math.round((diff - h) * 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

function newPayId() {
  return 'pay-' + Math.random().toString(36).slice(2, 9)
}

// ── Draft shape ───────────────────────────────────────────────────────────────

type Status = 'active' | 'inactive' | 'onboarding'
type EmpType = 'full-time' | 'part-time' | 'contractor'
type PayType = 'hourly' | 'monthly'

interface Draft {
  name: string
  role: string
  status: Status
  email: string
  dateJoined: string
  homeTimezone: string
  employmentType: EmpType
  payType: PayType
  location: string
  workPhone: string
  personalPhone: string
  projects: string[]
  billRate: number
  payRate: number
  paymentHistory: PaymentRecord[]
  maxHoursPerDay: number | null
  maxHoursPerWeek: number | null
  breakRequiredAfterH: number | null
  allowedDaysNote: string
  timeTrackingEnabled: boolean
  notes: string
}

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13.5, color: '#111827',
  border: '1px solid #D1D5DB', borderRadius: 6, padding: '5px 9px',
  outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const numInputStyle: React.CSSProperties = { ...inputStyle, width: 90 }
const labelStyle: React.CSSProperties = {
  width: 150, flexShrink: 0, fontSize: 12, color: '#9CA3AF',
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 7,
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, bg, fg, size = 52 }: { initials: string; bg: string; fg: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, color: fg,
      fontSize: size * 0.34, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{initials}</div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={labelStyle as React.CSSProperties}>{label}</span>
      <span style={{ flex: 1, fontSize: 13.5, color: '#111827', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 500 : 400 }}>
        {children}
      </span>
    </div>
  )
}

// ── Payment status badge ──────────────────────────────────────────────────────

const PAY_STATUS: Record<PaymentRecord['status'], { bg: string; color: string; label: string }> = {
  paid:    { bg: '#DCFCE7', color: '#16A34A', label: 'Paid' },
  pending: { bg: '#FEF9C3', color: '#A16207', label: 'Pending' },
  failed:  { bg: '#FEE2E2', color: '#DC2626', label: 'Failed' },
}

function PayBadge({ status }: { status: PaymentRecord['status'] }) {
  const s = PAY_STATUS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
      {status === 'paid' && <Check width={10} height={10} strokeWidth={3} />}
      {s.label}
    </span>
  )
}

// ── Schedule constants ────────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
}

const SCHED_BADGE: Record<string, { bg: string; color: string }> = {
  fixed:          { bg: '#EFF6FF', color: '#1D4ED8' },
  free:           { bg: '#F0FDF4', color: '#15803D' },
  'free-overlap': { bg: '#FFF7ED', color: '#C2410C' },
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'info' | 'payments' | 'worktime'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'info',     label: 'Info',               icon: <Monitor width={14} height={14} /> },
  { id: 'payments', label: 'Payments',           icon: <DollarSign width={14} height={14} /> },
  { id: 'worktime', label: 'Work Time & Limits', icon: <Clock width={14} height={14} /> },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export function PersonProfilePage() {
  const { workerId } = useParams<{ workerId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('info')
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
    active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' },
    inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
    onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04' },
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
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'People', path: ROUTES.people }, { label: emp.name }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* Back */}
        <button
          onClick={() => navigate(ROUTES.people)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
        >
          <ArrowLeft width={14} height={14} /> Back to People
        </button>

        {/* ── Hero card ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '24px 28px', marginBottom: 0, display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <Avatar initials={emp.initials} bg={emp.bg} fg={emp.fg} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>{emp.name}</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: sc.bg, color: sc.color }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot }} />
                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
              </span>
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 14 }}>{emp.role}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {[
                { icon: <Mail width={13} height={13} />,     val: emp.email,            href: `mailto:${emp.email}` },
                { icon: <Phone width={13} height={13} />,    val: profile.phones.work },
                { icon: <MapPin width={13} height={13} />,   val: profile.location },
                { icon: <Globe width={13} height={13} />,    val: fmtTz(emp.homeTimezone) },
                { icon: <Calendar width={13} height={13} />, val: `Joined ${fmtDate(emp.dateJoined)}` },
                ...(client ? [{ icon: <span style={{ width: 9, height: 9, borderRadius: '50%', background: client.color, display: 'inline-block' }} />, val: client.name, href: `${ROUTES.people}?client=${encodeURIComponent(client.name)}` }] : []),
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13 }}>
                  <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                  {item.href
                    ? <a href={item.href} style={{ color: '#6B7280', textDecoration: 'none' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
                      >{item.val}</a>
                    : <span>{item.val}</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8' }}>
              {empTypeLabel[emp.employmentType as EmpType]}
            </span>
            <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: emp.payType === 'hourly' ? '#F0FDF4' : '#FFF1F2', color: emp.payType === 'hourly' ? '#15803D' : '#BE185D' }}>
              {emp.payType === 'hourly' ? 'Hourly' : 'Monthly salary'}
            </span>
          </div>
        </div>

        {/* ── Tab bar + edit controls ── */}
        <div style={{ background: '#fff', borderLeft: '1px solid #E8E8E8', borderRight: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', borderRadius: '0 0 12px 12px', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
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
                <button onClick={handleCancel} style={{ ...btnBase, background: '#F3F4F6', color: '#374151' }}>
                  <X width={13} height={13} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{ ...btnBase, background: '#F3F4F6', color: '#374151' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6' }}
              >
                <Pencil width={13} height={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Contact */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Contact & Identity</div>

              <InfoRow label="Email">
                {isEditing
                  ? <input value={draft.email} onChange={e => set('email', e.target.value)} style={inputStyle} type="email" />
                  : <a href={`mailto:${saved.email}`} style={{ color: '#6C63FF', textDecoration: 'none' }}>{saved.email}</a>}
              </InfoRow>

              <InfoRow label="Work Phone">
                {isEditing
                  ? <input value={draft.workPhone} onChange={e => set('workPhone', e.target.value)} style={inputStyle} />
                  : saved.workPhone}
              </InfoRow>

              <InfoRow label="Personal Phone">
                {isEditing
                  ? <input value={draft.personalPhone} onChange={e => set('personalPhone', e.target.value)} style={inputStyle} />
                  : saved.personalPhone}
              </InfoRow>

              <InfoRow label="Location">
                {isEditing
                  ? <input value={draft.location} onChange={e => set('location', e.target.value)} style={inputStyle} />
                  : saved.location}
              </InfoRow>

              <InfoRow label="Timezone">
                {isEditing
                  ? <input value={draft.homeTimezone} onChange={e => set('homeTimezone', e.target.value)} style={inputStyle} placeholder="e.g. America/New_York" />
                  : fmtTz(saved.homeTimezone)}
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

              <InfoRow label="Date Joined">
                {isEditing
                  ? <input value={draft.dateJoined} onChange={e => set('dateJoined', e.target.value)} style={inputStyle} type="date" />
                  : fmtDate(saved.dateJoined)}
              </InfoRow>
            </div>

            {/* Projects */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Projects</div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ALL_PROJECT_NAMES.map(p => {
                    const checked = draft.projects.includes(p)
                    return (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: `1px solid ${checked ? '#C4B5FD' : '#F3F4F6'}`, background: checked ? '#F5F3FF' : '#F9FAFB', cursor: 'pointer' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleProject(p)} style={{ accentColor: '#6C63FF', width: 14, height: 14 }} />
                        <span style={{ fontSize: 13, color: checked ? '#5B21B6' : '#374151', fontWeight: checked ? 600 : 400 }}>{p}</span>
                      </label>
                    )
                  })}
                </div>
              ) : saved.projects.length === 0
                ? <span style={{ fontSize: 13, color: '#9CA3AF' }}>No projects assigned.</span>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {saved.projects.map(p => {
                      const pid = PROJECT_ID_BY_NAME[p]
                      return (
                        <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6C63FF', flexShrink: 0 }} />
                          {pid
                            ? <Link to={`${ROUTES.projects}/${pid}`} style={{ fontSize: 13, color: '#6C63FF', fontWeight: 500, textDecoration: 'none' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                              >{p}</Link>
                            : <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{p}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>

            {/* Schedule — spans full width, read-only (UTC complexity) */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Schedule</div>
                <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: schedBadge.bg, color: schedBadge.color }}>
                  {SCHEDULE_TYPE_LABELS[emp.scheduleType]}
                </span>
              </div>

              {emp.scheduleType === 'fixed' && workDays.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {workDays.map(d => {
                    const s = getScheduleForDay(emp, d)!
                    return (
                      <div key={d} style={{ padding: '12px 16px', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{DAY_LABELS[d]}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{localH(s.startUTC, emp.homeTimezone)} – {localH(s.endUTC, emp.homeTimezone)}</div>
                        <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 3 }}>{durationH(s.startUTC, s.endUTC)}</div>
                      </div>
                    )
                  })}
                </div>
              )}

              {emp.scheduleType === 'free-overlap' && emp.overlapBlocks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Required Overlap Windows</div>
                  {emp.overlapBlocks.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 9 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#C2410C' }}>{b.label}</span>
                      <span style={{ fontSize: 13, color: '#92400E' }}>
                        {localH(b.startUTC, emp.homeTimezone)} – {localH(b.endUTC, emp.homeTimezone)}
                        <span style={{ marginLeft: 10, fontSize: 11.5, color: '#B45309', background: '#FFEDD5', padding: '1px 7px', borderRadius: 4 }}>{durationH(b.startUTC, b.endUTC)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {emp.scheduleType === 'free' && (
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                  No fixed hours — employee sets their own schedule as long as deliverables are met.
                </p>
              )}
            </div>

          </div>
        )}

        {/* ── Tab: Payments ── */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Rate cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Bill Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.billRate} onChange={e => set('billRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>/hr</span>
                    </div>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.billRate === 0 ? '—' : `$${saved.billRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>charged to client</div>
              </div>

              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pay Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.payRate} onChange={e => set('payRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>{saved.payType === 'monthly' ? '/mo' : '/hr'}</span>
                    </div>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.payRate === 0 ? '—' : saved.payType === 'monthly' ? `$${saved.payRate.toLocaleString()}/mo` : `$${saved.payRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{saved.payType === 'monthly' ? 'monthly salary' : 'per hour worked'}</div>
              </div>

              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Pay Type</div>
                {isEditing
                  ? <select value={draft.payType} onChange={e => set('payType', e.target.value as PayType)} style={{ ...selectStyle, fontSize: 16, fontWeight: 700 }}>
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.payType === 'hourly' ? 'Hourly' : 'Monthly'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{empTypeLabel[saved.employmentType]}</div>
              </div>
            </div>

            {/* Payment history */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment History</div>
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
                          <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? draft : saved).paymentHistory.map((rec, i) => (
                        <tr key={rec.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F3F4F6' }}
                          onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = '#FAFAFA' }}
                          onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '10px 16px' }}>
                            {isEditing
                              ? <input type="date" value={rec.date} onChange={e => updatePayRec(i, 'date', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{fmtDate(rec.date)}</span>}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {isEditing
                              ? <input value={rec.period} onChange={e => updatePayRec(i, 'period', e.target.value)} style={{ ...inputStyle, width: 130 }} placeholder="e.g. Jun 2025" />
                              : <span style={{ fontSize: 13, color: '#374151' }}>{rec.period}</span>}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {isEditing
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ color: '#374151' }}>$</span>
                                  <input type="number" min={0} value={rec.amount} onChange={e => updatePayRec(i, 'amount', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle }} />
                                </div>
                              : <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>${rec.amount.toLocaleString()}</span>}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {isEditing
                              ? <input value={rec.method} onChange={e => updatePayRec(i, 'method', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{rec.method}</span>}
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            {isEditing
                              ? <select value={rec.status} onChange={e => updatePayRec(i, 'status', e.target.value as PaymentRecord['status'])} style={{ ...selectStyle, width: 110 }}>
                                  <option value="paid">Paid</option>
                                  <option value="pending">Pending</option>
                                  <option value="failed">Failed</option>
                                </select>
                              : <PayBadge status={rec.status} />}
                          </td>
                          {isEditing && (
                            <td style={{ padding: '10px 16px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Limit cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Max hours / day */}
              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Max Hours / Day</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.maxHoursPerDay ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerDay', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.maxHoursPerDay != null ? `${saved.maxHoursPerDay}h` : 'No limit'}</div>}
              </div>

              {/* Max hours / week */}
              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Max Hours / Week</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={168} value={draft.maxHoursPerWeek ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerWeek', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.maxHoursPerWeek != null ? `${saved.maxHoursPerWeek}h` : 'No limit'}</div>}
              </div>

              {/* Break required */}
              <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Break Required</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.breakRequiredAfterH ?? ''} placeholder="None" onChange={e => set('breakRequiredAfterH', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{saved.breakRequiredAfterH != null ? `${saved.breakRequiredAfterH}h` : 'None'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                  {saved.breakRequiredAfterH != null ? 'continuous work limit' : 'no mandatory break'}
                </div>
              </div>
            </div>

            {/* Schedule rules */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Schedule Rules</div>

              <InfoRow label="Allowed Days">
                {isEditing
                  ? <input value={draft.allowedDaysNote} onChange={e => set('allowedDaysNote', e.target.value)} style={inputStyle} placeholder="e.g. Mon–Fri" />
                  : saved.allowedDaysNote || '—'}
              </InfoRow>

              <InfoRow label="Schedule Type">
                <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: schedBadge.bg, color: schedBadge.color }}>
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
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: saved.timeTrackingEnabled ? '#F0FDF4' : '#F3F4F6', color: saved.timeTrackingEnabled ? '#15803D' : '#9CA3AF' }}>
                      {saved.timeTrackingEnabled ? <Check width={11} height={11} strokeWidth={2.5} /> : null}
                      {saved.timeTrackingEnabled ? 'Enabled' : 'Disabled'}
                    </span>}
              </InfoRow>
            </div>

            {/* Notes */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Notes & Restrictions</div>
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

          </div>
        )}

      </div>
    </div>
  )
}
