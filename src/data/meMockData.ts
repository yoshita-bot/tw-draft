export const ME = {
  name:           'Yoshita Jeswal',
  role:           'Admin',
  avatarInitials: 'YJ',
  hourlyRate:     20,
  status:         'clocked-out' as const,
  clockInTime:    '9:02 am',
  clockOutTime:   '6:12 PM',

  todayStats: {
    hoursWorked:   6.7,   // 6h 42m
    expectedHours: 8,
    earnings:      134.00,
    activityRate:  74,
    screenshots:   38,
  },

  thisWeek: {
    hoursWorked:   31.5,
    expectedHours: 40,
    earnings:      621.50,
    activityRate:  68,
    cap:           40,
  },

  // 7-day daily hours for timesheet bar chart (Mon–Sun)
  weeklyHours: [
    { day: 'Mon', date: '2026-06-01', hours: 7.8,  earnings: 156.00 },
    { day: 'Tue', date: '2026-06-02', hours: 6.5,  earnings: 130.00 },
    { day: 'Wed', date: '2026-06-03', hours: 8.0,  earnings: 160.00 },
    { day: 'Thu', date: '2026-06-04', hours: 2.5,  earnings: 50.00  },
    { day: 'Fri', date: '2026-06-05', hours: 6.7,  earnings: 134.00 },
    { day: 'Sat', date: '2026-06-06', hours: 0,    earnings: 0      },
    { day: 'Sun', date: '2026-06-07', hours: 0,    earnings: 0      },
  ],

  // Per-day time entries (keyed by date)
  timesheetEntries: {
    '2026-06-05': [
      { id: 'f1', project: 'Client Portal Redesign', client: 'Acme Corp',         start: '09:02', end: '11:30', duration: 148, activity: 82, billable: true  },
      { id: 'f2', project: 'Lunch break',             client: '',                  start: '11:30', end: '12:00', duration: 30,  activity: 0,  billable: false, idle: true },
      { id: 'f3', project: 'Design System Audit',     client: 'Global Industries', start: '12:00', end: '14:45', duration: 165, activity: 71, billable: true  },
      { id: 'f4', project: 'Onboarding Flow V2',      client: 'Acme Corp',         start: '14:45', end: '16:30', duration: 105, activity: 68, billable: true  },
      { id: 'f5', project: 'Team standup',            client: '',                  start: '16:30', end: '17:00', duration: 30,  activity: 55, billable: false },
      { id: 'f6', project: 'Client Portal Redesign',  client: 'Acme Corp',         start: '17:00', end: '18:12', duration: 72,  activity: 74, billable: true  },
    ],
    '2026-06-04': [
      { id: 'th1', project: 'Design System Audit',    client: 'Global Industries', start: '10:00', end: '12:30', duration: 150, activity: 76, billable: true  },
    ],
    '2026-06-03': [
      { id: 'w1', project: 'Client Portal Redesign',  client: 'Acme Corp',         start: '09:00', end: '13:00', duration: 240, activity: 88, billable: true  },
      { id: 'w2', project: 'Onboarding Flow V2',      client: 'Acme Corp',         start: '14:00', end: '18:00', duration: 240, activity: 79, billable: true  },
    ],
    '2026-06-02': [
      { id: 'tu1', project: 'Design System Audit',    client: 'Global Industries', start: '09:00', end: '15:30', duration: 390, activity: 72, billable: true  },
    ],
    '2026-06-01': [
      { id: 'mo1', project: 'Client Portal Redesign', client: 'Acme Corp',         start: '09:00', end: '14:00', duration: 300, activity: 85, billable: true  },
      { id: 'mo2', project: 'Onboarding Flow V2',     client: 'Acme Corp',         start: '14:30', end: '17:18', duration: 168, activity: 80, billable: true  },
    ],
  } as Record<string, Array<{ id: string; project: string; client: string; start: string; end: string; duration: number; activity: number; billable: boolean; idle?: boolean }>>,

  // Projects for My Work
  projects: [
    {
      id: 'p1', name: 'Client Portal Redesign', client: 'Acme Corp',
      color: '#6C63FF', hoursThisWeek: 14.5, progress: 62,
      tasks: [
        { id: 't1', name: 'Redesign dashboard layout',   status: 'in-progress' as const, due: '2026-06-06' },
        { id: 't2', name: 'Component library updates',   status: 'done'        as const, due: '2026-06-03' },
        { id: 't3', name: 'Responsive breakpoints',      status: 'to-do'       as const, due: '2026-06-10' },
      ],
    },
    {
      id: 'p2', name: 'Design System Audit', client: 'Global Industries',
      color: '#3B82F6', hoursThisWeek: 8.0, progress: 45,
      tasks: [
        { id: 't4', name: 'Audit current token usage',   status: 'done'        as const, due: '2026-06-02' },
        { id: 't5', name: 'Document inconsistencies',    status: 'in-progress' as const, due: '2026-06-07' },
        { id: 't6', name: 'Remediation plan',            status: 'blocked'     as const, due: '2026-06-12' },
      ],
    },
    {
      id: 'p3', name: 'Onboarding Flow V2', client: 'Acme Corp',
      color: '#06B6D4', hoursThisWeek: 9.0, progress: 30,
      tasks: [
        { id: 't7', name: 'User research synthesis',     status: 'done'        as const, due: '2026-05-30' },
        { id: 't8', name: 'New onboarding wireframes',   status: 'in-progress' as const, due: '2026-06-09' },
        { id: 't9', name: 'A/B test plan',               status: 'to-do'       as const, due: '2026-06-14' },
      ],
    },
  ],

  // Time off
  myLeave: [
    { id: 'l1', type: 'Annual Leave', start: '2026-06-22', end: '2026-06-26', days: 5, status: 'approved' as const },
    { id: 'l2', type: 'Sick Leave',   start: '2026-07-14', end: '2026-07-14', days: 1, status: 'pending'  as const },
  ],
  publicHolidays: [
    { name: 'Queen\'s Birthday',  date: '2026-06-08' },
    { name: 'NAIDOC Week',        date: '2026-07-06' },
    { name: 'Bank Holiday',       date: '2026-08-03' },
  ],

  // Screenshots for Recent Activity
  screenshots: [
    { id: 'ss1', time: '17:48', project: 'Client Portal Redesign', activity: 74, hue: '#6C63FF' },
    { id: 'ss2', time: '17:18', project: 'Client Portal Redesign', activity: 81, hue: '#6C63FF' },
    { id: 'ss3', time: '16:48', project: 'Onboarding Flow V2',     activity: 68, hue: '#06B6D4' },
    { id: 'ss4', time: '16:18', project: 'Onboarding Flow V2',     activity: 65, hue: '#06B6D4' },
    { id: 'ss5', time: '15:48', project: 'Onboarding Flow V2',     activity: 72, hue: '#06B6D4' },
    { id: 'ss6', time: '15:18', project: 'Design System Audit',    activity: 70, hue: '#3B82F6' },
    { id: 'ss7', time: '14:48', project: 'Design System Audit',    activity: 77, hue: '#3B82F6' },
    { id: 'ss8', time: '14:18', project: 'Design System Audit',    activity: 69, hue: '#3B82F6' },
    { id: 'ss9', time: '13:48', project: 'Design System Audit',    activity: 73, hue: '#3B82F6' },
    { id: 'ss10', time: '12:18', project: 'Client Portal Redesign', activity: 84, hue: '#6C63FF' },
    { id: 'ss11', time: '11:48', project: 'Client Portal Redesign', activity: 80, hue: '#6C63FF' },
    { id: 'ss12', time: '11:18', project: 'Client Portal Redesign', activity: 76, hue: '#6C63FF' },
  ],

  weeklyActivity: [78, 68, 88, 64, 74, 0, 0], // Mon–Sun
}
