import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  X, Check, Download,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { EMPLOYEES, ALL_PROJECTS, TEAM_LABELS } from '../data/employeesData'
import { peopleProfile } from '../lib/routes'

// ─── Date helpers ──────────────────────────────────────────────────────────────

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
function calKey(y: number, m: number, d: number) { return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
function fmtRangeLabel(s: string, e: string) {
  const sd = parseDate(s), ed = parseDate(e)
  const mo = (d: Date) => d.toLocaleDateString('en-US', { ...UTC, month: 'short', day: 'numeric' })
  const sy = sd.getUTCFullYear(), ey = ed.getUTCFullYear()
  if (s === e) return mo(sd) + ', ' + sy
  if (sy === ey) return `${mo(sd)} – ${mo(ed)}, ${sy}`
  return `${mo(sd)}, ${sy} – ${mo(ed)}, ${ey}`
}
function datesInRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = start
  while (cur <= end) { dates.push(cur); cur = addDays(cur, 1) }
  return dates
}
function fmtColDate(ds: string) {
  return parseDate(ds).toLocaleDateString('en-US', { ...UTC, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDurMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  if (mins === 0) return '—'
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
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

function getDayMins(empId: string, date: string): number {
  const d = parseDate(date)
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 6) return 0
  const seed = _hash(`${empId}_${date}_daily`)
  const absent = seed % 10 === 0
  if (absent) return 0
  return 240 + (seed % 300)
}

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

// ─── Multi-select filter dropdown ──────────────────────────────────────────────

interface DropdownItem { id: string; label: string; sub?: string; initials?: string; bg?: string; fg?: string; color?: string }

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
                  {it.color && !it.initials && <div style={{ width: 8, height: 8, borderRadius: '50%', background: it.color, flexShrink: 0 }} />}
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

// ─── Daily Total Page ──────────────────────────────────────────────────────────

const CURRENT_WEEK_START = startOfWeek(TODAY)
const CURRENT_WEEK_END   = addDays(CURRENT_WEEK_START, 6)

export function DailyTotalPage() {
  const [rangeStart, setRangeStart] = useState(CURRENT_WEEK_START)
  const [rangeEnd,   setRangeEnd]   = useState(CURRENT_WEEK_END)

  const [selProjects, setSelProjects] = useState<Set<string>>(new Set())
  const [selGroups,   setSelGroups]   = useState<Set<string>>(new Set())
  const [selMembers,  setSelMembers]  = useState<Set<string>>(new Set())

  const dates = useMemo(() => datesInRange(rangeStart, rangeEnd), [rangeStart, rangeEnd])

  // Clamp columns to a max to keep the table readable
  const MAX_COLS = 31
  const visibleDates = dates.slice(0, MAX_COLS)

  const projectItems: DropdownItem[] = useMemo(() =>
    ALL_PROJECTS.map(name => ({ id: name, label: name, color: '#6C63FF' })), [])

  const groupItems: DropdownItem[] = useMemo(() =>
    Object.entries(TEAM_LABELS).map(([id, label]) => ({ id, label })), [])

  const memberItems: DropdownItem[] = useMemo(() =>
    EMPLOYEES.map(e => ({ id: e.id, label: e.name, sub: deriveEmail(e.name), initials: e.initials, bg: e.bg, fg: e.fg })), [])

  const filteredEmployees = useMemo(() => {
    return EMPLOYEES.filter(e => {
      if (selMembers.size > 0 && !selMembers.has(e.id)) return false
      if (selGroups.size > 0 && !selGroups.has(e.team)) return false
      if (selProjects.size > 0 && !e.projects.some(p => selProjects.has(p))) return false
      return true
    })
  }, [selMembers, selGroups, selProjects])

  // Col totals (sum of all employees per day)
  const colTotals = useMemo(() =>
    visibleDates.map(d => filteredEmployees.reduce((sum, e) => sum + getDayMins(e.id, d), 0)),
    [filteredEmployees, visibleDates]
  )

  // Column wide enough for "Fri, May 1, 2026"
  const colW = 140

  function handleApply(s: string, e: string) { setRangeStart(s); setRangeEnd(e) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      <TopBar title="Daily Total" crumbs={[{ label: 'Reports' }, { label: 'Daily Total' }]} />

      {/* Toolbar */}
      <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <DateButton rangeStart={rangeStart} rangeEnd={rangeEnd} onApply={handleApply} />
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

      {/* Table wrapper — sticky first column + horizontal scroll */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden', minWidth: 'max-content', width: '100%' }}>

          {/* Header row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
            {/* Name col */}
            <div style={{ width: 220, flexShrink: 0, padding: '11px 20px', position: 'sticky', left: 0, background: '#fff', zIndex: 11, borderRight: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Member</span>
            </div>
            {/* Date cols */}
            {visibleDates.map((d, i) => {
              const label     = fmtColDate(d)
              const isToday   = d === TODAY
              const isWeekend = parseDate(d).getUTCDay() === 0 || parseDate(d).getUTCDay() === 6
              return (
                <div key={d} style={{ width: colW, flexShrink: 0, padding: '11px 16px', borderRight: i < visibleDates.length - 1 ? '1px solid #F3F4F6' : 'none', background: isToday ? '#F5F3FF' : '#fff' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isToday ? '#6C63FF' : isWeekend ? '#A78BFA' : '#374151', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
              )
            })}
            {/* Spacer pushes Total to the right */}
            <div style={{ flex: 1 }} />
            {/* Row total header */}
            <div style={{ width: 110, flexShrink: 0, padding: '11px 16px', borderLeft: '1px solid #E5E7EB', textAlign: 'right' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Total</span>
            </div>
          </div>

          {/* Employee rows */}
          {filteredEmployees.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No employees match the current filters.</div>
          ) : (
            filteredEmployees.map((emp) => {
              const email    = deriveEmail(emp.name)
              const dayMins  = visibleDates.map(d => getDayMins(emp.id, d))
              const rowTotal = dayMins.reduce((s, m) => s + m, 0)

              return (
                <div key={emp.id} className="dt-row" style={{ display: 'flex', borderBottom: '1px solid #F0F0F0', background: '#fff', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                >
                  {/* Sticky name cell */}
                  <div style={{ width: 220, flexShrink: 0, padding: '12px 20px', position: 'sticky', left: 0, background: 'inherit', zIndex: 5, borderRight: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: emp.bg, color: emp.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{emp.initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <Link to={peopleProfile(emp.id)} style={{ fontSize: 13, fontWeight: 500, color: '#111827', textDecoration: 'none', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6C63FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#111827'}
                      >{emp.name}</Link>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                    </div>
                  </div>

                  {/* Day cells */}
                  {dayMins.map((mins, i) => {
                    const d         = visibleDates[i]
                    const isToday   = d === TODAY
                    const hasHours  = mins > 0
                    return (
                      <div key={d} style={{ width: colW, flexShrink: 0, padding: '12px 16px', borderRight: i < visibleDates.length - 1 ? '1px solid #F3F4F6' : 'none', background: isToday ? '#FDFCFF' : 'transparent' }}>
                        {hasHours ? (
                          <span style={{ fontSize: 13, fontWeight: 400, color: '#374151', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtDurMins(mins)}</span>
                        ) : (
                          <span style={{ fontSize: 13, color: '#D1D5DB' }}>—</span>
                        )}
                      </div>
                    )
                  })}

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />
                  {/* Row total */}
                  <div style={{ width: 110, flexShrink: 0, padding: '12px 16px', borderLeft: '1px solid #E5E7EB', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: rowTotal > 0 ? '#111827' : '#D1D5DB', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtDurMins(rowTotal)}
                    </span>
                  </div>
                </div>
              )
            })
          )}

          {/* Footer — Daily total */}
          {filteredEmployees.length > 0 && (
            <div style={{ display: 'flex', borderTop: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <div style={{ width: 220, flexShrink: 0, padding: '12px 20px', position: 'sticky', left: 0, background: '#FAFAFA', zIndex: 5, borderRight: '1px solid #E5E7EB' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Daily total</span>
              </div>
              {colTotals.map((total, i) => (
                <div key={visibleDates[i]} style={{ width: colW, flexShrink: 0, padding: '12px 16px', borderRight: i < visibleDates.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: total > 0 ? '#374151' : '#D1D5DB', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {fmtDurMins(total)}
                  </span>
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ width: 110, flexShrink: 0, padding: '12px 16px', borderLeft: '1px solid #E5E7EB', textAlign: 'right' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6C63FF', fontVariantNumeric: 'tabular-nums' }}>
                  {fmtDurMins(colTotals.reduce((s, t) => s + t, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {dates.length > MAX_COLS && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: '#9CA3AF', textAlign: 'center' }}>
            Showing first {MAX_COLS} days of {dates.length}. Narrow the date range to see all days.
          </div>
        )}
      </div>
    </div>
  )
}
