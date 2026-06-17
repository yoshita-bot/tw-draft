import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Filter, X, GripVertical } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { DateRangePickerButton, DEFAULT_PRESETS, type DateRange } from '../components/DateRangePicker'
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
import { CLIENTS } from '../data/clientsData'
import { EMPLOYEES } from '../data/employeesData'
import { TEAMS } from '../data/teamsData'
import './dsDashboard.css'

// ── Filter dropdown ───────────────────────────────────────────────────────────

function FilterDropdown({ label, options, selected, onToggle, onClear }: {
  label: string; options: { id: string; label: string }[]
  selected: string[]; onToggle: (id: string) => void; onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const active = selected.length > 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(x => !x)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${active ? '#C4B5FD' : '#E5E7EB'}`, background: active ? '#F5F3FF' : '#fff', fontSize: 12.5, fontWeight: 600, color: active ? '#6C63FF' : '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#C4B5FD' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = active ? '#C4B5FD' : '#E5E7EB' }}
      >
        {label}
        {active && <span style={{ background: '#6C63FF', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2 }}>{selected.length}</span>}
        <ChevronDown width={12} height={12} color="#9CA3AF" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden' }}>
          {active && (
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { onClear(); setOpen(false) }} style={{ fontSize: 11.5, color: '#6C63FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 600 }}>Clear</button>
            </div>
          )}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {options.map(opt => {
              const checked = selected.includes(opt.id)
              return (
                <div key={opt.id} onClick={() => onToggle(opt.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', cursor: 'pointer', background: checked ? '#F5F3FF' : 'transparent' }}
                  onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#FAFAFA' }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = checked ? '#F5F3FF' : 'transparent' }}
                >
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? '#6C63FF' : '#D1D5DB'}`, background: checked ? '#6C63FF' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: '#111827' }}>{opt.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function deptFromRole(role: string): string {
  const r = role.toLowerCase()
  if (r.includes('engineer') || r.includes('developer') || r.includes('devops') || r.includes('systems')) return 'Engineering'
  if (r.includes('designer') || r.includes('ux') || r.includes('ui ')) return 'Design'
  if (r.includes('qa') || r.includes('quality')) return 'QA'
  if (r.includes('product manager') || r.includes('project manager') || r.includes('scrum')) return 'Product & PM'
  if (r.includes('data analyst') || r.includes('data engineer') || r.includes('analytics') || r.includes('business analyst')) return 'Analytics'
  if (r.includes('content') || r.includes('copywriter') || r.includes('seo')) return 'Content'
  return 'Operations'
}

const ALL_CLIENT_OPTIONS = CLIENTS.filter(c => c.id !== 'internal' && c.status !== 'inactive').map(c => ({ id: c.id, label: c.name }))
const ALL_PROJECT_OPTIONS = [...new Set(EMPLOYEES.flatMap(e => e.projects))].sort().map(p => ({ id: p, label: p }))
const ALL_TEAM_OPTIONS = TEAMS.map(t => ({ id: t.id, label: t.name }))

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

  // Time range + filters
  const todayStr = new Date().toISOString().slice(0, 10)
  const [activePreset, setActivePreset] = useState('last_7')
  const [dateRange, setDateRange] = useState<DateRange>(() => DEFAULT_PRESETS.find(p => p.id === 'last_7')!.getRange(todayStr))
  const [filterClients,  setFilterClients]  = useState<string[]>([])
  const [filterProjects, setFilterProjects] = useState<string[]>([])
  const [filterTeams,    setFilterTeams]    = useState<string[]>([])
  function toggleFilter(setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const hasFilters = filterClients.length > 0 || filterProjects.length > 0 || filterTeams.length > 0
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

        {/* Header row: toggle + date/filter + manage widgets */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginLeft: 12 }}>
              <DateRangePickerButton
                start={dateRange.start} end={dateRange.end}
                activePreset={activePreset}
                onApply={r => setDateRange(r)}
                onPresetClick={setActivePreset}
              />
              <div style={{ width: 1, height: 20, background: '#E5E7EB' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Filter width={12} height={12} color="#9CA3AF" />
                <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Filter:</span>
              </div>
              <FilterDropdown label="Client"     options={ALL_CLIENT_OPTIONS}  selected={filterClients}  onToggle={id => toggleFilter(setFilterClients, id)}  onClear={() => setFilterClients([])} />
              <FilterDropdown label="Project"    options={ALL_PROJECT_OPTIONS} selected={filterProjects} onToggle={id => toggleFilter(setFilterProjects, id)} onClear={() => setFilterProjects([])} />
              <FilterDropdown label="Team"       options={ALL_TEAM_OPTIONS}    selected={filterTeams}    onToggle={id => toggleFilter(setFilterTeams, id)}    onClear={() => setFilterTeams([])} />
              {hasFilters && (
                <button onClick={() => { setFilterClients([]); setFilterProjects([]); setFilterTeams([]) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit' }}
                ><X width={11} height={11} /> Clear filters</button>
              )}
            </div>
          )}

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
