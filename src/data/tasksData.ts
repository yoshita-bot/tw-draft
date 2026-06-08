import { ALL_MEMBERS } from './projectsData'

export type TaskStatus   = 'inprogress' | 'review' | 'done'
export type TaskPriority = 'urgent' | 'normal'

export type RepeatMode = 'daily' | 'weekly' | 'monthly' | 'after' | 'custom'

export type RepeatConfig = {
  enabled: boolean
  mode: RepeatMode
  // daily
  dailyEvery: number
  dailyUnit: 'days' | 'weeks'
  // weekly
  weeklyEvery: number
  weekDays: number[]               // 0=Mon … 6=Sun
  // monthly
  monthlyEvery: number
  monthType: 'date' | 'weekday' | 'last'
  monthDay: number                 // 1–28
  monthOrd: 1 | 2 | 3 | 4
  monthWd: number                  // 0–6
  // after done
  afterN: number
  afterUnit: 'days' | 'weeks' | 'months' | 'years'
  // on a date
  customDate: string
}

export function defaultRepeat(): RepeatConfig {
  return {
    enabled: false, mode: 'daily',
    dailyEvery: 1, dailyUnit: 'days',
    weeklyEvery: 1, weekDays: [0, 1, 2, 3, 4],
    monthlyEvery: 1, monthType: 'date', monthDay: 1, monthOrd: 1, monthWd: 0,
    afterN: 1, afterUnit: 'days',
    customDate: '',
  }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function ordinal(n: number): string {
  const v = n % 100, s = ['th', 'st', 'nd', 'rd']
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function repeatLabel(r: RepeatConfig): string {
  if (!r.enabled) return ''
  if (r.mode === 'daily') {
    return r.dailyEvery === 1 && r.dailyUnit === 'days' ? 'Every day' : `Every ${r.dailyEvery} ${r.dailyUnit}`
  }
  if (r.mode === 'weekly') {
    const dayStr = r.weekDays.length ? r.weekDays.map(i => DAYS[i]).join(', ') : '(no days)'
    return `Every ${r.weeklyEvery === 1 ? 'week' : `${r.weeklyEvery} weeks`} on ${dayStr}`
  }
  if (r.mode === 'monthly') {
    const freq = r.monthlyEvery === 1 ? 'Every month' : `Every ${r.monthlyEvery} months`
    if (r.monthType === 'last') return `${freq}, on the last day`
    if (r.monthType === 'weekday') {
      const ords = ['1st', '2nd', '3rd', '4th']
      return `${freq}, on the ${ords[r.monthOrd - 1]} ${DAYS[r.monthWd]}`
    }
    return `${freq}, on the ${ordinal(r.monthDay)}`
  }
  if (r.mode === 'after') return `${r.afterN} ${r.afterUnit} after marked complete`
  if (r.mode === 'custom') return r.customDate ? `Next due: ${r.customDate}` : 'Custom date'
  return ''
}

export type TaskAttachment = {
  id: string
  name: string
  size: string
}

export type Task = {
  id: string
  title: string
  description: string
  projectId: string
  status: TaskStatus
  priority: TaskPriority
  deadline: string
  repeat: RepeatConfig
  attachments: TaskAttachment[]
  managerIds: string[]
  memberIds: string[]
  createdById: string
  createdAt: string
  timeToday: number
  timeWeek: number
  timeTotal: number
}

export const TASKS: Task[] = [
  {
    id: 't1',
    title: 'UI Wireframes',
    description: 'Create wireframes for all main screens of the client portal including dashboard, settings, and report views.',
    projectId: 'p1',
    status: 'done',
    priority: 'urgent',
    deadline: '2026-05-30',
    repeat: defaultRepeat(),
    attachments: [
      { id: 'a1', name: 'wireframes-v2.fig', size: '4.2 MB' },
      { id: 'a2', name: 'brief.pdf', size: '1.1 MB' },
    ],
    managerIds: ['m1'],
    memberIds: ['m2'],
    createdById: 'm1',
    createdAt: '2026-05-01',
    timeToday: 0,
    timeWeek: 120,
    timeTotal: 1440,
  },
  {
    id: 't2',
    title: 'Component Library',
    description: 'Build a reusable React component library aligned with brand guidelines. Includes buttons, inputs, modals, and data tables.',
    projectId: 'p1',
    status: 'inprogress',
    priority: 'urgent',
    deadline: '2026-06-14',
    repeat: defaultRepeat(),
    attachments: [
      { id: 'a3', name: 'component-specs.pdf', size: '2.3 MB' },
    ],
    managerIds: ['m1'],
    memberIds: ['m3'],
    createdById: 'm1',
    createdAt: '2026-05-10',
    timeToday: 95,
    timeWeek: 360,
    timeTotal: 780,
  },
  {
    id: 't3',
    title: 'API Integration',
    description: 'Integrate REST APIs for authentication, project data, and reporting endpoints.',
    projectId: 'p1',
    status: 'inprogress',
    priority: 'normal',
    deadline: '2026-06-20',
    repeat: defaultRepeat(),
    attachments: [],
    managerIds: ['m1'],
    memberIds: ['m3', 'm2'],
    createdById: 'm1',
    createdAt: '2026-05-15',
    timeToday: 45,
    timeWeek: 200,
    timeTotal: 520,
  },
  {
    id: 't4',
    title: 'User Testing',
    description: 'Conduct usability testing sessions with 5 representative users. Document findings and prioritise fixes.',
    projectId: 'p1',
    status: 'review',
    priority: 'normal',
    deadline: '2026-06-28',
    repeat: defaultRepeat(),
    attachments: [
      { id: 'a4', name: 'test-script.docx', size: '340 KB' },
    ],
    managerIds: ['m1'],
    memberIds: ['m4'],
    createdById: 'm1',
    createdAt: '2026-05-20',
    timeToday: 30,
    timeWeek: 90,
    timeTotal: 180,
  },
  {
    id: 't5',
    title: 'Login Flow',
    description: 'Design and implement the full login, signup, and password reset flow for the mobile app.',
    projectId: 'p2',
    status: 'done',
    priority: 'urgent',
    deadline: '2026-05-20',
    repeat: defaultRepeat(),
    attachments: [],
    managerIds: ['m5'],
    memberIds: ['m6'],
    createdById: 'm5',
    createdAt: '2026-04-28',
    timeToday: 0,
    timeWeek: 0,
    timeTotal: 960,
  },
  {
    id: 't6',
    title: 'Dashboard Screen',
    description: 'Build the main dashboard screen with real-time activity stats, quick actions, and recent items.',
    projectId: 'p2',
    status: 'inprogress',
    priority: 'urgent',
    deadline: '2026-06-12',
    repeat: { ...defaultRepeat(), enabled: true, mode: 'weekly', weeklyEvery: 1, weekDays: [0] },
    attachments: [
      { id: 'a5', name: 'dashboard-mockup.png', size: '1.8 MB' },
    ],
    managerIds: ['m7'],
    memberIds: ['m8'],
    createdById: 'm7',
    createdAt: '2026-05-12',
    timeToday: 130,
    timeWeek: 430,
    timeTotal: 720,
  },
  {
    id: 't7',
    title: 'QA Pass',
    description: 'Full regression test of all implemented features before the v2 release candidate.',
    projectId: 'p2',
    status: 'review',
    priority: 'normal',
    deadline: '2026-07-01',
    repeat: defaultRepeat(),
    attachments: [
      { id: 'a6', name: 'qa-checklist.xlsx', size: '220 KB' },
    ],
    managerIds: ['m5'],
    memberIds: ['m8', 'm6'],
    createdById: 'm5',
    createdAt: '2026-05-25',
    timeToday: 60,
    timeWeek: 180,
    timeTotal: 180,
  },
  {
    id: 't8',
    title: 'Logo Design',
    description: 'Design primary and secondary logos with full colour, mono, and reversed variants.',
    projectId: 'p3',
    status: 'done',
    priority: 'normal',
    deadline: '2026-05-10',
    repeat: defaultRepeat(),
    attachments: [
      { id: 'a7', name: 'logo-final.ai', size: '6.7 MB' },
      { id: 'a8', name: 'logo-exports.zip', size: '3.2 MB' },
    ],
    managerIds: ['m10'],
    memberIds: ['m9'],
    createdById: 'm10',
    createdAt: '2026-04-20',
    timeToday: 0,
    timeWeek: 0,
    timeTotal: 600,
  },
  {
    id: 't9',
    title: 'Brand Guidelines',
    description: 'Produce the full brand guidelines document covering typography, colour palette, usage rules, and examples.',
    projectId: 'p3',
    status: 'inprogress',
    priority: 'normal',
    deadline: '2026-06-18',
    repeat: defaultRepeat(),
    attachments: [],
    managerIds: ['m10'],
    memberIds: ['m9', 'm10'],
    createdById: 'm10',
    createdAt: '2026-05-08',
    timeToday: 50,
    timeWeek: 140,
    timeTotal: 380,
  },
  {
    id: 't10',
    title: 'Weekly Report',
    description: 'Compile and send the weekly progress report to all stakeholders every Monday morning.',
    projectId: 'p2',
    status: 'inprogress',
    priority: 'normal',
    deadline: '2026-06-09',
    repeat: { ...defaultRepeat(), enabled: true, mode: 'weekly', weeklyEvery: 1, weekDays: [0] },
    attachments: [],
    managerIds: ['m7'],
    memberIds: ['m6'],
    createdById: 'm7',
    createdAt: '2026-05-06',
    timeToday: 20,
    timeWeek: 60,
    timeTotal: 240,
  },
]

export function getMemberById(id: string) {
  return ALL_MEMBERS.find(m => m.id === id)
}

export function formatMinutes(mins: number): string {
  if (mins === 0) return '0h 0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
