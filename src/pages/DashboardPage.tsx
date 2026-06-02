import { useState } from 'react'
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
import { TimeOffWidget } from '../components/widgets/TimeOffWidget'
import { ProjectActivityWidget } from '../components/widgets/ProjectActivityWidget'
import { TodosWidget } from '../components/widgets/TodosWidget'
import { ManageWidgetsDrawer } from '../components/ManageWidgetsDrawer'
import { SMALL_WIDGETS, LARGE_WIDGETS_DEF } from '../data/dashboardData'

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
      <TopBar title="Dashboard" />
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
            {lv('lw-timeoff')     && <TimeOffWidget />}
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
