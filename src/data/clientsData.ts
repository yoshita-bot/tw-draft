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
}

export const CLIENTS: Client[] = [
  { id: 'cl-acme',    name: 'Acme Corp',           shortName: 'Acme',      industry: 'Technology',     timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#2563EB' },
  { id: 'cl-vero',    name: 'Vero Health',          shortName: 'Vero',      industry: 'Healthcare',     timezone: 'America/Chicago',     utcOffset: -6, contractType: 'retainer', status: 'active',     color: '#059669' },
  { id: 'cl-bluesky', name: 'BlueSky Ltd',          shortName: 'BlueSky',   industry: 'Finance',        timezone: 'Europe/London',       utcOffset:  0, contractType: 'project',  status: 'active',     color: '#0EA5E9' },
  { id: 'cl-nova',    name: 'Nova Media',           shortName: 'Nova',      industry: 'Media',          timezone: 'America/Los_Angeles', utcOffset: -8, contractType: 'hourly',   status: 'active',     color: '#7C3AED' },
  { id: 'cl-brex',    name: 'Brex Inc',             shortName: 'Brex',      industry: 'Fintech',        timezone: 'America/Denver',      utcOffset: -7, contractType: 'retainer', status: 'active',     color: '#EA580C' },
  { id: 'cl-kabad',   name: 'Kabad Works',          shortName: 'Kabad',     industry: 'Logistics',      timezone: 'Asia/Manila',         utcOffset:  8, contractType: 'project',  status: 'active',     color: '#B91C1C' },
  { id: 'cl-stellar', name: 'Stellar Systems',      shortName: 'Stellar',   industry: 'Aerospace',      timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#0F766E' },
  { id: 'cl-pinewave',name: 'Pinewave Digital',     shortName: 'Pinewave',  industry: 'E-commerce',     timezone: 'America/Toronto',     utcOffset: -5, contractType: 'hourly',   status: 'active',     color: '#CA8A04' },
  { id: 'cl-orbis',   name: 'Orbis Analytics',      shortName: 'Orbis',     industry: 'Data & AI',      timezone: 'Europe/Amsterdam',    utcOffset:  1, contractType: 'project',  status: 'onboarding', color: '#9333EA' },
  { id: 'cl-redpeak', name: 'Redpeak Ventures',     shortName: 'Redpeak',   industry: 'Investment',     timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#DC2626' },
  { id: 'cl-haven',   name: 'Haven Insurance',      shortName: 'Haven',     industry: 'Insurance',      timezone: 'America/Chicago',     utcOffset: -6, contractType: 'retainer', status: 'inactive',   color: '#6B7280' },
  { id: 'cl-root',    name: 'Root Education',       shortName: 'Root',      industry: 'EdTech',         timezone: 'America/Los_Angeles', utcOffset: -8, contractType: 'hourly',   status: 'onboarding', color: '#16A34A' },
  { id: 'internal',   name: 'Internal',             shortName: 'Internal',  industry: '—',              timezone: 'America/New_York',    utcOffset: -5, contractType: 'retainer', status: 'active',     color: '#6B7280' },
]

export const CLIENT_MAP = Object.fromEntries(CLIENTS.map(c => [c.id, c])) as Record<string, Client>
