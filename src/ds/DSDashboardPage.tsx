import { useState, useRef } from 'react'
import { TopBar } from '../components/TopBar'
import { DSMeDashboard } from './DSMeDashboard'
import { DSSmallWidget } from './DSSmallWidget'
import { AttendanceKPIs } from '../components/widgets/AttendanceKPIs'
import { DSSchedulesWidget } from './DSSchedulesWidget'
import { RecentActivity } from '../components/widgets/RecentActivity'
import { LowActivityWidget } from '../components/widgets/LowActivityWidget'
import { WhosOnlineWidget } from '../components/widgets/WhosOnlineWidget'
import { WeeklyLimitsWidget } from '../components/widgets/WeeklyLimitsWidget'
import { AmountsOwedWidget } from '../components/widgets/AmountsOwedWidget'
import { TimeOffRequestsWidget } from '../components/widgets/TimeOffRequestsWidget'
import { TimeOffUpcomingWidget } from '../components/widgets/TimeOffUpcomingWidget'
import { ProjectActivityWidget } from '../components/widgets/ProjectActivityWidget'
import { TodosWidget } from '../components/widgets/TodosWidget'
import { ManageWidgetsDrawer } from '../components/ManageWidgetsDrawer'
import { SMALL_WIDGETS, LARGE_WIDGETS_DEF } from '../data/dashboardData'
import { GripVertical } from 'lucide-react'
import './dsDashboard.css'

function TeamWidgetContent({ id, gripNode }: { id: string; gripNode?: React.ReactNode }) {
  switch (id) {
    case 'lw-shifts':           return <AttendanceKPIs gripNode={gripNode} />
    case 'lw-schedules':        return <DSSchedulesWidget gripNode={gripNode} />
    case 'lw-screenshots':      return <RecentActivity gripNode={gripNode} />
    case 'lw-lowact':           return <LowActivityWidget gripNode={gripNode} />
    case 'lw-online':           return <WhosOnlineWidget gripNode={gripNode} />
    case 'lw-limits':           return <WeeklyLimitsWidget gripNode={gripNode} />
    case 'lw-amounts':          return <AmountsOwedWidget gripNode={gripNode} />
    case 'lw-timeoff-requests': return <TimeOffRequestsWidget gripNode={gripNode} />
    case 'lw-timeoff-upcoming': return <TimeOffUpcomingWidget gripNode={gripNode} />
    case 'lw-projects':         return <ProjectActivityWidget gripNode={gripNode} />
    case 'lw-todos':            return <TodosWidget gripNode={gripNode} />
    default: return null
  }
}

type ViewScope = 'me' | 'team'

export function DSDashboardPage() {
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [scope, setScope]               = useState<ViewScope>('team')
  const [smallVisible, setSmallVisible] = useState<Set<string>>(
    new Set(SMALL_WIDGETS.map((w) => w.id))
  )
  const [largeVisible, setLargeVisible] = useState<Set<string>>(
    new Set(LARGE_WIDGETS_DEF.map((w) => w.id))
  )
  const [largeOrder, setLargeOrder] = useState(LARGE_WIDGETS_DEF.map(w => w.id))

  const draggingId = useRef<string | null>(null)
  const [dragOver, setDragOver]     = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)

  function onDragStart(id: string) { draggingId.current = id; setIsDragging(id) }
  function onDragEnd()  { draggingId.current = null; setIsDragging(null); setDragOver(null) }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (draggingId.current && draggingId.current !== id) setDragOver(id)
  }
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    const fromId = draggingId.current
    if (!fromId || fromId === targetId) { onDragEnd(); return }
    setLargeOrder(prev => {
      const next = [...prev]
      const fromIdx = next.indexOf(fromId), toIdx = next.indexOf(targetId)
      next.splice(fromIdx, 1); next.splice(toIdx, 0, fromId)
      return next
    })
    onDragEnd()
  }

  function handleToggle(id: string, zone: 'small' | 'large', show: boolean) {
    if (zone === 'small') {
      setSmallVisible((prev) => {
        const next = new Set(prev)
        show ? next.add(id) : next.delete(id)
        return next
      })
    } else {
      setLargeVisible((prev) => {
        const next = new Set(prev)
        show ? next.add(id) : next.delete(id)
        return next
      })
    }
  }

  const visibleLarge = largeOrder.filter(id => largeVisible.has(id))
  const widgetLabel  = (id: string) => LARGE_WIDGETS_DEF.find(w => w.id === id)?.label ?? id

  return (
    <div className="ds-scope">
      <TopBar crumbs={[{ label: 'DS Dashboard' }]} />
      <main className="content">

        {/* Me / Team segmented control */}
        <div className="ds-page-header">
          <div className="ds-toggle-bar">
            {(['me', 'team'] as ViewScope[]).map(s => (
              <button
                key={s}
                className={`ds-toggle-btn${scope === s ? ' active' : ''}`}
                onClick={() => setScope(s)}
              >
                {s === 'me' ? 'Me' : 'Team'}
              </button>
            ))}
          </div>
          {scope === 'team' && (
            <button className="manage-btn" onClick={() => setDrawerOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Manage widgets
            </button>
          )}
        </div>

        {/* Me view */}
        {scope === 'me' && <DSMeDashboard />}

        {/* Team view */}
        {scope === 'team' && <>

          {/* Summary tiles row */}
          <div className="ds-section-label">Overview</div>
          <div className="ds-tiles-row">
            {SMALL_WIDGETS.map((w) => (
              <DSSmallWidget key={w.id} {...w} visible={smallVisible.has(w.id)} />
            ))}
          </div>

          {/* Full-width stacked large widgets */}
          <div className="ds-section-label">Activity &amp; Reports</div>
          <div className="ds-widgets-stack" onDragOver={e => e.preventDefault()}>
            {visibleLarge.map(id => (
              <div
                key={id}
                draggable
                onDragStart={() => onDragStart(id)}
                onDragEnd={onDragEnd}
                onDragOver={e => onDragOver(e, id)}
                onDrop={e => onDrop(e, id)}
                style={{
                  opacity: isDragging === id ? 0.4 : 1,
                  outline: dragOver === id ? '2px solid #6271FF' : 'none',
                  outlineOffset: 2,
                  borderRadius: 12,
                  transition: 'opacity 0.15s',
                }}
              >
                <TeamWidgetContent
                  id={id}
                  gripNode={
                    <div style={{ cursor: 'grab', color: '#C4B5FD', display: 'flex', alignItems: 'center' }} title="Drag to reorder">
                      <GripVertical width={14} height={14} />
                    </div>
                  }
                />
              </div>
            ))}
          </div>

        </>}

      </main>

      <ManageWidgetsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        smallWidgets={SMALL_WIDGETS}
        largeWidgets={LARGE_WIDGETS_DEF}
        smallVisible={smallVisible}
        largeVisible={largeVisible}
        onToggle={handleToggle}
      />
    </div>
  )
}
