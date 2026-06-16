import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { peopleProfile, clientPage, ROUTES } from '../lib/routes'
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Scissors,
  AlertTriangle, ChevronDown, Download, CalendarDays,
  Settings, User, Users, Trash2, DollarSign, PenLine,
  SlidersHorizontal, ExternalLink,
} from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { avatarStyle, initials } from '../utils/avatar'

// ─────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────

type EntryType = 'normal' | 'idle'

interface EditLogItem {
  id: string; editor: string; timestamp: string
  fromStart: string; fromEnd: string; toStart: string; toEnd: string; reason: string
}

interface TimeEntry {
  id: string; workerId: string; date: string
  start: string; end: string; duration: number
  project: string; billable: boolean
  is_manual: boolean; is_manual_edit: boolean
  entry_type: EntryType; idle_reason?: string
  activity_rate: number; manual_rate: number
  notes?: string; edit_log: EditLogItem[]
}

interface Worker { id: string; name: string; initials: string; color: string; bg: string; client: string; team: string; weeklyLimit?: number; dailyLimit?: number }
interface Team   { id: string; name: string; client: string; workerIds: string[] }

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function toMins(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function toTime(m: number) {
  const h = Math.floor(Math.max(0, m) / 60) % 24, mn = Math.max(0, m) % 60
  return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`
}
function fmtDurHMS(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  return `${String(h).padStart(1,'0')}:${String(m).padStart(2,'0')}:00`
}
function fmtDur(mins: number) {
  const h = Math.floor(mins / 60), m = mins % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}
function fmtClock(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'; const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`
}
function fmtDateFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDT(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function addDays(ds: string, n: number) {
  const d = new Date(ds + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]
}
function weekOf(date: string) {
  const d = new Date(date + 'T00:00:00'), day = d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() - ((day + 6) % 7)); return mon.toISOString().split('T')[0]
}

let _uid = 3000
function uid() { return `e${_uid++}` }

// ─────────────────────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────────────────────

const WORKERS: Worker[] = [
  { id: 'w1', name: 'Alice Chen',    initials: 'AC', color: '#6C63FF', bg: '#EEEDFF', client: 'Acme Corp',         team: 't1', weeklyLimit: 40, dailyLimit: 8  },
  { id: 'w2', name: 'Bob Martinez',  initials: 'BM', color: '#3B82F6', bg: '#EFF6FF', client: 'Acme Corp',         team: 't1', weeklyLimit: 40 },
  { id: 'w3', name: 'Carmen Santos', initials: 'CS', color: '#06B6D4', bg: '#ECFEFF', client: 'Acme Corp',         team: 't1' },
  { id: 'w4', name: 'David Kim',     initials: 'DK', color: '#F59E0B', bg: '#FFFBEB', client: 'Global Industries', team: 't2', weeklyLimit: 40, dailyLimit: 8  },
  { id: 'w5', name: 'Elena Patel',   initials: 'EP', color: '#EC4899', bg: '#FDF2F8', client: 'Global Industries', team: 't2' },
  { id: 'w6', name: 'Frank Osei',    initials: 'FO', color: '#10B981', bg: '#F0FDF4', client: 'Global Industries', team: 't2', weeklyLimit: 45 },
]
const TEAMS: Team[] = [
  { id: 't1', name: 'Development', client: 'Acme Corp',         workerIds: ['w1','w2','w3'] },
  { id: 't2', name: 'Support',     client: 'Global Industries', workerIds: ['w4','w5','w6'] },
]
const PROJECTS = ['API Integration','Frontend UI','QA Testing','Client Meeting','Code Review','Support Tickets','Documentation','Sprint Planning','Infrastructure','Bug Fixes']

const PAY_START = '2026-05-26'
const TODAY     = '2026-06-02'
const PAY_DAYS  = Array.from({ length: 14 }, (_, i) => addDays(PAY_START, i))
const WEEKLY_CAP = 2400

// deterministic hash so HMR reloads don't shuffle values
function _hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h }

function mk(id: string, wid: string, date: string, start: string, end: string, project: string, o: Partial<TimeEntry> = {}): TimeEntry {
  const h = _hash(id)
  return {
    id, workerId: wid, date, start, end,
    duration: toMins(end) - toMins(start),
    project, billable: true, is_manual: false, is_manual_edit: false,
    entry_type: 'normal',
    activity_rate: 68 + (h % 28),
    manual_rate: h % 9,
    edit_log: [], ...o,
  }
}

const INITIAL_ENTRIES: TimeEntry[] = [
  // ── 2026-05-26 ────────────────────────────────────────────────────────────
  // Alice: standard day with lunch break
  mk('e001','w1','2026-05-26','09:02','12:30','API Integration',{activity_rate:88}),
  mk('e002','w1','2026-05-26','12:30','13:05','',{entry_type:'idle',idle_reason:'Lunch break',billable:false,activity_rate:0,manual_rate:0}),
  mk('e003','w1','2026-05-26','13:05','17:30','API Integration',{activity_rate:91,notes:'Completed OAuth flow implementation'}),
  // Bob: free-schedule — two short bursts, big gap midday
  mk('e004','w2','2026-05-26','08:30','10:45','Frontend UI',{activity_rate:82,is_manual:true}),
  mk('e005','w2','2026-05-26','14:15','17:00','Frontend UI',{activity_rate:79}),
  // Carmen: morning block only — wrapped up early
  mk('e007','w3','2026-05-26','09:00','12:00','QA Testing',{activity_rate:71}),
  // David: standard split with lunch gap
  mk('e009','w4','2026-05-26','08:00','11:30','Support Tickets',{activity_rate:84}),
  mk('e010','w4','2026-05-26','12:45','17:00','Support Tickets',{activity_rate:78}),
  // Elena: free-schedule — three short blocks spread across the day
  mk('e011a','w5','2026-05-26','07:30','09:00','Documentation',{activity_rate:70,billable:false}),
  mk('e011b','w5','2026-05-26','11:30','13:00','Documentation',{activity_rate:62,billable:false}),
  mk('e011c','w5','2026-05-26','16:00','18:30','Documentation',{activity_rate:58,billable:false}),
  // Frank: early start, manual, big afternoon gap
  mk('e012','w6','2026-05-26','06:45','11:00','Infrastructure',{activity_rate:90,is_manual:true}),
  mk('e013','w6','2026-05-26','11:00','11:30','',{entry_type:'idle',idle_reason:'Lunch break',billable:false,activity_rate:0,manual_rate:0}),
  mk('e014','w6','2026-05-26','15:30','19:00','Infrastructure',{activity_rate:87}),

  // ── 2026-05-27 ────────────────────────────────────────────────────────────
  mk('e020','w1','2026-05-27','09:00','11:00','Code Review',{activity_rate:76}),
  mk('e021','w1','2026-05-27','11:00','12:30','API Integration',{activity_rate:94}),
  mk('e022','w1','2026-05-27','12:30','13:00','',{entry_type:'idle',idle_reason:'Standup & lunch',billable:false,activity_rate:0,manual_rate:0}),
  mk('e023','w1','2026-05-27','13:00','17:00','API Integration',{activity_rate:89,is_manual_edit:true,edit_log:[{id:'log1',editor:'Yoshita K.',timestamp:'2026-05-28T09:15:00',fromStart:'13:30',fromEnd:'17:00',toStart:'13:00',toEnd:'17:00',reason:'Worker forgot to clock in — corrected from screenshot'}]}),
  // Bob: free-schedule, sporadic
  mk('e024a','w2','2026-05-27','10:00','12:00','Frontend UI',{activity_rate:81}),
  mk('e024b','w2','2026-05-27','15:30','18:30','Frontend UI',{activity_rate:77}),
  mk('e025','w3','2026-05-27','09:00','17:30','QA Testing',{activity_rate:73}),
  mk('e026','w4','2026-05-27','08:00','12:30','Support Tickets',{activity_rate:80}),
  mk('e026b','w4','2026-05-27','13:30','17:00','Support Tickets',{activity_rate:75}),
  // Elena: only morning
  mk('e027','w5','2026-05-27','09:00','12:00','Client Meeting',{activity_rate:55}),
  mk('e029','w6','2026-05-27','06:30','11:30','Infrastructure',{activity_rate:91}),
  mk('e030','w6','2026-05-27','13:00','17:30','Bug Fixes',{activity_rate:84}),

  // ── 2026-05-28 ────────────────────────────────────────────────────────────
  mk('e040','w1','2026-05-28','09:00','12:00','API Integration',{activity_rate:89}),
  mk('e040b','w1','2026-05-28','13:00','17:30','API Integration',{activity_rate:86}),
  mk('e041','w2','2026-05-28','08:30','18:00','Frontend UI',{activity_rate:83,is_manual:true}),
  mk('e042','w3','2026-05-28','09:30','12:30','QA Testing',{activity_rate:68}),
  mk('e042b','w3','2026-05-28','14:00','17:00','QA Testing',{activity_rate:72}),
  mk('e043','w4','2026-05-28','08:00','11:00','Support Tickets',{activity_rate:86}),
  mk('e043b','w4','2026-05-28','14:30','17:30','Support Tickets',{activity_rate:80}),
  // Elena: free-schedule — two small blocks only
  mk('e044','w5','2026-05-28','10:00','11:30','Documentation',{activity_rate:59,billable:false}),
  mk('e044b','w5','2026-05-28','17:00','19:00','Documentation',{activity_rate:65,billable:false}),
  mk('e045','w6','2026-05-28','06:30','10:00','Infrastructure',{activity_rate:91}),
  mk('e045b','w6','2026-05-28','12:00','14:30','Infrastructure',{activity_rate:88}),
  mk('e045c','w6','2026-05-28','16:00','18:30','Infrastructure',{activity_rate:85}),

  // ── 2026-05-29 ────────────────────────────────────────────────────────────
  mk('e046','w1','2026-05-29','09:00','12:00','API Integration',{activity_rate:87}),
  mk('e047','w1','2026-05-29','12:00','12:30','',{entry_type:'idle',idle_reason:'Lunch',billable:false,activity_rate:0,manual_rate:0}),
  mk('e048','w1','2026-05-29','12:30','17:00','Code Review',{activity_rate:83,billable:false}),
  // Bob: only afternoon
  mk('e049','w2','2026-05-29','13:00','17:00','Frontend UI',{activity_rate:79}),
  mk('e050','w4','2026-05-29','08:00','11:30','Support Tickets',{activity_rate:80}),
  mk('e050b','w4','2026-05-29','13:00','17:30','Support Tickets',{activity_rate:82}),
  mk('e051','w6','2026-05-29','07:00','19:00','Infrastructure',{activity_rate:88,is_manual:true,edit_log:[{id:'log2',editor:'Admin',timestamp:'2026-05-30T08:00:00',fromStart:'07:00',fromEnd:'18:00',toStart:'07:00',toEnd:'19:00',reason:'Client emergency — approved by manager'}]}),

  // ── 2026-05-30 ────────────────────────────────────────────────────────────
  mk('e052','w1','2026-05-30','09:00','12:30','Sprint Planning',{activity_rate:61,billable:false}),
  mk('e053','w1','2026-05-30','14:00','16:30','API Integration',{activity_rate:86}),
  mk('e054','w2','2026-05-30','09:00','12:00','Frontend UI',{activity_rate:78}),
  mk('e054b','w2','2026-05-30','15:00','17:00','Frontend UI',{activity_rate:74}),
  mk('e055','w6','2026-05-30','07:00','20:00','Infrastructure',{activity_rate:87,is_manual:true,notes:'Deployment weekend prep',edit_log:[{id:'log3',editor:'Yoshita K.',timestamp:'2026-05-31T10:00:00',fromStart:'07:00',fromEnd:'19:00',toStart:'07:00',toEnd:'20:00',reason:'End time confirmed from system logs'}]}),

  // ── 2026-06-01 ────────────────────────────────────────────────────────────
  mk('e100','w1','2026-06-01','09:00','12:30','API Integration',{activity_rate:91,notes:'OAuth handoff to QA.',is_manual_edit:true,edit_log:[{id:'log4',editor:'Yoshita K.',timestamp:'2026-06-01T17:45:00',fromStart:'09:00',fromEnd:'12:00',toStart:'09:00',toEnd:'12:30',reason:'Worker reported 30 min extra — confirmed in screenshot'}]}),
  mk('e101','w1','2026-06-01','12:30','13:00','',{entry_type:'idle',idle_reason:'Lunch break',billable:false,activity_rate:0,manual_rate:0}),
  mk('e102','w1','2026-06-01','13:00','17:30','API Integration',{activity_rate:88}),
  mk('e103','w2','2026-06-01','08:30','11:00','Frontend UI',{activity_rate:83}),
  mk('e103b','w2','2026-06-01','14:00','17:30','Frontend UI',{activity_rate:79}),
  mk('e106','w3','2026-06-01','09:00','17:00','QA Testing',{activity_rate:69,is_manual:true}),
  mk('e107','w4','2026-06-01','08:00','12:00','Support Tickets',{activity_rate:85}),
  mk('e107b','w4','2026-06-01','13:30','17:00','Support Tickets',{activity_rate:81}),
  // Elena: free-schedule — very scattered
  mk('e108a','w5','2026-06-01','08:00','09:30','Documentation',{activity_rate:61,billable:false}),
  mk('e108b','w5','2026-06-01','12:00','13:30','Documentation',{activity_rate:58,billable:false}),
  mk('e108c','w5','2026-06-01','17:30','19:30','Documentation',{activity_rate:66,billable:false}),
  mk('e109','w6','2026-06-01','06:30','11:00','Infrastructure',{activity_rate:90}),
  mk('e109b','w6','2026-06-01','13:00','17:00','Infrastructure',{activity_rate:87}),

  // ── 2026-06-02 (Today) ────────────────────────────────────────────────────
  mk('e110','w1','2026-06-02','09:02','12:00','API Integration',{activity_rate:89}),
  mk('e110b','w1','2026-06-02','13:00','17:30','API Integration',{activity_rate:85}),
  mk('e111','w2','2026-06-02','08:30','11:30','Frontend UI',{activity_rate:80}),
  mk('e111b','w2','2026-06-02','14:00','17:00','Frontend UI',{activity_rate:77}),
  mk('e112','w3','2026-06-02','09:00','13:00','QA Testing',{activity_rate:72}),
  mk('e112b','w3','2026-06-02','14:30','17:00','QA Testing',{activity_rate:68}),
  mk('e113','w4','2026-06-02','08:00','12:30','Support Tickets',{activity_rate:83}),
  mk('e113b','w4','2026-06-02','13:30','17:00','Support Tickets',{activity_rate:80}),
  // Elena: just a morning burst
  mk('e114','w5','2026-06-02','09:30','12:00','Client Meeting',{activity_rate:57}),
  mk('e115','w6','2026-06-02','06:30','10:30','Infrastructure',{activity_rate:88}),
  mk('e115b','w6','2026-06-02','12:30','15:30','Infrastructure',{activity_rate:91}),
  mk('e115c','w6','2026-06-02','17:00','19:00','Infrastructure',{activity_rate:84}),

  // ── 2026-06-03 ────────────────────────────────────────────────────────────
  mk('e116','w1','2026-06-03','09:00','11:30','Code Review',{activity_rate:78}),
  mk('e116b','w1','2026-06-03','13:30','17:00','Code Review',{activity_rate:74}),
  mk('e117','w2','2026-06-03','09:00','12:30','Frontend UI',{activity_rate:84}),
  mk('e117b','w2','2026-06-03','14:00','17:30','Frontend UI',{activity_rate:80}),
  mk('e118','w4','2026-06-03','08:00','12:00','Bug Fixes',{activity_rate:77}),
  mk('e118b','w4','2026-06-03','13:30','17:00','Bug Fixes',{activity_rate:73}),
  mk('e119','w6','2026-06-03','07:00','10:00','Infrastructure',{activity_rate:91}),
  mk('e119b','w6','2026-06-03','12:00','16:00','Infrastructure',{activity_rate:88}),

  // ── 2026-06-04 ────────────────────────────────────────────────────────────
  mk('e120','w1','2026-06-04','09:00','12:00','Sprint Planning',{activity_rate:58,billable:false}),
  mk('e120b','w1','2026-06-04','13:30','17:00','Sprint Planning',{activity_rate:61,billable:false}),
  mk('e121','w2','2026-06-04','09:00','17:00','Frontend UI',{activity_rate:81}),
  mk('e122','w3','2026-06-04','10:00','12:30','QA Testing',{activity_rate:74}),
  mk('e122b','w3','2026-06-04','15:00','17:30','QA Testing',{activity_rate:70}),
  mk('e123','w4','2026-06-04','08:00','11:00','Support Tickets',{activity_rate:82}),
  mk('e123b','w4','2026-06-04','13:00','17:00','Support Tickets',{activity_rate:78}),
  // Elena: very light day, free schedule
  mk('e124','w5','2026-06-04','10:30','12:30','Client Meeting',{activity_rate:52}),
  mk('e125','w6','2026-06-04','07:00','10:30','Bug Fixes',{activity_rate:86}),
  mk('e125b','w6','2026-06-04','13:00','17:30','Bug Fixes',{activity_rate:83}),

  // ── 2026-06-05 ────────────────────────────────────────────────────────────
  mk('e126','w1','2026-06-05','09:00','12:30','API Integration',{activity_rate:87}),
  mk('e126b','w1','2026-06-05','14:00','17:00','API Integration',{activity_rate:84}),
  mk('e127','w2','2026-06-05','09:00','12:00','Frontend UI',{activity_rate:78}),
  mk('e127b','w2','2026-06-05','15:00','17:00','Frontend UI',{activity_rate:75}),
  mk('e128','w6','2026-06-05','06:30','09:30','Infrastructure',{activity_rate:89,is_manual:true}),
  mk('e128b','w6','2026-06-05','11:30','15:00','Infrastructure',{activity_rate:92}),
  mk('e128c','w6','2026-06-05','16:30','19:30','Infrastructure',{activity_rate:87}),

  // ── 2026-06-08 ────────────────────────────────────────────────────────────
  mk('e130','w1','2026-06-08','09:00','12:30','API Integration',{activity_rate:85}),
  mk('e130b','w1','2026-06-08','14:00','17:30','API Integration',{activity_rate:82}),
  mk('e131','w2','2026-06-08','09:00','11:30','Frontend UI',{activity_rate:82}),
  mk('e131b','w2','2026-06-08','13:00','17:00','Frontend UI',{activity_rate:78}),
  mk('e132','w3','2026-06-08','09:00','17:00','QA Testing',{activity_rate:71}),
  mk('e133','w4','2026-06-08','08:00','12:00','Support Tickets',{activity_rate:80}),
  mk('e133b','w4','2026-06-08','13:30','17:00','Support Tickets',{activity_rate:76}),
  // Elena: free-schedule, only eveningish
  mk('e134','w5','2026-06-08','11:00','13:00','Client Meeting',{activity_rate:54}),
  mk('e134b','w5','2026-06-08','16:00','18:30','Client Meeting',{activity_rate:60}),
  mk('e135','w6','2026-06-08','07:00','10:00','Infrastructure',{activity_rate:90,is_manual:true}),
  mk('e135b','w6','2026-06-08','12:30','16:30','Infrastructure',{activity_rate:88}),
]

// ─────────────────────────────────────────────────────────────
//  SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────

function Avatar({ w, size = 32 }: { w: Worker; size?: number }) {
  const a = avatarStyle(w.name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: a.bg, color: a.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700,
    }}>{initials(w.name)}</div>
  )
}

// Slim 24-hour timeline bar for a single day's entries
function DayTimeline({ entries, worker }: { entries: TimeEntry[]; worker: Worker }) {
  const [hovered, setHovered] = React.useState<string | null>(null)
  const [tipPos, setTipPos]   = React.useState<{ x: number; y: number }>({ x: 0, y: 0 })

  function segColor(e: TimeEntry) {
    const isBreak = e.entry_type === 'idle' && /lunch|break/i.test(e.idle_reason ?? '')
    if (isBreak) return '#FCD34D'
    if (e.entry_type === 'idle') return '#FDA4AF'
    if (e.is_manual) return '#60A5FA'
    return worker.color
  }
  function segType(e: TimeEntry) {
    if (e.entry_type === 'idle' && /lunch|break/i.test(e.idle_reason ?? '')) return 'Break'
    if (e.entry_type === 'idle') return 'Idle'
    if (e.is_manual) return 'Manual'
    return 'Normal'
  }

  const hoveredEntry = entries.find(e => e.id === hovered)

  return (
    <div style={{ padding: '14px 24px 6px' }}>
      {/* Bar track — visual is 8px, hover zone is 24px tall to make it easy to hit */}
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        {/* Grey track */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 8, background: '#EBEBEB', borderRadius: 99 }} />
        {entries.map(e => {
          const left  = (toMins(e.start) / 1440) * 100
          const width = Math.max((e.duration / 1440) * 100, 0.3)
          const isHov = hovered === e.id
          return (
            <div
              key={e.id}
              onMouseEnter={ev => {
                setHovered(e.id)
                setTipPos({ x: ev.clientX, y: ev.clientY })
              }}
              onMouseMove={ev => setTipPos({ x: ev.clientX, y: ev.clientY })}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                top: '50%', transform: 'translateY(-50%)',
                height: isHov ? 12 : 8,
                left: `${left}%`, width: `${width}%`,
                background: segColor(e),
                borderRadius: 99,
                cursor: 'pointer',
                transition: 'height 0.1s',
                zIndex: isHov ? 2 : 1,
              }}
            />
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '25%', paddingRight: '25%' }}>
        {['6am','12pm','6pm'].map(l => (
          <span key={l} style={{ fontSize: 10.5, color: '#9CA3AF' }}>{l}</span>
        ))}
      </div>

      {/* Tooltip — rendered in a portal-style fixed div */}
      {hoveredEntry && (
        <div style={{
          position: 'fixed',
          left: tipPos.x,
          top: tipPos.y - 12,
          transform: 'translate(-50%, -100%)',
          background: '#1F2937',
          color: '#fff',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          lineHeight: 1.6,
          pointerEvents: 'none',
          zIndex: 99999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: segColor(hoveredEntry), flexShrink: 0, display: 'inline-block' }} />
            {segType(hoveredEntry)}
            {hoveredEntry.project ? ` · ${hoveredEntry.project}` : hoveredEntry.idle_reason ? ` · ${hoveredEntry.idle_reason}` : ''}
          </div>
          <div style={{ color: '#9CA3AF' }}>{fmtClock(hoveredEntry.start)} – {fmtClock(hoveredEntry.end)}</div>
          <div style={{ color: '#D1D5DB', fontWeight: 600 }}>{fmtDur(hoveredEntry.duration)}</div>
        </div>
      )}
    </div>
  )
}

// Inline expanded details (notes + edit log)
function EntryDetails({ entry, colSpan }: { entry: TimeEntry; colSpan: number }) {
  const hasLog   = entry.edit_log.length > 0
  const hasNotes = !!entry.notes
  if (!hasLog && !hasNotes) return (
    <tr><td colSpan={colSpan} style={{ padding: '8px 24px 12px 72px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
      <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No notes or edit history.</span>
    </td></tr>
  )
  return (
    <tr><td colSpan={colSpan} style={{ padding: '10px 24px 14px 72px', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
      {hasNotes && (
        <div style={{ marginBottom: hasLog ? 10 : 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Note</div>
          <div style={{ fontSize: 12.5, color: '#374151' }}>{entry.notes}</div>
        </div>
      )}
      {hasLog && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Edit history</div>
          {entry.edit_log.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6C63FF', marginTop: 5, flexShrink: 0 }} />
              <div style={{ lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{log.editor}</span>
                <span style={{ color: '#9CA3AF' }}> · {fmtDT(log.timestamp)}</span><br />
                <span style={{ fontFamily: 'monospace', color: '#EF4444', fontSize: 11 }}>{log.fromStart}–{log.fromEnd}</span>
                <span style={{ color: '#9CA3AF' }}> → </span>
                <span style={{ fontFamily: 'monospace', color: '#10B981', fontSize: 11 }}>{log.toStart}–{log.toEnd}</span>
                <span style={{ color: '#6B7280' }}> · <em>"{log.reason}"</em></span>
              </div>
            </div>
          ))}
        </>
      )}
    </td></tr>
  )
}

// ─────────────────────────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────────────────────────

interface ModalState {
  id?: string; workerId: string; date: string
  start: string; end: string; durStr: string
  project: string; billable: boolean; entry_type: EntryType
  idle_reason: string; notes: string; editReason: string
  orig_activity_rate?: number; orig_edit_log?: EditLogItem[]
}

function parseDur(s: string): number | null {
  s = s.trim().toLowerCase()
  const hm = s.match(/^(\d+)h\s*(\d+)m?$/); if (hm) return +hm[1]*60 + +hm[2]
  const h  = s.match(/^(\d+(?:\.\d+)?)h$/);  if (h)  return Math.round(+h[1]*60)
  const m  = s.match(/^(\d+)m?$/);            if (m)  return +m[1]
  const c  = s.match(/^(\d+):(\d+)$/);        if (c)  return +c[1]*60 + +c[2]
  return null
}

function EntryModal({ init, workers, entries, onSave, onClose }: {
  init: ModalState; workers: Worker[]; entries: TimeEntry[]
  onSave: (m: ModalState) => void; onClose: () => void
}) {
  const [f, setF] = useState<ModalState>(init)
  const [durFocus, setDurFocus] = useState(false)
  const isEdit = !!init.id

  function upd<K extends keyof ModalState>(k: K, v: ModalState[K]) { setF(p => ({ ...p, [k]: v })) }
  function onStart(v: string) {
    upd('start', v)
    if (!durFocus) { const d = toMins(f.end) - toMins(v); if (d > 0) upd('durStr', fmtDur(d)) }
    else { const m = parseDur(f.durStr); if (m) upd('end', toTime(toMins(v) + m)) }
  }
  function onEnd(v: string) { upd('end', v); setDurFocus(false); const d = toMins(v) - toMins(f.start); if (d > 0) upd('durStr', fmtDur(d)) }
  function onDur(v: string) { upd('durStr', v); setDurFocus(true); const m = parseDur(v); if (m && f.start) upd('end', toTime(toMins(f.start) + m)) }

  const calcDur = Math.max(0, toMins(f.end) - toMins(f.start))
  const wk = weekOf(f.date), wke = addDays(wk, 6)
  const weekMins = entries.filter(e => e.workerId === f.workerId && e.date >= wk && e.date <= wke && e.id !== f.id).reduce((s, e) => s + e.duration, 0)
  const projected = weekMins + calcDur
  const overCap = projected > WEEKLY_CAP
  const worker = workers.find(w => w.id === f.workerId)

  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 480, maxHeight: '88vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #E8E8E8', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{isEdit ? 'Edit entry' : 'Add time'}</div>
            {isEdit && f.orig_activity_rate !== undefined && (
              <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2 }}>Activity rate preserved: <strong style={{ color: '#10B981' }}>{f.orig_activity_rate}%</strong></div>
            )}
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Worker</label><select value={f.workerId} onChange={e => upd('workerId', e.target.value)} style={inp}>{workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
          <div style={{ marginBottom: 12 }}><label style={lbl}>Date</label><input type="date" value={f.date} onChange={e => upd('date', e.target.value)} style={inp} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Start</label><input type="time" value={f.start} onChange={e => onStart(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>End</label><input type="time" value={f.end} onChange={e => onEnd(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Duration</label><input value={f.durStr} onChange={e => onDur(e.target.value)} placeholder="1h 30m" style={inp} /></div>
          </div>
          {calcDur > 0 && <div style={{ fontSize: 12, color: '#6C63FF', background: '#EEEDFF', padding: '5px 10px', borderRadius: 6, marginBottom: 12 }}>{fmtDur(calcDur)} · Week total: <strong style={{ color: overCap ? '#EF4444' : 'inherit' }}>{fmtDur(projected)}</strong> / 40h</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><label style={lbl}>Project</label><select value={f.project} onChange={e => upd('project', e.target.value)} style={inp}><option value="">— none —</option>{PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label style={lbl}>Type</label><select value={f.entry_type} onChange={e => upd('entry_type', e.target.value as EntryType)} style={inp}><option value="normal">Normal</option><option value="idle">Idle</option></select></div>
          </div>
          {f.entry_type === 'idle' && <div style={{ marginBottom: 12 }}><label style={lbl}>Idle reason</label><input value={f.idle_reason} onChange={e => upd('idle_reason', e.target.value)} placeholder="e.g. Team lunch" style={inp} /></div>}
          <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" id="bill" checked={f.billable} onChange={e => upd('billable', e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
            <label htmlFor="bill" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Billable</label>
          </div>
          <div style={{ marginBottom: isEdit ? 12 : 0 }}><label style={lbl}>Notes</label><textarea rows={2} value={f.notes} onChange={e => upd('notes', e.target.value)} placeholder="Optional…" style={{ ...inp, resize: 'vertical' }} /></div>
          {isEdit && <div><label style={lbl}>Reason for edit <span style={{ color: '#EF4444' }}>*</span></label><input value={f.editReason} onChange={e => upd('editReason', e.target.value)} placeholder="Why was this entry changed?" style={{ ...inp, borderColor: !f.editReason ? '#FCA5A5' : '#E8E8E8' }} /></div>}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid #E8E8E8', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>Cancel</button>
          <button onClick={() => onSave(f)} disabled={isEdit && !f.editReason} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isEdit && !f.editReason ? 'not-allowed' : 'pointer', background: isEdit && !f.editReason ? '#E5E7EB' : '#6C63FF', color: isEdit && !f.editReason ? '#9CA3AF' : '#fff' }}>{isEdit ? 'Save changes' : 'Add time'}</button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  SPLIT MODAL
// ─────────────────────────────────────────────────────────────

interface SplitState {
  entry: TimeEntry
  splitStart: string
  splitEnd: string
  splitDurStr: string
  project: string
  reason: string
  billable: boolean
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <input type="time" value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '9px 13px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#111827', background: '#fff', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
    </div>
  )
}

function SplitModal({ entry, worker, onSave, onClose }: {
  entry: TimeEntry; worker: Worker
  onSave: (s: SplitState, mode: 'reassign' | 'delete') => void; onClose: () => void
}) {
  const mid = toTime(toMins(entry.start) + Math.floor(entry.duration / 2))
  const [tab, setTab] = useState<'reassign' | 'delete'>('reassign')
  const [f, setF] = useState<SplitState>({
    entry, splitStart: entry.start, splitEnd: mid,
    splitDurStr: fmtDur(toMins(mid) - toMins(entry.start)),
    project: entry.project, reason: '', billable: entry.billable,
  })
  const [durFocus, setDurFocus] = useState(false)

  function upd<K extends keyof SplitState>(k: K, v: SplitState[K]) { setF(p => ({ ...p, [k]: v })) }
  function onSplitStart(v: string) {
    upd('splitStart', v)
    if (!durFocus) { const d = toMins(f.splitEnd) - toMins(v); if (d > 0) upd('splitDurStr', fmtDur(d)) }
    else { const m = parseDur(f.splitDurStr); if (m) upd('splitEnd', toTime(toMins(v) + m)) }
  }
  function onSplitEnd(v: string) {
    upd('splitEnd', v); setDurFocus(false)
    const d = toMins(v) - toMins(f.splitStart); if (d > 0) upd('splitDurStr', fmtDur(d))
  }
  function onSplitDur(v: string) {
    upd('splitDurStr', v); setDurFocus(true)
    const m = parseDur(v); if (m) upd('splitEnd', toTime(toMins(f.splitStart) + m))
  }

  const beforeMins = Math.max(0, toMins(f.splitStart) - toMins(entry.start))
  const midMins    = Math.max(0, toMins(f.splitEnd)   - toMins(f.splitStart))
  const afterMins  = Math.max(0, toMins(entry.end)    - toMins(f.splitEnd))

  const rangeValid =
    midMins > 0 &&
    toMins(f.splitStart) >= toMins(entry.start) &&
    toMins(f.splitEnd)   <= toMins(entry.end) &&
    toMins(f.splitStart) <  toMins(f.splitEnd)

  const valid = rangeValid && !!f.reason.trim()

  // Bar colours — side segments always clear grey, mid is the action colour
  const midColor  = tab === 'delete' ? '#EF4444' : worker.color
  const sideColor = '#C4C4C4'

  // Bar % — map over the full day (0–1440 mins) to align with 6am/12pm/6pm labels
  const DAY = 1440
  const entryStartMins = toMins(entry.start)
  const toBarPct = (t: string) => (toMins(t) / DAY) * 100

  const barEntryStart = toBarPct(entry.start)
  const barEntryEnd   = toBarPct(entry.end)
  const barSplitStart = toBarPct(f.splitStart)
  const barSplitEnd   = toBarPct(f.splitEnd)
  const midCtrPct = (barSplitStart + barSplitEnd) / 2

  // legacy pct vars kept for chip positioning
  const startPct = barSplitStart
  const endPct   = barSplitEnd

  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }

  // Segment rows for the bar legend
  const segs = [
    ...(beforeMins > 0 ? [{ label: `${fmtClock(entry.start)} – ${fmtClock(f.splitStart)}`, dur: beforeMins, color: sideColor, tag: 'Kept' }] : []),
    { label: `${fmtClock(f.splitStart)} – ${fmtClock(f.splitEnd)}`, dur: midMins, color: midColor, tag: tab === 'delete' ? 'Deleted' : 'Reassigned' },
    ...(afterMins > 0 ? [{ label: `${fmtClock(f.splitEnd)} – ${fmtClock(entry.end)}`, dur: afterMins, color: sideColor, tag: 'Kept' }] : []),
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, width: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid #E8E8E8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Split time</div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF', lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Context card */}
        <div style={{ margin: '16px 24px 0', padding: '14px 16px', border: '1px solid #E8E8E8', borderRadius: 10, background: '#FAFAFA' }}>
          <div style={{ display: 'flex', gap: 32, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Member</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar w={worker} size={26} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{worker.name}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Project</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: worker.bg, color: worker.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {(entry.project || 'N').charAt(0)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{entry.project || '—'}</span>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Time Span</div>
            <div style={{ fontSize: 13, color: '#374151' }}>
              from <strong>{fmtClock(entry.start)}</strong> to <strong>{fmtClock(entry.end)}</strong>
              <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{fmtDur(entry.duration)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E8E8E8', marginTop: 16, padding: '0 24px' }}>
          {(['reassign', 'delete'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 4px', marginRight: 24, border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: tab === t ? '#6C63FF' : '#9CA3AF',
              borderBottom: tab === t ? '2px solid #6C63FF' : '2px solid transparent',
              transition: 'color 0.15s',
            }}>
              {t === 'reassign' ? 'Reassign Time' : 'Delete Time'}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* FROM — TO — Duration row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 20 }}>
            <TimeField label="From" value={f.splitStart} onChange={onSplitStart} />
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 700, paddingBottom: 11 }}>TO</span>
            <TimeField label="To" value={f.splitEnd} onChange={onSplitEnd} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
              <input value={f.splitDurStr} onChange={e => onSplitDur(e.target.value)} placeholder="1h 30m"
                style={{ ...inp, fontSize: 15, fontWeight: 600, padding: '9px 12px' }} />
            </div>
          </div>

          {/* Timeline bar — full day 0–1440, labels at 6am/12pm/6pm */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ position: 'relative', height: 12, background: '#EBEBEB', borderRadius: 99, overflow: 'hidden' }}>
              {/* Entire entry block (background layer, light grey) */}
              <div style={{ position: 'absolute', left: `${barEntryStart}%`, width: `${barEntryEnd - barEntryStart}%`, height: '100%', background: '#D1D5DB', borderRadius: 2 }} />

              {/* Before segment (entry start → split start) */}
              {beforeMins > 0 && (
                <div style={{ position: 'absolute', left: `${barEntryStart}%`, width: `${barSplitStart - barEntryStart - 0.2}%`, height: '100%', background: sideColor, borderRadius: 2, transition: 'width 0.1s' }} />
              )}
              {/* Mid segment (split start → split end) */}
              {midMins > 0 && (
                <div style={{ position: 'absolute', left: `${barSplitStart + (beforeMins > 0 ? 0.2 : 0)}%`, width: `${barSplitEnd - barSplitStart - (beforeMins > 0 ? 0.2 : 0) - (afterMins > 0 ? 0.2 : 0)}%`, height: '100%', background: midColor, borderRadius: 2, transition: 'left 0.1s, width 0.1s' }} />
              )}
              {/* After segment (split end → entry end) */}
              {afterMins > 0 && (
                <div style={{ position: 'absolute', left: `${barSplitEnd + 0.2}%`, width: `${barEntryEnd - barSplitEnd - 0.2}%`, height: '100%', background: sideColor, borderRadius: 2, transition: 'left 0.1s' }} />
              )}
            </div>

            {/* Duration chip centred under the selected range */}
            {midMins > 0 && (
              <div style={{ position: 'relative', height: 32, overflow: 'visible' }}>
                <div style={{
                  position: 'absolute',
                  left: `${midCtrPct}%`,
                  transform: 'translateX(-50%)',
                  top: 6,
                  background: '#fff',
                  border: '1px solid #E8E8E8',
                  borderRadius: 8,
                  padding: '4px 12px',
                  fontSize: 13, fontWeight: 600, color: '#374151',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  whiteSpace: 'nowrap',
                }}>
                  {fmtDurHMS(midMins)}
                </div>
              </div>
            )}

            {/* Time axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '25%', paddingRight: '25%', marginTop: 4 }}>
              {['6am','12pm','6pm'].map(l => <span key={l} style={{ fontSize: 10.5, color: '#9CA3AF' }}>{l}</span>)}
            </div>
          </div>

          {/* Segment legend rows */}
          {rangeValid && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20, marginTop: 6 }}>
              {segs.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #F0F0F0' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                    {seg.label}
                    <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{fmtDur(seg.dur)}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: seg.tag === 'Deleted' ? '#FEF2F2' : seg.tag === 'Reassigned' ? worker.bg : '#F3F4F6',
                    color: seg.tag === 'Deleted' ? '#EF4444' : seg.tag === 'Reassigned' ? worker.color : '#9CA3AF',
                  }}>{seg.tag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab-specific fields */}
          {tab === 'reassign' && (
            <>
              <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" id="split-bill" checked={f.billable} onChange={e => upd('billable', e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                <label htmlFor="split-bill" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Billable</label>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Project <span style={{ color: '#9CA3AF', textTransform: 'none', fontWeight: 400, letterSpacing: 0 }}>(for selected range)</span></label>
                <select value={f.project} onChange={e => upd('project', e.target.value)} style={inp}>
                  <option value="">— none —</option>
                  {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label style={lbl}>Reason <span style={{ color: '#EF4444' }}>*</span></label>
            <textarea rows={3} value={f.reason} onChange={e => upd('reason', e.target.value)}
              placeholder={tab === 'delete' ? 'Why are you deleting this time range?' : 'Why are you splitting this time entry?'}
              style={{ ...inp, resize: 'vertical' }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #F0F0F0', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 14px', border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => valid && onSave(f, tab)} disabled={!valid}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed', background: valid ? (tab === 'delete' ? '#EF4444' : '#6C63FF') : '#E5E7EB', color: valid ? '#fff' : '#9CA3AF' }}>
            {tab === 'delete' ? 'Delete time' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────

type ViewMode = 'person' | 'group'
type ViewTab  = 'daily' | 'weekly'

// ─────────────────────────────────────────────────────────────
//  WEEKLY GRID
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
//  CELL POPOVER (weekly view)
// ─────────────────────────────────────────────────────────────

function CellPopover({ cellEntries, worker, anchorRect, onEdit, onSplit, onDelete, onClose }: {
  cellEntries: TimeEntry[]
  worker: Worker
  anchorRect: DOMRect
  onEdit: (e: TimeEntry) => void
  onSplit: (e: TimeEntry) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const popWidth = 260
  // Position below the cell, centered, but clamped to viewport
  const left = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2 - popWidth / 2, 8),
    window.innerWidth - popWidth - 8
  )
  const top = anchorRect.bottom + 6

  return (
    <>
      {/* backdrop */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={onClose} />
      <div style={{
        position: 'fixed', zIndex: 901,
        top, left, width: popWidth,
        background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>
        {cellEntries.map((e, idx) => {
          const isIdle = e.entry_type === 'idle'
          return (
            <div key={e.id} style={{ borderBottom: idx < cellEntries.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              {/* Entry summary */}
              <div style={{ padding: '12px 14px 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                  {isIdle ? (e.idle_reason || 'Idle time') : (e.project || '—')}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                  {fmtClock(e.start)} – {fmtClock(e.end)}
                  <span style={{ marginLeft: 6, color: '#9CA3AF' }}>({fmtDur(e.duration)})</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {e.billable && !isIdle && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: '#15803D', background: '#DCFCE7', borderRadius: 99, padding: '3px 10px' }}>
                      <DollarSign width={10} height={10} /> Billable
                    </span>
                  )}
                  {!e.billable && !isIdle && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', borderRadius: 99, padding: '3px 10px' }}>
                      Non-billable
                    </span>
                  )}
                  {(e.is_manual || e.is_manual_edit) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: '#92400E', background: '#FEF3C7', borderRadius: 99, padding: '3px 10px' }}>
                      <PenLine width={10} height={10} /> Manual
                    </span>
                  )}
                  {isIdle && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#92400E', background: '#FEF3C7', borderRadius: 99, padding: '3px 10px' }}>
                      Idle
                    </span>
                  )}
                </div>
              </div>
              {/* Entry actions */}
              <div style={{ display: 'flex', borderTop: '1px solid #F3F4F6' }}>
                <PopAction icon={<Edit2 width={12} height={12} />} label="Edit" onClick={() => { onEdit(e); onClose() }} />
                {!isIdle && <PopAction icon={<Scissors width={12} height={12} />} label="Split" onClick={() => { onSplit(e); onClose() }} />}
                <PopAction icon={<Trash2 width={12} height={12} />} label="Delete" onClick={() => { onDelete(e.id); onClose() }} danger />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function PopAction({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '8px 4px', border: 'none', background: hov ? (danger ? '#FEF2F2' : '#F9FAFB') : 'transparent',
        cursor: 'pointer', fontSize: 12, color: hov && danger ? '#EF4444' : danger ? '#9CA3AF' : '#374151',
        transition: 'background 0.1s',
      }}
    >{icon} {label}</button>
  )
}

function WeeklyGrid({
  weekStart, workers, entries, onAddTime, onEdit, onSplit, onDelete,
}: {
  weekStart: string
  workers: Worker[]
  entries: TimeEntry[]
  onAddTime: () => void
  onEdit: (e: TimeEntry) => void
  onSplit: (e: TimeEntry) => void
  onDelete: (id: string) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const DAY_LABELS = ['MON','TUE','WED','THU','FRI','SAT','SUN']
  const [openCell, setOpenCell] = React.useState<{ key: string; rect: DOMRect } | null>(null)

  function cellEntries(wid: string, day: string) {
    return entries.filter(e => e.workerId === wid && e.date === day)
  }
  function workerDayMins(wid: string, day: string) {
    return entries.filter(e => e.workerId === wid && e.date === day && e.entry_type === 'normal').reduce((s, e) => s + e.duration, 0)
  }
  function workerTotalMins(wid: string) {
    return days.reduce((s, d) => s + workerDayMins(wid, d), 0)
  }
  function dayTotalMins(day: string) {
    return workers.reduce((s, w) => s + workerDayMins(w.id, day), 0)
  }
  const grandTotal = workers.reduce((s, w) => s + workerTotalMins(w.id), 0)

  const cellStyle: React.CSSProperties = {
    padding: '18px 12px', textAlign: 'center', borderRight: '1px solid #F0F0F0',
    fontSize: 13.5, color: '#374151',
  }
  const thStyle: React.CSSProperties = {
    padding: '14px 12px', textAlign: 'center', borderRight: '1px solid #F0F0F0',
    borderBottom: '2px solid #E8E8E8',
  }

  const fmtWeekRange = () => {
    const s = new Date(weekStart + 'T00:00:00')
    const e = new Date(addDays(weekStart, 6) + 'T00:00:00')
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    return `${fmt(s)} – ${fmt(e)}`
  }

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', overflow: 'hidden' }}>
      {/* Week header bar */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>Total: </span>
          <span style={{ fontFamily: 'monospace', color: '#374151' }}>{fmtDurHMS(grandTotal)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>{fmtWeekRange()}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <IconBtn title="Export"><Download width={14} height={14} /></IconBtn>
          <button onClick={onAddTime} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <Plus width={13} height={13} /> Add time
          </button>
        </div>
      </div>

      {/* Grid table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 20, width: 180, borderRight: '1px solid #F0F0F0' }} />
              {days.map((day, i) => {
                const d = new Date(day + 'T00:00:00')
                const isWeekend = i >= 5
                return (
                  <th key={day} style={{ ...thStyle, minWidth: 90 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: isWeekend ? '#9CA3AF' : '#111827', lineHeight: 1 }}>
                      {d.getDate()}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', marginTop: 2 }}>
                      {DAY_LABELS[i]}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
                      {d.toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </th>
                )
              })}
              <th style={{ ...thStyle, minWidth: 80, borderRight: 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Total</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w, wi) => {
              const total         = workerTotalMins(w.id)
              const wkLimitMins   = w.weeklyLimit != null ? w.weeklyLimit * 60 : null
              const dayLimitMins  = w.dailyLimit  != null ? w.dailyLimit  * 60 : null
              const weekPct       = wkLimitMins != null ? Math.min(total / wkLimitMins, 1) : null
              const weekOver      = wkLimitMins != null && total > wkLimitMins
              const weekNear      = wkLimitMins != null && !weekOver && wkLimitMins > 0 && total / wkLimitMins >= 0.8
              const barColor      = weekOver ? '#EF4444' : weekNear ? '#F59E0B' : '#10B981'
              return (
                <tr key={w.id} style={{ borderTop: wi === 0 ? '1px solid #F0F0F0' : '1px solid #F5F5F5' }}>
                  <td style={{ padding: '16px 20px', borderRight: '1px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar w={w} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{w.name}</div>
                        {wkLimitMins != null ? (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 10.5, fontWeight: 600, color: weekOver ? '#EF4444' : weekNear ? '#F59E0B' : '#6B7280' }}>
                                {fmtDur(total)}
                                <span style={{ color: '#D1D5DB', fontWeight: 400 }}> / {w.weeklyLimit}h</span>
                              </span>
                              {weekOver && <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', letterSpacing: '0.04em' }}>OVER</span>}
                            </div>
                            <div style={{ height: 3, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(weekPct ?? 0) * 100}%`, background: barColor, borderRadius: 2 }} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{w.client}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {days.map((day, i) => {
                    const mins       = workerDayMins(w.id, day)
                    const isWeekend  = i >= 5
                    const key        = `${w.id}_${day}`
                    const dayEntries = cellEntries(w.id, day)
                    const isOpen     = openCell?.key === key
                    const hasBillable = dayEntries.some(e => e.billable && e.entry_type === 'normal')
                    const dayOver    = dayLimitMins != null && mins > dayLimitMins
                    const dayNear    = dayLimitMins != null && !dayOver && mins > 0 && mins / dayLimitMins >= 0.9
                    const dayTint    = isOpen ? '#EEEDFF' : dayOver ? '#FEF2F2' : dayNear ? '#FFFBEB' : isWeekend ? '#FAFAFA' : '#fff'
                    const dotColor   = dayOver ? '#EF4444' : dayNear ? '#F59E0B' : null
                    return (
                      <td
                        key={day}
                        onClick={ev => {
                          ev.stopPropagation()
                          if (!mins) return
                          setOpenCell(isOpen ? null : { key, rect: (ev.currentTarget as HTMLElement).getBoundingClientRect() })
                        }}
                        style={{
                          ...cellStyle,
                          padding: '12px 8px',
                          position: 'relative',
                          background: dayTint,
                          color: mins > 0 ? (isOpen ? '#6C63FF' : '#374151') : '#D1D5DB',
                          cursor: mins > 0 ? 'pointer' : 'default',
                          transition: 'background 0.1s',
                          verticalAlign: 'middle',
                        }}
                      >
                        {/* Time value */}
                        <div style={{ fontWeight: isOpen ? 600 : 400, fontSize: 13.5, lineHeight: 1 }}>
                          {mins > 0 ? fmtDurHMS(mins) : '–'}
                          {hasBillable && mins > 0 && (
                            <HoverTooltip label="Billable">
                              <span style={{ color: '#9CA3AF', marginLeft: 4, fontSize: 12, cursor: 'default' }}>$</span>
                            </HoverTooltip>
                          )}
                        </div>

                        {/* Daily limit badge */}
                        {dayLimitMins != null && mins > 0 && (dayOver || dayNear) && (() => {
                          const limitH = w.dailyLimit!
                          const loggedH = +(mins / 60).toFixed(1)
                          const overMins = mins - dayLimitMins
                          const overH = +(overMins / 60).toFixed(1)
                          const bg   = dayOver ? '#FEE2E2' : '#FEF3C7'
                          const fg   = dayOver ? '#DC2626' : '#D97706'
                          return (
                            <div style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 3, background: bg, color: fg, borderRadius: 4, padding: '2px 6px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {dayOver
                                ? <>+{overH}h over {limitH}h</>
                                : <>{loggedH}h / {limitH}h</>}
                            </div>
                          )
                        })()}

                        {/* Show limit reference even on normal days when a limit exists */}
                        {dayLimitMins != null && mins > 0 && !dayOver && !dayNear && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#D1D5DB', whiteSpace: 'nowrap' }}>
                            / {w.dailyLimit}h
                          </div>
                        )}

                        {isOpen && openCell && dayEntries.length > 0 && (
                          <CellPopover
                            cellEntries={dayEntries}
                            worker={w}
                            anchorRect={openCell.rect}
                            onEdit={onEdit}
                            onSplit={onSplit}
                            onDelete={onDelete}
                            onClose={() => setOpenCell(null)}
                          />
                        )}
                      </td>
                    )
                  })}
                  <td style={{
                    ...cellStyle, padding: '12px 8px', borderRight: 'none', fontWeight: 700,
                    color: weekOver ? '#EF4444' : weekNear ? '#F59E0B' : total > 0 ? '#374151' : '#D1D5DB',
                    background: weekOver ? '#FEF2F2' : weekNear ? '#FFFBEB' : undefined,
                  }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1 }}>{total > 0 ? fmtDurHMS(total) : '–'}</div>
                    {wkLimitMins != null && total > 0 && (
                      <div style={{ marginTop: 5 }}>
                        {weekOver ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#FEE2E2', color: '#DC2626', borderRadius: 4, padding: '2px 6px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            +{fmtDur(total - wkLimitMins)} over
                          </span>
                        ) : (
                          <span style={{ fontSize: 10.5, color: weekNear ? '#D97706' : '#9CA3AF', fontWeight: weekNear ? 600 : 400, whiteSpace: 'nowrap' }}>
                            {fmtDur(total)} / {w.weeklyLimit}h
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}

            {/* All projects total row */}
            <tr style={{ borderTop: '2px solid #E8E8E8', background: '#FAFAFA' }}>
              <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 13, color: '#374151', borderRight: '1px solid #F0F0F0' }}>
                All projects
              </td>
              {days.map((day, i) => {
                const mins = dayTotalMins(day)
                const isWeekend = i >= 5
                return (
                  <td key={day} style={{ ...cellStyle, background: isWeekend ? '#F5F5F5' : '#FAFAFA', fontWeight: 500, color: mins > 0 ? '#374151' : '#D1D5DB' }}>
                    {mins > 0 ? fmtDurHMS(mins) : '–'}
                  </td>
                )
              })}
              <td style={{ ...cellStyle, borderRight: 'none', fontWeight: 700, color: grandTotal > 0 ? '#6C63FF' : '#D1D5DB', fontSize: 14 }}>
                {grandTotal > 0 ? fmtDurHMS(grandTotal) : '–'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TimesheetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewTab, setViewTab]   = useState<ViewTab>('daily')
  const [mode, setMode]         = useState<ViewMode>('person')
  const [wid, setWid]           = useState(() => {
    const p = searchParams.get('worker')
    return p && WORKERS.find(w => w.id === p) ? p : 'w1'
  })
  const [tid, setTid]           = useState('t1')
  const [rangeStart, setRangeStart] = useState(PAY_START)
  const [rangeEnd, setRangeEnd]     = useState(addDays(PAY_START, 13))

  // Sync URL params → state when navigated from another page
  useEffect(() => {
    const workerParam = searchParams.get('worker')
    const dateParam   = searchParams.get('date')
    const filterParam = searchParams.get('filter')
    if (workerParam && WORKERS.find(w => w.id === workerParam)) {
      setWid(workerParam)
      setMode('person')
    }
    if (dateParam && dateParam >= PAY_START && dateParam <= addDays(PAY_START, 13)) {
      setRangeStart(weekOf(dateParam))
      setRangeEnd(addDays(weekOf(dateParam), 6))
    }
    if (filterParam === 'low-activity') {
      setFilterActivityLevels(new Set(['Low']))
    }
    // Clear params from URL after consuming them
    if (workerParam || dateParam || filterParam) setSearchParams({}, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [entries, setEntries]   = useState<TimeEntry[]>(INITIAL_ENTRIES)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal]       = useState<ModalState | null>(null)
  const [splitModal, setSplitModal] = useState<TimeEntry | null>(null)
  const [actionsOpen, setActionsOpen] = useState<{ id: string; top: number; right: number } | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterEmployees, setFilterEmployees] = useState<string[]>([])
  const [filterActivityMin, setFilterActivityMin] = useState(0)
  const [filterActivityMax, setFilterActivityMax] = useState(100)
  const [filterTimeTypes, setFilterTimeTypes] = useState<Set<string>>(new Set())
  const [filterActivityLevels, setFilterActivityLevels] = useState<Set<string>>(new Set())
  const [checked, setChecked]   = useState<Set<string>>(new Set())

  const activeWorkers = useMemo(() => {
    if (mode === 'person') return WORKERS.filter(w => w.id === wid)
    return WORKERS.filter(w => TEAMS.find(t => t.id === tid)!.workerIds.includes(w.id))
  }, [mode, wid, tid])

  const activeWids = useMemo(() => new Set(activeWorkers.map(w => w.id)), [activeWorkers])

  const isFilterActive = filterEmployees.length > 0 || filterActivityMin > 0 || filterActivityMax < 100 || filterTimeTypes.size > 0 || filterActivityLevels.size > 0

  // Filtered + sorted entries
  const visibleEntries = useMemo(() =>
    entries
      .filter(e => activeWids.has(e.workerId) && e.date >= rangeStart && e.date <= rangeEnd)
      .filter(e => {
        // employee
        if (filterEmployees.length > 0 && !filterEmployees.includes(e.workerId)) return false
        // activity rate (skip idle entries from activity range check)
        if (e.entry_type !== 'idle') {
          if (e.activity_rate < filterActivityMin || e.activity_rate > filterActivityMax) return false
        }
        // time type
        if (filterTimeTypes.size > 0) {
          const isBreak = e.entry_type === 'idle' && /lunch|break/i.test(e.idle_reason ?? '')
          const isIdle  = e.entry_type === 'idle' && !isBreak
          const isManual = e.is_manual
          const typeMatch =
            (filterTimeTypes.has('Normal')  && e.entry_type === 'normal' && !isManual) ||
            (filterTimeTypes.has('Idle')    && isIdle) ||
            (filterTimeTypes.has('Manual')  && isManual) ||
            (filterTimeTypes.has('Break')   && isBreak)
          if (!typeMatch) return false
        }
        // activity levels
        if (filterActivityLevels.size > 0 && e.entry_type !== 'idle') {
          const lvl = e.activity_rate < 50 ? 'Low' : e.activity_rate <= 75 ? 'Medium' : 'High'
          if (!filterActivityLevels.has(lvl)) return false
        }
        return true
      })
      .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : toMins(a.start) - toMins(b.start)),
    [entries, activeWids, rangeStart, rangeEnd, filterEmployees, filterActivityMin, filterActivityMax, filterTimeTypes, filterActivityLevels]
  )

  // Group by date (only dates that have entries)
  const byDate = useMemo(() => {
    const map = new Map<string, TimeEntry[]>()
    visibleEntries.forEach(e => {
      const arr = map.get(e.date) ?? []; arr.push(e); map.set(e.date, arr)
    })
    return map
  }, [visibleEntries])

  // Weekly minutes for cap check
  const weeklyMins = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach(e => { const k = `${e.workerId}_${weekOf(e.date)}`; map.set(k, (map.get(k) ?? 0) + e.duration) })
    return map
  }, [entries])

  function getWeekMins(wid: string, date: string) { return weeklyMins.get(`${wid}_${weekOf(date)}`) ?? 0 }

  function openCreate() {
    setModal({ workerId: activeWorkers[0]?.id ?? 'w1', date: rangeEnd, start: '09:00', end: '10:00', durStr: '1h', project: 'API Integration', billable: true, entry_type: 'normal', idle_reason: '', notes: '', editReason: '' })
  }
  function openEdit(e: TimeEntry) {
    setModal({ id: e.id, workerId: e.workerId, date: e.date, start: e.start, end: e.end, durStr: fmtDur(e.duration), project: e.project, billable: e.billable, entry_type: e.entry_type, idle_reason: e.idle_reason ?? '', notes: e.notes ?? '', editReason: '', orig_activity_rate: e.activity_rate, orig_edit_log: e.edit_log })
  }
  function splitEntry(e: TimeEntry) {
    setSplitModal(e)
    setActionsOpen(null as any)
  }
  function saveSplit(s: SplitState, mode: 'reassign' | 'delete') {
    const deletedKeys = mode === 'delete' ? new Set(['mid']) : new Set<string>()
    const beforeMins = toMins(s.splitStart) - toMins(s.entry.start)
    const midMins    = toMins(s.splitEnd)   - toMins(s.splitStart)
    const afterMins  = toMins(s.entry.end)  - toMins(s.splitEnd)
    if (midMins <= 0) return

    const now = new Date().toISOString()
    const newEntries: TimeEntry[] = []

    // Middle segment (only if not deleted)
    if (!deletedKeys.has('mid')) {
      newEntries.push({
        ...s.entry, id: uid(),
        start: s.splitStart, end: s.splitEnd, duration: midMins,
        project: s.project, billable: s.billable,
        is_manual: true, is_manual_edit: false,
        edit_log: [{ id: uid(), editor: 'Yoshita K.', timestamp: now, fromStart: s.entry.start, fromEnd: s.entry.end, toStart: s.splitStart, toEnd: s.splitEnd, reason: `Split. ${s.reason}` }],
      })
    }

    // After segment (only if not deleted)
    if (afterMins > 0 && !deletedKeys.has('after')) {
      newEntries.push({
        ...s.entry, id: uid(),
        start: s.splitEnd, end: s.entry.end, duration: afterMins,
        is_manual: true, is_manual_edit: false,
        edit_log: [{ id: uid(), editor: 'Yoshita K.', timestamp: now, fromStart: s.entry.start, fromEnd: s.entry.end, toStart: s.splitEnd, toEnd: s.entry.end, reason: `Split. ${s.reason}` }],
      })
    }

    // The original entry becomes the "before" segment (if not deleted),
    // or is removed entirely if the "before" segment is deleted / didn't exist
    const keepBefore = beforeMins > 0 && !deletedKeys.has('before')
    const keepMidAsOriginal = beforeMins === 0 && !deletedKeys.has('mid')

    setEntries(prev => {
      const mapped = prev.map(x => {
        if (x.id !== s.entry.id) return x
        if (keepBefore) {
          return { ...x, end: s.splitStart, duration: beforeMins, is_manual_edit: true, edit_log: [...x.edit_log, { id: uid(), editor: 'Yoshita K.', timestamp: now, fromStart: s.entry.start, fromEnd: s.entry.end, toStart: s.entry.start, toEnd: s.splitStart, reason: s.reason }] }
        }
        if (keepMidAsOriginal) {
          // No "before" and mid not deleted — original entry becomes the mid segment
          return { ...x, end: s.splitEnd, duration: midMins, project: s.project, billable: s.billable, is_manual_edit: true, edit_log: [...x.edit_log, { id: uid(), editor: 'Yoshita K.', timestamp: now, fromStart: s.entry.start, fromEnd: s.entry.end, toStart: s.splitStart, toEnd: s.splitEnd, reason: s.reason }] }
        }
        // Both before and mid deleted — original entry becomes the after segment (or is removed)
        if (afterMins > 0 && !deletedKeys.has('after')) {
          return { ...x, start: s.splitEnd, duration: afterMins, is_manual_edit: true, edit_log: [...x.edit_log, { id: uid(), editor: 'Yoshita K.', timestamp: now, fromStart: s.entry.start, fromEnd: s.entry.end, toStart: s.splitEnd, toEnd: s.entry.end, reason: s.reason }] }
        }
        return null // everything deleted — remove original
      }).filter(Boolean) as TimeEntry[]

      // Add newly split segments (those not handled by remapping original)
      const extraNew = newEntries.filter(n => {
        // If mid was turned into original (keepMidAsOriginal), don't double-add it
        if (keepMidAsOriginal && n.start === s.splitStart && n.end === s.splitEnd) return false
        // If after was turned into original, don't double-add it
        if (!keepBefore && !keepMidAsOriginal && n.start === s.splitEnd) return false
        return true
      })

      return [...mapped, ...extraNew]
    })
    setSplitModal(null)
  }
  function saveModal(f: ModalState) {
    const dur = Math.max(0, toMins(f.end) - toMins(f.start))
    if (f.id) {
      const orig = entries.find(e => e.id === f.id)!
      const log: EditLogItem = { id: uid(), editor: 'Yoshita K.', timestamp: new Date().toISOString(), fromStart: orig.start, fromEnd: orig.end, toStart: f.start, toEnd: f.end, reason: f.editReason }
      setEntries(prev => prev.map(e => e.id === f.id ? { ...e, start: f.start, end: f.end, duration: dur, project: f.project, billable: f.billable, entry_type: f.entry_type, idle_reason: f.idle_reason || undefined, notes: f.notes || undefined, is_manual_edit: true, activity_rate: orig.activity_rate, edit_log: [...(f.orig_edit_log ?? []), log] } : e))
    } else {
      setEntries(prev => [...prev, { id: uid(), workerId: f.workerId, date: f.date, start: f.start, end: f.end, duration: dur, project: f.project, billable: f.billable, is_manual: true, is_manual_edit: false, entry_type: f.entry_type, idle_reason: f.idle_reason || undefined, activity_rate: 0, manual_rate: 0, notes: f.notes || undefined, edit_log: [] }])
    }
    setModal(null)
  }

  function deleteEntry(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    setChecked(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleCheck(id: string) {
    setChecked(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  // Cap-exceeded workers in range
  const capWorkers = useMemo(() => {
    const wk = weekOf(rangeStart), wke = addDays(wk, 13)
    return WORKERS.filter(w => activeWids.has(w.id) && (entries.filter(e => e.workerId === w.id && e.date >= wk && e.date <= wke).reduce((s, e) => s + e.duration, 0)) > WEEKLY_CAP)
  }, [entries, activeWids, rangeStart])

  const showWorker = mode === 'group'
  const COL_SPAN = showWorker ? 8 : 7

  const worker = WORKERS.find(w => w.id === wid)

  // For weekly view, derive the Monday-aligned week start from rangeStart
  const weekStart = useMemo(() => weekOf(rangeStart), [rangeStart])

  // Navigate helpers that are step-aware
  function navBack()    { const step = viewTab === 'weekly' ? 7 : 14; setRangeStart(d => addDays(d, -step)); setRangeEnd(d => addDays(d, -step)) }
  function navForward() { const step = viewTab === 'weekly' ? 7 : 14; setRangeStart(d => addDays(d, step));  setRangeEnd(d => addDays(d, step)) }
  function goToToday()    { setRangeStart(TODAY);             setRangeEnd(addDays(TODAY, 13)) }
  function goToThisWeek() { const ws = weekOf(TODAY); setRangeStart(ws); setRangeEnd(addDays(ws, 6)) }

  // Calendar picker ref
  const datePickerRef = useRef<HTMLInputElement>(null)
  function handleDatePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.value
    if (!picked) return
    if (viewTab === 'weekly') {
      const ws = weekOf(picked)
      setRangeStart(ws); setRangeEnd(addDays(ws, 6))
    } else {
      setRangeStart(picked); setRangeEnd(addDays(picked, 13))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} onClick={() => actionsOpen && setActionsOpen(null as any)}>
      <TopBar crumbs={[{ label: 'Timesheets' }]} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', background: '#F7F8FA' }}>

        {/* ── TOOLBAR ── */}
        <div style={{ marginBottom: 16, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Row 1: Date nav · View tabs · spacer · Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '8px 14px', borderBottom: viewTab === 'daily' ? '1px solid #F3F4F6' : 'none' }}>

            {/* ① Date navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <NavBtn onClick={navBack}><ChevronLeft width={14} height={14} /></NavBtn>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, fontSize: 13, color: '#374151', whiteSpace: 'nowrap', pointerEvents: 'none', fontWeight: 500 }}>
                  <CalendarDays width={13} height={13} color="#9CA3AF" />
                  {viewTab === 'weekly'
                    ? `${fmtDateShort(weekStart)} – ${fmtDateShort(addDays(weekStart, 6))}, 2026`
                    : `${fmtDateShort(rangeStart)} – ${fmtDateShort(rangeEnd)}, 2026`
                  }
                </div>
                <input ref={datePickerRef} type="date" value={viewTab === 'weekly' ? weekStart : rangeStart} onChange={handleDatePick}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }} />
              </div>
              <NavBtn onClick={navForward}><ChevronRight width={14} height={14} /></NavBtn>
              {viewTab === 'daily' && (
                <button onClick={goToToday} style={{ padding: '4px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#6C63FF', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>Today</button>
              )}
              {viewTab === 'weekly' && (
                <button onClick={goToThisWeek} style={{ padding: '4px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#6C63FF', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>This week</button>
              )}
            </div>

            <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 12px', flexShrink: 0 }} />

            {/* ② View tabs */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 99, padding: 3, gap: 2 }}>
              {(['daily','weekly'] as ViewTab[]).map(tab => (
                <ModeBtn key={tab} active={viewTab === tab} onClick={() => setViewTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </ModeBtn>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* ③ Actions (always visible) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {viewTab === 'daily' && <IconBtn title="Export CSV"><Download width={15} height={15} /></IconBtn>}
              {viewTab === 'daily' && (
                <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  <Plus width={14} height={14} /> Add time
                </button>
              )}
              <button title="Filters" onClick={() => setFilterOpen(x => !x)}
                style={{ position: 'relative', width: 32, height: 32, border: `1px solid ${filterOpen ? '#6C63FF' : '#E8E8E8'}`, borderRadius: 8, background: filterOpen ? '#EEEDFF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: filterOpen ? '#6C63FF' : '#6B7280' }}>
                <SlidersHorizontal width={15} height={15} />
                {isFilterActive && <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#6C63FF', border: '1px solid #fff' }} />}
              </button>
              <IconBtn title="Settings"><Settings width={15} height={15} /></IconBtn>
            </div>
          </div>

          {/* Row 2 (daily only): Person/Team scope selector */}
          {viewTab === 'daily' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', background: '#EFEFEF', borderRadius: 99, padding: 3, gap: 2 }}>
                <ModeBtn active={mode==='person'} onClick={() => setMode('person')}><User width={12} height={12} /> Person</ModeBtn>
                <ModeBtn active={mode==='group'} onClick={() => setMode('group')}><Users width={12} height={12} /> Team</ModeBtn>
              </div>
              <div style={{ width: 1, height: 18, background: '#E5E7EB', flexShrink: 0 }} />
              {mode === 'person' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff' }}>
                    {worker && <Avatar w={worker} size={20} />}
                    <select value={wid} onChange={e => setWid(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent', cursor: 'pointer' }}>
                      {WORKERS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <Link to={peopleProfile(wid)} title="View profile"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff', color: '#6B7280', textDecoration: 'none', fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <ExternalLink width={12} height={12} /> View profile
                  </Link>
                </>
              ) : (
                <select value={tid} onChange={e => setTid(e.target.value)} style={{ padding: '4px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                  {TEAMS.map(t => <option key={t.id} value={t.id}>{t.name} — {t.client}</option>)}
                </select>
              )}
            </div>
          )}
        </div>


        {/* ── WEEKLY VIEW ── */}
        {viewTab === 'weekly' && (
          <WeeklyGrid
            weekStart={weekStart}
            workers={activeWorkers}
            entries={entries}
            onAddTime={openCreate}
            onEdit={openEdit}
            onSplit={splitEntry}
            onDelete={deleteEntry}
          />
        )}


        {/* ── DAY SECTIONS ── */}
        {viewTab === 'daily' && (byDate.size === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: '48px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
            No entries for this period.
          </div>
        ) : (
          Array.from(byDate.entries()).reverse().map(([date, dayEntries]) => {
            const dayWorkers = mode === 'group'
              ? activeWorkers.filter(w => dayEntries.some(e => e.workerId === w.id))
              : activeWorkers

            // For timeline, use the primary worker or first in group
            const tlWorker = mode === 'person' ? (activeWorkers[0] ?? WORKERS[0]) : activeWorkers[0]
            const tlEntries = mode === 'person' ? dayEntries : dayEntries.filter(e => e.workerId === activeWorkers[0]?.id)

            const dayTotal  = dayEntries.filter(e => e.entry_type === 'normal').reduce((s, e) => s + e.duration, 0)

            return (
              <div key={date} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E8E8E8', marginBottom: 16, overflow: 'hidden' }}>

                {/* Date header */}
                <div style={{ padding: '14px 24px 0' }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#111827' }}>
                    {fmtDateFull(date)}: {fmtDurHMS(dayTotal)}
                  </div>
                </div>

                {/* Timeline bar */}
                <DayTimeline entries={tlEntries} worker={tlWorker} />

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderTop: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', background: '#FAFAFA' }}>
                      <th style={{ ...TH, width: 36, paddingLeft: 16 }}>
                        <input type="checkbox" style={{ cursor: 'pointer' }} onChange={() => {}} />
                      </th>
                      <th style={{ ...TH, minWidth: 200 }}>Project</th>
                      <th style={TH}>Activity</th>
                      <th style={TH}>Idle</th>
                      <th style={TH}>Manual</th>
                      <th style={TH}>Duration</th>
                      <th style={TH}>Time</th>
                      <th style={{ ...TH, width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEntries.map(e => {
                      const w       = WORKERS.find(x => x.id === e.workerId)!
                      const wMins   = getWeekMins(e.workerId, e.date)
                      const overCap = wMins > WEEKLY_CAP
                      const isIdle  = e.entry_type === 'idle'
                      const isExp   = expanded === e.id

                      return <React.Fragment key={e.id}><tr
                          style={{ borderBottom: isExp ? 'none' : '1px solid #F5F5F5', background: isExp ? '#FAFAFA' : '#fff' }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: '12px 8px 12px 16px', width: 36 }}>
                            <input type="checkbox" checked={checked.has(e.id)} onChange={() => toggleCheck(e.id)} style={{ cursor: 'pointer' }} />
                          </td>

                          {/* Project */}
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar w={w} size={32} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                                    {isIdle ? (e.idle_reason || 'Idle time') : (e.project || '—')}
                                  </span>
                                  {!isIdle && e.project && (
                                    <Link to={ROUTES.projects} title={`Go to ${e.project}`}
                                      style={{ display: 'flex', alignItems: 'center', color: '#C4B5FD', textDecoration: 'none', flexShrink: 0 }}
                                      onMouseEnter={ev => (ev.currentTarget.style.color = '#6C63FF')}
                                      onMouseLeave={ev => (ev.currentTarget.style.color = '#C4B5FD')}
                                    >
                                      <ExternalLink width={12} height={12} />
                                    </Link>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em', marginTop: 1 }}>
                                  {showWorker
                                    ? <span style={{ color: '#9CA3AF' }}>{w.name}</span>
                                    : <Link
                                        to={clientPage(w.client)}
                                        style={{ color: '#9CA3AF', textDecoration: 'none' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                                      >
                                        {w.client}
                                      </Link>
                                  }
                                </div>
                                {isIdle && <div style={{ fontSize: 11, color: '#B45309', marginTop: 1 }}>Idle time</div>}
                              </div>
                            </div>
                          </td>

                          {/* Activity */}
                          <td style={{ padding: '12px 14px', fontSize: 13.5, color: isIdle ? '#D1D5DB' : '#374151' }}>
                            {isIdle ? '0%' : `${e.activity_rate}%`}
                          </td>

                          {/* Idle */}
                          <td style={{ padding: '12px 14px', fontSize: 13.5, color: isIdle ? '#D97706' : '#374151' }}>
                            {isIdle ? '100%' : '0%'}
                          </td>

                          {/* Manual */}
                          <td style={{ padding: '12px 14px', fontSize: 13.5, color: '#374151' }}>
                            {e.manual_rate}%
                          </td>

                          {/* Duration */}
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: 13.5, color: '#6C63FF', fontWeight: 500 }}>
                              {fmtDurHMS(e.duration)}
                            </span>
                            {e.billable && !isIdle && <HoverTooltip label="Billable"><span style={{ color: '#9CA3AF', marginLeft: 4, cursor: 'default' }}>$</span></HoverTooltip>}
                          </td>

                          {/* Time range */}
                          <td style={{ padding: '12px 14px', fontSize: 13.5, color: '#6C63FF' }}>
                            {fmtClock(e.start)} - {fmtClock(e.end)}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '12px 14px' }} onClick={ev => ev.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              {/* Expand */}
                              {(e.edit_log.length > 0 || e.notes) && (
                                <button
                                  onClick={() => setExpanded(x => x === e.id ? null : e.id)}
                                  title="Edit history"
                                  style={{ width: 28, height: 28, border: '1px solid #E8E8E8', borderRadius: 8, background: isExp ? '#EEEDFF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C63FF' }}
                                >
                                  <ChevronDown width={13} height={13} style={{ transform: isExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                                </button>
                              )}
                              {/* Actions dropdown */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={ev => {
                                    ev.stopPropagation()
                                    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect()
                                    setActionsOpen(x => x?.id === e.id ? null : { id: e.id, top: r.bottom + 4, right: window.innerWidth - r.right })
                                  }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 12.5, color: '#374151' }}
                                >
                                  Actions <ChevronDown width={11} height={11} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {isExp && <EntryDetails entry={e} colSpan={COL_SPAN} />}
                      </React.Fragment>
                    })}
                  </tbody>
                </table>
              </div>
            )
          })
        ))}
        <div style={{ height: 24 }} />
      </div>

      {modal && <EntryModal init={modal} workers={WORKERS} entries={entries} onSave={saveModal} onClose={() => setModal(null)} />}
      {splitModal && (() => { const w = WORKERS.find(x => x.id === splitModal.workerId) ?? WORKERS[0]; return <SplitModal entry={splitModal} worker={w} onSave={saveSplit} onClose={() => setSplitModal(null)} /> })()}

      {/* Fixed-position actions dropdown (portal-style, avoids overflow:hidden clipping) */}
      {actionsOpen && (() => {
        const e = entries.find(x => x.id === actionsOpen.id)
        if (!e) return null
        const isIdle = e.entry_type === 'idle'
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setActionsOpen(null)} />
            <div style={{ position: 'fixed', top: actionsOpen.top, right: actionsOpen.right, background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 130, overflow: 'hidden' }}>
              <DropItem icon={<Edit2 width={12} height={12} />} label="Edit" onClick={() => { openEdit(e); setActionsOpen(null) }} />
              {!isIdle && <DropItem icon={<Scissors width={12} height={12} />} label="Split shift" onClick={() => splitEntry(e)} />}
              <DropItem icon={<Trash2 width={12} height={12} />} label="Delete" onClick={() => { deleteEntry(e.id); setActionsOpen(null) }} danger />
            </div>
          </>
        )
      })()}

      {/* Filter Panel */}
      {filterOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setFilterOpen(false)} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 320, background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', zIndex: 200, transform: filterOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.25s', display: 'flex', flexDirection: 'column' }}
        onClick={ev => ev.stopPropagation()}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Filters</span>
          <button onClick={() => { setFilterEmployees([]); setFilterActivityMin(0); setFilterActivityMax(100); setFilterTimeTypes(new Set()); setFilterActivityLevels(new Set()) }} style={{ fontSize: 12, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear all</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {/* Person / Client / Group */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Person / Client / Group</div>
            <select
              value={filterEmployees.length === 0 ? '' : (filterEmployees.length === 1 ? `w:${filterEmployees[0]}` : (TEAMS.find(t => t.workerIds.every(id => filterEmployees.includes(id)) && t.workerIds.length === filterEmployees.length) ? `g:${TEAMS.find(t => t.workerIds.every(id => filterEmployees.includes(id)) && t.workerIds.length === filterEmployees.length)!.id}` : `c:${WORKERS.find(w => filterEmployees.includes(w.id))?.client ?? ''}`))}
              onChange={ev => {
                const v = ev.target.value
                if (!v) { setFilterEmployees([]); return }
                if (v.startsWith('w:')) { setFilterEmployees([v.slice(2)]); return }
                if (v.startsWith('c:')) { const cn = v.slice(2); setFilterEmployees(WORKERS.filter(w => w.client === cn).map(w => w.id)); return }
                if (v.startsWith('g:')) { const gid = v.slice(2); const t = TEAMS.find(t => t.id === gid); setFilterEmployees(t ? t.workerIds : []); return }
              }}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff' }}
            >
              <option value="">All</option>
              {WORKERS.map(w => <option key={w.id} value={`w:${w.id}`}>{w.name}</option>)}
              {Array.from(new Set(WORKERS.map(w => w.client))).map(cn => <option key={`c:${cn}`} value={`c:${cn}`}>Client: {cn}</option>)}
              {TEAMS.map(t => <option key={t.id} value={`g:${t.id}`}>Team: {t.name}</option>)}
            </select>
          </div>

          {/* Activity Rate */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Activity Rate</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Min %</label>
                <input type="number" min={0} max={100} value={filterActivityMin} onChange={ev => setFilterActivityMin(Math.min(Number(ev.target.value), filterActivityMax))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 4 }}>Max %</label>
                <input type="number" min={0} max={100} value={filterActivityMax} onChange={ev => setFilterActivityMax(Math.max(Number(ev.target.value), filterActivityMin))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 13, color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Time Type */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Time Type</div>
            {['Normal','Idle','Manual','Break'].map(type => (
              <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={filterTimeTypes.has(type)} onChange={ev => setFilterTimeTypes(prev => { const next = new Set(prev); ev.target.checked ? next.add(type) : next.delete(type); return next })} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                {type}
              </label>
            ))}
          </div>

          {/* Activity Levels */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Activity Level</div>
            {['Low','Medium','High'].map(lvl => (
              <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input type="checkbox" checked={filterActivityLevels.has(lvl)} onChange={ev => setFilterActivityLevels(prev => { const next = new Set(prev); ev.target.checked ? next.add(lvl) : next.delete(lvl); return next })} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                {lvl}{lvl === 'Low' ? ' (<50%)' : lvl === 'Medium' ? ' (50–75%)' : ' (>75%)'}
              </label>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E8E8E8' }}>
          <button onClick={() => setFilterOpen(false)} style={{ width: '100%', padding: '9px', border: 'none', borderRadius: 8, background: '#6C63FF', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Apply</button>
        </div>
      </div>
    </div>
  )
}

// ── Tiny helpers ──
function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ width: 28, height: 28, border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>{children}</button>
}
function IconBtn({ children, title }: { children: React.ReactNode; title?: string }) {
  return <button title={title} style={{ width: 32, height: 32, border: '1px solid #E8E8E8', borderRadius: 8, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>{children}</button>
}
function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', border: 'none', borderRadius: 99, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: active ? '#fff' : 'transparent', color: active ? '#111827' : '#6B7280', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{children}</button>
}
function DropItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, color: danger ? '#EF4444' : '#374151', textAlign: 'left' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? '#FEF2F2' : '#F9FAFB')}
      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
    >{icon} {label}</button>
  )
}

function HoverTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 600) }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setVisible(false) }}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute', bottom: '140%', left: '50%', transform: 'translateX(-50%)',
          background: '#1F2937', color: '#fff', fontSize: 11, fontWeight: 500,
          padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {label}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #1F2937' }} />
        </span>
      )}
    </span>
  )
}

const TH: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }
