export const DS_KPI_CARDS = [
  {
    id: 'kpi-employees',
    label: 'Active Employees',
    value: '24',
    sub: 'of 30 total',
    tag: '+2 online',
    tagColor: 'blue' as const,
    icon: 'people',
  },
  {
    id: 'kpi-hours',
    label: 'Hours Tracked',
    value: '142.5h',
    sub: 'Today',
    tag: '↑ vs yesterday',
    tagColor: 'green' as const,
    icon: 'clock',
  },
  {
    id: 'kpi-attendance',
    label: 'Attendance Rate',
    value: '80%',
    sub: '24 of 30',
    tag: '↓ -3% vs avg',
    tagColor: 'amber' as const,
    icon: 'attendance',
  },
  {
    id: 'kpi-approvals',
    label: 'Pending Approvals',
    value: '7',
    sub: 'Timesheets',
    tag: 'Needs action',
    tagColor: 'red' as const,
    icon: 'approval',
  },
  {
    id: 'kpi-overtime',
    label: 'Overtime Alerts',
    value: '3',
    sub: 'At risk',
    tag: 'Review now',
    tagColor: 'amber' as const,
    icon: 'alert',
  },
  {
    id: 'kpi-productivity',
    label: 'Avg Productivity',
    value: '78%',
    sub: 'Utilization',
    tag: '↑ +5% WoW',
    tagColor: 'green' as const,
    icon: 'productivity',
  },
]

export type ActivityStatus = 'Working' | 'Idle' | 'Break'

export const DS_TEAM_ACTIVITY = [
  { id: 'ta1', name: 'Sarah Chen',   role: 'Designer',      initials: 'SC', color: '#6271FF', status: 'Working' as ActivityStatus, project: 'Website Redesign',  clockIn: '08:45', today: '5h 22m' },
  { id: 'ta2', name: 'Marcus Webb',  role: 'Developer',     initials: 'MW', color: '#5FB54E', status: 'Working' as ActivityStatus, project: 'API Integration',   clockIn: '09:00', today: '5h 05m' },
  { id: 'ta3', name: 'Priya Sharma', role: 'Project Mgr',   initials: 'PS', color: '#FACC15', status: 'Idle'    as ActivityStatus, project: 'Sprint Planning',   clockIn: '09:15', today: '4h 52m' },
  { id: 'ta4', name: 'Tom Bradley',  role: 'Developer',     initials: 'TB', color: '#6E2BD9', status: 'Working' as ActivityStatus, project: 'Mobile App',        clockIn: '08:30', today: '5h 37m' },
  { id: 'ta5', name: 'Lisa Park',    role: 'QA Engineer',   initials: 'LP', color: '#1447C4', status: 'Break'   as ActivityStatus, project: 'Bug Testing',       clockIn: '09:30', today: '4h 37m' },
  { id: 'ta6', name: 'James Liu',    role: 'Designer',      initials: 'JL', color: '#D8414F', status: 'Working' as ActivityStatus, project: 'Brand Guidelines',  clockIn: '09:00', today: '5h 05m' },
  { id: 'ta7', name: 'Ana Torres',   role: 'Developer',     initials: 'AT', color: '#0F6E56', status: 'Idle'    as ActivityStatus, project: 'Backend Services',  clockIn: '10:00', today: '4h 05m' },
  { id: 'ta8', name: "Ryan O'Neil",  role: 'Sales',         initials: 'RO', color: '#BA7517', status: 'Working' as ActivityStatus, project: 'Client Proposal',   clockIn: '08:00', today: '6h 05m' },
]

export type AlertSeverity = 'red' | 'amber' | 'blue'

export const DS_ACTION_CENTER = [
  { id: 'ac1', title: '7 timesheets not submitted', sub: 'Due today · 7 employees',    action: 'Review',  severity: 'red'   as AlertSeverity },
  { id: 'ac2', title: '3 employees nearing overtime', sub: 'Risk this week',            action: 'View',    severity: 'amber' as AlertSeverity },
  { id: 'ac3', title: 'Project Alpha budget at 85%', sub: '$2,550 of $3,000 used',     action: 'View',    severity: 'amber' as AlertSeverity },
  { id: 'ac4', title: 'Shift conflict on Friday',   sub: '2 employees affected',       action: 'Resolve', severity: 'red'   as AlertSeverity },
  { id: 'ac5', title: '4 leave requests pending',   sub: 'Awaiting your approval',     action: 'Approve', severity: 'blue'  as AlertSeverity },
]

export const DS_PRODUCTIVITY_BARS = [
  { day: 'Mon', thisWeek: 72, lastWeek: 68 },
  { day: 'Tue', thisWeek: 65, lastWeek: 74 },
  { day: 'Wed', thisWeek: 80, lastWeek: 71 },
  { day: 'Thu', thisWeek: 76, lastWeek: 69 },
  { day: 'Fri', thisWeek: 82, lastWeek: 75 },
  { day: 'Sat', thisWeek: 58, lastWeek: 52 },
  { day: 'Sun', thisWeek: 44, lastWeek: 40 },
]

export const DS_UTILIZATION = [
  { dept: 'Engineering', pct: 85, color: '#6271FF' },
  { dept: 'Design',      pct: 72, color: '#6E2BD9' },
  { dept: 'QA',          pct: 68, color: '#5FB54E' },
  { dept: 'Sales',       pct: 91, color: '#FACC15' },
  { dept: 'Management',  pct: 55, color: '#D8414F' },
]

export type ProjectStatus = 'On Track' | 'At Risk'

export const DS_PROJECTS = [
  {
    id: 'p1', name: 'Website Redesign', client: 'Acme Corp',
    status: 'On Track' as ProjectStatus, pct: 72,
    spent: '$36k', budget: '$50k', due: 'Due May 12',
    avatars: [
      { initials: 'SC', color: '#6271FF' },
      { initials: 'MW', color: '#5FB54E' },
      { initials: 'JP', color: '#6E2BD9' },
    ],
  },
  {
    id: 'p2', name: 'Mobile App v2.0', client: 'TechFlow',
    status: 'On Track' as ProjectStatus, pct: 45,
    spent: '$23k', budget: '$40k', due: 'Due Jun 3',
    avatars: [
      { initials: 'TB', color: '#D8414F' },
      { initials: 'AT', color: '#0F6E56' },
      { initials: 'RL', color: '#1447C4' },
    ],
  },
  {
    id: 'p3', name: 'API Integration', client: 'DataSync',
    status: 'At Risk' as ProjectStatus, pct: 88,
    spent: '$18k', budget: '$20k', due: 'Due May 8', overBudget: true,
    avatars: [
      { initials: 'MW', color: '#5FB54E' },
      { initials: 'SC', color: '#6271FF' },
    ],
  },
  {
    id: 'p4', name: 'Brand Guidelines', client: 'Nova Studios',
    status: 'On Track' as ProjectStatus, pct: 30,
    spent: '$5k', budget: '$15k', due: 'Due May 25',
    avatars: [
      { initials: 'JL', color: '#D8414F' },
      { initials: 'LP', color: '#1447C4' },
    ],
  },
]

export const DS_SCHEDULE = {
  today: [
    { id: 's1', title: 'Sprint Review',     sub: '2:00 PM · Engineering', color: '#6271FF', icon: 'calendar' },
    { id: 's2', title: 'Sarah Chen — Leave', sub: 'Annual leave approved', color: '#5FB54E', icon: 'leaf' },
  ],
  tomorrow: [
    { id: 's3', title: 'New hire interview',    sub: '10:00 AM · James, HR',    color: '#6E2BD9', icon: 'person' },
    { id: 's4', title: 'API project deadline',  sub: 'Marcus Webb · critical',  color: '#D8414F', icon: 'alert' },
  ],
  thisWeek: [
    { id: 's5', title: 'Payroll processing', sub: 'May 7 · Finance',       color: '#FACC15', icon: 'dollar' },
    { id: 's6', title: 'Tom Bradley — Leave', sub: 'May 8–9 · 2 days',    color: '#5FB54E', icon: 'leaf' },
    { id: 's7', title: 'Q2 Planning',         sub: 'May 9 · All hands',    color: '#1447C4', icon: 'calendar' },
  ],
}
