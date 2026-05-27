export interface EmployeeSectionConfig {
  id: string
  title: string
  description: string
  category: 'time' | 'earnings' | 'activity' | 'schedule'
  span?: 1 | 2
}

// ── Small Widget Configs (top bar stat chips) ─────────────────────────────────

export interface EmployeeSmallWidgetConfig {
  id: string
  title: string
  description: string
}

export const EMPLOYEE_SMALL_WIDGET_CONFIGS: Record<string, EmployeeSmallWidgetConfig> = {
  'sw-worked-today':   { id: 'sw-worked-today',   title: 'Worked today',     description: 'Hours worked so far today' },
  'sw-worked-week':    { id: 'sw-worked-week',    title: 'This week',        description: 'Total hours worked this week' },
  'sw-earned-today':   { id: 'sw-earned-today',   title: 'Earned today',     description: 'Estimated earnings for today' },
  'sw-earned-week':    { id: 'sw-earned-week',    title: 'Earned this week', description: 'Total estimated earnings this week' },
  'sw-activity-today': { id: 'sw-activity-today', title: "Today's activity", description: 'Activity rate tracked today' },
  'sw-activity-week':  { id: 'sw-activity-week',  title: 'Weekly activity',  description: 'Average activity rate this week' },
  'sw-projects':       { id: 'sw-projects',       title: 'Projects worked',  description: 'Projects you logged time on this week' },
}

export const DEFAULT_EMPLOYEE_TOP_BAR: string[] = [
  'sw-worked-today',
  'sw-worked-week',
  'sw-activity-today',
  'sw-earned-today',
]

// ── Large Widget Configs ───────────────────────────────────────────────────────

export const EMPLOYEE_SECTION_CONFIGS: Record<string, EmployeeSectionConfig> = {
  'employee-hours-week': {
    id: 'employee-hours-week',
    title: 'Hours This Week',
    description: 'Your hours worked this week vs. expected, with a daily breakdown.',
    category: 'time',
    span: 1,
  },
  'employee-limit': {
    id: 'employee-limit',
    title: 'Weekly Limit',
    description: 'Your client-imposed weekly hour cap and how close you are to it.',
    category: 'time',
    span: 1,
  },
  'employee-activity': {
    id: 'employee-activity',
    title: 'Your Activity Rate',
    description: 'Your tracked activity percentage today and over the last 7 days.',
    category: 'activity',
    span: 1,
  },
  'employee-earnings': {
    id: 'employee-earnings',
    title: 'Earnings',
    description: 'Your earnings today and for the week, with daily breakdown.',
    category: 'earnings',
    span: 1,
  },
  'employee-project-tasks': {
    id: 'employee-project-tasks',
    title: 'Projects & Tasks',
    description: 'Projects you worked on this week, with tasks and time spent on each.',
    category: 'activity',
    span: 1,
  },
  'employee-screenshots': {
    id: 'employee-screenshots',
    title: 'Recent Screenshots',
    description: 'Last screenshots captured by the TimeWorks Desktop app.',
    category: 'activity',
    span: 1,
  },
  'employee-timesheet': {
    id: 'employee-timesheet',
    title: 'Your Timesheet',
    description: 'Last 7 shifts with duration, earnings, and approval status.',
    category: 'time',
    span: 1,
  },
  'employee-schedule': {
    id: 'employee-schedule',
    title: 'Upcoming Schedule',
    description: 'Your next 3 scheduled shifts.',
    category: 'schedule',
    span: 1,
  },
  'employee-projects': {
    id: 'employee-projects',
    title: 'Recent Projects',
    description: 'Projects you have logged time against this week.',
    category: 'schedule',
    span: 1,
  },
  'employee-attendance': {
    id: 'employee-attendance',
    title: 'Attendance & Punctuality',
    description: 'Late arrivals, missed shifts, and tardiness flags from your schedule.',
    category: 'time',
    span: 1,
  },
  'employee-monthly': {
    id: 'employee-monthly',
    title: 'Monthly Earnings',
    description: 'Total earned this month with a day-by-day chart.',
    category: 'earnings',
    span: 1,
  },
}

export const DEFAULT_EMPLOYEE_LAYOUT: string[] = [
  'employee-hours-week',
  'employee-activity',
  'employee-earnings',
  'employee-project-tasks',
  'employee-screenshots',
  'employee-timesheet',
  'employee-attendance',
]

export const EMPLOYEE_MOCK = {
  name: 'Yoshita Jeswal',
  firstName: 'Yoshita',
  role: 'UI/UX Designer',
  hourlyRate: 18.50,
  weeklyCapHours: 40,
  avatarInitials: 'YJ',
  avatarColor: '#3B71E8',

  // Today's data — synced from TimeWorks Desktop
  todayStats: {
    hoursWorked: 8.5,
    expectedHours: 8,
    earnings: 157.25,
    activityRate: 84,
    status: 'active' as 'active' | 'away' | 'offline',
    clockInTime: '9:04 AM',
  },

  thisWeek: {
    hoursWorked: 32.5,
    expectedHours: 40,
    dailyHours: [8.2, 7.8, 8.5, 8.0, 0, 0, 0], // Mon–Sun
    earnings: 601.25,
    activityRate: 84,
  },

  activityHistory: [78, 82, 91, 74, 88, 84, 84], // last 7 days

  recentShifts: [
    { date: 'Mon May 26', clockIn: '9:04 AM', clockOut: null as string | null, duration: null as string | null, earnings: null as number | null, status: 'Active' as const },
    { date: 'Fri May 23', clockIn: '9:01 AM', clockOut: '5:12 PM', duration: '8h 11m', earnings: 151.37, status: 'Approved' as const },
    { date: 'Thu May 22', clockIn: '9:15 AM', clockOut: '5:05 PM', duration: '7h 50m', earnings: 145.08, status: 'Approved' as const },
    { date: 'Wed May 21', clockIn: '8:58 AM', clockOut: '4:45 PM', duration: '7h 47m', earnings: 143.98, status: 'Pending' as const },
    { date: 'Tue May 20', clockIn: '9:30 AM', clockOut: '5:30 PM', duration: '8h 00m', earnings: 148.00, status: 'Flagged' as const },
    { date: 'Mon May 19', clockIn: '9:05 AM', clockOut: '5:15 PM', duration: '8h 10m', earnings: 150.92, status: 'Approved' as const },
  ],

  upcomingSchedule: [
    { date: 'Tue May 27', time: '9:00 AM – 5:00 PM', type: 'Fixed' as const },
    { date: 'Wed May 28', time: '9:00 AM – 5:00 PM', type: 'Fixed' as const },
    { date: 'Thu May 29', time: '10:00 AM – 6:00 PM', type: 'Flexible' as const },
  ],

  recentProjects: [
    { name: 'Portal Redesign', client: 'HealthStart', hoursLogged: 12.5, taskCount: 4 },
    { name: 'Dashboard v2', client: 'RetailPlus', hoursLogged: 8.0, taskCount: 2 },
    { name: 'Mobile App UX', client: 'TechCorp', hoursLogged: 6.5, taskCount: 3 },
  ],

  // Detailed project + task breakdown for this week
  projectTasks: [
    {
      id: 'p1',
      name: 'Portal Redesign',
      client: 'HealthStart',
      color: '#10B981',
      totalHours: 12.5,
      tasks: [
        { name: 'Wireframe review & feedback', hours: 3.5, status: 'done' as const },
        { name: 'Component library updates',   hours: 4.0, status: 'done' as const },
        { name: 'User testing preparation',    hours: 2.5, status: 'in-progress' as const },
        { name: 'Handoff documentation',       hours: 2.5, status: 'todo' as const },
      ],
    },
    {
      id: 'p2',
      name: 'Dashboard v2',
      client: 'RetailPlus',
      color: '#3B71E8',
      totalHours: 8.0,
      tasks: [
        { name: 'Analytics widget redesign',   hours: 3.0, status: 'done' as const },
        { name: 'Data visualisation charts',   hours: 5.0, status: 'in-progress' as const },
      ],
    },
    {
      id: 'p3',
      name: 'Mobile App UX',
      client: 'TechCorp',
      color: '#8B5CF6',
      totalHours: 6.5,
      tasks: [
        { name: 'Navigation flow mapping',     hours: 2.0, status: 'done' as const },
        { name: 'Icon design system',          hours: 1.5, status: 'in-progress' as const },
        { name: 'Interactive prototype',       hours: 3.0, status: 'todo' as const },
      ],
    },
  ],

  // Recent screenshots captured by TimeWorks Desktop
  recentScreenshots: [
    { id: 's1', time: '9:47 AM', date: 'Today', activityPct: 92, app: 'Figma', variant: 0 },
    { id: 's2', time: '9:32 AM', date: 'Today', activityPct: 78, app: 'Chrome', variant: 1 },
    { id: 's3', time: '9:17 AM', date: 'Today', activityPct: 85, app: 'Figma', variant: 2 },
    { id: 's4', time: '9:02 AM', date: 'Today', activityPct: 71, app: 'VS Code', variant: 3 },
  ],

  // Attendance flags — late arrivals, missed shifts, early departures
  attendanceFlags: [
    {
      date: 'Tue May 20',
      type: 'tardy' as const,
      scheduledTime: '9:00 AM',
      actualTime: '9:30 AM',
      delta: '+30 min',
      note: 'No reason provided',
    },
    {
      date: 'Wed May 14',
      type: 'missed' as const,
      scheduledTime: '9:00 AM',
      actualTime: null as string | null,
      delta: null as string | null,
      note: 'Called in sick',
    },
    {
      date: 'Mon May 12',
      type: 'tardy' as const,
      scheduledTime: '9:00 AM',
      actualTime: '9:22 AM',
      delta: '+22 min',
      note: 'Traffic delay',
    },
    {
      date: 'Thu May 8',
      type: 'early-departure' as const,
      scheduledTime: '5:00 PM',
      actualTime: '4:10 PM',
      delta: '-50 min',
      note: 'Doctor appointment',
    },
  ],

  monthlyEarnings: {
    total: 1854.50,
    daily: [0, 0, 148.00, 151.37, 145.08, 0, 0, 148.00, 151.37, 145.08, 143.98, 148.00, 0, 0, 151.37, 145.08, 143.98, 148.00, 150.92, 0, 0, 151.37, 145.08, 143.98, 148.00, 88.45],
  },
}
