import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, Zap, DollarSign, ChevronDown, X, Check,
  Users, Briefcase, Building2, UserCheck, CalendarDays,
  ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES, TEAM_LABELS, type Team } from '../data/employeesData'
import { PROJECTS } from '../data/projectsData'
import { CLIENTS } from '../data/clientsData'
import { ROUTES, peopleProfile } from '../lib/routes'

// ─────────────────────────────────────────────────────────────
//  MOCK DATA HELPERS
// ─────────────────────────────────────────────────────────────

function _hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function getEmployeeStats(employeeId: string, dateKey: string) {
  const seed = _hash(`${employeeId}_${dateKey}`)
  const totalMins  = 240 + (seed % 240)
  const activity   = 42  + (seed % 52)
  const payRate    = 55  + (_hash(employeeId) % 60)
  const totalSpent = Math.round((totalMins / 60) * payRate)
  return { totalMins, activity, totalSpent }
}

// Derive a work email from a display name — strips accents, lowercases, joins with dot
function deriveEmail(name: string): string {
  const parts = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
  return `${parts[0]}.${parts[parts.length - 1]}@abroadworks.com`
}

// Convert total minutes (UTC-based) to a 12-hour clock string
function fmtTimeMins(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Deterministic mock clock-in / clock-out derived from shift schedule + date seed
function deriveTimeInOut(emp: typeof EMPLOYEES[0], dateKey: string): { timeIn: string; timeOut: string } {
  const seed   = _hash(`${emp.id}_${dateKey}_clock`)
  const jitter = (seed % 20) - 8                        // -8 to +11 min clock-in variance
  const outOff = ((_hash(`${emp.id}_${dateKey}_out`)) % 18) // 0–17 min overtime
  const startUTC = emp.shiftStartUTC ?? 14
  const endUTC   = emp.shiftEndUTC   ?? 22
  return {
    timeIn:  fmtTimeMins(startUTC * 60 + jitter),
    timeOut: fmtTimeMins(endUTC   * 60 + outOff),
  }
}

// ─────────────────────────────────────────────────────────────
//  DATE RANGE UTILS
// ─────────────────────────────────────────────────────────────

const TODAY = '2026-06-05'

type DatePreset = 'today' | 'yesterday' | 'last7' | 'last_week' | 'last2weeks' | 'month' | 'last_month' | 'custom'

const PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today', yesterday: 'Yesterday', last7: 'Last 7 days',
  last_week: 'Last week', last2weeks: 'Last 2 weeks',
  month: 'This month', last_month: 'Last month', custom: 'Custom range',
}

// All date math uses UTC to avoid local-timezone shifts corrupting YYYY-MM-DD strings
function parseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(ds: string, n: number) { const d = parseDate(ds); d.setUTCDate(d.getUTCDate() + n); return isoDate(d) }
function startOfWeek(ds: string) { const d = parseDate(ds); const day = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1)); return isoDate(d) }
function startOfMonth(ds: string) { return ds.slice(0, 8) + '01' }
function endOfMonth(ds: string) { const d = parseDate(startOfMonth(ds)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return isoDate(d) }

function getPresetRange(preset: DatePreset): { start: string; end: string } {
  switch (preset) {
    case 'today':      return { start: TODAY, end: TODAY }
    case 'yesterday':  return { start: addDays(TODAY, -1), end: addDays(TODAY, -1) }
    case 'last7':      return { start: addDays(TODAY, -6), end: TODAY }
    case 'last_week':  { const s = startOfWeek(addDays(TODAY, -7)); return { start: s, end: addDays(s, 6) } }
    case 'last2weeks': return { start: addDays(TODAY, -13), end: TODAY }
    case 'month':      return { start: startOfMonth(TODAY), end: TODAY }
    case 'last_month': { const s = startOfMonth(addDays(startOfMonth(TODAY), -1)); return { start: s, end: endOfMonth(s) } }
    default:           return { start: TODAY, end: TODAY }
  }
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / 86400000) + 1)
}

function datesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = start
  while (cur <= end) { dates.push(cur); cur = addDays(cur, 1) }
  return dates
}

// All formatting uses timeZone:'UTC' so the displayed date matches the YYYY-MM-DD string
// regardless of the user's local timezone.
const UTC = { timeZone: 'UTC' } as const

function fmtDateFull(ds: string) {
  return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateShort(ds: string) {
  return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric' })
}

function fmtMonthYear(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('en-US', { ...UTC, month: 'long', year: 'numeric' })
}

function fmtDurMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtRangeLabel(start: string, end: string) {
  const s = parseDate(start), e = parseDate(end)
  const mo = (d: Date) => d.toLocaleDateString('en-US', { ...UTC, month: 'short', day: 'numeric' })
  const sy = s.getUTCFullYear(), ey = e.getUTCFullYear()
  if (start === end) return mo(s) + ', ' + sy
  if (sy === ey) return `${mo(s)} – ${mo(e)}, ${sy}`
  return `${mo(s)}, ${sy} – ${mo(e)}, ${ey}`
}

// ─────────────────────────────────────────────────────────────
//  DUAL-CALENDAR DATE RANGE PICKER
// ─────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function calKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function CalendarMonth({ year, month, rangeStart, rangeEnd, hovered, onDayClick, onDayHover }: {
  year: number; month: number
  rangeStart: string | null; rangeEnd: string | null; hovered: string | null
  onDayClick: (ds: string) => void
  onDayHover: (ds: string | null) => void
}) {
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay  = new Date(Date.UTC(year, month + 1, 0))
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
    <div style={{ minWidth: 260, flex: 1 }}>
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
    </div>
  )
}

function DateRangePicker({ start, end, onApply, onCancel }: {
  start: string; end: string
  onApply: (s: string, e: string) => void
  onCancel: () => void
}) {
  const [selStart, setSelStart]   = useState<string | null>(start)
  const [selEnd,   setSelEnd]     = useState<string | null>(end)
  const [hovered,  setHovered]    = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)

  const todayD = parseDate(TODAY)
  const prevM  = todayD.getUTCMonth() === 0 ? 11 : todayD.getUTCMonth() - 1
  const prevY  = todayD.getUTCMonth() === 0 ? todayD.getUTCFullYear() - 1 : todayD.getUTCFullYear()

  const [leftYear,   setLeftYear]   = useState(prevY)
  const [leftMonth,  setLeftMonth]  = useState(prevM)
  const [rightYear,  setRightYear]  = useState(prevM === 11 ? prevY + 1 : prevY)
  const [rightMonth, setRightMonth] = useState(prevM === 11 ? 0 : prevM + 1)

  function syncRight(ly: number, lm: number) {
    if (lm === 11) { setRightYear(ly + 1); setRightMonth(0) }
    else           { setRightYear(ly);     setRightMonth(lm + 1) }
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

  const presets: DatePreset[] = ['today', 'yesterday', 'last7', 'last_week', 'last2weeks', 'month', 'last_month']
  const activePreset = presets.find(p => { const r = getPresetRange(p); return r.start === selStart && r.end === selEnd }) ?? null
  function applyPreset(p: DatePreset) { const r = getPresetRange(p); setSelStart(r.start); setSelEnd(r.end); setSelecting(false) }

  const canApply = !!selStart && !!selEnd
  const footer1  = selStart ? fmtDateFull(selStart) : '—'
  const footer2  = selEnd ? fmtDateFull(selEnd) : (selecting && hovered ? fmtDateFull(hovered) : '—')

  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.16)', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', userSelect: 'none' }}>
      <div style={{ flex: 1, padding: '20px 20px 16px', minWidth: 580 }}>
        {/* Nav row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <button onClick={() => navLeft(-1)} style={navBtnStyle}><ChevronLeft width={16} height={16} /></button>
          <button onClick={() => navLeft(1)}  style={navBtnStyle}><ChevronRight width={16} height={16} /></button>
          <div style={{ flex: 1, marginLeft: 4, height: 34, border: '1px solid #E5E7EB', borderRadius: 7, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <CalendarDays width={14} height={14} color="#9CA3AF" />
            {selStart && selEnd ? fmtRangeLabel(selStart, selEnd) : selStart ? fmtDateFull(selStart) + ' → …' : 'Select start date'}
          </div>
        </div>
        {/* Two months */}
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <CalendarMonth year={leftYear} month={leftMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
          </div>
          <div style={{ width: 1, background: '#F0F0F0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <CalendarMonth year={rightYear} month={rightMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
          </div>
        </div>
        {/* Footer */}
        <div style={{ marginTop: 16, borderTop: '1px solid #F0F0F0', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, display: 'flex', gap: 8 }}>
            <div style={footerDateStyle}>{footer1}</div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#D1D5DB' }}>→</div>
            <div style={footerDateStyle}>{footer2}</div>
          </div>
          <button onClick={onCancel} style={{ padding: '7px 16px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={() => canApply && onApply(selStart!, selEnd!)} disabled={!canApply}
            style={{ padding: '7px 20px', border: 'none', borderRadius: 7, background: canApply ? '#10B981' : '#E5E7EB', color: canApply ? '#fff' : '#9CA3AF', cursor: canApply ? 'pointer' : 'default', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
            Apply
          </button>
        </div>
      </div>

      {/* Presets sidebar */}
      <div style={{ width: 148, borderLeft: '1px solid #F0F0F0', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {presets.map(p => {
          const active = activePreset === p
          return (
            <button key={p} onClick={() => applyPreset(p)}
              style={{ padding: '9px 16px', border: 'none', background: active ? '#F5F3FF' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#6C63FF' : '#374151', fontFamily: 'inherit', borderLeft: active ? '3px solid #6C63FF' : '3px solid transparent', transition: 'background 0.1s' }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {PRESET_LABELS[p]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = { width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }
const footerDateStyle: React.CSSProperties = { height: 32, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7, display: 'flex', alignItems: 'center', fontSize: 12.5, color: '#374151', fontWeight: 500, background: '#FAFAFA' }

function DateButton({ rangeStart, rangeEnd, onApply }: { rangeStart: string; rangeEnd: string; onApply: (s: string, e: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown); return () => document.removeEventListener('mousedown', onDown)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(x => !x)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 7, background: open ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
        <CalendarDays width={13} height={13} color={open ? '#6C63FF' : '#9CA3AF'} />
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Date:</span>
        <span style={{ fontWeight: 700, color: '#111827' }}>{fmtRangeLabel(rangeStart, rangeEnd)}</span>
        <ChevronDown width={13} height={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 400 }}>
          <DateRangePicker start={rangeStart} end={rangeEnd} onApply={(s, e) => { onApply(s, e); setOpen(false) }} onCancel={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  GROUP-BY SELECTOR + SCOPED MULTI-SELECT
// ─────────────────────────────────────────────────────────────

type GroupDimension = 'project' | 'client' | 'members' | 'team' | 'date'

const GROUP_OPTIONS: { id: GroupDimension; label: string; icon: React.ReactNode }[] = [
  { id: 'date',    label: 'Date',    icon: <CalendarDays width={13} height={13} /> },
  { id: 'project', label: 'Project', icon: <Briefcase   width={13} height={13} /> },
  { id: 'client',  label: 'Client',  icon: <Building2   width={13} height={13} /> },
  { id: 'members', label: 'Members', icon: <Users       width={13} height={13} /> },
  { id: 'team',    label: 'Team',    icon: <UserCheck   width={13} height={13} /> },
]

interface DropdownItem { id: string; label: string; sub?: string; color?: string; initials?: string; bg?: string; fg?: string }

function Chk({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`, background: checked ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {checked && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
    </div>
  )
}

function ScopeMultiSelect({ items, selected, onChange, placeholder }: { items: DropdownItem[]; selected: Set<string>; onChange: (v: Set<string>) => void; placeholder: string }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown); return () => document.removeEventListener('mousedown', onDown)
  }, [])
  const filtered    = search ? items.filter(it => it.label.toLowerCase().includes(search.toLowerCase())) : items
  const allSelected = selected.size === 0
  const displayLabel = allSelected ? placeholder : selected.size === 1 ? (items.find(it => selected.has(it.id))?.label ?? placeholder) : `${selected.size} selected`
  function toggle(id: string) { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); onChange(n) }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(x => !x)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 10px', border: `1px solid ${open || selected.size > 0 ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 7, background: open || selected.size > 0 ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, color: selected.size > 0 ? '#6C63FF' : '#374151', fontWeight: selected.size > 0 ? 700 : 500, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
        <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayLabel}</span>
        {selected.size > 0 && <span onClick={e => { e.stopPropagation(); onChange(new Set()) }} style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', cursor: 'pointer', marginLeft: 2 }}><X width={12} height={12} /></span>}
        <ChevronDown width={13} height={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 220, maxWidth: 280, overflow: 'hidden' }}>
          {items.length > 6 && <div style={{ padding: '8px 10px', borderBottom: '1px solid #F0F0F0' }}><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', padding: '5px 8px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} /></div>}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            <div onClick={() => onChange(new Set())} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', background: allSelected ? '#F5F3FF' : '#fff', borderBottom: '1px solid #F5F5F5' }}>
              <Chk checked={allSelected} />
              <span style={{ fontSize: 13, fontWeight: 600, color: allSelected ? '#6C63FF' : '#374151' }}>All</span>
            </div>
            {filtered.map(it => {
              const checked = selected.has(it.id)
              return (
                <div key={it.id} onClick={() => toggle(it.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: checked ? '#F5F3FF' : '#fff', borderBottom: '1px solid #F9F9F9' }}
                  onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? '#F5F3FF' : '#fff' }}>
                  <Chk checked={checked} />
                  {it.initials && <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: it.bg ?? '#E5E7EB', color: it.fg ?? '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>{it.initials}</div>}
                  {it.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? '#6C63FF' : '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</div>
                    {it.sub && <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{it.sub}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GroupByBar({ groupBy, setGroupBy, selected, setSelected, projectItems, clientItems, memberItems, teamItems }: {
  groupBy: GroupDimension | null; setGroupBy: (g: GroupDimension | null) => void
  selected: Set<string>; setSelected: (v: Set<string>) => void
  projectItems: DropdownItem[]; clientItems: DropdownItem[]; memberItems: DropdownItem[]; teamItems: DropdownItem[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown); return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const activeOption = GROUP_OPTIONS.find(o => o.id === groupBy)
  const scopeItems   = groupBy === 'project' ? projectItems : groupBy === 'client' ? clientItems : groupBy === 'members' ? memberItems : teamItems

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(x => !x)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px', border: `1px solid ${open || groupBy ? '#6C63FF' : '#E5E7EB'}`, borderRadius: 7, background: open || groupBy ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, color: groupBy ? '#6C63FF' : '#374151', fontFamily: 'inherit' }}>
          <span style={{ fontSize: 12, color: groupBy ? '#6C63FF' : '#9CA3AF' }}>Group by:</span>
          {activeOption ? <span style={{ fontWeight: 700 }}>{activeOption.label}</span> : <span style={{ color: '#9CA3AF' }}>Select…</span>}
          {groupBy && <span onClick={e => { e.stopPropagation(); setGroupBy(null); setSelected(new Set()) }} style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', cursor: 'pointer', marginLeft: 2 }}><X width={12} height={12} /></span>}
          <ChevronDown width={13} height={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </button>
        {open && (
          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 180 }}>
            {GROUP_OPTIONS.map(opt => {
              const active = groupBy === opt.id
              return (
                <div key={opt.id} onClick={() => { setGroupBy(active ? null : opt.id); setSelected(new Set()); setOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', background: active ? '#F5F3FF' : '#fff', borderBottom: '1px solid #F9F9F9' }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#FAFAFA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? '#F5F3FF' : '#fff' }}>
                  <span style={{ color: active ? '#6C63FF' : '#9CA3AF' }}>{opt.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#6C63FF' : '#374151', flex: 1 }}>{opt.label}</span>
                  {active && <Check width={13} height={13} color="#6C63FF" />}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {groupBy && groupBy !== 'date' && (
        <ScopeMultiSelect
          key={groupBy}
          items={scopeItems}
          selected={selected} onChange={setSelected}
          placeholder={`All ${activeOption!.label.toLowerCase()}`}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  TABLE LAYOUT
// ─────────────────────────────────────────────────────────────

// Level 0 (day rows, multi-day): indent=0   padding-left=20
// Level 1 (groups under day):    indent=1   padding-left=48
// Level 2 (members under group): indent=2   padding-left=72
// Flat member rows (single day or members group): indent=0

const COL = '2fr 90px 90px 120px 120px 120px'
// Cols: Name/Date | Time In | Time Out | Total Time | Activity | Total Spent

function TableHeader({ firstCol }: { firstCol: string }) {
  const cols = [firstCol, 'Time In', 'Time Out', 'Total Time', 'Activity', 'Total Spent']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 12, padding: '10px 20px', background: '#FAFAFA', borderBottom: '1px solid #E8E8E8' }}>
      {cols.map((col, i) => (
        <div key={col} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 5 ? 'right' : 'left' }}>
          {col}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MEMBER ROW
// ─────────────────────────────────────────────────────────────

function MemberRow({ emp, totalMins, activity, totalSpent, indent = 0, dateKey = '' }: {
  emp: typeof EMPLOYEES[0]; totalMins: number; activity: number; totalSpent: number; indent?: number; dateKey?: string
}) {
  const actColor = activity >= 70 ? '#10B981' : activity >= 40 ? '#F59E0B' : '#EF4444'
  const actBg    = activity >= 70 ? '#F0FDF4' : activity >= 40 ? '#FFFBEB' : '#FEF2F2'
  const paddingLeft = 20 + indent * 28
  const bgBase = indent > 0 ? '#FAFAFA' : '#fff'
  const email  = deriveEmail(emp.name)
  const { timeIn, timeOut } = deriveTimeInOut(emp, dateKey)

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: `10px 20px 10px ${paddingLeft}px`, borderBottom: '1px solid #F5F5F5', background: bgBase, transition: 'background 0.1s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = indent > 0 ? '#F3F4F6' : '#FAFAFA'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = bgBase}
    >
      {/* Name + email */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{emp.initials}</div>
        <div style={{ minWidth: 0 }}>
          <Link to={peopleProfile(emp.id)} style={{ fontSize: 13, fontWeight: 600, color: '#6C63FF', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
          >{emp.name}</Link>
          <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
        </div>
      </div>
      {/* Time In */}
      <div style={{ fontSize: 12.5, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{timeIn}</div>
      {/* Time Out */}
      <div style={{ fontSize: 12.5, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{timeOut}</div>
      {/* Total Time */}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{fmtDurMins(totalMins)}</div>
      {/* Activity */}
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: actBg, color: actColor, display: 'inline-block', marginBottom: 4 }}>{activity}%</span>
        <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: 72 }}>
          <div style={{ height: '100%', width: `${activity}%`, background: actColor, borderRadius: 99 }} />
        </div>
      </div>
      {/* Total Spent */}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent)}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PROJECT BREAKDOWN — split a member's time across their projects
// ─────────────────────────────────────────────────────────────

function getMemberProjectBreakdown(emp: typeof EMPLOYEES[0], dateKey: string, days: number) {
  const { totalMins, activity, totalSpent } = getEmployeeStats(emp.id, dateKey)
  const projs = emp.projects
  if (projs.length === 0) return []
  const weights   = projs.map(p => 1 + (_hash(`${emp.id}_${p}`) % 40))
  const totalW    = weights.reduce((s, w) => s + w, 0)
  return projs.map((name, i) => ({
    name,
    mins:     Math.round(totalMins  * days * weights[i] / totalW),
    activity: Math.min(95, Math.max(30, activity + ((_hash(`${emp.id}_${name}_act`) % 21) - 10))),
    spent:    Math.round(totalSpent * days * weights[i] / totalW),
  }))
}

// ─────────────────────────────────────────────────────────────
//  PROJECT SUB-ROW — shown when a member row is expanded
// ─────────────────────────────────────────────────────────────

function ProjectSubRow({ name, mins, activity, spent, indent }: {
  name: string; mins: number; activity: number; spent: number; indent: number
}) {
  const actColor = activity >= 70 ? '#10B981' : activity >= 40 ? '#F59E0B' : '#EF4444'
  const actBg    = activity >= 70 ? '#F0FDF4' : activity >= 40 ? '#FFFBEB' : '#FEF2F2'
  const paddingLeft = 20 + indent * 28
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: `8px 20px 8px ${paddingLeft}px`, borderBottom: '1px solid #F5F5F5', background: '#FAFAFA' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C7C3FF', flexShrink: 0, marginLeft: 4 }} />
        <Link to={ROUTES.projects} style={{ fontSize: 12.5, color: '#6C63FF', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
        >{name}</Link>
      </div>
      <div style={{ fontSize: 11.5, color: '#D1D5DB' }}>—</div>
      <div style={{ fontSize: 11.5, color: '#D1D5DB' }}>—</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>{fmtDurMins(mins)}</div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: actBg, color: actColor }}>{activity}%</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', textAlign: 'right' }}>{fmtMoney(spent)}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MEMBER TOP ROW — member as primary, expands to per-date rows
// ─────────────────────────────────────────────────────────────

function MemberTopRow({ emp, dateKey, days, allDates, defaultExpanded = false }: {
  emp: typeof EMPLOYEES[0]; dateKey: string; days: number; allDates: string[]; defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { totalMins, activity, totalSpent } = getEmployeeStats(emp.id, dateKey)
  const email    = deriveEmail(emp.name)
  const actColor = activity >= 70 ? '#10B981' : activity >= 40 ? '#F59E0B' : '#EF4444'
  const actBg    = activity >= 70 ? '#F0FDF4' : activity >= 40 ? '#FFFBEB' : '#FEF2F2'
  // Single-day: show actual time-in/out. Multi-day: show "N days" hint
  const singleDay  = allDates.length === 1
  const { timeIn, timeOut } = deriveTimeInOut(emp, allDates[0] ?? dateKey)

  return (
    <>
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid #F0F0F0', cursor: 'pointer', background: '#fff', transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <ChevronRight width={14} height={14} style={{ color: '#9CA3AF', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{emp.initials}</div>
          <div style={{ minWidth: 0 }}>
            <Link to={peopleProfile(emp.id)} onClick={e => e.stopPropagation()}
              style={{ fontSize: 13, fontWeight: 600, color: '#6C63FF', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
            >{emp.name}</Link>
            <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{email}</div>
          </div>
        </div>
        {singleDay
          ? <div style={{ fontSize: 12.5, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{timeIn}</div>
          : <div style={{ fontSize: 11, color: '#9CA3AF' }}>↕ {days} days</div>
        }
        <div style={{ fontSize: 12.5, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{singleDay ? timeOut : ''}</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{fmtDurMins(totalMins * days)}</div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: actBg, color: actColor, display: 'inline-block', marginBottom: 4 }}>{activity}%</span>
          <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: 72 }}>
            <div style={{ height: '100%', width: `${activity}%`, background: actColor, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent * days)}</div>
      </div>
      {/* Expand: single day → project breakdown; multi-day → one row per date */}
      {expanded && singleDay && getMemberProjectBreakdown(emp, dateKey, 1).map(p => (
        <ProjectSubRow key={p.name} name={p.name} mins={p.mins} activity={p.activity} spent={p.spent} indent={2} />
      ))}
      {expanded && !singleDay && allDates.map(date => {
        const s  = getEmployeeStats(emp.id, date)
        const tt = deriveTimeInOut(emp, date)
        return <DateSubRow key={date} date={date} timeIn={tt.timeIn} timeOut={tt.timeOut} mins={s.totalMins} activity={s.activity} spent={s.totalSpent} indent={2} />
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  DATE SUB-ROW — daily detail under a member inside a group
// ─────────────────────────────────────────────────────────────

function DateSubRow({ date, timeIn, timeOut, mins, activity, spent, indent }: {
  date: string; timeIn: string; timeOut: string
  mins: number; activity: number; spent: number; indent: number
}) {
  const isToday   = date === TODAY
  const isWeekend = [0, 6].includes(parseDate(date).getUTCDay())
  const actColor  = activity >= 70 ? '#10B981' : activity >= 40 ? '#F59E0B' : '#EF4444'
  const actBg     = activity >= 70 ? '#F0FDF4' : activity >= 40 ? '#FFFBEB' : '#FEF2F2'
  const paddingLeft = 20 + indent * 28

  return (
    <div style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: `7px 20px 7px ${paddingLeft}px`, borderBottom: '1px solid #F5F5F5', background: '#F8F8FC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isWeekend ? '#C7C3FF' : '#D1D5DB', flexShrink: 0, marginLeft: 4 }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, color: isWeekend ? '#6C63FF' : '#374151' }}>{fmtDateShort(date)}</span>
        {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: '#6C63FF', background: '#EEEDFF', padding: '1px 6px', borderRadius: 99 }}>Today</span>}
        {isWeekend && !isToday && <span style={{ fontSize: 10, color: '#C4B5FD' }}>Weekend</span>}
      </div>
      <div style={{ fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{timeIn}</div>
      <div style={{ fontSize: 12, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{timeOut}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{fmtDurMins(mins)}</div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: actBg, color: actColor }}>{activity}%</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', textAlign: 'right' }}>{fmtMoney(spent)}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  DATE-IN-GROUP ROW — one date inside a group, expands to members
// ─────────────────────────────────────────────────────────────

function DateInGroupRow({ date, members, indent }: {
  date: string; members: typeof EMPLOYEES; indent: number
}) {
  const [expanded, setExpanded] = useState(false)
  const isToday   = date === TODAY
  const isWeekend = [0, 6].includes(parseDate(date).getUTCDay())

  const dayStats   = members.map(e => getEmployeeStats(e.id, date))
  const totalMins  = dayStats.reduce((s, x) => s + x.totalMins, 0)
  const avgAct     = dayStats.length > 0 ? Math.round(dayStats.reduce((s, x) => s + x.activity, 0) / dayStats.length) : 0
  const totalSpent = dayStats.reduce((s, x) => s + x.totalSpent, 0)
  const actColor   = avgAct >= 70 ? '#10B981' : avgAct >= 40 ? '#F59E0B' : '#EF4444'
  const actBg      = avgAct >= 70 ? '#F0FDF4' : avgAct >= 40 ? '#FFFBEB' : '#FEF2F2'
  const paddingLeft = 20 + indent * 28

  return (
    <>
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: `9px 20px 9px ${paddingLeft}px`, borderBottom: '1px solid #EBEBF0', cursor: 'pointer', background: '#FAFAFA', transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F3F3F9'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight width={13} height={13} style={{ color: '#9CA3AF', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isWeekend ? '#C7C3FF' : '#D1D5DB', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isWeekend ? '#6C63FF' : '#374151' }}>{fmtDateShort(date)}</span>
              {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: '#6C63FF', background: '#EEEDFF', padding: '1px 6px', borderRadius: 99 }}>Today</span>}
              {isWeekend && !isToday && <span style={{ fontSize: 10, color: '#C4B5FD' }}>Weekend</span>}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{members.length} member{members.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fmtDurMins(totalMins)}</div>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: actBg, color: actColor }}>{avgAct}%</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent)}</div>
      </div>
      {expanded && members.map(emp => {
        const s  = getEmployeeStats(emp.id, date)
        const tt = deriveTimeInOut(emp, date)
        return <MemberRow key={emp.id} emp={emp} totalMins={s.totalMins} activity={s.activity} totalSpent={s.totalSpent} dateKey={date} indent={indent + 1} />
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  DATE TOP ROW — date as primary entity, expands to members
// ─────────────────────────────────────────────────────────────

function DateTopRow({ date, members, defaultExpanded = false }: {
  date: string; members: typeof EMPLOYEES; defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isToday   = date === TODAY
  const isWeekend = [0, 6].includes(parseDate(date).getUTCDay())

  const dayStats   = members.map(e => getEmployeeStats(e.id, date))
  const totalMins  = dayStats.reduce((s, x) => s + x.totalMins, 0)
  const avgAct     = dayStats.length > 0 ? Math.round(dayStats.reduce((s, x) => s + x.activity, 0) / dayStats.length) : 0
  const totalSpent = dayStats.reduce((s, x) => s + x.totalSpent, 0)
  const actColor   = avgAct >= 70 ? '#10B981' : avgAct >= 40 ? '#F59E0B' : '#EF4444'
  const actBg      = avgAct >= 70 ? '#F0FDF4' : avgAct >= 40 ? '#FFFBEB' : '#FEF2F2'

  return (
    <>
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', background: isToday ? '#FAFBFF' : '#fff', transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F3FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isToday ? '#FAFBFF' : '#fff'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight width={14} height={14} style={{ color: '#6C63FF', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: isWeekend ? '#6C63FF' : '#111827' }}>{fmtDateShort(date)}</span>
              {isToday && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#6C63FF', background: '#EEEDFF', padding: '1px 7px', borderRadius: 99 }}>Today</span>}
              {isWeekend && !isToday && <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>Weekend</span>}
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>{members.length} member{members.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{fmtDurMins(totalMins)}</div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: actBg, color: actColor, display: 'inline-block', marginBottom: 4 }}>{avgAct}%</span>
          <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: 72 }}>
            <div style={{ height: '100%', width: `${avgAct}%`, background: actColor, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent)}</div>
      </div>
      {expanded && members.map(emp => (
        <MemberTopRow key={emp.id} emp={emp} dateKey={date} days={1} defaultExpanded={false} />
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  GROUP ROW (project/client/team) — expands to members
// ─────────────────────────────────────────────────────────────

interface GroupDef { id: string; label: string; sub?: string; color?: string; initials?: string; bg?: string; fg?: string; members: typeof EMPLOYEES }

function GroupRow({ group, dateKey, days, allDates, indent = 0, defaultExpanded = false, groupType }: {
  group: GroupDef; dateKey: string; days: number; allDates: string[]; indent?: number; defaultExpanded?: boolean
  groupType?: GroupDimension
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const memberStats = group.members.map(e => ({ emp: e, ...getEmployeeStats(e.id, dateKey) }))
  // Multiply by days since getEmployeeStats returns per-day values
  const totalMins   = memberStats.reduce((s, x) => s + x.totalMins * days, 0)
  const avgActivity = memberStats.length > 0 ? Math.round(memberStats.reduce((s, x) => s + x.activity, 0) / memberStats.length) : 0
  const totalSpent  = memberStats.reduce((s, x) => s + x.totalSpent * days, 0)
  const actColor = avgActivity >= 70 ? '#10B981' : avgActivity >= 40 ? '#F59E0B' : '#EF4444'
  const actBg    = avgActivity >= 70 ? '#F0FDF4' : avgActivity >= 40 ? '#FFFBEB' : '#FEF2F2'
  const paddingLeft = 20 + indent * 28
  const bgBase = indent > 0 ? '#F5F5F5' : '#fff'

  const groupLink = groupType === 'client' ? ROUTES.clients : groupType === 'project' ? ROUTES.projects : null

  return (
    <>
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ display: 'grid', gridTemplateColumns: COL, alignItems: 'center', gap: 12, padding: `12px 20px 12px ${paddingLeft}px`, borderBottom: '1px solid #F0F0F0', cursor: 'pointer', background: bgBase, transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = indent > 0 ? '#EFEFEF' : '#F9F9FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = bgBase}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChevronRight width={14} height={14} style={{ color: '#9CA3AF', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
          {group.color && !group.initials && (
            <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: group.color + '22', border: `1.5px solid ${group.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: group.color }} />
            </div>
          )}
          {group.initials && (
            <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: group.bg ?? '#E5E7EB', color: group.fg ?? '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{group.initials}</div>
          )}
          <div>
            {groupLink ? (
              <Link to={groupLink} onClick={e => e.stopPropagation()}
                style={{ fontSize: 14, fontWeight: 700, color: '#6C63FF', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
              >{group.label}</Link>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{group.label}</div>
            )}
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>
              {group.sub ? `${group.sub} · ` : ''}{group.members.length} member{group.members.length !== 1 ? 's' : ''}
              {days > 1 && <span style={{ marginLeft: 4 }}>· {days} days</span>}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{fmtDurMins(totalMins)}</div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: actBg, color: actColor, display: 'inline-block', marginBottom: 4 }}>{avgActivity}%</span>
          <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: 72 }}>
            <div style={{ height: '100%', width: `${avgActivity}%`, background: actColor, borderRadius: 99 }} />
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent)}</div>
      </div>

      {/* Expand to per-date rows; each date further expands to individual members */}
      {expanded && allDates.map(date => (
        <DateInGroupRow key={date} date={date} members={group.members} indent={indent + 1} />
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
//  BAR CHART
// ─────────────────────────────────────────────────────────────

type ChartMetric = 'time' | 'activity' | 'spent'

interface ChartBar {
  id: string
  label: string       // short label below bar (truncated)
  fullLabel: string   // for tooltip
  time: number        // minutes
  activity: number    // 0-100
  spent: number       // dollars
  color?: string      // optional accent (for client/team)
}

function BarChart({ bars, title }: { bars: ChartBar[]; title: string }) {
  const [metric, setMetric] = useState<ChartMetric>('time')
  const [tooltip, setTooltip] = useState<{ bar: ChartBar; x: number; y: number } | null>(null)

  const getValue = (b: ChartBar) => metric === 'time' ? b.time : metric === 'activity' ? b.activity : b.spent
  const maxVal = Math.max(...bars.map(getValue), 1)

  function fmtVal(b: ChartBar) {
    if (metric === 'time')     return fmtDurMins(b.time)
    if (metric === 'activity') return `${b.activity}%`
    return fmtMoney(b.spent)
  }

  function barColor(b: ChartBar) {
    if (metric === 'activity') {
      return b.activity >= 70 ? '#10B981' : b.activity >= 40 ? '#F59E0B' : '#EF4444'
    }
    return b.color ?? '#6C63FF'
  }

  const metricBtn = (m: ChartMetric, label: string) => (
    <button
      onClick={() => setMetric(m)}
      style={{
        padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
        fontSize: 12, fontWeight: metric === m ? 700 : 400,
        background: metric === m ? '#6C63FF' : 'transparent',
        color: metric === m ? '#fff' : '#6B7280',
        fontFamily: 'inherit', transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  const BAR_MAX_H = 120
  const LABEL_MAX = bars.length > 10 ? 6 : bars.length > 6 ? 8 : 12

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '18px 20px 14px', marginBottom: 20 }}>
      {/* Fixed tooltip — rendered outside any clipping container */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 8,
          transform: 'translateY(-100%)',
          background: '#1F2937', color: '#fff', borderRadius: 8, padding: '8px 12px',
          fontSize: 12, whiteSpace: 'nowrap', zIndex: 9999,
          pointerEvents: 'none', lineHeight: 1.7,
          boxShadow: '0 6px 20px rgba(0,0,0,0.28)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.bar.fullLabel}</div>
          <div style={{ color: '#9CA3AF', fontSize: 11 }}>
            <span style={{ color: '#E5E7EB' }}>{fmtDurMins(tooltip.bar.time)}</span>
            {'  ·  '}
            <span style={{ color: '#E5E7EB' }}>{tooltip.bar.activity}%</span>
            {'  ·  '}
            <span style={{ color: '#E5E7EB' }}>{fmtMoney(tooltip.bar.spent)}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', flex: 1 }}>{title}</span>
        <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 7, padding: 3 }}>
          {metricBtn('time',     'Time')}
          {metricBtn('activity', 'Activity')}
          {metricBtn('spent',    'Spent')}
        </div>
      </div>

      {/* Bars */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: bars.length > 20 ? 4 : bars.length > 10 ? 6 : 10,
          minWidth: bars.length > 20 ? bars.length * 28 : 'auto',
          height: BAR_MAX_H + 52,
        }}>
          {bars.map(b => {
            const val   = getValue(b)
            const pct   = maxVal > 0 ? val / maxVal : 0
            const barH  = Math.max(pct * BAR_MAX_H, val > 0 ? 4 : 0)
            const isHov = tooltip?.bar.id === b.id
            const color = barColor(b)
            const label = b.label.length > LABEL_MAX ? b.label.slice(0, LABEL_MAX) + '…' : b.label

            return (
              <div
                key={b.id}
                onMouseMove={e => setTooltip({ bar: b, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
                style={{ flex: 1, minWidth: bars.length > 20 ? 20 : 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, cursor: 'default' }}
              >
                {/* Value label above bar */}
                <div style={{ fontSize: 10.5, fontWeight: 700, color: isHov ? color : '#6B7280', marginBottom: 4, minHeight: 14, transition: 'color 0.15s' }}>
                  {val > 0 ? fmtVal(b) : ''}
                </div>

                {/* Bar */}
                <div
                  style={{
                    width: '100%', height: barH,
                    background: isHov ? color : color + 'CC',
                    borderRadius: '4px 4px 0 0',
                    transition: 'background 0.15s',
                    alignSelf: 'flex-end',
                  }}
                />

                {/* Baseline */}
                <div style={{ width: '100%', height: 2, background: '#E5E7EB', borderRadius: 1 }} />

                {/* X-axis label */}
                <div style={{ fontSize: 10.5, color: isHov ? '#111827' : '#9CA3AF', marginTop: 5, textAlign: 'center', fontWeight: isHov ? 600 : 400, transition: 'color 0.15s', lineHeight: 1.3 }}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  STAT CARD
// ─────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, iconBg, iconColor, trend }: { icon: React.ReactNode; label: string; value: string; sub: string; iconBg: string; iconColor: string; trend?: { pct: number; up: boolean } }) {
  return (
    <div style={{ flex: 1, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ width: 46, height: 46, borderRadius: 11, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 6 }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</span>
          {trend && <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: trend.up ? '#F0FDF4' : '#FEF2F2', color: trend.up ? '#10B981' : '#EF4444' }}>{trend.up ? '↑' : '↓'} {trend.pct}%</span>}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  EXPORT BUTTON
// ─────────────────────────────────────────────────────────────

function ExportButton({ onCSV, onPDF }: { onCSV: () => void; onPDF: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(x => !x)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          height: 34, padding: '0 12px',
          border: `1px solid ${open ? '#6C63FF' : '#E5E7EB'}`,
          borderRadius: 7, background: open ? '#F5F3FF' : '#fff',
          cursor: 'pointer', fontSize: 13, fontWeight: 500,
          color: open ? '#6C63FF' : '#374151', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        <Download width={13} height={13} />
        Export
        <ChevronDown width={12} height={12} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 300,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 160,
        }}>
          <div style={{ padding: '6px 0' }}>
            <button
              onClick={() => { onCSV(); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9F9F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <FileSpreadsheet width={15} height={15} color="#10B981" />
              <div>
                <div style={{ fontWeight: 600 }}>Export Excel</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Opens in Excel / Sheets</div>
              </div>
            </button>
            <button
              onClick={() => { onPDF(); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9F9F9'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <FileText width={15} height={15} color="#EF4444" />
              <div>
                <div style={{ fontWeight: 600 }}>Export PDF</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>Print-ready report</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────

export function TimeActivityPage() {
  const [rangeStart, setRangeStart] = useState(() => getPresetRange('last7').start)
  const [rangeEnd,   setRangeEnd]   = useState(() => getPresetRange('last7').end)

  const [groupBy,  setGroupBy]  = useState<GroupDimension | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expandControl, setExpandControl] = useState<{ key: number; expanded: boolean } | null>(null)

  function expandAll()   { setExpandControl(p => ({ key: (p?.key ?? 0) + 1, expanded: true  })) }
  function collapseAll() { setExpandControl(p => ({ key: (p?.key ?? 0) + 1, expanded: false })) }

  const days        = useMemo(() => daysBetween(rangeStart, rangeEnd), [rangeStart, rangeEnd])
  const allDates    = useMemo(() => datesInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd])
  const fullDateKey = `${rangeStart}_${rangeEnd}`

  const projectItems = useMemo<DropdownItem[]>(() => PROJECTS.map(p => ({ id: p.id, label: p.name, sub: p.client })), [])
  const clientItems  = useMemo<DropdownItem[]>(() => CLIENTS.map(c => ({ id: c.id, label: c.name, sub: c.industry, color: c.color })), [])
  const memberItems  = useMemo<DropdownItem[]>(() => EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: e.role, initials: e.initials, bg: e.bg, fg: e.fg })), [])
  const teamItems    = useMemo<DropdownItem[]>(() => (Object.keys(TEAM_LABELS) as Team[]).map(t => ({ id: t, label: TEAM_LABELS[t] })), [])

  const activeEmployees = useMemo(() => EMPLOYEES.filter(e => e.status === 'active'), [])

  // Build grouped rows (project / client / team)
  const groupedRows = useMemo((): GroupDef[] | null => {
    if (!groupBy || groupBy === 'members' || groupBy === 'date') return null

    if (groupBy === 'project') {
      const targets = selected.size > 0 ? PROJECTS.filter(p => selected.has(p.id)) : PROJECTS
      return targets.map(proj => ({
        id: proj.id, label: proj.name, sub: proj.client,
        members: activeEmployees.filter(e => e.projects.includes(proj.name)),
      })).filter(r => r.members.length > 0)
    }

    if (groupBy === 'client') {
      const targets = selected.size > 0 ? CLIENTS.filter(c => selected.has(c.id)) : CLIENTS
      return targets.map(cl => ({
        id: cl.id, label: cl.name, sub: cl.industry, color: cl.color,
        members: activeEmployees.filter(e => e.clientId === cl.id),
      })).filter(r => r.members.length > 0)
    }

    if (groupBy === 'team') {
      const teams = selected.size > 0 ? (Array.from(selected) as Team[]) : (Object.keys(TEAM_LABELS) as Team[])
      return teams.map(t => ({
        id: t, label: TEAM_LABELS[t],
        members: activeEmployees.filter(e => e.team === t),
      })).filter(r => r.members.length > 0)
    }

    return null
  }, [groupBy, selected, activeEmployees])

  // Flat member list (members / date dimension or no grouping)
  const flatMembers = useMemo(() => {
    if (groupBy === 'members') return selected.size > 0 ? activeEmployees.filter(e => selected.has(e.id)) : activeEmployees
    if (!groupBy || groupBy === 'date') return activeEmployees
    return []
  }, [groupBy, selected, activeEmployees])

  // All visible employees for totals
  const allVisible = useMemo(() =>
    groupedRows ? [...new Set(groupedRows.flatMap(r => r.members))] : flatMembers,
    [groupedRows, flatMembers])

  // Aggregate totals across full range
  const totalTimeMins = useMemo(() =>
    allVisible.reduce((s, e) => s + getEmployeeStats(e.id, fullDateKey).totalMins * days, 0),
    [allVisible, fullDateKey, days])

  const avgActivity = useMemo(() => {
    if (!allVisible.length) return 0
    return Math.round(allVisible.reduce((s, e) => s + getEmployeeStats(e.id, fullDateKey).activity, 0) / allVisible.length)
  }, [allVisible, fullDateKey])

  const totalSpent = useMemo(() =>
    allVisible.reduce((s, e) => s + getEmployeeStats(e.id, fullDateKey).totalSpent * days, 0),
    [allVisible, fullDateKey, days])

  const firstColLabel = groupBy === 'date' ? 'Date' : groupBy === 'project' ? 'Project' : groupBy === 'client' ? 'Client' : groupBy === 'team' ? 'Team' : 'Member'

  const hasRows = groupedRows ? groupedRows.length > 0 : flatMembers.length > 0


  // ── Export helpers ──────────────────────────────────────────

  function buildCsvRows(): string[][] {
    const header = [firstColLabel, 'Email', 'Time In', 'Time Out', 'Total Time (h)', 'Activity %', 'Total Spent ($)', 'Project Breakdown']
    const toHrs  = (m: number) => (m / 60).toFixed(2)

    if (groupBy === 'date') {
      const rows = allDates.flatMap(date => {
        const stats = flatMembers.map(e => getEmployeeStats(e.id, date))
        const totalTime  = stats.reduce((s, x) => s + x.totalMins, 0)
        const act        = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.activity, 0) / stats.length) : 0
        const totalSpent = stats.reduce((s, x) => s + x.totalSpent, 0)
        const dateRow = [fmtDateShort(date), '', '', '', toHrs(totalTime), String(act), String(totalSpent), '']
        const memberRows = flatMembers.map(e => {
          const s     = getEmployeeStats(e.id, date)
          const tt    = deriveTimeInOut(e, date)
          const projs = getMemberProjectBreakdown(e, date, 1).map(p => `${p.name} (${toHrs(p.mins)}h)`).join('; ')
          return [`  └ ${e.name}`, deriveEmail(e.name), tt.timeIn, tt.timeOut, toHrs(s.totalMins), String(s.activity), String(s.totalSpent), projs]
        })
        return [dateRow, ...memberRows]
      })
      return [header, ...rows]
    }

    if (groupedRows) {
      // Group-primary: group header row + member sub-rows
      const rows = groupedRows.map(group => {
        const stats = group.members.map(e => getEmployeeStats(e.id, fullDateKey))
        const time  = stats.reduce((s, x) => s + x.totalMins  * days, 0)
        const act   = stats.length > 0 ? Math.round(stats.reduce((s, x) => s + x.activity, 0) / stats.length) : 0
        const spent = stats.reduce((s, x) => s + x.totalSpent * days, 0)
        const memberRows = group.members.map(e => {
          const s   = getEmployeeStats(e.id, fullDateKey)
          const tt  = deriveTimeInOut(e, fullDateKey)
          const projs = getMemberProjectBreakdown(e, fullDateKey, days)
            .map(p => `${p.name} (${toHrs(p.mins)}h)`).join('; ')
          return [`  └ ${e.name}`, deriveEmail(e.name), tt.timeIn, tt.timeOut, toHrs(s.totalMins * days), String(s.activity), String(s.totalSpent * days), projs]
        })
        return [[group.label, '', '', '', toHrs(time), String(act), String(spent), ''], ...memberRows]
      }).flat()
      return [header, ...rows]
    }

    // Member-primary: member row + project sub-rows
    const rows = flatMembers.map(e => {
      const s     = getEmployeeStats(e.id, fullDateKey)
      const tt    = deriveTimeInOut(e, fullDateKey)
      const projs = getMemberProjectBreakdown(e, fullDateKey, days)
        .map(p => `${p.name} (${toHrs(p.mins)}h)`).join('; ')
      return [e.name, deriveEmail(e.name), tt.timeIn, tt.timeOut, toHrs(s.totalMins * days), String(s.activity), String(s.totalSpent * days), projs]
    })
    return [header, ...rows]
  }

  function handleExportExcel() {
    const rows = buildCsvRows()
    const esc  = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const xmlRows = rows.map(r =>
      `<Row>${r.map(cell => `<Cell><Data ss:Type="String">${esc(cell)}</Data></Cell>`).join('')}</Row>`
    ).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="bold"><Font ss:Bold="1"/></Style>
  </Styles>
  <Worksheet ss:Name="Time &amp; Activity">
    <Table>
${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `time-activity-${rangeStart}-to-${rangeEnd}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportPDF() {
    const rows = buildCsvRows()
    const dateRange = fmtRangeLabel(rangeStart, rangeEnd)
    const groupLabel = groupBy ? `Group by: ${GROUP_OPTIONS.find(o => o.id === groupBy)?.label}` : 'All members'

    const tableRows = rows.slice(1).map(r =>
      `<tr>${r.map((cell, i) => `<td style="padding:8px 12px;border-bottom:1px solid #F0F0F0;${i === 0 ? 'font-weight:600' : 'text-align:right'}">${cell}</td>`).join('')}</tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Time &amp; Activity Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; padding: 32px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #6B7280; margin-bottom: 28px; }
  .stats { display: flex; gap: 24px; margin-bottom: 28px; }
  .stat { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 20px; min-width: 140px; }
  .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #9CA3AF; margin-bottom: 6px; }
  .stat-value { font-size: 24px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #F9FAFB; padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9CA3AF; border-bottom: 2px solid #E5E7EB; }
  th:not(:first-child) { text-align: right; }
  tr:last-child td { border-bottom: none; }
  @media print { body { padding: 16px; } button { display: none; } }
</style></head><body>
<h1>Time &amp; Activity Report</h1>
<div class="meta">${dateRange} &nbsp;·&nbsp; ${groupLabel} &nbsp;·&nbsp; ${allVisible.length} member${allVisible.length !== 1 ? 's' : ''}</div>
<div class="stats">
  <div class="stat"><div class="stat-label">Total Time</div><div class="stat-value">${fmtDurMins(totalTimeMins)}</div></div>
  <div class="stat"><div class="stat-label">Avg Activity</div><div class="stat-value">${avgActivity}%</div></div>
  <div class="stat"><div class="stat-label">Total Spent</div><div class="stat-value">${fmtMoney(totalSpent)}</div></div>
</div>
<table>
  <thead><tr>${rows[0].map((h, i) => `<th${i > 0 ? ' style="text-align:right"' : ''}>${h}</th>`).join('')}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>
<script>window.onload = () => { window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Reports' }, { label: 'Time & activity' }]} />

      {/* Filter bar */}
      <div style={{ padding: '10px 28px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <DateButton rangeStart={rangeStart} rangeEnd={rangeEnd} onApply={(s, e) => { setRangeStart(s); setRangeEnd(e) }} />
        <div style={{ width: 1, height: 20, background: '#E5E7EB', flexShrink: 0 }} />
        <GroupByBar groupBy={groupBy} setGroupBy={g => { setGroupBy(g); setSelected(new Set()) }} selected={selected} setSelected={setSelected} projectItems={projectItems} clientItems={clientItems} memberItems={memberItems} teamItems={teamItems} />
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12.5, color: '#6B7280', background: '#F3F4F6', borderRadius: 99, padding: '4px 12px', fontWeight: 500 }}>
          {allVisible.length} member{allVisible.length !== 1 ? 's' : ''} · {days} day{days !== 1 ? 's' : ''}
        </div>
        <ExportButton onCSV={handleExportExcel} onPDF={handleExportPDF} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 40px' }}>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
          <StatCard icon={<Clock width={22} height={22} />} iconBg="#EEEDFF" iconColor="#6C63FF"
            label="Total Time" value={fmtDurMins(totalTimeMins)}
            sub={`across ${allVisible.length} member${allVisible.length !== 1 ? 's' : ''}`}
            trend={{ pct: 8, up: true }} />
          <StatCard icon={<Zap width={22} height={22} />} iconBg="#FFF7ED" iconColor="#F59E0B"
            label="Total Activity" value={`${avgActivity}%`}
            sub={avgActivity >= 70 ? 'Great activity' : avgActivity >= 40 ? 'Average activity' : 'Low activity'}
            trend={{ pct: 3, up: avgActivity >= 60 }} />
          <StatCard icon={<DollarSign width={22} height={22} />} iconBg="#F0FDF4" iconColor="#10B981"
            label="Total Spent" value={fmtMoney(totalSpent)}
            sub={`${days} day${days !== 1 ? 's' : ''} · ${allVisible.length} member${allVisible.length !== 1 ? 's' : ''}`}
            trend={{ pct: 5, up: false }} />
        </div>

        {/* Expand / collapse controls */}
        {hasRows && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ display: 'flex' }}>
              <button
                onClick={expandAll}
                style={{ height: 28, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: '7px 0 0 7px', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3FF'; (e.currentTarget as HTMLElement).style.color = '#6C63FF'; (e.currentTarget as HTMLElement).style.borderColor = '#C7C3FF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB' }}
              >
                Expand all
              </button>
              <button
                onClick={collapseAll}
                style={{ height: 28, padding: '0 12px', border: '1px solid #E5E7EB', borderLeft: 'none', borderRadius: '0 7px 7px 0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#6B7280', fontFamily: 'inherit' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3FF'; (e.currentTarget as HTMLElement).style.color = '#6C63FF'; (e.currentTarget as HTMLElement).style.borderColor = '#C7C3FF' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB' }}
              >
                Collapse all
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 12, overflow: 'hidden' }}>
          <TableHeader firstCol={firstColLabel} />

          {!hasRows ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 10 }}>
              <Users width={36} height={36} strokeWidth={1.2} color="#D1D5DB" />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>No results match your filters</div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>Try adjusting the scope above.</div>
            </div>
          ) : groupBy === 'date' ? (
            /* Date-primary: one row per date, expands to members → projects */
            allDates.map(date => (
              <DateTopRow
                key={`${date}-${expandControl?.key ?? 0}`}
                date={date} members={flatMembers}
                defaultExpanded={expandControl?.expanded ?? false}
              />
            ))
          ) : groupedRows ? (
            /* Group-primary: project / client / team as the top-level row */
            groupedRows.map(group => (
              <GroupRow
                key={`${group.id}-${expandControl?.key ?? 0}`}
                group={group} dateKey={fullDateKey} days={days} allDates={allDates}
                defaultExpanded={expandControl?.expanded ?? false}
                groupType={groupBy ?? undefined}
              />
            ))
          ) : (
            /* Member-primary: member as the top-level row, projects as sub-rows */
            flatMembers.map(emp => (
              <MemberTopRow
                key={`${emp.id}-${expandControl?.key ?? 0}`}
                emp={emp} dateKey={fullDateKey} days={days} allDates={allDates}
                defaultExpanded={expandControl?.expanded ?? false}
              />
            ))
          )}

          {/* Footer totals */}
          {hasRows && (
            <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 12, padding: '12px 20px', borderTop: '2px solid #E8E8E8', background: '#FAFAFA' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                Total ({groupedRows ? `${groupedRows.length} ${firstColLabel.toLowerCase()}${groupedRows.length !== 1 ? 's' : ''}` : `${flatMembers.length} member${flatMembers.length !== 1 ? 's' : ''}`}{days > 1 ? ` · ${days} days` : ''})
              </div>
              <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
              <div style={{ fontSize: 12, color: '#D1D5DB' }}>—</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmtDurMins(totalTimeMins)}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: avgActivity >= 70 ? '#10B981' : avgActivity >= 40 ? '#F59E0B' : '#EF4444' }}>{avgActivity}%</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{fmtMoney(totalSpent)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
