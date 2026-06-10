export interface TeamRecord {
  id: string
  name: string
  description: string
  color: string
  leadId: string | null
  memberIds: string[]
  projectIds: string[]
  createdAt: string // YYYY-MM-DD
}

export const TEAMS: TeamRecord[] = [
  {
    id: 'tm-engineering',
    name: 'Engineering',
    description: 'Full-stack, backend, and DevOps engineers across all clients',
    color: '#6C63FF',
    leadId: 'e002',
    memberIds: ['e002', 'e007', 'e008', 'e013', 'e017', 'e021', 'e022', 'e023'],
    projectIds: ['p2', 'p5', 'p6'],
    createdAt: '2020-11-01',
  },
  {
    id: 'tm-design',
    name: 'Design',
    description: 'UI/UX designers, product designers, and UX researchers',
    color: '#EC4899',
    leadId: 'e003',
    memberIds: ['e003', 'e011', 'e016', 'e028'],
    projectIds: ['p1', 'p3'],
    createdAt: '2021-01-15',
  },
  {
    id: 'tm-product',
    name: 'Product',
    description: 'Product managers and business analysts driving roadmaps',
    color: '#0EA5E9',
    leadId: 'e012',
    memberIds: ['e004', 'e012', 'e018', 'e024'],
    projectIds: ['p5', 'p1'],
    createdAt: '2021-03-10',
  },
  {
    id: 'tm-qa',
    name: 'Quality Assurance',
    description: 'QA engineers and testers ensuring release quality',
    color: '#10B981',
    leadId: 'e005',
    memberIds: ['e005', 'e007', 'e015'],
    projectIds: ['p2', 'p6'],
    createdAt: '2022-01-20',
  },
  {
    id: 'tm-content',
    name: 'Content & Marketing',
    description: 'Copywriters, content strategists, and SEO specialists',
    color: '#F59E0B',
    leadId: 'e009',
    memberIds: ['e006', 'e009', 'e014', 'e026'],
    projectIds: ['p3'],
    createdAt: '2022-05-01',
  },
  {
    id: 'tm-data',
    name: 'Data & Analytics',
    description: 'Data analysts and engineers building insights infrastructure',
    color: '#8B5CF6',
    leadId: 'e010',
    memberIds: ['e010', 'e020', 'e027', 'e029'],
    projectIds: ['p4'],
    createdAt: '2022-03-08',
  },
  {
    id: 'tm-ops',
    name: 'Operations',
    description: 'Internal operations, HR, and project coordination',
    color: '#64748B',
    leadId: 'e001',
    memberIds: ['e001', 'e019', 'e025'],
    projectIds: ['p2', 'p5'],
    createdAt: '2021-03-15',
  },
]

export const TEAM_MAP: Record<string, TeamRecord> = Object.fromEntries(TEAMS.map(t => [t.id, t]))

export const TEAM_COLORS = [
  '#6C63FF', '#EC4899', '#0EA5E9', '#10B981',
  '#F59E0B', '#8B5CF6', '#64748B', '#EF4444',
  '#14B8A6', '#F97316',
]

export function addTeam(team: TeamRecord) {
  TEAMS.push(team)
  TEAM_MAP[team.id] = team
}

export function updateTeam(updated: TeamRecord) {
  const idx = TEAMS.findIndex(t => t.id === updated.id)
  if (idx !== -1) TEAMS[idx] = updated
  TEAM_MAP[updated.id] = updated
}
