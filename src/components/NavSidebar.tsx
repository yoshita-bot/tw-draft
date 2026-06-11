import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Clock, Activity, FolderKanban,
  CalendarDays, BarChart2, CreditCard, Users, Settings,
  Camera, Monitor, Star, CheckSquare, UserCheck, UserCog,
  Trash2, TrendingUp, Calendar, Building2, ChevronDown,
  DollarSign, ClipboardList,
} from 'lucide-react'
import { ROUTES } from '../lib/routes'

const LIVE = new Set([ROUTES.dashboard, ROUTES.timesheets, ROUTES.activity, ROUTES.activityScreenshots, ROUTES.reportsTimeActivity])

type NavChild = { icon: React.ElementType; label: string; path: string }
type NavItem  = { icon: React.ElementType; label: string; path: string; children?: NavChild[] }

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.dashboard },
  { icon: Clock, label: 'Timesheets', path: ROUTES.timesheets },
  {
    icon: Activity, label: 'Activity', path: ROUTES.activity,
    children: [
      { icon: Camera,  label: 'Screenshots',         path: ROUTES.activityScreenshots },
      { icon: Monitor, label: 'App',                 path: ROUTES.activityApps        },
      { icon: Trash2,  label: 'Deleted Screenshots', path: ROUTES.activityDeleted     },
    ],
  },
  {
    icon: FolderKanban, label: 'Project Management', path: ROUTES.projects,
    children: [
      { icon: FolderKanban, label: 'Projects', path: ROUTES.projects },
      { icon: CheckSquare,  label: 'Tasks',   path: ROUTES.todos    },
    ],
  },
  {
    icon: CalendarDays, label: 'Calendar', path: ROUTES.schedule,
    children: [
      { icon: CalendarDays, label: 'Schedules',         path: ROUTES.schedule        },
      { icon: Calendar,     label: 'Time off requests', path: ROUTES.timeOffRequests },
      { icon: Calendar,     label: 'My time off',       path: ROUTES.myTimeOff       },
    ],
  },
  {
    icon: BarChart2, label: 'Reports', path: ROUTES.reports,
    children: [
      { icon: TrendingUp,    label: 'Time & activity',      path: ROUTES.reportsTimeActivity  },
      { icon: ClipboardList, label: 'Daily Total (weekly)',  path: ROUTES.reportsDailyTotal    },
      { icon: Clock,         label: 'Time Edits',            path: ROUTES.reportsTimeEdits     },
      { icon: Activity,      label: 'Work Sessions',         path: ROUTES.reportsWorkSessions  },
    ],
  },
  {
    icon: Users, label: 'People', path: ROUTES.people,
    children: [
      { icon: Users,     label: 'Members', path: ROUTES.people   },
      { icon: Building2, label: 'Client',  path: ROUTES.clients  },
      { icon: UserCheck, label: 'Teams',   path: ROUTES.teams    },
    ],
  },
  {
    icon: DollarSign, label: 'Financials', path: ROUTES.payments,
    children: [
      { icon: DollarSign, label: 'Create Payments', path: ROUTES.payments },
      { icon: CreditCard, label: 'Past Payments',   path: ROUTES.pastPayments },
    ],
  },
  {
    icon: Settings, label: 'Settings', path: ROUTES.settings,
    children: [
      { icon: Settings, label: 'Organization', path: ROUTES.settings          },
      { icon: UserCog,  label: 'Employees',    path: ROUTES.settingsEmployees },
    ],
  },
]

/** Flat lookup of every favouritable page (path → icon + label) */
const PAGE_INDEX = new Map<string, { icon: React.ElementType; label: string }>()
NAV_ITEMS.forEach(item => {
  if (item.children?.length) {
    item.children.forEach(c => PAGE_INDEX.set(c.path, { icon: c.icon, label: c.label }))
  } else {
    PAGE_INDEX.set(item.path, { icon: item.icon, label: item.label })
  }
})

const FAV_KEY      = 'tw:favourites'
const FAV_OPEN_KEY = 'tw:favouritesOpen'

export function NavSidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    NAV_ITEMS.forEach(item => {
      if (item.children?.some(c => location.pathname.startsWith(c.path))) {
        initial.add(item.path)
      }
    })
    return initial
  })

  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY)
      if (raw) return (JSON.parse(raw) as string[]).filter(p => PAGE_INDEX.has(p))
    } catch { /* corrupted storage — start fresh */ }
    return []
  })

  // Unlike other sections, Favourites is open by default
  const [favOpen, setFavOpen] = useState<boolean>(() => localStorage.getItem(FAV_OPEN_KEY) !== 'closed')

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favourites))
  }, [favourites])

  useEffect(() => {
    localStorage.setItem(FAV_OPEN_KEY, favOpen ? 'open' : 'closed')
  }, [favOpen])

  useEffect(() => {
    NAV_ITEMS.forEach(item => {
      if (item.children?.some(c => location.pathname.startsWith(c.path))) {
        setExpanded(prev => {
          if (prev.has(item.path)) return prev
          return new Set([...prev, item.path])
        })
      }
    })
  }, [location.pathname])

  function toggleExpanded(path: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  function toggleFavourite(path: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setFavourites(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    )
  }

  const favButton = (path: string) => {
    const faved = favourites.includes(path)
    return (
      <button
        className={`nav-fav-btn${faved ? ' faved' : ''}`}
        onClick={e => toggleFavourite(path, e)}
        title={faved ? 'Remove from favourites' : 'Add to favourites'}
      >
        <Star width={13} height={13} fill={faved ? 'currentColor' : 'none'} />
      </button>
    )
  }

  const childRow = (child: NavChild) => {
    const ChildIcon     = child.icon
    const isChildActive = location.pathname === child.path ||
      location.pathname.startsWith(child.path + '/')
    return (
      <a
        key={child.path}
        href={child.path}
        className={`nav-child${isChildActive ? ' active' : ''}`}
        onClick={e => { e.preventDefault(); navigate(child.path) }}
      >
        <ChildIcon width={13} height={13} strokeWidth={isChildActive ? 2.2 : 1.8} />
        <span style={{ flex: 1 }}>{child.label}</span>
        {favButton(child.path)}
      </a>
    )
  }

  const renderNavItem = (item: NavItem) => {
    const Icon        = item.icon
    const isLive      = LIVE.has(item.path)
    const isExpanded  = expanded.has(item.path)
    const hasChildren = !!item.children?.length
    const isActive    = location.pathname === item.path ||
      (item.path !== ROUTES.dashboard && location.pathname.startsWith(item.path))

    const handleMainClick = (e: React.MouseEvent) => {
      e.preventDefault()
      if (hasChildren) {
        navigate(item.children![0].path)
        setExpanded(prev => new Set([...prev, item.path]))
      } else {
        navigate(item.path)
      }
    }

    return (
      <div key={item.path}>
        <a
          className={`nav-item${isActive ? ' active' : ''}`}
          href={item.path}
          onClick={handleMainClick}
          title={isLive ? item.label : `${item.label} — in development`}
          style={{ paddingRight: 4 }}
        >
          <Icon width={16} height={16} strokeWidth={1.8} />
          <span style={{ flex: 1 }}>{item.label}</span>

          {!hasChildren && favButton(item.path)}

          {hasChildren ? (
            <button
              onClick={e => toggleExpanded(item.path, e)}
              title={isExpanded ? 'Collapse' : 'Expand'}
              style={{
                width: 22, height: 22, border: 'none', background: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, color: 'inherit', flexShrink: 0, padding: 0,
              }}
            >
              <ChevronDown
                width={13} height={13}
                style={{
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
          ) : (
            !isLive && (
              <span style={{
                width: 5, height: 5, borderRadius: '50%', flexShrink: 0, marginRight: 6,
                background: isActive ? '#6271FF' : '#D1D5DB',
              }} />
            )
          )}
        </a>

        {hasChildren && isExpanded && (
          <div style={{ marginBottom: 2 }}>
            {item.children!.map(childRow)}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <span>TimeWorks</span>
      </div>

      <nav className="nav-section">
        {renderNavItem(NAV_ITEMS[0])}

        <div>
          <a
            className="nav-item"
            href="#favourites"
            onClick={e => { e.preventDefault(); setFavOpen(o => !o) }}
            title="Favourites"
            style={{ paddingRight: 4 }}
          >
            <Star width={16} height={16} strokeWidth={1.8} />
            <span style={{ flex: 1 }}>Favourites</span>
            <span
              style={{
                width: 22, height: 22, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}
            >
              <ChevronDown
                width={13} height={13}
                style={{
                  transition: 'transform 0.2s',
                  transform: favOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </span>
          </a>

          {favOpen && (
            <div style={{ marginBottom: 2 }}>
              {favourites.length === 0 ? (
                <div style={{
                  padding: '4px 12px 6px 36px', fontSize: 11.5,
                  color: '#9CA3AF', lineHeight: 1.45,
                }}>
                  Hover any page and click the star to pin it here.
                </div>
              ) : (
                favourites.map(path => {
                  const page = PAGE_INDEX.get(path)!
                  return childRow({ icon: page.icon, label: page.label, path })
                })
              )}
            </div>
          )}
        </div>

        {NAV_ITEMS.slice(1).map(renderNavItem)}
      </nav>
    </aside>
  )
}
