import { useState } from 'react'
import {
  Clock, Monitor, CalendarDays, FolderOpen, Users, BarChart2,
  DollarSign, Settings, LayoutDashboard, ChevronDown,
  PanelLeftClose, PanelLeftOpen, ChevronRight, BarChart3,
} from 'lucide-react'
import {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@radix-ui/react-tooltip'
import { cn } from '../../lib/cn'

export type AppPage = 'home' | 'projects' | 'exec'

interface NavSidebarProps {
  activePage: AppPage
  onNavigate: (page: AppPage) => void
}

interface NavItem  { id: string; label: string; page?: AppPage }
interface NavSection {
  id: string; label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'timesheets',  label: 'Timesheets',          icon: Clock,       items: [{ id: 'ts-view', label: 'View & Edit Timesheets' }] },
  { id: 'activity',   label: 'Activity',             icon: Monitor,     items: [{ id: 'screenshots', label: 'Screenshots' }, { id: 'app', label: 'App' }, { id: 'deleted', label: 'Deleted Screenshots' }] },
  { id: 'calendar',   label: 'Calendar',             icon: CalendarDays,items: [{ id: 'timeoff', label: 'Timeoff Requests' }, { id: 'schedules', label: 'Schedules' }] },
  { id: 'projectMgmt',label: 'Project Management',   icon: FolderOpen,  items: [{ id: 'projects', label: 'Projects', page: 'projects' }, { id: 'todos', label: 'To Dos' }] },
  { id: 'people',     label: 'People',               icon: Users,       items: [{ id: 'members', label: 'Members' }, { id: 'clients', label: 'Client' }, { id: 'teams', label: 'Teams' }] },
  { id: 'reports',    label: 'Reports',              icon: BarChart2,   items: [{ id: 'time-activity', label: 'Time & Activity' }, { id: 'daily-total', label: 'Daily Total' }, { id: 'time-edits', label: 'Time Edits' }, { id: 'work-sessions', label: 'Work Sessions' }] },
]

const BOTTOM_ITEMS = [
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'settings',   label: 'Settings',   icon: Settings },
]

export function NavSidebar({ activePage, onNavigate }: NavSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    timesheets: false, activity: false, calendar: false,
    projectMgmt: true, people: false, reports: false,
  })

  const toggleSection = (id: string) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))

  const handleCollapsedSectionClick = (id: string) => {
    setCollapsed(false)
    setOpenSections(prev => ({ ...prev, [id]: true }))
  }

  const activeSectionId = NAV_SECTIONS.find(s =>
    s.items.some(i => i.page === activePage && activePage !== 'home')
  )?.id ?? null

  // ── Shared class helpers ─────────────────────────────────────────────────
  const sidebarBg    = 'bg-[#1C2B4A]'
  const textDefault  = 'text-[#8BA3C4]'
  const textHover    = 'hover:text-white'
  const hoverBg      = 'hover:bg-[#243559]'
  const activeBg     = 'bg-[#3B71E8]'
  const activeTxt    = 'text-white'

  return (
    <TooltipProvider delayDuration={300}>
      <aside className={cn(
        sidebarBg,
        'flex flex-col h-screen shrink-0 relative',
        'transition-[width] duration-200 overflow-hidden',
        collapsed ? 'w-14' : 'w-[220px]',
      )}>

        {/* ── Logo ── */}
        <div className={cn(
          'flex items-center h-14 shrink-0 px-3 gap-2.5',
          'border-b border-white/5',
          collapsed && 'justify-center px-0',
        )}>
          <button
            onClick={() => onNavigate('home')}
            title="Go to Home"
            className="w-8 h-8 rounded-lg bg-[#3B71E8] flex items-center justify-center shrink-0 hover:bg-blue-500 transition-colors cursor-pointer"
          >
            <Clock size={15} className="text-white" />
          </button>

          {!collapsed && (
            <>
              <div className="flex flex-col leading-tight flex-1 min-w-0">
                <span className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  TimeWorks
                </span>
                <span className="text-[9px] text-[#8BA3C4] font-medium">by AbroadWorks</span>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                className="w-6 h-6 rounded-md flex items-center justify-center text-[#8BA3C4] hover:text-white hover:bg-[#243559] transition-colors cursor-pointer shrink-0"
              >
                <PanelLeftClose size={14} />
              </button>
            </>
          )}

          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              title="Expand sidebar"
              className="absolute -right-3 top-4 w-6 h-6 bg-[#1C2B4A] border border-[#2E4270] rounded-full flex items-center justify-center text-[#8BA3C4] hover:text-white shadow-sm cursor-pointer z-10"
            >
              <PanelLeftOpen size={11} />
            </button>
          )}
        </div>

        {/* ── Org selector ── */}
        {!collapsed ? (
          <div className="px-3 py-2 border-b border-white/5 shrink-0">
            <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[#243559] transition-colors cursor-pointer group text-left">
              <div className="w-5 h-5 rounded bg-[#3B71E8] text-white text-[9px] font-bold flex items-center justify-center shrink-0">A</div>
              <span className="text-xs font-semibold text-[#C4D5EB] truncate flex-1">abroadworks inc</span>
              <ChevronDown size={11} className="text-[#8BA3C4] shrink-0" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-2 border-b border-white/5 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-6 h-6 rounded bg-[#3B71E8] text-white text-[9px] font-bold flex items-center justify-center cursor-pointer">A</div>
              </TooltipTrigger>
              <TooltipContent side="right">abroadworks inc</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* ── Nav scroll area ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">

          {/* Home */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate('home')}
                  className={cn(
                    'w-full flex justify-center py-2 rounded-lg transition-colors cursor-pointer',
                    activePage === 'home' ? `${activeBg} ${activeTxt}` : `${textDefault} ${hoverBg} ${textHover}`,
                  )}
                >
                  <LayoutDashboard size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Home</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => onNavigate('home')}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold',
                activePage === 'home'
                  ? `${activeBg} ${activeTxt}`
                  : `${textDefault} ${hoverBg} ${textHover}`,
              )}
            >
              <LayoutDashboard size={15} className="shrink-0" />
              Home
            </button>
          )}

          {/* Executive */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate('exec')}
                  className={cn(
                    'w-full flex justify-center py-2 rounded-lg transition-colors cursor-pointer',
                    activePage === 'exec' ? `${activeBg} ${activeTxt}` : `${textDefault} ${hoverBg} ${textHover}`,
                  )}
                >
                  <BarChart3 size={16} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Executive</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => onNavigate('exec')}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors cursor-pointer text-xs font-semibold',
                activePage === 'exec'
                  ? `${activeBg} ${activeTxt}`
                  : `${textDefault} ${hoverBg} ${textHover}`,
              )}
            >
              <BarChart3 size={15} className="shrink-0" />
              Executive
            </button>
          )}

          {/* Sections */}
          {NAV_SECTIONS.map((section) => {
            const Icon = section.icon
            const isOpen = openSections[section.id]
            const isSectionActive = activeSectionId === section.id

            return (
              <div key={section.id}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleCollapsedSectionClick(section.id)}
                        className={cn(
                          'w-full flex justify-center py-2 rounded-lg transition-colors cursor-pointer',
                          isSectionActive ? 'text-[#6FA8FF] bg-[#243559]' : `${textDefault} ${hoverBg} ${textHover}`,
                        )}
                      >
                        <Icon size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{section.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-left transition-colors cursor-pointer',
                      isSectionActive && !isOpen
                        ? 'text-[#6FA8FF] bg-[#243559]'
                        : `${textDefault} ${hoverBg} ${textHover}`,
                    )}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="text-xs font-semibold flex-1 truncate">{section.label}</span>
                    <ChevronRight
                      size={12}
                      className={cn('shrink-0 transition-transform duration-150 text-[#8BA3C4]', isOpen && 'rotate-90')}
                    />
                  </button>
                )}

                {!collapsed && isOpen && (
                  <div className="ml-3 mt-0.5 mb-1 pl-4 border-l border-white/10 flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const isActive = item.page && activePage === item.page
                      return (
                        <button
                          key={item.id}
                          onClick={() => item.page ? onNavigate(item.page) : undefined}
                          className={cn(
                            'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left transition-colors text-xs',
                            item.page ? 'cursor-pointer' : 'cursor-default',
                            isActive
                              ? 'text-[#6FA8FF] font-semibold'
                              : item.page
                                ? 'text-[#8BA3C4] hover:text-white'
                                : 'text-[#8BA3C4]/50',
                          )}
                        >
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#3B71E8] shrink-0" />}
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Bottom items ── */}
        <div className="border-t border-white/5 py-2 px-2 shrink-0">
          {BOTTOM_ITEMS.map(({ id, label, icon: Icon }) =>
            collapsed ? (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button className={cn('w-full flex justify-center py-2 rounded-lg transition-colors cursor-pointer', textDefault, hoverBg, textHover)}>
                    <Icon size={15} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : (
              <button key={id} className={cn('flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors cursor-pointer', textDefault, hoverBg, textHover)}>
                <Icon size={15} className="shrink-0" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
