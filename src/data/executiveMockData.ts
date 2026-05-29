// Executive Dashboard Mock Data — Phil (Director) / Rafi (Finance Lead)

export interface ExecSectionConfig {
  id: string
  title: string
  description: string
  span: 1 | 2
}

export const EXEC_ATTENDANCE_KPI = {
  absent:    { value: 7,    trend: +40 },
  tardy:     { value: 12,   trend: +33 },
  shrinkage: { value: 8.4,  trend: +38 },
  lostHours: { value: 18.4, trend: +39 },
}

export const EXEC_FINANCIAL_STATS: Array<{
  label: string
  value: number
  trend: number
  higherIsBetter: boolean
}> = [
  { label: 'Total Earnings', value: 142500, trend: +5.2,  higherIsBetter: true  },
  { label: 'Total Payables', value: 98200,  trend: +3.1,  higherIsBetter: false },
  { label: 'Profitability',  value: 44300,  trend: +18.4, higherIsBetter: true  },
]

export const EXEC_LOST_BILLING = {
  lostHours:      18.4,
  avgBillingRate: 85,
  impact:         1564,
  trend:          +39,
  context:        '18.4 lost hours × avg. $85/hr client billing rate across 7 employees this week.',
}

export const EXEC_TREND_DATA = [
  { day: 'Mon', currentHours: 320, previousHours: 305, currentEarnings: 28000, previousEarnings: 26600 },
  { day: 'Tue', currentHours: 295, previousHours: 288, currentEarnings: 25800, previousEarnings: 25100 },
  { day: 'Wed', currentHours: 348, previousHours: 332, currentEarnings: 30400, previousEarnings: 29000 },
  { day: 'Thu', currentHours: 312, previousHours: 298, currentEarnings: 27300, previousEarnings: 26000 },
  { day: 'Fri', currentHours: 280, previousHours: 275, currentEarnings: 24500, previousEarnings: 24000 },
  { day: 'Sat', currentHours: 140, previousHours: 130, currentEarnings: 12200, previousEarnings: 11300 },
  { day: 'Sun', currentHours: 0,   previousHours: 0,   currentEarnings: 0,     previousEarnings: 0     },
]

export const EXEC_SECTION_CONFIGS: Record<string, ExecSectionConfig> = {
  'exec-attendance-kpi': {
    id: 'exec-attendance-kpi',
    title: 'Attendance',
    description: 'Key attendance metrics: absent, tardy, shrinkage, and lost hours for the week.',
    span: 2,
  },
  'exec-weekly-financials': {
    id: 'exec-weekly-financials',
    title: 'Weekly Financials',
    description: 'Earnings, payables, and profitability for the current week.',
    span: 1,
  },
  'exec-trend-chart': {
    id: 'exec-trend-chart',
    title: 'Week-over-Week Trend',
    description: 'Daily hours and earnings compared to the previous week.',
    span: 1,
  },
  'exec-lost-billing': {
    id: 'exec-lost-billing',
    title: 'Lost Billing Impact',
    description: 'Estimated revenue lost from missed hours.',
    span: 2,
  },
}

export const EXEC_DEFAULT_LAYOUT = [
  'exec-attendance-kpi',
  'exec-weekly-financials',
  'exec-trend-chart',
  'exec-lost-billing',
]

export const EXEC_SECTION_GROUPS = [
  {
    label: 'Attendance',
    sections: [EXEC_SECTION_CONFIGS['exec-attendance-kpi']],
  },
  {
    label: 'Finance',
    sections: [
      EXEC_SECTION_CONFIGS['exec-weekly-financials'],
      EXEC_SECTION_CONFIGS['exec-trend-chart'],
      EXEC_SECTION_CONFIGS['exec-lost-billing'],
    ],
  },
]
