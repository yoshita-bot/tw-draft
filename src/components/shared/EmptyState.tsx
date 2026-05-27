import { LayoutDashboard, Plus } from 'lucide-react'

interface EmptyStateProps {
  onAddSection: () => void
}

export function EmptyState({ onAddSection }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-6">
      <div className="w-16 h-16 rounded-2xl bg-royal/8 flex items-center justify-center mb-5">
        <LayoutDashboard size={28} className="text-royal/60" />
      </div>
      <h3 className="text-base font-semibold text-blackish mb-2">No sections visible</h3>
      <p className="text-sm text-muted text-center max-w-xs mb-6">
        You've hidden all dashboard sections. Add sections back to see your workforce data.
      </p>
      <button
        onClick={onAddSection}
        className="flex items-center gap-2 px-4 py-2.5 bg-royal text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
      >
        <Plus size={15} />
        Add section
      </button>
    </div>
  )
}
