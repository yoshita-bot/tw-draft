import { Bell, SlidersHorizontal, CalendarDays } from 'lucide-react'

interface ExecTopBarProps {
  onAddSection: () => void
}

export function ExecTopBar({ onAddSection }: ExecTopBarProps) {
  return (
    <div className="h-14 bg-white border-b border-black/[0.08] flex items-center px-8 gap-4 shrink-0">
      {/* Left: brand + org + date */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className="text-sm font-semibold text-ink">TimeWorks</span>
        <span className="w-px h-4 bg-black/[0.1] shrink-0" />
        <span className="text-sm text-ink-secondary">Abroad Works</span>
        <span className="w-px h-4 bg-black/[0.1] shrink-0" />
        <div className="flex items-center gap-1.5">
          <CalendarDays size={12} className="text-ink-tertiary" />
          <span className="text-xs text-ink-secondary">Week of May 19 – 25, 2026</span>
        </div>
      </div>

      {/* Right: add section + bell + avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onAddSection}
          className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-black/[0.08] bg-white text-ink-secondary text-xs font-medium hover:bg-surface-hover hover:text-ink transition-all cursor-pointer"
        >
          <SlidersHorizontal size={12} />
          Add section
        </button>

        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors cursor-pointer">
          <Bell size={18} />
        </button>

        <div className="w-8 h-8 rounded-full bg-brand-light text-brand text-xs font-medium flex items-center justify-center select-none">
          PH
        </div>
      </div>
    </div>
  )
}
