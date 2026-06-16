import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera, ArrowRight, Clock,
  ChevronDown, ChevronUp, Pencil, PenLine, Edit2, PlusCircle,
  Scissors, Calendar,
} from 'lucide-react'
import {
  SCHEDULE_TYPE_LABELS, getScheduleForDay, getWorkDayList,
  fmtUTCHour, displayOffset,
  type DayOfWeek, type Employee,
} from '../data/employeesData'
import {
  activityForWorker, workSessionsForMember,
  timeEditsForMember, timeOffForMember, timesheetsForWorker,
} from '../lib/routes'

// ── Shared hash ───────────────────────────────────────────────────────────────

export function _hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

// ── MiniScreenshot ────────────────────────────────────────────────────────────

export function MiniScreenshot({ seed, width = 300, height = 168 }: { seed: number; width?: number; height?: number }) {
  const isDark  = seed % 3 !== 0
  const bg      = isDark ? '#1e1e2e' : '#f8fafc'
  const toolbar = isDark ? '#16213e' : '#e2e8f0'
  const sidebar = isDark ? '#242438' : '#f1f5f9'
  const line1   = isDark ? '#3d3d5c' : '#cbd5e1'
  const line2   = isDark ? '#4a4a6a' : '#e2e8f0'
  const accents = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EC4899','#06B6D4']
  const accent  = accents[seed % accents.length]
  const accent2 = accents[(seed + 2) % accents.length]
  const type    = seed % 4

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <rect width={width} height={height} fill={bg} />
      <rect width={width} height={16} fill={toolbar} />
      <rect x={5} y={5} width={5} height={5} rx={2.5} fill="#EF4444" />
      <rect x={13} y={5} width={5} height={5} rx={2.5} fill="#F59E0B" />
      <rect x={21} y={5} width={5} height={5} rx={2.5} fill="#10B981" />
      {type === 0 && <>
        <rect x={0} y={16} width={width * 0.22} height={height - 16} fill={sidebar} />
        {[0,1,2,3].map(i => <rect key={i} x={4} y={22 + i * 11} width={width * 0.14 - (i % 3) * 6} height={5} rx={2} fill={i === 1 ? accent : line1} opacity={0.7} />)}
        {[0,1,2,3,4,5].map(i => <rect key={i} x={width * 0.26} y={20 + i * 11} width={(0.4 + (_hash(`${seed}_l${i}`) % 40) / 100) * (width * 0.68)} height={4} rx={2} fill={[accent, accent2, line2, line2][i % 4]} opacity={0.75} />)}
      </>}
      {type === 1 && <>
        <rect x={0} y={16} width={width * 0.18} height={height - 16} fill={sidebar} />
        {[0,1,2].map(i => <rect key={i} x={4} y={22 + i * 14} width={width * 0.12} height={7} rx={3} fill={i === 1 ? accent : line1} opacity={i === 1 ? 0.9 : 0.5} />)}
        <rect x={width * 0.2} y={20} width={width * 0.76} height={height * 0.4} rx={3} fill={isDark ? '#2a2a40' : '#fff'} stroke={line2} strokeWidth={1} />
        {[0,1,2,3,4].map(i => { const bh = 10 + (_hash(`${seed}_b${i}`) % 25); return <rect key={i} x={width * 0.22 + i * (width * 0.6 / 6)} y={20 + height * 0.4 - bh - 4} width={width * 0.07} height={bh} rx={2} fill={i % 2 ? accent : accent2} opacity={0.85} /> })}
      </>}
      {type === 2 && <>
        <rect x={width * 0.08} y={22} width={width * 0.84} height={height - 30} rx={5} fill={isDark ? '#252538' : '#fff'} stroke={line2} strokeWidth={1} />
        {[0,1,2].map(i => (
          <React.Fragment key={i}>
            <rect x={width * 0.12} y={28 + i * 20} width={width * 0.2} height={4} rx={2} fill={line1} opacity={0.6} />
            <rect x={width * 0.12} y={34 + i * 20} width={width * 0.68} height={9} rx={3} fill={line2} opacity={0.5} />
          </React.Fragment>
        ))}
        <rect x={width * 0.12} y={height - 18} width={width * 0.24} height={10} rx={3} fill={accent} opacity={0.9} />
      </>}
      {type === 3 && <>
        <rect x={0} y={16} width={width} height={13} fill={isDark ? '#252538' : '#f1f5f9'} />
        {[0,1,2].map(i => <rect key={i} x={5 + i * (width / 3)} y={21} width={width / 3 - 9} height={4} rx={2} fill={line1} opacity={0.7} />)}
        {[0,1,2,3,4].map(i => (
          <React.Fragment key={i}>
            <rect x={0} y={30 + i * 12} width={width} height={12} fill={i % 2 ? (isDark ? '#252538' : '#f8fafc') : bg} />
            {[0,1,2].map(j => <rect key={j} x={5 + j * (width / 3)} y={34 + i * 12} width={width / 3 - 10} height={4} rx={2} fill={j === 0 && i === 2 ? accent : line1} opacity={j === 0 && i === 2 ? 0.9 : 0.45} />)}
          </React.Fragment>
        ))}
      </>}
      <rect x={0} y={height - 10} width={width} height={10} fill={toolbar} opacity={0.8} />
    </svg>
  )
}

// ── ActivityBar ───────────────────────────────────────────────────────────────

export function ActivityBar({ rate }: { rate: number }) {
  const color = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: 99 }} />
    </div>
  )
}

// ── Screenshots widget ────────────────────────────────────────────────────────

export interface ScreenCard {
  seed: number; slotStart: string; slotEnd: string
  project: string; activityRate: number; keystrokes: number; mouseClicks: number
}

export function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'am' : 'pm'}`
}

export function TodaysScreenshotsWidget({ workerName, workerId, projects, workerColor }: {
  workerName: string; workerId: string; projects: string[]; workerColor: string
}) {
  const today = new Date().toISOString().split('T')[0]
  const SLOTS = [
    ['09:00','09:10'], ['09:30','09:40'], ['10:00','10:10'], ['10:40','10:50'],
    ['11:10','11:20'], ['13:00','13:10'], ['14:20','14:30'], ['15:00','15:10'],
  ]
  const cards: ScreenCard[] = SLOTS.map(([start, end]) => {
    const seed = _hash(`${workerId}_${today}_${start}`)
    const projectList = projects.length > 0 ? projects : ['General']
    return {
      seed, slotStart: start, slotEnd: end,
      project: projectList[Math.floor(seed / 100) % projectList.length],
      activityRate: 45 + (seed % 50),
      keystrokes: 100 + (seed % 900),
      mouseClicks: 10 + (seed % 80),
    }
  })

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera width={14} height={14} color="#6C63FF" />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Screenshots</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', borderRadius: 99, padding: '1px 8px' }}>{cards.length}</span>
        </div>
        <Link
          to={activityForWorker(workerName)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#6C63FF', textDecoration: 'none', padding: '5px 12px', borderRadius: 7, border: '1px solid #C7C3FF', background: '#F5F3FF' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EDE9FE' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3FF' }}
        >
          View full activity <ArrowRight width={13} height={13} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cards.map((card, i) => {
          const actColor = card.activityRate >= 70 ? '#10B981' : card.activityRate >= 40 ? '#F59E0B' : '#EF4444'
          return (
            <Link key={i} to={activityForWorker(workerName)}
              style={{ textDecoration: 'none', display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid #E8E8E8', background: '#fff', transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#C7C3FF'; el.style.boxShadow = '0 3px 10px rgba(108,99,255,0.10)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8E8E8'; el.style.boxShadow = 'none' }}
            >
              <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}><MiniScreenshot seed={card.seed} /></div>
              <div style={{ padding: '6px 10px 8px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmt12(card.slotStart)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: actColor }}>{card.activityRate}%</span>
                </div>
                <ActivityBar rate={card.activityRate} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Work Sessions widget ──────────────────────────────────────────────────────

export const TODAY_WS = '2026-06-12'
export const TASK_NAMES_WS = [
  'Code review', 'UI implementation', 'Bug fix', 'Documentation',
  'Testing', 'Deploy prep', 'Client call', 'Design review', 'Data migration', '',
]

export function parseDateWS(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
export function addDaysWS(ds: string, n: number) { const d = parseDateWS(ds); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().split('T')[0] }
export function fmtDurMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  if (mins === 0) return '—'
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}
export function fmtTimeHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(':').map(Number)
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`
}

export interface WorkSessionPreview { startTime: string; endTime: string; project: string; task: string | null; durationMins: number; activityPct: number; manual: boolean }

export function generateSessionsPreview(empId: string, date: string, projects: string[]): WorkSessionPreview[] {
  const d = parseDateWS(date)
  const dow = d.getUTCDay()
  if (dow === 0 || dow === 6) return []
  const seed = _hash(`${empId}_${date}_sessions`)
  if (seed % 10 === 0) return []
  const count = 1 + (seed % 4)
  const sessions: WorkSessionPreview[] = []
  let curHour = 8 + (seed % 3), curMin = (seed % 4) * 15
  for (let i = 0; i < count; i++) {
    const s = _hash(`${empId}_${date}_sess_${i}`)
    const dur = 25 + (s % 95)
    const proj = projects.length ? projects[s % projects.length] : 'General'
    const task = TASK_NAMES_WS[s % TASK_NAMES_WS.length] || null
    const manual = s % 7 === 0
    const act = manual ? 0 : 20 + (s % 81)
    const endTotal = curHour * 60 + curMin + dur
    if (Math.floor(endTotal / 60) >= 22) break
    sessions.push({
      project: proj, task,
      startTime: `${String(curHour).padStart(2,'0')}:${String(curMin).padStart(2,'0')}`,
      endTime: `${String(Math.floor(endTotal/60)).padStart(2,'0')}:${String(endTotal%60).padStart(2,'0')}`,
      durationMins: dur, activityPct: act, manual,
    })
    const gap = TASK_NAMES_WS.length > 0 ? 5 + (s % 20) : 10
    curHour = Math.floor(endTotal / 60)
    curMin = endTotal % 60 + gap
    if (curMin >= 60) { curHour += Math.floor(curMin / 60); curMin = curMin % 60 }
  }
  return sessions
}

export function WsActivityBar({ pct, manual }: { pct: number; manual: boolean }) {
  if (manual) return <span style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>manual</span>
  const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 56, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 26 }}>{pct}%</span>
    </div>
  )
}

export function WorkSessionsWidget({ empId, projects }: { empId: string; projects: string[] }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const todaySessions = generateSessionsPreview(empId, TODAY_WS, projects)
  const prevDate = addDaysWS(TODAY_WS, -1)
  const prevSessions = generateSessionsPreview(empId, prevDate, projects)

  type DayGroup = { date: string; label: string; sessions: WorkSessionPreview[] }
  const groups: DayGroup[] = []
  if (todaySessions.length > 0) groups.push({ date: TODAY_WS, label: 'Today', sessions: todaySessions })
  if (prevSessions.length > 0) groups.push({ date: prevDate, label: 'Yesterday', sessions: prevSessions })

  const thS: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase',
    letterSpacing: '0.04em', padding: '8px 12px', borderRight: '1px solid #F3F4F6', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock width={15} height={15} color="#6B7280" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Work Sessions</span>
        </div>
        <Link to={workSessionsForMember(empId)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight width={12} height={12} />
        </Link>
      </div>
      {groups.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, padding: '20px 18px' }}>No sessions recorded.</p>
      ) : (
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: '#FAFAFA', borderBottom: '2px solid #E5E7EB' }}>
            <div style={{ ...thS, flex: 1 }}>Project / Task</div>
            <div style={{ ...thS, width: 50, textAlign: 'center' }}>Manual</div>
            <div style={{ ...thS, width: 88 }}>Start</div>
            <div style={{ ...thS, width: 88 }}>Stop</div>
            <div style={{ ...thS, width: 70 }}>Duration</div>
            <div style={{ ...thS, width: 110, borderRight: 'none' }}>Activity</div>
          </div>
          {groups.map(({ date, label, sessions }) => {
            const dayTotal = sessions.reduce((a, s) => a + s.durationMins, 0)
            const isToday = date === TODAY_WS
            return (
              <React.Fragment key={date}>
                <div
                  onClick={() => setCollapsed(c => !c)}
                  style={{ display: 'flex', alignItems: 'center', padding: '7px 12px', background: '#F5F3FF', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', userSelect: 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EDE9FE'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F5F3FF'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                    {collapsed ? <ChevronDown width={13} height={13} color="#6C63FF" /> : <ChevronUp width={13} height={13} color="#6C63FF" />}
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4C46B2' }}>{label}</span>
                    {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#6C63FF', borderRadius: 4, padding: '1px 6px' }}>Today</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4C46B2' }}>{fmtDurMins(dayTotal)}</span>
                  </div>
                </div>
                {!collapsed && sessions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', background: '#fff' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    <div style={{ flex: 1, padding: '9px 12px', borderRight: '1px solid #F3F4F6', minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.project}</div>
                      {s.task && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.task}</div>}
                    </div>
                    <div style={{ width: 50, padding: '9px 12px', borderRight: '1px solid #F3F4F6', display: 'flex', justifyContent: 'center' }}>
                      {s.manual ? <PenLine width={13} height={13} color="#F59E0B" /> : <span style={{ fontSize: 13, color: '#D1D5DB' }}>—</span>}
                    </div>
                    <div style={{ width: 88, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtTimeHHMM(s.startTime)}</span>
                    </div>
                    <div style={{ width: 88, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtTimeHHMM(s.endTime)}</span>
                    </div>
                    <div style={{ width: 70, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtDurMins(s.durationMins)}</span>
                    </div>
                    <div style={{ width: 110, padding: '9px 12px' }}>
                      <WsActivityBar pct={s.activityPct} manual={s.manual} />
                    </div>
                  </div>
                ))}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Time Edits widget ─────────────────────────────────────────────────────────

const TODAY_TE = '2026-06-12'
const EDITED_REASONS_TE = ['Forgot to stop timer','Forgot to start timer','Working offline','Adjusted for time zone','System error','Corrected duplicate entry']
const ADDED_REASONS_TE  = ['Timer not started','Attended client meeting','Emergency response','Training session','Offsite work not tracked']
const SPLIT_REASONS_TE  = ['Break not recorded','Lunch break missing','Two separate tasks combined','Client meeting in the middle','System outage during session']

function addDaysTE(ds: string, n: number) { const [y,m,d]=ds.split('-').map(Number); const dt=new Date(Date.UTC(y,m-1,d)); dt.setUTCDate(dt.getUTCDate()+n); return dt.toISOString().split('T')[0] }
function fmtMinsTE(totalMins: number) {
  const normalized = ((totalMins % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60), m = normalized % 60
  const ampm = h >= 12 ? 'PM' : 'AM', h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
function fmtDeltaTE(mins: number) {
  const sign = mins >= 0 ? '+' : '-', abs = Math.abs(mins)
  const h = Math.floor(abs / 60), m = abs % 60
  if (h > 0 && m > 0) return `${sign}${h}h ${m}m`
  if (h > 0) return `${sign}${h}h`
  return `${sign}${m}m`
}
function fmtDateShortTE(ds: string) {
  const [y,m,d]=ds.split('-').map(Number)
  return new Date(Date.UTC(y,m-1,d)).toLocaleDateString('en-US',{timeZone:'UTC',weekday:'short',month:'short',day:'numeric'})
}

type EditTypeTE = 'edited' | 'added' | 'split'
interface TimeEditPreview { date: string; editType: EditTypeTE; origStart: number; origEnd: number; editStart: number; editEnd: number; splitEnd?: number; delta: number; reason: string }

export function getAllEdits(empId: string, shiftStartUTC: number): TimeEditPreview[] {
  const seed0 = _hash(`${empId}_edits`)
  const count = 2 + (seed0 % 4)
  const edits: TimeEditPreview[] = []
  for (let i = 0; i < count; i++) {
    const seed = _hash(`${empId}_edit_${i}_v3`)
    const daysAgo = 1 + (seed % 59)
    const date = addDaysTE(TODAY_TE, -daysAgo)
    const shiftBase = shiftStartUTC * 60
    const origStart = shiftBase + ((seed % 3) * 15)
    const origEnd   = origStart + 420 + ((seed % 5) * 30)
    const typeSeed  = _hash(`${empId}_type_${i}`)
    const editType: EditTypeTE = typeSeed % 20 < 4 ? 'split' : typeSeed % 20 < 9 ? 'added' : 'edited'
    let editStart = origStart, editEnd = origEnd, splitEnd: number | undefined, delta = 0, reason = ''
    if (editType === 'edited') {
      const deltaVal = [-3,-2,-1,1,2,3][seed % 6] * 15
      const cs = _hash(`${empId}_cs_${i}`) % 3 !== 0, ce = _hash(`${empId}_ce_${i}`) % 3 !== 0 || !cs
      editStart = cs ? origStart + deltaVal : origStart
      editEnd   = ce ? origEnd   + deltaVal : origEnd
      delta = (editEnd - editStart) - (origEnd - origStart)
      reason = EDITED_REASONS_TE[seed % EDITED_REASONS_TE.length]
    } else if (editType === 'added') {
      editStart = shiftBase - 60 - ((seed % 3) * 30)
      editEnd   = editStart + 60 + ((seed % 4) * 30)
      delta = editEnd - editStart
      reason = ADDED_REASONS_TE[seed % ADDED_REASONS_TE.length]
    } else {
      const mid = origStart + Math.floor((origEnd - origStart) / 2)
      const gap = 30 + ((seed % 3) * 15)
      editEnd  = mid - Math.floor(gap / 2)
      splitEnd = origEnd
      delta    = -gap
      reason   = SPLIT_REASONS_TE[seed % SPLIT_REASONS_TE.length]
    }
    edits.push({ date, editType, origStart: editType === 'added' ? 0 : origStart, origEnd: editType === 'added' ? 0 : origEnd, editStart, editEnd, splitEnd, delta, reason })
  }
  return edits.sort((a, b) => b.date.localeCompare(a.date))
}

const EDIT_TYPE_STYLE: Record<EditTypeTE, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  edited: { label: 'Edited', bg: '#EEF2FF', color: '#4F46E5', icon: <Edit2      width={11} height={11} /> },
  added:  { label: 'Added',  bg: '#ECFDF5', color: '#059669', icon: <PlusCircle width={11} height={11} /> },
  split:  { label: 'Split',  bg: '#FFF7ED', color: '#C2410C', icon: <Scissors   width={11} height={11} /> },
}

const TE_COLS = '100px 160px 200px 72px 1fr 80px'

function TeOrigCell({ edit }: { edit: TimeEditPreview }) {
  if (edit.editType === 'added') return <span style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>No entry</span>
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Clock width={11} height={11} color="#D1D5DB" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: '#D1D5DB', fontVariantNumeric: 'tabular-nums', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
        {fmtMinsTE(edit.origStart)} – {fmtMinsTE(edit.origEnd)}
      </span>
    </div>
  )
}

function TeNewCell({ edit }: { edit: TimeEditPreview }) {
  const isAdded = edit.editType === 'added'
  const isSplit = edit.editType === 'split'
  const startChanged = !isAdded && edit.editStart !== edit.origStart
  const endChanged   = !isAdded && edit.editEnd   !== edit.origEnd
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Clock width={11} height={11} color="#6C63FF" style={{ flexShrink: 0 }} />
      {isSplit ? (
        <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMinsTE(edit.editStart)}–{fmtMinsTE(edit.editEnd)}</span>
          <span style={{ color: '#D1D5DB', margin: '0 4px' }}>·</span>
          <span style={{ color: '#6C63FF', fontWeight: 500 }}>{fmtMinsTE(edit.editEnd + 30)}–{fmtMinsTE(edit.splitEnd!)}</span>
        </span>
      ) : (
        <span style={{ fontSize: 12.5, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          <span style={{ color: startChanged || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMinsTE(edit.editStart)}</span>
          <span style={{ color: '#9CA3AF' }}> – </span>
          <span style={{ color: endChanged   || isAdded ? '#6C63FF' : '#374151', fontWeight: 500 }}>{fmtMinsTE(edit.editEnd)}</span>
        </span>
      )}
    </div>
  )
}

export function TimeEditsWidget({ empId, shiftStartUTC }: { empId: string; shiftStartUTC: number }) {
  const edits = getAllEdits(empId, shiftStartUTC)
  const thTE: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pencil width={15} height={15} color="#6B7280" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Time Edits</span>
        </div>
        <Link to={timeEditsForMember(empId)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight width={12} height={12} />
        </Link>
      </div>
      {edits.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, padding: '20px 18px' }}>No time edits on record.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: TE_COLS, columnGap: 16, padding: '9px 20px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            {['Date', 'Original time', 'New time', 'Change', 'Reason', 'Type'].map(h => (
              <div key={h} style={thTE}>{h}</div>
            ))}
          </div>
          {edits.map((edit, idx) => {
            const cfg = EDIT_TYPE_STYLE[edit.editType]
            const durationChanged = edit.delta !== 0
            const isLast = idx === edits.length - 1
            return (
              <div key={idx}
                style={{ display: 'grid', gridTemplateColumns: TE_COLS, columnGap: 16, padding: '11px 20px', borderBottom: isLast ? 'none' : '1px solid #F0F0F0', alignItems: 'center', background: '#fff', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFF'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
              >
                <div style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDateShortTE(edit.date)}</div>
                <TeOrigCell edit={edit} />
                <TeNewCell edit={edit} />
                <div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: !durationChanged ? '#9CA3AF' : edit.delta > 0 ? '#059669' : '#DC2626' }}>
                    {durationChanged ? fmtDeltaTE(edit.delta) : '—'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edit.reason}</div>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {cfg.icon}{cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── Leaves widget ─────────────────────────────────────────────────────────────

const LEAVE_TYPES = ['Paid Leave', 'Sick Leave', 'Bereavement']
const LEAVE_TOTALS = [40, 24, 16]
const LEAVE_COLORS = ['#6C63FF', '#10B981', '#F59E0B']

interface LeaveBalance { type: string; total: number; used: number; color: string }
interface PastLeave { type: string; date: string; days: number; status: 'approved' | 'pending' }

export function generateLeaves(empId: string): { balances: LeaveBalance[]; past: PastLeave[] } {
  const balances: LeaveBalance[] = LEAVE_TYPES.map((type, i) => {
    const s = _hash(`${empId}_leave_bal_${i}`)
    const usedPct = s % 70
    const used = Math.round(LEAVE_TOTALS[i] * usedPct / 100)
    return { type, total: LEAVE_TOTALS[i], used, color: LEAVE_COLORS[i] }
  })
  const past: PastLeave[] = []
  const s0 = _hash(`${empId}_past_leaves`)
  const count = 2 + (s0 % 3)
  for (let i = 0; i < count; i++) {
    const s = _hash(`${empId}_leave_past_${i}`)
    const daysAgo = 5 + (s % 90)
    const [yr, mo, dy] = TODAY_WS.split('-').map(Number)
    const base = new Date(Date.UTC(yr, mo - 1, dy))
    base.setUTCDate(base.getUTCDate() - daysAgo)
    const dateStr = base.toISOString().split('T')[0]
    const typeIdx = s % LEAVE_TYPES.length
    const days = 1 + (s % 5)
    const status: 'approved' | 'pending' = s % 7 === 0 ? 'pending' : 'approved'
    past.push({ type: LEAVE_TYPES[typeIdx], date: dateStr, days, status })
  }
  past.sort((a, b) => b.date.localeCompare(a.date))
  return { balances, past }
}

function fmtDateLeave(ds: string) {
  const [y,m,d]=ds.split('-').map(Number)
  return new Date(Date.UTC(y,m-1,d)).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})
}

export function LeavesWidget({ empId, empName }: { empId: string; empName: string }) {
  const { balances, past } = generateLeaves(empId)

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar width={15} height={15} color="#6B7280" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Leaves</span>
        </div>
        <Link to={timeOffForMember(empName)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight width={12} height={12} />
        </Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {balances.map(b => (
          <div key={b.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#374151', fontWeight: 500 }}>{b.type}</span>
              <span style={{ color: '#6B7280' }}><strong style={{ color: '#111827' }}>{b.total - b.used}h</strong> remaining of {b.total}h</span>
            </div>
            <div style={{ height: 6, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((b.used / b.total) * 100)}%`, background: b.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Recent</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {past.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: '#6B7280', flex: 1 }}>{fmtDateLeave(p.date)}</span>
              <span style={{ color: '#374151' }}>{p.type}</span>
              <span style={{ color: '#9CA3AF' }}>{p.days}d</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: p.status === 'approved' ? '#F0FDF4' : '#FFF7ED', color: p.status === 'approved' ? '#16A34A' : '#C2410C' }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Timesheet widget ──────────────────────────────────────────────────────────

const TIMESHEET_PROJECTS = ['Design System', 'Client Portal', 'Mobile App', 'API Migration', 'Internal Tools']
const TIMESHEET_TODAY = '2026-06-12'

function tsParseDate(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function tsAddDays(ds: string, n: number) { const d = tsParseDate(ds); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().split('T')[0] }
function tsFmtDate(ds: string) { const d = tsParseDate(ds); return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) }
function tsFmtHHMM(mins: number) { const h = Math.floor(mins / 60); const m = mins % 60; return `${h}:${String(m).padStart(2, '0')}` }
function tsFmtDur(mins: number) { const h = Math.floor(mins / 60); const m = mins % 60; return m === 0 ? `${h}h` : `${h}h ${m}m` }

interface TsEntry { id: string; start: number; end: number; project: string; actRate: number; manual: boolean }

function generateTsEntries(empId: string, date: string): TsEntry[] {
  const base = _hash(empId + date)
  const count = 2 + (base % 3)
  const entries: TsEntry[] = []
  let cursor = 540 + (base % 60) // start around 9am ± 60min
  for (let i = 0; i < count; i++) {
    const h = _hash(empId + date + i)
    const dur = 60 + (h % 120)
    const proj = TIMESHEET_PROJECTS[h % TIMESHEET_PROJECTS.length]
    const actRate = 55 + (h % 40)
    const manual = (h % 7) === 0
    entries.push({ id: `${date}-${i}`, start: cursor, end: cursor + dur, project: proj, actRate, manual })
    cursor += dur + 5 + (h % 20)
  }
  return entries
}

function TsDayBar({ entries, workerColor }: { entries: TsEntry[]; workerColor: string }) {
  const [hov, setHov] = React.useState<string | null>(null)
  const [tipPos, setTipPos] = React.useState({ x: 0, y: 0 })
  const hovEntry = entries.find(e => e.id === hov)
  return (
    <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center', flex: 1 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 6, background: '#EBEBEB', borderRadius: 99 }} />
      {entries.map(e => {
        const left = (e.start / 1440) * 100
        const width = Math.max(((e.end - e.start) / 1440) * 100, 0.5)
        const isHov = hov === e.id
        return (
          <div
            key={e.id}
            onMouseEnter={ev => { setHov(e.id); setTipPos({ x: ev.clientX, y: ev.clientY }) }}
            onMouseMove={ev => setTipPos({ x: ev.clientX, y: ev.clientY })}
            onMouseLeave={() => setHov(null)}
            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: isHov ? 10 : 6, left: `${left}%`, width: `${width}%`, background: e.manual ? '#60A5FA' : workerColor, borderRadius: 99, cursor: 'pointer', transition: 'height 0.1s', zIndex: isHov ? 2 : 1 }}
          />
        )
      })}
      {hovEntry && (
        <div style={{ position: 'fixed', left: tipPos.x, top: tipPos.y - 12, transform: 'translate(-50%,-100%)', background: '#1F2937', color: '#fff', borderRadius: 8, padding: '7px 11px', fontSize: 12, lineHeight: 1.6, pointerEvents: 'none', zIndex: 99999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
          <div style={{ fontWeight: 600, marginBottom: 1 }}>{hovEntry.project}</div>
          <div style={{ color: '#9CA3AF' }}>{tsFmtHHMM(hovEntry.start)} – {tsFmtHHMM(hovEntry.end)}</div>
          <div style={{ color: '#D1D5DB', fontWeight: 600 }}>{tsFmtDur(hovEntry.end - hovEntry.start)} · {hovEntry.actRate}%</div>
        </div>
      )}
    </div>
  )
}

export function TimesheetWidget({ empId, workerColor = '#6C63FF' }: { empId: string; workerColor?: string }) {
  const days: string[] = []
  for (let i = 4; i >= 0; i--) {
    const d = tsAddDays(TIMESHEET_TODAY, -i)
    const dow = tsParseDate(d).getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(d)
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock width={15} height={15} color="#6B7280" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Timesheets</span>
        </div>
        <Link to={timesheetsForWorker(empId)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight width={12} height={12} />
        </Link>
      </div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 48px 40px', gap: '0 12px', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid #F3F4F6', marginBottom: 2 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Act%</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {days.map((d, idx) => {
          const entries = generateTsEntries(empId, d)
          const totalMins = entries.reduce((s, e) => s + (e.end - e.start), 0)
          const avgAct = Math.round(entries.reduce((s, e) => s + e.actRate, 0) / entries.length)
          const isToday = d === TIMESHEET_TODAY
          return (
            <div key={d} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 48px 40px', gap: '0 12px', alignItems: 'center', padding: '9px 0', borderBottom: idx < days.length - 1 ? '1px solid #F9FAFB' : 'none', background: isToday ? '#FAFAFE' : 'transparent', borderRadius: isToday ? 6 : 0 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: isToday ? 700 : 500, color: isToday ? '#6C63FF' : '#374151' }}>{tsFmtDate(d).split(',')[0]}</div>
                <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>{tsFmtDate(d).split(', ')[1]}</div>
              </div>
              <TsDayBar entries={entries} workerColor={workerColor} />
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', textAlign: 'right' }}>{tsFmtDur(totalMins)}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: avgAct >= 70 ? '#16A34A' : avgAct >= 50 ? '#D97706' : '#DC2626', textAlign: 'right' }}>{avgAct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Schedule card ─────────────────────────────────────────────────────────────

const ORDERED_DAYS: DayOfWeek[] = [1,2,3,4,5,6,0]
const DAY_SHORT: Record<DayOfWeek, string> = { 0:'Sun',1:'Mon',2:'Tue',3:'Wed',4:'Thu',5:'Fri',6:'Sat' }
const TL_HOURS = [0,3,6,9,12,15,18,21]

type TZKey = 'EST' | 'PH' | 'LOCAL'
const TZ_OPTIONS: { key: TZKey; label: string }[] = [
  { key: 'EST',   label: 'EST (UTC−5)' },
  { key: 'PH',    label: 'PH Time (UTC+8)' },
  { key: 'LOCAL', label: 'My timezone' },
]

const SCHED_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  fixed:          { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  'free-overlap': { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  free:           { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
}

function fmtTZ(utcH: number, tz: TZKey) { return fmtUTCHour(utcH, displayOffset(tz)) }
function dispH(utcH: number, tz: TZKey) { const off = displayOffset(tz); return ((utcH + off) % 24 + 24) % 24 }
function durLabel(startUTC: number, endUTC: number): string {
  const diff = ((endUTC - startUTC) + 24) % 24
  const h = Math.floor(diff), m = Math.round((diff - h) * 60)
  return m ? `${h}h ${m}m` : `${h}h`
}
function nowUTC() { const n = new Date(); return n.getUTCHours() + n.getUTCMinutes() / 60 }

function ProfileTimelineBar({ emp, tz }: { emp: Employee; tz: TZKey }) {
  const c = SCHED_COLOR[emp.scheduleType]
  const todayDOW = new Date().getDay() as DayOfWeek
  const nowPct = (dispH(nowUTC(), tz) / 24) * 100

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', height: 40 }}>
        {TL_HOURS.map(h => (
          <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(h/24)*100}%`, width: 1, background: '#F0F0F0' }} />
        ))}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${nowPct}%`, width: 1.5, background: '#EF4444', zIndex: 3 }} />
        {emp.scheduleType === 'free' && (
          <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
            Flexible hours — no fixed schedule
          </div>
        )}
        {emp.scheduleType === 'fixed' && (() => {
          const daySched = getScheduleForDay(emp, todayDOW)
          if (!daySched) return (
            <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>Off today</div>
          )
          const s = dispH(daySched.startUTC, tz)
          const en = dispH(daySched.endUTC, tz)
          const l = (s / 24) * 100
          const w = en > s ? ((en - s) / 24) * 100 : ((24 - s + en) / 24) * 100
          return (
            <div style={{ position: 'absolute', top: 6, height: 28, left: `${l}%`, width: `${Math.min(w, 100 - l)}%`, borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', padding: '0 8px', overflow: 'hidden', zIndex: 1 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>
                {fmtTZ(daySched.startUTC, tz)} – {fmtTZ(daySched.endUTC, tz)}
              </span>
            </div>
          )
        })()}
        {emp.scheduleType === 'free-overlap' && emp.overlapBlocks.map((b, i) => {
          const s = dispH(b.startUTC, tz)
          const en = dispH(b.endUTC, tz)
          const l = (s / 24) * 100
          const w = Math.max(((en - s) / 24) * 100, 2)
          return (
            <div key={i} style={{ position: 'absolute', top: 6, height: 28, left: `${l}%`, width: `${w}%`, borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', padding: '0 6px', overflow: 'hidden', zIndex: 1 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</span>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'relative', height: 18 }}>
        {TL_HOURS.map(h => (
          <span key={h} style={{ position: 'absolute', left: `${(h/24)*100}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
            {fmtTZ(h, tz)}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProfileWeekGrid({ emp, tz }: { emp: Employee; tz: TZKey }) {
  const c = SCHED_COLOR[emp.scheduleType]
  const today = new Date().getDay() as DayOfWeek

  return (
    <div style={{ border: '1px solid #F0F0F0', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #F0F0F0' }}>
        {ORDERED_DAYS.map(d => {
          const isToday = d === today
          return (
            <div key={d} style={{ padding: '7px 4px', textAlign: 'center', background: isToday ? '#F5F3FF' : '#FAFAFA', borderBottom: `2px solid ${isToday ? '#6C63FF' : 'transparent'}`, borderRight: '1px solid #F0F0F0' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? '#6C63FF' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{DAY_SHORT[d]}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {ORDERED_DAYS.map(d => {
          const isToday = d === today
          const isWeekend = d === 0 || d === 6
          if (emp.scheduleType === 'fixed') {
            const daySched = getScheduleForDay(emp, d)
            if (!daySched) return (
              <div key={d} style={{ height: 52, background: isWeekend ? '#FAFAFA' : '#fff', borderRight: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, color: '#E5E7EB', fontStyle: 'italic' }}>Off</span>
              </div>
            )
            const dur = durLabel(daySched.startUTC, daySched.endUTC)
            return (
              <div key={d} style={{ height: 52, background: isToday ? '#FAFAFE' : isWeekend ? '#FAFAFA' : '#fff', borderRight: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: '0 4px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                  {fmtTZ(daySched.startUTC, tz)}–{fmtTZ(daySched.endUTC, tz)}
                </div>
                <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>{dur}</div>
              </div>
            )
          }
          if (emp.scheduleType === 'free-overlap') {
            return (
              <div key={d} style={{ height: 52, background: isToday ? '#FAFAFE' : isWeekend ? '#FAFAFA' : '#fff', borderRight: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px' }}>
                {emp.overlapBlocks.map((b, i) => (
                  <div key={i} style={{ fontSize: 9, fontWeight: 700, color: c.text, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.label}: {fmtTZ(b.startUTC, tz)}–{fmtTZ(b.endUTC, tz)}
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div key={d} style={{ height: 52, background: isToday ? '#FAFAFE' : isWeekend ? '#FAFAFA' : '#fff', borderRight: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, color: '#C4C9D4', fontStyle: 'italic' }}>flex</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ScheduleCard({ emp }: { emp: Employee }) {
  const [tz, setTz] = useState<TZKey>('EST')
  const c = SCHED_COLOR[emp.scheduleType]
  const schedLabel = SCHEDULE_TYPE_LABELS[emp.scheduleType]

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</div>
        <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
          {schedLabel}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <select
            value={tz}
            onChange={e => setTz(e.target.value as TZKey)}
            style={{ height: 30, padding: '0 10px', border: '1px solid #E8E8E8', borderRadius: 7, fontSize: 12, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
          >
            {TZ_OPTIONS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Today</div>
        <ProfileTimelineBar emp={emp} tz={tz} />
      </div>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>This Week</div>
        <ProfileWeekGrid emp={emp} tz={tz} />
      </div>
    </div>
  )
}
