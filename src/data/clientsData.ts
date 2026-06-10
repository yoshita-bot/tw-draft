export type ContractType = 'retainer' | 'project' | 'hourly'
export type ClientStatus = 'active' | 'inactive' | 'onboarding'

export interface Client {
  id: string
  name: string
  shortName: string
  industry: string
  timezone: string        // IANA tz name
  utcOffset: number       // for quick display math
  contractType: ContractType
  status: ClientStatus
  color: string           // accent color for UI
  joinedAt: string        // YYYY-MM-DD
  avgMonthlyBilling: number   // USD
  thisMonthBilling: number    // USD
}

export const CLIENTS: Client[] = [
  { id: 'cl-acme',    name: 'Acme Corp',           shortName: 'Acme',      industry: 'Technology',     timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#2563EB', joinedAt: '2021-03-15', avgMonthlyBilling: 12400, thisMonthBilling: 13200 },
  { id: 'cl-vero',    name: 'Vero Health',          shortName: 'Vero',      industry: 'Healthcare',     timezone: 'America/Chicago',     utcOffset: -6, contractType: 'retainer', status: 'active',     color: '#059669', joinedAt: '2020-08-01', avgMonthlyBilling: 9800,  thisMonthBilling: 9800  },
  { id: 'cl-bluesky', name: 'BlueSky Ltd',          shortName: 'BlueSky',   industry: 'Finance',        timezone: 'Europe/London',       utcOffset:  0, contractType: 'project',  status: 'active',     color: '#0EA5E9', joinedAt: '2022-01-10', avgMonthlyBilling: 7200,  thisMonthBilling: 6500  },
  { id: 'cl-nova',    name: 'Nova Media',           shortName: 'Nova',      industry: 'Media',          timezone: 'America/Los_Angeles', utcOffset: -8, contractType: 'hourly',   status: 'active',     color: '#7C3AED', joinedAt: '2022-06-20', avgMonthlyBilling: 4300,  thisMonthBilling: 5100  },
  { id: 'cl-brex',    name: 'Brex Inc',             shortName: 'Brex',      industry: 'Fintech',        timezone: 'America/Denver',      utcOffset: -7, contractType: 'retainer', status: 'active',     color: '#EA580C', joinedAt: '2021-11-05', avgMonthlyBilling: 11000, thisMonthBilling: 10500 },
  { id: 'cl-kabad',   name: 'Kabad Works',          shortName: 'Kabad',     industry: 'Logistics',      timezone: 'Asia/Manila',         utcOffset:  8, contractType: 'project',  status: 'active',     color: '#B91C1C', joinedAt: '2023-02-14', avgMonthlyBilling: 5600,  thisMonthBilling: 6200  },
  { id: 'cl-stellar', name: 'Stellar Systems',      shortName: 'Stellar',   industry: 'Aerospace',      timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#0F766E', joinedAt: '2020-05-22', avgMonthlyBilling: 18500, thisMonthBilling: 18500 },
  { id: 'cl-pinewave',name: 'Pinewave Digital',     shortName: 'Pinewave',  industry: 'E-commerce',     timezone: 'America/Toronto',     utcOffset: -5, contractType: 'hourly',   status: 'active',     color: '#CA8A04', joinedAt: '2023-07-01', avgMonthlyBilling: 3100,  thisMonthBilling: 2800  },
  { id: 'cl-orbis',   name: 'Orbis Analytics',      shortName: 'Orbis',     industry: 'Data & AI',      timezone: 'Europe/Amsterdam',    utcOffset:  1, contractType: 'project',  status: 'onboarding', color: '#9333EA', joinedAt: '2024-04-03', avgMonthlyBilling: 0,     thisMonthBilling: 0     },
  { id: 'cl-redpeak', name: 'Redpeak Ventures',     shortName: 'Redpeak',   industry: 'Investment',     timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#DC2626', joinedAt: '2021-09-18', avgMonthlyBilling: 8700,  thisMonthBilling: 9300  },
  { id: 'cl-haven',   name: 'Haven Insurance',      shortName: 'Haven',     industry: 'Insurance',      timezone: 'America/Chicago',     utcOffset: -6, contractType: 'retainer', status: 'inactive',   color: '#6B7280', joinedAt: '2019-12-01', avgMonthlyBilling: 6200,  thisMonthBilling: 0     },
  { id: 'cl-root',    name: 'Root Education',       shortName: 'Root',      industry: 'EdTech',         timezone: 'America/Los_Angeles', utcOffset: -8, contractType: 'hourly',   status: 'onboarding', color: '#16A34A', joinedAt: '2024-05-15', avgMonthlyBilling: 0,     thisMonthBilling: 800   },
  { id: 'internal',   name: 'Internal',             shortName: 'Internal',  industry: '—',              timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#6B7280', joinedAt: '2019-01-01', avgMonthlyBilling: 0,     thisMonthBilling: 0     },
]

export const CLIENT_MAP = Object.fromEntries(CLIENTS.map(c => [c.id, c])) as Record<string, Client>
