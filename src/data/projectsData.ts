export type ProjectMember = {
  id: string
  name: string
  initials: string
  bg: string
  fg: string
  role: 'manager' | 'member'
  payRate: number
  billRate: number
  hoursOnProject: number
  currentTask: string | null
}

export type Project = {
  id: string
  name: string
  client: string
  active: boolean
  billable: boolean
  memberIds: string[]
  managerIds: string[]
  tasks: string[]
}

export const ALL_MEMBERS: ProjectMember[] = [
  { id: 'm1',  name: 'Tomás García',  initials: 'TG', bg: '#E6F1FB', fg: '#0C447C', role: 'manager', payRate: 85,  billRate: 120, hoursOnProject: 124, currentTask: 'Client Portal Redesign' },
  { id: 'm2',  name: 'Nina Patel',    initials: 'NP', bg: '#FBEAF0', fg: '#72243E', role: 'member',  payRate: 65,  billRate: 95,  hoursOnProject: 88,  currentTask: 'UI Review' },
  { id: 'm3',  name: 'Luca Ferrari',  initials: 'LF', bg: '#EEEDFE', fg: '#3C3489', role: 'member',  payRate: 72,  billRate: 105, hoursOnProject: 102, currentTask: 'Bug fix — login flow' },
  { id: 'm4',  name: 'Amara Osei',    initials: 'AO', bg: '#E1F5EE', fg: '#085041', role: 'member',  payRate: 58,  billRate: 85,  hoursOnProject: 76,  currentTask: 'Content Strategy' },
  { id: 'm5',  name: 'Grace Kim',     initials: 'GK', bg: '#FAEEDA', fg: '#633806', role: 'manager', payRate: 90,  billRate: 130, hoursOnProject: 140, currentTask: 'Design Review' },
  { id: 'm6',  name: 'Daniel Abreu',  initials: 'DA', bg: '#FAECE7', fg: '#712B13', role: 'member',  payRate: 55,  billRate: 80,  hoursOnProject: 60,  currentTask: 'Weekly Report' },
  { id: 'm7',  name: 'Marcus Webb',   initials: 'MW', bg: '#E6F1FB', fg: '#0C447C', role: 'manager', payRate: 95,  billRate: 140, hoursOnProject: 156, currentTask: 'API Integration' },
  { id: 'm8',  name: 'Elena Volkov',  initials: 'EV', bg: '#FBEAF0', fg: '#72243E', role: 'member',  payRate: 68,  billRate: 100, hoursOnProject: 94,  currentTask: 'QA Testing' },
  { id: 'm9',  name: 'James Okafor',  initials: 'JO', bg: '#EAF3DE', fg: '#27500A', role: 'member',  payRate: 62,  billRate: 90,  hoursOnProject: 50,  currentTask: null },
  { id: 'm10', name: 'Priya Nair',    initials: 'PN', bg: '#FBEAF0', fg: '#72243E', role: 'member',  payRate: 70,  billRate: 100, hoursOnProject: 80,  currentTask: 'Design System' },
  { id: 'm11', name: 'Ray Tanaka',    initials: 'RT', bg: '#EEEDFE', fg: '#3C3489', role: 'manager', payRate: 88,  billRate: 125, hoursOnProject: 112, currentTask: 'Sprint Planning' },
  { id: 'm12', name: 'Sofia Muller',  initials: 'SM', bg: '#FAEEDA', fg: '#633806', role: 'member',  payRate: 60,  billRate: 88,  hoursOnProject: 70,  currentTask: 'Data Analysis' },
]

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Client Portal Redesign',
    client: 'Acme Corp',
    active: true,
    billable: true,
    memberIds: ['m1', 'm2', 'm3', 'm4'],
    managerIds: ['m1'],
    tasks: ['UI Wireframes', 'Component Library', 'API Integration', 'User Testing'],
  },
  {
    id: 'p2',
    name: 'Mobile App v2',
    client: 'Vero Health',
    active: true,
    billable: true,
    memberIds: ['m5', 'm6', 'm7', 'm8'],
    managerIds: ['m5', 'm7'],
    tasks: ['Login Flow', 'Dashboard Screen', 'Notifications', 'QA Pass'],
  },
  {
    id: 'p3',
    name: 'Brand Identity',
    client: 'BlueSky Ltd',
    active: true,
    billable: false,
    memberIds: ['m9', 'm10'],
    managerIds: ['m10'],
    tasks: ['Logo Design', 'Brand Guidelines'],
  },
  {
    id: 'p4',
    name: 'Analytics Setup',
    client: 'Vero Health',
    active: false,
    billable: true,
    memberIds: ['m11', 'm12', 'm6'],
    managerIds: ['m11'],
    tasks: ['Dashboard Config', 'Data Pipeline', 'Reporting'],
  },
  {
    id: 'p5',
    name: 'Onboarding Flow v2',
    client: 'Acme Corp',
    active: true,
    billable: true,
    memberIds: ['m2', 'm3', 'm10', 'm11'],
    managerIds: ['m11'],
    tasks: ['Welcome Screen', 'Profile Setup', 'Team Invite', 'Completion'],
  },
  {
    id: 'p6',
    name: 'Security Audit',
    client: 'Internal',
    active: false,
    billable: false,
    memberIds: ['m7', 'm8'],
    managerIds: ['m7'],
    tasks: ['Penetration Test', 'Compliance Review'],
  },
  {
    id: 'p7',
    name: 'Internal Ops',
    client: 'Internal',
    active: true,
    billable: false,
    memberIds: [],
    managerIds: [],
    tasks: ['Process Documentation', 'Team Coordination', 'Tooling', 'Reporting'],
  },
  {
    id: 'p8',
    name: 'HR Processes',
    client: 'Internal',
    active: true,
    billable: false,
    memberIds: [],
    managerIds: [],
    tasks: ['Onboarding', 'Performance Review', 'Policy Updates', 'Hiring'],
  },
  {
    id: 'p9',
    name: 'Website Redesign',
    client: 'BlueSky Ltd',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Wireframes', 'Copywriting', 'Dev Implementation', 'SEO'],
  },
  {
    id: 'p10',
    name: 'Dashboard UI',
    client: 'Acme Corp',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Component Design', 'Charts Integration', 'Responsive Layout'],
  },
  {
    id: 'p11',
    name: 'E-commerce Dev',
    client: 'Vero Health',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Product Catalogue', 'Checkout Flow', 'Payment Integration'],
  },
  {
    id: 'p12',
    name: 'Mobile App QA',
    client: 'Vero Health',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Test Plans', 'Regression Testing', 'Bug Reporting'],
  },
  {
    id: 'p13',
    name: 'Reporting Dashboard',
    client: 'Internal',
    active: true,
    billable: false,
    memberIds: [],
    managerIds: [],
    tasks: ['Data Sources', 'Chart Design', 'Automation'],
  },
  {
    id: 'p14',
    name: 'Content Strategy',
    client: 'BlueSky Ltd',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Content Audit', 'Editorial Calendar', 'SEO Strategy'],
  },
  {
    id: 'p15',
    name: 'API Integration',
    client: 'Acme Corp',
    active: true,
    billable: true,
    memberIds: [],
    managerIds: [],
    tasks: ['Endpoint Design', 'Auth Setup', 'Documentation', 'Testing'],
  },
]

export function getMemberById(id: string) {
  return ALL_MEMBERS.find(m => m.id === id) ?? null
}

export function getProjectMembers(project: Project) {
  return project.memberIds.map(id => {
    const m = getMemberById(id)
    if (!m) return null
    return { ...m, role: project.managerIds.includes(id) ? 'manager' as const : 'member' as const }
  }).filter(Boolean) as (ProjectMember & { role: 'manager' | 'member' })[]
}
