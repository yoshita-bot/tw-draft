import React, { useState, useMemo, useRef } from 'react'
import {
  Plus, X, Check, Clock, Calendar, DollarSign, AlertTriangle,
  Paperclip, Upload, Info, CalendarDays, ChevronDown,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled'

interface Policy {
  id: string
  name: string
  type: 'client-paid' | 'internal'
  client?: string
  color: string
}

interface PtoRequest {
  id: string
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
  attachments: string[]
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function parseUTC(ds: string) {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function toYMD(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
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
  return parseUTC(d).getUTCDay() % 6 === 0
}
function weekdaysBetween(start: string, end: string, excludeWeekends: boolean) {
  let count = 0, cur = start
  while (cur <= end) {
    if (!excludeWeekends || !isWeekend(cur)) count++
    cur = addDays(cur, 1)
  }
  return count
}

// ─────────────────────────────────────────────────────────────
//  MOCK DATA  (current employee = Alice Chen / w1)
// ─────────────────────────────────────────────────────────────

const CURRENT_WORKER = {
  id: 'w1', name: 'Alice Chen', initials: 'AC', color: '#6C63FF', bg: '#EEEDFF',
}

// Paid Holiday and Bereavement are management-only; employees cannot self-request them
const MY_POLICIES: Policy[] = [
  { id: 'p1',  name: 'Paradigm',        type: 'client-paid', client: 'Paradigm Corp', color: '#6C63FF' },
  { id: 'pca', name: 'Client Approved', type: 'client-paid',                           color: '#0EA5E9' },
  { id: 'p3',  name: 'Paid Leave',      type: 'internal',                              color: '#10B981' },
  { id: 'p5',  name: 'Sick Leave',      type: 'internal',                              color: '#EF4444' },
]

// Balances — raw numbers (can be negative internally for realism)
const POLICY_BALANCE: Record<string, number> = {
  p1: 32, p3: 16, p4: 16, p5: 16, p6: 40,
}
const POLICY_TOTAL: Record<string, number> = {
  p1: 120, p3: 40, p4: 16, p5: 24, p6: 40,
}

// Display balance: never show negative — clamp to 0
function displayBalance(policyId: string) {
  return Math.max(0, POLICY_BALANCE[policyId] ?? 0)
}

const INITIAL_REQUESTS: PtoRequest[] = [
  { id: 'r1', policyId: 'p1', startDate: '2026-06-10', endDate: '2026-06-12', days: 3, hoursPerDay: 8, status: 'approved',  notes: 'Family vacation', submittedAt: '2026-05-28T10:30:00', reviewedAt: '2026-05-29T09:00:00', reviewedBy: 'Jayce M.', attachments: [] },
  { id: 'r6', policyId: 'p4', startDate: '2026-07-04', endDate: '2026-07-04', days: 1, hoursPerDay: 8, status: 'approved',  notes: 'Independence Day', submittedAt: '2026-05-15T11:00:00', reviewedAt: '2026-05-15T11:30:00', reviewedBy: 'System',   attachments: [] },
  { id: 'r9', policyId: 'p1', startDate: '2026-03-10', endDate: '2026-03-14', days: 5, hoursPerDay: 8, status: 'denied',    notes: 'Spring break',    submittedAt: '2026-02-20T10:00:00', reviewedAt: '2026-02-21T09:00:00', reviewedBy: 'Jayce M.', attachments: [] },
]

// ─────────────────────────────────────────────────────────────
//  SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const cfg: Record<RequestStatus, { bg: string; color: string; border: string; label: string }> = {
    pending:   { bg: '#FFF7ED', color: '#D97706', border: '#FDE68A', label: 'Pending'   },
    approved:  { bg: '#F0FDF4', color: '#059669', border: '#6EE7B7', label: 'Approved'  },
    denied:    { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', label: 'Denied'    },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', label: 'Cancelled' },
  }
  const c = cfg[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {status === 'pending'   && <Clock  width={10} height={10} />}
      {status === 'approved'  && <Check  width={10} height={10} />}
      {status === 'denied'    && <X      width={10} height={10} />}
      {status === 'cancelled' && <X      width={10} height={10} />}
      {c.label}
    </span>
  )
}

function PolicyDot({ policy }: { policy: Policy }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: policy.color + '18', color: policy.color, border: `1px solid ${policy.color}44` }}>
      {policy.type === 'client-paid' && <DollarSign width={10} height={10} />}
      {policy.name}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
//  BALANCE CARDS
// ─────────────────────────────────────────────────────────────

function BalanceCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
      {MY_POLICIES.map(p => {
        const bal = displayBalance(p.id)
        const total = POLICY_TOTAL[p.id] ?? 0
        const pct = total > 0 ? Math.round((bal / total) * 100) : 0
        const low = bal <= 8 && total > 0
        return (
          <div key={p.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${low ? '#FDE68A' : '#E8E8E8'}`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280' }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: low ? '#D97706' : '#111827', lineHeight: 1 }}>{bal}h</div>
            {total > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>of {total}h · {Math.round(bal / 8 * 10) / 10}d left</div>
                <div style={{ marginTop: 8, height: 4, background: '#F0F0F0', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: low ? '#F59E0B' : p.color, borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
              </>
            )}
            {low && <div style={{ fontSize: 10.5, color: '#D97706', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle width={10} height={10} /> Low balance</div>}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  NEW REQUEST MODAL (employee-facing)
// ─────────────────────────────────────────────────────────────

function NewRequestModal({ existingRequests, onClose, onSubmit }: {
  existingRequests: PtoRequest[]
  onClose: () => void
  onSubmit: (r: PtoRequest) => void
}) {
  const [policyId, setPolicyId]       = useState('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [hoursPerDay, setHoursPerDay] = useState<number | ''>('')
  const [notes, setNotes]             = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const policy = MY_POLICIES.find(p => p.id === policyId)
  const isClientPolicy = policy?.type === 'client-paid'

  const hours = typeof hoursPerDay === 'number' ? hoursPerDay : 0
  const days = startDate && endDate && startDate <= endDate
    ? weekdaysBetween(startDate, endDate, true)
    : 0
  const hoursRequested = days * hours
  const rawBalance = policyId ? (POLICY_BALANCE[policyId] ?? 0) : 0
  const shownBalance = Math.max(0, rawBalance)
  const afterBalance = rawBalance - hoursRequested
  const shownAfter = Math.max(0, afterBalance)

  const overCapDays = useMemo(() => {
    if (!startDate || !endDate || !policyId || days <= 0 || hours <= 0) return []
    const result: { date: string; booked: number }[] = []
    let cur = startDate
    while (cur <= endDate) {
      if (!isWeekend(cur)) {
        const booked = existingRequests
          .filter(r => r.status !== 'denied' && r.status !== 'cancelled' && r.startDate <= cur && r.endDate >= cur)
          .reduce((s, r) => s + r.hoursPerDay, 0)
        if (booked + hours > 8) result.push({ date: cur, booked })
      }
      cur = addDays(cur, 1)
    }
    return result
  }, [startDate, endDate, policyId, hours, existingRequests, days])

  const notesRequired      = isClientPolicy && !notes.trim()
  const attachmentRequired = isClientPolicy && attachments.length === 0

  const canSubmit = !!policyId && days > 0 && hours > 0 && hours <= 24
    && overCapDays.length === 0
    && !notesRequired && !attachmentRequired

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).map(f => f.name)
    setAttachments(prev => [...prev, ...files])
    e.target.value = ''
  }
  function removeAttachment(name: string) {
    setAttachments(prev => prev.filter(a => a !== name))
  }

  function submit() {
    const req: PtoRequest = {
      id: `r${Date.now()}`,
      policyId, startDate, endDate, days, hoursPerDay: hours,
      status: 'pending', notes, submittedAt: new Date().toISOString(), attachments,
    }
    onSubmit(req)
    onClose()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 11px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }
  const req = (required: boolean) => required
    ? <span style={{ color: '#EF4444' }}>*</span>
    : <span style={{ fontSize: 10.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#9CA3AF' }}>(optional)</span>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 500, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Request Time Off</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Submit a new leave request for review</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Policy dropdown */}
          <div>
            <label style={lbl}>Leave policy <span style={{ color: '#EF4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <select
                value={policyId}
                onChange={e => setPolicyId(e.target.value)}
                style={{ ...inp, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
              >
                <option value="">— select a policy —</option>
                {MY_POLICIES.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.type === 'client-paid' ? ` (Client-paid${p.client ? ' · ' + p.client : ''})` : ''}
                    {POLICY_BALANCE[p.id] !== undefined ? `  ·  ${displayBalance(p.id)}h available` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown width={14} height={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
            {policy && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: policy.color }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  {policy.type === 'client-paid'
                    ? `Client-paid policy${policy.client ? ' · ' + policy.client : ''}`
                    : 'Internal policy'}
                </span>
                {POLICY_BALANCE[policy.id] !== undefined && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: shownBalance <= 8 ? '#D97706' : '#374151', marginLeft: 'auto' }}>
                    {shownBalance}h available
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dates + hours per day */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Start date <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="date"
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value > endDate) setEndDate(e.target.value)
                }}
                style={{ ...inp, colorScheme: 'light' }}
              />
            </div>
            <div>
              <label style={lbl}>End date <span style={{ color: '#EF4444' }}>*</span></label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ ...inp, colorScheme: 'light' }}
              />
            </div>
            <div>
              <label style={lbl}>Hours / day <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  placeholder="e.g. 8"
                  value={hoursPerDay}
                  onChange={e => {
                    const v = e.target.value === '' ? '' : parseFloat(e.target.value)
                    setHoursPerDay(v as number | '')
                  }}
                  style={{ ...inp, paddingRight: 26 }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF', pointerEvents: 'none' }}>h</span>
              </div>
              {typeof hoursPerDay === 'number' && hoursPerDay > 0 && (
                <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 3 }}>
                  {hoursPerDay === 8 ? 'Full day' : hoursPerDay === 4 ? 'Half day' : `${hoursPerDay}h`}
                </div>
              )}
            </div>
          </div>

          {/* Balance preview */}
          {policyId && days > 0 && hours > 0 && (
            <div style={{ padding: '10px 14px', background: '#F5F3FF', borderRadius: 8, border: '1px solid #E0DCFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: afterBalance < 0 ? 6 : 0 }}>
                <span style={{ fontSize: 12.5, color: '#6C63FF' }}>
                  <strong>{days}</strong>d × <strong>{hours}h</strong> = <strong>{hoursRequested}h</strong>
                </span>
                {POLICY_BALANCE[policyId] !== undefined && (
                  <span style={{ fontSize: 12.5, color: '#374151' }}>
                    Balance: <strong style={{ color: shownBalance >= hoursRequested ? '#059669' : '#DC2626' }}>{shownBalance}h</strong>
                    {' → '}
                    <strong style={{ color: shownAfter === 0 && afterBalance < 0 ? '#DC2626' : '#059669' }}>{shownAfter}h</strong>
                  </span>
                )}
              </div>
              {afterBalance < 0 && (
                <div style={{ fontSize: 11.5, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle width={11} height={11} />
                  Requesting {Math.abs(afterBalance)}h more than your available balance.
                </div>
              )}
            </div>
          )}

          {/* Over-cap warning */}
          {overCapDays.length > 0 && (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626' }}>
              <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle width={13} height={13} /> Daily 8h limit exceeded on {overCapDays.length} day{overCapDays.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {overCapDays.map(d => (
                  <span key={d.date} style={{ background: '#FEE2E2', borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>
                    {fmtDateShort(d.date)} · {d.booked}h already booked
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Client-paid notice */}
          {isClientPolicy && (
            <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 8, fontSize: 12, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign width={13} height={13} style={{ flexShrink: 0 }} />
              Client-paid policy — notes and an attachment are required to submit this request.
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={lbl}>Notes {req(isClientPolicy)}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={isClientPolicy ? 'Describe the purpose of this leave…' : 'Reason for request…'}
              style={{ ...inp, resize: 'vertical', borderColor: notesRequired && notes !== '' ? '#FCA5A5' : '#E5E7EB' }}
            />
          </div>

          {/* File upload */}
          <div>
            <label style={lbl}>Attachments {req(isClientPolicy)}</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `1.5px dashed ${attachmentRequired && attachments.length === 0 ? '#FCA5A5' : '#D1D5DB'}`,
                borderRadius: 8, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6C63FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = attachmentRequired && attachments.length === 0 ? '#FCA5A5' : '#D1D5DB')}
            >
              <Upload width={18} height={18} style={{ color: '#9CA3AF' }} />
              <div style={{ fontSize: 12.5, color: '#6B7280', textAlign: 'center' }}>
                <span style={{ color: '#6C63FF', fontWeight: 600 }}>Click to upload</span>{' '}
                {isClientPolicy ? 'client approval proof or documentation' : 'supporting documentation'}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>PNG, JPG, PDF up to 10MB</div>
            </div>
            <input ref={fileRef} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} />
            {attachments.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {attachments.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F5F3FF', borderRadius: 7, border: '1px solid #E0DCFF' }}>
                    <Paperclip width={12} height={12} style={{ color: '#6C63FF', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a}</span>
                    <button onClick={() => removeAttachment(a)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex', lineHeight: 1 }}>
                      <X width={13} height={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Cancel</button>
          <button onClick={submit} disabled={!canSubmit}
            style={{ padding: '8px 22px', border: 'none', borderRadius: 8, background: canSubmit ? '#6C63FF' : '#E5E7EB', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: 13, color: canSubmit ? '#fff' : '#9CA3AF', fontWeight: 600 }}>
            Submit request
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  REQUEST DETAIL MODAL (read-only for employee)
// ─────────────────────────────────────────────────────────────

function RequestDetailModal({ req, onCancel, onClose }: {
  req: PtoRequest
  onClose: () => void
  onCancel: (id: string) => void
}) {
  const policy = MY_POLICIES.find(p => p.id === req.policyId)!
  const hours = req.days * req.hoursPerDay

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 480, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Request Details</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PolicyDot policy={policy} />
            <StatusBadge status={req.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <InfoTile label="Dates" value={req.startDate === req.endDate ? fmtDate(req.startDate) : `${fmtDateShort(req.startDate)} – ${fmtDate(req.endDate)}`} />
            <InfoTile label="Duration" value={`${hours}h (${req.days}d × ${req.hoursPerDay}h)`} />
            <InfoTile label="Submitted" value={fmtDT(req.submittedAt)} />
            <InfoTile label="Reviewed by" value={req.reviewedBy ?? '—'} />
          </div>

          {req.notes && (
            <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Your note</div>
              <div style={{ fontSize: 13, color: '#374151' }}>{req.notes}</div>
            </div>
          )}

          {req.attachments.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Attachments</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {req.attachments.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#374151' }}>
                    <Paperclip width={12} height={12} style={{ color: '#6C63FF' }} /> {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {req.reviewedAt && (
            <div style={{ padding: '10px 14px', background: req.status === 'approved' ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, fontSize: 12, color: req.status === 'approved' ? '#059669' : '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
              {req.status === 'approved' ? <Check width={13} height={13} /> : <X width={13} height={13} />}
              {req.status === 'approved' ? 'Approved' : 'Denied'} by {req.reviewedBy} · {fmtDT(req.reviewedAt)}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Close</button>
          {req.status === 'pending' && (
            <button onClick={() => { onCancel(req.id); onClose() }}
              style={{ padding: '8px 18px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FEF2F2', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
              Cancel request
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F0F0F0' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  UPCOMING DATA
// ─────────────────────────────────────────────────────────────

interface UpcomingItem {
  id: string
  label: string
  date: string         // YYYY-MM-DD
  endDate?: string
  kind: 'holiday' | 'approved' | 'pending'
  policyColor: string
  policyName: string
}

const COMPANY_HOLIDAYS: UpcomingItem[] = [
  { id: 'h1', label: 'Independence Day',  date: '2026-07-04', kind: 'holiday', policyColor: '#F59E0B', policyName: 'Paid Holiday' },
  { id: 'h2', label: 'Labor Day',         date: '2026-09-07', kind: 'holiday', policyColor: '#F59E0B', policyName: 'Paid Holiday' },
  { id: 'h3', label: 'Thanksgiving',      date: '2026-11-26', kind: 'holiday', policyColor: '#F59E0B', policyName: 'Paid Holiday' },
  { id: 'h4', label: 'Christmas Day',     date: '2026-12-25', kind: 'holiday', policyColor: '#F59E0B', policyName: 'Paid Holiday' },
]

function daysUntil(dateStr: string): number {
  const today = new Date('2026-06-04')
  const target = parseUTC(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function UpcomingSection({ requests }: { requests: PtoRequest[] }) {
  const myUpcoming: UpcomingItem[] = requests
    .filter(r => (r.status === 'approved' || r.status === 'pending') && r.startDate >= '2026-06-04')
    .map(r => {
      const policy = [...MY_POLICIES, { id: 'p4', name: 'Paid Holiday', color: '#F59E0B', type: 'internal' as const }]
        .find(p => p.id === r.policyId)!
      return {
        id: r.id,
        label: policy?.name ?? 'Leave',
        date: r.startDate,
        endDate: r.endDate !== r.startDate ? r.endDate : undefined,
        kind: r.status as 'approved' | 'pending',
        policyColor: policy?.color ?? '#9CA3AF',
        policyName: policy?.name ?? '',
      }
    })

  const all = [...myUpcoming, ...COMPANY_HOLIDAYS]
    .filter(item => daysUntil(item.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  if (all.length === 0) return null

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Upcoming</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {all.map(item => {
          const until = daysUntil(item.date)
          const isToday = until === 0
          const soon = until <= 7
          const bg   = item.policyColor + '14'
          const bdr  = item.policyColor + '55'
          const dateObj = parseUTC(item.date)
          const subtitle = item.endDate
            ? `${fmtDateShort(item.date)} – ${fmtDateShort(item.endDate)}`
            : fmtDate(item.date)
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: bg, border: `1px solid ${bdr}`,
              borderRadius: 10, padding: '10px 16px',
            }}>
              {/* Date badge */}
              <div style={{ flexShrink: 0, textAlign: 'center', width: 36 }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: item.policyColor }}>
                  {dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: item.policyColor }}>
                  {dateObj.getUTCDate()}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                  {subtitle}
                  {item.kind === 'pending' && <span style={{ marginLeft: 6, color: '#D97706' }}>· Pending approval</span>}
                  {isToday && <span style={{ marginLeft: 6, color: '#DC2626', fontWeight: 600 }}>· Today</span>}
                  {!isToday && soon && <span style={{ marginLeft: 6, color: '#9CA3AF' }}>· in {until}d</span>}
                </div>
              </div>

              {/* Pill */}
              <div style={{ flexShrink: 0 }}>
                {item.kind === 'holiday' ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: item.policyColor, background: item.policyColor + '22', border: `1px solid ${bdr}`, borderRadius: 99, padding: '3px 10px' }}>Holiday</span>
                ) : item.kind === 'approved' ? (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#059669', background: '#F0FDF4', border: '1px solid #6EE7B7', borderRadius: 99, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Check width={10} height={10} /> Approved</span>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#D97706', background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: 99, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Clock width={10} height={10} /> Pending</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'pending',   label: 'Pending'   },
  { value: 'approved',  label: 'Approved'  },
  { value: 'denied',    label: 'Denied'    },
  { value: 'cancelled', label: 'Cancelled' },
]

export function EmployeeTimeOffPage() {
  const [requests, setRequests]         = useState<PtoRequest[]>(INITIAL_REQUESTS)
  const [showNewRequest, setShowNew]    = useState(false)
  const [selectedReq, setSelected]      = useState<PtoRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return requests
      .filter(r => statusFilter === 'all' || r.status === statusFilter)
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return b.submittedAt.localeCompare(a.submittedAt)
      })
  }, [requests, statusFilter])

  function cancelRequest(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const th: React.CSSProperties = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: '0.06em', borderRight: '1px solid #F0F0F0',
  }
  const td: React.CSSProperties = { padding: '13px 16px', verticalAlign: 'middle', borderRight: '1px solid #F0F0F0' }

  return (
    <>
      <TopBar crumbs={[{ label: 'My Time Off' }]} />

      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid #E8E8E8', height: 52, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: CURRENT_WORKER.bg, color: CURRENT_WORKER.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
            {CURRENT_WORKER.initials}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{CURRENT_WORKER.name}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>Employee portal</div>
          </div>
        </div>
        <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <Plus width={13} height={13} /> Request time off
        </button>
      </div>

      <div className="content">

        {/* Balance overview */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Your leave balances</div>
          <BalanceCards />
        </div>

        <UpcomingSection requests={requests} />

        {/* Requests header + filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>My requests</div>
            {pendingCount > 0 && (
              <span style={{ background: '#FFF7ED', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)} style={{
                padding: '5px 12px', border: `1px solid ${statusFilter === f.value ? '#6C63FF' : '#E5E7EB'}`,
                borderRadius: 99, background: statusFilter === f.value ? '#F5F3FF' : '#fff',
                cursor: 'pointer', fontSize: 12, fontWeight: statusFilter === f.value ? 700 : 400,
                color: statusFilter === f.value ? '#6C63FF' : '#6B7280', fontFamily: 'inherit',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests table */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
                <th style={th}>Policy</th>
                <th style={th}>Dates</th>
                <th style={th}>Duration</th>
                <th style={th}>Status</th>
                <th style={th}>Submitted</th>
                <th style={{ ...th, borderRight: 'none' }}>Reviewed by</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No requests found.</td></tr>
              ) : filtered.map((req, i) => {
                const policy = MY_POLICIES.find(p => p.id === req.policyId)
                if (!policy) return null
                return (
                  <tr key={req.id} onClick={() => setSelected(req)}
                    style={{ borderTop: i > 0 ? '1px solid #F0F0F0' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={td}><PolicyDot policy={policy} /></td>
                    <td style={td}>
                      <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                        {req.startDate === req.endDate ? fmtDate(req.startDate) : `${fmtDateShort(req.startDate)} – ${fmtDateShort(req.endDate)}`}
                      </div>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 13, color: '#374151' }}>{req.days * req.hoursPerDay}h</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{req.days}d × {req.hoursPerDay}h</div>
                    </td>
                    <td style={td}><StatusBadge status={req.status} /></td>
                    <td style={{ ...td, color: '#9CA3AF', fontSize: 12 }}>{fmtDT(req.submittedAt)}</td>
                    <td style={{ ...td, borderRight: 'none', fontSize: 13, color: '#374151' }}>
                      {req.reviewedBy ?? <span style={{ color: '#D1D5DB' }}>Awaiting review</span>}
                      {req.attachments.length > 0 && (
                        <span title={`${req.attachments.length} attachment${req.attachments.length > 1 ? 's' : ''}`} style={{ marginLeft: 8, color: '#9CA3AF' }}>
                          <Paperclip width={11} height={11} style={{ verticalAlign: 'middle' }} />
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Info footer */}
        <div style={{ marginTop: 14, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #E8E8E8', fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info width={13} height={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <span>You can file multiple requests for the same day under different policies (e.g. half-day client + half-day internal), as long as the total does not exceed 8h.</span>
        </div>
      </div>

      {showNewRequest && (
        <NewRequestModal
          existingRequests={requests}
          onClose={() => setShowNew(false)}
          onSubmit={r => setRequests(prev => [r, ...prev])}
        />
      )}
      {selectedReq && (
        <RequestDetailModal req={selectedReq} onClose={() => setSelected(null)} onCancel={cancelRequest} />
      )}
    </>
  )
}
