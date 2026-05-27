export interface ChecklistItem { label: string; done: boolean }
export type AttachmentType = 'link' | 'file'
export interface Attachment { id: string; type: AttachmentType; value: string; fileName?: string }
export interface Person { name: string; initials: string; color: string }
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  name: string
  description?: string
  seconds: number
  secondsToday: number
  secondsThisWeek: number
  deadline?: string
  assignee: Person
  members: Person[]
  status: TaskStatus
  priority: TaskPriority
  checklist: ChecklistItem[]
  attachments: Attachment[]
  createdAt?: string
}

export interface Project {
  id: string
  name: string
  color: string
  seconds: number
  tasks: Task[]
  pendingTasks: number
  waitingTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalTasks: number
  pinned: boolean
  secondsToday: number
  secondsThisWeek: number
  lastWorkedAt?: string   // ISO date string YYYY-MM-DD
  deadline?: string       // ISO date string YYYY-MM-DD
}

// Shared team members
const YR: Person = { name: 'Yoshita R.', initials: 'YR', color: '#0863C9' }
const AT: Person = { name: 'Alex T.',    initials: 'AT', color: '#10B981' }
const SK: Person = { name: 'Sam K.',     initials: 'SK', color: '#F59E0B' }
const JM: Person = { name: 'Jordan M.', initials: 'JM', color: '#8B5CF6' }
const CL: Person = { name: 'Casey L.',  initials: 'CL', color: '#EC4899' }
const MP: Person = { name: 'Morgan P.', initials: 'MP', color: '#EF4444' }

export const TEAM_MEMBERS: Person[] = [YR, AT, SK, JM, CL, MP]

export const CURRENT_USER: Person = YR

export const initialProjects: Project[] = [
  {
    id: 'p1', name: 'Client Portal Redesign', color: '#0863C9',
    seconds: 7440, pendingTasks: 2, waitingTasks: 0, inProgressTasks: 1, overdueTasks: 0, totalTasks: 4,
    pinned: true, secondsToday: 2700, secondsThisWeek: 14400, lastWorkedAt: '2026-05-14',
    deadline: '2026-06-30',
    tasks: [
      {
        id: 'p1t1', name: 'Drafting Proposals', seconds: 3600, secondsToday: 0, secondsThisWeek: 0, deadline: '2026-05-10',
        assignee: YR, members: [AT, SK], status: 'done', priority: 'high',
        checklist: [{ label: 'Outline scope', done: true }, { label: 'Write executive summary', done: true }, { label: 'Review with PM', done: true }],
        attachments: [],
      },
      {
        id: 'p1t2', name: 'Client Review Meeting', seconds: 1800, secondsToday: 1800, secondsThisWeek: 1800, deadline: '2026-05-20',
        assignee: AT, members: [YR], status: 'in-progress', priority: 'urgent',
        checklist: [{ label: 'Send agenda', done: true }, { label: 'Prep slide deck', done: false }],
        attachments: [],
      },
      {
        id: 'p1t3', name: 'Update Project Plan', seconds: 2040, secondsToday: 900, secondsThisWeek: 2040,
        assignee: SK, members: [], status: 'review', priority: 'medium',
        checklist: [{ label: 'Revise timeline', done: true }, { label: 'Sync with client', done: false }],
        attachments: [],
      },
      {
        id: 'p1t4', name: 'QA Testing', seconds: 0, secondsToday: 0, secondsThisWeek: 0, deadline: '2026-06-15',
        assignee: JM, members: [AT], status: 'todo', priority: 'low',
        checklist: [{ label: 'Write test cases', done: false }, { label: 'Run regression', done: false }, { label: 'Sign-off', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p2', name: 'AbroadWorks Mobile App', color: '#10B981',
    seconds: 14400, pendingTasks: 0, waitingTasks: 1, inProgressTasks: 1, overdueTasks: 1, totalTasks: 4,
    pinned: true, secondsToday: 1800, secondsThisWeek: 10800, lastWorkedAt: '2026-05-15',
    deadline: '2026-07-15',
    tasks: [
      {
        id: 'p2t1', name: 'Onboarding Flow', seconds: 5400, secondsToday: 1800, secondsThisWeek: 5400, deadline: '2026-05-25',
        assignee: CL, members: [YR, AT], status: 'in-progress', priority: 'urgent',
        checklist: [{ label: 'Wireframes approved', done: true }, { label: 'Build screens', done: false }, { label: 'Animations', done: false }],
        attachments: [],
      },
      {
        id: 'p2t2', name: 'Push Notification Setup', seconds: 3600, secondsToday: 0, secondsThisWeek: 1800,
        assignee: AT, members: [JM], status: 'done', priority: 'high',
        checklist: [{ label: 'Firebase config', done: true }, { label: 'Test on device', done: true }],
        attachments: [],
      },
      {
        id: 'p2t3', name: 'App Store Submission', seconds: 3600, secondsToday: 0, secondsThisWeek: 3600, deadline: '2026-05-18',
        assignee: YR, members: [CL], status: 'blocked', priority: 'urgent',
        checklist: [{ label: 'Screenshots ready', done: true }, { label: 'App review passed', done: false }],
        attachments: [],
      },
      {
        id: 'p2t4', name: 'Analytics Integration', seconds: 1800, secondsToday: 0, secondsThisWeek: 0, deadline: '2026-06-01',
        assignee: SK, members: [], status: 'review', priority: 'medium',
        checklist: [{ label: 'Events mapped', done: true }, { label: 'Dashboard verified', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p3', name: 'Internal HR Tool', color: '#F59E0B',
    seconds: 3900, pendingTasks: 2, waitingTasks: 0, inProgressTasks: 1, overdueTasks: 0, totalTasks: 4,
    pinned: false, secondsToday: 0, secondsThisWeek: 3600, lastWorkedAt: '2026-05-12',
    deadline: '2026-08-01',
    tasks: [
      {
        id: 'p3t1', name: 'Requirements Gathering', seconds: 1800, secondsToday: 0, secondsThisWeek: 0,
        assignee: MP, members: [YR, SK], status: 'done', priority: 'high',
        checklist: [{ label: 'Stakeholder interviews', done: true }, { label: 'Document requirements', done: true }],
        attachments: [],
      },
      {
        id: 'p3t2', name: 'UI Wireframes', seconds: 1200, secondsToday: 0, secondsThisWeek: 1200, deadline: '2026-05-30',
        assignee: CL, members: [JM], status: 'in-progress', priority: 'medium',
        checklist: [{ label: 'Lo-fi sketches', done: true }, { label: 'Hi-fi in Figma', done: false }],
        attachments: [],
      },
      {
        id: 'p3t3', name: 'Backend API Design', seconds: 900, secondsToday: 0, secondsThisWeek: 900, deadline: '2026-06-10',
        assignee: AT, members: [SK], status: 'todo', priority: 'medium',
        checklist: [{ label: 'Schema design', done: false }, { label: 'Endpoint spec', done: false }],
        attachments: [],
      },
      {
        id: 'p3t4', name: 'Testing Plan', seconds: 0, secondsToday: 0, secondsThisWeek: 0,
        assignee: JM, members: [], status: 'todo', priority: 'low',
        checklist: [{ label: 'Define test matrix', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p4', name: 'E-Commerce Storefront', color: '#8B5CF6',
    seconds: 21600, pendingTasks: 2, waitingTasks: 0, inProgressTasks: 1, overdueTasks: 0, totalTasks: 5,
    pinned: false, secondsToday: 3600, secondsThisWeek: 18000, lastWorkedAt: '2026-05-15',
    deadline: '2026-06-15',
    tasks: [
      {
        id: 'p4t1', name: 'Product Catalog Setup', seconds: 7200, secondsToday: 0, secondsThisWeek: 0,
        assignee: YR, members: [AT, MP], status: 'done', priority: 'high',
        checklist: [{ label: 'Import products', done: true }, { label: 'Category taxonomy', done: true }, { label: 'Image optimization', done: true }],
        attachments: [],
      },
      {
        id: 'p4t2', name: 'Checkout Flow', seconds: 5400, secondsToday: 2700, secondsThisWeek: 5400, deadline: '2026-05-22',
        assignee: SK, members: [YR], status: 'in-progress', priority: 'urgent',
        checklist: [{ label: 'Cart UI', done: true }, { label: 'Payment step', done: false }, { label: 'Confirmation email', done: false }],
        attachments: [],
      },
      {
        id: 'p4t3', name: 'Payment Integration', seconds: 3600, secondsToday: 900, secondsThisWeek: 3600, deadline: '2026-05-22',
        assignee: AT, members: [JM], status: 'review', priority: 'urgent',
        checklist: [{ label: 'Stripe connected', done: true }, { label: 'Webhook tested', done: false }],
        attachments: [],
      },
      {
        id: 'p4t4', name: 'Mobile Responsive', seconds: 3600, secondsToday: 0, secondsThisWeek: 0,
        assignee: CL, members: [], status: 'done', priority: 'medium',
        checklist: [{ label: 'Breakpoints tested', done: true }],
        attachments: [],
      },
      {
        id: 'p4t5', name: 'SEO Optimization', seconds: 1800, secondsToday: 0, secondsThisWeek: 1800, deadline: '2026-07-01',
        assignee: MP, members: [YR], status: 'todo', priority: 'low',
        checklist: [{ label: 'Meta tags', done: false }, { label: 'Sitemap', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p5', name: 'Data Analytics Dashboard', color: '#EC4899',
    seconds: 5400, pendingTasks: 1, waitingTasks: 1, inProgressTasks: 1, overdueTasks: 0, totalTasks: 4,
    pinned: false, secondsToday: 900, secondsThisWeek: 5400, lastWorkedAt: '2026-05-13',
    deadline: '2026-07-30',
    tasks: [
      {
        id: 'p5t1', name: 'Data Pipeline Setup', seconds: 2700, secondsToday: 900, secondsThisWeek: 2700, deadline: '2026-05-28',
        assignee: JM, members: [AT], status: 'in-progress', priority: 'high',
        checklist: [{ label: 'ETL scripts', done: true }, { label: 'Scheduling', done: false }],
        attachments: [],
      },
      {
        id: 'p5t2', name: 'Chart Components', seconds: 1800, secondsToday: 0, secondsThisWeek: 900, deadline: '2026-06-05',
        assignee: CL, members: [YR, SK], status: 'review', priority: 'medium',
        checklist: [{ label: 'Bar & line charts', done: true }, { label: 'Drill-down', done: false }],
        attachments: [],
      },
      {
        id: 'p5t3', name: 'Filter & Date Range', seconds: 900, secondsToday: 0, secondsThisWeek: 0,
        assignee: SK, members: [], status: 'todo', priority: 'medium',
        checklist: [{ label: 'Date picker', done: false }, { label: 'Filter state', done: false }],
        attachments: [],
      },
      {
        id: 'p5t4', name: 'Export to CSV / PDF', seconds: 0, secondsToday: 0, secondsThisWeek: 0,
        assignee: MP, members: [JM], status: 'todo', priority: 'low',
        checklist: [{ label: 'CSV export', done: false }, { label: 'PDF template', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p6', name: 'DevOps & Infrastructure', color: '#EF4444',
    seconds: 9720, pendingTasks: 1, waitingTasks: 0, inProgressTasks: 1, overdueTasks: 1, totalTasks: 4,
    pinned: false, secondsToday: 0, secondsThisWeek: 7200, lastWorkedAt: '2026-05-11',
    deadline: '2026-06-01',
    tasks: [
      {
        id: 'p6t1', name: 'CI/CD Pipeline', seconds: 3600, secondsToday: 0, secondsThisWeek: 0,
        assignee: AT, members: [JM, YR], status: 'done', priority: 'high',
        checklist: [{ label: 'GitHub Actions', done: true }, { label: 'Staging deploy', done: true }],
        attachments: [],
      },
      {
        id: 'p6t2', name: 'Docker Containerisation', seconds: 2700, secondsToday: 0, secondsThisWeek: 2700, deadline: '2026-05-19',
        assignee: JM, members: [AT], status: 'in-progress', priority: 'high',
        checklist: [{ label: 'Dockerfile', done: true }, { label: 'Compose setup', done: false }],
        attachments: [],
      },
      {
        id: 'p6t3', name: 'Monitoring & Alerts', seconds: 2700, secondsToday: 0, secondsThisWeek: 2700, deadline: '2026-05-16',
        assignee: MP, members: [SK], status: 'blocked', priority: 'urgent',
        checklist: [{ label: 'Grafana setup', done: true }, { label: 'Alert rules', done: false }],
        attachments: [],
      },
      {
        id: 'p6t4', name: 'Load Testing', seconds: 720, secondsToday: 0, secondsThisWeek: 720, deadline: '2026-06-20',
        assignee: SK, members: [], status: 'todo', priority: 'medium',
        checklist: [{ label: 'k6 scripts', done: false }, { label: 'Baseline report', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p7', name: 'Customer Support Portal', color: '#06B6D4',
    seconds: 2700, pendingTasks: 1, waitingTasks: 1, inProgressTasks: 1, overdueTasks: 0, totalTasks: 3,
    pinned: false, secondsToday: 0, secondsThisWeek: 2700, lastWorkedAt: '2026-05-10',
    deadline: '2026-08-15',
    tasks: [
      {
        id: 'p7t1', name: 'Ticket System', seconds: 1500, secondsToday: 0, secondsThisWeek: 1500, deadline: '2026-05-31',
        assignee: CL, members: [YR], status: 'in-progress', priority: 'high',
        checklist: [{ label: 'Create ticket UI', done: true }, { label: 'Assignment logic', done: false }],
        attachments: [],
      },
      {
        id: 'p7t2', name: 'Live Chat Integration', seconds: 900, secondsToday: 0, secondsThisWeek: 900, deadline: '2026-06-15',
        assignee: AT, members: [JM, CL], status: 'review', priority: 'medium',
        checklist: [{ label: 'Widget embedded', done: true }, { label: 'Agent dashboard', done: false }],
        attachments: [],
      },
      {
        id: 'p7t3', name: 'FAQ Builder', seconds: 300, secondsToday: 0, secondsThisWeek: 0,
        assignee: MP, members: [], status: 'todo', priority: 'low',
        checklist: [{ label: 'CMS setup', done: false }, { label: 'Search index', done: false }],
        attachments: [],
      },
    ],
  },
  {
    id: 'p8', name: 'Brand Identity Refresh', color: '#FF8B18',
    seconds: 18000, pendingTasks: 1, waitingTasks: 0, inProgressTasks: 1, overdueTasks: 0, totalTasks: 4,
    pinned: false, secondsToday: 1200, secondsThisWeek: 9000, lastWorkedAt: '2026-05-14',
    deadline: '2026-07-01',
    tasks: [
      {
        id: 'p8t1', name: 'Logo Redesign', seconds: 7200, secondsToday: 0, secondsThisWeek: 0,
        assignee: CL, members: [YR, MP], status: 'done', priority: 'high',
        checklist: [{ label: 'Concept sketches', done: true }, { label: 'Final vector', done: true }, { label: 'Dark variant', done: true }],
        attachments: [],
      },
      {
        id: 'p8t2', name: 'Colour System', seconds: 3600, secondsToday: 0, secondsThisWeek: 0,
        assignee: YR, members: [CL], status: 'done', priority: 'medium',
        checklist: [{ label: 'Primary palette', done: true }, { label: 'Accessible contrasts', done: true }],
        attachments: [],
      },
      {
        id: 'p8t3', name: 'Typography Guide', seconds: 3600, secondsToday: 1200, secondsThisWeek: 3600, deadline: '2026-05-23',
        assignee: MP, members: [], status: 'in-progress', priority: 'medium',
        checklist: [{ label: 'Font selection', done: true }, { label: 'Scale defined', done: false }],
        attachments: [],
      },
      {
        id: 'p8t4', name: 'Brand Guidelines Doc', seconds: 3600, secondsToday: 0, secondsThisWeek: 1800, deadline: '2026-06-30',
        assignee: SK, members: [YR, CL, MP], status: 'todo', priority: 'high',
        checklist: [{ label: 'Tone of voice', done: false }, { label: 'Usage rules', done: false }, { label: 'Asset pack', done: false }],
        attachments: [],
      },
    ],
  },
]
