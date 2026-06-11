import React, { useState, useMemo } from 'react'
import {
  Plus, Search, SlidersHorizontal, ChevronDown, X, Check,
  Calendar, Clock, Users, DollarSign, AlertTriangle, CalendarDays,
  Settings, ChevronRight, User, Shield, Info, Trash2, ArrowRight,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'approved' | 'denied'

interface Policy {
  id: string
  name: string
  type: 'client-paid' | 'internal'
  client?: string
  color: string
  accrualRate: number      // hours per month
  maxBalance: number       // hours
  allowNegative: boolean
  rolloverCap: number | null // null = unlimited
  members: string[]        // worker IDs
}

interface PtoRequest {
  id: string
  workerId: string
  workerName: string
  workerInitials: string
  workerColor: string
  workerBg: string
  policyId: string
  startDate: string
  endDate: string
  days: number
  hoursPerDay: number
  status: RequestStatus
  notes: string
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  isScheduled: boolean // worker actually has a shift on those days
}

interface ShiftDay {
  date: string
  workerId: string
  label: string
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

// Parse YYYY-MM-DD as UTC to avoid timezone-offset issues in addDays/isWeekend
function parseUTC(ds: string) {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function toYMD(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`
}
function fmtDate(d: string) {
  return parseUTC(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
function fmtDateShort(d: string) {
  return parseUTC(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function fmtDT(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function addDays(ds: string, n: number) {
  const d = parseUTC(ds)
  d.setUTCDate(d.getUTCDate() + n)
  return toYMD(d)
}
function isWeekend(d: string) {
  return parseUTC(d).getUTCDay() % 6 === 0  // 0 = Sun, 6 = Sat
}
function daysBetween(start: string, end: string) {
  return Math.round((parseUTC(end).getTime() - parseUTC(start).getTime()) / 86400000) + 1
}
function weekdaysBetween(start: string, end: string) {
  let count = 0, cur = start
  while (cur <= end) {
    if (!isWeekend(cur)) count++
    cur = addDays(cur, 1)
  }
  return count
}

// ─────────────────────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────────────────────

// AW standard: 5 days (40h) paid leave, 3 days (24h) sick leave per year
const AW_PAID_TOTAL  = 40  // 5 days × 8h
const AW_SICK_TOTAL  = 24  // 3 days × 8h

const POLICIES: Policy[] = [
  { id: 'p1', name: 'Paradigm',    type: 'client-paid', client: 'Paradigm Corp', color: '#6C63FF', accrualRate: 8,    maxBalance: 120,          allowNegative: false, rolloverCap: 40,   members: ['w1','w2','w3'] },
  { id: 'p2', name: 'Cosmo',       type: 'client-paid', client: 'Cosmo LLC',     color: '#0EA5E9', accrualRate: 6,    maxBalance: 80,           allowNegative: false, rolloverCap: 24,   members: ['w4','w5'] },
  { id: 'p3', name: 'Paid Leave',  type: 'internal',                             color: '#10B981', accrualRate: 0,    maxBalance: AW_PAID_TOTAL, allowNegative: false, rolloverCap: null, members: ['w1','w2','w3','w4','w5','w6'] },
  { id: 'p4', name: 'Paid Holiday',type: 'internal',                             color: '#F59E0B', accrualRate: 0,    maxBalance: 0,            allowNegative: false, rolloverCap: null, members: ['w1','w2','w3','w4','w5','w6'] },
  { id: 'p5', name: 'Sick Leave',  type: 'internal',                             color: '#EF4444', accrualRate: 0,    maxBalance: AW_SICK_TOTAL, allowNegative: false, rolloverCap: null, members: ['w1','w2','w3','w4','w5','w6'] },
  { id: 'p6', name: 'Bereavement', type: 'internal',                             color: '#8B5CF6', accrualRate: 0,    maxBalance: 40,           allowNegative: false, rolloverCap: null, members: ['w1','w2','w3','w4','w5','w6'] },
]

// balance = remaining hours for each policy this year
// p3 = Paid Leave (40h total), p5 = Sick Leave (24h total)
const WORKERS = [
  { id: 'w1', name: 'Alice Chen',    initials: 'AC', color: '#6C63FF', bg: '#EEEDFF', balance: { p1: 32, p3: 16, p4: 16, p5: 16, p6: 40 } },
  { id: 'w2', name: 'Bob Martinez',  initials: 'BM', color: '#3B82F6', bg: '#EFF6FF', balance: { p1: 24, p3: 40, p4: 16, p5: 24, p6: 40 } },
  { id: 'w3', name: 'Carmen Santos', initials: 'CS', color: '#06B6D4', bg: '#ECFEFF', balance: { p1: 16, p3: 40, p4: 16, p5:  8, p6: 40 } },
  { id: 'w4', name: 'David Kim',     initials: 'DK', color: '#F59E0B', bg: '#FFFBEB', balance: { p2: 20, p3: 32, p4: 16, p5: 24, p6: 40 } },
  { id: 'w5', name: 'Elena Patel',   initials: 'EP', color: '#EC4899', bg: '#FDF2F8', balance: { p2: 12, p3: 40, p4: 16, p5: 16, p6: 40 } },
  { id: 'w6', name: 'Frank Osei',    initials: 'FO', color: '#10B981', bg: '#F0FDF4', balance: { p3: 24, p4: 16, p5: 16, p6: 40 } },
]

const INITIAL_REQUESTS: PtoRequest[] = [
  { id: 'r1',  workerId: 'w1', workerName: 'Alice Chen',    workerInitials: 'AC', workerColor: '#6C63FF', workerBg: '#EEEDFF', policyId: 'p1', startDate: '2026-06-10', endDate: '2026-06-12', days: 3, hoursPerDay: 8, status: 'approved',  notes: 'Family vacation', submittedAt: '2026-05-28T10:30:00', reviewedAt: '2026-05-29T09:00:00', reviewedBy: 'Jayce M.', isScheduled: true  },
  { id: 'r2',  workerId: 'w2', workerName: 'Bob Martinez',  workerInitials: 'BM', workerColor: '#3B82F6', workerBg: '#EFF6FF', policyId: 'p3', startDate: '2026-06-15', endDate: '2026-06-19', days: 5, hoursPerDay: 8, status: 'pending',   notes: 'Annual leave — planned trip', submittedAt: '2026-06-01T14:00:00', isScheduled: true  },
  { id: 'r3',  workerId: 'w3', workerName: 'Carmen Santos', workerInitials: 'CS', workerColor: '#06B6D4', workerBg: '#ECFEFF', policyId: 'p5', startDate: '2026-06-04', endDate: '2026-06-05', days: 2, hoursPerDay: 8, status: 'approved',  notes: 'Feeling unwell', submittedAt: '2026-06-03T08:00:00', reviewedAt: '2026-06-03T08:30:00', reviewedBy: 'Yoshita K.', isScheduled: false },
  { id: 'r4',  workerId: 'w4', workerName: 'David Kim',     workerInitials: 'DK', workerColor: '#F59E0B', workerBg: '#FFFBEB', policyId: 'p2', startDate: '2026-06-08', endDate: '2026-06-08', days: 1, hoursPerDay: 8, status: 'denied',    notes: 'Doctor appointment', submittedAt: '2026-06-02T16:00:00', reviewedAt: '2026-06-03T10:00:00', reviewedBy: 'Jayce M.', isScheduled: true  },
  { id: 'r5',  workerId: 'w5', workerName: 'Elena Patel',   workerInitials: 'EP', workerColor: '#EC4899', workerBg: '#FDF2F8', policyId: 'p2', startDate: '2026-06-20', endDate: '2026-06-25', days: 4, hoursPerDay: 8, status: 'pending',   notes: '', submittedAt: '2026-06-01T09:00:00', isScheduled: true  },
  { id: 'r6',  workerId: 'w1', workerName: 'Alice Chen',    workerInitials: 'AC', workerColor: '#6C63FF', workerBg: '#EEEDFF', policyId: 'p4', startDate: '2026-07-04', endDate: '2026-07-04', days: 1, hoursPerDay: 8, status: 'approved',  notes: 'Independence Day', submittedAt: '2026-05-15T11:00:00', reviewedAt: '2026-05-15T11:30:00', reviewedBy: 'System', isScheduled: false },
  { id: 'r7',  workerId: 'w6', workerName: 'Frank Osei',    workerInitials: 'FO', workerColor: '#10B981', workerBg: '#F0FDF4', policyId: 'p3', startDate: '2026-05-26', endDate: '2026-05-28', days: 3, hoursPerDay: 8, status: 'approved',  notes: 'Memorial Day weekend extension', submittedAt: '2026-05-10T09:00:00', reviewedAt: '2026-05-11T09:00:00', reviewedBy: 'Jayce M.', isScheduled: false },
  { id: 'r8',  workerId: 'w2', workerName: 'Bob Martinez',  workerInitials: 'BM', workerColor: '#3B82F6', workerBg: '#EFF6FF', policyId: 'p6', startDate: '2026-04-14', endDate: '2026-04-16', days: 3, hoursPerDay: 8, status: 'approved',  notes: 'Bereavement — grandmother', submittedAt: '2026-04-13T20:00:00', reviewedAt: '2026-04-13T21:00:00', reviewedBy: 'Yoshita K.', isScheduled: true  },
  { id: 'r9',  workerId: 'w3', workerName: 'Carmen Santos', workerInitials: 'CS', workerColor: '#06B6D4', workerBg: '#ECFEFF', policyId: 'p1', startDate: '2026-03-10', endDate: '2026-03-14', days: 5, hoursPerDay: 8, status: 'denied',    notes: 'Spring break', submittedAt: '2026-02-20T10:00:00', reviewedAt: '2026-02-21T09:00:00', reviewedBy: 'Jayce M.', isScheduled: true  },
  { id: 'r10', workerId: 'w4', workerName: 'David Kim',     workerInitials: 'DK', workerColor: '#F59E0B', workerBg: '#FFFBEB', policyId: 'p3', startDate: '2026-07-14', endDate: '2026-07-18', days: 5, hoursPerDay: 8, status: 'pending',   notes: 'Summer vacation', submittedAt: '2026-06-03T08:00:00', isScheduled: true  },
  { id: 'r11', workerId: 'w6', workerName: 'Frank Osei',    workerInitials: 'FO', workerColor: '#10B981', workerBg: '#F0FDF4', policyId: 'p5', startDate: '2026-06-11', endDate: '2026-06-11', days: 1, hoursPerDay: 8, status: 'pending',   notes: 'Medical checkup', submittedAt: '2026-06-04T07:30:00', isScheduled: false },
]

// Mini shift calendar — days a worker is scheduled
const SHIFT_DAYS: ShiftDay[] = [
  { date: '2026-06-10', workerId: 'w1', label: '9am–5pm' },
  { date: '2026-06-11', workerId: 'w1', label: '9am–5pm' },
  { date: '2026-06-12', workerId: 'w1', label: '9am–5pm' },
  { date: '2026-06-15', workerId: 'w2', label: '8:30am–5pm' },
  { date: '2026-06-16', workerId: 'w2', label: '8:30am–5pm' },
  { date: '2026-06-17', workerId: 'w2', label: '8:30am–5pm' },
  { date: '2026-06-18', workerId: 'w2', label: '8:30am–5pm' },
  { date: '2026-06-19', workerId: 'w2', label: '8:30am–5pm' },
  { date: '2026-06-08', workerId: 'w4', label: '8am–4:30pm' },
  { date: '2026-06-20', workerId: 'w5', label: '9am–5pm' },
  { date: '2026-06-23', workerId: 'w5', label: '9am–5pm' },
  { date: '2026-06-24', workerId: 'w5', label: '9am–5pm' },
  { date: '2026-06-25', workerId: 'w5', label: '9am–5pm' },
  { date: '2026-06-14', workerId: 'w4', label: '8am–4:30pm' },
  { date: '2026-06-15', workerId: 'w4', label: '8am–4:30pm' },
  { date: '2026-06-16', workerId: 'w4', label: '8am–4:30pm' },
  { date: '2026-06-17', workerId: 'w4', label: '8am–4:30pm' },
  { date: '2026-06-18', workerId: 'w4', label: '8am–4:30pm' },
]

// ─────────────────────────────────────────────────────────────
//  SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

function Avatar({ initials, color, bg, size = 32 }: { initials: string; color: string; bg: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700,
    }}>{initials}</div>
  )
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg = {
    pending:  { bg: '#FFF7ED', color: '#D97706', border: '#FDE68A', label: 'Pending'  },
    approved: { bg: '#F0FDF4', color: '#059669', border: '#6EE7B7', label: 'Approved' },
    denied:   { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Denied'   },
  }[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status === 'pending' && <Clock width={10} height={10} />}
      {status === 'approved' && <Check width={10} height={10} />}
      {status === 'denied' && <X width={10} height={10} />}
      {cfg.label}
    </span>
  )
}

function PolicyBadge({ policy }: { policy: Policy }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: policy.color + '18', color: policy.color, border: `1px solid ${policy.color}44` }}>
      {policy.type === 'client-paid' && <DollarSign width={10} height={10} />}
      {policy.name}
    </span>
  )
}

function IconBtn({ children, onClick, title, active }: { children: React.ReactNode; onClick?: () => void; title?: string; active?: boolean }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 7, background: active ? '#F5F3FF' : hov ? '#F9FAFB' : '#fff', cursor: 'pointer', color: active ? '#6C63FF' : '#6B7280', transition: 'background 0.1s' }}>
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
//  REQUEST DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function RequestDetailModal({ req, onClose, onApprove, onDeny, onAdjustSchedule }: {
  req: PtoRequest
  onClose: () => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  onAdjustSchedule: (req: PtoRequest) => void
}) {
  const policy = POLICIES.find(p => p.id === req.policyId)!
  const worker = WORKERS.find(w => w.id === req.workerId)!
  const balance = (worker.balance as Record<string, number>)[req.policyId] ?? 0
  const hoursRequested = req.days * req.hoursPerDay
  const afterBalance = balance - hoursRequested

  // Build date list for the request range
  const dateCells: { date: string; scheduled: boolean; shift?: string }[] = []
  let cur = req.startDate
  while (cur <= req.endDate) {
    const shift = SHIFT_DAYS.find(s => s.date === cur && s.workerId === req.workerId)
    dateCells.push({ date: cur, scheduled: !!shift, shift: shift?.label })
    cur = addDays(cur, 1)
  }
  const hasScheduledShift = req.isScheduled || dateCells.some(d => d.scheduled)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Request Details</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Worker + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar initials={req.workerInitials} color={req.workerColor} bg={req.workerBg} size={40} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{req.workerName}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Submitted {fmtDT(req.submittedAt)}</div>
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <InfoCard label="Policy" value={<PolicyBadge policy={policy} />} />
            <InfoCard label="Type" value={policy.type === 'client-paid' ? `Client-paid · ${policy.client}` : 'Internal policy'} />
            <InfoCard label="Dates" value={req.startDate === req.endDate ? fmtDate(req.startDate) : `${fmtDateShort(req.startDate)} – ${fmtDate(req.endDate)}`} />
            <InfoCard label="Duration" value={`${hoursRequested}h`} />
            <InfoCard label="Current balance" value={`${balance}h`} accent={balance < hoursRequested ? '#EF4444' : '#059669'} />
            <InfoCard label="Balance after" value={`${afterBalance}h`} accent={afterBalance < 0 ? '#EF4444' : '#374151'} />
          </div>

          {req.notes && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Employee note</div>
              <div style={{ fontSize: 13, color: '#374151' }}>{req.notes}</div>
            </div>
          )}

          {/* Integrated schedule view */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Schedule on requested days</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {dateCells.map(dc => (
                <div key={dc.date} style={{
                  padding: '8px 12px', borderRadius: 8, border: `1px solid ${dc.scheduled ? '#FDE68A' : '#E5E7EB'}`,
                  background: dc.scheduled ? '#FFFBEB' : isWeekend(dc.date) ? '#FAFAFA' : '#fff',
                  minWidth: 110,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isWeekend(dc.date) ? '#9CA3AF' : '#374151' }}>
                    {new Date(dc.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  {dc.scheduled ? (
                    <div style={{ fontSize: 11, color: '#D97706', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle width={10} height={10} /> {dc.shift}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{isWeekend(dc.date) ? 'Weekend' : 'No shift'}</div>
                  )}
                </div>
              ))}
            </div>
            {dateCells.some(d => d.scheduled) && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: '#FFF7ED', borderRadius: 7, border: '1px solid #FDE68A', fontSize: 12, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle width={13} height={13} />
                Worker has scheduled shifts on some of these days. Approval will require a schedule adjustment.
              </div>
            )}
          </div>

          {/* Review info */}
          {req.reviewedAt && (
            <div style={{ padding: '10px 14px', background: req.status === 'approved' ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, fontSize: 12, color: req.status === 'approved' ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              {req.status === 'approved' ? <Check width={13} height={13} /> : <X width={13} height={13} />}
              {req.status === 'approved' ? 'Approved' : 'Denied'} by {req.reviewedBy} · {fmtDT(req.reviewedAt)}
            </div>
          )}

          {/* Billing notice for client-paid */}
          {policy.type === 'client-paid' && (
            <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <DollarSign width={13} height={13} />
              This policy is client-paid ({policy.client}). Approving will push <strong>"{policy.name}"</strong> to the timesheet for billing.
            </div>
          )}
        </div>

        {/* Footer actions */}
        {req.status === 'pending' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => { onDeny(req.id); onClose() }}
              style={{ padding: '8px 18px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FEF2F2', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
              Deny
            </button>
            {hasScheduledShift ? (
              <>
                <button onClick={() => { onApprove(req.id); onClose() }}
                  style={{ padding: '8px 18px', border: '1px solid #6EE7B7', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                  Approve only
                </button>
                <button onClick={() => { onApprove(req.id); onClose(); onAdjustSchedule(req) }}
                  style={{ padding: '8px 18px', border: 'none', borderRadius: 8, background: '#059669', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar width={13} height={13} /> Approve & adjust schedule
                </button>
              </>
            ) : (
              <button onClick={() => { onApprove(req.id); onClose() }}
                style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#059669', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                Approve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F0F0F0' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: accent ?? '#111827' }}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  CREATE POLICY MODAL
// ─────────────────────────────────────────────────────────────

function CreatePolicyModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (p: Policy) => void
}) {
  const [name, setName]               = useState('')
  const [type, setType]               = useState<'internal' | 'client-paid'>('internal')
  const [client, setClient]           = useState('')
  const [maxBalance, setMaxBalance]   = useState('40')
  const [accrualRate, setAccrualRate] = useState('0')
  const [rolloverCap, setRolloverCap] = useState('')
  const [allowNeg, setAllowNeg]       = useState(false)
  const [memberIds, setMemberIds]     = useState<string[]>([])

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }

  const valid = name.trim().length > 0 && (type === 'internal' || client.trim().length > 0) && memberIds.length > 0

  function toggleMember(id: string) {
    setMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  function submit() {
    const policy: Policy = {
      id: `pol-${Date.now()}`,
      name: name.trim(),
      type,
      client: type === 'client-paid' ? client.trim() : undefined,
      color: '#6B7280',
      accrualRate: parseFloat(accrualRate) || 0,
      maxBalance: parseInt(maxBalance) || 0,
      allowNegative: allowNeg,
      rolloverCap: rolloverCap.trim() === '' || rolloverCap.trim().toLowerCase() === 'unlimited' ? null : parseInt(rolloverCap) || null,
      members: memberIds,
    }
    onSubmit(policy)
    onClose()
  }

  const hoursVal = parseInt(maxBalance) || 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 540, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Create Policy</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Define a new leave policy and assign members</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={lbl}>Policy name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Annual Leave" style={inp} />
          </div>

          {/* Type */}
          <div>
            <label style={lbl}>Type</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['internal', 'client-paid'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${type === t ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 8, background: type === t ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: type === t ? '#6C63FF' : '#6B7280', fontFamily: 'inherit' }}>
                  {t === 'internal' ? 'Internal' : '$ Client-paid'}
                </button>
              ))}
            </div>
          </div>

          {/* Client name (only if client-paid) */}
          {type === 'client-paid' && (
            <div>
              <label style={lbl}>Client name</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Acme Corp" style={inp} />
            </div>
          )}

          {/* Allocation + Accrual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Total allocation (hours)</label>
              <input type="number" min="0" value={maxBalance} onChange={e => setMaxBalance(e.target.value)} placeholder="40" style={inp} />
              {hoursVal > 0 && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hoursVal / 8} day{hoursVal / 8 !== 1 ? 's' : ''}</div>}
            </div>
            <div>
              <label style={lbl}>Accrual rate (h/month)</label>
              <input type="number" min="0" step="0.5" value={accrualRate} onChange={e => setAccrualRate(e.target.value)} placeholder="0 = fixed grant" style={inp} />
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>0 = granted upfront</div>
            </div>
          </div>

          {/* Rollover + Negative */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Rollover cap (hours)</label>
              <input value={rolloverCap} onChange={e => setRolloverCap(e.target.value)} placeholder="Leave blank = unlimited" style={inp} />
            </div>
            <div>
              <label style={lbl}>Allow negative balance</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
                <button onClick={() => setAllowNeg(v => !v)} style={{ width: 40, height: 22, borderRadius: 99, background: allowNeg ? '#059669' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: allowNeg ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <span style={{ fontSize: 13, color: '#374151' }}>{allowNeg ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Balance preview */}
          {hoursVal > 0 && (
            <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, fontSize: 12, color: '#6C63FF', display: 'flex', gap: 16 }}>
              <span><strong>{hoursVal}h</strong> total · <strong>{hoursVal / 8} day{hoursVal / 8 !== 1 ? 's' : ''}</strong></span>
              {rolloverCap ? <span>Rollover cap: <strong>{rolloverCap}h</strong></span> : <span>Rollover: <strong>Unlimited</strong></span>}
              {parseFloat(accrualRate) > 0 && <span>Accrues <strong>{accrualRate}h/mo</strong></span>}
            </div>
          )}

          {/* Members */}
          <div>
            <label style={lbl}>Assign members <span style={{ color: '#EF4444' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WORKERS.map(w => {
                const sel = memberIds.includes(w.id)
                return (
                  <button key={w.id} onClick={() => toggleMember(w.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', border: `1.5px solid ${sel ? w.color : '#E5E7EB'}`, borderRadius: 99, background: sel ? w.bg : '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: sel ? 600 : 400, color: sel ? w.color : '#374151', fontFamily: 'inherit', transition: 'all 0.1s' }}>
                    <Avatar initials={w.initials} color={w.color} bg={w.bg} size={20} />
                    {w.name}
                    {sel && <Check width={11} height={11} />}
                  </button>
                )
              })}
            </div>
            {memberIds.length === 0 && <div style={{ fontSize: 11.5, color: '#EF4444', marginTop: 6 }}>Select at least one member</div>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Cancel</button>
          <button onClick={submit} disabled={!valid}
            style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: !valid ? '#E5E7EB' : '#6C63FF', cursor: !valid ? 'not-allowed' : 'pointer', fontSize: 13, color: !valid ? '#9CA3AF' : '#fff', fontWeight: 600 }}>
            Create policy
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  NEW REQUEST MODAL
// ─────────────────────────────────────────────────────────────

function NewRequestModal({ existingRequests, onClose, onSubmit }: {
  existingRequests: PtoRequest[]
  onClose: () => void
  onSubmit: (r: PtoRequest) => void
}) {
  const [workerId, setWorkerId]       = useState('w1')
  const [policyId, setPolicyId]       = useState('p1')
  const [startDate, setStartDate]     = useState('2026-06-10')
  const [endDate, setEndDate]         = useState('2026-06-10')
  const [hoursPerDay, setHoursPerDay] = useState(8)
  const [notes, setNotes]             = useState('')

  const worker = WORKERS.find(w => w.id === workerId)!
  const availablePolicies = POLICIES.filter(p => p.members.includes(workerId))
  const days = weekdaysBetween(startDate, endDate)
  const hoursRequested = days * hoursPerDay
  const balance = (worker.balance as Record<string, number>)[policyId] ?? 0
  const afterBalance = balance - hoursRequested

  // Per-day cap: find which days in the range would exceed 8h
  const requestedDays = useMemo(() => {
    if (!startDate || !endDate || days <= 0) return []
    const result: { date: string; existingHours: number; wouldExceed: boolean }[] = []
    let cur = startDate
    while (cur <= endDate) {
      if (!isWeekend(cur)) {
        const existingHours = existingRequests
          .filter(r => r.workerId === workerId && r.status !== 'denied' && r.startDate <= cur && r.endDate >= cur)
          .reduce((sum, r) => sum + r.hoursPerDay, 0)
        result.push({ date: cur, existingHours, wouldExceed: existingHours + hoursPerDay > 8 })
      }
      cur = addDays(cur, 1)
    }
    return result
  }, [startDate, endDate, workerId, hoursPerDay, existingRequests, days])

  const overCapDays = requestedDays.filter(d => d.wouldExceed)

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }

  function submit() {
    const req: PtoRequest = {
      id: `r${Date.now()}`,
      workerId, workerName: worker.name, workerInitials: worker.initials,
      workerColor: worker.color, workerBg: worker.bg,
      policyId, startDate, endDate, days, hoursPerDay,
      status: 'pending', notes, submittedAt: new Date().toISOString(),
      isScheduled: false,
    }
    onSubmit(req)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 500, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>New Time-Off Request</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Employee</label>
            <select value={workerId} onChange={e => { setWorkerId(e.target.value); setPolicyId('') }} style={inp}>
              {WORKERS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Policy</label>
            <select value={policyId} onChange={e => setPolicyId(e.target.value)} style={inp}>
              <option value="">— select policy —</option>
              {availablePolicies.map(p => <option key={p.id} value={p.id}>{p.name} {p.type === 'client-paid' ? `(${p.client})` : ''}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Start date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>End date</label><input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} style={inp} /></div>
            <div>
              <label style={lbl}>Hours / day</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={0.5}
                  max={8}
                  step={0.5}
                  value={hoursPerDay}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v > 0) setHoursPerDay(Math.min(v, 8))
                  }}
                  style={{ ...inp, paddingRight: 30 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF', pointerEvents: 'none' }}>h</span>
              </div>
              <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 4 }}>
                {hoursPerDay >= 8 ? 'Full day' : hoursPerDay === 4 ? 'Half day' : `${hoursPerDay}h / day`}
              </div>
            </div>
          </div>

          {policyId && days > 0 && (
            <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, fontSize: 12, color: '#6C63FF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>
                  <strong>{days}</strong> day{days !== 1 ? 's' : ''}
                  {' × '}<strong>{hoursPerDay}h</strong>
                  {' = '}<strong>{hoursRequested}h</strong> total
                </span>
                <span>
                  Balance: <strong style={{ color: balance >= hoursRequested ? '#059669' : '#DC2626' }}>{balance}h</strong>
                  {' → '}
                  <strong style={{ color: afterBalance < 0 ? '#DC2626' : '#059669' }}>{afterBalance}h</strong>
                </span>
              </div>
              {afterBalance < 0 && (
                <div style={{ fontSize: 11, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <AlertTriangle width={11} height={11} />
                  Requesting {Math.abs(afterBalance)}h more than available balance.
                </div>
              )}
            </div>
          )}

          {overCapDays.length > 0 && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
                <AlertTriangle width={13} height={13} />
                Daily 8h limit exceeded on {overCapDays.length} day{overCapDays.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {overCapDays.map(d => (
                  <span key={d.date} style={{ background: '#FEE2E2', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
                    {fmtDateShort(d.date)} · {d.existingHours}h already booked
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label style={lbl}>Notes <span style={{ color: '#9CA3AF', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for request…" style={{ ...inp, resize: 'vertical' }} />
          </div>

          {isWeekend(startDate) && (
            <div style={{ padding: '8px 12px', background: '#FFF7ED', borderRadius: 7, fontSize: 12, color: '#D97706', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle width={12} height={12} /> Start date is a weekend — weekday count may not reflect actual days off.
            </div>
          )}
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Cancel</button>
          <button onClick={submit} disabled={!policyId || days <= 0 || overCapDays.length > 0}
            style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: !policyId || days <= 0 || overCapDays.length > 0 ? '#E5E7EB' : '#6C63FF', cursor: !policyId || days <= 0 || overCapDays.length > 0 ? 'not-allowed' : 'pointer', fontSize: 13, color: !policyId || days <= 0 || overCapDays.length > 0 ? '#9CA3AF' : '#fff', fontWeight: 600 }}>
            Submit request
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  POLICY SETTINGS PANEL
// ─────────────────────────────────────────────────────────────

function PolicySettingsPanel({ onClose }: { onClose: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', width: 480, height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Policy Administration</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Manage accrual rates, balances, and member assignments</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{POLICIES.length} policies</div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#6C63FF' }}>
              <Plus width={13} height={13} /> Add policy
            </button>
          </div>
          {POLICIES.map(policy => (
            <div key={policy.id} style={{ marginBottom: 12, border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
              <div
                onClick={() => setEditingId(editingId === policy.id ? null : policy.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: editingId === policy.id ? '#FAFAFA' : '#fff' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: policy.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{policy.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>
                    {policy.type === 'client-paid' ? `Client-paid · ${policy.client}` : 'Internal'}
                    {policy.accrualRate > 0 ? ` · ${policy.accrualRate}h/mo` : ' · No accrual'}
                    {' · '}{policy.members.length} member{policy.members.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <ChevronRight width={14} height={14} style={{ color: '#9CA3AF', transform: editingId === policy.id ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
              </div>

              {editingId === policy.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    <PolicyField label="Accrual rate (h/mo)" value={String(policy.accrualRate)} />
                    <PolicyField label="Max balance (h)" value={String(policy.maxBalance)} />
                    <PolicyField label="Rollover cap (h)" value={policy.rolloverCap === null ? 'Unlimited' : String(policy.rolloverCap)} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Allow negative</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 36, height: 20, borderRadius: 99, background: policy.allowNegative ? '#059669' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                          <div style={{ position: 'absolute', top: 2, left: policy.allowNegative ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#374151' }}>{policy.allowNegative ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Members ({policy.members.length})</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {policy.members.map(mid => {
                        const w = WORKERS.find(ww => ww.id === mid)
                        if (!w) return null
                        return (
                          <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff', borderRadius: 99, border: '1px solid #E5E7EB', fontSize: 12, color: '#374151' }}>
                            <Avatar initials={w.initials} color={w.color} bg={w.bg} size={18} />
                            {w.name}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button style={{ padding: '7px 16px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}>Save changes</button>
                    <button style={{ padding: '7px 16px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: 12.5 }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PolicyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <input defaultValue={value} style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  ADJUST SCHEDULE MODAL
//  Reschedule the hours of an approved/pending time-off as
//  make-up shifts: any date (same day, new day, weekend),
//  any time, split across as many blocks as needed.
// ─────────────────────────────────────────────────────────────

interface MakeupBlock {
  id: number
  date: string
  start: string  // HH:MM
  end: string    // HH:MM
}

function timeToMin(t: string) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function blockHours(b: MakeupBlock) {
  const s = timeToMin(b.start), e = timeToMin(b.end)
  if (s === null || e === null || e <= s) return 0
  return (e - s) / 60
}
function fmtHrs(h: number) {
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`
}
function fmtTime12(t: string) {
  const m = timeToMin(t)
  if (m === null) return ''
  const h = Math.floor(m / 60), min = m % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return min === 0 ? `${h12}${ampm}` : `${h12}:${String(min).padStart(2, '0')}${ampm}`
}
function dayLabel(ds: string) {
  return parseUTC(ds).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function AdjustScheduleModal({ req, onClose }: { req: PtoRequest; onClose: () => void }) {
  const [mode, setMode] = useState<'makeup' | 'remove'>('makeup')
  const [note, setNote] = useState('')
  const [blocks, setBlocks] = useState<MakeupBlock[]>([
    { id: 1, date: addDays(req.endDate, 1), start: '09:00', end: '17:00' },
  ])
  const nextId = React.useRef(2)

  // Days being taken off, with the worker's original shift if we have one
  const offDays = useMemo(() => {
    const out: { date: string; shift?: string }[] = []
    let cur = req.startDate
    while (cur <= req.endDate) {
      if (!isWeekend(cur)) {
        const shift = SHIFT_DAYS.find(s => s.date === cur && s.workerId === req.workerId)
        out.push({ date: cur, shift: shift?.label })
      }
      cur = addDays(cur, 1)
    }
    return out
  }, [req])

  const targetHours = req.days * req.hoursPerDay
  const coveredHours = blocks.reduce((sum, b) => sum + blockHours(b), 0)
  const remaining = targetHours - coveredHours
  const inOffRange = (d: string) => d >= req.startDate && d <= req.endDate

  // Per-block validation
  const blockIssues = blocks.map(b => {
    if (!b.date) return 'Pick a date'
    const s = timeToMin(b.start), e = timeToMin(b.end)
    if (s === null || e === null) return 'Set start and end time'
    if (e <= s) return 'End time must be after start'
    return null
  })

  // Per-day totals across blocks (catch >8h stacking on one day)
  const dayTotals = blocks.reduce<Record<string, number>>((acc, b) => {
    if (b.date) acc[b.date] = (acc[b.date] ?? 0) + blockHours(b)
    return acc
  }, {})
  const overloadedDays = Object.entries(dayTotals).filter(([, h]) => h > 8)

  // Existing shifts colliding with make-up days (outside the off range —
  // inside the range the original shift is being removed anyway)
  const collisions = blocks.filter(b =>
    b.date && !inOffRange(b.date) &&
    SHIFT_DAYS.some(s => s.workerId === req.workerId && s.date === b.date)
  )

  const blocksValid = blockIssues.every(i => i === null)
  const canApply = mode === 'remove' || (blocks.length > 0 && blocksValid && coveredHours > 0)

  function updateBlock(id: number, patch: Partial<MakeupBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
  }
  function addBlock() {
    const last = blocks[blocks.length - 1]
    setBlocks(prev => [...prev, {
      id: nextId.current++,
      date: last?.date ? addDays(last.date, 1) : addDays(req.endDate, 1),
      start: last?.start || '09:00',
      end: last?.end || '17:00',
    }])
  }
  function removeBlock(id: number) {
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const inp: React.CSSProperties = { padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }

  const coverageColor = remaining > 0 ? '#D97706' : remaining < 0 ? '#DC2626' : '#059669'
  const coveragePct = Math.min(100, targetHours > 0 ? (coveredHours / targetHours) * 100 : 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 310, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 580, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Adjust Schedule</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{req.workerName} · {fmtDateShort(req.startDate)}{req.startDate !== req.endDate ? ` – ${fmtDateShort(req.endDate)}` : ''} · {fmtHrs(targetHours)} off</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Time being taken off */}
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Time off to cover</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {offDays.map(d => (
                <div key={d.date} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #FDE68A', background: '#FFFBEB', minWidth: 104 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{dayLabel(d.date)}</div>
                  <div style={{ fontSize: 11, color: '#D97706', marginTop: 2 }}>{d.shift ?? `${fmtHrs(req.hoursPerDay)} shift`}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {([['makeup', 'Make up the hours'], ['remove', 'Remove shifts only']] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '9px 12px', border: `1.5px solid ${mode === m ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 8, background: mode === m ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: mode === m ? '#6C63FF' : '#6B7280', fontFamily: 'inherit' }}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'remove' ? (
            <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, fontSize: 13, color: '#059669', marginBottom: 16 }}>
              Scheduled shifts on the requested days will be removed and the {fmtHrs(targetHours)} will be drawn from the worker's PTO balance. No make-up time is scheduled.
            </div>
          ) : (
            <>
              {/* Make-up shift builder */}
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Make-up shifts</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {blocks.map((b, i) => {
                    const hrs = blockHours(b)
                    const issue = blockIssues[i]
                    const sameDay = b.date && inOffRange(b.date)
                    const weekend = b.date && isWeekend(b.date)
                    return (
                      <div key={b.id} style={{ border: `1px solid ${issue ? '#FCA5A5' : '#E5E7EB'}`, borderRadius: 9, padding: '10px 12px', background: '#FAFAFA' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="date" value={b.date} onChange={e => updateBlock(b.id, { date: e.target.value })} style={{ ...inp, flex: '1 1 140px' }} />
                          <input type="time" value={b.start} onChange={e => updateBlock(b.id, { start: e.target.value })} style={{ ...inp, width: 102 }} />
                          <ArrowRight width={13} height={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                          <input type="time" value={b.end} onChange={e => updateBlock(b.id, { end: e.target.value })} style={{ ...inp, width: 102 }} />
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: hrs > 0 ? '#6C63FF' : '#D1D5DB', width: 38, textAlign: 'right', flexShrink: 0 }}>{hrs > 0 ? fmtHrs(hrs) : '—'}</div>
                          <button onClick={() => removeBlock(b.id)} title="Remove" disabled={blocks.length === 1}
                            style={{ border: 'none', background: 'none', cursor: blocks.length === 1 ? 'not-allowed' : 'pointer', color: blocks.length === 1 ? '#E5E7EB' : '#9CA3AF', padding: 4, display: 'flex', flexShrink: 0 }}>
                            <Trash2 width={14} height={14} />
                          </button>
                        </div>
                        {(issue || sameDay || weekend) && (
                          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {issue && <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>{issue}</span>}
                            {!issue && sameDay && (
                              <span style={{ fontSize: 11, color: '#0EA5E9', fontWeight: 500 }}>
                                Same day as time off — works {fmtTime12(b.start)}–{fmtTime12(b.end)} instead of the original shift
                              </span>
                            )}
                            {!issue && weekend && !sameDay && (
                              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{dayLabel(b.date)} is a weekend</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button onClick={addBlock}
                  style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px dashed #C7C3FF', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#6C63FF', fontFamily: 'inherit' }}>
                  <Plus width={13} height={13} /> Add another shift
                </button>
              </div>

              {/* Coverage tracker */}
              <div style={{ padding: '12px 14px', background: '#F9FAFB', border: '1px solid #F0F0F0', borderRadius: 9, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 12.5, color: '#374151' }}>
                    Scheduled <strong style={{ color: coverageColor }}>{fmtHrs(coveredHours)}</strong> of <strong>{fmtHrs(targetHours)}</strong>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: coverageColor }}>
                    {remaining > 0 ? `${fmtHrs(remaining)} short` : remaining < 0 ? `${fmtHrs(-remaining)} over` : 'Fully covered'}
                  </span>
                </div>
                <div style={{ height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${coveragePct}%`, background: coverageColor, borderRadius: 99, transition: 'width 0.15s, background 0.15s' }} />
                </div>
                {remaining > 0 && coveredHours > 0 && (
                  <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 7 }}>
                    The uncovered {fmtHrs(remaining)} will be drawn from the worker's PTO balance.
                  </div>
                )}
                {remaining < 0 && (
                  <div style={{ fontSize: 11.5, color: '#DC2626', marginTop: 7 }}>
                    Make-up shifts exceed the time taken off — reduce hours or confirm overtime is intended.
                  </div>
                )}
              </div>

              {/* Warnings */}
              {overloadedDays.length > 0 && (
                <div style={{ padding: '9px 13px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <AlertTriangle width={13} height={13} style={{ flexShrink: 0 }} />
                  <span>Over 8h scheduled on {overloadedDays.map(([d, h]) => `${dayLabel(d)} (${fmtHrs(h)})`).join(', ')}.</span>
                </div>
              )}
              {collisions.length > 0 && (
                <div style={{ padding: '9px 13px', background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#B45309', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <AlertTriangle width={13} height={13} style={{ flexShrink: 0 }} />
                  <span>
                    {req.workerName.split(' ')[0]} already has a shift on {collisions.map(b => {
                      const s = SHIFT_DAYS.find(sd => sd.workerId === req.workerId && sd.date === b.date)
                      return `${dayLabel(b.date)}${s ? ` (${s.label})` : ''}`
                    }).join(', ')} — make-up hours will stack on top.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Manager note */}
          <div>
            <label style={lbl}>Manager note</label>
            <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional reason or instructions for the worker…" style={{ ...inp, width: '100%', resize: 'none' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {mode === 'makeup' && canApply && (
            <span style={{ fontSize: 12, color: '#9CA3AF', marginRight: 'auto' }}>
              {blocks.length} make-up shift{blocks.length !== 1 ? 's' : ''} · {fmtHrs(coveredHours)} rescheduled
            </span>
          )}
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Cancel</button>
          <button onClick={onClose} disabled={!canApply}
            style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: canApply ? '#6C63FF' : '#E5E7EB', cursor: canApply ? 'pointer' : 'not-allowed', fontSize: 13, color: canApply ? '#fff' : '#9CA3AF', fontWeight: 600 }}>
            Apply adjustment
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────

type Tab = 'requests' | 'policies'

export function TimeOffRequestsPage() {
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<PtoRequest[]>(INITIAL_REQUESTS)
  const [selectedReq, setSelectedReq] = useState<PtoRequest | null>(null)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [quickScheduleReq, setQuickScheduleReq] = useState<PtoRequest | null>(null)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [showCreatePolicy, setShowCreatePolicy] = useState(false)
  const [showPolicies, setShowPolicies] = useState(false)
  const [policies, setPolicies] = useState<Policy[]>(POLICIES)

  // Filters — all open by default (no date gate)
  const [searchQ, setSearchQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [policyFilter, setPolicyFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (searchQ && !r.workerName.toLowerCase().includes(searchQ.toLowerCase())) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (policyFilter !== 'all' && r.policyId !== policyFilter) return false
      if (dateFrom && r.endDate < dateFrom) return false
      if (dateTo && r.startDate > dateTo) return false
      return true
    }).sort((a, b) => {
      // Pending first, then by submission date desc
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      return b.submittedAt.localeCompare(a.submittedAt)
    })
  }, [requests, searchQ, statusFilter, policyFilter, dateFrom, dateTo])

  function approve(id: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: 'Yoshita K.' }
      : r))
  }
  function deny(id: string) {
    setRequests(prev => prev.map(r => r.id === id
      ? { ...r, status: 'denied', reviewedAt: new Date().toISOString(), reviewedBy: 'Yoshita K.' }
      : r))
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const clientPaidCount = requests.filter(r => POLICIES.find(p => p.id === r.policyId)?.type === 'client-paid').length

  const pill: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#374151', fontFamily: 'inherit' }
  const activeFilterStyle = (active: boolean): React.CSSProperties => ({
    ...pill,
    border: `1px solid ${active ? '#6C63FF' : '#E5E7EB'}`,
    background: active ? '#F5F3FF' : '#fff',
    color: active ? '#6C63FF' : '#374151',
    fontWeight: active ? 600 : 400,
  })

  return (
    <>
      <TopBar crumbs={[{ label: 'Time Off Requests' }]} />

      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid #E8E8E8', height: 52, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['requests', 'policies'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0 18px', height: 52, border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13.5, fontWeight: 600, color: tab === t ? '#6C63FF' : '#9CA3AF',
              borderBottom: tab === t ? '2px solid #6C63FF' : '2px solid transparent',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              {t === 'requests' ? 'Requests' : 'Policies'}
              {t === 'requests' && pendingCount > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', lineHeight: 1.6 }}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconBtn title="Policy settings" onClick={() => setShowPolicies(true)}><Settings width={14} height={14} /></IconBtn>
          {tab === 'requests' ? (
            <button onClick={() => setShowNewRequest(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <Plus width={13} height={13} /> New request
            </button>
          ) : (
            <button onClick={() => setShowCreatePolicy(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <Plus width={13} height={13} /> Create policy
            </button>
          )}
        </div>
      </div>

      <div className="content">
        {tab === 'requests' ? (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <SummaryCard label="Total requests" value={requests.length} icon={<CalendarDays width={16} height={16} />} color="#6C63FF" />
              <SummaryCard label="Pending review" value={pendingCount} icon={<Clock width={16} height={16} />} color="#D97706" alert={pendingCount > 0} />
              <SummaryCard label="Client-paid" value={clientPaidCount} icon={<DollarSign width={16} height={16} />} color="#0EA5E9" />
              <SummaryCard label="Policies" value={POLICIES.length} icon={<Shield width={16} height={16} />} color="#10B981" />
            </div>

            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                <Search width={13} height={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search employee…"
                  style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>

              {/* Status filter */}
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as RequestStatus | 'all')} style={{ ...pill } as React.CSSProperties}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="denied">Denied</option>
              </select>

              {/* Policy filter (billing-critical for Jayce) */}
              <select value={policyFilter} onChange={e => setPolicyFilter(e.target.value)} style={{ ...pill } as React.CSSProperties}>
                <option value="all">All policies</option>
                {POLICIES.map(p => <option key={p.id} value={p.id}>{p.name}{p.type === 'client-paid' ? ' ★' : ''}</option>)}
              </select>

              {/* Date range — optional filter, not mandatory */}
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...pill, cursor: 'default' } as React.CSSProperties} title="From date" />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>–</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...pill, cursor: 'default' } as React.CSSProperties} title="To date" />

              {(searchQ || statusFilter !== 'all' || policyFilter !== 'all' || dateFrom || dateTo) && (
                <button onClick={() => { setSearchQ(''); setStatusFilter('all'); setPolicyFilter('all'); setDateFrom(''); setDateTo('') }}
                  style={{ ...pill, color: '#EF4444', borderColor: '#FCA5A5' }}>
                  <X width={12} height={12} /> Clear
                </button>
              )}

              <div style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 'auto' }}>
                {filtered.length} of {requests.length} request{requests.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Client-paid billing notice */}
            {policyFilter !== 'all' && POLICIES.find(p => p.id === policyFilter)?.type === 'client-paid' && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', fontSize: 12.5, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign width={14} height={14} />
                <strong>Billing filter active:</strong> Showing only {POLICIES.find(p => p.id === policyFilter)?.name} requests. Approved requests will push this policy name to the timesheet.
              </div>
            )}

            {/* Request table */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
                    <th style={th}>Employee</th>
                    <th style={th}>Policy</th>
                    <th style={th}>Dates</th>
                    <th style={th}>Duration</th>
                    <th style={th}>Balance remaining</th>
                    <th style={th}>Status</th>
                    <th style={th}>Submitted</th>
                    <th style={{ ...th, borderRight: 'none' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No requests match the current filters.</td></tr>
                  ) : filtered.map((req, i) => {
                    const policy = POLICIES.find(p => p.id === req.policyId)
                    if (!policy) return null
                    const hasScheduleConflict = req.isScheduled
                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedReq(req)}
                        style={{ borderTop: i > 0 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar initials={req.workerInitials} color={req.workerColor} bg={req.workerBg} size={32} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{req.workerName}</div>
                              {hasScheduleConflict && (
                                <div style={{ fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                                  <AlertTriangle width={10} height={10} /> Has shift
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={td}><PolicyBadge policy={policy} /></td>
                        <td style={td}>
                          <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                            {req.startDate === req.endDate ? fmtDate(req.startDate) : `${fmtDateShort(req.startDate)} – ${fmtDateShort(req.endDate)}`}
                          </div>
                        </td>
                        <td style={td}>
                          <div style={{ fontSize: 13, color: '#374151' }}>{req.days * req.hoursPerDay}h</div>
                        </td>
                        <td style={td}>
                          {(() => {
                            const worker = WORKERS.find(w => w.id === req.workerId)
                            const bal = worker ? ((worker.balance as Record<string, number>)[req.policyId] ?? null) : null
                            const policy = POLICIES.find(p => p.id === req.policyId)
                            const used = req.days * req.hoursPerDay
                            const after = bal !== null ? bal - used : null
                            const low = bal !== null && bal <= used
                            if (bal === null) return <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                            return (
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: low ? '#DC2626' : '#059669' }}>
                                  {bal}h left
                                </div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                                  of {policy && policy.maxBalance > 0 ? `${policy.maxBalance}h` : '—'} · after: <span style={{ color: after !== null && after < 0 ? '#DC2626' : '#6B7280', fontWeight: 500 }}>{after}h</span>
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td style={td}><StatusBadge status={req.status} /></td>
                        <td style={{ ...td, color: '#9CA3AF', fontSize: 12 }}>{fmtDT(req.submittedAt)}</td>
                        <td style={{ ...td, borderRight: 'none', width: 1, whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {req.status === 'pending' && (
                              <>
                                <button onClick={() => approve(req.id)} title="Approve"
                                  style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, background: '#F0FDF4', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Check width={14} height={14} />
                                </button>
                                <button onClick={() => deny(req.id)} title="Deny"
                                  style={{ width: 28, height: 28, padding: 0, border: 'none', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <X width={14} height={14} />
                                </button>
                              </>
                            )}
                            {req.isScheduled && (
                              <button onClick={() => setQuickScheduleReq(req)} title="Adjust schedule"
                                style={{ width: 28, height: 28, padding: 0, border: '1px solid #FDE68A', borderRadius: 6, background: '#FFF7ED', color: '#D97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar width={14} height={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Timesheet sync notice */}
            <div style={{ marginTop: 14, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #E8E8E8', fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info width={13} height={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
              <span><strong>Timesheet sync:</strong> Approved requests push the exact policy name to the timesheet. Denied or cancelled requests are automatically removed from the timesheet.</span>
            </div>
          </>
        ) : (
          <PoliciesTab policies={policies} onSelect={p => setSelectedPolicy(p)} />
        )}
      </div>

      {selectedReq && (
        <RequestDetailModal req={selectedReq} onClose={() => setSelectedReq(null)} onApprove={approve} onDeny={deny} onAdjustSchedule={r => setQuickScheduleReq(r)} />
      )}
      {quickScheduleReq && (
        <AdjustScheduleModal req={quickScheduleReq} onClose={() => setQuickScheduleReq(null)} />
      )}
      {showNewRequest && (
        <NewRequestModal existingRequests={requests} onClose={() => setShowNewRequest(false)} onSubmit={r => setRequests(p => [r, ...p])} />
      )}
      {showPolicies && (
        <PolicySettingsPanel onClose={() => setShowPolicies(false)} />
      )}
      {selectedPolicy && (
        <PolicyDetailModal policy={selectedPolicy} requests={requests} onClose={() => setSelectedPolicy(null)} />
      )}
      {showCreatePolicy && (
        <CreatePolicyModal onClose={() => setShowCreatePolicy(false)} onSubmit={p => setPolicies(prev => [...prev, p])} />
      )}
    </>
  )
}

const th: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF',
  textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid #F0F0F0',
}
const td: React.CSSProperties = {
  padding: '13px 16px', verticalAlign: 'middle', borderRight: '1px solid #F0F0F0',
}

function SummaryCard({ label, value, icon, color, alert }: { label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: `1px solid ${alert ? '#FDE68A' : '#E8E8E8'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

function PoliciesTab({ policies, onSelect }: { policies: Policy[]; onSelect: (p: Policy) => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
            <th style={th}>Policy</th>
            <th style={th}>Type</th>
            <th style={th}>Allocation</th>
            <th style={th}>Accrual</th>
            <th style={th}>Rollover cap</th>
            <th style={th}>Negative balance</th>
            <th style={{ ...th, borderRight: 'none' }}>Members</th>
          </tr>
        </thead>
        <tbody>
          {POLICIES.map((policy, i) => {
            const workerList = WORKERS.filter(w => policy.members.includes(w.id))
            return (
              <tr
                key={policy.id}
                onClick={() => onSelect(policy)}
                style={{ borderTop: i > 0 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: policy.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{policy.name}</div>
                      {policy.type === 'client-paid' && (
                        <div style={{ fontSize: 11, color: '#1D4ED8', marginTop: 1 }}>{policy.client}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={td}>
                  {policy.type === 'client-paid' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                      <DollarSign width={10} height={10} /> Client-paid
                    </span>
                  ) : (
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                      Internal
                    </span>
                  )}
                </td>
                <td style={td}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {policy.maxBalance > 0 ? `${policy.maxBalance}h` : '—'}
                  </div>
                  {policy.maxBalance > 0 && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{policy.maxBalance / 8} days</div>
                  )}
                </td>
                <td style={{ ...td, color: '#374151', fontSize: 13 }}>
                  {policy.accrualRate > 0 ? `${policy.accrualRate}h / mo` : <span style={{ color: '#D1D5DB' }}>None</span>}
                </td>
                <td style={{ ...td, fontSize: 13, color: '#374151' }}>
                  {policy.rolloverCap === null ? 'Unlimited' : `${policy.rolloverCap}h`}
                </td>
                <td style={td}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                    background: policy.allowNegative ? '#F0FDF4' : '#F9FAFB',
                    color: policy.allowNegative ? '#059669' : '#9CA3AF',
                    border: `1px solid ${policy.allowNegative ? '#6EE7B7' : '#E5E7EB'}`,
                  }}>
                    {policy.allowNegative ? 'Allowed' : 'Not allowed'}
                  </span>
                </td>
                <td style={{ ...td, borderRight: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {workerList.slice(0, 5).map((w, idx) => (
                      <div key={w.id} title={w.name} style={{ marginLeft: idx > 0 ? -6 : 0, zIndex: 10 - idx }}>
                        <Avatar initials={w.initials} color={w.color} bg={w.bg} size={26} />
                      </div>
                    ))}
                    {workerList.length > 5 && (
                      <span style={{ marginLeft: 4, fontSize: 11.5, color: '#9CA3AF' }}>+{workerList.length - 5}</span>
                    )}
                    <span style={{ marginLeft: 6, fontSize: 12, color: '#9CA3AF' }}>{workerList.length} member{workerList.length !== 1 ? 's' : ''}</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  POLICY DETAIL MODAL
// ─────────────────────────────────────────────────────────────

function PolicyDetailModal({ policy, requests, onClose }: { policy: Policy; requests: PtoRequest[]; onClose: () => void }) {
  const workerList = WORKERS.filter(w => policy.members.includes(w.id))
  const policyRequests = requests.filter(r => r.policyId === policy.id)
  const pending  = policyRequests.filter(r => r.status === 'pending').length
  const approved = policyRequests.filter(r => r.status === 'approved').length
  const denied   = policyRequests.filter(r => r.status === 'denied').length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 620, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: policy.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{policy.name}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
              {policy.type === 'client-paid' ? `Client-paid · ${policy.client}` : 'Internal policy'}
            </div>
          </div>
          {policy.type === 'client-paid' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
              <DollarSign width={10} height={10} /> Billable
            </span>
          )}
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
            <InfoCard label="Allocation" value={policy.maxBalance > 0 ? `${policy.maxBalance}h (${policy.maxBalance / 8}d)` : '—'} />
            <InfoCard label="Accrual" value={policy.accrualRate > 0 ? `${policy.accrualRate}h/mo` : 'Fixed'} />
            <InfoCard label="Rollover cap" value={policy.rolloverCap === null ? 'Unlimited' : `${policy.rolloverCap}h`} />
            <InfoCard label="Negative balance" value={policy.allowNegative ? 'Allowed' : 'Not allowed'} accent={policy.allowNegative ? '#059669' : '#9CA3AF'} />
          </div>

          {/* Request summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Request history ({policyRequests.length} total)</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FDE68A', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#D97706' }}>{pending}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Pending</div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #6EE7B7', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>{approved}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Approved</div>
              </div>
              <div style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>{denied}</div>
                <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Denied</div>
              </div>
            </div>
          </div>

          {/* Members with balances */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Members & balances</div>
            <div style={{ border: '1px solid #E8E8E8', borderRadius: 9, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
                    <th style={{ ...th, fontWeight: 700 }}>Employee</th>
                    <th style={{ ...th, fontWeight: 700 }}>Balance remaining</th>
                    <th style={{ ...th, fontWeight: 700, borderRight: 'none' }}>Used this year</th>
                  </tr>
                </thead>
                <tbody>
                  {workerList.map((w, i) => {
                    const bal = (w.balance as Record<string, number>)[policy.id] ?? null
                    const total = policy.maxBalance
                    const used = bal !== null && total > 0 ? total - bal : null
                    const pct = bal !== null && total > 0 ? Math.round((bal / total) * 100) : null
                    return (
                      <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #F0F0F0' : 'none' }}>
                        <td style={td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar initials={w.initials} color={w.color} bg={w.bg} size={28} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{w.name}</span>
                          </div>
                        </td>
                        <td style={td}>
                          {bal !== null ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: bal <= 8 ? '#DC2626' : '#059669' }}>{bal}h</span>
                                {total > 0 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>of {total}h</span>}
                              </div>
                              {total > 0 && pct !== null && (
                                <div style={{ height: 4, background: '#F0F0F0', borderRadius: 99, width: 80 }}>
                                  <div style={{ height: '100%', width: `${pct}%`, background: bal <= 8 ? '#EF4444' : '#10B981', borderRadius: 99 }} />
                                </div>
                              )}
                            </div>
                          ) : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ ...td, borderRight: 'none', fontSize: 13, color: '#374151' }}>
                          {used !== null ? `${used}h (${used / 8}d)` : <span style={{ color: '#D1D5DB' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Close</button>
          <button style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: '#6C63FF', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Settings width={13} height={13} /> Edit policy
          </button>
        </div>
      </div>
    </div>
  )
}
