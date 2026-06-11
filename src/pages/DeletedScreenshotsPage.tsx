import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, Download, ImageOff, Trash2,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES, ALL_PROJECTS, ACTIVE_CLIENT_IDS } from '../data/employeesData'
import { CLIENT_MAP } from '../data/clientsData'
import { PROJECTS } from '../data/projectsData'
import { TASKS } from '../data/tasksData'
import { ROUTES, peopleProfile } from '../lib/routes'

// ─── Date helpers ──────────────────────────────────────────────────────────────

const TODAY = '2026-06-11'
const UTC = { timeZone: 'UTC' } as const

function parseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function isoDate(d: Date) { return d.toISOString().split('T')[0] }
function addDays(ds: string, n: number) { const d = parseDate(ds); d.setUTCDate(d.getUTCDate() + n); return isoDate(d) }
function startOfWeek(ds: string) { const d = parseDate(ds); const day = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1)); return isoDate(d) }
function startOfMonth(ds: string) { return ds.slice(0, 8) + '01' }
function endOfMonth(ds: string) { const d = parseDate(startOfMonth(ds)); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(0); return isoDate(d) }
function fmtMonthYear(y: number, m: number) { return new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-US', { ...UTC, month: 'long', year: 'numeric' }) }
function fmtDateFull(ds: string) { return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) }
function calKey(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function fmtRangeLabel(s: string, e: string) {
  const sd = parseDate(s), ed = parseDate(e)
  const mo = (d: Date) => d.toLocaleDateString('en-US', { ...UTC, month: 'short', day: 'numeric' })
  const sy = sd.getUTCFullYear(), ey = ed.getUTCFullYear()
  if (s === e) return mo(sd) + ', ' + sy
  if (sy === ey) return `${mo(sd)} – ${mo(ed)}, ${sy}`
  return `${mo(sd)}, ${sy} – ${mo(ed)}, ${ey}`
}
function fmtDateShort(ds: string) {
  return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric' })
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

// ─── Mock data ─────────────────────────────────────────────────────────────────

function _hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function fmtMins(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

interface DeletionRecord {
  id: string
  empId: string
  date: string
  slotStart: number      // minutes from midnight UTC, aligned to 10-min slot
  deletedCount: number   // how many of the 3 shots in the slot were deleted
  totalCount: number     // shots originally captured in the slot (3)
  project: string
  task: string | null
  deletedById: string    // empId of the admin who deleted
  reason: string
}

// Remaining (not deleted) shots in a record's slot, with deterministic seeds + capture times
function keptShots(rec: DeletionRecord): { seed: number; time: number }[] {
  const kept = rec.totalCount - rec.deletedCount
  return Array.from({ length: kept }, (_, i) => ({
    seed: _hash(`${rec.id}_keep_${i}`),
    time: rec.slotStart + 1 + (rec.deletedCount + i) * 3,
  }))
}

const REASONS = [
  'Personal information visible',
  'Banking details on screen',
  'Password manager open',
  'Private conversation visible',
  'Accidental capture during break',
  'Personal browsing',
  'Sensitive client data on screen',
  'Captured during personal call',
]

const TASK_POOL = TASKS.map(t => t.title)

function generateDeletions(): DeletionRecord[] {
  const records: DeletionRecord[] = []
  const admins = ['e001', 'e004', 'e012', 'e032'].filter(id => EMPLOYEES.some(e => e.id === id))

  for (const emp of EMPLOYEES) {
    const seed0 = _hash(`${emp.id}_deleted_ss`)
    const count = seed0 % 4   // 0–3 deletions per person
    for (let i = 0; i < count; i++) {
      const seed = _hash(`${emp.id}_del_${i}_v1`)
      const daysAgo = 1 + (seed % 59)
      const date = addDays(TODAY, -daysAgo)
      const dow = parseDate(date).getUTCDay()
      const adjustedDate = dow === 0 ? addDays(date, -2) : dow === 6 ? addDays(date, -1) : date

      const shiftBase = (emp.shiftStartUTC ?? 9) * 60
      const slotStart = shiftBase + 10 * (seed % 42)   // within ~7h of shift

      const deletedCount = seed % 10 < 7 ? 3 : 1 + (seed % 2)
      const project = emp.projects[seed % Math.max(emp.projects.length, 1)] ?? 'Internal'
      const hasTask = _hash(`${emp.id}_task_${i}`) % 5 < 3
      const task = hasTask ? TASK_POOL[seed % TASK_POOL.length] : null
      const deletedById = admins[seed % admins.length]

      records.push({
        id: `${emp.id}_${i}`,
        empId: emp.id,
        date: adjustedDate,
        slotStart,
        deletedCount,
        totalCount: 3,
        project,
        task,
        deletedById,
        reason: REASONS[seed % REASONS.length],
      })
    }
  }

  // ── Pinned: deletions on TODAY so the default view always has rows ──────────
  records.push(
    {
      id: 'pinned_0', empId: 'e001', date: TODAY, slotStart: 14 * 60 + 20,
      deletedCount: 3, totalCount: 3,
      project: EMPLOYEES.find(e => e.id === 'e001')?.projects[0] ?? 'Internal',
      task: 'Weekly Report', deletedById: 'e032',
      reason: 'Sensitive client data on screen',
    },
    {
      id: 'pinned_1', empId: 'e004', date: TODAY, slotStart: 10 * 60 + 40,
      deletedCount: 1, totalCount: 3,
      project: EMPLOYEES.find(e => e.id === 'e004')?.projects[0] ?? 'Internal',
      task: null, deletedById: 'e012',
      reason: 'Banking details on screen',
    },
  )

  return records.sort((a, b) => b.date.localeCompare(a.date) || b.slotStart - a.slotStart)
}

const ALL_DELETIONS = generateDeletions()

// ─── Date range picker ─────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

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

const navBtnStyle: React.CSSProperties = { width: 32, height: 32, border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', flexShrink: 0 }
const footerDateStyle: React.CSSProperties = { height: 32, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7, display: 'flex', alignItems: 'center', fontSize: 12.5, color: '#374151', fontWeight: 500, background: '#FAFAFA' }

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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
          <button onClick={() => navLeft(-1)} style={navBtnStyle}><ChevronLeft width={16} height={16} /></button>
          <button onClick={() => navLeft(1)}  style={navBtnStyle}><ChevronRight width={16} height={16} /></button>
          <div style={{ flex: 1, marginLeft: 4, height: 34, border: '1px solid #E5E7EB', borderRadius: 7, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, fontSize: 13, color: '#374151', fontWeight: 500 }}>
            <CalendarDays width={14} height={14} color="#9CA3AF" />
            {selStart && selEnd ? fmtRangeLabel(selStart, selEnd) : selStart ? fmtDateFull(selStart) + ' → …' : 'Select start date'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <CalendarMonth year={leftYear} month={leftMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
          </div>
          <div style={{ width: 1, background: '#F0F0F0', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <CalendarMonth year={rightYear} month={rightMonth} rangeStart={selStart} rangeEnd={selEnd} hovered={hovered} onDayClick={handleDayClick} onDayHover={setHovered} />
          </div>
        </div>
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

// ─── Multi-select filter ────────────────────────────────────────────────────────

interface DropdownItem { id: string; label: string; sub?: string; initials?: string; bg?: string; fg?: string }

function Chk({ checked }: { checked: boolean }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`, background: checked ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {checked && <Check width={10} height={10} color="#fff" strokeWidth={3} />}
    </div>
  )
}

function MultiSelect({ items, selected, onChange, placeholder }: {
  items: DropdownItem[]; selected: Set<string>; onChange: (v: Set<string>) => void; placeholder: string
}) {
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

// ─── Screenshot placeholder (SVG fake screen — same as Screenshots page) ───────

function ScreenshotImage({ seed, width, height, style }: { seed: number; width: number; height: number; style?: React.CSSProperties }) {
  const isDark = seed % 3 !== 0
  const bg      = isDark ? '#1e1e2e' : '#f8fafc'
  const toolbar = isDark ? '#16213e' : '#e2e8f0'
  const sidebar = isDark ? '#242438' : '#f1f5f9'
  const line1   = isDark ? '#3d3d5c' : '#cbd5e1'
  const line2   = isDark ? '#4a4a6a' : '#e2e8f0'
  const accentColors = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EC4899','#06B6D4']
  const accent  = accentColors[seed % accentColors.length]
  const accent2 = accentColors[(seed + 2) % accentColors.length]
  const accent3 = accentColors[(seed + 4) % accentColors.length]
  const textLight = isDark ? '#4a5568' : '#94a3b8'

  // Vary the "type" of screen shown
  const screenType = seed % 4  // 0=code, 1=dashboard, 2=form, 3=table

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', ...style }}
    >
      {/* Background */}
      <rect width={width} height={height} fill={bg} />

      {/* Top menu bar */}
      <rect width={width} height={22} fill={toolbar} />
      <rect x={8} y={8} width={6} height={6} rx={3} fill="#EF4444" />
      <rect x={18} y={8} width={6} height={6} rx={3} fill="#F59E0B" />
      <rect x={28} y={8} width={6} height={6} rx={3} fill="#10B981" />
      <rect x={width * 0.3} y={6} width={width * 0.4} height={10} rx={3} fill={isDark ? '#2a2a40' : '#cbd5e1'} />

      {screenType === 0 && (
        /* Code editor */
        <>
          {/* Sidebar file tree */}
          <rect x={0} y={22} width={width * 0.22} height={height - 22} fill={sidebar} />
          {[0,1,2,3,4,5,6,7].map(i => (
            <rect key={i} x={8} y={32 + i * 14} width={width * 0.15 - (i % 3) * 10} height={6} rx={2} fill={i === 2 ? accent : line1} opacity={i === 2 ? 0.9 : 0.6} />
          ))}
          {/* Code lines */}
          {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
            const lineW = (0.4 + ((_hash(`${seed}_line_${i}`) % 40) / 100)) * (width * 0.74)
            const col = [accent, accent2, textLight, textLight, accent3][i % 5]
            return <rect key={i} x={width * 0.24} y={28 + i * ((height - 28) / 14)} width={lineW} height={5} rx={2} fill={col} opacity={0.75} />
          })}
        </>
      )}

      {screenType === 1 && (
        /* Dashboard */
        <>
          {/* Sidebar nav */}
          <rect x={0} y={22} width={width * 0.18} height={height - 22} fill={sidebar} />
          {[0,1,2,3,4].map(i => (
            <rect key={i} x={6} y={30 + i * 18} width={width * 0.12} height={9} rx={3} fill={i === 1 ? accent : line1} opacity={i === 1 ? 0.9 : 0.5} />
          ))}
          {/* Chart area */}
          <rect x={width * 0.2} y={28} width={width * 0.76} height={height * 0.38} rx={4} fill={isDark ? '#2a2a40' : '#fff'} stroke={line2} strokeWidth={1} />
          {/* Bar chart bars */}
          {[0,1,2,3,4,5,6].map(i => {
            const barH = 15 + (_hash(`${seed}_bar_${i}`) % 40)
            return (
              <rect key={i}
                x={width * 0.22 + i * (width * 0.74 / 8)}
                y={28 + height * 0.38 - barH - 6}
                width={width * 0.06} height={barH} rx={2}
                fill={i % 2 === 0 ? accent : accent2} opacity={0.85}
              />
            )
          })}
          {/* Stat cards */}
          {[0,1,2].map(i => (
            <rect key={i} x={width * 0.2 + i * (width * 0.26)} y={28 + height * 0.44} width={width * 0.23} height={height * 0.28} rx={4} fill={isDark ? '#2a2a40' : '#fff'} stroke={line2} strokeWidth={1} />
          ))}
        </>
      )}

      {screenType === 2 && (
        /* Form / editor */
        <>
          <rect x={width * 0.1} y={30} width={width * 0.8} height={height - 40} rx={6} fill={isDark ? '#252538' : '#fff'} stroke={line2} strokeWidth={1} />
          {/* Form fields */}
          {[0,1,2,3].map(i => (
            <React.Fragment key={i}>
              <rect x={width * 0.14} y={42 + i * 28} width={width * 0.25} height={6} rx={2} fill={textLight} opacity={0.6} />
              <rect x={width * 0.14} y={52 + i * 28} width={width * 0.7} height={12} rx={3} fill={line2} opacity={0.5} />
            </React.Fragment>
          ))}
          {/* Submit button */}
          <rect x={width * 0.14} y={height - 34} width={width * 0.25} height={14} rx={4} fill={accent} opacity={0.9} />
        </>
      )}

      {screenType === 3 && (
        /* Data table */
        <>
          {/* Table header */}
          <rect x={0} y={22} width={width} height={18} fill={isDark ? '#252538' : '#f1f5f9'} />
          {[0,1,2,3].map(i => (
            <rect key={i} x={8 + i * (width / 4)} y={28} width={width / 4 - 12} height={6} rx={2} fill={textLight} opacity={0.7} />
          ))}
          {/* Table rows */}
          {[0,1,2,3,4,5,6].map(i => (
            <React.Fragment key={i}>
              <rect x={0} y={40 + i * 16} width={width} height={16} fill={i % 2 === 0 ? bg : (isDark ? '#252538' : '#f8fafc')} />
              {[0,1,2,3].map(j => (
                <rect key={j} x={8 + j * (width / 4)} y={45 + i * 16} width={width / 4 - 16} height={5} rx={2}
                  fill={j === 0 && i === 2 ? accent : line1} opacity={j === 0 && i === 2 ? 0.9 : 0.5} />
              ))}
            </React.Fragment>
          ))}
        </>
      )}

      {/* OS-style status bar at bottom */}
      <rect x={0} y={height - 14} width={width} height={14} fill={toolbar} opacity={0.8} />
      <rect x={8} y={height - 10} width={40} height={5} rx={2} fill={line1} opacity={0.6} />
      <rect x={width - 60} y={height - 10} width={50} height={5} rx={2} fill={line1} opacity={0.6} />
    </svg>
  )
}

// ─── Lightbox (same interaction as Screenshots page) ────────────────────────────

interface LightboxShot { seed: number; time: number; date: string; empName: string }

function Lightbox({ shots, index, onClose, onNav }: {
  shots: LightboxShot[]; index: number
  onClose: () => void
  onNav: (newIndex: number) => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1)
      if (e.key === 'ArrowRight' && index < shots.length - 1) onNav(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onNav, index, shots.length])

  const shot = shots[index]
  if (!shot) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 24,
          background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
          width: 40, height: 40, cursor: 'pointer', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      ><X width={20} height={20} /></button>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index - 1) }}
          style={{
            position: 'fixed', left: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
            width: 44, height: 44, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ArrowLeft width={22} height={22} /></button>
      )}

      {/* Next */}
      {index < shots.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(index + 1) }}
          style={{
            position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
            width: 44, height: 44, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        ><ArrowRight width={22} height={22} /></button>
      )}

      {/* Image */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '82vh' }}>
        <ScreenshotImage
          seed={shot.seed}
          width={Math.min(1200, window.innerWidth * 0.82)}
          height={Math.min(720, window.innerHeight * 0.75)}
          style={{ borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        />
        {/* Caption */}
        <div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            Screenshot <strong style={{ color: '#fff' }}>{index + 1}</strong> of <strong style={{ color: '#fff' }}>{shots.length}</strong>
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>
            {shot.empName} · {fmtDateShort(shot.date)} · {fmtMins(shot.time)}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
            Esc to close · ← → to navigate
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Screenshot set cell ────────────────────────────────────────────────────────

function ScreenshotSet({ rec, onOpenShot }: { rec: DeletionRecord; onOpenShot: (shotIdx: number) => void }) {
  const kept = keptShots(rec)
  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: rec.deletedCount }, (_, i) => (
          <div key={`d${i}`} style={{ width: 38, height: 28, borderRadius: 5, border: '1.5px dashed #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageOff width={12} height={12} color="#C4C8D0" strokeWidth={1.5} />
          </div>
        ))}
        {kept.map((shot, i) => (
          <div key={`k${i}`}
            onClick={() => onOpenShot(i)}
            style={{ width: 38, height: 28, borderRadius: 5, border: '1px solid #E5E7EB', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#6C63FF'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'}
            title="View screenshot"
          >
            <ScreenshotImage seed={shot.seed} width={38} height={28} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 4 }}>
        {rec.deletedCount} of {rec.totalCount} deleted
      </div>
    </div>
  )
}

// ─── Summary cards ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '16px 20px', minWidth: 160, flex: 1 }}>
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? '#111827', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const DEFAULT_START = addDays(TODAY, -29)
const DEFAULT_END   = TODAY

const PROJECT_ID_BY_NAME = new Map(PROJECTS.map(p => [p.name, p.id]))
const TASK_ID_BY_TITLE   = new Map(TASKS.map(t => [t.title, t.id]))

function projectLink(name: string) {
  const id = PROJECT_ID_BY_NAME.get(name)
  return id ? `${ROUTES.projects}/${id}` : ROUTES.projects
}

function taskLink(title: string) {
  const id = TASK_ID_BY_TITLE.get(title)
  return id ? `${ROUTES.todos}/${id}` : ROUTES.todos
}

const cellLinkStyle: React.CSSProperties = {
  fontSize: 12.5, color: '#374151', textDecoration: 'none',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
}

export function DeletedScreenshotsPage() {
  const [rangeStart, setRangeStart] = useState(DEFAULT_START)
  const [rangeEnd,   setRangeEnd]   = useState(DEFAULT_END)
  const [selClients,  setSelClients]  = useState<Set<string>>(new Set())
  const [selProjects, setSelProjects] = useState<Set<string>>(new Set())
  const [selMembers,  setSelMembers]  = useState<Set<string>>(new Set())

  const clientItems: DropdownItem[] = useMemo(() =>
    ACTIVE_CLIENT_IDS
      .map(id => CLIENT_MAP[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({ id: c.id, label: c.name })), [])

  const projectItems: DropdownItem[] = useMemo(() =>
    ALL_PROJECTS.map(p => ({ id: p, label: p })), [])

  const memberItems: DropdownItem[] = useMemo(() =>
    EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: e.email, initials: e.initials, bg: e.bg, fg: e.fg })), [])

  const empMap = useMemo(() => new Map(EMPLOYEES.map(e => [e.id, e])), [])

  const filtered = useMemo(() => {
    return ALL_DELETIONS.filter(rec => {
      if (rec.date < rangeStart || rec.date > rangeEnd) return false
      const emp = empMap.get(rec.empId)
      if (!emp) return false
      if (selMembers.size > 0 && !selMembers.has(rec.empId)) return false
      if (selClients.size > 0 && !selClients.has(emp.clientId)) return false
      if (selProjects.size > 0 && !selProjects.has(rec.project)) return false
      return true
    })
  }, [rangeStart, rangeEnd, selMembers, selClients, selProjects, empMap])

  const stats = useMemo(() => {
    const sets = filtered.length
    const shots = filtered.reduce((s, r) => s + r.deletedCount, 0)
    const members = new Set(filtered.map(r => r.empId)).size
    return { sets, shots, members }
  }, [filtered])

  // Flat list of every remaining (viewable) screenshot in the current view, for the lightbox
  const allShots = useMemo(() => {
    const list: { recId: string; shot: LightboxShot }[] = []
    for (const rec of filtered) {
      const emp = empMap.get(rec.empId)
      for (const s of keptShots(rec)) {
        list.push({ recId: rec.id, shot: { seed: s.seed, time: s.time, date: rec.date, empName: emp?.name ?? '' } })
      }
    }
    return list
  }, [filtered, empMap])

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  function openShot(recId: string, shotIdx: number) {
    let count = 0
    for (let i = 0; i < allShots.length; i++) {
      if (allShots[i].recId === recId) {
        if (count === shotIdx) { setLightboxIdx(i); return }
        count++
      }
    }
  }

  const COLS = '140px 200px 170px 160px 170px 170px 1fr'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      <TopBar title="Deleted Screenshots" crumbs={[{ label: 'Activity' }, { label: 'Deleted Screenshots' }]} />

      {/* Toolbar */}
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DateButton rangeStart={rangeStart} rangeEnd={rangeEnd} onApply={(s, e) => { setRangeStart(s); setRangeEnd(e) }} />
        <div style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px' }} />
        <MultiSelect items={clientItems}  selected={selClients}  onChange={setSelClients}  placeholder="Clients" />
        <MultiSelect items={projectItems} selected={selProjects} onChange={setSelProjects} placeholder="Projects" />
        <MultiSelect items={memberItems}  selected={selMembers}  onChange={setSelMembers}  placeholder="Employees" />
        <div style={{ flex: 1 }} />
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, height: 34, padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit' }}>
          <Download width={13} height={13} color="#9CA3AF" />
          Export
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <SummaryCard label="Sets deleted" value={String(stats.sets)} sub="10-min slots affected" />
          <SummaryCard label="Screenshots removed" value={String(stats.shots)} sub="individual captures" accent="#DC2626" />
          <SummaryCard label="Members affected" value={String(stats.members)} sub="in selected range" />
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB' }}>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: COLS, columnGap: 16, padding: '10px 20px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA', borderRadius: '10px 10px 0 0' }}>
            {['Screenshots', 'Member', 'Date & time', 'Project', 'Task', 'Deleted by', 'Reason'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              <Trash2 width={28} height={28} color="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }} />
              No deleted screenshots found for the selected filters.
            </div>
          ) : (
            filtered.map((rec, idx) => {
              const emp = empMap.get(rec.empId)
              const deleter = empMap.get(rec.deletedById)
              if (!emp || !deleter) return null
              const client = CLIENT_MAP[emp.clientId]
              const isLast = idx === filtered.length - 1
              return (
                <div key={rec.id}
                  style={{ display: 'grid', gridTemplateColumns: COLS, columnGap: 16, padding: '12px 20px', borderBottom: isLast ? 'none' : '1px solid #F0F0F0', alignItems: 'center', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {/* Screenshot set */}
                  <ScreenshotSet rec={rec} onOpenShot={i => openShot(rec.id, i)} />

                  {/* Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{emp.initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <Link to={peopleProfile(emp.id)} style={{ fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                      >{emp.name}</Link>
                      <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email}</div>
                    </div>
                  </div>

                  {/* Date & time */}
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {fmtMins(rec.slotStart)} – {fmtMins(rec.slotStart + 10)}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap' }}>{fmtDateShort(rec.date)}</div>
                  </div>

                  {/* Project + client */}
                  <div style={{ minWidth: 0 }}>
                    <Link to={projectLink(rec.project)} style={{ ...cellLinkStyle, fontWeight: 500 }} title={rec.project}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#374151'}
                    >{rec.project}</Link>
                    {client && (
                      <Link to={`${ROUTES.clients}/${client.id}`} style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', marginTop: 1 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9CA3AF'}
                      >{client.name}</Link>
                    )}
                  </div>

                  {/* Task */}
                  {rec.task ? (
                    <Link to={taskLink(rec.task)} style={cellLinkStyle} title={rec.task}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#374151'}
                    >{rec.task}</Link>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#D1D5DB', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      No task
                    </div>
                  )}

                  {/* Deleted by */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: deleter.bg, color: deleter.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{deleter.initials}</div>
                    <Link to={peopleProfile(deleter.id)} style={cellLinkStyle}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#374151'}
                    >{deleter.name}</Link>
                  </div>

                  {/* Reason */}
                  <div style={{ fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rec.reason}>
                    {rec.reason}
                  </div>
                </div>
              )
            })
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{ padding: '11px 20px', borderTop: '1px solid #E5E7EB', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 10px 10px' }}>
              <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>{filtered.length} deletion{filtered.length !== 1 ? 's' : ''}</span>
              <span style={{ fontSize: 12.5, color: '#6B7280' }}>
                <strong style={{ color: '#DC2626' }}>{stats.shots}</strong> screenshots removed
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <Lightbox
          shots={allShots.map(s => s.shot)}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNav={setLightboxIdx}
        />
      )}
    </div>
  )
}
