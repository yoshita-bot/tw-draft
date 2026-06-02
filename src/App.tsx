import { Routes, Route, Navigate } from 'react-router-dom'
import { NavSidebar } from './components/NavSidebar'
import { DashboardPage } from './pages/DashboardPage'
import { TimesheetsPage } from './pages/TimesheetsPage'
import { ActivityPage } from './pages/ActivityPage'
import { StubPage } from './pages/StubPage'
import { ROUTES } from './lib/routes'

const STUB_PATHS = [
  ROUTES.attendance,
  ROUTES.projects,
  ROUTES.schedule,
  ROUTES.reports,
  ROUTES.payments,
  ROUTES.people,
  ROUTES.settings,
] as const

export default function App() {
  return (
    <div className="shell">
      <NavSidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path={ROUTES.dashboard}  element={<DashboardPage />} />
          <Route path={ROUTES.timesheets} element={<TimesheetsPage />} />

          {/* Activity — /activity redirects to screenshots; sub-routes render the page */}
          <Route path={ROUTES.activity} element={<Navigate to={ROUTES.activityScreenshots} replace />} />
          <Route path={ROUTES.activityScreenshots} element={<ActivityPage view="screenshots" />} />
          <Route path={ROUTES.activityApps}        element={<ActivityPage view="apps" />} />

          {/* Stub pages — each in-development section has a real route */}
          {STUB_PATHS.map(p => (
            <Route key={p} path={p} element={<StubPage path={p} />} />
          ))}
          {/* People sub-routes (worker profile deep-link) */}
          <Route path={`${ROUTES.people}/:workerId`} element={<StubPage path={ROUTES.people} />} />

          <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
        </Routes>
      </div>
    </div>
  )
}
