import { useState, useRef } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import {
  SECTION_CONFIGS,
  TEAM_SMALL_WIDGET_CONFIGS,
  DEFAULT_LAYOUT,
  DEFAULT_TEAM_TOP_BAR,
  NOTIFICATIONS,
  ATTENDANCE_KPI,
  FINANCIAL_STATS,
  EMPLOYEES,
} from '../../data/mockData'
import { useLayout } from '../../hooks/useLayout'
import { DashboardTopBar } from './DashboardTopBar'
import { NotificationPanel } from './NotificationPanel'
import { FilterBar } from '../shared/FilterBar'
import { WidgetCard } from '../shared/WidgetCard'
import { AddSectionDrawer } from '../shared/AddSectionDrawer'
import { SmallWidgetBar, type SmallStatChip } from '../shared/SmallWidgetBar'
import { EmptyState } from '../shared/EmptyState'

// Widgets
import { FinancialStats } from '../widgets/FinancialStats'
import { TrendChart } from '../widgets/TrendChart'
import { LostBillingImpact } from '../widgets/LostBillingImpact'
import { AttendanceRosterWithFlags } from '../widgets/AttendanceRosterWithFlags'
import { ActivityAudit } from '../widgets/ActivityAudit'
import { HourCapTracker } from '../widgets/HourCapTracker'
import { ScheduleChanges } from '../widgets/ScheduleChanges'
import { ActiveProjects } from '../widgets/ActiveProjects'

// ── Small widget chip data ────────────────────────────────────────────────────

const ATTENDANCE_CHIPS: SmallStatChip[] = [
  {
    id: 'sw-absent',
    label: 'Absent today',
    value: `${ATTENDANCE_KPI.absent.value}`,
    sub: `↑${ATTENDANCE_KPI.absent.trend}% vs last week`,
    trend: 'up-bad',
    group: 'attendance',
  },
  {
    id: 'sw-tardy',
    label: 'Tardy',
    value: `${ATTENDANCE_KPI.tardy.value}`,
    sub: `↓${Math.abs(ATTENDANCE_KPI.tardy.trend)}% vs last week`,
    trend: 'down-good',
    group: 'attendance',
  },
  {
    id: 'sw-shrinkage',
    label: 'Shrinkage',
    value: `${ATTENDANCE_KPI.shrinkage.value}%`,
    sub: `↑${ATTENDANCE_KPI.shrinkage.trend}% vs last week`,
    trend: 'up-bad',
    group: 'attendance',
  },
  {
    id: 'sw-lost-hours',
    label: 'Lost hours',
    value: `${ATTENDANCE_KPI.lostHours.value}h`,
    sub: `↑${ATTENDANCE_KPI.lostHours.trend}% vs last week`,
    trend: 'up-bad',
    group: 'attendance',
  },
]

// ── Aggregate team time & activity from employee data ─────────────────────────

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

const totalHoursToday = EMPLOYEES.reduce((s, e) => s + (e.hoursToday ?? 0), 0)
const totalHoursWeek  = EMPLOYEES.reduce((s, e) => s + (e.hoursThisWeek ?? 0), 0)
const activeEmployees = EMPLOYEES.filter(e => e.activityPct > 0)
const avgActivityToday = Math.round(
  activeEmployees.reduce((s, e) => s + e.activityPct, 0) / (activeEmployees.length || 1)
)
// Simulate a slightly smoother weekly average
const avgActivityWeek = Math.min(100, Math.round(avgActivityToday * 1.04))

const SINGLE_CHIPS: Record<string, SmallStatChip> = {
  'sw-time-worked': {
    id: 'sw-time-worked',
    label: 'Time Worked',
    value: fmtHours(totalHoursToday),
    sub: '↑4.2% vs yesterday',
    trend: 'up-good',
    weekData: {
      value: fmtHours(totalHoursWeek),
      sub: '↓1.8% vs last week',
      trend: 'down-bad',
    },
  },
  'sw-activity': {
    id: 'sw-activity',
    label: 'Activity',
    value: `${avgActivityToday}%`,
    sub: '↑2.1% vs yesterday',
    trend: 'up-good',
    weekData: {
      value: `${avgActivityWeek}%`,
      sub: '↑3.5% vs last week',
      trend: 'up-good',
    },
  },
  'sw-project-hours': {
    id: 'sw-project-hours',
    label: 'Project Hours',
    value: fmtHours(Math.round(totalHoursToday * 0.78 * 4) / 4),
    sub: '↑6.3% vs yesterday',
    trend: 'up-good',
    weekData: {
      value: fmtHours(Math.round(totalHoursWeek * 0.81 * 4) / 4),
      sub: '↑2.7% vs last week',
      trend: 'up-good',
    },
  },
  'sw-earnings': {
    id: 'sw-earnings',
    label: 'Earnings',
    value: `$${(FINANCIAL_STATS[0].value / 1000).toFixed(0)}k`,
    sub: `↑${FINANCIAL_STATS[0].trend}% vs last week`,
    trend: 'up-good',
  },
  'sw-payables': {
    id: 'sw-payables',
    label: 'Payables',
    value: `$${(FINANCIAL_STATS[1].value / 1000).toFixed(0)}k`,
    sub: `↓${Math.abs(FINANCIAL_STATS[1].trend)}% vs last week`,
    trend: 'down-good',
  },
  'sw-profit': {
    id: 'sw-profit',
    label: 'Profitability',
    value: `$${(FINANCIAL_STATS[2].value / 1000).toFixed(0)}k`,
    sub: `↑${FINANCIAL_STATS[2].trend}% vs last week`,
    trend: 'up-good',
  },
}

function buildTeamChips(ids: string[]): SmallStatChip[] {
  const result: SmallStatChip[] = []
  for (const id of ids) {
    if (id === 'sw-attendance') {
      result.push(...ATTENDANCE_CHIPS)
    } else if (SINGLE_CHIPS[id]) {
      result.push(SINGLE_CHIPS[id])
    }
  }
  return result
}

// ── Drawer groups ─────────────────────────────────────────────────────────────

const TEAM_LARGE_GROUPS = [
  {
    label: 'Attendance',
    sections: ['attendance-roster-flags']
      .map(id => SECTION_CONFIGS[id]).filter(Boolean),
  },
  {
    label: 'Activity',
    sections: ['activity-audit', 'hour-cap-tracker', 'schedule-changes']
      .map(id => SECTION_CONFIGS[id]).filter(Boolean),
  },
  {
    label: 'Finance',
    sections: ['financial-stats', 'trend-chart', 'lost-billing-impact']
      .map(id => SECTION_CONFIGS[id]).filter(Boolean),
  },
  {
    label: 'Projects',
    sections: ['active-projects']
      .map(id => SECTION_CONFIGS[id]).filter(Boolean),
  },
]

// ── Shared footer link ────────────────────────────────────────────────────────

function ViewAll({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-[11px] text-[#3B71E8] font-semibold hover:text-blue-700 transition-colors cursor-pointer group">
      {label}
      <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
    </button>
  )
}

// ── Widget router ─────────────────────────────────────────────────────────────

function WidgetContent({ sectionId, selectedGroup }: { sectionId: string; selectedGroup: string }) {
  switch (sectionId) {
    case 'financial-stats':     return <FinancialStats />
    case 'trend-chart':         return <TrendChart />
    case 'lost-billing-impact': return <LostBillingImpact />
    case 'attendance-roster-flags': return <AttendanceRosterWithFlags selectedGroup={selectedGroup} />
    case 'activity-audit':      return <ActivityAudit selectedGroup={selectedGroup} />
    case 'hour-cap-tracker':    return <HourCapTracker selectedGroup={selectedGroup} />
    case 'schedule-changes':    return <ScheduleChanges />
    case 'active-projects':     return <ActiveProjects />
    default:                    return <div className="text-sm text-muted">Widget not found</div>
  }
}

const WIDGET_FOOTERS: Record<string, React.ReactNode> = {
  'activity-audit':      <ViewAll label="View full report" />,
  'hour-cap-tracker':    <ViewAll label="View all employees" />,
  'schedule-changes':    <ViewAll label="View all requests" />,
  'active-projects':     <ViewAll label="View all projects" />,
  'financial-stats':     <ViewAll label="View financial report" />,
  'trend-chart':         <ViewAll label="View full data" />,
  'lost-billing-impact': <ViewAll label="View billing report" />,
}


// ── DashboardPage ─────────────────────────────────────────────────────────────

interface DashboardPageProps {
  view: 'team' | 'me'
  onViewChange: (view: 'team' | 'me') => void
}

export function DashboardPage({ view, onViewChange }: DashboardPageProps) {
  const [selectedGroup, setSelectedGroup] = useState('All')
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)

  const draggingId = useRef<string | null>(null)
  const [draggingVisual, setDraggingVisual] = useState<string | null>(null)
  const [dragOverId,     setDragOverId]     = useState<string | null>(null)

  // ── Two separate layout instances ─────────────────────────────────────────
  const topBar = useLayout({
    storageKey:     'timeworks-team-topbar-v1',
    defaultLayout:  DEFAULT_TEAM_TOP_BAR,
    sectionConfigs: TEAM_SMALL_WIDGET_CONFIGS,
  })

  const grid = useLayout({
    storageKey:     'timeworks-dashboard-layout-v6',
    defaultLayout:  DEFAULT_LAYOUT,
    sectionConfigs: SECTION_CONFIGS,
  })

  const resetToDefaults = () => { topBar.resetToDefaults(); grid.resetToDefaults() }

  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  const handleDragStart = (id: string) => { draggingId.current = id; setDraggingVisual(id) }
  const handleDragEnd   = () => { draggingId.current = null; setDraggingVisual(null); setDragOverId(null) }
  const handleDragOver  = (id: string) => { if (draggingId.current && draggingId.current !== id) setDragOverId(id) }
  const handleDrop      = (id: string) => {
    if (draggingId.current && draggingId.current !== id) grid.reorderSections(draggingId.current, id)
    draggingId.current = null; setDraggingVisual(null); setDragOverId(null)
  }

  const onToggleSmall = (id: string) =>
    topBar.currentSections.includes(id) ? topBar.removeSection(id) : topBar.addSection(id)

  const onToggleLarge = (id: string) =>
    grid.currentSections.includes(id) ? grid.removeSection(id) : grid.addSection(id)

  const chips = buildTeamChips(topBar.currentSections)

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <DashboardTopBar
        onAddSection={() => setDrawerOpen(true)}
        onNotifOpen={() => setNotifOpen(true)}
        unreadCount={unreadCount}
        view={view}
        onViewChange={onViewChange}
      />

      <FilterBar selectedGroup={selectedGroup} onGroupChange={setSelectedGroup} />

      {/* ── Scrollable area — small-widget bar scrolls with content ── */}
      <div className="flex-1 overflow-y-auto bg-[#F0F4F9]">
        <SmallWidgetBar chips={chips} />

        {grid.currentSections.length === 0 ? (
          <div className="p-6">
            <EmptyState onAddSection={() => setDrawerOpen(true)} />
          </div>
        ) : (
          <div className="p-5">
            {renderGroups(
              grid.currentSections,
              draggingVisual,
              dragOverId,
              handleDragStart,
              handleDragEnd,
              handleDragOver,
              handleDrop,
              grid.removeSection,
              grid.moveUp,
              grid.moveDown,
              selectedGroup,
              () => setDrawerOpen(true),
            )}
          </div>
        )}
      </div>

      <AddSectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onResetDefaults={resetToDefaults}
        smallWidgets={Object.values(TEAM_SMALL_WIDGET_CONFIGS)}
        currentTopBar={topBar.currentSections}
        onToggleSmall={onToggleSmall}
        largeGroups={TEAM_LARGE_GROUPS}
        currentGrid={grid.currentSections}
        onToggleLarge={onToggleLarge}
      />

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

// ── Group renderer ────────────────────────────────────────────────────────────

type RenderGroupsArgs = [
  gridSections: string[],
  draggingVisual: string | null,
  dragOverId: string | null,
  handleDragStart: (id: string) => void,
  handleDragEnd: () => void,
  handleDragOver: (id: string) => void,
  handleDrop: (id: string) => void,
  removeSection: (id: string) => void,
  moveUp: (id: string) => void,
  moveDown: (id: string) => void,
  selectedGroup: string,
  onAddSection: () => void,
]

function renderGroups(...[
  gridSections, draggingVisual, dragOverId,
  handleDragStart, handleDragEnd, handleDragOver, handleDrop,
  removeSection, moveUp, moveDown, selectedGroup, onAddSection,
]: RenderGroupsArgs) {
  const needsPlaceholder = gridSections.length % 2 !== 0

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      onDragOver={(e) => e.preventDefault()}
    >
      {gridSections.map(sectionId => {
        const config = SECTION_CONFIGS[sectionId]
        if (!config) return null

        const isBeingDragged = draggingVisual === sectionId
        const isDragTarget   = dragOverId === sectionId && !isBeingDragged
        const isWide         = (config.span ?? 1) >= 2

        return (
          <div
            key={sectionId}
            className={isDragTarget ? 'rounded-xl ring-2 ring-blue-400/40' : ''}
            style={isWide ? { gridColumn: 'span 2' } : undefined}
            onDragOver={(e) => { e.preventDefault(); handleDragOver(sectionId) }}
            onDrop={(e)     => { e.preventDefault(); handleDrop(sectionId) }}
          >
            <WidgetCard
              title={config.title}
              onDragStart={() => handleDragStart(sectionId)}
              onDragEnd={handleDragEnd}
              onRemove={() => removeSection(sectionId)}
              onMoveUp={() => moveUp(sectionId)}
              onMoveDown={() => moveDown(sectionId)}
              isDragging={isBeingDragged}
              footer={WIDGET_FOOTERS[sectionId]}
            >
              <WidgetContent sectionId={sectionId} selectedGroup={selectedGroup} />
            </WidgetCard>
          </div>
        )
      })}

      {needsPlaceholder && (
        <button
          onClick={onAddSection}
          className="rounded-xl border-2 border-dashed border-gray-200 bg-white/40 flex flex-col items-center justify-center gap-2 py-10 text-gray-300 hover:border-royal/40 hover:text-royal hover:bg-sky/40 transition-all cursor-pointer"
        >
          <Plus size={20} />
          <span className="text-xs font-semibold">Add widget</span>
        </button>
      )}
    </div>
  )
}
