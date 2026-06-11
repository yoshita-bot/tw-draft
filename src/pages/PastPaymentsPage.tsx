import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { peopleProfile } from '../lib/routes'
import {
  ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Download,
  X, GripVertical, SlidersHorizontal, Search, Check, CheckCircle2, Filter,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES } from '../data/employeesData'
import { CLIENTS } from '../data/clientsData'

// ─── Date helpers ─────────────────────────────────────────────────────────────

const TODAY = '2026-06-10'
const UTC = { timeZone: 'UTC' } as const

function parseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(ds: string, n: number) { const d = parseDate(ds); d.setUTCDate(d.getUTCDate() + n); return isoDate(d) }
function startOfWeek(ds: string) { const d = parseDate(ds); const day = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1)); return isoDate(d) }
function startOfMonth(ds: string) { return ds.slice(0, 8) + '01' }
function endOfMonth(ds: string) { const d = parseDate(startOfMonth(ds)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return isoDate(d) }
function fmtMonthYear(y: number, m: number) { return new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-US', { ...UTC, month: 'long', year: 'numeric' }) }
function fmtDateFull(ds: string) { return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }
function fmtDateShort(ds: string) { return parseDate(ds).toLocaleDateString('en-US', { ...UTC, month: 'short', day: 'numeric', year: 'numeric' }) }
function fmtRangeLabel(s: string, e: string) {
  const sd = parseDate(s), ed = parseDate(e)
  const mo = (d: Date) => d.toLocaleDateString('en-US', { ...UTC, month: 'short', day: 'numeric' })
  const sy = sd.getUTCFullYear(), ey = ed.getUTCFullYear()
  if (s === e) return mo(sd) + ', ' + sy
  if (sy === ey) return `${mo(sd)} – ${mo(ed)}, ${sy}`
  return `${mo(sd)}, ${sy} – ${mo(ed)}, ${ey}`
}
function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

type DatePreset = 'today' | 'yesterday' | 'last7' | 'last_week' | 'last2weeks' | 'month' | 'last_month'
const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today', yesterday: 'Yesterday', last7: 'Last 7 days',
  last_week: 'Last week', last2weeks: 'Last 2 weeks',
  month: 'This month', last_month: 'Last month',
}
function getPresetRange(p: DatePreset): { start: string; end: string } {
  switch (p) {
    case 'today':      return { start: TODAY, end: TODAY }
    case 'yesterday':  return { start: addDays(TODAY, -1), end: addDays(TODAY, -1) }
    case 'last7':      return { start: addDays(TODAY, -6), end: TODAY }
    case 'last_week':  { const s = startOfWeek(addDays(TODAY, -7)); return { start: s, end: addDays(s, 6) } }
    case 'last2weeks': return { start: addDays(TODAY, -13), end: TODAY }
    case 'month':      return { start: startOfMonth(TODAY), end: TODAY }
    case 'last_month': { const s = startOfMonth(addDays(startOfMonth(TODAY), -1)); return { start: s, end: endOfMonth(s) } }
  }
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function CalendarMonth({ year, month, rangeStart, rangeEnd, hovered, onDayClick, onDayHover }: {
  year: number; month: number
  rangeStart: string | null; rangeEnd: string | null; hovered: string | null
  onDayClick: (ds: string) => void
  onDayHover: (ds: string | null) => void
}) {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  const startOffset = (firstDay.getUTCDay() + 6) % 7
  const cells: Array<number | null> = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getUTCDate(); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const effectiveEnd = rangeEnd ?? hovered

  function isEdge(ds: string): 'start' | 'end' | 'solo' | null {
    if (!rangeStart) return null
    if (!effectiveEnd || effectiveEnd === rangeStart) return ds === rangeStart ? 'solo' : null
    const a = rangeStart <= effectiveEnd ? rangeStart : effectiveEnd
    const b = rangeStart <= effectiveEnd ? effectiveEnd : rangeStart
    if (ds === a && ds === b) return 'solo'
    if (ds === a) return 'start'
    if (ds === b) return 'end'
    return null
  }

  function inRange(ds: string) {
    if (!rangeStart || !effectiveEnd || effectiveEnd === rangeStart) return false
    const a = rangeStart <= effectiveEnd ? rangeStart : effectiveEnd
    const b = rangeStart <= effectiveEnd ? effectiveEnd : rangeStart
    return ds > a && ds < b
  }

  return (
    <div style={{ minWidth: 252, flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12, textAlign: 'center' }}>
        {fmtMonthYear(year, month)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: ['Sa', 'Su'].includes(d) ? '#6C63FF' : '#9CA3AF', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const ds = calKey(year, month, day)
          const edge = isEdge(ds)
          const range = inRange(ds)
          const colPos = i % 7
          const isWeekend = colPos >= 5
          return (
            <div key={ds} style={{
              background: range ? '#EDE9FE' : 'transparent',
              borderRadius: range && colPos === 0 ? '50% 0 0 50%' : range && colPos === 6 ? '0 50% 50% 0' : edge === 'start' ? '50% 0 0 50%' : edge === 'end' ? '0 50% 50% 0' : 'transparent',
            }}>
              <div
                onMouseEnter={() => onDayHover(ds)}
                onMouseLeave={() => onDayHover(null)}
                onClick={() => onDayClick(ds)}
                style={{
                  width: 34, height: 34, margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%', cursor: 'pointer', position: 'relative', zIndex: 1,
                  background: edge ? '#6C63FF' : 'transparent',
                  color: edge ? '#fff' : isWeekend ? '#6C63FF' : '#374151',
                  fontWeight: edge ? 700 : 400, fontSize: 13,
                  outline: ds === TODAY && !edge ? '2px solid #C7C3FF' : 'none',
                  outlineOffset: -1,
                }}
              >
                {day}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: '#6B7280', marginTop: 10 }}>
        {rangeEnd ? fmtDateFull(rangeEnd) : rangeStart ? fmtDateFull(rangeStart) : <span>&nbsp;</span>}
      </div>
    </div>
  )
}

function DateRangePicker({ start, end, onApply, onCancel }: {
  start: string; end: string
  onApply: (s: string, e: string) => void
  onCancel: () => void
}) {
  const [selStart, setSelStart] = useState<string | null>(start)
  const [selEnd, setSelEnd] = useState<string | null>(end)
  const [hovered, setHovered] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  const todayD = parseDate(TODAY)
  const prevM = todayD.getUTCMonth() === 0 ? 11 : todayD.getUTCMonth() - 1
  const prevY = todayD.getUTCMonth() === 0 ? todayD.getUTCFullYear() - 1 : todayD.getUTCFullYear()

  const [leftYear, setLeftYear] = useState(prevY)
  const [leftMonth, setLeftMonth] = useState(prevM)
  const [rightYear, setRightYear] = useState(prevM === 11 ? prevY + 1 : prevY)
  const [rightMonth, setRightMonth] = useState(prevM === 11 ? 0 : prevM + 1)

  function syncRight(ly: number, lm: number) {
    if (lm === 11) { setRightYear(ly + 1); setRightMonth(0) }
    else { setRightYear(ly); setRightMonth(lm + 1) }
  }
  function navLeft(dir: -1 | 1) {
    let m = leftMonth + dir, y = leftYear
    if (m < 0) { m = 11; y-- } else if (m > 11) { m = 0; y++ }
    setLeftYear(y); setLeftMonth(m); syncRight(y, m)
  }
  function handleDayClick(ds: string) {
    if (!selecting) { setSelStart(ds); setSelEnd(null); setSelecting(true) }
    else {
      const [a, b] = ds < selStart! ? [ds, selStart!] : [selStart!, ds]
      setSelStart(a); setSelEnd(b); setSelecting(false)
    }
  }

  const presets = Object.keys(PRESET_LABELS) as DatePreset[]
  const activePreset = presets.find(p => {
    const r = getPresetRange(p); return r.start === selStart && r.end === selEnd
  }) ?? null
  function applyPreset(p: DatePreset) {
    const r = getPresetRange(p); setSelStart(r.start); setSelEnd(r.end); setSelecting(false)
  }

  const navBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 6, border: '1px solid #E5E7EB',
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#374151', flexShrink: 0,
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', userSelect: 'none' }}>
      <div style={{ width: 160, borderRight: '1px solid #F3F4F6', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {presets.map(p => (
          <button key={p} onClick={() => applyPreset(p)} style={{
            textAlign: 'left', padding: '8px 20px', background: activePreset === p ? '#EDE9FE' : 'transparent',
            color: activePreset === p ? '#5B21B6' : '#374151', fontWeight: activePreset === p ? 600 : 400,
            border: 'none', cursor: 'pointer', fontSize: 13, borderRadius: 0,
          }}>
            {PRESET_LABELS[p]}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <button onClick={() => navLeft(-1)} style={navBtnStyle}><ChevronLeft width={16} height={16} /></button>
          <button onClick={() => navLeft(1)} style={navBtnStyle}><ChevronRight width={16} height={16} /></button>
          <div style={{ flex: 1, marginLeft: 4, height: 34, border: '1px solid #E5E7EB', borderRadius: 7, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <CalendarDays width={14} height={14} color="#9CA3AF" />
            {selStart && selEnd ? fmtRangeLabel(selStart, selEnd) : selStart ? fmtDateFull(selStart) + ' → …' : 'Select start date'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <CalendarMonth year={leftYear} month={leftMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
          <div style={{ width: 1, background: '#F3F4F6', flexShrink: 0 }} />
          <CalendarMonth year={rightYear} month={rightMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, borderTop: '1px solid #F3F4F6', paddingTop: 14 }}>
          <button onClick={onCancel} style={{ padding: '7px 18px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>Cancel</button>
          <button
            disabled={!selStart || !selEnd}
            onClick={() => selStart && selEnd && onApply(selStart, selEnd)}
            style={{ padding: '7px 18px', borderRadius: 7, border: 'none', background: selStart && selEnd ? '#6C63FF' : '#D1D5DB', color: '#fff', cursor: selStart && selEnd ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Mock past payments data ──────────────────────────────────────────────────

function _hash(s: string): number {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h
}

type PaymentStatus = 'paid' | 'processing' | 'failed'

interface PastPayment {
  id: string
  employeeId: string
  name: string
  email: string
  initials: string
  bg: string
  fg: string
  payRate: number
  billRate: number
  hours: number
  amount: number
  paidDate: string
  periodStart: string
  periodEnd: string
  status: PaymentStatus
  clientId: string
  projects: string[]
}

function generatePastPayments(rangeStart: string, rangeEnd: string): PastPayment[] {
  const rangeKey = `${rangeStart}_${rangeEnd}`
  return EMPLOYEES.map(emp => {
    const h = _hash(`${emp.id}_${rangeKey}`)
    const hours = 20 + (h % 50)
    const payRate = emp.payRate
    const amount = Math.round(hours * payRate)
    const statusRoll = h % 10
    const status: PaymentStatus = statusRoll < 8 ? 'paid' : statusRoll < 9 ? 'processing' : 'failed'
    const rangeEndDate = parseDate(rangeEnd)
    rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + (h % 5) + 1)
    const paidDate = isoDate(rangeEndDate)
    return {
      id: `${emp.id}_${rangeKey}`,
      employeeId: emp.id,
      name: emp.name,
      email: emp.email,
      initials: emp.initials,
      bg: emp.bg,
      fg: emp.fg,
      payRate,
      billRate: emp.billRate,
      hours,
      amount,
      paidDate,
      periodStart: rangeStart,
      periodEnd: rangeEnd,
      status,
      clientId: emp.clientId,
      projects: emp.projects,
    }
  })
}

// ─── Column definitions ───────────────────────────────────────────────────────

type ColKey = 'employee' | 'period' | 'payRate' | 'hours' | 'amount' | 'paidDate' | 'status'

const ALL_COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'employee', label: 'Employee' },
  { key: 'period',   label: 'Pay Period' },
  { key: 'payRate',  label: 'Pay Rate' },
  { key: 'hours',    label: 'Hours' },
  { key: 'amount',   label: 'Amount Paid' },
  { key: 'paidDate', label: 'Paid On' },
  { key: 'status',   label: 'Status' },
]

type FilterSection = 'projects' | 'clients' | 'members'

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const cfg: Record<PaymentStatus, { label: string; bg: string; color: string; dot: string }> = {
    paid:       { label: 'Paid',       bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
    processing: { label: 'Processing', bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
    failed:     { label: 'Failed',     bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444' },
  }
  const { label, bg, color, dot } = cfg[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: bg, fontSize: 12, fontWeight: 600, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PastPaymentsPage() {
  const defaultRange = getPresetRange('last_month')
  const [dateStart, setDateStart] = useState(defaultRange.start)
  const [dateEnd,   setDateEnd]   = useState(defaultRange.end)
  const [showCal,   setShowCal]   = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  const [activeSection,       setActiveSection]       = useState<FilterSection | null>(null)
  const [filterDropdownOpen,  setFilterDropdownOpen]  = useState(false)
  const [selectedProjects,    setSelectedProjects]    = useState<Set<string>>(new Set())
  const [selectedClients,     setSelectedClients]     = useState<Set<string>>(new Set())
  const [selectedMembers,     setSelectedMembers]     = useState<Set<string>>(new Set())
  const [selectedStatuses,    setSelectedStatuses]    = useState<Set<PaymentStatus>>(new Set())
  const [filterSearch,        setFilterSearch]        = useState('')
  const filterRef = useRef<HTMLDivElement>(null)

  const [columns, setColumns]         = useState<ColKey[]>(['employee', 'period', 'payRate', 'hours', 'amount', 'paidDate', 'status'])
  const [showColMenu, setShowColMenu]           = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)
  const [showStatusMenu, setShowStatusMenu]     = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const dragCol = useRef<number | null>(null)
  const dragOverCol = useRef<number | null>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterDropdownOpen(false)
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) setShowColMenu(false)
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allRows = useMemo(() => generatePastPayments(dateStart, dateEnd), [dateStart, dateEnd])

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      if (activeSection === 'projects' && selectedProjects.size > 0) {
        if (!row.projects.some(p => selectedProjects.has(p))) return false
      }
      if (activeSection === 'clients' && selectedClients.size > 0) {
        if (!selectedClients.has(row.clientId)) return false
      }
      if (activeSection === 'members' && selectedMembers.size > 0) {
        if (!selectedMembers.has(row.employeeId)) return false
      }
      if (selectedStatuses.size > 0 && !selectedStatuses.has(row.status)) return false
      return true
    })
  }, [allRows, activeSection, selectedProjects, selectedClients, selectedMembers, selectedStatuses])

  const filterOptions = useMemo(() => {
    if (activeSection === 'projects') {
      const allProjects = Array.from(new Set(EMPLOYEES.flatMap(e => e.projects))).sort()
      return allProjects.filter(p => p.toLowerCase().includes(filterSearch.toLowerCase()))
    }
    if (activeSection === 'clients') {
      return CLIENTS.filter(c => c.name.toLowerCase().includes(filterSearch.toLowerCase()))
        .map(c => ({ id: c.id, name: c.name }))
    }
    if (activeSection === 'members') {
      return EMPLOYEES.filter(e => e.name.toLowerCase().includes(filterSearch.toLowerCase()))
        .map(e => ({ id: e.id, name: e.name }))
    }
    return []
  }, [activeSection, filterSearch])

  function toggleSelection(section: FilterSection, id: string) {
    const map: Record<FilterSection, [Set<string>, (s: Set<string>) => void]> = {
      projects: [selectedProjects, setSelectedProjects],
      clients:  [selectedClients,  setSelectedClients],
      members:  [selectedMembers,  setSelectedMembers],
    }
    const [set, setSet] = map[section]
    const next = new Set(set)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSet(next)
  }

  function openSection(section: FilterSection) {
    if (activeSection === section && filterDropdownOpen) {
      setFilterDropdownOpen(false)
    } else {
      setActiveSection(section)
      setFilterDropdownOpen(true)
      setFilterSearch('')
    }
  }

  function clearFilter() {
    setSelectedProjects(new Set()); setSelectedClients(new Set()); setSelectedMembers(new Set())
    setSelectedStatuses(new Set()); setActiveSection(null); setFilterDropdownOpen(false)
  }

  function toggleStatus(s: PaymentStatus) {
    const next = new Set(selectedStatuses)
    if (next.has(s)) next.delete(s); else next.add(s)
    setSelectedStatuses(next)
  }

  const activeSelectionCount =
    activeSection === 'projects' ? selectedProjects.size :
    activeSection === 'clients'  ? selectedClients.size :
    activeSection === 'members'  ? selectedMembers.size : 0

  const anyFilter = selectedProjects.size > 0 || selectedClients.size > 0 || selectedMembers.size > 0 || selectedStatuses.size > 0

  const totalHours  = filteredRows.reduce((s, r) => s + r.hours, 0)
  const totalAmount = filteredRows.reduce((s, r) => s + r.amount, 0)
  const paidCount   = filteredRows.filter(r => r.status === 'paid').length

  function onColDragStart(i: number) { dragCol.current = i }
  function onColDragOver(e: React.DragEvent, i: number) { e.preventDefault(); dragOverCol.current = i }
  function onColDrop() {
    if (dragCol.current === null || dragOverCol.current === null || dragCol.current === dragOverCol.current) return
    const next = [...columns]
    const [moved] = next.splice(dragCol.current, 1)
    next.splice(dragOverCol.current, 0, moved)
    setColumns(next)
    dragCol.current = null; dragOverCol.current = null
  }

  function exportCSV() {
    const headers = columns.map(c => ALL_COLUMNS.find(x => x.key === c)!.label)
    const rows = filteredRows.map(row =>
      columns.map(c => {
        if (c === 'employee')  return `"${row.name} <${row.email}>"`
        if (c === 'period')    return `"${fmtDateShort(row.periodStart)} – ${fmtDateShort(row.periodEnd)}"`
        if (c === 'payRate')   return `$${row.payRate}/hr`
        if (c === 'hours')     return `${row.hours}h`
        if (c === 'amount')    return `$${row.amount}`
        if (c === 'paidDate')  return fmtDateShort(row.paidDate)
        if (c === 'status')    return row.status
        return ''
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'past-payments.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const pillBtn = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 36,
    borderRadius: 8, border: `1px solid ${active ? '#6C63FF' : '#E5E7EB'}`,
    background: active ? '#EDE9FE' : '#fff', color: active ? '#5B21B6' : '#374151',
    fontWeight: active ? 600 : 500, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' as const,
  })

  const selectedSet =
    activeSection === 'projects' ? selectedProjects :
    activeSection === 'clients'  ? selectedClients :
    activeSection === 'members'  ? selectedMembers : new Set<string>()

  const STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
    { value: 'paid',       label: 'Paid',       color: '#10B981' },
    { value: 'processing', label: 'Processing', color: '#F59E0B' },
    { value: 'failed',     label: 'Failed',     color: '#EF4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      <TopBar crumbs={[{ label: 'Financials' }, { label: 'Past Payments' }]} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px', background: '#fff', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap' }}>

        {/* Date range */}
        <div ref={calRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowCal(v => !v)} style={pillBtn(showCal)}>
            <CalendarDays width={14} height={14} />
            {fmtRangeLabel(dateStart, dateEnd)}
            <ChevronDown width={13} height={13} />
          </button>
          {showCal && (
            <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 200 }}>
              <DateRangePicker
                start={dateStart} end={dateEnd}
                onApply={(s, e) => { setDateStart(s); setDateEnd(e); setShowCal(false) }}
                onCancel={() => setShowCal(false)}
              />
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 24, background: '#E5E7EB', flexShrink: 0 }} />

        {/* Filter buttons */}
        <div ref={filterRef} style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['projects', 'clients', 'members'] as FilterSection[]).map(sec => {
            const count = sec === 'projects' ? selectedProjects.size : sec === 'clients' ? selectedClients.size : selectedMembers.size
            const isActive = activeSection === sec && filterDropdownOpen
            return (
              <button key={sec} onClick={() => openSection(sec)} style={pillBtn(isActive || count > 0)}>
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
                {count > 0 && (
                  <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{count}</span>
                )}
                <ChevronDown width={13} height={13} />
              </button>
            )
          })}

          {/* Status filter dropdown */}
          <div ref={statusMenuRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowStatusMenu(v => !v)} style={pillBtn(showStatusMenu || selectedStatuses.size > 0)}>
              <Filter width={13} height={13} />
              Status
              {selectedStatuses.size > 0 && (
                <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 99, fontSize: 11, fontWeight: 700, padding: '1px 6px' }}>{selectedStatuses.size}</span>
              )}
              <ChevronDown width={13} height={13} />
            </button>
            {showStatusMenu && (
              <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 200, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #E5E7EB', width: 180, padding: '6px 0', overflow: 'hidden' }}>
                {STATUS_OPTIONS.map(s => {
                  const checked = selectedStatuses.has(s.value)
                  return (
                    <div key={s.value} onClick={() => toggleStatus(s.value)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                      cursor: 'pointer', background: checked ? '#F5F3FF' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = checked ? '#F5F3FF' : 'transparent' }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`,
                        background: checked ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {checked && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#374151' }}>{s.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {anyFilter && (
            <button onClick={clearFilter} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X width={13} height={13} /> Clear
            </button>
          )}

          {/* Filter dropdown */}
          {filterDropdownOpen && activeSection && (
            <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 200, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #E5E7EB', width: 260, overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Search width={14} height={14} color="#9CA3AF" />
                <input
                  autoFocus
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                  placeholder={`Search ${activeSection}…`}
                  style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', flex: 1, background: 'transparent' }}
                />
                {activeSelectionCount > 0 && (
                  <span style={{ fontSize: 11, color: '#6C63FF', fontWeight: 600 }}>{activeSelectionCount} selected</span>
                )}
              </div>
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {(filterOptions as Array<string | { id: string; name: string }>).map(opt => {
                  const id   = typeof opt === 'string' ? opt : opt.id
                  const name = typeof opt === 'string' ? opt : opt.name
                  const checked = selectedSet.has(id)
                  return (
                    <div key={id} onClick={() => toggleSelection(activeSection, id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                      cursor: 'pointer', background: checked ? '#F5F3FF' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = checked ? '#F5F3FF' : 'transparent' }}
                    >
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`,
                        background: checked ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {checked && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: 13, color: '#374151' }}>{name}</span>
                    </div>
                  )
                })}
                {filterOptions.length === 0 && (
                  <div style={{ padding: '20px 14px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No results</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Summary chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#ECFDF5', borderRadius: 8 }}>
            <CheckCircle2 width={13} height={13} color="#10B981" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#065F46' }}>{paidCount} paid</span>
          </div>
        </div>

        <div style={{ width: 1, height: 24, background: '#E5E7EB', flexShrink: 0 }} />

        {/* Column chooser */}
        <div ref={colMenuRef} style={{ position: 'relative' }}>
          <button onClick={() => setShowColMenu(v => !v)} style={pillBtn(showColMenu)}>
            <SlidersHorizontal width={14} height={14} />
            Columns
          </button>
          {showColMenu && (
            <div style={{ position: 'absolute', top: 44, right: 0, zIndex: 200, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #E5E7EB', width: 230, padding: '8px 0', overflow: 'hidden' }}>
              <div style={{ padding: '6px 14px 10px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Drag to reorder</div>
              {columns.map((col, i) => (
                <div key={col}
                  draggable
                  onDragStart={() => onColDragStart(i)}
                  onDragOver={e => onColDragOver(e, i)}
                  onDrop={onColDrop}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'grab', background: '#fff' }}
                >
                  <GripVertical width={14} height={14} color="#D1D5DB" />
                  <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                    {ALL_COLUMNS.find(c => c.key === col)!.label}
                  </span>
                  <button
                    disabled={col === 'employee'}
                    onClick={() => { if (col !== 'employee') setColumns(prev => prev.filter(c => c !== col)) }}
                    style={{ background: 'none', border: 'none', cursor: col === 'employee' ? 'default' : 'pointer', color: col === 'employee' ? '#D1D5DB' : '#9CA3AF', padding: 0, display: 'flex' }}
                  >
                    <X width={14} height={14} />
                  </button>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #F3F4F6', padding: '8px 14px 4px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Hidden</div>
                {ALL_COLUMNS.filter(c => !columns.includes(c.key)).map(c => (
                  <div key={c.key} onClick={() => setColumns(prev => [...prev, c.key])}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}
                  >
                    <div style={{ width: 16, height: 16, border: '2px solid #D1D5DB', borderRadius: 4 }} />
                    {c.label}
                  </div>
                ))}
                {ALL_COLUMNS.filter(c => !columns.includes(c.key)).length === 0 && (
                  <div style={{ fontSize: 12, color: '#D1D5DB', paddingBottom: 4 }}>All columns visible</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button onClick={exportCSV} style={{ ...pillBtn(false), background: '#6C63FF', color: '#fff', border: 'none' }}>
          <Download width={14} height={14} />
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {columns.map(col => (
                  <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6B7280', fontSize: 12, whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
                    {ALL_COLUMNS.find(c => c.key === col)!.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => (
                <tr key={row.id}
                  style={{ borderBottom: idx < filteredRows.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                >
                  {columns.map(col => {
                    if (col === 'employee') return (
                      <td key={col} style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: row.bg, color: row.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {row.initials}
                          </div>
                          <div>
                            <Link to={peopleProfile(row.employeeId)} style={{ fontWeight: 600, color: '#111827', textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#6C63FF'}
                              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#111827'}
                            >
                              {row.name}
                            </Link>
                            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{row.email}</div>
                          </div>
                        </div>
                      </td>
                    )

                    if (col === 'period') return (
                      <td key={col} style={{ padding: '14px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12 }}>
                          {fmtDateShort(row.periodStart)} – {fmtDateShort(row.periodEnd)}
                        </span>
                      </td>
                    )

                    if (col === 'payRate') return (
                      <td key={col} style={{ padding: '14px 16px' }}>
                        <span style={{ color: '#374151', fontWeight: 500 }}>${row.payRate}<span style={{ color: '#9CA3AF', fontWeight: 400 }}>/hr</span></span>
                      </td>
                    )

                    if (col === 'hours') return (
                      <td key={col} style={{ padding: '14px 16px', color: '#374151', fontWeight: 500 }}>
                        {row.hours}h
                      </td>
                    )

                    if (col === 'amount') return (
                      <td key={col} style={{ padding: '14px 16px', fontWeight: 700, color: '#111827' }}>
                        ${row.amount.toLocaleString()}
                      </td>
                    )

                    if (col === 'paidDate') return (
                      <td key={col} style={{ padding: '14px 16px', color: '#374151', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {fmtDateShort(row.paidDate)}
                      </td>
                    )

                    if (col === 'status') return (
                      <td key={col} style={{ padding: '14px 16px' }}>
                        <StatusBadge status={row.status} />
                      </td>
                    )

                    return <td key={col} style={{ padding: '14px 16px' }} />
                  })}
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                    No payment records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>

            {filteredRows.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                  {columns.map(col => {
                    if (col === 'employee') return (
                      <td key={col} style={{ padding: '12px 16px', fontWeight: 700, color: '#374151', fontSize: 13 }}>
                        {filteredRows.length} employee{filteredRows.length !== 1 ? 's' : ''}
                      </td>
                    )
                    if (col === 'hours') return (
                      <td key={col} style={{ padding: '12px 16px', fontWeight: 700, color: '#374151' }}>
                        {totalHours}h
                      </td>
                    )
                    if (col === 'amount') return (
                      <td key={col} style={{ padding: '12px 16px', fontWeight: 700, color: '#111827', fontSize: 14 }}>
                        ${totalAmount.toLocaleString()}
                      </td>
                    )
                    return <td key={col} style={{ padding: '12px 16px' }} />
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
