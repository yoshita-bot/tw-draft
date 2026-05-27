import type { Person } from './mockProjects'
import { TEAM_MEMBERS, CURRENT_USER } from './mockProjects'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StatCard {
  id: string
  label: string
  value: string
  subtext: string
  trend: 'up' | 'down' | 'neutral'
  iconName: 'clock' | 'calendar' | 'users' | 'dollar' | 'activity' | 'target'
  highlight?: boolean
}

export interface DailyBarPoint {
  date: string
  label: string
  dayLabel: string
  hours: number
}

export interface TeamMemberRow {
  member: Person
  dailyHours: number[]
  totalHours: number
  hasTracked: boolean
  hasManual: boolean
}

export type MemberLiveStatus = 'active' | 'idle' | 'break' | 'offline'

export interface TeamMemberLive {
  member: Person
  status: MemberLiveStatus
  currentProject?: string
  currentTask?: string
  todayHours: number
  activityPct: number
  lastSeen?: string
}

export interface ActivitySegment {
  label: string
  pct: number
  color: string
}

export interface ProjectBar {
  name: string
  color: string
  hours: number
  maxHours: number
}

export interface AttendanceData {
  onTime: number
  late: number
  absent: number
  total: number
  onTimeMembers: Person[]
  lateMembers: Person[]
  absentMembers: Person[]
}

// ── New org-scale types ───────────────────────────────────────────────────────

export interface OrgAttendance {
  onTime: number
  late: number
  absent: number
  total: number
}

export interface WorkforceStatus {
  active: number
  idle: number
  onBreak: number
  offline: number
  total: number
}

export interface DepartmentRow {
  name: string
  color: string
  headcount: number
  online: number       // active + idle + break
  hoursToday: number
  avgActivity: number  // 0–100
  billablePct: number  // 0–100
}

export interface DashboardData {
  dateRange: { startDate: string; endDate: string; label: string }
  meStats: StatCard[]
  allStats: StatCard[]
  chartPoints: DailyBarPoint[]       // Me view — personal hours
  allChartPoints: DailyBarPoint[]    // All view — org-scale hours
  teamRows: TeamMemberRow[]
  meRows: TeamMemberRow[]
  teamLive: TeamMemberLive[]
  meActivityBreakdown: ActivitySegment[]
  allActivityBreakdown: ActivitySegment[]
  topProjects: ProjectBar[]
  myTopProjects: ProjectBar[]
  attendance: AttendanceData         // Me view — team avatars
  orgAttendance: OrgAttendance       // All view — org bars
  workforceStatus: WorkforceStatus
  departmentRows: DepartmentRow[]
}

// ── Data ──────────────────────────────────────────────────────────────────────

const [YR, AT, SK, JM, CL, MP] = TEAM_MEMBERS

// Personal chart points (Me view)
const chartPoints: DailyBarPoint[] = [
  { date: '2026-04-24', label: 'Apr 24', dayLabel: 'Thu', hours: 6.5  },
  { date: '2026-04-25', label: 'Apr 25', dayLabel: 'Fri', hours: 8.2  },
  { date: '2026-04-26', label: 'Apr 26', dayLabel: 'Sat', hours: 0    },
  { date: '2026-04-27', label: 'Apr 27', dayLabel: 'Sun', hours: 1.0  },
  { date: '2026-04-28', label: 'Apr 28', dayLabel: 'Mon', hours: 9.5  },
  { date: '2026-04-29', label: 'Apr 29', dayLabel: 'Tue', hours: 7.0  },
  { date: '2026-04-30', label: 'Apr 30', dayLabel: 'Wed', hours: 5.8  },
]

// Org-wide chart points (All view) — total hours across 847 employees
const allChartPoints: DailyBarPoint[] = [
  { date: '2026-04-24', label: 'Apr 24', dayLabel: 'Thu', hours: 4280 },
  { date: '2026-04-25', label: 'Apr 25', dayLabel: 'Fri', hours: 5340 },
  { date: '2026-04-26', label: 'Apr 26', dayLabel: 'Sat', hours:  320 },
  { date: '2026-04-27', label: 'Apr 27', dayLabel: 'Sun', hours:  680 },
  { date: '2026-04-28', label: 'Apr 28', dayLabel: 'Mon', hours: 6150 },
  { date: '2026-04-29', label: 'Apr 29', dayLabel: 'Tue', hours: 5820 },
  { date: '2026-04-30', label: 'Apr 30', dayLabel: 'Wed', hours: 4960 },
]

// All-org stat cards (847 employees)
const allStats: StatCard[] = [
  { id: 'all-today',    label: "Today's Hours",   value: '6,150h',  subtext: 'across 847 employees',  trend: 'up',      iconName: 'clock'    },
  { id: 'all-week',     label: 'This Week',        value: '27.3K h', subtext: '+4.2% vs last week',    trend: 'up',      iconName: 'calendar' },
  { id: 'all-members',  label: 'Active Right Now', value: '623',     subtext: 'of 847 employees',      trend: 'neutral', iconName: 'users'    },
  { id: 'all-billable', label: 'Billable Hours',   value: '4,674h',  subtext: '76% of total',          trend: 'neutral', iconName: 'dollar'   },
]

// Personal stat cards
const meStats: StatCard[] = [
  { id: 'me-today',    label: "Today's Hours",  value: '5h 48m',  subtext: '+8% from yesterday', trend: 'up',      iconName: 'clock',   highlight: true },
  { id: 'me-week',     label: 'This Week',       value: '38h',     subtext: 'of 40h target',      trend: 'neutral', iconName: 'target'  },
  { id: 'me-activity', label: 'Avg Activity',    value: '82%',     subtext: '+4% vs last week',   trend: 'up',      iconName: 'activity'},
  { id: 'me-billable', label: 'Billable Hours',  value: '29h 15m', subtext: '76% of total',       trend: 'neutral', iconName: 'dollar'  },
]

// Team rows (daily report — personal view)
const teamRows: TeamMemberRow[] = [
  { member: YR, dailyHours: [5.5, 6.0, 0, 0.8, 7.5, 6.0, 5.2], totalHours: 31.0, hasTracked: true,  hasManual: false },
  { member: AT, dailyHours: [0,   2.2, 0, 0,   2.0, 1.0, 0  ], totalHours: 5.2,  hasTracked: true,  hasManual: false },
  { member: SK, dailyHours: [1.0, 0,   0, 0.2, 0,   0,   0.6], totalHours: 1.8,  hasTracked: false, hasManual: true  },
  { member: JM, dailyHours: [0,   0,   0, 0,   0,   0,   0  ], totalHours: 0,    hasTracked: false, hasManual: false },
  { member: CL, dailyHours: [0,   0,   0, 0,   0,   0,   0  ], totalHours: 0,    hasTracked: false, hasManual: false },
  { member: MP, dailyHours: [0,   0,   0, 0,   0,   0,   0  ], totalHours: 0,    hasTracked: false, hasManual: false },
]

const meRows: TeamMemberRow[] = [
  { member: CURRENT_USER, dailyHours: [5.5, 6.0, 0, 0.8, 7.5, 6.0, 5.2], totalHours: 31.0, hasTracked: true, hasManual: false },
]

// Live team status (Me view — personal team)
const teamLive: TeamMemberLive[] = [
  { member: YR, status: 'active',  currentProject: 'Client Portal Redesign', currentTask: 'Design Review',   todayHours: 5.8, activityPct: 87 },
  { member: AT, status: 'active',  currentProject: 'E-Commerce Storefront',  currentTask: 'Backend API',     todayHours: 4.2, activityPct: 72 },
  { member: SK, status: 'idle',    currentProject: 'Internal HR Tool',                                        todayHours: 2.1, activityPct: 31, lastSeen: '4 mins ago' },
  { member: JM, status: 'offline',                                                                             todayHours: 0,   activityPct: 0,  lastSeen: '1h ago'     },
  { member: CL, status: 'break',   currentProject: 'AbroadWorks Mobile App',                                  todayHours: 3.6, activityPct: 68 },
  { member: MP, status: 'offline',                                                                             todayHours: 0,   activityPct: 0,  lastSeen: 'Yesterday'  },
]

// Activity breakdown — personal
const meActivityBreakdown: ActivitySegment[] = [
  { label: 'Productive', pct: 82, color: '#10B981' },
  { label: 'Neutral',    pct: 10, color: '#0863C9' },
  { label: 'Idle',       pct: 6,  color: '#F59E0B' },
  { label: 'Offline',    pct: 2,  color: '#E5E7EB' },
]

// Activity breakdown — org-wide
const allActivityBreakdown: ActivitySegment[] = [
  { label: 'Productive', pct: 61, color: '#10B981' },
  { label: 'Neutral',    pct: 17, color: '#0863C9' },
  { label: 'Idle',       pct: 14, color: '#F59E0B' },
  { label: 'Offline',    pct: 8,  color: '#E5E7EB' },
]

// Top projects — personal
const myTopProjects: ProjectBar[] = [
  { name: 'Client Portal Redesign', color: '#0863C9', hours: 18, maxHours: 18 },
  { name: 'AbroadWorks Mobile App', color: '#8B5CF6', hours: 10, maxHours: 18 },
  { name: 'E-Commerce Storefront',  color: '#31ADAC', hours: 7,  maxHours: 18 },
  { name: 'Internal HR Tool',       color: '#F59E0B', hours: 3,  maxHours: 18 },
]

// Top projects — org-wide (raw hours, formatted in component)
const topProjects: ProjectBar[] = [
  { name: 'Client Portal Redesign',   color: '#0863C9', hours: 2840, maxHours: 2840 },
  { name: 'E-Commerce Storefront',    color: '#31ADAC', hours: 2100, maxHours: 2840 },
  { name: 'AbroadWorks Mobile App',   color: '#8B5CF6', hours: 1650, maxHours: 2840 },
  { name: 'Internal HR Tool',         color: '#F59E0B', hours: 1280, maxHours: 2840 },
  { name: 'Data Analytics Dashboard', color: '#EC4899', hours:  890, maxHours: 2840 },
]

// Attendance — team level (Me view, shows avatars)
const attendance: AttendanceData = {
  onTime: 4, late: 1, absent: 1, total: 6,
  onTimeMembers:  [YR, AT, SK, CL],
  lateMembers:    [JM],
  absentMembers:  [MP],
}

// Attendance — org level (All view, bars + numbers)
const orgAttendance: OrgAttendance = {
  onTime: 712,
  late:    89,
  absent:  46,
  total:  847,
}

// Live workforce snapshot
const workforceStatus: WorkforceStatus = {
  active:   623,
  idle:      87,
  onBreak:   34,
  offline:  103,
  total:    847,
}

// Department summary rows (9 departments, headcount sums to 847)
const departmentRows: DepartmentRow[] = [
  { name: 'Engineering',       color: '#0863C9', headcount: 195, online: 168, hoursToday: 1240, avgActivity: 78, billablePct: 85 },
  { name: 'Sales',             color: '#10B981', headcount: 130, online: 112, hoursToday:  845, avgActivity: 81, billablePct: 90 },
  { name: 'Customer Success',  color: '#31ADAC', headcount: 100, online:  88, hoursToday:  638, avgActivity: 74, billablePct: 70 },
  { name: 'Marketing',         color: '#EC4899', headcount:  65, online:  53, hoursToday:  402, avgActivity: 65, billablePct: 45 },
  { name: 'Operations',        color: '#F59E0B', headcount:  80, online:  66, hoursToday:  476, avgActivity: 69, billablePct: 55 },
  { name: 'Product',           color: '#8B5CF6', headcount:  55, online:  48, hoursToday:  345, avgActivity: 76, billablePct: 60 },
  { name: 'Finance',           color: '#6366F1', headcount:  44, online:  38, hoursToday:  273, avgActivity: 71, billablePct: 80 },
  { name: 'HR',                color: '#FF8B18', headcount:  38, online:  31, hoursToday:  214, avgActivity: 66, billablePct: 30 },
  { name: 'Legal & Other',     color: '#6B7280', headcount: 140, online: 120, hoursToday:  817, avgActivity: 68, billablePct: 40 },
]

// ── Singleton ─────────────────────────────────────────────────────────────────

export const DASHBOARD: DashboardData = {
  dateRange: { startDate: '2026-04-24', endDate: '2026-04-30', label: 'Apr 24 – Apr 30, 2026' },
  meStats,
  allStats,
  chartPoints,
  allChartPoints,
  teamRows,
  meRows,
  teamLive,
  meActivityBreakdown,
  allActivityBreakdown,
  topProjects,
  myTopProjects,
  attendance,
  orgAttendance,
  workforceStatus,
  departmentRows,
}
