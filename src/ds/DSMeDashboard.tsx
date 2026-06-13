import { useState, useRef } from 'react'
import { GripVertical } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ManageWidgetsDrawer } from '../components/ManageWidgetsDrawer'
import { ME_SMALL_WIDGETS, ME_LARGE_WIDGETS, WidgetContent } from '../pages/MeDashboard'
import { ME } from '../data/meMockData'
import { ROUTES } from '../lib/routes'

const WIDGET_ROUTES: Record<string, string> = {
  'me-lw-timesheet': ROUTES.timesheets,
  'me-lw-work':      ROUTES.todos,
  'me-lw-timeoff':   ROUTES.myTimeOff,
  'me-lw-activity':  ROUTES.activityScreenshots,
}

function fmtH(h: number) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

// DS-native tiles built from live ME data
const DS_ME_TILES = [
  {
    id: 'me-tile-hours-today',
    label: 'Hours Today',
    value: fmtH(ME.todayStats.hoursWorked),
    delta: `of ${ME.todayStats.expectedHours}h expected`,
    up: ME.todayStats.hoursWorked >= ME.todayStats.expectedHours * 0.8,
  },
  {
    id: 'me-tile-hours-week',
    label: 'Hours This Week',
    value: `${ME.thisWeek.hoursWorked}h`,
    delta: `of ${ME.thisWeek.expectedHours}h expected`,
    up: ME.thisWeek.hoursWorked >= ME.thisWeek.expectedHours * 0.8,
  },
  {
    id: 'me-tile-activity-today',
    label: 'Activity Today',
    value: `${ME.todayStats.activityRate}%`,
    delta: ME.todayStats.activityRate >= ME.thisWeek.activityRate
      ? `+${ME.todayStats.activityRate - ME.thisWeek.activityRate}% vs weekly avg`
      : `${ME.todayStats.activityRate - ME.thisWeek.activityRate}% vs weekly avg`,
    up: ME.todayStats.activityRate >= ME.thisWeek.activityRate,
  },
  {
    id: 'me-tile-activity-week',
    label: 'Weekly Activity',
    value: `${ME.thisWeek.activityRate}%`,
    delta: 'weekly average',
    up: ME.thisWeek.activityRate >= 65,
  },
  {
    id: 'me-tile-earnings-today',
    label: 'Earnings Today',
    value: `$${ME.todayStats.earnings.toFixed(0)}`,
    delta: `at $${ME.hourlyRate}/hr`,
    up: true,
  },
  {
    id: 'me-tile-earnings-week',
    label: 'Earnings This Week',
    value: `$${ME.thisWeek.earnings.toFixed(0)}`,
    delta: `of ~$${(ME.hourlyRate * ME.thisWeek.expectedHours).toFixed(0)} projected`,
    up: true,
  },
]

export function DSMeDashboard() {
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [smallVisible, setSmallVisible] = useState(new Set(ME_SMALL_WIDGETS.map(w => w.id)))
  const [largeVisible, setLargeVisible] = useState(new Set(ME_LARGE_WIDGETS.map(w => w.id)))
  const [largeOrder, setLargeOrder]     = useState(ME_LARGE_WIDGETS.map(w => w.id))

  const draggingId = useRef<string | null>(null)
  const [dragOver, setDragOver]     = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState<string | null>(null)

  function handleToggle(id: string, zone: 'small' | 'large', show: boolean) {
    if (zone === 'small') {
      setSmallVisible(prev => { const n = new Set(prev); show ? n.add(id) : n.delete(id); return n })
    } else {
      setLargeVisible(prev => { const n = new Set(prev); show ? n.add(id) : n.delete(id); return n })
    }
  }

  function onDragStart(id: string) { draggingId.current = id; setIsDragging(id) }
  function onDragEnd() { draggingId.current = null; setIsDragging(null); setDragOver(null) }
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

  const visibleLarge    = largeOrder.filter(id => largeVisible.has(id))
  const widgetLabel     = (id: string) => ME_LARGE_WIDGETS.find(w => w.id === id)?.label ?? id
  const visibleTileIds  = ME_SMALL_WIDGETS.filter(w => smallVisible.has(w.id)).map(w => w.id)

  return (
    <>
      {/* Overview — tiles row */}
      <div className="ds-me-header">
        <div className="ds-section-label">Overview</div>
        <button className="manage-btn" onClick={() => setDrawerOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Manage widgets
        </button>
      </div>

      <div className="ds-tiles-row">
        {DS_ME_TILES.filter((_, i) => visibleTileIds[i] !== undefined).map((t) => (
          <div key={t.id} className="ds-status-tile">
            <div className="ds-tile-label">{t.label}</div>
            <div className="ds-tile-value">{t.value}</div>
            <div className={`ds-tile-delta ${t.up ? 'up' : 'down'}`}>
              <span className="ds-tile-arrow">{t.up ? '↑' : '↓'}</span>
              {t.delta}
            </div>
          </div>
        ))}
      </div>

      {/* My Workspace — large widgets grid */}
      <div className="ds-section-label">My Workspace</div>
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
            <div className="large-widget">
              <div className="widget-header">
                <span className="widget-title">{widgetLabel(id)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {WIDGET_ROUTES[id] && (
                    <Link to={WIDGET_ROUTES[id]} className="widget-link" style={{ textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                      View all →
                    </Link>
                  )}
                  <div style={{ cursor: 'grab', color: '#C4B5FD', display: 'flex', alignItems: 'center' }} title="Drag to reorder">
                    <GripVertical width={14} height={14} />
                  </div>
                </div>
              </div>
              <WidgetContent id={id} />
            </div>
          </div>
        ))}
      </div>

      <ManageWidgetsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        smallWidgets={ME_SMALL_WIDGETS}
        largeWidgets={ME_LARGE_WIDGETS}
        smallVisible={smallVisible}
        largeVisible={largeVisible}
        onToggle={handleToggle}
      />
    </>
  )
}
