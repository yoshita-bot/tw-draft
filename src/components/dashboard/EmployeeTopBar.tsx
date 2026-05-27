import { Bell, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { EMPLOYEE_MOCK } from '../../data/employeeMockData'

interface EmployeeTopBarProps {
  view: 'team' | 'me'
  onViewChange: (view: 'team' | 'me') => void
  onAddSection: () => void
  onNotifOpen: () => void
  unreadCount: number
}

export function EmployeeTopBar({
  view,
  onViewChange,
  onAddSection,
  onNotifOpen,
  unreadCount,
}: EmployeeTopBarProps) {
  const { todayStats, name, role, avatarInitials } = EMPLOYEE_MOCK

  const dotColor = todayStats.status === 'active'
    ? 'bg-green-500'
    : todayStats.status === 'away'
      ? 'bg-amber-400'
      : 'bg-gray-400'

  const statusText = todayStats.status === 'active'
    ? `Active · ${todayStats.clockInTime}`
    : todayStats.status === 'away'
      ? 'Away'
      : 'Offline'

  return (
    <div className="h-14 bg-white border-b border-gray-200/80 flex items-center px-5 gap-3 shrink-0">

      {/* Page title */}
      <h1
        className="text-sm font-bold text-gray-900 leading-tight shrink-0"
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        My Dashboard
      </h1>

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Desktop status chip — synced from desktop app */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-[11px] font-semibold text-muted">{statusText}</span>
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

      {/* Avatar */}
      <button className="flex items-center gap-2 pl-0.5 pr-2 py-1 rounded-lg hover:bg-sky transition-colors cursor-pointer shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B71E8] to-[#6366F1] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
          {avatarInitials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-semibold text-gray-800 leading-tight">{name}</div>
          <div className="text-[10px] text-gray-500 leading-tight">{role}</div>
        </div>
        <ChevronDown size={10} className="text-gray-400 hidden sm:block" />
      </button>
    </div>
  )
}
