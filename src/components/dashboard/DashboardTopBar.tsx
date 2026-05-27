import { Bell, SlidersHorizontal, Search, ChevronDown, CalendarDays } from 'lucide-react'
import { cn } from '../../lib/cn'

interface DashboardTopBarProps {
  onAddSection: () => void
  onNotifOpen: () => void
  unreadCount: number
  view: 'team' | 'me'
  onViewChange: (view: 'team' | 'me') => void
}

export function DashboardTopBar({ onAddSection, onNotifOpen, unreadCount, view, onViewChange }: DashboardTopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200/80 flex items-center px-5 gap-3 shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="min-w-0">
          <h1
            className="text-sm font-bold text-gray-900 leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Dashboard
          </h1>
        </div>

        <div className="h-4 w-px bg-gray-200 shrink-0" />

        {/* Date range chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky rounded-lg shrink-0">
          <CalendarDays size={11} className="text-muted" />
          <span className="text-[11px] font-semibold text-muted">May 19 – 25, 2026</span>
        </div>

        <div className="h-4 w-px bg-gray-200 shrink-0" />

        {/* Me/Team toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => onViewChange('team')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
              view === 'team'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            Team
          </button>
          <button
            onClick={() => onViewChange('me')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
              view === 'me'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-400 hover:text-gray-600',
            )}
          >
            Me
          </button>
        </div>
      </div>

      {/* Global search */}
      <div className="relative hidden lg:block">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search employees, projects…"
          className={cn(
            'h-8 w-52 pl-8 pr-3 rounded-lg border border-gray-200 bg-[#F8FAFC]',
            'text-xs text-gray-800 placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-royal/20 focus:border-royal/40 transition-all',
          )}
        />
      </div>

      {/* Customise button */}
      <button
        onClick={onAddSection}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-semibold hover:bg-sky hover:border-gray-300 hover:text-gray-800 transition-all cursor-pointer shrink-0"
      >
        <SlidersHorizontal size={12} />
        Customise
      </button>

      <div className="w-px h-5 bg-gray-200 shrink-0" />

      {/* Notifications */}
      <button
        onClick={onNotifOpen}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-sky hover:text-gray-700 transition-colors cursor-pointer shrink-0"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* User avatar + info */}
      <button className="flex items-center gap-2 pl-0.5 pr-2 py-1 rounded-lg hover:bg-sky transition-colors cursor-pointer shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B71E8] to-[#6366F1] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
          YR
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-gray-800 leading-tight">Yoshita R.</div>
          <div className="text-[10px] text-gray-500 leading-tight">Admin</div>
        </div>
        <ChevronDown size={10} className="text-gray-400 hidden sm:block" />
      </button>
    </div>
  )
}
