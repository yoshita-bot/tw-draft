// ─────────────────────────────────────────────────────────────────────────────
// TimeWorks Dashboard — Mock Data
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

export type EmployeeStatus = 'clocked-in' | 'clocked-out' | 'absent' | 'tardy'
export type TeamName = 'IT' | 'UX' | 'Dev' | 'HR'
export type SectionCategory = 'attendance' | 'finance' | 'activity' | 'projects'
export type ProjectStatus = 'on-track' | 'at-risk' | 'blocked' | 'completed'
export type ExceptionType = 'missing-schedule' | 'hour-cap' | 'low-activity' | 'absent'
export type ScheduleRequestType = 'swap' | 'time-off' | 'overtime' | 'shift-change'

export interface Employee {
  id: string
  name: string
  initials: string
  avatarColor: string
  team: TeamName
  title: string
  status: EmployeeStatus
  clockInTime?: string
  clockOutTime?: string        // for clocked-out employees
  expectedStartTime?: string   // scheduled start (e.g. '8:00 AM')
  minutesLate?: number         // how many minutes past expected start (tardy)
  hoursToday?: number          // decimal hours tracked today
  daysAbsentThisWeek?: number  // consecutive/total absences this week
  noticeFiled?: boolean        // did they notify ahead of absence?
  hoursThisWeek: number
  hourCap: number
  activityPct: number
  hasSchedule: boolean
  clients: string[]
}

export interface TeamGroup {
  id: string
  name: TeamName
  color: string
  employeeIds: string[]
}

export interface ClientGroup {
  id: string
  name: string
  color: string
  teams: string[]
}

export interface SectionConfig {
  id: string
  title: string
  description: string
  category: SectionCategory
  span?: 1 | 2 | 3   // column span in the 3-col dashboard grid
}

export interface Notification {
  id: string
  type: 'leave' | 'schedule' | 'hr' | 'system' | 'alert'
  priority: 'urgent' | 'normal'
  title: string
  body: string
  time: string
  read: boolean
  action?: string   // short label for the contextual action link
}

export interface AttendanceKPIData {
  absent: { value: number; trend: number }
  tardy: { value: number; trend: number }
  shrinkage: { value: number; trend: number }
  lostHours: { value: number; trend: number }
}

export interface FinancialStat {
  label: string
  value: number
  trend: number
  higherIsBetter: boolean
}

export interface TrendPoint {
  day: string
  currentHours: number
  previousHours: number
  currentEarnings: number
  previousEarnings: number
}

export interface ExceptionFlag {
  id: string
  type: ExceptionType
  employeeId: string
  message: string
  priority: 'high' | 'medium' | 'low'
  action: string
}

export interface ActiveProject {
  id: string
  name: string
  client: string
  status: ProjectStatus
  taskCount: number
  completedTasks: number
  assigneeIds: string[]
  dueDate: string
}

export interface ScheduleChangeRequest {
  id: string
  employeeId: string
  type: ScheduleRequestType
  from: string
  to: string
  reason: string
  requestedOn: string
}

// ── Employees ─────────────────────────────────────────────────────────────────

export const EMPLOYEES: Employee[] = [
  // IT Team
  {
    id: 'e1', name: 'Alice Chen', initials: 'AC', avatarColor: '#0863C9',
    team: 'IT', title: 'IT Engineer', status: 'clocked-in',
    clockInTime: '8:02 AM', expectedStartTime: '8:00 AM', hoursToday: 6.5,
    hoursThisWeek: 34, hourCap: 40, activityPct: 82, hasSchedule: true,
    clients: ['TechCorp', 'RetailPlus'],
  },
  {
    id: 'e2', name: 'Bob Kumar', initials: 'BK', avatarColor: '#31ADAC',
    team: 'IT', title: 'Systems Admin', status: 'tardy',
    clockInTime: '9:34 AM', expectedStartTime: '9:00 AM', minutesLate: 34, hoursToday: 4.8,
    hoursThisWeek: 28, hourCap: 40, activityPct: 65, hasSchedule: true,
    clients: ['TechCorp'],
  },
  {
    id: 'e3', name: 'Carlos Reyes', initials: 'CR', avatarColor: '#8B5CF6',
    team: 'IT', title: 'Network Engineer', status: 'absent',
    expectedStartTime: '9:00 AM', daysAbsentThisWeek: 3, noticeFiled: false,
    hoursThisWeek: 20, hourCap: 40, activityPct: 0, hasSchedule: false,
    clients: ['RetailPlus'],
  },
  {
    id: 'e4', name: 'Diana Park', initials: 'DP', avatarColor: '#EC4899',
    team: 'IT', title: 'Security Analyst', status: 'clocked-in',
    clockInTime: '8:15 AM', expectedStartTime: '8:00 AM', hoursToday: 6.2,
    hoursThisWeek: 38, hourCap: 40, activityPct: 91, hasSchedule: true,
    clients: ['TechCorp', 'RetailPlus'],
  },
  // UX Team
  {
    id: 'e5', name: 'Emma Silva', initials: 'ES', avatarColor: '#F59E0B',
    team: 'UX', title: 'UX Lead', status: 'clocked-in',
    clockInTime: '8:45 AM', expectedStartTime: '8:30 AM', hoursToday: 5.8,
    hoursThisWeek: 36, hourCap: 40, activityPct: 78, hasSchedule: true,
    clients: ['HealthStart', 'RetailPlus'],
  },
  {
    id: 'e6', name: 'Frank Jones', initials: 'FJ', avatarColor: '#10B981',
    team: 'UX', title: 'UI Designer', status: 'clocked-out',
    clockInTime: '9:05 AM', clockOutTime: '1:30 PM', hoursToday: 4.4,
    hoursThisWeek: 32, hourCap: 40, activityPct: 55, hasSchedule: false,
    clients: ['RetailPlus'],
  },
  {
    id: 'e7', name: 'Grace Kim', initials: 'GK', avatarColor: '#EF4444',
    team: 'UX', title: 'UX Researcher', status: 'clocked-in',
    clockInTime: '9:00 AM', expectedStartTime: '9:00 AM', hoursToday: 5.5,
    hoursThisWeek: 40, hourCap: 40, activityPct: 88, hasSchedule: true,
    clients: ['HealthStart'],
  },
  // Dev Team
  {
    id: 'e8', name: 'Henry Thompson', initials: 'HT', avatarColor: '#06B6D4',
    team: 'Dev', title: 'Senior Dev', status: 'tardy',
    clockInTime: '9:52 AM', expectedStartTime: '9:00 AM', minutesLate: 52, hoursToday: 4.0,
    hoursThisWeek: 33, hourCap: 40, activityPct: 72, hasSchedule: true,
    clients: ['TechCorp', 'HealthStart'],
  },
  {
    id: 'e9', name: 'Isabel Martins', initials: 'IM', avatarColor: '#7C3AED',
    team: 'Dev', title: 'Full Stack Dev', status: 'clocked-in',
    clockInTime: '8:30 AM', expectedStartTime: '8:30 AM', hoursToday: 6.1,
    hoursThisWeek: 39, hourCap: 40, activityPct: 94, hasSchedule: true,
    clients: ['TechCorp'],
  },
  {
    id: 'e10', name: 'James Wilson', initials: 'JW', avatarColor: '#F97316',
    team: 'Dev', title: 'Backend Dev', status: 'absent',
    daysAbsentThisWeek: 1, noticeFiled: false,
    hoursThisWeek: 16, hourCap: 40, activityPct: 0, hasSchedule: false,
    clients: ['InnovateLabs'],
  },
  // HR Team
  {
    id: 'e11', name: 'Kelly Brown', initials: 'KB', avatarColor: '#0EA5E9',
    team: 'HR', title: 'HR Manager', status: 'clocked-in',
    clockInTime: '8:05 AM', expectedStartTime: '8:00 AM', hoursToday: 6.5,
    hoursThisWeek: 35, hourCap: 40, activityPct: 68, hasSchedule: true,
    clients: ['InnovateLabs'],
  },
  {
    id: 'e12', name: 'Leo Garcia', initials: 'LG', avatarColor: '#84CC16',
    team: 'HR', title: 'Recruiter', status: 'clocked-in',
    clockInTime: '9:10 AM', expectedStartTime: '9:00 AM', hoursToday: 5.3,
    hoursThisWeek: 30, hourCap: 40, activityPct: 45, hasSchedule: false,
    clients: ['InnovateLabs'],
  },
]

export function getEmployeeById(id: string): Employee | undefined {
  return EMPLOYEES.find(e => e.id === id)
}

// ── Teams & Clients ───────────────────────────────────────────────────────────

export const TEAMS: TeamGroup[] = [
  { id: 'it',  name: 'IT',  color: '#0863C9', employeeIds: ['e1','e2','e3','e4'] },
  { id: 'ux',  name: 'UX',  color: '#F59E0B', employeeIds: ['e5','e6','e7'] },
  { id: 'dev', name: 'Dev', color: '#8B5CF6', employeeIds: ['e8','e9','e10'] },
  { id: 'hr',  name: 'HR',  color: '#10B981', employeeIds: ['e11','e12'] },
]

export const CLIENTS: ClientGroup[] = [
  { id: 'techcorp',     name: 'TechCorp',      color: '#0863C9', teams: ['it','dev'] },
  { id: 'healthstart',  name: 'HealthStart',   color: '#10B981', teams: ['ux','dev'] },
  { id: 'retailplus',   name: 'RetailPlus',    color: '#F59E0B', teams: ['it','ux'] },
  { id: 'innovatelabs', name: 'InnovateLabs',  color: '#8B5CF6', teams: ['dev','hr'] },
]

/** Filter employees by group name. 'All' returns everyone. */
export function getFilteredEmployees(selectedGroup: string): Employee[] {
  if (!selectedGroup || selectedGroup === 'All') return EMPLOYEES
  const byTeam = EMPLOYEES.filter(e => e.team === selectedGroup)
  if (byTeam.length) return byTeam
  return EMPLOYEES.filter(e => e.clients.includes(selectedGroup))
}

// ── KPI Data ──────────────────────────────────────────────────────────────────

export const ATTENDANCE_KPI: AttendanceKPIData = {
  absent:    { value: 3,    trend: +12 },
  tardy:     { value: 5,    trend: -8  },
  shrinkage: { value: 18.2, trend: +2.1 },
  lostHours: { value: 24,   trend: +15 },
}

export const FINANCIAL_STATS: FinancialStat[] = [
  { label: 'Total Earnings',  value: 142500, trend: +5.2,  higherIsBetter: true  },
  { label: 'Total Payables',  value: 98200,  trend: -2.1,  higherIsBetter: false },
  { label: 'Profitability',   value: 44300,  trend: +18.4, higherIsBetter: true  },
]

export const LOST_BILLING = {
  lostHours: 24,
  avgBillingRate: 85,
  impact: 2040,
  trend: +15,
  context: '24 lost hours × avg. $85/hr client billing rate across 5 employees this week.',
}

// ── Trend Chart Data ───────────────────────────────────────────────────────────

export const TREND_DATA: TrendPoint[] = [
  { day: 'Mon', currentHours: 320, previousHours: 305, currentEarnings: 28000, previousEarnings: 26600 },
  { day: 'Tue', currentHours: 295, previousHours: 288, currentEarnings: 25800, previousEarnings: 25100 },
  { day: 'Wed', currentHours: 348, previousHours: 332, currentEarnings: 30400, previousEarnings: 29000 },
  { day: 'Thu', currentHours: 312, previousHours: 298, currentEarnings: 27300, previousEarnings: 26000 },
  { day: 'Fri', currentHours: 280, previousHours: 275, currentEarnings: 24500, previousEarnings: 24000 },
  { day: 'Sat', currentHours: 140, previousHours: 130, currentEarnings: 12200, previousEarnings: 11300 },
  { day: 'Sun', currentHours: 0,   previousHours: 0,   currentEarnings: 0,     previousEarnings: 0     },
]

// ── Exception Flags ────────────────────────────────────────────────────────────

export const EXCEPTION_FLAGS: ExceptionFlag[] = [
  { id: 'ex1', type: 'absent',           employeeId: 'e3',  priority: 'high',   action: 'Send request',    message: 'Carlos Reyes has been absent for 3 days this week' },
  { id: 'ex2', type: 'absent',           employeeId: 'e10', priority: 'high',   action: 'Send request',    message: 'James Wilson absent — no notice filed' },
  { id: 'ex3', type: 'hour-cap',         employeeId: 'e7',  priority: 'high',   action: 'View employee',   message: 'Grace Kim at 100% of weekly hour cap (40h)' },
  { id: 'ex4', type: 'hour-cap',         employeeId: 'e9',  priority: 'medium', action: 'View employee',   message: 'Isabel Martins at 97.5% of weekly cap — 1h remaining' },
  { id: 'ex5', type: 'low-activity',     employeeId: 'e12', priority: 'medium', action: 'View activity',   message: 'Leo Garcia — activity at 45% (below 70% threshold)' },
  { id: 'ex6', type: 'low-activity',     employeeId: 'e2',  priority: 'medium', action: 'View activity',   message: 'Bob Kumar — activity at 65%, trending down' },
  { id: 'ex7', type: 'missing-schedule', employeeId: 'e6',  priority: 'low',    action: 'Assign schedule', message: 'Frank Jones has no schedule assigned for next week' },
]

// ── Active Projects ────────────────────────────────────────────────────────────

export const ACTIVE_PROJECTS: ActiveProject[] = [
  {
    id: 'p1', name: 'Portal Redesign', client: 'HealthStart',
    status: 'on-track', taskCount: 14, completedTasks: 9,
    assigneeIds: ['e5','e7','e8'], dueDate: 'Jun 12',
  },
  {
    id: 'p2', name: 'API Migration', client: 'TechCorp',
    status: 'at-risk', taskCount: 22, completedTasks: 11,
    assigneeIds: ['e8','e9'], dueDate: 'May 30',
  },
  {
    id: 'p3', name: 'Dashboard v2', client: 'RetailPlus',
    status: 'on-track', taskCount: 8, completedTasks: 5,
    assigneeIds: ['e1','e5'], dueDate: 'Jun 3',
  },
  {
    id: 'p4', name: 'Security Audit', client: 'InnovateLabs',
    status: 'blocked', taskCount: 6, completedTasks: 2,
    assigneeIds: ['e4','e11'], dueDate: 'Jun 1',
  },
]

// ── Schedule Change Requests ───────────────────────────────────────────────────

export const SCHEDULE_CHANGE_REQUESTS: ScheduleChangeRequest[] = [
  {
    id: 'sr1', employeeId: 'e2', type: 'time-off',
    from: 'May 27', to: 'May 28',
    reason: 'Personal appointment', requestedOn: '2 hrs ago',
  },
  {
    id: 'sr2', employeeId: 'e5', type: 'shift-change',
    from: '9:00 AM – 5:00 PM', to: '10:00 AM – 6:00 PM',
    reason: 'Childcare conflict', requestedOn: '4 hrs ago',
  },
  {
    id: 'sr3', employeeId: 'e11', type: 'overtime',
    from: 'Fri May 29', to: 'Sat May 30',
    reason: 'Critical project deadline', requestedOn: 'Yesterday',
  },
]

// ── Section Configs ────────────────────────────────────────────────────────────

export const SECTION_CONFIGS: Record<string, SectionConfig> = {
  'attendance-roster-flags': {
    id: 'attendance-roster-flags',
    title: 'Attendance',
    description: 'Live roster and exception flags: status by employee plus prioritised alerts.',
    category: 'attendance',
    span: 2,
  },
  'activity-audit': {
    id: 'activity-audit',
    title: 'Activity Audit',
    description: 'Employees ranked by activity percentage. Highlights below-threshold workers.',
    category: 'activity',
    span: 1,
  },
  'hour-cap-tracker': {
    id: 'hour-cap-tracker',
    title: 'Hour Cap Tracker',
    description: 'Weekly hour usage vs. cap per employee. Flags approaching and over-cap.',
    category: 'activity',
    span: 1,
  },
  'schedule-changes': {
    id: 'schedule-changes',
    title: 'Schedule Requests',
    description: 'Pending schedule change requests awaiting approval.',
    category: 'attendance',
    span: 1,
  },
  'financial-stats': {
    id: 'financial-stats',
    title: 'Weekly Financials',
    description: 'Total earnings, payables, and profitability for the current week.',
    category: 'finance',
    span: 1,
  },
  'trend-chart': {
    id: 'trend-chart',
    title: 'Week-over-Week Trend',
    description: 'Bar chart comparing current week vs previous week for hours and earnings.',
    category: 'finance',
    span: 1,
  },
  'lost-billing-impact': {
    id: 'lost-billing-impact',
    title: 'Lost Billing Impact',
    description: 'Estimated revenue lost from missed hours across the organisation.',
    category: 'finance',
    span: 1,
  },
  'active-projects': {
    id: 'active-projects',
    title: 'Active Projects',
    description: 'Current project status, task counts, and assignee overview.',
    category: 'projects',
    span: 1,
  },
}

// Default grid order (attendance-kpi moves to small-widget top bar)
export const DEFAULT_LAYOUT: string[] = [
  'attendance-roster-flags',
  'activity-audit',
  'hour-cap-tracker',
  'schedule-changes',
  'financial-stats',
  'trend-chart',
  'lost-billing-impact',
  'active-projects',
]

// ── Small Widget Configs (top bar stat chips) ─────────────────────────────────

export interface SmallWidgetConfig {
  id: string
  title: string
  description: string
}

export const TEAM_SMALL_WIDGET_CONFIGS: Record<string, SmallWidgetConfig> = {
  'sw-attendance':     { id: 'sw-attendance',     title: 'Attendance Overview', description: 'Absent, tardy, shrinkage, and lost hours — all four chips at once' },
  'sw-time-worked':    { id: 'sw-time-worked',    title: 'Time Worked',         description: 'Total hours worked by the team — toggle between today and this week' },
  'sw-activity':       { id: 'sw-activity',       title: 'Activity',            description: 'Average team activity percentage — toggle between today and this week' },
  'sw-project-hours':  { id: 'sw-project-hours',  title: 'Project Hours',       description: 'Hours logged against projects — toggle between today and this week' },
  'sw-earnings':       { id: 'sw-earnings',       title: 'Earnings',            description: 'Total team earnings this week' },
  'sw-payables':    { id: 'sw-payables',    title: 'Payables',            description: 'Total payables this week' },
  'sw-profit':      { id: 'sw-profit',      title: 'Profitability',       description: 'Net profit this week' },
}

export const DEFAULT_TEAM_TOP_BAR: string[] = [
  'sw-attendance', 'sw-time-worked', 'sw-activity', 'sw-project-hours',
]

/** Sections NOT in current layout — available to add */
export function getAvailableSections(currentSections: string[]): SectionConfig[] {
  return Object.values(SECTION_CONFIGS).filter(s => !currentSections.includes(s.id))
}

/** All sections grouped by category */
export function getSectionsByCategory(): Record<SectionCategory, SectionConfig[]> {
  const result: Record<SectionCategory, SectionConfig[]> = {
    attendance: [],
    finance: [],
    activity: [],
    projects: [],
  }
  for (const config of Object.values(SECTION_CONFIGS)) {
    result[config.category].push(config)
  }
  return result
}

// ── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1', type: 'leave', priority: 'urgent',
    title: 'Leave request pending',
    body: 'Alice Chen requested 3 days PTO (Jun 2–4). Awaiting your approval.',
    time: '2 min ago', read: false,
    action: 'Review request',
  },
  {
    id: 'notif-2', type: 'hr', priority: 'urgent',
    title: 'Incomplete employee profile',
    body: 'Henry Thompson is missing emergency contact and tax information.',
    time: '14 min ago', read: false,
    action: 'Open profile',
  },
  {
    id: 'notif-3', type: 'schedule', priority: 'urgent',
    title: '4 employees missing schedules',
    body: 'Carlos Reyes, Frank Jones, James Wilson and Leo Garcia have no schedule for next week.',
    time: '1 hr ago', read: false,
    action: 'Assign schedules',
  },
  {
    id: 'notif-4', type: 'alert', priority: 'normal',
    title: 'Hour cap exceeded',
    body: 'Grace Kim has logged 40.5h this week, exceeding the 40h weekly cap.',
    time: '2 hr ago', read: false,
    action: 'View timesheet',
  },
  {
    id: 'notif-5', type: 'leave', priority: 'normal',
    title: 'Leave approved',
    body: "Bob Kumar's time-off request for Jun 10 has been approved.",
    time: '3 hr ago', read: true,
    action: 'View calendar',
  },
  {
    id: 'notif-6', type: 'system', priority: 'normal',
    title: 'Payroll report ready',
    body: 'The weekly payroll report for May 19–25 is ready for review.',
    time: 'Yesterday', read: true,
    action: 'Open report',
  },
  {
    id: 'notif-7', type: 'hr', priority: 'normal',
    title: 'New hire starting Monday',
    body: 'Sarah Mitchell joins the Dev team on Jun 1. Onboarding checklist sent.',
    time: 'Yesterday', read: true,
    action: 'View checklist',
  },
  {
    id: 'notif-8', type: 'alert', priority: 'normal',
    title: 'Low activity warning',
    body: "Leo Garcia's activity has been below 50% for 3 consecutive days.",
    time: '2 days ago', read: true,
    action: 'View activity',
  },
]
