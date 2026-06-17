import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronDown, Filter, X } from 'lucide-react'
import { TopBar } from '../components/TopBar'
import { MeDashboard } from './MeDashboard'
import { SmallWidget } from '../components/widgets/SmallWidget'
import { AttendanceKPIs } from '../components/widgets/AttendanceKPIs'
import { SchedulesWidget } from '../components/widgets/SchedulesWidget'
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
import { PROJECTS } from '../data/projectsData'
import { EMPLOYEES } from '../data/employeesData'

// ── Helpers ───────────────────────────────────────────────────────────────────

type TimePreset = 'today' | 'this_week' | 'last_7' | 'this_month' | 'last_30' | 'custom'

const TIME_PRESETS: { id: TimePreset; label: string }[] = [
  { id: 'today',      label: 'Today' },
  { id: 'this_week',  label: 'This Week' },
  { id: 'last_7',     label: 'Last 7 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_30',    label: 'Last 30 Days' },
]

function getPresetLabel(preset: TimePreset, customStart?: string, customEnd?: string) {
  if (preset === 'custom' && customStart && customEnd) {
    const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(customStart)} – ${fmt(customEnd)}`
  }
  return TIME_PRESETS.find(p => p.id === preset)?.label ?? 'This Week'
}

function TimeRangePicker({ preset, customStart, customEnd, onPreset, onCustom }: {
  preset: TimePreset
  customStart: string
  customEnd: string
  onPreset: (p: TimePreset) => void
  onCustom: (s: string, e: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tmpStart, setTmpStart] = useState(customStart)
  const [tmpEnd, setTmpEnd] = useState(customEnd)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(x => !x)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12.5, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#C4B5FD')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
      >
        <CalendarDays width={13} height={13} color="#6C63FF" />
        {getPresetLabel(preset, customStart, customEnd)}
        <ChevronDown width={12} height={12} color="#9CA3AF" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, overflow: 'hidden' }}>
          {TIME_PRESETS.map(p => (
            <div key={p.id} onClick={() => { onPreset(p.id); setOpen(false) }}
              style={{ padding: '9px 14px', fontSize: 13, fontWeight: preset === p.id ? 700 : 500, color: preset === p.id ? '#6C63FF' : '#374151', cursor: 'pointer', background: preset === p.id ? '#F5F3FF' : 'transparent' }}
              onMouseEnter={e => { if (preset !== p.id) e.currentTarget.style.background = '#FAFAFA' }}
              onMouseLeave={e => { if (preset !== p.id) e.currentTarget.style.background = 'transparent' }}
            >{p.label}</div>
          ))}
          <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 14px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Custom Range</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <input type="date" value={tmpStart} onChange={e => setTmpStart(e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', outline: 'none' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>–</span>
              <input type="date" value={tmpEnd} onChange={e => setTmpEnd(e.target.value)} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 12, color: '#111827', outline: 'none' }} />
            </div>
            <button
              onClick={() => { if (tmpStart && tmpEnd && tmpStart <= tmpEnd) { onPreset('custom'); onCustom(tmpStart, tmpEnd); setOpen(false) } }}
              disabled={!tmpStart || !tmpEnd || tmpStart > tmpEnd}
              style={{ width: '100%', padding: '6px', borderRadius: 6, border: 'none', background: tmpStart && tmpEnd && tmpStart <= tmpEnd ? '#6C63FF' : '#E5E7EB', color: tmpStart && tmpEnd && tmpStart <= tmpEnd ? '#fff' : '#9CA3AF', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterDropdown({ label, options, selected, onToggle, onClear }: {
  label: string
  options: { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  const active = selected.length > 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(x => !x)}
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
const ALL_DEPT_OPTIONS = [...new Set(EMPLOYEES.map(e => deptFromRole(e.role)))].sort().map(d => ({ id: d, label: d }))

type ViewScope = 'me' | 'team'

export function DashboardPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scope, setScope]           = useState<ViewScope>('team')
  const [smallVisible, setSmallVisible] = useState<Set<string>>(
    new Set(SMALL_WIDGETS.map((w) => w.id))
  )
  const [largeVisible, setLargeVisible] = useState<Set<string>>(
    new Set(LARGE_WIDGETS_DEF.map((w) => w.id))
  )

  // Team view filters
  const [timePreset, setTimePreset] = useState<TimePreset>('this_week')
  const todayStr = new Date().toISOString().slice(0, 10)
  const [customStart, setCustomStart] = useState(todayStr)
  const [customEnd, setCustomEnd] = useState(todayStr)
  const [filterClients, setFilterClients] = useState<string[]>([])
  const [filterProjects, setFilterProjects] = useState<string[]>([])
  const [filterDepts, setFilterDepts] = useState<string[]>([])

  function toggleFilter(setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const hasFilters = filterClients.length > 0 || filterProjects.length > 0 || filterDepts.length > 0

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

  const lv = (id: string) => largeVisible.has(id)

  return (
    <>
      <TopBar crumbs={[{ label: 'Dashboard' }]} />
      <main className="content">
        {/* View scope toggle */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 99, padding: 3, gap: 2, width: 'fit-content', marginBottom: 20 }}>
          {(['me', 'team'] as ViewScope[]).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              style={{
                padding: '5px 18px', border: 'none', borderRadius: 99, cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                background: scope === s ? '#fff' : 'transparent',
                color: scope === s ? '#111827' : '#6B7280',
                boxShadow: scope === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {s === 'me' ? 'Me' : 'Team'}
            </button>
          ))}
        </div>

        {/* Me view */}
        {scope === 'me' && <MeDashboard />}

        {/* Team view — small widgets */}
        {scope === 'team' && <>

        {/* Filter + time toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <TimeRangePicker
            preset={timePreset}
            customStart={customStart}
            customEnd={customEnd}
            onPreset={setTimePreset}
            onCustom={(s, e) => { setCustomStart(s); setCustomEnd(e) }}
          />
          <div style={{ width: 1, height: 20, background: '#E5E7EB', margin: '0 2px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter width={12} height={12} color="#9CA3AF" />
            <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>Filter:</span>
          </div>
          <FilterDropdown label="Client" options={ALL_CLIENT_OPTIONS} selected={filterClients} onToggle={id => toggleFilter(setFilterClients, id)} onClear={() => setFilterClients([])} />
          <FilterDropdown label="Project" options={ALL_PROJECT_OPTIONS} selected={filterProjects} onToggle={id => toggleFilter(setFilterProjects, id)} onClear={() => setFilterProjects([])} />
          <FilterDropdown label="Department" options={ALL_DEPT_OPTIONS} selected={filterDepts} onToggle={id => toggleFilter(setFilterDepts, id)} onClear={() => setFilterDepts([])} />
          {hasFilters && (
            <button
              onClick={() => { setFilterClients([]); setFilterProjects([]); setFilterDepts([]) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <X width={11} height={11} /> Clear filters
            </button>
          )}
        </div>

        {/* Small widgets */}
        <div className="section-header">
          <span className="section-title">Overview</span>
          <button className="manage-btn" onClick={() => setDrawerOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Manage widgets
          </button>
        </div>

        <div className="small-widgets-zone">
          {SMALL_WIDGETS.map((w) => (
            <SmallWidget key={w.id} {...w} visible={smallVisible.has(w.id)} />
          ))}
        </div>

        {/* Large widgets */}
        <div style={{ marginTop: 24 }}>
          <div className="section-title" style={{ marginBottom: 14 }}>Activity & Reports</div>
          <div className="large-widgets-zone">
            {lv('lw-shifts')      && <AttendanceKPIs />}
            {lv('lw-schedules')   && <SchedulesWidget />}
            {lv('lw-screenshots') && <RecentActivity />}
            {lv('lw-lowact')      && <LowActivityWidget />}
            {lv('lw-online')      && <WhosOnlineWidget />}
            {lv('lw-limits')      && <WeeklyLimitsWidget />}
            {lv('lw-amounts')     && <AmountsOwedWidget />}
            {lv('lw-timeoff-requests')  && <TimeOffRequestsWidget />}
            {lv('lw-timeoff-upcoming')  && <TimeOffUpcomingWidget />}
            {lv('lw-projects')    && <ProjectActivityWidget />}
            {lv('lw-todos')       && <TodosWidget />}
          </div>
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
    </>
  )
}
