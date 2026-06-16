import { Routes, Route, Navigate } from 'react-router-dom'
import { NavSidebar } from './components/NavSidebar'
import { DSDashboardPage } from './ds/DSDashboardPage'
import { TimesheetsPage } from './pages/TimesheetsPage'
import { ActivityPage } from './pages/ActivityPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { TasksPage } from './pages/TasksPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { StubPage } from './pages/StubPage'
import { SecurityPage } from './pages/SecurityPage'
import { TrackingRulesPage } from './pages/TrackingRulesPage'
import { PeoplePage } from './pages/PeoplePage'
import { PersonProfilePage } from './pages/PersonProfilePage'
import { SchedulesPage } from './pages/SchedulesPage'
import { TimeOffRequestsPage } from './pages/TimeOffRequestsPage'
import { EmployeeTimeOffPage } from './pages/EmployeeTimeOffPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TimeActivityPage } from './pages/TimeActivityPage'
import { ClientsPage } from './pages/ClientsPage'
import { ClientProfilePage } from './pages/ClientProfilePage'
import { TeamsPage } from './pages/TeamsPage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { PastPaymentsPage } from './pages/PastPaymentsPage'
import { DailyTotalPage } from './pages/DailyTotalPage'
import { TimeEditsPage } from './pages/TimeEditsPage'
import { WorkSessionsPage } from './pages/WorkSessionsPage'
import { DeletedScreenshotsPage } from './pages/DeletedScreenshotsPage'
import { ROUTES } from './lib/routes'

const STUB_PATHS = [
  ROUTES.reports,
  ROUTES.settings,
  ROUTES.settingsEmployees,
] as const

export default function App() {
  return (
    <div className="shell">
      <NavSidebar />
      <div className="main">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
            <Route path={ROUTES.dashboard}  element={<ErrorBoundary><DSDashboardPage /></ErrorBoundary>} />
            <Route path={ROUTES.timesheets} element={<ErrorBoundary><TimesheetsPage /></ErrorBoundary>} />

            {/* Activity */}
            <Route path={ROUTES.activity} element={<Navigate to={ROUTES.activityScreenshots} replace />} />
            <Route path={ROUTES.activityScreenshots} element={<ErrorBoundary><ActivityPage view="screenshots" /></ErrorBoundary>} />
            <Route path={ROUTES.activityApps}        element={<ErrorBoundary><ActivityPage view="apps" /></ErrorBoundary>} />
            <Route path={ROUTES.activityDeleted}     element={<ErrorBoundary><DeletedScreenshotsPage /></ErrorBoundary>} />

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
            <Route path={ROUTES.reportsDailyTotal}   element={<ErrorBoundary><DailyTotalPage /></ErrorBoundary>} />
            <Route path={ROUTES.reportsTimeEdits}    element={<ErrorBoundary><TimeEditsPage /></ErrorBoundary>} />
            <Route path={ROUTES.reportsWorkSessions} element={<ErrorBoundary><WorkSessionsPage /></ErrorBoundary>} />

            {/* People */}
            <Route path={ROUTES.people} element={<ErrorBoundary><PeoplePage /></ErrorBoundary>} />
            <Route path={`${ROUTES.people}/:workerId`} element={<ErrorBoundary><PersonProfilePage /></ErrorBoundary>} />

            {/* Clients */}
            <Route path={ROUTES.clients} element={<ErrorBoundary><ClientsPage /></ErrorBoundary>} />
            <Route path={`${ROUTES.clients}/:clientId`} element={<ErrorBoundary><ClientProfilePage /></ErrorBoundary>} />

            {/* Teams */}
            <Route path={ROUTES.teams} element={<ErrorBoundary><TeamsPage /></ErrorBoundary>} />
            <Route path={`${ROUTES.teams}/:teamId`} element={<ErrorBoundary><TeamDetailPage /></ErrorBoundary>} />

            {/* Payments */}
            <Route path={ROUTES.payments} element={<ErrorBoundary><PaymentsPage /></ErrorBoundary>} />
            <Route path={ROUTES.pastPayments} element={<ErrorBoundary><PastPaymentsPage /></ErrorBoundary>} />

            {/* Settings */}
            <Route path={ROUTES.settingsSecurity}      element={<ErrorBoundary><SecurityPage /></ErrorBoundary>} />
            <Route path={ROUTES.settingsTrackingRules} element={<ErrorBoundary><TrackingRulesPage /></ErrorBoundary>} />

            {/* Stub pages */}
            {STUB_PATHS.map(p => (
              <Route key={p} path={p} element={<ErrorBoundary><StubPage path={p} /></ErrorBoundary>} />
            ))}

            <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
          </Routes>
        </ErrorBoundary>
      </div>
    </div>
  )
}
