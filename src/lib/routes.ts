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
  attendance:           '/attendance',
  projects:    '/projects',
  schedule:    '/schedule',
  reports:     '/reports',
  payments:    '/payments',
  people:      '/people',
  settings:    '/settings',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

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
