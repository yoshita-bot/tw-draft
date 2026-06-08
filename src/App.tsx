import { Routes, Route, Navigate } from 'react-router-dom'
import { NavSidebar } from './components/NavSidebar'
import { DashboardPage } from './pages/DashboardPage'
import { TimesheetsPage } from './pages/TimesheetsPage'
import { ActivityPage } from './pages/ActivityPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { TasksPage } from './pages/TasksPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { StubPage } from './pages/StubPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { TimeOffRequestsPage } from './pages/TimeOffRequestsPage'
import { EmployeeTimeOffPage } from './pages/EmployeeTimeOffPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TimeActivityPage } from './pages/TimeActivityPage'
import { ROUTES } from './lib/routes'

const STUB_PATHS = [
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
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
            <Route path={ROUTES.dashboard}  element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path={ROUTES.timesheets} element={<ErrorBoundary><TimesheetsPage /></ErrorBoundary>} />

            {/* Activity */}
            <Route path={ROUTES.activity} element={<Navigate to={ROUTES.activityScreenshots} replace />} />
            <Route path={ROUTES.activityScreenshots} element={<ErrorBoundary><ActivityPage view="screenshots" /></ErrorBoundary>} />
            <Route path={ROUTES.activityApps}        element={<ErrorBoundary><ActivityPage view="apps" /></ErrorBoundary>} />

            {/* Projects */}
            <Route path={ROUTES.projects} element={<ErrorBoundary><ProjectsPage /></ErrorBoundary>} />
            <Route path={`${ROUTES.projects}/:projectId`} element={<ErrorBoundary><ProjectDetailPage /></ErrorBoundary>} />

            {/* Tasks */}
            <Route path={ROUTES.todos} element={<ErrorBoundary><TasksPage /></ErrorBoundary>} />
            <Route path={`${ROUTES.todos}/:taskId`} element={<ErrorBoundary><TaskDetailPage /></ErrorBoundary>} />

            {/* Schedule */}
            <Route path={ROUTES.schedule} element={<ErrorBoundary><SchedulesPage /></ErrorBoundary>} />
            <Route path={ROUTES.timeOffRequests} element={<ErrorBoundary><TimeOffRequestsPage /></ErrorBoundary>} />
            <Route path={ROUTES.myTimeOff}       element={<ErrorBoundary><EmployeeTimeOffPage /></ErrorBoundary>} />

            {/* Reports */}
            <Route path={ROUTES.reportsTimeActivity} element={<ErrorBoundary><TimeActivityPage /></ErrorBoundary>} />

            {/* Stub pages */}
            {STUB_PATHS.map(p => (
              <Route key={p} path={p} element={<ErrorBoundary><StubPage path={p} /></ErrorBoundary>} />
            ))}
            <Route path={`${ROUTES.people}/:workerId`} element={<ErrorBoundary><StubPage path={ROUTES.people} /></ErrorBoundary>} />

            <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  )
}
