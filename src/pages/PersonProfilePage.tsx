import React, { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Globe, Calendar, Monitor,
  DollarSign, Clock, AlertTriangle, Check, Pencil, X, Plus, Trash2,
  Camera, ArrowRight, Keyboard, MousePointer2, Briefcase,
  Edit2, Scissors, PlusCircle, PenLine, ChevronDown, ChevronUp,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import {
  EMPLOYEE_MAP, SCHEDULE_TYPE_LABELS,
  getWorkDayList, getScheduleForDay, fmtUTCHour, displayOffset,
  type DayOfWeek, type Employee,
} from '../data/employeesData'
import { CLIENT_MAP, CLIENTS } from '../data/clientsData'
import { PROJECTS } from '../data/projectsData'
import { PROFILE_MAP, type PaymentRecord } from '../data/profileData'
import { ROUTES, activityForWorker, workSessionsForMember, timeEditsForMember, timeOffForMember } from '../lib/routes'
import { avatarStyle } from '../utils/avatar'

// ── Screenshots widget helpers ────────────────────────────────────────────────

function _hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function MiniScreenshot({ seed, width = 300, height = 168 }: { seed: number; width?: number; height?: number }) {
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

// Activity bar — identical to ActivityPage
function ActivityBar({ rate }: { rate: number }) {
  const color = rate >= 70 ? '#10B981' : rate >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${rate}%`, background: color, borderRadius: 99 }} />
    </div>
  )
}

interface ScreenCard {
  seed: number
  slotStart: string   // "09:00"
  slotEnd: string     // "09:10"
  project: string
  activityRate: number
  keystrokes: number
  mouseClicks: number
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h < 12 ? 'am' : 'pm'}`
}

function TodaysScreenshotsWidget({ workerName, workerId, projects, workerColor }: {
  workerName: string
  workerId: string
  projects: string[]
  workerColor: string
}) {
  const today = new Date().toISOString().split('T')[0]

  // Generate 8 fake 10-min slots across the day
  const SLOTS = [
    ['09:00','09:10'], ['09:30','09:40'], ['10:00','10:10'], ['10:40','10:50'],
    ['11:10','11:20'], ['13:00','13:10'], ['14:20','14:30'], ['15:00','15:10'],
  ]

  const cards: ScreenCard[] = SLOTS.map(([start, end]) => {
    const seed = _hash(`${workerId}_${today}_${start}`)
    const projectList = projects.length > 0 ? projects : ['General']
    return {
      seed,
      slotStart: start,
      slotEnd: end,
      project: projectList[Math.floor(seed / 100) % projectList.length],
      activityRate: 45 + (seed % 50),
      keystrokes: 100 + (seed % 900),
      mouseClicks: 10 + (seed % 80),
    }
  })

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', height: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera width={14} height={14} color="#6C63FF" />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Screenshots</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', borderRadius: 99, padding: '1px 8px' }}>{cards.length}</span>
        </div>
        <Link
          to={activityForWorker(workerName)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12.5, fontWeight: 600, color: '#6C63FF', textDecoration: 'none',
            padding: '5px 12px', borderRadius: 7,
            border: '1px solid #C7C3FF', background: '#F5F3FF',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EDE9FE' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F5F3FF' }}
        >
          View full activity <ArrowRight width={13} height={13} />
        </Link>
      </div>

      {/* 4-col grid with compact cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {cards.map((card, i) => {
          const actColor = card.activityRate >= 70 ? '#10B981' : card.activityRate >= 40 ? '#F59E0B' : '#EF4444'
          return (
            <Link
              key={i}
              to={activityForWorker(workerName)}
              style={{
                textDecoration: 'none', display: 'block', borderRadius: 8, overflow: 'hidden',
                border: '1px solid #E8E8E8', background: '#fff',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#C7C3FF'; el.style.boxShadow = '0 3px 10px rgba(108,99,255,0.10)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E8E8E8'; el.style.boxShadow = 'none' }}
            >
              {/* Screenshot — true 16:9 ratio */}
              <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                <MiniScreenshot seed={card.seed} />
              </div>

              {/* Info */}
              <div style={{ padding: '7px 10px 8px', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: workerColor,
                    background: `${workerColor}18`, padding: '1px 6px', borderRadius: 99,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%',
                  }}>{card.project}</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{fmt12(card.slotStart)}</span>
                </div>
                <ActivityBar rate={card.activityRate} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#9CA3AF' }}>
                    <Keyboard width={9} height={9} />{card.keystrokes}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#9CA3AF' }}>
                    <MousePointer2 width={9} height={9} />{card.mouseClicks}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: actColor }}>{card.activityRate}%</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ── Work Sessions widget ──────────────────────────────────────────────────────

const TODAY_WS = '2026-06-12'
const TASK_NAMES_WS = [
  'Code review', 'UI implementation', 'Bug fix', 'Documentation',
  'Testing', 'Deploy prep', 'Client call', 'Design review', 'Data migration', '',
]

function parseDateWS(s: string) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
function addDaysWS(ds: string, n: number) { const d = parseDateWS(ds); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().split('T')[0] }
function fmtDurMins(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  if (mins === 0) return '—'
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
}
function fmtTimeHHMM(hhmm: string) {
  const [hh, mm] = hhmm.split(':').map(Number)
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`
}

interface WorkSessionPreview { startTime: string; endTime: string; project: string; task: string | null; durationMins: number; activityPct: number; manual: boolean }

function generateSessionsPreview(empId: string, date: string, projects: string[]): WorkSessionPreview[] {
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
      project: proj,
      task,
      startTime: `${String(curHour).padStart(2,'0')}:${String(curMin).padStart(2,'0')}`,
      endTime: `${String(Math.floor(endTotal/60)).padStart(2,'0')}:${String(endTotal%60).padStart(2,'0')}`,
      durationMins: dur,
      activityPct: act,
      manual,
    })
    const gap = TASK_NAMES_WS.length > 0 ? 5 + (s % 20) : 10
    curHour = Math.floor(endTotal / 60)
    curMin = endTotal % 60 + gap
    if (curMin >= 60) { curHour += Math.floor(curMin / 60); curMin = curMin % 60 }
  }
  return sessions
}

function WsActivityBar({ pct, manual }: { pct: number; manual: boolean }) {
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

function WorkSessionsWidget({ empId, projects }: { empId: string; projects: string[] }) {
  const [collapsed, setCollapsed] = React.useState(false)

  const todaySessions = generateSessionsPreview(empId, TODAY_WS, projects)
  const prevDate = addDaysWS(TODAY_WS, -1)
  const prevSessions = generateSessionsPreview(empId, prevDate, projects)

  // Show up to last 2 days that have sessions
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
      {/* Header */}
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
          {/* Table header */}
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
                {/* Day group header */}
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

                {/* Session rows */}
                {!collapsed && sessions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F3F4F6', background: '#fff' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFAFA'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                  >
                    {/* Project + Task */}
                    <div style={{ flex: 1, padding: '9px 12px', borderRight: '1px solid #F3F4F6', minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.project}</div>
                      {s.task && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.task}</div>}
                    </div>
                    {/* Manual */}
                    <div style={{ width: 50, padding: '9px 12px', borderRight: '1px solid #F3F4F6', display: 'flex', justifyContent: 'center' }}>
                      {s.manual ? <PenLine width={13} height={13} color="#F59E0B" /> : <span style={{ fontSize: 13, color: '#D1D5DB' }}>—</span>}
                    </div>
                    {/* Start */}
                    <div style={{ width: 88, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtTimeHHMM(s.startTime)}</span>
                    </div>
                    {/* Stop */}
                    <div style={{ width: 88, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtTimeHHMM(s.endTime)}</span>
                    </div>
                    {/* Duration */}
                    <div style={{ width: 70, padding: '9px 12px', borderRight: '1px solid #F3F4F6' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{fmtDurMins(s.durationMins)}</span>
                    </div>
                    {/* Activity */}
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

function getAllEdits(empId: string, shiftStartUTC: number): TimeEditPreview[] {
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

// Cols: date | original | new time | change | reason | type
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

function TimeEditsWidget({ empId, shiftStartUTC }: { empId: string; shiftStartUTC: number }) {
  const edits = getAllEdits(empId, shiftStartUTC)

  const thTE: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
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
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: TE_COLS, columnGap: 16, padding: '9px 20px', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
            {['Date', 'Original time', 'New time', 'Change', 'Reason', 'Type'].map(h => (
              <div key={h} style={thTE}>{h}</div>
            ))}
          </div>

          {/* Rows */}
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
                {/* Date */}
                <div style={{ fontSize: 12.5, color: '#6B7280', whiteSpace: 'nowrap' }}>{fmtDateShortTE(edit.date)}</div>
                {/* Original */}
                <TeOrigCell edit={edit} />
                {/* New time */}
                <TeNewCell edit={edit} />
                {/* Change */}
                <div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: !durationChanged ? '#9CA3AF' : edit.delta > 0 ? '#059669' : '#DC2626' }}>
                    {durationChanged ? fmtDeltaTE(edit.delta) : '—'}
                  </span>
                </div>
                {/* Reason */}
                <div style={{ fontSize: 12.5, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{edit.reason}</div>
                {/* Type badge */}
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

function generateLeaves(empId: string): { balances: LeaveBalance[]; past: PastLeave[] } {
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

function LeavesWidget({ empId, empName }: { empId: string; empName: string }) {
  const { balances, past } = generateLeaves(empId)

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxSizing: 'border-box', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar width={15} height={15} color="#6B7280" />
          <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Leaves</span>
        </div>
        <Link to={timeOffForMember(empName)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C63FF', textDecoration: 'none', fontWeight: 500 }}>
          View all <ArrowRight width={12} height={12} />
        </Link>
      </div>

      {/* Balances */}
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

      {/* Recent past leaves */}
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

const PROJECT_ID_BY_NAME     = Object.fromEntries(PROJECTS.map(p => [p.name, p.id]))
const PROJECT_CLIENT_BY_NAME = Object.fromEntries(PROJECTS.map(p => [p.name, p.client]))
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

// ── Project edit panel ────────────────────────────────────────────────────────

function ProjectEditPanel({ assigned, onAdd, onRemove }: {
  assigned: string[]
  onAdd: (p: string) => void
  onRemove: (p: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [confirmRemove, setConfirmRemove] = React.useState<string | null>(null)
  const available = ALL_PROJECT_NAMES.filter(p => !assigned.includes(p) && p.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Remove confirmation modal */}
      {confirmRemove && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setConfirmRemove(null)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px 28px', width: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Remove from project?</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              This person will be removed from <strong style={{ color: '#111827' }}>{confirmRemove}</strong>. You can add them back at any time.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmRemove(null)}
                style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onRemove(confirmRemove); setConfirmRemove(null) }}
                style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned list */}
      {assigned.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {assigned.map(p => {
            const client = PROJECT_CLIENT_BY_NAME[p]
            return (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid #C4B5FD', background: '#F5F3FF' }}>
                <span style={{ flex: 1, fontSize: 13, color: '#5B21B6', fontWeight: 600 }}>{p}</span>
                {client && <span style={{ fontSize: 11, color: '#A78BFA' }}>{client}</span>}
                <button onClick={() => setConfirmRemove(p)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#A78BFA', padding: 2, borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#DC2626'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#A78BFA'}
                >
                  <X width={14} height={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add CTA + dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setOpen(o => !o); setSearch('') }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px dashed #C4B5FD', borderRadius: 8, background: open ? '#F5F3FF' : '#fff', cursor: 'pointer', fontSize: 13, color: '#6C63FF', fontWeight: 500, fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F3FF'}
          onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = '#fff' }}
        >
          <Plus width={14} height={14} /> Add to project
        </button>

        {open && (
          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 280, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #F3F4F6' }}>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: 7, padding: '6px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {available.length === 0
                ? <div style={{ padding: '14px 14px', fontSize: 13, color: '#9CA3AF' }}>No projects available</div>
                : available.map(p => {
                    const client = PROJECT_CLIENT_BY_NAME[p]
                    return (
                      <button key={p} onClick={() => { onAdd(p); setOpen(false); setSearch('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F5F3FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{p}</div>
                          {client && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{client}</div>}
                        </div>
                        <Plus width={13} height={13} color="#9CA3AF" />
                      </button>
                    )
                  })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
  fontFamily: 'inherit', fontSize: 13, color: '#111827',
  border: '1px solid #E8E8E8', borderRadius: 8, padding: '8px 10px',
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
  paid:    { bg: '#DCFCE7', color: '#15803D', label: 'Paid' },
  pending: { bg: '#FEF3C7', color: '#92400E', label: 'Pending' },
  failed:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Failed' },
}

function PayBadge({ status }: { status: PaymentRecord['status'] }) {
  const s = PAY_STATUS[status]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
      {status === 'paid' && <Check width={10} height={10} strokeWidth={3} />}
      {s.label}
    </span>
  )
}

// ── Schedule visualization ────────────────────────────────────────────────────

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

function fmtTZ(utcH: number, tz: TZKey) {
  return fmtUTCHour(utcH, displayOffset(tz))
}

function dispH(utcH: number, tz: TZKey) {
  const off = displayOffset(tz)
  return ((utcH + off) % 24 + 24) % 24
}

function durLabel(startUTC: number, endUTC: number): string {
  const diff = ((endUTC - startUTC) + 24) % 24
  const h = Math.floor(diff), m = Math.round((diff - h) * 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

function nowUTC() {
  const n = new Date()
  return n.getUTCHours() + n.getUTCMinutes() / 60
}

// 24h timeline bar — mimics TimelineBar from SchedulesPage
function ProfileTimelineBar({ emp, tz }: { emp: Employee; tz: TZKey }) {
  const c = SCHED_COLOR[emp.scheduleType]
  const todayDOW = new Date().getDay() as DayOfWeek
  const nowPct = (dispH(nowUTC(), tz) / 24) * 100

  return (
    <div style={{ position: 'relative' }}>
      {/* Hour grid lines */}
      <div style={{ position: 'relative', height: 40 }}>
        {TL_HOURS.map(h => (
          <div key={h} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(h/24)*100}%`, width: 1, background: '#F0F0F0' }} />
        ))}
        {/* Now line */}
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

      {/* Hour labels */}
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

// Week grid — 7 columns per day, mimics WeekView from SchedulesPage
function ProfileWeekGrid({ emp, tz }: { emp: Employee; tz: TZKey }) {
  const c = SCHED_COLOR[emp.scheduleType]
  const today = new Date().getDay() as DayOfWeek

  return (
    <div style={{ border: '1px solid #F0F0F0', borderRadius: 8, overflow: 'hidden' }}>
      {/* Day headers */}
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

      {/* Schedule cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {ORDERED_DAYS.map(d => {
          const isToday = d === today
          const isWeekend = d === 0 || d === 6

          if (emp.scheduleType === 'fixed') {
            const daySched = getScheduleForDay(emp, d)
            if (!daySched) {
              return (
                <div key={d} style={{ height: 52, background: isWeekend ? '#FAFAFA' : '#fff', borderRight: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: '#E5E7EB', fontStyle: 'italic' }}>Off</span>
                </div>
              )
            }
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

          // free
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

function ScheduleCard({ emp }: { emp: Employee }) {
  const [tz, setTz] = useState<TZKey>('EST')
  const c = SCHED_COLOR[emp.scheduleType]
  const schedLabel = SCHEDULE_TYPE_LABELS[emp.scheduleType]

  return (
    <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
      {/* Header row */}
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

      {/* Today's timeline */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Today</div>
        <ProfileTimelineBar emp={emp} tz={tz} />
      </div>

      {/* Week grid */}
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>This Week</div>
        <ProfileWeekGrid emp={emp} tz={tz} />
      </div>
    </div>
  )
}

const SCHED_BADGE: Record<string, { bg: string; color: string }> = {
  fixed:          { bg: '#EFF6FF', color: '#1D4ED8' },
  free:           { bg: '#F0FDF4', color: '#15803D' },
  'free-overlap': { bg: '#FEF3C7', color: '#92400E' },
}

// ── Tab definitions ───────────────────────────────────────────────────────────

type TabId = 'info' | 'activity' | 'payments' | 'worktime' | 'client'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'activity', label: 'Activity',           icon: <Camera width={14} height={14} /> },
  { id: 'worktime', label: 'Work Time & Limits', icon: <Clock width={14} height={14} /> },
  { id: 'payments', label: 'Payments',           icon: <DollarSign width={14} height={14} /> },
  { id: 'client',   label: 'Client & Projects',  icon: <Briefcase width={14} height={14} /> },
  { id: 'info',     label: 'Info',               icon: <Monitor width={14} height={14} /> },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export function PersonProfilePage() {
  const { workerId } = useParams<{ workerId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('activity')
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
    active:     { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
    inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
    onboarding: { bg: '#FEF3C7', color: '#92400E', dot: '#CA8A04' },
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
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
  }
  const btnSecondary: React.CSSProperties = {
    ...btnBase, padding: '8px 14px', fontWeight: 500,
    background: '#fff', border: '1px solid #D1D5DB', color: '#374151',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar crumbs={[{ label: 'People', path: ROUTES.people }, { label: emp.name }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#F7F8FA' }}>

        {/* Back */}
        <button
          onClick={() => navigate(ROUTES.people)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontFamily: 'inherit', marginBottom: 20, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = '#111827' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280' }}
        >
          <ArrowLeft width={14} height={14} /> Back to People
        </button>

        {/* ── Hero card ── */}
        <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '24px 28px', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Avatar — larger */}
          <Avatar initials={emp.initials} bg={avatarStyle(emp.name).bg} fg={avatarStyle(emp.name).color} size={64} />

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>{emp.name}</h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: sc.bg, color: sc.color }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />
                {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
              </span>
            </div>

            {/* Role */}
            <div style={{ fontSize: 13.5, color: '#6B7280', fontWeight: 500, marginBottom: 14 }}>{emp.role}</div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F3F4F6', marginBottom: 14 }} />

            {/* Tags row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {client && (
                <a href={`${ROUTES.people}?client=${encodeURIComponent(client.name)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#374151', textDecoration: 'none', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#F3F4F6' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: client.color, flexShrink: 0 }} />
                  {client.name}
                </a>
              )}
              <span style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                {empTypeLabel[emp.employmentType as EmpType]}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: emp.payType === 'hourly' ? '#F0FDF4' : '#FFF1F2', color: emp.payType === 'hourly' ? '#15803D' : '#BE185D', border: `1px solid ${emp.payType === 'hourly' ? '#BBF7D0' : '#FECDD3'}` }}>
                {emp.payType === 'hourly' ? 'Hourly' : 'Monthly salary'}
              </span>
            </div>
          </div>

          {/* Key meta — pill grid */}
          <div style={{ borderLeft: '1px solid #F3F4F6', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {[
              { icon: <MapPin   width={12} height={12} />, label: 'Location',  val: profile.location },
              { icon: <Mail     width={12} height={12} />, label: 'Email',     val: emp.email,         href: `mailto:${emp.email}` },
              { icon: <Globe    width={12} height={12} />, label: 'Timezone',  val: fmtTz(emp.homeTimezone) },
              { icon: <Phone    width={12} height={12} />, label: 'Phone',     val: profile.phones.work },
              { icon: <Calendar width={12} height={12} />, label: 'Joined',    val: fmtDate(emp.dateJoined) },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 10px', borderRadius: 8,
                background: '#F9FAFB', border: '1px solid #F0F0F0',
              }}>
                <span style={{ color: '#9CA3AF', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap', minWidth: 50 }}>{item.label}</span>
                <span style={{ width: 1, height: 12, background: '#E5E7EB', flexShrink: 0 }} />
                {item.href
                  ? <a href={item.href} style={{ fontSize: 12.5, fontWeight: 500, color: '#374151', textDecoration: 'none', whiteSpace: 'nowrap' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#374151' }}
                    >{item.val}</a>
                  : <span style={{ fontSize: 12.5, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap' }}>{item.val}</span>
                }
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab bar + edit controls ── */}
        <div style={{ background: '#fff', borderLeft: '1px solid #E8E8E8', borderRight: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', borderRadius: '0 0 10px 10px', marginBottom: 20, display: 'flex', alignItems: 'center' }}>
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
                <button onClick={handleCancel} style={btnSecondary}>
                  <X width={13} height={13} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={btnSecondary}
                onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
              >
                <Pencil width={13} height={13} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* ── Tab: Info ── */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

            {/* Contact */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Contact & Identity</div>

              <InfoRow label="Personal Phone">
                {isEditing
                  ? <input value={draft.personalPhone} onChange={e => set('personalPhone', e.target.value)} style={inputStyle} />
                  : saved.personalPhone}
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

              {isEditing && <>
                <InfoRow label="Email">
                  <input value={draft.email} onChange={e => set('email', e.target.value)} style={inputStyle} type="email" />
                </InfoRow>
                <InfoRow label="Work Phone">
                  <input value={draft.workPhone} onChange={e => set('workPhone', e.target.value)} style={inputStyle} />
                </InfoRow>
                <InfoRow label="Location">
                  <input value={draft.location} onChange={e => set('location', e.target.value)} style={inputStyle} />
                </InfoRow>
                <InfoRow label="Timezone">
                  <input value={draft.homeTimezone} onChange={e => set('homeTimezone', e.target.value)} style={inputStyle} placeholder="e.g. America/New_York" />
                </InfoRow>
                <InfoRow label="Date Joined">
                  <input value={draft.dateJoined} onChange={e => set('dateJoined', e.target.value)} style={inputStyle} type="date" />
                </InfoRow>
              </>}
            </div>

            <LeavesWidget empId={workerId!} empName={emp.name} />

            {/* Security & Access */}
            {(() => {
              const s = _hash(`${workerId}_security`)
              const twoFAEnabled   = s % 3 !== 0
              const twoFARequired  = s % 5 !== 0
              const sessionTimeout = [15, 30, 60, 120, 240][s % 5]
              const loginMethods   = ['Email + Password', ...(s % 4 !== 0 ? ['Google SSO'] : []), ...(s % 7 === 0 ? ['Microsoft SSO'] : [])]
              const daysAgo        = 1 + (s % 14)
              const [lyr, lmo, ldy] = TODAY_WS.split('-').map(Number)
              const lastLoginDate   = new Date(Date.UTC(lyr, lmo - 1, ldy))
              lastLoginDate.setUTCDate(lastLoginDate.getUTCDate() - daysAgo)
              const lastLogin = lastLoginDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
              const failedAttempts = s % 10 === 0 ? 2 + (s % 3) : 0

              const StatusPill = ({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: on ? '#F0FDF4' : '#F3F4F6', color: on ? '#15803D' : '#9CA3AF' }}>
                  {on ? <Check width={10} height={10} strokeWidth={2.5} /> : null}
                  {on ? onLabel : offLabel}
                </span>
              )

              return (
                <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Security & Access</div>

                  <InfoRow label="2FA Required">
                    {isEditing
                      ? <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked={twoFARequired} style={{ accentColor: '#6C63FF', width: 15, height: 15 }} />
                          <span style={{ fontSize: 13, color: '#374151' }}>Required for this account</span>
                        </label>
                      : <StatusPill on={twoFARequired} onLabel="Required" offLabel="Not required" />}
                  </InfoRow>

                  <InfoRow label="2FA Status">
                    <StatusPill on={twoFAEnabled} onLabel="Enabled" offLabel="Not set up" />
                  </InfoRow>

                  <InfoRow label="Login Methods">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {loginMethods.map(m => (
                        <span key={m} style={{ fontSize: 12, fontWeight: 500, padding: '2px 9px', borderRadius: 6, background: '#F3F4F6', color: '#374151' }}>{m}</span>
                      ))}
                    </div>
                  </InfoRow>

                  <InfoRow label="Session Timeout">
                    {isEditing
                      ? <select defaultValue={sessionTimeout} style={{ ...selectStyle, width: 160 }}>
                          {[15, 30, 60, 120, 240].map(m => <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h`}</option>)}
                        </select>
                      : <span style={{ fontSize: 13, color: '#374151' }}>{sessionTimeout < 60 ? `${sessionTimeout} min` : `${sessionTimeout / 60}h`}</span>}
                  </InfoRow>

                  <InfoRow label="Last Login">
                    <span style={{ fontSize: 13, color: '#374151' }}>{lastLogin}</span>
                  </InfoRow>

                  {failedAttempts > 0 && (
                    <InfoRow label="Failed Logins">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: '#DC2626' }}>
                        <AlertTriangle width={13} height={13} />
                        {failedAttempts} failed attempt{failedAttempts !== 1 ? 's' : ''} recently
                      </span>
                    </InfoRow>
                  )}
                </div>
              )
            })()}

          </div>
        )}

        {/* ── Tab: Client & Projects ── */}
        {activeTab === 'client' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

            {/* Clients widget */}
            {(() => {
              const clientNames = [...new Set(
                saved.projects.map(p => PROJECT_CLIENT_BY_NAME[p]).filter(Boolean)
              )]
              const clientObjs = clientNames
                .map(name => CLIENTS.find(c => c.name === name || c.shortName === name))
                .filter(Boolean) as typeof CLIENTS

              if (clientObjs.length === 0) return null

              const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
                active:     { bg: '#DCFCE7', color: '#16A34A', dot: '#16A34A' },
                inactive:   { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
                onboarding: { bg: '#FEF9C3', color: '#A16207', dot: '#CA8A04' },
              }

              return (
                <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                    Clients
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {clientObjs.map(c => {
                      const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.inactive
                      const clientProjects = saved.projects.filter(p =>
                        PROJECT_CLIENT_BY_NAME[p] === c.name || PROJECT_CLIENT_BY_NAME[p] === c.shortName
                      )
                      const s2 = _hash(`${workerId}_${c.id}_joined`)
                      const daysBack = 180 + (s2 % 900)
                      const [jyr, jmo, jdy] = TODAY_WS.split('-').map(Number)
                      const addedDate = new Date(Date.UTC(jyr, jmo - 1, jdy))
                      addedDate.setUTCDate(addedDate.getUTCDate() - daysBack)
                      const addedLabel = addedDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })

                      const totalMins = 60 + (s2 % 18000)
                      const totalH = Math.floor(totalMins / 60), totalM = totalMins % 60
                      const totalLabel = totalH > 0 ? `${totalH}h${totalM > 0 ? ` ${totalM}m` : ''}` : `${totalM}m`

                      const industry = c.industry !== '—' ? c.industry : null

                      return (
                        <div key={c.id} style={{ padding: '14px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.color + '22', border: `1.5px solid ${c.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ width: 11, height: 11, borderRadius: '50%', background: c.color }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Link
                                  to={`${ROUTES.clients}/${c.id}`}
                                  style={{ fontSize: 13.5, fontWeight: 700, color: '#111827', textDecoration: 'none' }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6C63FF' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#111827' }}
                                >
                                  {c.name}
                                </Link>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot }} />
                                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                </span>
                                {industry && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{industry}</span>}
                              </div>
                            </div>
                            <Link
                              to={`${ROUTES.clients}/${c.id}`}
                              style={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', textDecoration: 'none', flexShrink: 0 }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#6C63FF' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                            >
                              <ArrowRight width={15} height={15} />
                            </Link>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid #EBEBEB' }}>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Projects</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{clientProjects.length}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Added</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{addedLabel}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginBottom: 2 }}>Total time</div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{totalLabel}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Projects</div>

              {isEditing ? (
                <ProjectEditPanel
                  assigned={draft.projects}
                  onAdd={p => set('projects', [...draft.projects, p])}
                  onRemove={p => set('projects', draft.projects.filter(x => x !== p))}
                />
              ) : saved.projects.length === 0
                ? <span style={{ fontSize: 13, color: '#9CA3AF' }}>No projects assigned.</span>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {saved.projects.map(p => {
                      const pid    = PROJECT_ID_BY_NAME[p]
                      const client = PROJECT_CLIENT_BY_NAME[p] ?? CLIENT_MAP[emp.clientId]?.name ?? null

                      const weekDates: string[] = []
                      for (let i = 0; i < 7; i++) {
                        const [yr, mo, dy] = TODAY_WS.split('-').map(Number)
                        const d = new Date(Date.UTC(yr, mo - 1, dy))
                        d.setUTCDate(d.getUTCDate() - i)
                        weekDates.push(d.toISOString().split('T')[0])
                      }
                      const allSessions = weekDates.flatMap(date =>
                        generateSessionsPreview(workerId!, date, saved.projects).filter(s => s.project === p)
                      )
                      const weekMins = allSessions.reduce((a, s) => a + s.durationMins, 0)
                      const weekH = Math.floor(weekMins / 60), weekM = weekMins % 60
                      const weekLabel = weekMins === 0 ? 'No time this week'
                        : weekH > 0 ? `${weekH}h${weekM > 0 ? ` ${weekM}m` : ''} this week`
                        : `${weekM}m this week`
                      const barPct = Math.min(100, Math.round(weekMins / (40 * 60) * 100))

                      const taskMap = new Map<string, number>()
                      for (const s of allSessions) {
                        const key = s.task || '(no task)'
                        taskMap.set(key, (taskMap.get(key) ?? 0) + s.durationMins)
                      }
                      const tasks = Array.from(taskMap.entries()).sort((a, b) => b[1] - a[1])

                      return (
                        <div key={p} style={{ background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              {pid
                                ? <Link to={`${ROUTES.projects}/${pid}`} style={{ fontSize: 13, color: '#6C63FF', fontWeight: 600, textDecoration: 'none' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
                                  >{p}</Link>
                                : <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{p}</span>}
                              {client && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{client}</span>}
                            </div>
                            {weekMins > 0
                              ? <Link to={pid ? `${ROUTES.projects}/${pid}` : workSessionsForMember(workerId!)} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: '#6C63FF', fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0 }}>
                                  {weekLabel} <ArrowRight width={11} height={11} />
                                </Link>
                              : <span style={{ fontSize: 11.5, color: '#9CA3AF', whiteSpace: 'nowrap', flexShrink: 0 }}>{weekLabel}</span>
                            }
                          </div>

                          {weekMins > 0 && (
                            <div style={{ height: 4, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barPct}%`, background: '#6C63FF', borderRadius: 99, opacity: 0.7 }} />
                            </div>
                          )}

                          {tasks.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4, borderTop: '1px solid #EBEBEB' }}>
                              {tasks.map(([task, mins]) => {
                                const h = Math.floor(mins / 60), m = mins % 60
                                const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
                                const pct = weekMins > 0 ? Math.round(mins / weekMins * 100) : 0
                                return (
                                  <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ flex: 1, fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task}</span>
                                    <span style={{ fontSize: 11.5, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>{dur}</span>
                                    <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── Tab: Activity ── */}
        {activeTab === 'activity' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <TodaysScreenshotsWidget workerName={emp.name} workerId={workerId!} projects={emp.projects ?? []} workerColor={emp.fg ?? '#6C63FF'} />
            <WorkSessionsWidget empId={workerId!} projects={emp.projects ?? []} />
          </div>
        )}

        {/* ── Tab: Payments ── */}
        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Rate cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Bill Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.billRate} onChange={e => set('billRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>/hr</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.billRate === 0 ? '—' : `$${saved.billRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>charged to client</div>
              </div>

              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Pay Rate</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 18, color: '#374151' }}>$</span>
                      <input type="number" min={0} value={draft.payRate} onChange={e => set('payRate', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ fontSize: 14, color: '#9CA3AF' }}>{saved.payType === 'monthly' ? '/mo' : '/hr'}</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.payRate === 0 ? '—' : saved.payType === 'monthly' ? `$${saved.payRate.toLocaleString()}/mo` : `$${saved.payRate}/hr`}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{saved.payType === 'monthly' ? 'monthly salary' : 'per hour worked'}</div>
              </div>

              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Pay Type</div>
                {isEditing
                  ? <select value={draft.payType} onChange={e => set('payType', e.target.value as PayType)} style={{ ...selectStyle, fontSize: 16, fontWeight: 700 }}>
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.payType === 'hourly' ? 'Hourly' : 'Monthly'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{empTypeLabel[saved.employmentType]}</div>
              </div>
            </div>

            {/* Payment history */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment History</div>
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
                          <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? draft : saved).paymentHistory.map((rec, i) => (
                        <tr key={rec.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #F3F4F6' }}
                          onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = '#FAFAFA' }}
                          onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                        >
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input type="date" value={rec.date} onChange={e => updatePayRec(i, 'date', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{fmtDate(rec.date)}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input value={rec.period} onChange={e => updatePayRec(i, 'period', e.target.value)} style={{ ...inputStyle, width: 130 }} placeholder="e.g. Jun 2025" />
                              : <span style={{ fontSize: 13, color: '#374151' }}>{rec.period}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ color: '#374151' }}>$</span>
                                  <input type="number" min={0} value={rec.amount} onChange={e => updatePayRec(i, 'amount', parseFloat(e.target.value) || 0)} style={{ ...numInputStyle }} />
                                </div>
                              : <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>${rec.amount.toLocaleString()}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <input value={rec.method} onChange={e => updatePayRec(i, 'method', e.target.value)} style={{ ...inputStyle, width: 140 }} />
                              : <span style={{ fontSize: 13, color: '#6B7280' }}>{rec.method}</span>}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isEditing
                              ? <select value={rec.status} onChange={e => updatePayRec(i, 'status', e.target.value as PaymentRecord['status'])} style={{ ...selectStyle, width: 110 }}>
                                  <option value="paid">Paid</option>
                                  <option value="pending">Pending</option>
                                  <option value="failed">Failed</option>
                                </select>
                              : <PayBadge status={rec.status} />}
                          </td>
                          {isEditing && (
                            <td style={{ padding: '12px 14px' }}>
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
          <div style={{ display: 'grid', gap: 16 }}>

            {/* 1. Limit cards — top */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Max Hours / Day</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.maxHoursPerDay ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerDay', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.maxHoursPerDay != null ? `${saved.maxHoursPerDay}h` : 'No limit'}</div>}
              </div>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Max Hours / Week</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={168} value={draft.maxHoursPerWeek ?? ''} placeholder="No limit" onChange={e => set('maxHoursPerWeek', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.maxHoursPerWeek != null ? `${saved.maxHoursPerWeek}h` : 'No limit'}</div>}
              </div>
              <div style={{ padding: '20px 24px', background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Break Required</div>
                {isEditing
                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="number" min={1} max={24} value={draft.breakRequiredAfterH ?? ''} placeholder="None" onChange={e => set('breakRequiredAfterH', e.target.value ? parseInt(e.target.value) : null)} style={{ ...numInputStyle, fontSize: 18, fontWeight: 800 }} />
                      <span style={{ color: '#9CA3AF' }}>h</span>
                    </div>
                  : <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{saved.breakRequiredAfterH != null ? `${saved.breakRequiredAfterH}h` : 'None'}</div>}
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                  {saved.breakRequiredAfterH != null ? 'continuous work limit' : 'no mandatory break'}
                </div>
              </div>
            </div>

            {/* 2. Schedule Rules (1) + Schedule widget (2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'stretch' }}>
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Schedule Rules</div>
                <InfoRow label="Allowed Days">
                  {isEditing
                    ? <input value={draft.allowedDaysNote} onChange={e => set('allowedDaysNote', e.target.value)} style={inputStyle} placeholder="e.g. Mon–Fri" />
                    : saved.allowedDaysNote || '—'}
                </InfoRow>
                <InfoRow label="Schedule Type">
                  <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: schedBadge.bg, color: schedBadge.color }}>
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
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: saved.timeTrackingEnabled ? '#F0FDF4' : '#F3F4F6', color: saved.timeTrackingEnabled ? '#15803D' : '#9CA3AF' }}>
                        {saved.timeTrackingEnabled ? <Check width={11} height={11} strokeWidth={2.5} /> : null}
                        {saved.timeTrackingEnabled ? 'Enabled' : 'Disabled'}
                      </span>}
                </InfoRow>
              </div>
              <ScheduleCard emp={emp} />
            </div>

            {/* 3. Notes & Restrictions (1) + Time Edits (2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'stretch' }}>
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '20px 24px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Notes & Restrictions</div>
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
              <TimeEditsWidget empId={workerId!} shiftStartUTC={emp.shiftStartUTC ?? 9} />
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
