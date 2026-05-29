import { useEffect } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ExecSectionConfig } from '../../data/executiveMockData'

interface ExecAddSectionSheetProps {
  open: boolean
  onClose: () => void
  onResetDefaults: () => void
  groups: Array<{ label: string; sections: ExecSectionConfig[] }>
  currentSections: string[]
  onToggle: (id: string) => void
}

function SectionRow({
  section, isChecked, onToggle,
}: {
  section: ExecSectionConfig
  isChecked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full px-5 py-3 text-left transition-colors cursor-pointer hover:bg-surface-page"
    >
      <span className={cn(
        'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
        isChecked ? 'bg-brand border-brand' : 'bg-white border-black/20',
      )}>
        {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className={cn('text-xs font-medium truncate', isChecked ? 'text-ink' : 'text-ink-secondary')}>
          {section.title}
        </div>
        <div className="text-[11px] text-ink-tertiary mt-0.5 leading-snug line-clamp-1">
          {section.description}
        </div>
      </div>
    </button>
  )
}

export function ExecAddSectionSheet({
  open, onClose, onResetDefaults, groups, currentSections, onToggle,
}: ExecAddSectionSheetProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const total = groups.reduce((s, g) => s + g.sections.length, 0)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/20"
          onClick={onClose}
        />
      )}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-black/[0.08]',
        'flex flex-col shadow-xl transition-transform duration-200 ease-out',
        open ? 'translate-x-0' : 'translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[0.08] shrink-0">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-ink">Manage sections</h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              {currentSections.length} of {total} shown
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-secondary hover:bg-surface-page hover:text-ink transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <div className="mx-5 border-t border-black/[0.06]" />}
              <div className="pt-4 pb-2">
                <div className="px-5 pb-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink-tertiary">
                    {group.label}
                  </span>
                </div>
                {group.sections.map(section => (
                  <SectionRow
                    key={section.id}
                    section={section}
                    isChecked={currentSections.includes(section.id)}
                    onToggle={() => onToggle(section.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="px-5 py-4 border-t border-black/[0.08] shrink-0">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-black/[0.08] text-xs font-medium text-ink-secondary hover:bg-surface-page hover:text-ink transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  )
}
