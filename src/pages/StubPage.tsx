import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Activity, CalendarCheck, FolderKanban, CalendarDays, BarChart2, CreditCard, Users, Settings } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { ROUTES } from '../lib/routes'

const PAGE_META: Record<string, {
  icon: React.ElementType
  description: string
  plannedFeatures: string[]
  relatedPages: { label: string; path: string }[]
}> = {
  '/activity': {
    icon: Activity,
    description: 'Monitor real-time and historical activity levels, screenshots, and application usage across your team.',
    plannedFeatures: [
      'Live activity feed with per-minute breakdowns',
      'Screenshot grid by worker and time range',
      'App & URL tracking with category filters',
      'Activity heatmaps by day of week',
      'Low-activity alerts and threshold settings',
    ],
    relatedPages: [
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'Reports', path: ROUTES.reports },
    ],
  },
  '/attendance': {
    icon: CalendarCheck,
    description: 'Track clock-in/out patterns, late arrivals, absences, and attendance health across your workforce.',
    plannedFeatures: [
      'Daily attendance grid (present / late / absent)',
      'Clock-in deviation vs. scheduled shift',
      'Absence streak detection',
      'Bulk attendance export for payroll',
      'Integrated with Schedule for expected vs. actual',
    ],
    relatedPages: [
      { label: 'Schedule', path: ROUTES.schedule },
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'People', path: ROUTES.people },
    ],
  },
  '/projects': {
    icon: FolderKanban,
    description: 'Manage client projects, set budgets, and track time spent vs. estimated across tasks.',
    plannedFeatures: [
      'Project list with budget vs. spent progress bars',
      'Per-project time log and worker breakdown',
      'Task-level tracking with to-do assignment',
      'Billable rate overrides per project',
      'Client-facing project summary export',
    ],
    relatedPages: [
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'Reports', path: ROUTES.reports },
      { label: 'Payments', path: ROUTES.payments },
    ],
  },
  '/schedule': {
    icon: CalendarDays,
    description: 'Build and publish team schedules, assign shifts, and surface expected vs. actual clock-in times.',
    plannedFeatures: [
      'Drag-and-drop weekly schedule builder',
      'Shift templates and recurring patterns',
      'Schedule vs. timesheet comparison column',
      'PTO integration — approved leave auto-blocks shifts',
      'Worker self-service schedule view',
    ],
    relatedPages: [
      { label: 'Attendance', path: ROUTES.attendance },
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'People', path: ROUTES.people },
    ],
  },
  '/reports': {
    icon: BarChart2,
    description: 'Generate, filter, and export payroll-ready and client-billing reports for any time range.',
    plannedFeatures: [
      'Manual time edits audit report',
      'Billable vs. non-billable hours by client',
      'Weekly cap breach history',
      'Payroll export with stable employee IDs',
      'Saved report templates with scheduled delivery',
    ],
    relatedPages: [
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'Projects', path: ROUTES.projects },
      { label: 'Payments', path: ROUTES.payments },
    ],
  },
  '/payments': {
    icon: CreditCard,
    description: 'Calculate amounts owed, manage pay rates, and track payment status per worker and pay period.',
    plannedFeatures: [
      'Amounts-owed summary by worker and period',
      'Pay rate management (hourly / fixed / overtime)',
      'Payment status tracking (pending / approved / paid)',
      'Payroll export to CSV / accounting integrations',
      'Billable amount reconciliation against Projects',
    ],
    relatedPages: [
      { label: 'People', path: ROUTES.people },
      { label: 'Reports', path: ROUTES.reports },
      { label: 'Projects', path: ROUTES.projects },
    ],
  },
  '/people': {
    icon: Users,
    description: 'Manage your workforce — worker profiles, roles, teams, clients, and pay configurations.',
    plannedFeatures: [
      'Worker directory with search and team filters',
      'Individual worker profile with timesheet deep-link',
      'Team and client group management',
      'Role-based access control per section',
      'Onboarding checklist and offboarding workflow',
    ],
    relatedPages: [
      { label: 'Timesheets', path: ROUTES.timesheets },
      { label: 'Schedule', path: ROUTES.schedule },
      { label: 'Payments', path: ROUTES.payments },
    ],
  },
  '/settings': {
    icon: Settings,
    description: 'Configure pay periods, weekly hour caps, integrations, notification rules, and app-wide defaults.',
    plannedFeatures: [
      'Pay period configuration (bi-weekly / monthly)',
      'Per-client weekly hour cap rules',
      'PTO policy and auto-deletion rules',
      'Notification thresholds (low activity, cap breach)',
      'API keys and third-party integrations',
    ],
    relatedPages: [
      { label: 'People', path: ROUTES.people },
      { label: 'Reports', path: ROUTES.reports },
    ],
  },
}

const LIVE_PAGES = [
  { label: 'Dashboard', path: ROUTES.dashboard },
  { label: 'Timesheets', path: ROUTES.timesheets },
]

export function StubPage({ path }: { path: string }) {
  const navigate  = useNavigate()
  const meta      = PAGE_META[path]
  const label     = path.replace('/', '').replace(/^\w/, c => c.toUpperCase())

  if (!meta) return null

  const Icon = meta.icon

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title={label} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: '#F7F8FA' }}>

        {/* Hero */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#EEEDFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon width={24} height={24} color="#6C63FF" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 6 }}>{label}</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, maxWidth: 560, lineHeight: 1.6 }}>{meta.description}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, background: '#FEF9EC', border: '1px solid #FDE68A', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, color: '#92400E', fontWeight: 500, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
            In development
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* Planned features */}
          <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '22px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Planned features</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {meta.plannedFeatures.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: '#FAFAFA', borderRadius: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#EEEDFF', color: '#6C63FF', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 0.5 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Live pages */}
            <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Live now</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LIVE_PAGES.map(p => (
                  <button
                    key={p.path}
                    onClick={() => navigate(p.path)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#A5B4FC' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                  >
                    {p.label}
                    <ArrowRight width={13} height={13} color="#9CA3AF" />
                  </button>
                ))}
              </div>
            </div>

            {/* Related pages */}
            {meta.relatedPages.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 10, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Related sections</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {meta.relatedPages.map(p => (
                    <button
                      key={p.path}
                      onClick={() => navigate(p.path)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                    >
                      {p.label}
                      <ArrowRight width={13} height={13} color="#D1D5DB" />
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
