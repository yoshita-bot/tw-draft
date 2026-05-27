import { useState, useRef } from 'react'
import { Plus } from 'lucide-react'
import {
  EMPLOYEE_SECTION_CONFIGS,
  EMPLOYEE_SMALL_WIDGET_CONFIGS,
  DEFAULT_EMPLOYEE_LAYOUT,
  DEFAULT_EMPLOYEE_TOP_BAR,
  EMPLOYEE_MOCK,
} from '../../data/employeeMockData'
import { NOTIFICATIONS } from '../../data/mockData'
import { useLayout } from '../../hooks/useLayout'
import { EmployeeTopBar } from './EmployeeTopBar'
import { NotificationPanel } from './NotificationPanel'
import { WidgetCard } from '../shared/WidgetCard'
import { AddSectionDrawer } from '../shared/AddSectionDrawer'
import { SmallWidgetBar, type SmallStatChip } from '../shared/SmallWidgetBar'
import { EmptyState } from '../shared/EmptyState'

// Widgets
import { HoursThisWeek } from '../widgets/employee/HoursThisWeek'
import { WeeklyLimitIndicator } from '../widgets/employee/WeeklyLimitIndicator'
import { PersonalActivityRate } from '../widgets/employee/PersonalActivityRate'
import { EarningsOnClockout } from '../widgets/employee/EarningsOnClockout'
import { EmployeeProjectTasks } from '../widgets/employee/EmployeeProjectTasks'
import { RecentScreenshots } from '../widgets/employee/RecentScreenshots'
import { AttendanceFlags } from '../widgets/employee/AttendanceFlags'
import { PersonalTimesheet } from '../widgets/employee/PersonalTimesheet'
import { UpcomingSchedule } from '../widgets/employee/UpcomingSchedule'
import { RecentProjects } from '../widgets/employee/RecentProjects'
import { MonthlyEarningsSummary } from '../widgets/employee/MonthlyEarningsSummary'

interface EmployeePageProps {
  view: 'team' | 'me'
  onViewChange: (view: 'team' | 'me') => void
}

// ── Small widget chip data ────────────────────────────────────────────────────

function fmtHours(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

function buildEmployeeChips(ids: string[]): SmallStatChip[] {
  const { todayStats, thisWeek, hourlyRate, projectTasks } = EMPLOYEE_MOCK
  const weekLeft = Math.max(thisWeek.expectedHours - thisWeek.hoursWorked, 0)
  const totalTasks = projectTasks.reduce((s, p) => s + p.tasks.length, 0)

  const ALL: Record<string, SmallStatChip> = {
    'sw-worked-today': {
      id: 'sw-worked-today',
      label: 'Worked today',
      value: fmtHours(todayStats.hoursWorked),
      sub: `of ${todayStats.expectedHours}h expected`,
    },
    'sw-worked-week': {
      id: 'sw-worked-week',
      label: 'This week',
      value: `${thisWeek.hoursWorked}h`,
      sub: `${weekLeft}h remaining`,
    },
    'sw-earned-today': {
      id: 'sw-earned-today',
      label: 'Earned today',
      value: `$${todayStats.earnings.toFixed(2)}`,
      sub: `at $${hourlyRate.toFixed(2)}/hr`,
    },
    'sw-earned-week': {
      id: 'sw-earned-week',
      label: 'Earned this week',
      value: `$${thisWeek.earnings.toFixed(2)}`,
      sub: `${thisWeek.hoursWorked}h total`,
    },
    'sw-activity-today': {
      id: 'sw-activity-today',
      label: "Today's activity",
      value: `${todayStats.activityRate}%`,
      sub: todayStats.activityRate >= 80 ? 'Active' : todayStats.activityRate >= 60 ? 'Good' : 'Low',
      valueColor:
        todayStats.activityRate >= 80 ? '#10B981' :
        todayStats.activityRate >= 60 ? '#F59E0B' : '#EF4444',
    },
    'sw-activity-week': {
      id: 'sw-activity-week',
      label: 'Weekly activity',
      value: `${thisWeek.activityRate}%`,
      sub: 'avg. this week',
      valueColor:
        thisWeek.activityRate >= 80 ? '#10B981' :
        thisWeek.activityRate >= 60 ? '#F59E0B' : '#EF4444',
    },
    'sw-projects': {
      id: 'sw-projects',
      label: 'Projects worked',
      value: `${projectTasks.length}`,
      sub: `${totalTasks} tasks this week`,
    },
  }

  return ids.map(id => ALL[id]).filter(Boolean)
}

// ── Drawer groups ─────────────────────────────────────────────────────────────

const EMPLOYEE_LARGE_GROUPS = [
  {
    label: 'Hours & Schedule',
    sections: ['employee-hours-week', 'employee-limit', 'employee-timesheet', 'employee-attendance', 'employee-schedule']
      .map(id => EMPLOYEE_SECTION_CONFIGS[id]).filter(Boolean),
  },
  {
    label: 'Earnings',
    sections: ['employee-earnings', 'employee-monthly']
      .map(id => EMPLOYEE_SECTION_CONFIGS[id]).filter(Boolean),
  },
  {
    label: 'Activity & Projects',
    sections: ['employee-activity', 'employee-projects', 'employee-project-tasks', 'employee-screenshots']
      .map(id => EMPLOYEE_SECTION_CONFIGS[id]).filter(Boolean),
  },
]


// ── Widget content router ─────────────────────────────────────────────────────

function WidgetContent({ sectionId }: { sectionId: string }) {
  switch (sectionId) {
    case 'employee-hours-week':    return <HoursThisWeek />
    case 'employee-limit':         return <WeeklyLimitIndicator />
    case 'employee-activity':      return <PersonalActivityRate />
    case 'employee-earnings':      return <EarningsOnClockout />
    case 'employee-project-tasks': return <EmployeeProjectTasks />
    case 'employee-screenshots':   return <RecentScreenshots />
    case 'employee-timesheet':     return <PersonalTimesheet />
    case 'employee-attendance':    return <AttendanceFlags />
    case 'employee-schedule':      return <UpcomingSchedule />
    case 'employee-projects':      return <RecentProjects />
    case 'employee-monthly':       return <MonthlyEarningsSummary />
    default:                       return <div className="text-sm text-muted">Widget not found</div>
  }
}

// ── EmployeePage ──────────────────────────────────────────────────────────────

export function EmployeePage({ view, onViewChange }: EmployeePageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)

  const draggingId = useRef<string | null>(null)
  const [draggingVisual, setDraggingVisual] = useState<string | null>(null)
  const [dragOverId,     setDragOverId]     = useState<string | null>(null)

  // ── Two separate layout instances ─────────────────────────────────────────
  const topBar = useLayout({
    storageKey:     'timeworks-employee-topbar-v1',
    defaultLayout:  DEFAULT_EMPLOYEE_TOP_BAR,
    sectionConfigs: EMPLOYEE_SMALL_WIDGET_CONFIGS,
  })

  const grid = useLayout({
    storageKey:     'timeworks-employee-layout-v5',
    defaultLayout:  DEFAULT_EMPLOYEE_LAYOUT,
    sectionConfigs: EMPLOYEE_SECTION_CONFIGS,
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

  const chips = buildEmployeeChips(topBar.currentSections)

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <EmployeeTopBar
        view={view}
        onViewChange={onViewChange}
        onAddSection={() => setDrawerOpen(true)}
        onNotifOpen={() => setNotifOpen(true)}
        unreadCount={unreadCount}
      />

      {/* ── Scrollable area — small-widget bar scrolls with content ── */}
      <div className="flex-1 overflow-y-auto bg-sky">
        <SmallWidgetBar chips={chips} />

        {grid.currentSections.length === 0 ? (
          <div className="p-6">
            <EmptyState onAddSection={() => setDrawerOpen(true)} />
          </div>
        ) : (
          <div className="p-5">
            {renderEmployeeGroups(
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
              () => setDrawerOpen(true),
            )}
          </div>
        )}
      </div>

      <AddSectionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onResetDefaults={resetToDefaults}
        smallWidgets={Object.values(EMPLOYEE_SMALL_WIDGET_CONFIGS)}
        currentTopBar={topBar.currentSections}
        onToggleSmall={onToggleSmall}
        largeGroups={EMPLOYEE_LARGE_GROUPS}
        currentGrid={grid.currentSections}
        onToggleLarge={onToggleLarge}
      />

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

// ── Group renderer ────────────────────────────────────────────────────────────

function renderEmployeeGroups(
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
  onAddSection: () => void,
) {
  const needsPlaceholder = gridSections.length % 2 !== 0

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      onDragOver={(e) => e.preventDefault()}
    >
      {gridSections.map(sectionId => {
        const config = EMPLOYEE_SECTION_CONFIGS[sectionId]
        if (!config) return null

        const isBeingDragged = draggingVisual === sectionId
        const isDragTarget   = dragOverId === sectionId && !isBeingDragged

        return (
          <div
            key={sectionId}
            className={isDragTarget ? 'rounded-xl ring-2 ring-blue-400/40' : ''}
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
            >
              <WidgetContent sectionId={sectionId} />
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
