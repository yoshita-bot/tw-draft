import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Globe, Users, Calendar, CalendarDays,
  ChevronLeft, ChevronRight, Search, X, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Clock, CheckCircle2, FileText, Upload, RefreshCw,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import {
  EMPLOYEES, ALL_PROJECTS, ACTIVE_CLIENT_IDS,
  TEAM_LABELS, SCHEDULE_TYPE_LABELS, fmtUTCHour, displayOffset,
  getScheduleForDay, getWorkDayList,
  type Employee, type Team, type ScheduleType, type DayOfWeek, type DaySchedule, type ShiftMove,
} from '../data/employeesData'
import { CLIENTS, CLIENT_MAP, type Client } from '../data/clientsData'

// ── Types ────────────────────────────────────────────────────────────────────

type TZKey     = 'EST' | 'PH' | 'LOCAL'
type ViewMode  = 'members' | 'week' | 'day'
type GroupBy   = 'client' | 'team' | 'none'

const TZ_OPTIONS: { key: TZKey; label: string }[] = [
  { key: 'EST',   label: 'EST (UTC−5)' },
  { key: 'PH',    label: 'PH Time (UTC+8)' },
  { key: 'LOCAL', label: 'My timezone' },
]

const PAGE_SIZE = 25

// ── Small helpers ─────────────────────────────────────────────────────────────

function fmt(utcH: number, tz: TZKey) {
  return fmtUTCHour(utcH, displayOffset(tz))
}

function dispH(utcH: number, tz: TZKey): number {
  const off = displayOffset(tz)
  return ((utcH + off) % 24 + 24) % 24
}

function displayToUTC(displayH: number, tz: TZKey): number {
  const off = displayOffset(tz)
  return ((displayH - off) % 24 + 24) % 24
}

function hhmm(decimalH: number): string {
  const h = Math.floor(((decimalH % 24) + 24) % 24)
  const m = Math.round((decimalH - Math.floor(decimalH)) * 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function parseHHMM(s: string): number {
  const [h, m] = s.split(':').map(Number)
  return h + (m || 0) / 60
}

function nowUTC() {
  const n = new Date()
  return n.getUTCHours() + n.getUTCMinutes() / 60
}

function getWeekDays(offset: number): Date[] {
  const now = new Date()
  const dow = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((dow + 6) % 7) + offset * 7)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(d: Date) { return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}` }

const TL_HOURS = [0,3,6,9,12,15,18,21]
const DAY_SLOT_HOURS = Array.from({ length: 13 }, (_,i) => i * 2)

// Day-of-week constants (0=Sun … 6=Sat)
const ORDERED_DAYS: DayOfWeek[] = [1,2,3,4,5,6,0]
const DAY_SHORT: Record<DayOfWeek, string> = { 0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat' }

interface DraftDaySchedule { startDisplay: string; endDisplay: string }

function durationLabel(start: string, end: string): string {
  const s = parseHHMM(start), e = parseHHMM(end)
  const diff = ((e - s) + 24) % 24
  if (!diff) return ''
  const h = Math.floor(diff), m = Math.round((diff - h) * 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ e, size = 28 }: { e: Employee; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: e.bg, color: e.fg,
      fontSize: size * 0.36, fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {e.initials}
    </div>
  )
}

// ── Client badge ──────────────────────────────────────────────────────────────

function ClientBadge({ clientId, small }: { clientId: string; small?: boolean }) {
  const c = CLIENT_MAP[clientId]
  if (!c) return null
  return (
    <span style={{
      fontSize: small ? 9.5 : 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
      background: c.color + '18', color: c.color,
      border: `1px solid ${c.color}30`,
      whiteSpace: 'nowrap',
    }}>
      {c.shortName}
    </span>
  )
}

// ── Schedule pill ─────────────────────────────────────────────────────────────

const SCHED_COLOR: Record<ScheduleType, { bg: string; text: string; border: string }> = {
  fixed:          { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  'free-overlap': { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  free:           { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
}

// ── Timeline bar ──────────────────────────────────────────────────────────────

function TimelineBar({ e, tz }: { e: Employee; tz: TZKey }) {
  const c = SCHED_COLOR[e.scheduleType]
  const todayDOW = new Date().getDay() as DayOfWeek

  if (e.scheduleType === 'free') {
    return (
      <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', paddingLeft: 4 }}>Flexible hours</span>
      </div>
    )
  }

  if (e.scheduleType === 'fixed') {
    const todaySched = getScheduleForDay(e, todayDOW)
    if (!todaySched) {
      return (
        <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#D1D5DB', fontStyle: 'italic', paddingLeft: 4 }}>Off today</span>
        </div>
      )
    }
    const s = dispH(todaySched.startUTC, tz)
    const en = dispH(todaySched.endUTC, tz)
    const l = (s / 24) * 100
    const w = en > s ? ((en - s) / 24) * 100 : ((24 - s + en) / 24) * 100
    return (
      <div style={{ position: 'relative', height: 28 }}>
        <div style={{
          position: 'absolute', top: 4, left: `${l}%`,
          width: `${Math.min(w, 100 - l)}%`, height: 20,
          borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`,
          display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'hidden', zIndex: 1,
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>
            {fmt(todaySched.startUTC, tz)} – {fmt(todaySched.endUTC, tz)}
          </span>
        </div>
      </div>
    )
  }

  // free-overlap
  return (
    <div style={{ position: 'relative', height: 28 }}>
      <div style={{ position: 'absolute', top: 11, left: 0, right: 0, height: 4, background: '#F3F4F6', borderRadius: 2 }} />
      {e.overlapBlocks.map((b, i) => {
        const s = dispH(b.startUTC, tz)
        const en = dispH(b.endUTC, tz)
        const l = (s / 24) * 100
        const w = Math.max(((en - s) / 24) * 100, 1.5)
        return (
          <div key={i} title={b.label} style={{
            position: 'absolute', top: 4, left: `${l}%`, width: `${w}%`,
            height: 20, borderRadius: 4, background: c.bg, border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', padding: '0 5px', overflow: 'hidden', zIndex: 1,
          }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>{b.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface Filters {
  search: string
  peopleIds: Set<string>         // specific employee IDs to show
  clientOrTeamIds: Set<string>   // client IDs OR 'abroadworker'|'chabadworker'
  scheduleTypes: Set<ScheduleType>
  status: 'all' | 'active' | 'onboarding'
}

function emptyFilters(): Filters {
  return { search: '', peopleIds: new Set(), clientOrTeamIds: new Set(), scheduleTypes: new Set(), status: 'all' }
}

function countActive(f: Filters): number {
  return (f.search ? 1 : 0) + f.peopleIds.size + f.clientOrTeamIds.size + f.scheduleTypes.size + (f.status !== 'all' ? 1 : 0)
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────

interface DropdownOption {
  id: string
  label: string
  sublabel?: string
  color?: string
  groupHeader?: string
  avatar?: { initials: string; bg: string; fg: string }
}

function MultiSelectDropdown({ trigger, options, selected, onToggle, onClear, maxHeight = 320 }: {
  trigger: React.ReactNode
  options: DropdownOption[]
  selected: Set<string>
  onToggle: (id: string) => void
  onClear: () => void
  maxHeight?: number
}) {
  const [open, setOpen] = useState(false)
  const [q,    setQ]    = useState('')
  const wrapRef         = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const visibleOptions = q
    ? options.filter(o => !o.groupHeader && (
        o.label.toLowerCase().includes(q.toLowerCase()) ||
        o.sublabel?.toLowerCase().includes(q.toLowerCase())
      ))
    : options

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, height: 34,
          padding: '0 10px', border: '1px solid', borderRadius: 8,
          background: open ? '#F5F3FF' : '#fff', cursor: 'pointer',
          fontSize: 13, color: selected.size ? '#4338CA' : '#374151',
          fontWeight: selected.size ? 600 : 400,
          borderColor: open || selected.size ? '#A5B4FC' : '#E8E8E8',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {trigger}
        {selected.size > 0 && (
          <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2 }}>
            {selected.size}
          </span>
        )}
        <ChevronDown size={13} color="#9CA3AF" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s', marginLeft: 2 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: 268,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #F3F4F6', position: 'relative' }}>
            <Search size={12} color="#9CA3AF" style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              style={{ width: '100%', padding: '5px 24px 5px 26px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
            />
            {q && (
              <button onClick={() => setQ('')} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={11} color="#9CA3AF" />
              </button>
            )}
          </div>

          {/* Options */}
          <div style={{ maxHeight, overflowY: 'auto' }}>
            {visibleOptions.map((opt, i) =>
              opt.groupHeader ? (
                <div key={`hdr-${i}`} style={{
                  padding: '8px 12px 4px', fontSize: 10, fontWeight: 700,
                  color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em',
                  background: '#F9FAFB', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                }}>
                  {opt.groupHeader}
                </div>
              ) : (
                <div
                  key={opt.id}
                  onClick={() => onToggle(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 12px', cursor: 'pointer',
                    background: selected.has(opt.id) ? '#F5F3FF' : undefined,
                  }}
                  onMouseEnter={e => { if (!selected.has(opt.id)) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected.has(opt.id) ? '#F5F3FF' : '' }}
                >
                  <input type="checkbox" checked={selected.has(opt.id)} onChange={() => onToggle(opt.id)}
                    style={{ accentColor: '#6C63FF', width: 13, height: 13, flexShrink: 0 }} />
                  {opt.avatar && (
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: opt.avatar.bg, color: opt.avatar.fg, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {opt.avatar.initials}
                    </div>
                  )}
                  {opt.color && !opt.avatar && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: '#374151', fontWeight: selected.has(opt.id) ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</div>
                    {opt.sublabel && <div style={{ fontSize: 10.5, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.sublabel}</div>}
                  </div>
                  {selected.has(opt.id) && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="6" viewBox="0 0 8 6"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                    </div>
                  )}
                </div>
              )
            )}
            {visibleOptions.filter(o => !o.groupHeader).length === 0 && (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 12.5, color: '#9CA3AF' }}>No results for "{q}"</div>
            )}
          </div>

          {/* Footer */}
          {selected.size > 0 && (
            <div style={{ padding: '8px 12px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#6B7280' }}>{selected.size} selected</span>
              <button onClick={() => { onClear(); setOpen(false) }} style={{ fontSize: 11.5, color: '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Apply filters ─────────────────────────────────────────────────────────────

function applyFilters(employees: Employee[], f: Filters): Employee[] {
  return employees.filter(e => {
    if (f.search) {
      const q = f.search.toLowerCase()
      const client = CLIENT_MAP[e.clientId]
      if (!e.name.toLowerCase().includes(q) && !e.role.toLowerCase().includes(q) && !(client?.name.toLowerCase().includes(q)))
        return false
    }
    // People filter — exact employee IDs
    if (f.peopleIds.size && !f.peopleIds.has(e.id)) return false
    // Client-or-team filter — matches either a specific clientId or a team key
    if (f.clientOrTeamIds.size) {
      const matchesClient = f.clientOrTeamIds.has(e.clientId)
      const matchesTeam   = f.clientOrTeamIds.has(e.team)
      if (!matchesClient && !matchesTeam) return false
    }
    if (f.scheduleTypes.size && !f.scheduleTypes.has(e.scheduleType)) return false
    if (f.status !== 'all' && e.status !== f.status) return false
    return true
  })
}

// ── Group employees ───────────────────────────────────────────────────────────

interface Group { key: string; label: string; color?: string; members: Employee[] }

function groupEmployees(employees: Employee[], by: GroupBy): Group[] {
  if (by === 'none') return [{ key: 'all', label: '', color: undefined, members: employees }]

  if (by === 'client') {
    const map = new Map<string, Employee[]>()
    for (const e of employees) {
      const arr = map.get(e.clientId) ?? []
      arr.push(e)
      map.set(e.clientId, arr)
    }
    return [...map.entries()]
      .map(([id, members]) => {
        const c = CLIENT_MAP[id]
        return { key: id, label: c?.name ?? id, color: c?.color, members }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }

  // by team
  const map = new Map<Team, Employee[]>()
  for (const e of employees) {
    const arr = map.get(e.team) ?? []
    arr.push(e)
    map.set(e.team, arr)
  }
  return [...map.entries()].map(([team, members]) => ({
    key: team, label: TEAM_LABELS[team], color: undefined, members,
  }))
}

// ── Member row (hover edit) ───────────────────────────────────────────────────

function MemberRow({ e, tz, isLast, onEdit, onView }: { e: Employee; tz: TZKey; isLast: boolean; onEdit: (e: Employee) => void; onView: (e: Employee) => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 36px',
        borderBottom: isLast ? '1px solid #F3F4F6' : '1px solid #F9FAFB',
        background: hovered ? '#FAFAFE' : undefined,
        transition: 'background 0.1s',
        cursor: 'pointer',
      }}
    >
      {/* Person — click opens detail */}
      <div onClick={() => onView(e)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
        <Avatar e={e} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
            {e.note && (
              <span title={e.note} style={{ fontSize: 11, color: '#F59E0B', flexShrink: 0 }}>📝</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 10.5, color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.role}</span>
            <ClientBadge clientId={e.clientId} small />
            {e.shiftMoves?.some(m => m.status === 'pending') && (
              <span title="Pending shift move" style={{ fontSize: 9, fontWeight: 700, background: '#FEF3C7', color: '#D97706', padding: '1px 4px', borderRadius: 3 }}>MOVE</span>
            )}
          </div>
        </div>
      </div>
      {/* Timeline — click also opens detail */}
      <div onClick={() => onView(e)} style={{ position: 'relative', padding: '0 8px', alignSelf: 'center' }}>
        {TL_HOURS.map(h => (
          <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${(h/24)*100}% + 8px)`, width: 1, background: '#F3F4F6', zIndex: 0 }} />
        ))}
        <TimelineBar e={e} tz={tz} />
      </div>
      {/* Edit button — separate action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 8 }}>
        <button
          onClick={ev => { ev.stopPropagation(); onView(e) }}
          title="View schedule"
          style={{
            opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#6B7280',
          }}
        >
          <Pencil size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Members view ──────────────────────────────────────────────────────────────

function MembersView({ groups, tz, page, onPage, total, onEdit, onView, groupBy }: {
  groups: Group[]
  tz: TZKey
  page: number
  onPage: (p: number) => void
  total: number
  onEdit: (e: Employee) => void
  onView: (e: Employee) => void
  groupBy: GroupBy
}) {
  const nowPct = (dispH(nowUTC(), tz) / 24) * 100
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
        {/* Timeline header */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, background: '#fff', zIndex: 3 }}>
          <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Member · {total}
          </div>
          <div style={{ position: 'relative', padding: '10px 0' }}>
            {TL_HOURS.map(h => (
              <span key={h} style={{ position: 'absolute', left: `${(h/24)*100}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                {fmtUTCHour(h, displayOffset(tz))}h → {fmt(h, tz)}
              </span>
            ))}
          </div>
        </div>

        {/* Row body — single now line spans full height */}
        <div style={{ position: 'relative' }}>
          {/* Continuous now line over the timeline column */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `calc(240px + (100% - 240px) * ${nowPct} / 100)`,
            width: 1, background: '#EF4444', zIndex: 4, pointerEvents: 'none',
          }} />

          {groups.map(group => (
            <div key={group.key}>
              {/* Group header */}
              {group.label && groupBy !== 'client' && (
                <div style={{
                  padding: '5px 16px',
                  background: '#F9FAFB',
                  borderBottom: '1px solid #F3F4F6',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>· {group.members.length}</span>
                </div>
              )}

              {group.members.map((e, idx) => (
                <MemberRow key={e.id} e={e} tz={tz} isLast={idx === group.members.length - 1} onEdit={onEdit} onView={onView} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onPage(page - 1)} disabled={page === 0} style={pagerBtn}>
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => onPage(i)} style={{ ...pagerBtn, background: page === i ? '#6C63FF' : '#fff', color: page === i ? '#fff' : '#374151', fontWeight: page === i ? 700 : 400 }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => onPage(page + 1)} disabled={page === totalPages - 1} style={pagerBtn}>
            <ChevronRight size={14} />
          </button>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

// ── Week cell helpers ─────────────────────────────────────────────────────────

// Reference 8-hour window (display hours) for a given employee
function cellWindow(e: Employee, tz: TZKey): { start: number; end: number } {
  if (e.scheduleType === 'fixed' && e.shiftStartUTC !== null) {
    const s = dispH(e.shiftStartUTC, tz)
    return { start: s, end: (s + 8) % 24 }
  }
  if (e.scheduleType === 'free-overlap' && e.overlapBlocks.length) {
    const starts = e.overlapBlocks.map(b => dispH(b.startUTC, tz))
    const ends   = e.overlapBlocks.map(b => dispH(b.endUTC, tz))
    const mn = Math.min(...starts), mx = Math.max(...ends)
    const mid = (mn + mx) / 2
    return { start: mid - 4, end: mid + 4 }
  }
  return { start: 9, end: 17 }
}

function pct(h: number, win: { start: number; end: number }): number {
  const span = ((win.end - win.start) + 24) % 24 || 8
  return Math.max(0, Math.min(100, (((h - win.start) + 24) % 24) / span * 100))
}

// ── Week cell tooltip ──────────────────────────────────────────────────────────

function WeekCellTooltip({ e, tz, label, timeStart, timeEnd }: {
  e: Employee; tz: TZKey; label?: string; timeStart?: number; timeEnd?: number
}) {
  const client  = CLIENT_MAP[e.clientId]
  const project = e.projects[0] ?? '—'
  const timeStr = timeStart != null && timeEnd != null
    ? `${fmt(timeStart, tz)} – ${fmt(timeEnd, tz)}`
    : null

  return (
    <div style={{
      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
      transform: 'translateX(-50%)', zIndex: 200,
      background: '#1F2937', color: '#fff', borderRadius: 8,
      padding: '8px 11px', width: 188, pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      fontSize: 11.5, lineHeight: 1.55,
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4, color: '#F9FAFB' }}>{label}</div>}
      {timeStr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D1D5DB' }}>
          <Clock size={10} /> {timeStr}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D1D5DB', marginTop: 3 }}>
        <Users size={10} /> {client?.name ?? '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#D1D5DB', marginTop: 3 }}>
        <Calendar size={10} /> {project}
      </div>
      {/* Arrow */}
      <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: '#1F2937', rotate: '45deg', borderRadius: 2 }} />
    </div>
  )
}

// ── Week cell ─────────────────────────────────────────────────────────────────

function WeekCell({ e, tz, isToday, isWeekend, dayOfWeek }: {
  e: Employee; tz: TZKey; isToday: boolean; isWeekend: boolean; dayOfWeek: DayOfWeek
}) {
  const [hoveredBar, setHoveredBar] = useState<number | 'fixed' | null>(null)
  const c   = SCHED_COLOR
  const win = cellWindow(e, tz)

  if (e.scheduleType === 'fixed') {
    const daySched = getScheduleForDay(e, dayOfWeek)
    if (!daySched) {
      return (
        <div style={{
          position: 'relative', height: 52, borderLeft: '1px solid #F3F4F6',
          background: isToday ? '#F5F3FF10' : '#F9FAFB',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9.5, color: '#E5E7EB', fontStyle: 'italic' }}>Off</span>
        </div>
      )
    }
    const dur = ((dispH(daySched.endUTC, tz) - dispH(daySched.startUTC, tz)) + 24) % 24
    const maxH = Math.max(dur, 4)
    const widthPct = Math.min(dur / maxH * 90, 90)
    return (
      <div style={{
        position: 'relative', height: 52,
        background: isToday ? '#FAFAFE' : isWeekend ? '#FAFAFA' : undefined,
        borderLeft: '1px solid #F3F4F6', padding: '0 4px',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: 4, right: 4, height: 3, marginTop: -1.5, background: '#F3F4F6', borderRadius: 2 }} />
        <div
          onMouseEnter={() => setHoveredBar('fixed')}
          onMouseLeave={() => setHoveredBar(null)}
          style={{ position: 'absolute', top: '50%', left: 4, width: `calc(${widthPct}% - 4px)`, height: 20, marginTop: -10, borderRadius: 4, background: c.fixed.bg, border: `1px solid ${c.fixed.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'default', zIndex: 1 }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: c.fixed.text, whiteSpace: 'nowrap' }}>
            {fmt(daySched.startUTC, tz)}–{fmt(daySched.endUTC, tz)}
          </span>
          {hoveredBar === 'fixed' && (
            <WeekCellTooltip e={e} tz={tz} label="Fixed shift" timeStart={daySched.startUTC} timeEnd={daySched.endUTC} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative', height: 52,
      background: isToday ? '#FAFAFE' : isWeekend ? '#FAFAFA' : undefined,
      borderLeft: '1px solid #F3F4F6', padding: '0 4px',
    }}>
      {e.scheduleType !== 'free' && (
        <div style={{ position: 'absolute', top: '50%', left: 4, right: 4, height: 3, marginTop: -1.5, background: '#F3F4F6', borderRadius: 2 }} />
      )}
      {e.scheduleType === 'free-overlap' && e.overlapBlocks.map((b, bi) => {
        const s  = dispH(b.startUTC, tz)
        const en = dispH(b.endUTC,   tz)
        const l  = pct(s, win)
        const w  = Math.max(pct(en, win) - l, 6)
        return (
          <div
            key={bi}
            onMouseEnter={() => setHoveredBar(bi)}
            onMouseLeave={() => setHoveredBar(null)}
            style={{ position: 'absolute', top: '50%', left: `calc(${l}% + 2px)`, width: `calc(${w}% - 2px)`, height: 18, marginTop: -9, borderRadius: 3, background: c['free-overlap'].bg, border: `1px solid ${c['free-overlap'].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', cursor: 'default', zIndex: 1 }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 700, color: c['free-overlap'].text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 3px' }}>{b.label}</span>
            {hoveredBar === bi && (
              <WeekCellTooltip e={e} tz={tz} label={b.label} timeStart={b.startUTC} timeEnd={b.endUTC} />
            )}
          </div>
        )
      })}
      {e.scheduleType === 'free' && (
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, marginTop: -8, textAlign: 'center', fontSize: 9.5, color: '#C4C9D4', fontStyle: 'italic' }}>flex</div>
      )}
    </div>
  )
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ employees, tz, weekOffset, onView }: { employees: Employee[]; tz: TZKey; weekOffset: number; onView: (e: Employee) => void }) {
  const days = getWeekDays(weekOffset)
  const today = new Date()

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px repeat(7, 1fr)', borderBottom: '1px solid #E8E8E8', position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
        <div />
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          return (
            <div key={i} style={{ padding: '10px 0', textAlign: 'center', background: isToday ? '#F5F3FF' : undefined, borderBottom: `2px solid ${isToday ? '#6C63FF' : 'transparent'}` }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{DAY_NAMES[i]}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#6C63FF' : '#374151' }}>{fmtDate(d)}</div>
            </div>
          )
        })}
      </div>

      {/* Employee rows */}
      {employees.map((e, idx) => (
        <div
          key={e.id}
          onClick={() => onView(e)}
          title="View schedule"
          style={{ display: 'grid', gridTemplateColumns: '200px repeat(7, 1fr)', borderBottom: idx < employees.length - 1 ? '1px solid #F9FAFB' : undefined, cursor: 'pointer' }}
          onMouseEnter={ev => { ev.currentTarget.style.background = '#FAFAFE' }}
          onMouseLeave={ev => { ev.currentTarget.style.background = '' }}
        >
          {/* Name cell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', height: 52, boxSizing: 'border-box' }}>
            <Avatar e={e} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
              <ClientBadge clientId={e.clientId} small />
            </div>
            <Pencil size={11} color="#D1D5DB" />
          </div>
          {/* Day cells */}
          {days.map((d, di) => (
            <WeekCell
              key={di}
              e={e}
              tz={tz}
              isToday={d.toDateString() === today.toDateString()}
              isWeekend={di >= 5}
              dayOfWeek={d.getDay() as DayOfWeek}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Day timeline cell (with per-bar hover tooltips) ───────────────────────────

function DayTimelineCell({ e, tz, isToday, nowPct, dayOfWeek }: {
  e: Employee; tz: TZKey; isToday: boolean; nowPct: number; dayOfWeek: DayOfWeek
}) {
  const [hoveredBar, setHoveredBar] = useState<number | 'fixed' | null>(null)
  const c = SCHED_COLOR

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'visible' }}>
      {DAY_SLOT_HOURS.map(h => (
        <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(h/24)*100}%`, width: 1, background: '#F3F4F6' }} />
      ))}
      {isToday && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${nowPct}%`, width: 1.5, background: '#EF4444', zIndex: 2 }} />}

      {e.scheduleType === 'fixed' && (() => {
        const daySched = getScheduleForDay(e, dayOfWeek)
        if (!daySched) return (
          <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' }}>Off</div>
        )
        const s  = dispH(daySched.startUTC, tz)
        const en = dispH(daySched.endUTC,   tz)
        const l  = (s / 24) * 100
        const w  = en > s ? ((en - s) / 24) * 100 : ((24 - s + en) / 24) * 100
        return (
          <div
            onMouseEnter={() => setHoveredBar('fixed')}
            onMouseLeave={() => setHoveredBar(null)}
            style={{ position: 'absolute', top: 10, height: 36, left: `${l}%`, width: `${Math.min(w, 100 - l)}%`, borderRadius: 5, background: c.fixed.bg, border: `1px solid ${c.fixed.border}`, display: 'flex', alignItems: 'center', padding: '0 8px', overflow: 'visible', zIndex: 1, cursor: 'default' }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: c.fixed.text, whiteSpace: 'nowrap' }}>{fmt(daySched.startUTC, tz)} – {fmt(daySched.endUTC, tz)}</span>
            {hoveredBar === 'fixed' && <WeekCellTooltip e={e} tz={tz} label="Fixed shift" timeStart={daySched.startUTC} timeEnd={daySched.endUTC} />}
          </div>
        )
      })()}

      {e.scheduleType === 'free-overlap' && e.overlapBlocks.map((b, bi) => {
        const s  = dispH(b.startUTC, tz)
        const en = dispH(b.endUTC,   tz)
        const l  = (s / 24) * 100
        const w  = Math.max(((en - s) / 24) * 100, 2)
        return (
          <div
            key={bi}
            onMouseEnter={() => setHoveredBar(bi)}
            onMouseLeave={() => setHoveredBar(null)}
            style={{ position: 'absolute', top: 10, height: 36, left: `${l}%`, width: `${w}%`, borderRadius: 5, background: c['free-overlap'].bg, border: `1px solid ${c['free-overlap'].border}`, display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'visible', zIndex: 1, cursor: 'default' }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, color: c['free-overlap'].text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
            {hoveredBar === bi && <WeekCellTooltip e={e} tz={tz} label={b.label} timeStart={b.startUTC} timeEnd={b.endUTC} />}
          </div>
        )
      })}

      {e.scheduleType === 'free' && (
        <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>Flexible hours</div>
      )}
    </div>
  )
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ employees, tz, dayOffset, onView }: { employees: Employee[]; tz: TZKey; dayOffset: number; onView: (e: Employee) => void }) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  const isToday  = dayOffset === 0
  const nowPct   = (dispH(nowUTC(), tz) / 24) * 100
  const dayOfWeek = date.getDay() as DayOfWeek
  const c = SCHED_COLOR

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        {isToday && <span style={{ fontSize: 11, fontWeight: 600, background: '#F5F3FF', color: '#6C63FF', borderRadius: 6, padding: '2px 8px' }}>Today</span>}
      </div>

      {/* Hour labels header */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ height: 32, borderRight: '1px solid #F3F4F6' }} />
        <div style={{ display: 'flex', height: 32, overflowX: 'hidden' }}>
          {DAY_SLOT_HOURS.map(h => (
            <div key={h} style={{ flex: 1, fontSize: 10, color: '#9CA3AF', fontWeight: 500, padding: '8px 0 0 4px', borderLeft: '1px solid #F3F4F6' }}>
              {fmt(h, tz)}
            </div>
          ))}
        </div>
      </div>

      {/* Employee rows — full row is clickable */}
      {employees.map((e, i) => (
        <div
          key={e.id}
          onClick={() => onView(e)}
          title="View schedule"
          style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: 56, cursor: 'pointer', borderBottom: i < employees.length - 1 ? '1px solid #F9FAFB' : undefined, background: i % 2 === 0 ? '#FAFAFA' : '#fff' }}
          onMouseEnter={ev => { ev.currentTarget.style.background = '#FAFAFE' }}
          onMouseLeave={ev => { ev.currentTarget.style.background = i % 2 === 0 ? '#FAFAFA' : '#fff' }}
        >
          {/* Name cell */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #F3F4F6', height: '100%', boxSizing: 'border-box' }}>
            <Avatar e={e} size={26} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                <ClientBadge clientId={e.clientId} small />
              </div>
            </div>
            <Pencil size={11} color="#D1D5DB" />
          </div>

          {/* Timeline cell */}
          <DayTimelineCell e={e} tz={tz} isToday={isToday} nowPct={nowPct} dayOfWeek={dayOfWeek} />
        </div>
      ))}
    </div>
  )
}

// ── Person detail modal ───────────────────────────────────────────────────────

function PersonDetailModal({ emp, tz, onEdit, onClose }: {
  emp: Employee
  tz: TZKey
  onEdit: () => void
  onClose: () => void
}) {
  const client  = CLIENT_MAP[emp.clientId]
  const c       = SCHED_COLOR[emp.scheduleType]
  const tzLabel = tz === 'EST' ? 'EST' : tz === 'PH' ? 'PH Time' : 'Local'

  const backdropRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ background: '#fff', borderRadius: 14, width: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.16)', overflow: 'hidden', animation: 'fadeScaleIn 0.18s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <Avatar e={emp} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{emp.name}</div>
            <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>{emp.role}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <ClientBadge clientId={emp.clientId} />
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#F3F4F6', color: '#6B7280' }}>
                {TEAM_LABELS[emp.team]}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: '#F3F4F6', color: '#6B7280' }}>
                {emp.homeTimezone}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Schedule type */}
          <DetailRow label="Schedule type">
            <span style={{ fontSize: 12.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
              {SCHEDULE_TYPE_LABELS[emp.scheduleType]}
            </span>
          </DetailRow>

          {/* Per-day schedule */}
          {emp.scheduleType === 'fixed' && (() => {
            const workDays = getWorkDayList(emp)
            if (!workDays.length) return null
            return (
              <DetailRow label={`Work schedule (${tzLabel})`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {workDays.map(d => {
                    const s = getScheduleForDay(emp, d)!
                    const dur = durationLabel(hhmm(dispH(s.startUTC, tz)), hhmm(dispH(s.endUTC, tz)))
                    return (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', width: 30 }}>{DAY_SHORT[d]}</span>
                        <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                          {fmt(s.startUTC, tz)} – {fmt(s.endUTC, tz)}
                        </span>
                        {dur && <span style={{ fontSize: 10.5, color: '#6B7280', background: '#F3F4F6', padding: '1px 5px', borderRadius: 4 }}>{dur}</span>}
                      </div>
                    )
                  })}
                </div>
              </DetailRow>
            )
          })()}

          {/* Pending shift moves */}
          {(emp.shiftMoves ?? []).filter(m => m.status === 'pending').length > 0 && (
            <DetailRow label="Pending shift moves">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {emp.shiftMoves!.filter(m => m.status === 'pending').map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6 }}>
                    <Clock size={11} color="#F59E0B" />
                    <span style={{ fontSize: 12, color: '#374151', flex: 1, lineHeight: 1.4 }}>
                      {m.moveType === 'time-adjust'
                        ? `${m.fromDate} · ${m.newStart}–${m.newEnd}`
                        : `${m.fromDate} → ${m.toDate ?? '?'} · ${m.newStart}–${m.newEnd}`}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706' }}>Pending</span>
                  </div>
                ))}
              </div>
            </DetailRow>
          )}

          {/* Overlap blocks */}
          {emp.scheduleType === 'free-overlap' && emp.overlapBlocks.length > 0 && (
            <DetailRow label={`Required overlap (${tzLabel})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {emp.overlapBlocks.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.text, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{b.label}</span>
                    <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>{fmt(b.startUTC, tz)} – {fmt(b.endUTC, tz)}</span>
                  </div>
                ))}
              </div>
            </DetailRow>
          )}

          {/* Projects */}
          {emp.projects.length > 0 && (
            <DetailRow label="Projects">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {emp.projects.map(p => (
                  <span key={p} style={{ fontSize: 11.5, fontWeight: 500, padding: '2px 8px', borderRadius: 5, background: '#F3F4F6', color: '#374151' }}>{p}</span>
                ))}
              </div>
            </DetailRow>
          )}

          {/* Note */}
          {emp.note && (
            <DetailRow label="Note">
              <div style={{ fontSize: 12.5, color: '#374151', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7, padding: '8px 10px', lineHeight: 1.55 }}>
                {emp.note}
              </div>
            </DetailRow>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 18px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280' }}>
            Close
          </button>
          <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: 'none', borderRadius: 7, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Pencil size={13} /> Edit Schedule
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }`}</style>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  )
}

// ── Work days editor ──────────────────────────────────────────────────────────

function WorkDaysEditor({ workDays, tz, onChange }: {
  workDays: Partial<Record<DayOfWeek, DraftDaySchedule>>
  tz: TZKey
  onChange: (w: Partial<Record<DayOfWeek, DraftDaySchedule>>) => void
}) {
  function toggleDay(day: DayOfWeek) {
    const next = { ...workDays }
    if (next[day]) {
      delete next[day]
    } else {
      const lastEnabled = ORDERED_DAYS.filter(d => next[d]).slice(-1)[0]
      const def = lastEnabled ? { ...next[lastEnabled]! } : { startDisplay: '09:00', endDisplay: '17:00' }
      next[day] = def
    }
    onChange(next)
  }

  function updateDay(day: DayOfWeek, field: 'startDisplay' | 'endDisplay', val: string) {
    onChange({ ...workDays, [day]: { ...workDays[day]!, [field]: val } })
  }

  function applyToAll() {
    const first = ORDERED_DAYS.find(d => workDays[d])
    if (!first) return
    const tpl = workDays[first]!
    const next: Partial<Record<DayOfWeek, DraftDaySchedule>> = {}
    for (const d of ORDERED_DAYS) { if (workDays[d]) next[d] = { ...tpl } }
    onChange(next)
  }

  const enabledDays = ORDERED_DAYS.filter(d => workDays[d])
  const allSame = enabledDays.length > 1 && enabledDays.every(d =>
    workDays[d]!.startDisplay === workDays[enabledDays[0]]!.startDisplay &&
    workDays[d]!.endDisplay   === workDays[enabledDays[0]]!.endDisplay
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          {enabledDays.length} day{enabledDays.length !== 1 ? 's' : ''} selected
        </span>
        {enabledDays.length > 1 && !allSame && (
          <button onClick={applyToAll} style={{ fontSize: 11, color: '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Apply first day's hours to all
          </button>
        )}
      </div>
      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {ORDERED_DAYS.map((day, idx) => {
          const enabled = !!workDays[day]
          const sched   = workDays[day]
          const dur     = enabled && sched ? durationLabel(sched.startDisplay, sched.endDisplay) : ''
          return (
            <div key={day} style={{
              display: 'grid', gridTemplateColumns: '88px 1fr',
              borderBottom: idx < 6 ? '1px solid #F3F4F6' : undefined,
              background: enabled ? '#fff' : '#FAFAFA',
            }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                cursor: 'pointer', userSelect: 'none', borderRight: '1px solid #F3F4F6',
              }}>
                <input type="checkbox" checked={enabled} onChange={() => toggleDay(day)}
                  style={{ accentColor: '#6C63FF', width: 13, height: 13, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: enabled ? 600 : 400, color: enabled ? '#374151' : '#9CA3AF' }}>
                  {DAY_SHORT[day]}
                </span>
              </label>
              {enabled && sched ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px' }}>
                  <input type="time" value={sched.startDisplay} onChange={e => updateDay(day, 'startDisplay', e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 6px' }} />
                  <span style={{ color: '#9CA3AF', fontSize: 11, flexShrink: 0 }}>→</span>
                  <input type="time" value={sched.endDisplay} onChange={e => updateDay(day, 'endDisplay', e.target.value)}
                    style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '5px 6px' }} />
                  {dur && (
                    <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, background: '#F3F4F6', borderRadius: 4, padding: '2px 5px', flexShrink: 0, minWidth: 24, textAlign: 'center' }}>
                      {dur}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <span style={{ fontSize: 11.5, color: '#D1D5DB', fontStyle: 'italic' }}>Off</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shift move section (inline within edit modal) ─────────────────────────────

function ShiftMoveSection({ emp, onAdd }: {
  emp: Employee
  onAdd: (move: ShiftMove) => void
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [moveType,  setMoveType]  = useState<'time-adjust' | 'day-move'>('time-adjust')
  const [fromDate,  setFromDate]  = useState('')
  const [toDate,    setToDate]    = useState('')
  const [newStart,  setNewStart]  = useState('09:00')
  const [newEnd,    setNewEnd]    = useState('17:00')
  const [reason,    setReason]    = useState('')
  const [submitted, setSubmitted] = useState(false)

  const pending = (emp.shiftMoves ?? []).filter(m => m.status === 'pending')
  const dur = durationLabel(newStart, newEnd)

  const canSubmit = fromDate && newStart && newEnd && reason.trim() &&
    (moveType === 'time-adjust' || !!toDate)

  function handleSubmit() {
    if (!canSubmit) return
    onAdd({
      id: `sm-${Date.now()}`,
      moveType,
      fromDate,
      toDate: moveType === 'day-move' ? toDate : undefined,
      newStart,
      newEnd,
      reason: reason.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false); setExpanded(false)
      setFromDate(''); setToDate(''); setReason('')
      setNewStart('09:00'); setNewEnd('17:00')
    }, 1200)
  }

  function fmtMove(m: ShiftMove): string {
    if (m.moveType === 'time-adjust') return `${m.fromDate} · hours changed to ${m.newStart}–${m.newEnd}`
    return `${m.fromDate} skipped → work ${m.toDate} ${m.newStart}–${m.newEnd}`
  }

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        One-Off Shift Changes
      </div>

      {/* Pending list */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {pending.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 7 }}>
              <Clock size={11} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#374151', flex: 1, lineHeight: 1.4 }}>{fmtMove(m)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>Pending</span>
            </div>
          ))}
        </div>
      )}

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '8px 12px', border: '1.5px dashed #D1D5DB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12.5, color: '#6B7280', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280' }}
        >
          <Plus size={13} /> Request a one-off shift change
        </button>
      ) : (
        <div style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Shift Change Request</span>
            <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>

          {/* Type toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 7, padding: 3, gap: 2 }}>
            {([
              { key: 'time-adjust', label: 'Adjust hours', sub: 'Same day, different time' },
              { key: 'day-move',    label: 'Move to another day', sub: 'Skip a day, work a different one' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setMoveType(t.key)} style={{
                flex: 1, padding: '6px 8px', border: 'none', borderRadius: 5, cursor: 'pointer',
                background: moveType === t.key ? '#fff' : 'transparent',
                boxShadow: moveType === t.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: moveType === t.key ? '#4338CA' : '#6B7280' }}>{t.label}</div>
                <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Original date */}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>
              {moveType === 'time-adjust' ? 'Date' : 'Date to skip (original shift)'}
            </div>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
          </div>

          {/* Replacement date — day-move only */}
          {moveType === 'day-move' && (
            <div>
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Work instead on</div>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* New hours */}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>
              {moveType === 'time-adjust' ? 'New hours for that day' : 'Hours on the replacement day'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
              <span style={{ color: '#9CA3AF', fontSize: 12, flexShrink: 0 }}>→</span>
              <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
              {dur && (
                <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, background: '#F3F4F6', padding: '3px 7px', borderRadius: 5, flexShrink: 0 }}>
                  {dur}
                </span>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Reason</div>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              placeholder={moveType === 'time-adjust'
                ? 'e.g. Errand in the morning, will work 12pm–8pm instead'
                : 'e.g. Vacation on Tuesday, compensating on Saturday'}
              rows={2} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitted}
            style={{
              padding: '9px 0', border: 'none', borderRadius: 7,
              fontSize: 13, fontWeight: 700, cursor: canSubmit && !submitted ? 'pointer' : 'default',
              background: submitted ? '#059669' : '#6C63FF', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: !canSubmit ? 0.5 : 1, transition: 'background 0.2s',
            }}
          >
            {submitted ? <><CheckCircle2 size={14} /> Submitted!</> : 'Submit Request'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Schedule Modal (create / edit) ────────────────────────────────────────────

interface ModalState {
  emp: Employee | null   // null = create new
  open: boolean
}

interface DraftOverlap { label: string; startDisplay: string; endDisplay: string }

function ScheduleModal({ emp, allEmployees, tz, onSave, onClose, onAddMove }: {
  emp: Employee | null
  allEmployees: Employee[]
  tz: TZKey
  onSave: (updated: Employee) => void
  onClose: () => void
  onAddMove?: (empId: string, move: ShiftMove) => void
}) {
  const isNew = emp === null

  const [selectedId,   setSelectedId]   = useState<string>(emp?.id ?? '')
  const [schedType,    setSchedType]    = useState<ScheduleType>(emp?.scheduleType ?? 'fixed')
  const [draftWorkDays, setDraftWorkDays] = useState<Partial<Record<DayOfWeek, DraftDaySchedule>>>(() => {
    if (emp?.scheduleType === 'fixed') {
      if (emp.workDays && Object.keys(emp.workDays).length > 0) {
        const result: Partial<Record<DayOfWeek, DraftDaySchedule>> = {}
        for (const [k, v] of Object.entries(emp.workDays)) {
          result[Number(k) as DayOfWeek] = { startDisplay: hhmm(dispH(v.startUTC, tz)), endDisplay: hhmm(dispH(v.endUTC, tz)) }
        }
        return result
      }
      const start = emp.shiftStartUTC != null ? hhmm(dispH(emp.shiftStartUTC, tz)) : '09:00'
      const end   = emp.shiftEndUTC   != null ? hhmm(dispH(emp.shiftEndUTC,   tz)) : '17:00'
      return { 1: { startDisplay: start, endDisplay: end }, 2: { startDisplay: start, endDisplay: end }, 3: { startDisplay: start, endDisplay: end }, 4: { startDisplay: start, endDisplay: end }, 5: { startDisplay: start, endDisplay: end } }
    }
    return { 1: { startDisplay: '09:00', endDisplay: '17:00' }, 2: { startDisplay: '09:00', endDisplay: '17:00' }, 3: { startDisplay: '09:00', endDisplay: '17:00' }, 4: { startDisplay: '09:00', endDisplay: '17:00' }, 5: { startDisplay: '09:00', endDisplay: '17:00' } }
  })
  const [overlaps,     setOverlaps]     = useState<DraftOverlap[]>(() =>
    (emp?.overlapBlocks ?? []).map(b => ({
      label:        b.label,
      startDisplay: hhmm(dispH(b.startUTC, tz)),
      endDisplay:   hhmm(dispH(b.endUTC,   tz)),
    }))
  )
  const [note,         setNote]         = useState(emp?.note ?? '')
  const [saved,        setSaved]        = useState(false)

  const target = isNew
    ? allEmployees.find(e => e.id === selectedId) ?? null
    : emp!

  function addOverlap() {
    setOverlaps(o => [...o, { label: '', startDisplay: '10:00', endDisplay: '11:00' }])
  }
  function removeOverlap(i: number) {
    setOverlaps(o => o.filter((_, j) => j !== i))
  }
  function updateOverlap(i: number, field: keyof DraftOverlap, val: string) {
    setOverlaps(o => o.map((b, j) => j === i ? { ...b, [field]: val } : b))
  }

  function handleSave() {
    if (!target) return
    let newWorkDays: Partial<Record<DayOfWeek, { startUTC: number; endUTC: number }>> | undefined
    if (schedType === 'fixed') {
      newWorkDays = {}
      for (const [k, v] of Object.entries(draftWorkDays)) {
        const day = Number(k) as DayOfWeek
        ;(newWorkDays as Record<number, { startUTC: number; endUTC: number }>)[day] = {
          startUTC: displayToUTC(parseHHMM(v.startDisplay), tz),
          endUTC:   displayToUTC(parseHHMM(v.endDisplay),   tz),
        }
      }
    }
    const firstDay = newWorkDays ? Object.values(newWorkDays)[0] : null
    const updated: Employee = {
      ...target,
      scheduleType:  schedType,
      workDays:      newWorkDays,
      shiftStartUTC: schedType === 'fixed' && firstDay ? firstDay.startUTC : null,
      shiftEndUTC:   schedType === 'fixed' && firstDay ? firstDay.endUTC   : null,
      overlapBlocks: schedType === 'free-overlap'
        ? overlaps.filter(b => b.label).map(b => ({
            label:    b.label,
            startUTC: displayToUTC(parseHHMM(b.startDisplay), tz),
            endUTC:   displayToUTC(parseHHMM(b.endDisplay),   tz),
          }))
        : [],
      note: note.trim() || undefined,
    }
    onSave(updated)
    setSaved(true)
    setTimeout(onClose, 800)
  }

  // Close on backdrop click
  const backdropRef = useRef<HTMLDivElement>(null)

  const tzLabel = tz === 'EST' ? 'EST' : tz === 'PH' ? 'PH Time' : 'Local time'

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{
        width: 480, maxHeight: '90vh', background: '#fff',
        borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fadeScaleIn 0.18s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {isNew ? 'Add Schedule' : 'Edit Schedule'}
            </div>
            {!isNew && (
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                {emp!.name} · {CLIENT_MAP[emp!.clientId]?.name}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          {/* Employee selector — new only */}
          {isNew && (
            <Field label="Employee">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select an employee…</option>
                {allEmployees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {CLIENT_MAP[e.clientId]?.shortName} · {e.role}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Employee info card — edit mode */}
          {!isNew && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
              <Avatar e={emp!} size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{emp!.name}</div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>{emp!.role}</div>
                <div style={{ marginTop: 4 }}>
                  <ClientBadge clientId={emp!.clientId} />
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
                <div>{TEAM_LABELS[emp!.team]}</div>
                <div style={{ marginTop: 2 }}>{emp!.homeTimezone}</div>
              </div>
            </div>
          )}

          {/* Schedule type */}
          <Field label="Schedule type">
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
              {(Object.entries(SCHEDULE_TYPE_LABELS) as [ScheduleType, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setSchedType(k)} style={{
                  flex: 1, padding: '7px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: schedType === k ? 700 : 500,
                  background: schedType === k ? '#fff' : 'transparent',
                  color: schedType === k ? '#4338CA' : '#6B7280',
                  boxShadow: schedType === k ? '0 1px 3px rgba(0,0,0,0.10)' : 'none',
                  transition: 'all 0.15s',
                }}>
                  {v}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 6 }}>
              {schedType === 'fixed'        && 'Select workdays and set hours for each — can vary by day.'}
              {schedType === 'free'         && 'Employee works whenever they want, no fixed hours.'}
              {schedType === 'free-overlap' && 'Flexible hours with required overlap windows.'}
            </div>
          </Field>

          {/* Dynamic work days & hours */}
          {schedType === 'fixed' && (
            <Field label={`Work days & hours (${tzLabel})`}>
              <WorkDaysEditor workDays={draftWorkDays} tz={tz} onChange={setDraftWorkDays} />
            </Field>
          )}

          {/* Overlap blocks */}
          {schedType === 'free-overlap' && (
            <Field label={`Required overlap blocks (${tzLabel})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overlaps.map((b, i) => (
                  <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280' }}>Block {i + 1}</span>
                      <button onClick={() => removeOverlap(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 2 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      placeholder="Block name (e.g. Team standup)"
                      value={b.label}
                      onChange={e => updateOverlap(i, 'label', e.target.value)}
                      style={{ ...inputStyle, fontSize: 12.5 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF', marginBottom: 3 }}>Start</div>
                        <input type="time" value={b.startDisplay} onChange={e => updateOverlap(i, 'startDisplay', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10.5, color: '#9CA3AF', marginBottom: 3 }}>End</div>
                        <input type="time" value={b.endDisplay} onChange={e => updateOverlap(i, 'endDisplay', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addOverlap}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1.5px dashed #D1D5DB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12.5, color: '#6B7280', width: '100%', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280' }}
                >
                  <Plus size={13} /> Add overlap block
                </button>
              </div>
            </Field>
          )}

          {/* Note */}
          <Field label="Note (optional)">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Reason for change, effective date notes…"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          {/* Shift move requests — edit mode only */}
          {!isNew && target && onAddMove && (
            <ShiftMoveSection
              emp={target}
              onAdd={move => onAddMove(target.id, move)}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isNew && !selectedId || saved}
            style={{
              flex: 2, padding: '9px 0', border: 'none', borderRadius: 8, cursor: (isNew && !selectedId) || saved ? 'default' : 'pointer',
              fontSize: 13, fontWeight: 700,
              background: saved ? '#059669' : '#6C63FF',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: isNew && !selectedId ? 0.5 : 1,
              transition: 'background 0.2s',
            }}
          >
            {saved ? <><CheckCircle2 size={15} /> Saved!</> : (isNew ? 'Add Schedule' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 7,
  fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box',
  background: '#fff',
}

// ── Request Schedule Change Modal ─────────────────────────────────────────────

type ChangeCategory = 'permanent' | 'day-swap' | 'time-adjust' | 'partial'

const CHANGE_CATEGORIES: { key: ChangeCategory; label: string; sub: string }[] = [
  { key: 'permanent',   label: 'Permanent change',  sub: 'New recurring schedule from a date forward' },
  { key: 'day-swap',    label: 'Day swap',           sub: 'Skip one or more days, work on other days instead' },
  { key: 'time-adjust', label: 'Different hours',    sub: 'Work the same days but at different times' },
  { key: 'partial',     label: 'Partial shift',      sub: 'Shorter day — optionally compensate on another day' },
]

interface SwapPair   { fromDate: string; toDate: string; start: string; end: string }
interface AdjustDay  { date: string; start: string; end: string }

function TimeRange({ start, end, onStart, onEnd, label }: {
  start: string; end: string
  onStart: (v: string) => void; onEnd: (v: string) => void
  label?: string
}) {
  const dur = durationLabel(start, end)
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="time" value={start} onChange={e => onStart(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <span style={{ color: '#9CA3AF', fontSize: 13, flexShrink: 0 }}>→</span>
        <input type="time" value={end} onChange={e => onEnd(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        {dur && <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, background: '#F3F4F6', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>{dur}</span>}
      </div>
    </div>
  )
}

function RequestScheduleChangeModal({ employees, tz, onClose }: {
  employees: Employee[]
  tz: TZKey
  onClose: () => void
}) {
  const [category,      setCategory]      = useState<ChangeCategory>('time-adjust')
  const [empId,         setEmpId]         = useState('')

  // — Permanent —
  const [effectiveDate, setEffectiveDate] = useState('')
  const [permDays,      setPermDays]      = useState<Partial<Record<DayOfWeek, DraftDaySchedule>>>(
    { 1: { startDisplay: '09:00', endDisplay: '17:00' }, 2: { startDisplay: '09:00', endDisplay: '17:00' },
      3: { startDisplay: '09:00', endDisplay: '17:00' }, 4: { startDisplay: '09:00', endDisplay: '17:00' },
      5: { startDisplay: '09:00', endDisplay: '17:00' } }
  )

  // — Day swap (multi-pair) —
  const [swaps, setSwaps] = useState<SwapPair[]>([{ fromDate: '', toDate: '', start: '09:00', end: '17:00' }])

  function addSwap()              { setSwaps(s => [...s, { fromDate: '', toDate: '', start: '09:00', end: '17:00' }]) }
  function removeSwap(i: number)  { setSwaps(s => s.filter((_, j) => j !== i)) }
  function updateSwap<K extends keyof SwapPair>(i: number, k: K, v: SwapPair[K]) {
    setSwaps(s => s.map((p, j) => j === i ? { ...p, [k]: v } : p))
  }

  // — Different hours (multi-day) —
  const [adjustDays, setAdjustDays] = useState<AdjustDay[]>([{ date: '', start: '09:00', end: '17:00' }])

  function addAdjustDay()              { setAdjustDays(a => [...a, { date: '', start: '09:00', end: '17:00' }]) }
  function removeAdjustDay(i: number)  { setAdjustDays(a => a.filter((_, j) => j !== i)) }
  function updateAdjustDay<K extends keyof AdjustDay>(i: number, k: K, v: AdjustDay[K]) {
    setAdjustDays(a => a.map((d, j) => j === i ? { ...d, [k]: v } : d))
  }

  // — Partial shift —
  const [partialDate,  setPartialDate]  = useState('')
  const [partialStart, setPartialStart] = useState('09:00')
  const [partialEnd,   setPartialEnd]   = useState('13:00')
  const [compensate,   setCompensate]   = useState(false)
  const [compDate,     setCompDate]     = useState('')
  const [compStart,    setCompStart]    = useState('09:00')
  const [compEnd,      setCompEnd]      = useState('17:00')

  // — Shared —
  const [note,      setNote]      = useState('')
  const [files,     setFiles]     = useState<File[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [dragOver,  setDragOver]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backdropRef  = useRef<HTMLDivElement>(null)

  const selectedEmp = employees.find(e => e.id === empId) ?? null

  const canSubmit = !!empId && note.trim().length >= 5 && files.length > 0 && (() => {
    if (category === 'permanent')   return !!effectiveDate && Object.keys(permDays).length > 0
    if (category === 'day-swap')    return swaps.every(s => s.fromDate && s.toDate)
    if (category === 'time-adjust') return adjustDays.every(d => d.date)
    if (category === 'partial')     return !!partialDate && (!compensate || !!compDate)
    return false
  })()

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...Array.from(incoming).filter(f => !names.has(f.name))]
    })
  }
  function removeFile(i: number) { setFiles(prev => prev.filter((_, j) => j !== i)) }

  function fmtFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleSubmit() {
    if (!canSubmit) return
    setSubmitted(true)
    setTimeout(onClose, 1400)
  }

  const tzLabel = tz === 'EST' ? 'EST' : tz === 'PH' ? 'PH Time' : 'Local'

  return (
    <div
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        width: 540, maxHeight: '92vh', background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'fadeScaleIn 0.18s ease',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={16} color="#6C63FF" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Request Schedule Change</div>
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, marginLeft: 40 }}>
              Client approval documentation is required for all requests.
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 4, flexShrink: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Employee */}
          <Field label="Employee">
            <select value={empId} onChange={e => setEmpId(e.target.value)} style={inputStyle}>
              <option value="">Select an employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} — {CLIENT_MAP[e.clientId]?.shortName} · {e.role}</option>
              ))}
            </select>
            {selectedEmp && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                <Avatar e={selectedEmp} size={30} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>{selectedEmp.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{selectedEmp.role} · {CLIENT_MAP[selectedEmp.clientId]?.name}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F3F4F6', color: '#6B7280' }}>
                    {SCHEDULE_TYPE_LABELS[selectedEmp.scheduleType]}
                  </span>
                </div>
              </div>
            )}
          </Field>

          {/* Change type */}
          <Field label="Type of change">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CHANGE_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  style={{
                    padding: '10px 12px', border: `1.5px solid ${category === c.key ? '#6C63FF' : '#E5E7EB'}`,
                    borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                    background: category === c.key ? '#F5F3FF' : '#fff', transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: category === c.key ? '#4338CA' : '#374151', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{c.sub}</div>
                </button>
              ))}
            </div>
          </Field>

          {/* ── Permanent ── */}
          {category === 'permanent' && (<>
            <Field label="Effective from">
              <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label={`New recurring schedule (${tzLabel})`}>
              <WorkDaysEditor workDays={permDays} tz={tz} onChange={setPermDays} />
            </Field>
          </>)}

          {/* ── Day swap (multi-pair) ── */}
          {category === 'day-swap' && (
            <Field label="Swap pairs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {swaps.map((s, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Swap {i + 1}
                      </span>
                      {swaps.length > 1 && (
                        <button onClick={() => removeSwap(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 2 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'end' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Skip (original shift)</div>
                        <input type="date" value={s.fromDate} onChange={e => updateSwap(i, 'fromDate', e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ paddingBottom: 8, color: '#9CA3AF', fontSize: 16 }}>→</div>
                      <div>
                        <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Work instead on</div>
                        <input type="date" value={s.toDate} onChange={e => updateSwap(i, 'toDate', e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    <TimeRange
                      label="Hours on replacement day"
                      start={s.start} end={s.end}
                      onStart={v => updateSwap(i, 'start', v)}
                      onEnd={v => updateSwap(i, 'end', v)}
                    />
                  </div>
                ))}

                <button
                  onClick={addSwap}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1.5px dashed #D1D5DB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12.5, color: '#6B7280', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280' }}
                >
                  <Plus size={13} /> Add another swap
                </button>
              </div>
            </Field>
          )}

          {/* ── Different hours (multi-day) ── */}
          {category === 'time-adjust' && (
            <Field label="Days with different hours">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {adjustDays.map((d, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Day {i + 1}
                      </span>
                      {adjustDays.length > 1 && (
                        <button onClick={() => removeAdjustDay(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', padding: 2 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Date</div>
                      <input type="date" value={d.date} onChange={e => updateAdjustDay(i, 'date', e.target.value)} style={inputStyle} />
                    </div>
                    <TimeRange
                      label="New hours for this day"
                      start={d.start} end={d.end}
                      onStart={v => updateAdjustDay(i, 'start', v)}
                      onEnd={v => updateAdjustDay(i, 'end', v)}
                    />
                  </div>
                ))}

                <button
                  onClick={addAdjustDay}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: '1.5px dashed #D1D5DB', borderRadius: 8, background: 'none', cursor: 'pointer', fontSize: 12.5, color: '#6B7280', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.color = '#6B7280' }}
                >
                  <Plus size={13} /> Add another day
                </button>
              </div>
            </Field>
          )}

          {/* ── Partial shift ── */}
          {category === 'partial' && (<>
            <Field label="Partial shift day">
              <input type="date" value={partialDate} onChange={e => setPartialDate(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Hours actually worked">
              <TimeRange
                start={partialStart} end={partialEnd}
                onStart={setPartialStart} onEnd={setPartialEnd}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
                Set only the window you will work — e.g. 09:00–13:00 if leaving mid-day.
              </div>
            </Field>

            {/* Compensation toggle */}
            <div style={{ background: compensate ? '#F5F3FF' : '#F9FAFB', border: `1px solid ${compensate ? '#C4B5FD' : '#E5E7EB'}`, borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, transition: 'all 0.15s' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={compensate}
                  onChange={e => setCompensate(e.target.checked)}
                  style={{ accentColor: '#6C63FF', width: 14, height: 14, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: compensate ? '#4338CA' : '#374151' }}>
                    Compensate remaining hours on another day
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                    Specify a make-up day for the hours not worked.
                  </div>
                </div>
              </label>

              {compensate && (
                <>
                  <div>
                    <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 4 }}>Compensation date</div>
                    <input type="date" value={compDate} onChange={e => setCompDate(e.target.value)} style={inputStyle} />
                  </div>
                  <TimeRange
                    label="Hours on compensation day"
                    start={compStart} end={compEnd}
                    onStart={setCompStart} onEnd={setCompEnd}
                  />
                </>
              )}
            </div>
          </>)}

          {/* Note — mandatory */}
          <Field label="Note / reason *">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={
                category === 'permanent'   ? 'Explain the reason for the permanent schedule change…' :
                category === 'day-swap'    ? 'e.g. National holiday on Thursday, compensating on Saturday…' :
                category === 'partial'     ? 'e.g. Doctor appointment in the afternoon, will leave at 1pm…' :
                'e.g. Client asked to shift the sync 2 hours earlier on those days…'
              }
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 72 }}
            />
            {note.trim().length > 0 && note.trim().length < 5 && (
              <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Note must be at least 5 characters.</div>
            )}
          </Field>

          {/* File upload — mandatory */}
          <Field label="Client approval document *">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
              style={{
                border: `2px dashed ${dragOver ? '#6C63FF' : files.length ? '#059669' : '#D1D5DB'}`,
                borderRadius: 10, padding: '18px 16px', cursor: 'pointer', textAlign: 'center',
                background: dragOver ? '#F5F3FF' : files.length ? '#F0FDF4' : '#FAFAFA',
                transition: 'all 0.15s',
              }}
            >
              <Upload size={20} color={files.length ? '#059669' : '#9CA3AF'} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: files.length ? '#065F46' : '#374151' }}>
                {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} attached` : 'Upload approval document'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3 }}>
                Drag & drop or click to browse · PDF, image, or doc
              </div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.heic"
              onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />

            {files.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 7 }}>
                    <FileText size={14} color="#059669" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#065F46', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: 11, color: '#6B7280', flexShrink: 0 }}>{fmtFileSize(f.size)}</span>
                    <button onClick={e => { e.stopPropagation(); removeFile(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2, flexShrink: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 6, fontSize: 11, color: '#9CA3AF' }}>
              Required — attach client approval email, screenshot, or signed document.
            </div>
          </Field>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '9px 0', border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitted}
            style={{
              flex: 2, padding: '9px 0', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: canSubmit && !submitted ? 'pointer' : 'default',
              background: submitted ? '#059669' : !canSubmit ? '#E5E7EB' : '#6C63FF',
              color: !canSubmit ? '#9CA3AF' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 0.2s',
            }}
          >
            {submitted ? <><CheckCircle2 size={15} /> Request submitted!</> : <><RefreshCw size={14} /> Submit Request</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }`}</style>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SchedulesPage() {
  const [tz,          setTz]          = useState<TZKey>('EST')
  const [view,        setView]        = useState<ViewMode>('members')
  const [groupBy,     setGroupBy]     = useState<GroupBy>('client')
  const [filters,     setFilters]     = useState<Filters>(emptyFilters)
  const [weekOffset,  setWeekOffset]  = useState(0)
  const [dayOffset,   setDayOffset]   = useState(0)
  const [page,        setPage]        = useState(0)
  const [employees,   setEmployees]   = useState<Employee[]>(EMPLOYEES)
  const [modal,       setModal]       = useState<ModalState>({ emp: null, open: false })
  const [detailEmp,   setDetailEmp]   = useState<Employee | null>(null)
  const [reqModalOpen, setReqModalOpen] = useState(false)

  const localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone

  const filtered = useMemo(() => applyFilters(employees, filters), [employees, filters])

  const openEdit = useCallback((e: Employee) => setModal({ emp: e, open: true }), [])
  const openView = useCallback((e: Employee) => setDetailEmp(e), [])

  function handleSave(updated: Employee) {
    setEmployees(prev =>
      prev.some(e => e.id === updated.id)
        ? prev.map(e => e.id === updated.id ? updated : e)
        : [...prev, updated]
    )
  }

  function handleAddShiftMove(empId: string, move: ShiftMove) {
    setEmployees(prev => prev.map(e =>
      e.id === empId ? { ...e, shiftMoves: [...(e.shiftMoves ?? []), move] } : e
    ))
  }

  // Paginate for Members view
  const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])

  const pagedGroups = useMemo(() => groupEmployees(paginated, groupBy), [paginated, groupBy])

  function handleFilterChange(f: Filters) {
    setFilters(f)
    setPage(0)
  }

  const activeCount = countActive(filters)

  // Build People dropdown options
  const peopleOptions: DropdownOption[] = useMemo(() =>
    employees.map(e => ({
      id: e.id,
      label: e.name,
      sublabel: `${e.role} · ${CLIENT_MAP[e.clientId]?.shortName ?? ''}`,
      avatar: { initials: e.initials, bg: e.bg, fg: e.fg },
    })),
  [employees])

  // Build Client & Teams dropdown — teams first, then individual clients
  const clientTeamOptions: DropdownOption[] = useMemo(() => {
    const teamGroup: DropdownOption[] = [
      { id: 'abroadworker', label: 'Abroadworkers', sublabel: `${employees.filter(e=>e.team==='abroadworker').length} members` },
      { id: 'chabadworker', label: 'Chabadworkers', sublabel: `${employees.filter(e=>e.team==='chabadworker').length} members` },
    ]
    const clientGroup: DropdownOption[] = ACTIVE_CLIENT_IDS
      .map(id => CLIENT_MAP[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({
        id: c.id,
        label: c.name,
        sublabel: `${employees.filter(e=>e.clientId===c.id).length} members`,
      }))
    return [...teamGroup, ...clientGroup]
  }, [employees])

  // Build Schedule type dropdown options
  const schedTypeOptions: DropdownOption[] = (Object.entries(SCHEDULE_TYPE_LABELS) as [ScheduleType, string][]).map(([k, v]) => ({ id: k, label: v }))

  function toggleFilter(key: 'peopleIds' | 'clientOrTeamIds' | 'scheduleTypes', id: string) {
    const set = new Set(filters[key] as Set<string>)
    set.has(id) ? set.delete(id) : set.add(id)
    handleFilterChange({ ...filters, [key]: set })
  }

  // People trigger label
  const peopleTrigger = filters.peopleIds.size === 0
    ? <><Users size={13} color="#9CA3AF" /> People</>
    : <><Users size={13} color="#6C63FF" /> {filters.peopleIds.size === 1 ? employees.find(e => filters.peopleIds.has(e.id))?.name.split(' ')[0] : `${filters.peopleIds.size} people`}</>

  // Client/team trigger label
  const ctIds = [...filters.clientOrTeamIds]
  const ctTrigger = ctIds.length === 0
    ? <span>Client &amp; Teams</span>
    : ctIds.length === 1
      ? <span>{clientTeamOptions.find(o => o.id === ctIds[0])?.label}</span>
      : <span>{ctIds.length} selected</span>

  // Schedule type trigger
  const stIds = [...filters.scheduleTypes]
  const stTrigger = stIds.length === 0
    ? <span>Schedule type</span>
    : stIds.length === 1
      ? <span>{SCHEDULE_TYPE_LABELS[stIds[0] as ScheduleType]}</span>
      : <span>{stIds.length} types</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'Schedules' }]} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ── Row 1: Views + nav + tz + add ── */}
        <div style={{ padding: '10px 24px', background: '#F7F8FA', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* View tabs */}
          <div style={{ display: 'flex', background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, overflow: 'hidden' }}>
            {([
              { key: 'members', label: 'By Members', icon: Users },
              { key: 'week',    label: 'Week',       icon: Calendar },
              { key: 'day',     label: 'Day',        icon: CalendarDays },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setView(key)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                border: 'none', borderRight: '1px solid #E8E8E8', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: view === key ? '#F5F3FF' : '#fff',
                color:      view === key ? '#6C63FF' : '#6B7280',
              }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Week/Day navigation */}
          {view === 'week' && <NavControls offset={weekOffset} onOffset={setWeekOffset} unit="week" />}
          {view === 'day'  && <NavControls offset={dayOffset}  onOffset={setDayOffset}  unit="day" />}

          <div style={{ flex: 1 }} />

          {/* Group by (members view only) */}
          {view === 'members' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Group by</span>
              <div style={{ display: 'flex', background: '#fff', border: '1px solid #E8E8E8', borderRadius: 7, overflow: 'hidden' }}>
                {([{ key: 'client', label: 'Client' }, { key: 'team', label: 'Team' }, { key: 'none', label: 'None' }] as const).map(g => (
                  <button key={g.key} onClick={() => setGroupBy(g.key)} style={{
                    padding: '5px 11px', border: 'none', borderRight: '1px solid #E8E8E8',
                    cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    background: groupBy === g.key ? '#6C63FF' : '#fff',
                    color:      groupBy === g.key ? '#fff' : '#6B7280',
                  }}>{g.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Timezone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, padding: '0 10px', height: 34 }}>
            <Globe size={13} color="#9CA3AF" />
            <select value={tz} onChange={e => setTz(e.target.value as TZKey)} style={{ border: 'none', outline: 'none', fontSize: 12.5, fontWeight: 600, color: '#374151', background: 'transparent', cursor: 'pointer' }}>
              {TZ_OPTIONS.map(t => (
                <option key={t.key} value={t.key}>{t.key === 'LOCAL' ? `Local (${localTzName})` : t.label}</option>
              ))}
            </select>
          </div>

          {/* Request schedule change */}
          <button
            onClick={() => setReqModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 34, border: '1.5px solid #6C63FF', borderRadius: 8, background: '#fff', color: '#6C63FF', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <RefreshCw size={14} /> Request Change
          </button>

          {/* Add schedule */}
          <button
            onClick={() => setModal({ emp: null, open: true })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 34, border: 'none', borderRadius: 8, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={14} /> Add Schedule
          </button>
        </div>

        {/* ── Row 2: Filter dropdowns + search + legend ── */}
        <div style={{ padding: '8px 24px', background: '#F7F8FA', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              value={filters.search}
              onChange={e => handleFilterChange({ ...filters, search: e.target.value })}
              placeholder="Search…"
              style={{ height: 34, padding: '0 28px 0 28px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#374151', outline: 'none', width: 180, boxSizing: 'border-box' }}
            />
            {filters.search && (
              <button onClick={() => handleFilterChange({ ...filters, search: '' })} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={12} color="#9CA3AF" />
              </button>
            )}
          </div>

          {/* People dropdown */}
          <MultiSelectDropdown
            trigger={peopleTrigger}
            options={peopleOptions}
            selected={filters.peopleIds}
            onToggle={id => toggleFilter('peopleIds', id)}
            onClear={() => handleFilterChange({ ...filters, peopleIds: new Set() })}
          />

          {/* Client & Teams dropdown */}
          <MultiSelectDropdown
            trigger={ctTrigger}
            options={clientTeamOptions}
            selected={filters.clientOrTeamIds}
            onToggle={id => toggleFilter('clientOrTeamIds', id)}
            onClear={() => handleFilterChange({ ...filters, clientOrTeamIds: new Set() })}
          />

          {/* Schedule type dropdown */}
          <MultiSelectDropdown
            trigger={stTrigger}
            options={schedTypeOptions}
            selected={filters.scheduleTypes}
            onToggle={id => toggleFilter('scheduleTypes', id)}
            onClear={() => handleFilterChange({ ...filters, scheduleTypes: new Set() })}
            maxHeight={200}
          />

          {/* Clear all */}
          {activeCount > 0 && (
            <button onClick={() => handleFilterChange(emptyFilters())} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', height: 34, padding: '0 4px' }}>
              <X size={12} /> Clear all
            </button>
          )}

          {/* Legend + count pushed right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            {[
              { label: 'Fixed', bg: '#DBEAFE', border: '#93C5FD' },
              { label: 'Overlap', bg: '#D1FAE5', border: '#6EE7B7' },
              { label: 'Flexible', bg: '#F3F4F6', border: '#D1D5DB' },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
                <div style={{ width: 12, height: 9, borderRadius: 3, background: l.bg, border: `1px solid ${l.border}` }} />
                {l.label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B7280' }}>
              <div style={{ width: 1.5, height: 12, background: '#EF4444' }} /> Now
            </div>
            <span style={{ fontSize: 12, color: '#9CA3AF', borderLeft: '1px solid #E8E8E8', paddingLeft: 12 }}>
              {filtered.length} of {employees.length}
            </span>
          </div>
        </div>

        {/* ── Content — full width, no sidebar ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#F7F8FA' }}>
          {view === 'members' && (
            <MembersView groups={pagedGroups} tz={tz} page={page} onPage={setPage} total={filtered.length} onEdit={openEdit} onView={openView} groupBy={groupBy} />
          )}
          {view === 'week' && (
            <WeekView employees={filtered.slice(0, PAGE_SIZE)} tz={tz} weekOffset={weekOffset} onView={openView} />
          )}
          {view === 'day' && (
            <DayView employees={filtered.slice(0, PAGE_SIZE)} tz={tz} dayOffset={dayOffset} onView={openView} />
          )}
        </div>
      </div>

      {/* Person detail modal */}
      {detailEmp && (
        <PersonDetailModal
          emp={employees.find(e => e.id === detailEmp.id) ?? detailEmp}
          tz={tz}
          onEdit={() => { setDetailEmp(null); setModal({ emp: detailEmp, open: true }) }}
          onClose={() => setDetailEmp(null)}
        />
      )}

      {/* Schedule modal */}
      {modal.open && (
        <ScheduleModal
          emp={modal.emp}
          allEmployees={employees}
          tz={tz}
          onSave={handleSave}
          onClose={() => setModal({ emp: null, open: false })}
          onAddMove={handleAddShiftMove}
        />
      )}

      {/* Request schedule change modal */}
      {reqModalOpen && (
        <RequestScheduleChangeModal
          employees={employees}
          tz={tz}
          onClose={() => setReqModalOpen(false)}
        />
      )}
    </div>
  )
}

// ── Mini calendar popover ─────────────────────────────────────────────────────

const CAL_DAYS  = ['Su','Mo','Tu','We','Th','Fr','Sa']

function startOfWeekSun(d: Date) {
  const c = new Date(d); c.setHours(0,0,0,0); c.setDate(d.getDate() - d.getDay()); return c
}
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }
function sameWeek(a: Date, b: Date) { return sameDay(startOfWeekSun(a), startOfWeekSun(b)) }

function MiniCalendar({ selected, mode, onSelect, onClose }: {
  selected: Date
  mode: 'day' | 'week'
  onSelect: (d: Date) => void
  onClose: () => void
}) {
  const [viewYear,  setViewYear]  = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())
  const [hovered,   setHovered]   = useState<Date | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const today = new Date()

  // First Sunday on or before the 1st of the displayed month
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const gridStart    = startOfWeekSun(firstOfMonth)

  // Build 6-week grid (42 cells)
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const highlight = hovered ?? selected

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
      marginTop: 6, zIndex: 999,
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '14px 12px', width: 252, userSelect: 'none',
    }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={prevMonth} style={calNavBtn}><ChevronLeft size={14} /></button>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={calNavBtn}><ChevronRight size={14} /></button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {CAL_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', padding: '3px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px 0' }}>
        {cells.map((cell, i) => {
          const inMonth     = cell.getMonth() === viewMonth
          const isToday     = sameDay(cell, today)
          const isSelected  = mode === 'day'  ? sameDay(cell, selected)   : sameWeek(cell, selected)
          const isHighlight = mode === 'day'  ? sameDay(cell, highlight)  : sameWeek(cell, highlight)
          const isWeekStart = cell.getDay() === 0
          const isWeekEnd   = cell.getDay() === 6

          let bg = 'transparent'
          let color = inMonth ? '#374151' : '#D1D5DB'
          let radius = '50%'

          if (isSelected || isHighlight) {
            if (mode === 'week') {
              bg     = isSelected ? '#6C63FF' : '#EEF2FF'
              color  = isSelected ? '#fff' : '#4338CA'
              radius = isWeekStart ? '8px 0 0 8px' : isWeekEnd ? '0 8px 8px 0' : '0'
            } else {
              bg    = isSelected ? '#6C63FF' : '#EEF2FF'
              color = isSelected ? '#fff' : '#4338CA'
            }
          }

          return (
            <div
              key={i}
              onClick={() => { onSelect(cell); if (mode === 'day') onClose() }}
              onMouseEnter={() => setHovered(cell)}
              onMouseLeave={() => setHovered(null)}
              style={{
                textAlign: 'center', padding: '5px 0', cursor: 'pointer',
                fontSize: 12, fontWeight: isToday ? 700 : 400,
                background: bg, color,
                borderRadius: radius,
                outline: isToday && !isSelected ? '1.5px solid #6C63FF' : undefined,
                outlineOffset: -2,
                transition: 'background 0.1s',
              }}
            >
              {cell.getDate()}
            </div>
          )
        })}
      </div>

      {/* Today shortcut */}
      <div style={{ marginTop: 10, borderTop: '1px solid #F3F4F6', paddingTop: 10, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => { onSelect(today); onClose() }}
          style={{ fontSize: 12, fontWeight: 600, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 12px', borderRadius: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          Go to today
        </button>
      </div>
    </div>
  )
}

// ── Nav controls ──────────────────────────────────────────────────────────────

function offsetToDate(offset: number, unit: 'week' | 'day'): Date {
  const d = new Date()
  if (unit === 'day')  d.setDate(d.getDate() + offset)
  if (unit === 'week') d.setDate(d.getDate() + offset * 7)
  return d
}

function dateToOffset(target: Date, unit: 'week' | 'day'): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const t     = new Date(target); t.setHours(0,0,0,0)
  const diffDays = Math.round((t.getTime() - today.getTime()) / 86400000)
  if (unit === 'day')  return diffDays
  // For week: find Mon of target week vs Mon of today
  const todayMon  = new Date(today);  todayMon.setDate(today.getDate()  - ((today.getDay()  + 6) % 7))
  const targetMon = new Date(t);      targetMon.setDate(t.getDate()     - ((t.getDay()      + 6) % 7))
  return Math.round((targetMon.getTime() - todayMon.getTime()) / (7 * 86400000))
}

function navLabel(offset: number, unit: 'week' | 'day', date: Date): string {
  if (offset === 0)  return unit === 'week' ? 'This week' : 'Today'
  if (offset === 1)  return unit === 'week' ? 'Next week' : 'Tomorrow'
  if (offset === -1) return unit === 'week' ? 'Last week' : 'Yesterday'
  if (unit === 'week') {
    const days    = getWeekDays(offset)
    const start   = days[0]; const end = days[6]
    if (start.getMonth() === end.getMonth())
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()}–${end.getDate()}`
    return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

function NavControls({ offset, onOffset, unit }: { offset: number; onOffset: (o: number) => void; unit: 'week' | 'day' }) {
  const [calOpen, setCalOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const anchorDate = offsetToDate(offset, unit)
  const label      = navLabel(offset, unit, anchorDate)

  function handleCalSelect(d: Date) {
    onOffset(dateToOffset(d, unit))
  }

  return (
    <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
      <button onClick={() => onOffset(offset - 1)} style={pagerBtn}><ChevronLeft size={14} /></button>

      {/* Date label — opens calendar */}
      <button
        onClick={() => setCalOpen(o => !o)}
        style={{
          ...pagerBtn,
          padding: '5px 12px', gap: 6, display: 'flex', alignItems: 'center',
          minWidth: 110, justifyContent: 'center',
          background: calOpen ? '#F5F3FF' : '#fff',
          borderColor: calOpen ? '#A5B4FC' : '#E8E8E8',
          color: '#374151', fontWeight: 500, fontSize: 13,
        }}
      >
        <CalendarDays size={13} color={calOpen ? '#6C63FF' : '#9CA3AF'} />
        {label}
      </button>

      {calOpen && (
        <MiniCalendar
          selected={anchorDate}
          mode={unit === 'week' ? 'week' : 'day'}
          onSelect={handleCalSelect}
          onClose={() => setCalOpen(false)}
        />
      )}

      <button onClick={() => onOffset(offset + 1)} style={pagerBtn}><ChevronRight size={14} /></button>
      {offset !== 0 && (
        <button onClick={() => { onOffset(0); setCalOpen(false) }} style={{ ...pagerBtn, fontSize: 11, padding: '5px 10px', color: '#6C63FF', fontWeight: 600 }}>
          Today
        </button>
      )}
    </div>
  )
}

const calNavBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, borderRadius: 6, border: '1px solid #E5E7EB',
  background: '#fff', cursor: 'pointer', color: '#6B7280', padding: 0,
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const pagerBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '5px 8px', border: '1px solid #E8E8E8', borderRadius: 6,
  background: '#fff', cursor: 'pointer', color: '#6B7280', fontSize: 12,
}
