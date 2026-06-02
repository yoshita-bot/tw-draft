export const SMALL_WIDGETS = [
  { id: 'sw-online',   label: 'Members online',   value: '24',      delta: '+3 vs yesterday',  up: true,  data: [18,20,22,19,23,21,24] },
  { id: 'sw-projects', label: 'Projects worked',  value: '11',      delta: '+2 vs last week',  up: true,  data: [7,8,9,8,10,9,11] },
  { id: 'sw-spent-wk', label: 'Spent this week',  value: '$12,400', delta: '+8% vs last week', up: true,  data: [9200,10100,11000,10400,11200,11900,12400] },
  { id: 'sw-spent-td', label: 'Spent today',      value: '$1,840',  delta: '-4% vs yesterday', up: false, data: [2100,1950,1800,2200,1700,1900,1840] },
  { id: 'sw-act-td',   label: "Today's activity", value: '74%',     delta: '+6% vs yesterday', up: true,  data: [60,65,68,72,69,71,74] },
  { id: 'sw-act-wk',   label: 'Weekly activity',  value: '68%',     delta: '-2% vs last week', up: false, data: [70,72,68,71,69,70,68] },
  { id: 'sw-hrs-wk',   label: 'Worked this week', value: '312 hrs', delta: '+18 vs last week', up: true,  data: [240,260,275,285,294,302,312] },
  { id: 'sw-hrs-td',   label: 'Worked today',     value: '47 hrs',  delta: '+3 vs yesterday',  up: true,  data: [38,41,43,45,42,44,47] },
]

export const LARGE_WIDGETS_DEF = [
  { id: 'lw-shifts',      label: 'Attendance KPIs' },
  { id: 'lw-schedules',   label: 'Schedules' },
  { id: 'lw-screenshots', label: 'Recent activity' },
  { id: 'lw-lowact',      label: 'Low activity' },
  { id: 'lw-online',      label: "Who's online" },
  { id: 'lw-limits',      label: 'Weekly limits' },
  { id: 'lw-amounts',     label: 'Amounts owed' },
  { id: 'lw-timeoff',     label: 'Time off' },
  { id: 'lw-projects',    label: 'Current project activity' },
  { id: 'lw-todos',       label: 'To-dos' },
]

export const LOW_ACTIVITY_ROWS = [
  { name: 'Alice Chen',    workerId: 'w1', role: 'Backend Engineer', pct: 28, trend: -12, hours: '4.2h / day' },
  { name: 'Bob Martinez',  workerId: 'w2', role: 'Product Designer', pct: 34, trend: -8,  hours: '5.1h / day' },
  { name: 'Carmen Santos', workerId: 'w3', role: 'QA Engineer',      pct: 41, trend: -5,  hours: '6.2h / day' },
  { name: 'David Kim',     workerId: 'w4', role: 'Data Analyst',     pct: 44, trend: 0,   hours: '6.6h / day' },
  { name: 'Elena Patel',   workerId: 'w5', role: 'Frontend Dev',     pct: 47, trend: -3,  hours: '7.1h / day' },
]

export const WHOS_ONLINE = [
  { name: 'Tomás García', task: 'Updating project timeline',  project: 'Website Redesign',  client: 'Acme Corp',   activityPct: 87, hoursToday: '5:42', hoursWeek: '32h' },
  { name: 'Nina Patel',   task: 'Client call prep',           project: 'Brand Identity',    client: 'BlueSky Ltd', activityPct: 74, hoursToday: '4:15', hoursWeek: '27h' },
  { name: 'Luca Ferrari', task: 'Bug fix — login flow',       project: 'Mobile App v2',     client: 'Vero Health', activityPct: 91, hoursToday: '6:03', hoursWeek: '38h' },
  { name: 'Amara Osei',   task: 'Writing Q3 copy',            project: 'Content Strategy',  client: 'Novu Media',  activityPct: 62, hoursToday: '3:50', hoursWeek: '24h' },
  { name: 'Grace Kim',    task: 'Design review',              project: 'Dashboard UI',      client: 'Acme Corp',   activityPct: 55, hoursToday: '3:20', hoursWeek: '21h' },
  { name: 'Daniel Abreu', task: 'Preparing weekly report',    project: 'Analytics Setup',   client: 'Vero Health', activityPct: 43, hoursToday: '2:45', hoursWeek: '18h' },
]

export const WEEKLY_LIMITS = [
  { name: 'Marcus Webb',   role: 'Backend Eng.',   used: 39, cap: 40, client: 'Acme Corp'  },
  { name: 'Elena Volkov',  role: 'QA Engineer',    used: 40, cap: 40, client: 'Vero Health' },
  { name: 'Nina Patel',    role: 'Product Design', used: 32, cap: 40, client: 'Nova Ltd'   },
  { name: 'James Okonkwo', role: 'Data Analyst',   used: 28, cap: 35, client: 'Acme Corp'  },
  { name: 'Luca Ferrari',  role: 'Frontend Dev',   used: 18, cap: 40, client: 'Brex Inc'   },
]

export const AMOUNTS_OWED = [
  { name: 'Tomás García', hrs: 39, rate: 55, amt: 2145 },
  { name: 'Amara Osei',   hrs: 37, rate: 48, amt: 1776 },
  { name: 'Daniel Abreu', hrs: 38, rate: 42, amt: 1596 },
  { name: 'Hana Sato',    hrs: 36, rate: 60, amt: 2160 },
  { name: 'Grace Kim',    hrs: 40, rate: 38, amt: 1520 },
]

export const PROJECT_ACTIVITY = [
  { name: 'Client Portal Redesign',        team: 'UX Team', pct: 78, hrs: 84 },
  { name: 'API Integration — Kabad Works', team: 'IT Team', pct: 61, hrs: 67 },
  { name: 'Onboarding Flow v2',            team: 'UX Team', pct: 55, hrs: 52 },
  { name: 'Mobile App QA',                 team: 'QA',      pct: 40, hrs: 38 },
  { name: 'Security Audit',                team: 'IT Team', pct: 30, hrs: 29 },
]

export const TODOS = [
  { id: 'td-1', name: 'Review Q2 timesheet discrepancies',  assignee: 'Tomás G.',  tag: 'Payroll' },
  { id: 'td-2', name: 'Approve Kabad Works SOW',            assignee: 'Nina P.',   tag: 'Kabad Works' },
  { id: 'td-3', name: 'Update attendance policy doc',       assignee: 'Grace K.',  tag: 'HR' },
  { id: 'td-4', name: 'Set up API Integration milestones',  assignee: 'Daniel A.', tag: 'IT Team' },
  { id: 'td-5', name: 'Schedule QA sprint kickoff',         assignee: 'Hana S.',   tag: 'Mobile App QA' },
]

export const SCREENSHOTS_PEOPLE = [
  {
    name: 'Alice Chen', role: 'Backend Engineer', client: 'Acme Corp', project: 'API Refactor',
    shots: [
      { time: '2:41 PM', pct: 72, level: 'high' as const },
      { time: '2:21 PM', pct: 37, level: 'medium' as const },
      { time: '2:01 PM', pct: 8,  level: 'low' as const },
    ],
  },
  {
    name: 'Bob Martinez', role: 'Product Designer', client: 'Nova Ltd', project: 'Onboarding Redesign',
    shots: [
      { time: '2:38 PM', pct: 65, level: 'high' as const },
      { time: '2:18 PM', pct: 17, level: 'low' as const },
      { time: '1:58 PM', pct: 44, level: 'medium' as const },
    ],
  },
  {
    name: 'Carmen Santos', role: 'Frontend Dev', client: 'Brex Inc', project: 'Dashboard UI',
    shots: [
      { time: '2:35 PM', pct: 55, level: 'high' as const },
      { time: '2:15 PM', pct: 29, level: 'medium' as const },
      { time: '1:55 PM', pct: 12, level: 'low' as const },
    ],
  },
]

export const ATTENDANCE_KPIS = [
  { label: 'Absent count', iconColor: 'var(--danger)',   value: '14', unit: '',  ctx: 'absences this month',   trend: '+3 vs last mo.',  trendDir: 'bad' as const },
  { label: 'Tardy count',  iconColor: 'var(--warning)',  value: '27', unit: '',  ctx: 'late check-ins',        trend: '+5 vs last mo.',  trendDir: 'bad' as const },
  { label: 'Shrinkage',    iconColor: 'var(--muted)',    value: '18', unit: '%', ctx: 'target ≤ 15%',          trend: '+2% vs last mo.', trendDir: 'bad' as const },
  { label: 'Lost hours',   iconColor: 'var(--muted)',    value: '112',unit: 'h', ctx: 'unworked scheduled hrs',trend: '+18h vs last mo.', trendDir: 'bad' as const },
]
export const ATTENDANCE_VALUE_COLORS = ['var(--danger)', 'var(--warning)', 'var(--text)', 'var(--text)']

export const ATTENDANCE_CONTRIBUTORS = [
  { initials: 'MW', bg: '#E6F1FB', fg: '#0C447C', name: 'Marcus Webb',  detail: '4 absences · 6 tardy', val: '22h', valColor: 'var(--danger)'  },
  { initials: 'PN', bg: '#FBEAF0', fg: '#72243E', name: 'Priya Nair',   detail: '3 absences · 8 tardy', val: '19h', valColor: 'var(--danger)'  },
  { initials: 'SM', bg: '#FAEEDA', fg: '#633806', name: 'Sofia Muller', detail: '2 absences · 7 tardy', val: '15h', valColor: 'var(--warning)' },
  { initials: 'LB', bg: '#FAECE7', fg: '#712B13', name: 'Leo Barros',   detail: '3 absences · 4 tardy', val: '14h', valColor: 'var(--warning)' },
]

export const SCHEDULE_UNASSIGNED = [
  { name: 'Anika Sharma', initials: 'AS', bg: '#EEEDFE', fg: '#3C3489' },
  { name: 'Tom Reeves',   initials: 'TR', bg: '#E1F5EE', fg: '#085041' },
  { name: 'Zoe Chambers', initials: 'ZC', bg: '#FAECE7', fg: '#712B13' },
]

export const SCHEDULE_EMPLOYEES = [
  { name: 'Marcus Webb',  initials: 'MW', bg: '#E6F1FB', fg: '#0C447C', startH: 9,  endH: 17, status: 'active' as const   },
  { name: 'James Okafor', initials: 'JO', bg: '#EAF3DE', fg: '#27500A', startH: 8,  endH: 16, status: 'done' as const     },
  { name: 'Leo Barros',   initials: 'LB', bg: '#FAECE7', fg: '#712B13', startH: 10, endH: 18, status: 'active' as const   },
  { name: 'Ray Tanaka',   initials: 'RT', bg: '#EEEDFE', fg: '#3C3489', startH: 9,  endH: 17, status: 'late' as const     },
  { name: 'Priya Nair',   initials: 'PN', bg: '#FBEAF0', fg: '#72243E', startH: 15, endH: 23, status: 'upcoming' as const },
  { name: 'Sofia Muller', initials: 'SM', bg: '#FAEEDA', fg: '#633806', startH: 16, endH: 24, status: 'upcoming' as const },
  { name: 'Dana Osei',    initials: 'DO', bg: '#E1F5EE', fg: '#085041', startH: 7,  endH: 15, status: 'done' as const     },
]

export const TO2_REQUESTS = [
  { id: 1, name: 'Marcus Webb',  role: 'Backend Eng.',     type: 'leave' as const,  status: 'pending' as const,  from: 'Jun 9',  to: 'Jun 13', days: 5, hours: 40, submitted: 'May 27', reason: 'Family commitment. Coverage arranged with Leo Barros for critical deployments.' },
  { id: 2, name: 'Priya Nair',   role: 'Product Designer', type: 'sick' as const,   status: 'pending' as const,  from: 'May 30', to: 'May 30', days: 1, hours: 8,  submitted: 'May 29', reason: "Feeling unwell — doctor's appointment in the morning." },
  { id: 3, name: 'James Okafor', role: 'QA Engineer',      type: 'sick' as const,   status: 'approved' as const, from: 'Jun 2',  to: 'Jun 2',  days: 1, hours: 8,  submitted: 'May 24', reason: 'Recurring migraine episode. Typically back next day.' },
  { id: 4, name: 'Sofia Muller', role: 'Data Analyst',     type: 'leave' as const,  status: 'pending' as const,  from: 'Jun 16', to: 'Jun 20', days: 5, hours: 40, submitted: 'May 28', reason: 'Planned leave. Dashboards handed off to Ray before departure.' },
  { id: 5, name: 'Leo Barros',   role: 'DevOps Eng.',      type: 'client' as const, status: 'pending' as const,  from: 'Jun 5',  to: 'Jun 6',  days: 2, hours: 16, submitted: 'May 26', reason: 'Client Acme Corp provided 2 days off as part of project contract.' },
  { id: 6, name: 'Ray Tanaka',   role: 'Frontend Dev',     type: 'client' as const, status: 'declined' as const, from: 'May 31', to: 'May 31', days: 1, hours: 8,  submitted: 'May 25', reason: 'Client Nova Ltd provided a discretionary day off.' },
]

export const TO2_UPCOMING = [
  { holiday: true,  name: 'Team holiday',  role: 'All employees',    initials: '',   bg: '',        fg: '',        type: 'holiday' as const, from: 'Jun 2',  to: 'Jun 2',  startM: 'Jun', startD: '2',  days: 1,  note: 'Public holiday' },
  { holiday: false, name: 'Dana Osei',     role: 'Scrum Master',     initials: 'DO', bg: '#E1F5EE', fg: '#085041', type: 'leave' as const,   from: 'Jun 1',  to: 'Aug 31', startM: 'Jun', startD: '1',  days: 65, note: 'Extended leave' },
  { holiday: false, name: 'Sofia Muller',  role: 'Data Analyst',     initials: 'SM', bg: '#FAEEDA', fg: '#633806', type: 'leave' as const,   from: 'Jun 16', to: 'Jun 20', startM: 'Jun', startD: '16', days: 5,  note: 'Approved leave' },
  { holiday: true,  name: 'Team holiday',  role: 'All employees',    initials: '',   bg: '',        fg: '',        type: 'holiday' as const, from: 'Jul 4',  to: 'Jul 4',  startM: 'Jul', startD: '4',  days: 1,  note: 'Public holiday' },
  { holiday: false, name: 'Marcus Webb',   role: 'Backend Eng.',     initials: 'MW', bg: '#E6F1FB', fg: '#0C447C', type: 'leave' as const,   from: 'Jun 9',  to: 'Jun 13', startM: 'Jun', startD: '9',  days: 5,  note: 'Approved leave' },
  { holiday: false, name: 'Priya Nair',    role: 'Product Designer', initials: 'PN', bg: '#FBEAF0', fg: '#72243E', type: 'leave' as const,   from: 'Jul 14', to: 'Jul 18', startM: 'Jul', startD: '14', days: 5,  note: 'Planned leave' },
]

export const TO2_TYPE_LABEL: Record<string, string> = { leave: 'Leave', sick: 'Sick leave', holiday: 'Holiday', client: 'Client-provided' }
export const TO2_TYPE_CLASS: Record<string, string>  = { leave: 'to2-leave', sick: 'to2-sick', holiday: 'to2-holiday', client: 'to2-client' }
