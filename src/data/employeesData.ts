import { CLIENT_MAP } from './clientsData'

export type ScheduleType = 'fixed' | 'free' | 'free-overlap'
export type EmployeeStatus = 'active' | 'inactive' | 'onboarding'
export type PayType = 'hourly' | 'monthly'
export type EmploymentType = 'full-time' | 'part-time' | 'contractor'

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

export interface AdjustmentSlot {
  dateFrom: string  // YYYY-MM-DD
  dateTo: string    // YYYY-MM-DD (same as dateFrom for single day)
  start: string     // HH:mm
  end: string       // HH:mm
}

export interface ScheduleAdjustment {
  id: string
  employeeId: string
  originalDates: string[]      // YYYY-MM-DD[] — dates being replaced/skipped
  replacementSlots: AdjustmentSlot[]  // new work slots (can be multiple for splits)
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Employee {
  id: string
  name: string
  email: string
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
  scheduleAdjustments?: ScheduleAdjustment[]
  // People page fields
  employmentType: EmploymentType
  payType: PayType
  billRate: number          // USD/hr
  payRate: number           // USD/hr or USD/month depending on payType
  timeTrackingEnabled: boolean
  dateJoined: string        // YYYY-MM-DD
  scheduleLimit?: {
    weeklyHours?: number    // max hours per week, e.g. 40
    dailyHours?: number     // max hours per day, e.g. 8
  }
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
  id: string, name: string, email: string, initials: string, bg: string, fg: string,
  role: string, team: Team, clientId: string, status: EmployeeStatus,
  scheduleType: ScheduleType, shiftStartUTC: number | null, shiftEndUTC: number | null,
  overlapBlocks: OverlapBlock[], projects: string[], homeTimezone: string,
  employmentType: EmploymentType, payType: PayType, billRate: number, payRate: number,
  timeTrackingEnabled: boolean, dateJoined: string,
): Employee {
  return { id, name, email, initials, bg, fg, role, team, clientId, status, scheduleType, shiftStartUTC, shiftEndUTC, overlapBlocks, projects, homeTimezone, employmentType, payType, billRate, payRate, timeTrackingEnabled, dateJoined }
}

export const SCHEDULE_ADJUSTMENTS: ScheduleAdjustment[] = [
  {
    // Maria is covering for a colleague this week — shifted to earlier hours Jun 16–20
    id: 'adj-001',
    employeeId: 'e001',
    originalDates: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
    replacementSlots: [{ dateFrom: '2026-06-16', dateTo: '2026-06-20', start: '07:00', end: '15:00' }],
    reason: 'Covering early-morning handoff for a colleague on leave this week — temporarily shifted to 7am–3pm',
    status: 'approved',
    createdAt: '2026-06-12T09:00:00Z',
  },
  {
    // James swapping one day
    id: 'adj-002',
    employeeId: 'e002',
    originalDates: ['2026-06-16'],
    replacementSlots: [{ dateFrom: '2026-06-20', dateTo: '2026-06-20', start: '09:00', end: '17:00' }],
    reason: 'Taking Monday off for a medical appointment, making it up on Saturday',
    status: 'approved',
    createdAt: '2026-06-11T14:00:00Z',
  },
]

export const EMPLOYEES: Employee[] = [
  // ── Acme Corp ──────────────────────────────────────────────────────────────
  //                id        name              email                              ini   bg         fg         role                  team            clientId     status      sched          sUTC eUTC overlap                                                                                               projects                                    tz                  empType        payType    bill  pay     tt      joined
  { ...emp('e001','Maria Santos',    'maria.santos@abroadworks.com',    'MS','#DBEAFE','#1E40AF','Operations Manager',  'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['Internal Ops','HR Processes'],            'America/New_York', 'full-time',  'monthly',  85,  5200, true,  '2021-03-15'), scheduleAdjustments: SCHEDULE_ADJUSTMENTS.filter(a => a.employeeId === 'e001') },
  { ...emp('e002','James Rivera',    'james.rivera@abroadworks.com',    'JR','#D1FAE5','#065F46','Backend Engineer',    'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['API Integration','Mobile App v2'],        'America/New_York', 'full-time',  'hourly',   90,  45,   true,  '2021-06-01'), scheduleAdjustments: SCHEDULE_ADJUSTMENTS.filter(a => a.employeeId === 'e002') },
  emp('e003','Carla Reyes',     'carla.reyes@abroadworks.com',     'CR','#FEF3C7','#92400E','Product Designer',    'abroadworker','cl-acme',    'active',     'free-overlap', null,null,[{label:'Design sync',startUTC:15,endUTC:16},{label:'Sprint review',startUTC:18,endUTC:19}], ['Dashboard UI','Client Portal Redesign'],  'America/New_York', 'full-time',  'hourly',   75,  38,   true,  '2022-01-10'),
  emp('e004','Tom Nguyen',      'tom.nguyen@abroadworks.com',      'TN','#EDE9FE','#5B21B6','Project Manager',     'abroadworker','cl-acme',    'active',     'free',         null,null,[],                                                                           ['Website Redesign','Security Audit'],      'America/New_York', 'full-time',  'monthly',  95,  6000, false, '2020-11-20'),
  emp('e005','Grace Kim',       'grace.kim@abroadworks.com',       'GK','#FAEEDA','#633806','QA Lead',             'abroadworker','cl-acme',    'active',     'fixed',        14,22,[],                                                                           ['Mobile App QA'],                          'America/New_York', 'full-time',  'hourly',   65,  32,   true,  '2022-04-05'),
  emp('e006','Daniel Abreu',    'daniel.abreu@abroadworks.com',    'DA','#FAECE7','#712B13','Copywriter',          'abroadworker','cl-acme',    'active',     'free-overlap', null,null,[{label:'Editorial call',startUTC:16,endUTC:17}],                          ['Content Strategy'],                       'America/New_York', 'part-time',  'hourly',   55,  28,   false, '2023-02-14'),

  // ── Vero Health ────────────────────────────────────────────────────────────
  emp('e007','Rachel Cohen',    'rachel.cohen@abroadworks.com',    'RC','#ECFDF5','#064E3B','QA Engineer',         'chabadworker','cl-vero',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App QA','API Integration'],        'Asia/Manila',      'full-time',  'hourly',   70,  35,   true,  '2021-09-01'),
  emp('e008','Avi Goldstein',   'avi.goldstein@abroadworks.com',   'AG','#FCE7F3','#9D174D','Frontend Developer',  'chabadworker','cl-vero',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App v2','Onboarding Flow v2'],     'Asia/Manila',      'full-time',  'hourly',   80,  40,   true,  '2021-07-12'),
  emp('e009','Yael Mizrahi',    'yael.mizrahi@abroadworks.com',    'YM','#FFF7ED','#9A3412','Content Strategist',  'chabadworker','cl-vero',    'active',     'free-overlap', null,null,[{label:'Content review',startUTC:2,endUTC:3},{label:'Client call',startUTC:5,endUTC:6}],    ['Content Strategy','Brand Identity'],      'Asia/Manila',      'contractor', 'hourly',   60,  30,   false, '2022-05-20'),
  emp('e010','Moshe Bender',    'moshe.bender@abroadworks.com',    'MB','#F0F9FF','#0C4A6E','Data Analyst',        'chabadworker','cl-vero',    'active',     'free',         null,null,[],                                                                           ['Analytics Setup','Reporting Dashboard'],  'Asia/Manila',      'full-time',  'monthly',  85,  4800, true,  '2022-03-08'),

  // ── BlueSky Ltd ────────────────────────────────────────────────────────────
  emp('e011','Tomás García',    'tomas.garcia@abroadworks.com',    'TG','#F5F3FF','#4C1D95','UI Designer',         'abroadworker','cl-bluesky', 'active',     'fixed',        14,22,[],                                                                           ['Website Redesign'],                       'America/New_York', 'full-time',  'hourly',   75,  38,   true,  '2022-06-01'),
  emp('e012','Nina Patel',      'nina.patel@abroadworks.com',      'NP','#FFF1F2','#9F1239','Product Manager',     'abroadworker','cl-bluesky', 'active',     'free-overlap', null,null,[{label:'Client standup',startUTC:14,endUTC:15},{label:'Sprint planning',startUTC:17,endUTC:18.5}], ['Brand Identity','Dashboard UI'],        'America/New_York', 'full-time',  'monthly',  100, 6500, true,  '2021-10-15'),
  emp('e013','Marcus Webb',     'marcus.webb@abroadworks.com',     'MW','#E6F1FB','#0C447C','Backend Engineer',    'abroadworker','cl-bluesky', 'active',     'fixed',        14,22,[],                                                                           ['API Integration','Security Audit'],       'America/New_York', 'contractor', 'hourly',   95,  50,   true,  '2023-01-03'),

  // ── Nova Media ─────────────────────────────────────────────────────────────
  emp('e014','Amara Osei',      'amara.osei@abroadworks.com',      'AO','#FFFBEB','#78350F','Copywriter',          'abroadworker','cl-nova',    'active',     'free',         null,null,[],                                                                           ['Content Strategy'],                       'America/New_York', 'part-time',  'hourly',   50,  25,   false, '2023-04-17'),
  emp('e015','Elena Volkov',    'elena.volkov@abroadworks.com',    'EV','#FBEAF0','#72243E','QA Engineer',         'abroadworker','cl-nova',    'active',     'fixed',        13,21,[],                                                                           ['Mobile App QA'],                          'America/New_York', 'full-time',  'hourly',   68,  34,   true,  '2022-08-22'),
  emp('e016','Priya Nair',      'priya.nair@abroadworks.com',      'PN','#EAF3DE','#27500A','UX Researcher',       'abroadworker','cl-nova',    'active',     'free-overlap', null,null,[{label:'Research sync',startUTC:15,endUTC:16}],                           ['Dashboard UI'],                           'America/New_York', 'contractor', 'hourly',   80,  40,   false, '2023-03-01'),

  // ── Brex Inc ───────────────────────────────────────────────────────────────
  emp('e017','Luca Ferrari',    'luca.ferrari@abroadworks.com',    'LF','#F0FDF4','#14532D','Backend Engineer',    'chabadworker','cl-brex',    'active',     'fixed',         1, 9,[],                                                                           ['API Integration','Security Audit'],       'Asia/Manila',      'full-time',  'hourly',   88,  44,   true,  '2021-12-01'),
  emp('e018','Hana Sato',       'hana.sato@abroadworks.com',       'HS','#FFF1F2','#881337','Product Manager',     'chabadworker','cl-brex',    'active',     'free-overlap', null,null,[{label:'Scrum',startUTC:2,endUTC:2.5}],                                  ['Onboarding Flow v2'],                     'Asia/Manila',      'full-time',  'monthly',  95,  5800, true,  '2022-02-14'),
  emp('e019','Ray Tanaka',      'ray.tanaka@abroadworks.com',      'RT','#EEEDFE','#3C3489','Scrum Master',        'chabadworker','cl-brex',    'active',     'fixed',         1, 9,[],                                                                           ['Mobile App v2'],                          'Asia/Manila',      'full-time',  'monthly',  90,  5500, true,  '2022-07-18'),

  // ── Kabad Works ────────────────────────────────────────────────────────────
  emp('e020','Sofia Muller',    'sofia.muller@abroadworks.com',    'SM','#FAEEDA','#633806','Data Analyst',        'chabadworker','cl-kabad',   'active',     'fixed',         1, 9,[],                                                                           ['Analytics Setup'],                        'Asia/Manila',      'full-time',  'hourly',   72,  36,   true,  '2022-09-05'),
  emp('e021','Kira Okonkwo',    'kira.okonkwo@abroadworks.com',    'KO','#E6F1FB','#0C447C','Systems Engineer',   'chabadworker','cl-kabad',   'active',     'fixed',         2,10,[],                                                                           ['API Integration'],                        'Asia/Manila',      'full-time',  'hourly',   92,  46,   true,  '2021-05-10'),
  emp('e022','Ben Hoang',       'ben.hoang@abroadworks.com',       'BH','#D1FAE5','#065F46','DevOps Engineer',     'chabadworker','cl-kabad',   'onboarding', 'fixed',         1, 9,[],                                                                           ['Security Audit'],                         'Asia/Manila',      'full-time',  'hourly',   85,  42,   true,  '2024-01-08'),

  // ── Stellar Systems ────────────────────────────────────────────────────────
  emp('e023','James Okafor',    'james.okafor@abroadworks.com',    'JO','#EAF3DE','#27500A','Frontend Developer', 'abroadworker','cl-stellar',  'active',     'fixed',        14,22,[],                                                                           ['Client Portal Redesign'],                 'America/New_York', 'full-time',  'hourly',   78,  39,   true,  '2022-11-07'),
  emp('e024','Diana Cruz',      'diana.cruz@abroadworks.com',      'DC','#FCE7F3','#9D174D','Business Analyst',   'abroadworker','cl-stellar',  'active',     'free-overlap', null,null,[{label:'Weekly review',startUTC:16,endUTC:17}],                          ['Reporting Dashboard'],                    'America/New_York', 'full-time',  'monthly',  88,  5300, false, '2022-10-03'),

  // ── Pinewave Digital ───────────────────────────────────────────────────────
  emp('e025','Leo Park',        'leo.park@abroadworks.com',        'LP','#F5F3FF','#4C1D95','E-commerce Dev',     'chabadworker','cl-pinewave', 'active',     'fixed',         2,10,[],                                                                           ['Website Redesign'],                       'Asia/Manila',      'contractor', 'hourly',   82,  41,   true,  '2023-06-12'),
  emp('e026','Amy Chen',        'amy.chen@abroadworks.com',        'AC','#FFF7ED','#9A3412','SEO Specialist',     'abroadworker','cl-pinewave', 'active',     'free',         null,null,[],                                                                           ['Content Strategy'],                       'America/New_York', 'part-time',  'hourly',   55,  28,   false, '2023-08-21'),

  // ── Orbis Analytics (onboarding) ───────────────────────────────────────────
  emp('e027','Paulo Lim',       'paulo.lim@abroadworks.com',       'PL','#ECFDF5','#064E3B','Data Engineer',      'chabadworker','cl-orbis',    'onboarding', 'fixed',         1, 9,[],                                                                           ['Analytics Setup'],                        'Asia/Manila',      'full-time',  'hourly',   86,  43,   true,  '2024-02-01'),
  emp('e028','Sara Ferreira',   'sara.ferreira@abroadworks.com',   'SF','#DBEAFE','#1E40AF','Product Designer',   'abroadworker','cl-orbis',    'onboarding', 'free-overlap', null,null,[{label:'Kickoff call',startUTC:15,endUTC:16}],                           ['Dashboard UI'],                           'America/New_York', 'full-time',  'hourly',   74,  37,   true,  '2024-02-15'),

  // ── Redpeak Ventures ───────────────────────────────────────────────────────
  emp('e029','Carlos Mendez',   'carlos.mendez@abroadworks.com',   'CM','#EDE9FE','#5B21B6','Finance Analyst',    'abroadworker','cl-redpeak',  'active',     'fixed',        14,22,[],                                                                           ['Reporting Dashboard'],                    'America/New_York', 'full-time',  'monthly',  90,  5600, true,  '2021-08-30'),
  emp('e030','Aisha Kamara',    'aisha.kamara@abroadworks.com',    'AK','#FFFBEB','#78350F','Legal Reviewer',     'abroadworker','cl-redpeak',  'active',     'free',         null,null,[],                                                                           ['Internal Ops'],                           'America/New_York', 'contractor', 'hourly',   100, 50,   false, '2022-12-05'),

  // ── Root Education (onboarding) ────────────────────────────────────────────
  emp('e031','Mia Tanaka',      'mia.tanaka@abroadworks.com',      'MT','#F0F9FF','#0C4A6E','Instructional Designer','chabadworker','cl-root',  'onboarding', 'fixed',         2,10,[],                                                                           ['Onboarding Flow v2'],                     'Asia/Manila',      'full-time',  'monthly',  78,  4500, true,  '2024-03-10'),

  // ── Internal ───────────────────────────────────────────────────────────────
  emp('e032','Yoshita K.',      'yoshita@abroadworks.com',         'YK','#F5F3FF','#4C1D95','Admin',              'abroadworker','internal',    'active',     'fixed',        14,22,[],                                                                           ['Internal Ops','HR Processes'],            'America/New_York', 'full-time',  'monthly',  0,   7000, true,  '2020-01-01'),
  emp('e033','Ops Bot',         'ops@abroadworks.com',             'OB','#F3F4F6','#6B7280','Automation',         'abroadworker','internal',    'active',     'free',         null,null,[],                                                                           ['Internal Ops'],                           'America/New_York', 'contractor', 'hourly',   0,   0,    true,  '2020-06-01'),
]

// ── Derived lookups ───────────────────────────────────────────────────────────

export const EMPLOYEE_MAP = Object.fromEntries(EMPLOYEES.map(e => [e.id, e])) as Record<string, Employee>

/** All unique project names across all employees */
export const ALL_PROJECTS = [...new Set(EMPLOYEES.flatMap(e => e.projects))].sort()

/** All unique client IDs that actually have employees */
export const ACTIVE_CLIENT_IDS = [...new Set(EMPLOYEES.map(e => e.clientId))]
