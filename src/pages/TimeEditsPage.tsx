import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsDownUp, ChevronsUpDown,
  X, Check, Download, Clock, Edit2, Scissors, PlusCircle,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES, TEAM_LABELS, ALL_PROJECTS } from '../data/employeesData'
import { peopleProfile } from '../lib/routes'

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

function fmtDelta(mins: number): string {
  const sign = mins >= 0 ? '+' : '-'
  const abs = Math.abs(mins)
  const h = Math.floor(abs / 60), m = abs % 60
  if (h > 0 && m > 0) return `${sign}${h}h ${m}m`
  if (h > 0) return `${sign}${h}h`
  return `${sign}${m}m`
}

type EditType = 'edited' | 'added' | 'split'

interface TimeEdit {
  id: string
  empId: string
  date: string
  editType: EditType
  origStart: number   // minutes from midnight UTC (0 for 'added')
  origEnd: number     // 0 for 'added'
  editStart: number
  editEnd: number
  splitEnd?: number   // second block end time, only for 'split'
  delta: number       // net change in minutes
  reason: string
  editedById: string
}

const EDITED_REASONS = [
  'Forgot to stop timer', 'Forgot to start timer', 'Working offline',
  'Adjusted for time zone', 'System error', 'Corrected duplicate entry',
]
const ADDED_REASONS = [
  'Timer not started', 'Attended client meeting', 'Emergency response',
  'Training session', 'Offsite work not tracked',
]
const SPLIT_REASONS = [
  'Break not recorded', 'Lunch break missing', 'Two separate tasks combined',
  'Client meeting in the middle', 'System outage during session',
]

function generateEdits(): TimeEdit[] {
  const edits: TimeEdit[] = []
  const editors = [
    EMPLOYEES.find(e => e.id === 'e001')!,
    EMPLOYEES.find(e => e.id === 'e004')!,
    EMPLOYEES.find(e => e.id === 'e012')!,
    EMPLOYEES.find(e => e.id === 'e032')!,
  ].filter(Boolean)

  for (const emp of EMPLOYEES) {
    const seed0 = _hash(`${emp.id}_edits`)
    const count = 2 + (seed0 % 4)   // 2–5 edits per person
    for (let i = 0; i < count; i++) {
      const seed = _hash(`${emp.id}_edit_${i}_v3`)
      const daysAgo = 1 + (seed % 59)
      const date = addDays(TODAY, -daysAgo)
      const dow = parseDate(date).getUTCDay()
      const adjustedDate = dow === 0 ? addDays(date, -2) : dow === 6 ? addDays(date, -1) : date

      const shiftBase = (emp.shiftStartUTC ?? 9) * 60
      const origStart = shiftBase + ((seed % 3) * 15)
      const origEnd   = origStart + 420 + ((seed % 5) * 30)

      // Determine edit type: ~55% edited, ~25% added, ~20% split
      const typeSeed = _hash(`${emp.id}_type_${i}`)
      const editType: EditType = typeSeed % 20 < 4 ? 'split' : typeSeed % 20 < 9 ? 'added' : 'edited'

      const editor = editors[seed % editors.length]
      let editStart = origStart, editEnd = origEnd, splitEnd: number | undefined, delta = 0, reason = ''

      if (editType === 'edited') {
        const deltaSteps = [-3, -2, -1, 1, 2, 3]
        const deltaVal = deltaSteps[seed % deltaSteps.length] * 15
        const changeStart = _hash(`${emp.id}_cs_${i}`) % 3 !== 0
        const changeEnd   = _hash(`${emp.id}_ce_${i}`) % 3 !== 0 || !changeStart
        editStart = changeStart ? origStart + deltaVal : origStart
        editEnd   = changeEnd   ? origEnd   + deltaVal : origEnd
        delta     = (editEnd - editStart) - (origEnd - origStart)
        reason    = EDITED_REASONS[seed % EDITED_REASONS.length]
      } else if (editType === 'added') {
        // Entirely new block — no original
        const addedStart = shiftBase - 60 - ((seed % 3) * 30)  // 1–2.5h before shift
        const addedEnd   = addedStart + 60 + ((seed % 4) * 30) // 1–2.5h block
        editStart = addedStart; editEnd = addedEnd
        delta     = addedEnd - addedStart
        reason    = ADDED_REASONS[seed % ADDED_REASONS.length]
      } else {
        // Split: break original block into two, gap of 30–60 min in the middle
        const midpoint  = origStart + Math.floor((origEnd - origStart) / 2)
        const gapMins   = 30 + ((seed % 3) * 15)  // 30, 45, or 60 min gap
        editEnd   = midpoint - Math.floor(gapMins / 2)
        splitEnd  = midpoint + Math.ceil(gapMins / 2) + ((origEnd - midpoint) - Math.ceil(gapMins / 2))
        // splitEnd caps at origEnd so gap is correctly carved
        splitEnd  = origEnd
        editEnd   = midpoint - Math.floor(gapMins / 2)
        delta     = 0 - gapMins  // gap removes time
        reason    = SPLIT_REASONS[seed % SPLIT_REASONS.length]
      }

      edits.push({
        id: `${emp.id}_${i}`,
        empId: emp.id,
        date: adjustedDate,
        editType,
        origStart: editType === 'added' ? 0 : origStart,
        origEnd:   editType === 'added' ? 0 : origEnd,
        editStart, editEnd,
        splitEnd,
        delta,
        reason,
        editedById: editor?.id ?? 'e001',
      })
    }
  }

  // ── Pinned: Maria Santos has 3 edits on TODAY to demo multi-edit-per-day ──────
  const pinnedDate = TODAY
  edits.push(
    {
      id: 'pinned_0', empId: 'e001', date: pinnedDate, editType: 'edited',
      origStart: 14 * 60,       origEnd: 22 * 60,
      editStart: 14 * 60 - 15,  editEnd: 22 * 60,
      delta: 15, reason: 'Forgot to start timer',
      editedById: 'e032',
    },
    {
      id: 'pinned_1', empId: 'e001', date: pinnedDate, editType: 'split',
      origStart: 14 * 60 - 15,  origEnd: 22 * 60,
      editStart: 14 * 60 - 15,  editEnd: 17 * 60 + 45,
      splitEnd:  18 * 60 + 15,
      delta: -30, reason: 'Lunch break missing',
      editedById: 'e032',
    },
    {
      id: 'pinned_2', empId: 'e001', date: pinnedDate, editType: 'added',
      origStart: 0, origEnd: 0,
      editStart: 12 * 60 + 30,  editEnd: 13 * 60 + 15,
      delta: 45, reason: 'Offsite work not tracked',
      editedById: 'e004',
    },
  )

  return edits.sort((a, b) => b.date.localeCompare(a.date) || (a.id.startsWith('pinned') ? -1 : 1))
}

const ALL_EDITS = generateEdits()

function deriveEmail(name: string): string {
  const parts = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
  return `${parts[0]}.${parts[parts.length - 1]}@abroadworks.com`
}

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

// ─── Edit type badge ────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<EditType, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  edited: { label: 'Edited', bg: '#EEF2FF', color: '#4F46E5', icon: <Edit2    width={11} height={11} /> },
  added:  { label: 'Added',  bg: '#ECFDF5', color: '#059669', icon: <PlusCircle width={11} height={11} /> },
  split:  { label: 'Split',  bg: '#FFF7ED', color: '#C2410C', icon: <Scissors width={11} height={11} /> },
}

function TypeBadge({ type }: { type: EditType }) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg.icon}
      {cfg.label}
    </span>
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

type TypeFilter = 'all' | EditType

export function TimeEditsPage() {
  const [searchParams] = useSearchParams()
  const [rangeStart, setRangeStart] = useState(DEFAULT_START)
  const [rangeEnd,   setRangeEnd]   = useState(DEFAULT_END)
  const [selGroups,   setSelGroups]   = useState<Set<string>>(new Set())
  const [selMembers,  setSelMembers]  = useState<Set<string>>(() => {
    const m = searchParams.get('member')
    return m ? new Set([m]) : new Set()
  })
  const [selProjects, setSelProjects] = useState<Set<string>>(new Set())
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')

  const groupItems: DropdownItem[] = useMemo(() =>
    Object.entries(TEAM_LABELS).map(([id, label]) => ({ id, label })), [])

  const memberItems: DropdownItem[] = useMemo(() =>
    EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: deriveEmail(e.name), initials: e.initials, bg: e.bg, fg: e.fg })), [])

  const projectItems: DropdownItem[] = useMemo(() =>
    ALL_PROJECTS.map(p => ({ id: p, label: p })), [])

  const filtered = useMemo(() => {
    return ALL_EDITS.filter(edit => {
      if (edit.date < rangeStart || edit.date > rangeEnd) return false
      const emp = EMPLOYEES.find(e => e.id === edit.empId)
      if (!emp) return false
      if (selMembers.size > 0 && !selMembers.has(edit.empId)) return false
      if (selGroups.size > 0 && !selGroups.has(emp.team)) return false
      if (selProjects.size > 0 && !emp.projects.some(p => selProjects.has(p))) return false
      if (typeFilter !== 'all' && edit.editType !== typeFilter) return false
      return true
    })
  }, [rangeStart, rangeEnd, selMembers, selGroups, selProjects, typeFilter])

  const stats = useMemo(() => {
    const total   = filtered.length
    const edited  = filtered.filter(e => e.editType === 'edited').length
    const added   = filtered.filter(e => e.editType === 'added').length
    const split   = filtered.filter(e => e.editType === 'split').length
    const netMins = filtered.reduce((s, e) => s + e.delta, 0)
    return { total, edited, added, split, netMins }
  }, [filtered])

  function fmtNetMins(mins: number) {
    const sign = mins >= 0 ? '+' : '-'
    const abs = Math.abs(mins)
    const h = Math.floor(abs / 60), m = abs % 60
    if (h > 0 && m > 0) return `${sign}${h}h ${m}m`
    if (h > 0) return `${sign}${h}h`
    return `${sign}${m}m`
  }

  const TYPE_TABS: { key: TypeFilter; label: string; count?: number }[] = [
    { key: 'all',    label: 'All' },
    { key: 'edited', label: 'Edited', count: stats.edited },
    { key: 'added',  label: 'Added',  count: stats.added  },
    { key: 'split',  label: 'Split',  count: stats.split  },
  ]

  const empMap = useMemo(() => new Map(EMPLOYEES.map(e => [e.id, e])), [])

  // Group filtered edits by person+date
  const groups = useMemo(() => {
    const map = new Map<string, TimeEdit[]>()
    for (const edit of filtered) {
      const key = `${edit.empId}__${edit.date}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(edit)
    }
    return Array.from(map.entries()).map(([key, edits]) => ({ key, edits }))
  }, [filtered])

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  function toggleGroup(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const multiKeys = useMemo(() => groups.filter(g => g.edits.length > 1).map(g => g.key), [groups])
  const allExpanded = multiKeys.length > 0 && multiKeys.every(k => expanded.has(k))
  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(multiKeys))
  }

  const COLS = '200px 100px 170px 220px 80px 1fr 160px 90px'

  function EditRow({ edit, isLast }: { edit: TimeEdit; isLast: boolean }) {
    const emp    = empMap.get(edit.empId)
    const editor = empMap.get(edit.editedById)
    if (!emp || !editor) return null
    const isAdded = edit.editType === 'added'
    const isSplit = edit.editType === 'split'
    const durationChanged = edit.delta !== 0
    const startChanged    = !isAdded && edit.editStart !== edit.origStart
    const endChanged      = !isAdded && edit.editEnd   !== edit.origEnd
    return (
      <div style={{ display: 'grid', gridTemplateColumns: COLS, columnGap: 16, padding: '10px 20px', borderBottom: isLast ? 'none' : '1px solid #F0EEFF', alignItems: 'center', background: '#FAFBFF' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F3FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFF'}
      >
        {/* Member cell — indent placeholder matching chevron+avatar width */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, flexShrink: 0 }} />
          <div style={{ width: 2, height: 28, background: '#DDD6FE', borderRadius: 2, flexShrink: 0 }} />
        </div>
        {/* Date — empty */}
        <div />
        {/* Original time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAdded ? (
            <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>No entry</span>
          ) : (
            <>
              <Clock width={11} height={11} color="#D1D5DB" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#D1D5DB', fontVariantNumeric: 'tabular-nums', textDecoration: 'line-through' }}>
                {fmtMins(edit.origStart)} – {fmtMins(edit.origEnd)}
              </span>
            </>
          )}
        </div>
        {/* New time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <Clock width={11} height={11} color="#6C63FF" style={{ flexShrink: 0 }} />
          {isSplit ? (
            <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMins(edit.editStart)}–{fmtMins(edit.editEnd)}</span>
              <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
              <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMins(edit.editEnd + 30)}–{fmtMins(edit.splitEnd!)}</span>
            </span>
          ) : (
            <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <span style={{ color: startChanged || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMins(edit.editStart)}</span>
              <span style={{ color: '#9CA3AF' }}> – </span>
              <span style={{ color: endChanged   || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMins(edit.editEnd)}</span>
            </span>
          )}
        </div>
        {/* Change */}
        <div>
          <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: !durationChanged ? '#9CA3AF' : edit.delta > 0 ? '#059669' : '#DC2626' }}>
            {durationChanged ? fmtDelta(edit.delta) : '—'}
          </span>
        </div>
        {/* Reason */}
        <div style={{ fontSize: 12.5, color: '#374151', paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{edit.reason}</div>
        {/* Edited by */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: editor.bg, color: editor.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{editor.initials}</div>
          <span style={{ fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editor.name}</span>
        </div>
        {/* Type badge */}
        <div><TypeBadge type={edit.editType} /></div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      <TopBar title="Time Edits" crumbs={[{ label: 'Reports' }, { label: 'Time Edits' }]} />

      {/* Toolbar */}
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DateButton rangeStart={rangeStart} rangeEnd={rangeEnd} onApply={(s, e) => { setRangeStart(s); setRangeEnd(e) }} />
        <div style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 4px' }} />
        <MultiSelect items={projectItems} selected={selProjects} onChange={setSelProjects} placeholder="Projects" />
        <MultiSelect items={groupItems}   selected={selGroups}   onChange={setSelGroups}   placeholder="Groups" />
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
          <SummaryCard label="Total edits" value={String(stats.total)} sub="in selected range" />
          <SummaryCard label="Net time change" value={stats.netMins === 0 ? '0m' : fmtNetMins(stats.netMins)} sub="across all edits" accent={stats.netMins > 0 ? '#059669' : stats.netMins < 0 ? '#DC2626' : '#111827'} />
          <SummaryCard label="Edited" value={String(stats.edited)} sub="time adjusted" accent="#4F46E5" />
          <SummaryCard label="Added" value={String(stats.added)}  sub="new blocks added" accent="#059669" />
          <SummaryCard label="Split" value={String(stats.split)}  sub="entries split" accent="#C2410C" />
        </div>

        {/* Tabs + table card */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB' }}>

          {/* Type tabs */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #E5E7EB', padding: '0 20px', gap: 4 }}>
            {TYPE_TABS.map(tab => {
              const active = typeFilter === tab.key
              const cfg    = tab.key !== 'all' ? TYPE_CONFIG[tab.key as EditType] : null
              return (
                <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
                  style={{ padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#6C63FF' : '#6B7280', borderBottom: active ? '2px solid #6C63FF' : '2px solid transparent', fontFamily: 'inherit', transition: 'color 0.1s', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#374151' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6B7280' }}
                >
                  {cfg && <span style={{ color: active ? '#6C63FF' : cfg.color, display: 'flex' }}>{cfg.icon}</span>}
                  {tab.label}
                  {tab.count !== undefined && (
                    <span style={{ padding: '1px 6px', borderRadius: 10, background: active ? '#EDE9FE' : '#F3F4F6', fontSize: 11, fontWeight: 700, color: active ? '#6C63FF' : '#9CA3AF' }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
            <div style={{ flex: 1 }} />
            {multiKeys.length > 0 && (
              <button onClick={toggleAll}
                style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6B7280', fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'color 0.1s, border-color 0.1s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#6C63FF'; el.style.borderColor = '#C7C3FF' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#6B7280'; el.style.borderColor = '#E5E7EB' }}
              >
                {allExpanded ? <ChevronsDownUp width={13} height={13} /> : <ChevronsUpDown width={13} height={13} />}
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            )}
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 100px 170px 220px 80px 1fr 160px 90px', columnGap: 16, padding: '10px 20px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            {['Member', 'Date', 'Original time', 'New time', 'Change', 'Reason', 'Edited by', 'Type'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {groups.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              <Edit2 width={28} height={28} color="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }} />
              No time edits found for the selected filters.
            </div>
          ) : (
            groups.map(({ key, edits: groupEdits }, gIdx) => {
              const firstEdit = groupEdits[0]
              const emp = empMap.get(firstEdit.empId)
              if (!emp) return null
              const isMulti   = groupEdits.length > 1
              const isOpen    = expanded.has(key)
              const netDelta  = groupEdits.reduce((s, e) => s + e.delta, 0)
              const types     = [...new Set(groupEdits.map(e => e.editType))]
              const isLast    = gIdx === groups.length - 1

              return (
                <div key={key} style={{ borderBottom: isLast ? 'none' : '1px solid #F0F0F0' }}>
                  {/* Summary row */}
                  <div
                    onClick={() => isMulti && toggleGroup(key)}
                    style={{ display: 'grid', gridTemplateColumns: COLS, columnGap: 16, padding: '13px 20px', alignItems: 'center', background: isOpen ? '#F9F8FF' : '#fff', cursor: isMulti ? 'pointer' : 'default', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isOpen ? '#F5F3FF' : '#FAFAFA'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isOpen ? '#F9F8FF' : '#fff'}
                  >
                    {/* Member */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {isMulti ? (
                        <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: isOpen ? '#6C63FF' : '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                          <ChevronRight width={12} height={12} color={isOpen ? '#fff' : '#6C63FF'} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                        </div>
                      ) : (
                        <div style={{ width: 20, flexShrink: 0 }} />
                      )}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{emp.initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <Link to={peopleProfile(emp.id)} onClick={e => e.stopPropagation()} style={{ fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                        >{emp.name}</Link>
                        <div style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {deriveEmail(emp.name)}
                          {isMulti && <span style={{ marginLeft: 5, color: '#A78BFA', fontWeight: 600 }}>{groupEdits.length} edits</span>}
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDateShort(firstEdit.date)}</div>

                    {/* Original time — show first edit's, or "Multiple" if multi */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isMulti ? (
                        <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>Multiple</span>
                      ) : firstEdit.editType === 'added' ? (
                        <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>No entry</span>
                      ) : (
                        <>
                          <Clock width={11} height={11} color="#D1D5DB" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, color: '#D1D5DB', fontVariantNumeric: 'tabular-nums', textDecoration: 'line-through' }}>
                            {fmtMins(firstEdit.origStart)} – {fmtMins(firstEdit.origEnd)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* New time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {isMulti ? (
                        <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>Multiple</span>
                      ) : (() => {
                        const edit = firstEdit
                        const isAdded = edit.editType === 'added'
                        const isSplit = edit.editType === 'split'
                        const startChanged = !isAdded && edit.editStart !== edit.origStart
                        const endChanged   = !isAdded && edit.editEnd   !== edit.origEnd
                        return (
                          <>
                            <Clock width={11} height={11} color="#6C63FF" style={{ flexShrink: 0 }} />
                            {isSplit ? (
                              <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMins(edit.editStart)}–{fmtMins(edit.editEnd)}</span>
                                <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
                                <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMins(edit.editEnd + 30)}–{fmtMins(edit.splitEnd!)}</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                <span style={{ color: startChanged || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMins(edit.editStart)}</span>
                                <span style={{ color: '#9CA3AF' }}> – </span>
                                <span style={{ color: endChanged   || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMins(edit.editEnd)}</span>
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Change — net for multi */}
                    <div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: netDelta === 0 ? '#9CA3AF' : netDelta > 0 ? '#059669' : '#DC2626' }}>
                        {netDelta !== 0 ? fmtDelta(netDelta) : '—'}
                      </span>
                    </div>

                    {/* Reason — first edit's, or blank for multi */}
                    <div style={{ fontSize: 12.5, color: '#374151', paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMulti ? <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>See details</span> : firstEdit.reason}
                    </div>

                    {/* Edited by — first edit's editor */}
                    {(() => {
                      const editor = empMap.get(firstEdit.editedById)
                      if (!editor) return <div />
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: editor.bg, color: editor.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{editor.initials}</div>
                          <span style={{ fontSize: 12.5, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editor.name}</span>
                        </div>
                      )
                    })()}

                    {/* Type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TypeBadge type={types[0]} />
                      {types.length > 1 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{types.length - 1}</span>}
                    </div>
                  </div>

                  {/* Expanded detail rows */}
                  {isMulti && isOpen && (
                    <div style={{ borderTop: '1px solid #EDE9FE' }}>
                      {groupEdits.map((edit, i) => (
                        <EditRow key={edit.id} edit={edit} isLast={i === groupEdits.length - 1} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div style={{ padding: '11px 20px', borderTop: '1px solid #E5E7EB', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 10px 10px' }}>
              <span style={{ fontSize: 12.5, color: '#9CA3AF' }}>{filtered.length} edit{filtered.length !== 1 ? 's' : ''}</span>
              {stats.netMins !== 0 && (
                <span style={{ fontSize: 12.5, color: '#6B7280' }}>
                  Net change: <strong style={{ color: stats.netMins > 0 ? '#059669' : '#DC2626' }}>{fmtNetMins(stats.netMins)}</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
