/**
 * Central route registry — single source of truth for every path in the app.
 * Import this instead of hard-coding strings to get type-safety and easy refactoring.
 */

export const ROUTES = {
  dashboard:            '/dashboard',
  timesheets:           '/timesheets',
  activity:             '/activity',
  activityScreenshots:  '/activity/screenshots',
  activityApps:         '/activity/apps',
  activityDeleted:      '/activity/deleted',
  projects:             '/projects',
  todos:                '/todos',
  todoDetail:           '/todos/:taskId',
  schedule:             '/schedule',
  timeOffRequests:      '/time-off-requests',
  myTimeOff:            '/my-time-off',
  reports:              '/reports',
  reportsTimeActivity:  '/reports/time-activity',
  reportsDailyTotal:    '/reports/daily-total',
  reportsTimeEdits:     '/reports/time-edits',
  reportsWorkSessions:  '/reports/work-sessions',
  people:               '/people',
  clients:              '/clients',
  clientProfile:        '/clients/:clientId',
  teams:                '/teams',
  teamDetail:           '/teams/:teamId',
  payments:             '/payments',
  pastPayments:         '/past-payments',
  settings:             '/settings',
  settingsEmployees:    '/settings/employees',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export type Crumb = { label: string; path?: string }

/** Read ancestor crumbs passed via navigation state */
export function getStateCrumbs(state: unknown): Crumb[] | null {
  if (state && typeof state === 'object' && 'crumbs' in state) {
    return (state as { crumbs: Crumb[] }).crumbs
  }
  return null
}

/** Navigate to Timesheets pre-filtered to a specific worker */
export function timesheetsForWorker(workerId: string) {
  return `${ROUTES.timesheets}?worker=${workerId}`
}

/** Navigate to Timesheets pre-filtered to a specific date */
export function timesheetsForDate(date: string) {
  return `${ROUTES.timesheets}?date=${date}`
}

/** Navigate to a worker's People profile */
export function peopleProfile(workerId: string) {
  return `${ROUTES.people}/${workerId}`
}

/** Navigate to the People page filtered by client */
export function clientPage(clientName: string) {
  return `${ROUTES.people}?client=${encodeURIComponent(clientName)}`
}

/** Navigate to Activity > Screenshots pre-filtered to a specific worker by name */
export function activityForWorker(workerName: string, date = 'today') {
  return `${ROUTES.activityScreenshots}?worker=${encodeURIComponent(workerName)}&date=${date}`
}

/** Navigate to Work Sessions pre-filtered to a specific employee */
export function workSessionsForMember(empId: string) {
  return `${ROUTES.reportsWorkSessions}?member=${encodeURIComponent(empId)}`
}

/** Navigate to Time Edits pre-filtered to a specific employee */
export function timeEditsForMember(empId: string) {
  return `${ROUTES.reportsTimeEdits}?member=${encodeURIComponent(empId)}`
}

/** Navigate to Time Off Requests pre-filtered to a specific person by name */
export function timeOffForMember(memberName: string) {
  return `${ROUTES.timeOffRequests}?member=${encodeURIComponent(memberName)}`
}
