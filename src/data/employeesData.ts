import { CLIENT_MAP } from './clientsData'

export type ScheduleType = 'fixed' | 'free' | 'free-overlap'
export type EmployeeStatus = 'active' | 'inactive' | 'onboarding'

// Internal org grouping — independent of which client they serve
export type Team = 'abroadworker' | 'chabadworker'

export const TEAM_LABELS: Record<Team, string> = {
  abroadworker: 'Abroadworkers',
  chabadworker: 'Chabadworkers',
}

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  fixed:          'Fixed shift',
  free:           'Free schedule',
  'free-overlap': 'Overlap',
}

export interface OverlapBlock {
  label: string
  startUTC: number
  endUTC: number
}

// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface DaySchedule {
  startUTC: number
  endUTC: number
}

export interface ShiftMove {
  id: string
  moveType: 'time-adjust' | 'day-move'
  fromDate: string    // YYYY-MM-DD — date being adjusted or skipped
  toDate?: string     // YYYY-MM-DD — replacement workday (day-move only)
  newStart: string    // HH:mm — new start time on the target day
  newEnd: string      // HH:mm — new end time on the target day
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  initials: string
  bg: string
  fg: string
  role: string
  team: Team
  clientId: string          // points to CLIENTS — each client is individual
  status: EmployeeStatus
  scheduleType: ScheduleType
  shiftStartUTC: number | null  // legacy — use workDays when present
  shiftEndUTC: number | null
  workDays?: Partial<Record<DayOfWeek, DaySchedule>>  // per-day schedule
  overlapBlocks: OverlapBlock[]
  projects: string[]
  homeTimezone: string      // IANA tz, worker's own clock
  note?: string
  shiftMoves?: ShiftMove[]
}

// Returns today's (or a given day's) scheduled hours for a fixed employee.
// Falls back to legacy shiftStartUTC/shiftEndUTC for Mon–Fri when workDays is absent.
export function getScheduleForDay(emp: Employee, dow: DayOfWeek): DaySchedule | null {
  if (emp.scheduleType !== 'fixed') return null
  if (emp.workDays && Object.keys(emp.workDays).length > 0) {
    return emp.workDays[dow] ?? null
  }
  if (dow >= 1 && dow <= 5 && emp.shiftStartUTC != null && emp.shiftEndUTC != null) {
    return { startUTC: emp.shiftStartUTC, endUTC: emp.shiftEndUTC }
  }
  return null
}

export function getWorkDayList(emp: Employee): DayOfWeek[] {
  if (emp.scheduleType !== 'fixed') return []
  if (emp.workDays && Object.keys(emp.workDays).length > 0) {
    return (Object.keys(emp.workDays).map(Number) as DayOfWeek[]).sort((a, b) => {
      const order: Record<DayOfWeek, number> = { 1:0,2:1,3:2,4:3,5:4,6:5,0:6 }
      return order[a] - order[b]
    })
  }
  if (emp.shiftStartUTC != null) return [1, 2, 3, 4, 5]
  return []
}

// ── helpers ──────────────────────────────────────────────────────────────────

export function fmtUTCHour(utcH: number, displayTzOffset: number): string {
  const h = ((utcH + displayTzOffset) % 24 + 24) % 24
  const hr  = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  const ampm = hr >= 12 ? 'pm' : 'am'
  const h12  = hr % 12 === 0 ? 12 : hr % 12
  return min === 0 ? `${h12}${ampm}` : `${h12}:${String(min).padStart(2, '0')}${ampm}`
}

export function displayOffset(tz: 'EST' | 'PH' | 'LOCAL'): number {
  if (tz === 'EST')   return -5
  if (tz === 'PH')    return  8
  return -new Date().getTimezoneOffset() / 60
}

// ── mock data — representative sample of a large workforce ──────────────────
// In production this would come from an API with server-side pagination.

function emp(
  id: string, name: string, initials: string, bg: string, fg: string,
  role: string, team: Team, clientId: string, status: EmployeeStatus,
  scheduleType: ScheduleType, shiftStartUTC: number | null, shiftEndUTC: number | null,
  overlapBlocks: OverlapBlock[], projects: string[], homeTimezone: string,
): Employee {
  return { id, name, initials, bg, fg, role, team, clientId, status, scheduleType, shiftStartUTC, shiftEndUTC, overlapBlocks, projects, homeTimezone }
}

export const EMPLOYEES: Employee[] = [
  // ── Acme Corp ──────────────────────────────────────────────────────────────
  emp('e001','Maria Santos',    'MS','#DBEAFE','#1E40AF','Operations Manager',  'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['Internal Ops','HR Processes'],            'America/New_York'),
  emp('e002','James Rivera',    'JR','#D1FAE5','#065F46','Backend Engineer',    'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['API Integration','Mobile App v2'],        'America/New_York'),
  emp('e003','Carla Reyes',     'CR','#FEF3C7','#92400E','Product Designer',    'abroadworker','cl-acme',    'active',     'free-overlap', null,null,[{label:'Design sync',startUTC:15,endUTC:16},{label:'Sprint review',startUTC:18,endUTC:19}], ['Dashboard UI','Client Portal Redesign'],  'America/New_York'),
  emp('e004','Tom Nguyen',      'TN','#EDE9FE','#5B21B6','Project Manager',     'abroadworker','cl-acme',    'active',     'free',         null,null,[],                                                                           ['Website Redesign','Security Audit'],      'America/New_York'),
  emp('e005','Grace Kim',       'GK','#FAEEDA','#633806','QA Lead',             'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['Mobile App QA'],                          'America/New_York'),
  emp('e006','Daniel Abreu',    'DA','#FAECE7','#712B13','Copywriter',          'abroadworker','cl-acme',    'active',     'free-overlap', null,null,[{label:'Editorial call',startUTC:16,endUTC:17}],                          ['Content Strategy'],                       'America/New_York'),

  // ── Vero Health ────────────────────────────────────────────────────────────
  emp('e007','Rachel Cohen',    'RC','#ECFDF5','#064E3B','QA Engineer',         'chabadworker','cl-vero',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App QA','API Integration'],        'Asia/Manila'),
  emp('e008','Avi Goldstein',   'AG','#FCE7F3','#9D174D','Frontend Developer',  'chabadworker','cl-vero',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App v2','Onboarding Flow v2'],     'Asia/Manila'),
  emp('e009','Yael Mizrahi',    'YM','#FFF7ED','#9A3412','Content Strategist',  'chabadworker','cl-vero',    'active',     'free-overlap', null,null,[{label:'Content review',startUTC:2,endUTC:3},{label:'Client call',startUTC:5,endUTC:6}],    ['Content Strategy','Brand Identity'],      'Asia/Manila'),
  emp('e010','Moshe Bender',    'MB','#F0F9FF','#0C4A6E','Data Analyst',        'chabadworker','cl-vero',    'active',     'free',         null,null,[],                                                                           ['Analytics Setup','Reporting Dashboard'],  'Asia/Manila'),

  // ── BlueSky Ltd ────────────────────────────────────────────────────────────
  emp('e011','Tomás García',    'TG','#F5F3FF','#4C1D95','UI Designer',         'abroadworker','cl-bluesky', 'active',     'fixed',        14,22,[],                                                                           ['Website Redesign'],                       'America/New_York'),
  emp('e012','Nina Patel',      'NP','#FFF1F2','#9F1239','Product Manager',     'abroadworker','cl-bluesky', 'active',     'free-overlap', null,null,[{label:'Client standup',startUTC:14,endUTC:15},{label:'Sprint planning',startUTC:17,endUTC:18.5}], ['Brand Identity','Dashboard UI'],        'America/New_York'),
  emp('e013','Marcus Webb',     'MW','#E6F1FB','#0C447C','Backend Engineer',    'abroadworker','cl-bluesky', 'active',     'fixed',        14,22,[],                                                                           ['API Integration','Security Audit'],       'America/New_York'),

  // ── Nova Media ─────────────────────────────────────────────────────────────
  emp('e014','Amara Osei',      'AO','#FFFBEB','#78350F','Copywriter',          'abroadworker','cl-nova',    'active',     'free',         null,null,[],                                                                           ['Content Strategy'],                       'America/New_York'),
  emp('e015','Elena Volkov',    'EV','#FBEAF0','#72243E','QA Engineer',         'abroadworker','cl-nova',    'active',     'fixed',        13,21,[],                                                                           ['Mobile App QA'],                          'America/New_York'),
  emp('e016','Priya Nair',      'PN','#EAF3DE','#27500A','UX Researcher',       'abroadworker','cl-nova',    'active',     'free-overlap', null,null,[{label:'Research sync',startUTC:15,endUTC:16}],                           ['Dashboard UI'],                           'America/New_York'),

  // ── Brex Inc ───────────────────────────────────────────────────────────────
  emp('e017','Luca Ferrari',    'LF','#F0FDF4','#14532D','Backend Engineer',    'chabadworker','cl-brex',    'active',     'fixed',         1, 9,[],                                                                           ['API Integration','Security Audit'],       'Asia/Manila'),
  emp('e018','Hana Sato',       'HS','#FFF1F2','#881337','Product Manager',     'chabadworker','cl-brex',    'active',     'free-overlap', null,null,[{label:'Scrum',startUTC:2,endUTC:2.5}],                                  ['Onboarding Flow v2'],                     'Asia/Manila'),
  emp('e019','Ray Tanaka',      'RT','#EEEDFE','#3C3489','Scrum Master',        'chabadworker','cl-brex',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App v2'],                          'Asia/Manila'),

  // ── Kabad Works ────────────────────────────────────────────────────────────
  emp('e020','Sofia Muller',    'SM','#FAEEDA','#633806','Data Analyst',        'chabadworker','cl-kabad',   'active',     'fixed',         1, 9,[],                                                                           ['Analytics Setup'],                        'Asia/Manila'),
  emp('e021','Kira Okonkwo',    'KO','#E6F1FB','#0C447C','Systems Engineer',   'chabadworker','cl-kabad',   'active',     'fixed',         2,10,[],                                                                           ['API Integration'],                        'Asia/Manila'),
  emp('e022','Ben Hoang',       'BH','#D1FAE5','#065F46','DevOps Engineer',     'chabadworker','cl-kabad',   'onboarding', 'fixed',         1, 9,[],                                                                           ['Security Audit'],                         'Asia/Manila'),

  // ── Stellar Systems ────────────────────────────────────────────────────────
  emp('e023','James Okafor',    'JO','#EAF3DE','#27500A','Frontend Developer', 'abroadworker','cl-stellar',  'active',     'fixed',        14,22,[],                                                                           ['Client Portal Redesign'],                 'America/New_York'),
  emp('e024','Diana Cruz',      'DC','#FCE7F3','#9D174D','Business Analyst',   'abroadworker','cl-stellar',  'active',     'free-overlap', null,null,[{label:'Weekly review',startUTC:16,endUTC:17}],                          ['Reporting Dashboard'],                    'America/New_York'),

  // ── Pinewave Digital ───────────────────────────────────────────────────────
  emp('e025','Leo Park',        'LP','#F5F3FF','#4C1D95','E-commerce Dev',     'chabadworker','cl-pinewave', 'active',     'fixed',         2,10,[],                                                                           ['Website Redesign'],                       'Asia/Manila'),
  emp('e026','Amy Chen',        'AC','#FFF7ED','#9A3412','SEO Specialist',     'abroadworker','cl-pinewave', 'active',     'free',         null,null,[],                                                                           ['Content Strategy'],                       'America/New_York'),

  // ── Orbis Analytics (onboarding) ───────────────────────────────────────────
  emp('e027','Paulo Lim',       'PL','#ECFDF5','#064E3B','Data Engineer',      'chabadworker','cl-orbis',    'onboarding', 'fixed',         1, 9,[],                                                                           ['Analytics Setup'],                        'Asia/Manila'),
  emp('e028','Sara Ferreira',   'SF','#DBEAFE','#1E40AF','Product Designer',   'abroadworker','cl-orbis',    'onboarding', 'free-overlap', null,null,[{label:'Kickoff call',startUTC:15,endUTC:16}],                           ['Dashboard UI'],                           'America/New_York'),

  // ── Redpeak Ventures ───────────────────────────────────────────────────────
  emp('e029','Carlos Mendez',   'CM','#EDE9FE','#5B21B6','Finance Analyst',    'abroadworker','cl-redpeak',  'active',     'fixed',        14,22,[],                                                                           ['Reporting Dashboard'],                    'America/New_York'),
  emp('e030','Aisha Kamara',    'AK','#FFFBEB','#78350F','Legal Reviewer',     'abroadworker','cl-redpeak',  'active',     'free',         null,null,[],                                                                           ['Internal Ops'],                           'America/New_York'),

  // ── Root Education (onboarding) ────────────────────────────────────────────
  emp('e031','Mia Tanaka',      'MT','#F0F9FF','#0C4A6E','Instructional Designer','chabadworker','cl-root',  'onboarding', 'fixed',         2,10,[],                                                                           ['Onboarding Flow v2'],                     'Asia/Manila'),

  // ── Internal ───────────────────────────────────────────────────────────────
  emp('e032','Yoshita K.',      'YK','#F5F3FF','#4C1D95','Admin',              'abroadworker','internal',    'active',     'fixed',        14,22,[],                                                                           ['Internal Ops','HR Processes'],            'America/New_York'),
  emp('e033','Ops Bot',         'OB','#F3F4F6','#6B7280','Automation',         'abroadworker','internal',    'active',     'free',         null,null,[],                                                                           ['Internal Ops'],                           'America/New_York'),
]

// ── Derived lookups ───────────────────────────────────────────────────────────

export const EMPLOYEE_MAP = Object.fromEntries(EMPLOYEES.map(e => [e.id, e])) as Record<string, Employee>

/** All unique project names across all employees */
export const ALL_PROJECTS = [...new Set(EMPLOYEES.flatMap(e => e.projects))].sort()

/** All unique client IDs that actually have employees */
export const ACTIVE_CLIENT_IDS = [...new Set(EMPLOYEES.map(e => e.clientId))]
