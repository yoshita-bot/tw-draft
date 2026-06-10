import { EMPLOYEES } from './employeesData'

export interface PhoneNumbers {
  work: string
  personal: string
}

export interface PaymentRecord {
  id: string
  date: string       // YYYY-MM-DD
  amount: number     // USD
  period: string     // e.g. "May 2026"
  method: string     // e.g. "Bank Transfer", "Wise"
  status: 'paid' | 'pending' | 'failed'
}

export interface WorkLimits {
  maxHoursPerDay: number | null
  maxHoursPerWeek: number | null
  allowedDaysNote: string      // e.g. "Mon–Fri only"
  breakRequiredAfterH: number | null  // hours before mandatory break
  notes: string
}

export interface EmployeeProfile {
  employeeId: string
  location: string        // city, country
  ipAddress: string       // last known IP
  appVersion: string      // TimeWorks client version last seen
  operatingSystem: string // OS reported by the client
  phones: PhoneNumbers
  paymentHistory: PaymentRecord[]
  workLimits: WorkLimits
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function pr(id: string, date: string, amount: number, period: string, method: string, status: PaymentRecord['status']): PaymentRecord {
  return { id, date, amount, period, method, status }
}

const PROFILES_RAW: EmployeeProfile[] = [
  {
    employeeId: 'e001',
    location: 'New York, USA',
    ipAddress: '192.168.1.101',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+1 (212) 555-0101', personal: '+1 (646) 555-0201' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p001-1', '2026-06-01', 5200, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p001-2', '2026-05-01', 5200, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p001-3', '2026-04-01', 5200, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e002',
    location: 'Austin, USA',
    ipAddress: '192.168.1.102',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 11 23H2',
    phones: { work: '+1 (512) 555-0102', personal: '+1 (512) 555-0202' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p002-1', '2026-06-05', 7200, 'Jun 2026', 'Wise', 'pending'),
      pr('p002-2', '2026-05-05', 7200, 'May 2026', 'Wise', 'paid'),
      pr('p002-3', '2026-04-05', 7200, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e003',
    location: 'Chicago, USA',
    ipAddress: '10.0.0.103',
    appVersion: '2.3.9',
    operatingSystem: 'macOS 13.6 (Ventura)',
    phones: { work: '+1 (312) 555-0103', personal: '+1 (773) 555-0203' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: 'Flexible start time by agreement' },
    paymentHistory: [
      pr('p003-1', '2026-06-05', 6080, 'Jun 2026', 'PayPal', 'pending'),
      pr('p003-2', '2026-05-05', 6080, 'May 2026', 'PayPal', 'paid'),
      pr('p003-3', '2026-04-05', 6080, 'Apr 2026', 'PayPal', 'paid'),
    ],
  },
  {
    employeeId: 'e004',
    location: 'Seattle, USA',
    ipAddress: '172.16.0.104',
    appVersion: '2.4.1',
    operatingSystem: 'Ubuntu 22.04 LTS',
    phones: { work: '+1 (206) 555-0104', personal: '+1 (425) 555-0204' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p004-1', '2026-06-01', 6000, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p004-2', '2026-05-01', 6000, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p004-3', '2026-04-01', 6000, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e005',
    location: 'Denver, USA',
    ipAddress: '192.168.2.105',
    appVersion: '2.4.0',
    operatingSystem: 'Windows 10 22H2',
    phones: { work: '+1 (303) 555-0105', personal: '+1 (720) 555-0205' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p005-1', '2026-06-05', 5120, 'Jun 2026', 'Wise', 'paid'),
      pr('p005-2', '2026-05-05', 5120, 'May 2026', 'Wise', 'paid'),
      pr('p005-3', '2026-04-05', 5120, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e006',
    location: 'Miami, USA',
    ipAddress: '10.10.0.106',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.4 (Sonoma)',
    phones: { work: '+1 (305) 555-0106', personal: '+1 (786) 555-0206' },
    workLimits: { maxHoursPerDay: 6, maxHoursPerWeek: 24, allowedDaysNote: 'Mon–Thu', breakRequiredAfterH: 3, notes: 'Part-time — max 24h/week per contract' },
    paymentHistory: [
      pr('p006-1', '2026-06-05', 2688, 'Jun 2026', 'PayPal', 'pending'),
      pr('p006-2', '2026-05-05', 2688, 'May 2026', 'PayPal', 'paid'),
    ],
  },
  {
    employeeId: 'e007',
    location: 'Manila, Philippines',
    ipAddress: '203.1.10.107',
    appVersion: '2.3.8',
    operatingSystem: 'Windows 11 22H2',
    phones: { work: '+63 2 8555 0107', personal: '+63 917 555 0207' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p007-1', '2026-06-05', 5600, 'Jun 2026', 'Wise', 'pending'),
      pr('p007-2', '2026-05-05', 5600, 'May 2026', 'Wise', 'paid'),
      pr('p007-3', '2026-04-05', 5600, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e008',
    location: 'Cebu City, Philippines',
    ipAddress: '203.1.10.108',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+63 32 8555 0108', personal: '+63 918 555 0208' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p008-1', '2026-06-05', 6400, 'Jun 2026', 'Wise', 'pending'),
      pr('p008-2', '2026-05-05', 6400, 'May 2026', 'Wise', 'paid'),
      pr('p008-3', '2026-04-05', 6400, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e009',
    location: 'Davao, Philippines',
    ipAddress: '203.1.10.109',
    appVersion: '2.4.0',
    operatingSystem: 'Windows 10 21H2',
    phones: { work: '+63 82 8555 0109', personal: '+63 919 555 0209' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: 'Contractor — flexible schedule' },
    paymentHistory: [
      pr('p009-1', '2026-06-05', 4800, 'Jun 2026', 'PayPal', 'pending'),
      pr('p009-2', '2026-05-05', 4800, 'May 2026', 'PayPal', 'paid'),
    ],
  },
  {
    employeeId: 'e010',
    location: 'Manila, Philippines',
    ipAddress: '203.1.11.110',
    appVersion: '2.3.9',
    operatingSystem: 'macOS 13.5 (Ventura)',
    phones: { work: '+63 2 8555 0110', personal: '+63 920 555 0210' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p010-1', '2026-06-01', 4800, 'Jun 2026', 'Wise', 'pending'),
      pr('p010-2', '2026-05-01', 4800, 'May 2026', 'Wise', 'paid'),
      pr('p010-3', '2026-04-01', 4800, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e011',
    location: 'Los Angeles, USA',
    ipAddress: '192.168.3.111',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 11 23H2',
    phones: { work: '+1 (213) 555-0111', personal: '+1 (310) 555-0211' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p011-1', '2026-06-05', 6080, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p011-2', '2026-05-05', 6080, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p011-3', '2026-04-05', 6080, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e012',
    location: 'Boston, USA',
    ipAddress: '172.20.0.112',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+1 (617) 555-0112', personal: '+1 (857) 555-0212' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p012-1', '2026-06-01', 6500, 'Jun 2026', 'Wise', 'pending'),
      pr('p012-2', '2026-05-01', 6500, 'May 2026', 'Wise', 'paid'),
      pr('p012-3', '2026-04-01', 6500, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e013',
    location: 'Portland, USA',
    ipAddress: '10.20.0.113',
    appVersion: '2.3.8',
    operatingSystem: 'Ubuntu 20.04 LTS',
    phones: { work: '+1 (503) 555-0113', personal: '+1 (971) 555-0213' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: 'Contractor — invoices monthly' },
    paymentHistory: [
      pr('p013-1', '2026-06-05', 8000, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p013-2', '2026-05-05', 8000, 'May 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e014',
    location: 'Atlanta, USA',
    ipAddress: '192.168.4.114',
    appVersion: '2.4.0',
    operatingSystem: 'Windows 11 22H2',
    phones: { work: '+1 (404) 555-0114', personal: '+1 (678) 555-0214' },
    workLimits: { maxHoursPerDay: 6, maxHoursPerWeek: 20, allowedDaysNote: 'Mon, Wed, Fri', breakRequiredAfterH: null, notes: 'Part-time — 20h/week cap' },
    paymentHistory: [
      pr('p014-1', '2026-06-05', 2000, 'Jun 2026', 'PayPal', 'pending'),
      pr('p014-2', '2026-05-05', 2000, 'May 2026', 'PayPal', 'paid'),
    ],
  },
  {
    employeeId: 'e015',
    location: 'Nashville, USA',
    ipAddress: '10.30.0.115',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.3 (Sonoma)',
    phones: { work: '+1 (615) 555-0115', personal: '+1 (629) 555-0215' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p015-1', '2026-06-05', 5440, 'Jun 2026', 'Bank Transfer', 'paid'),
      pr('p015-2', '2026-05-05', 5440, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p015-3', '2026-04-05', 5440, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e016',
    location: 'Phoenix, USA',
    ipAddress: '172.31.0.116',
    appVersion: '2.3.9',
    operatingSystem: 'Windows 10 22H2',
    phones: { work: '+1 (602) 555-0116', personal: '+1 (480) 555-0216' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: 'Contractor — no overtime' },
    paymentHistory: [
      pr('p016-1', '2026-06-05', 6400, 'Jun 2026', 'Wise', 'pending'),
      pr('p016-2', '2026-05-05', 6400, 'May 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e017',
    location: 'Quezon City, Philippines',
    ipAddress: '203.2.10.117',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 11 23H2',
    phones: { work: '+63 2 8555 0117', personal: '+63 917 555 0317' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p017-1', '2026-06-05', 7040, 'Jun 2026', 'Wise', 'pending'),
      pr('p017-2', '2026-05-05', 7040, 'May 2026', 'Wise', 'paid'),
      pr('p017-3', '2026-04-05', 7040, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e018',
    location: 'Makati, Philippines',
    ipAddress: '203.2.10.118',
    appVersion: '2.4.0',
    operatingSystem: 'macOS 14.2 (Sonoma)',
    phones: { work: '+63 2 8555 0118', personal: '+63 918 555 0318' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p018-1', '2026-06-01', 5800, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p018-2', '2026-05-01', 5800, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p018-3', '2026-04-01', 5800, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e019',
    location: 'Pasig, Philippines',
    ipAddress: '203.2.10.119',
    appVersion: '2.3.8',
    operatingSystem: 'Windows 10 21H2',
    phones: { work: '+63 2 8555 0119', personal: '+63 919 555 0319' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p019-1', '2026-06-01', 5500, 'Jun 2026', 'Wise', 'pending'),
      pr('p019-2', '2026-05-01', 5500, 'May 2026', 'Wise', 'paid'),
      pr('p019-3', '2026-04-01', 5500, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e020',
    location: 'Manila, Philippines',
    ipAddress: '203.3.10.120',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+63 2 8555 0120', personal: '+63 920 555 0420' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p020-1', '2026-06-05', 5760, 'Jun 2026', 'Wise', 'pending'),
      pr('p020-2', '2026-05-05', 5760, 'May 2026', 'Wise', 'paid'),
      pr('p020-3', '2026-04-05', 5760, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e021',
    location: 'Cebu City, Philippines',
    ipAddress: '203.3.10.121',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 11 23H2',
    phones: { work: '+63 32 8555 0121', personal: '+63 921 555 0421' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p021-1', '2026-06-05', 7360, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p021-2', '2026-05-05', 7360, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p021-3', '2026-04-05', 7360, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e022',
    location: 'Manila, Philippines',
    ipAddress: '203.3.10.122',
    appVersion: '2.4.0',
    operatingSystem: 'macOS 14.1 (Sonoma)',
    phones: { work: '+63 2 8555 0122', personal: '+63 922 555 0422' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: 'New hire — onboarding period' },
    paymentHistory: [
      pr('p022-1', '2026-06-05', 6720, 'Jun 2026', 'Wise', 'pending'),
    ],
  },
  {
    employeeId: 'e023',
    location: 'San Francisco, USA',
    ipAddress: '192.168.5.123',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+1 (415) 555-0123', personal: '+1 (628) 555-0223' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p023-1', '2026-06-05', 6240, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p023-2', '2026-05-05', 6240, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p023-3', '2026-04-05', 6240, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e024',
    location: 'Washington DC, USA',
    ipAddress: '172.18.0.124',
    appVersion: '2.3.9',
    operatingSystem: 'Windows 11 22H2',
    phones: { work: '+1 (202) 555-0124', personal: '+1 (240) 555-0224' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p024-1', '2026-06-01', 5300, 'Jun 2026', 'Wise', 'pending'),
      pr('p024-2', '2026-05-01', 5300, 'May 2026', 'Wise', 'paid'),
      pr('p024-3', '2026-04-01', 5300, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e025',
    location: 'Taguig, Philippines',
    ipAddress: '203.4.10.125',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 10 22H2',
    phones: { work: '+63 2 8555 0125', personal: '+63 925 555 0525' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: 'Contractor — invoices bi-weekly' },
    paymentHistory: [
      pr('p025-1', '2026-06-13', 3280, 'Jun 2026 (2)', 'Bank Transfer', 'pending'),
      pr('p025-2', '2026-05-30', 3280, 'May 2026 (2)', 'Bank Transfer', 'paid'),
      pr('p025-3', '2026-05-16', 3280, 'May 2026 (1)', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e026',
    location: 'Dallas, USA',
    ipAddress: '10.40.0.126',
    appVersion: '2.4.0',
    operatingSystem: 'macOS 13.6 (Ventura)',
    phones: { work: '+1 (214) 555-0126', personal: '+1 (469) 555-0226' },
    workLimits: { maxHoursPerDay: 5, maxHoursPerWeek: 20, allowedDaysNote: 'Tue, Wed, Thu', breakRequiredAfterH: null, notes: 'Part-time — 20h/week max' },
    paymentHistory: [
      pr('p026-1', '2026-06-05', 2240, 'Jun 2026', 'PayPal', 'pending'),
      pr('p026-2', '2026-05-05', 2240, 'May 2026', 'PayPal', 'paid'),
    ],
  },
  {
    employeeId: 'e027',
    location: 'Manila, Philippines',
    ipAddress: '203.5.10.127',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 11 23H2',
    phones: { work: '+63 2 8555 0127', personal: '+63 927 555 0627' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: 'Onboarding — probation period ends Aug 2026' },
    paymentHistory: [
      pr('p027-1', '2026-06-05', 6880, 'Jun 2026', 'Wise', 'pending'),
      pr('p027-2', '2026-05-05', 6880, 'May 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e028',
    location: 'New York, USA',
    ipAddress: '192.168.6.128',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+1 (212) 555-0128', personal: '+1 (347) 555-0228' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: 'Onboarding — probation period ends Sep 2026' },
    paymentHistory: [
      pr('p028-1', '2026-06-05', 5920, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p028-2', '2026-05-05', 5920, 'May 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e029',
    location: 'New York, USA',
    ipAddress: '172.22.0.129',
    appVersion: '2.3.9',
    operatingSystem: 'Ubuntu 22.04 LTS',
    phones: { work: '+1 (212) 555-0129', personal: '+1 (917) 555-0229' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: '' },
    paymentHistory: [
      pr('p029-1', '2026-06-01', 5600, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p029-2', '2026-05-01', 5600, 'May 2026', 'Bank Transfer', 'paid'),
      pr('p029-3', '2026-04-01', 5600, 'Apr 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e030',
    location: 'Charlotte, USA',
    ipAddress: '10.50.0.130',
    appVersion: '2.4.0',
    operatingSystem: 'Windows 11 22H2',
    phones: { work: '+1 (704) 555-0130', personal: '+1 (980) 555-0230' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: 'Contractor — no overtime' },
    paymentHistory: [
      pr('p030-1', '2026-06-05', 8000, 'Jun 2026', 'Wise', 'pending'),
      pr('p030-2', '2026-05-05', 8000, 'May 2026', 'Wise', 'paid'),
      pr('p030-3', '2026-04-05', 8000, 'Apr 2026', 'Wise', 'paid'),
    ],
  },
  {
    employeeId: 'e031',
    location: 'Quezon City, Philippines',
    ipAddress: '203.6.10.131',
    appVersion: '2.4.1',
    operatingSystem: 'Windows 10 22H2',
    phones: { work: '+63 2 8555 0131', personal: '+63 931 555 0731' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: 4, notes: 'Onboarding — probation period ends Jun 2026' },
    paymentHistory: [
      pr('p031-1', '2026-06-01', 4500, 'Jun 2026', 'Bank Transfer', 'pending'),
      pr('p031-2', '2026-05-01', 4500, 'May 2026', 'Bank Transfer', 'paid'),
    ],
  },
  {
    employeeId: 'e032',
    location: 'New York, USA',
    ipAddress: '192.168.0.1',
    appVersion: '2.4.1',
    operatingSystem: 'macOS 14.5 (Sonoma)',
    phones: { work: '+1 (212) 555-0132', personal: '+1 (646) 555-0232' },
    workLimits: { maxHoursPerDay: 8, maxHoursPerWeek: 40, allowedDaysNote: 'Mon–Fri', breakRequiredAfterH: null, notes: '' },
    paymentHistory: [
      pr('p032-1', '2026-06-01', 7000, 'Jun 2026', 'Internal', 'pending'),
      pr('p032-2', '2026-05-01', 7000, 'May 2026', 'Internal', 'paid'),
      pr('p032-3', '2026-04-01', 7000, 'Apr 2026', 'Internal', 'paid'),
    ],
  },
  {
    employeeId: 'e033',
    location: 'N/A',
    ipAddress: '127.0.0.1',
    appVersion: 'N/A',
    operatingSystem: 'N/A',
    phones: { work: 'N/A', personal: 'N/A' },
    workLimits: { maxHoursPerDay: null, maxHoursPerWeek: null, allowedDaysNote: 'Always on', breakRequiredAfterH: null, notes: 'Automated system account' },
    paymentHistory: [],
  },
]

export const PROFILE_MAP: Record<string, EmployeeProfile> = Object.fromEntries(
  PROFILES_RAW.map(p => [p.employeeId, p])
)

// Ensure every employee has a fallback profile
EMPLOYEES.forEach(e => {
  if (!PROFILE_MAP[e.id]) {
    PROFILE_MAP[e.id] = {
      employeeId: e.id,
      location: 'Unknown',
      ipAddress: '0.0.0.0',
      appVersion: '—',
      operatingSystem: '—',
      phones: { work: '—', personal: '—' },
      workLimits: { maxHoursPerDay: null, maxHoursPerWeek: null, allowedDaysNote: '', breakRequiredAfterH: null, notes: '' },
      paymentHistory: [],
    }
  }
})
