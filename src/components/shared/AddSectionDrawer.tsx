import { useEffect, useRef } from 'react'
import { X, RotateCcw, Check } from 'lucide-react'
import { cn } from '../../lib/cn'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WidgetItem {
  id: string
  title: string
  description: string
}

interface LargeWidgetGroup {
  label: string
  sections: WidgetItem[]
}

export interface AddSectionDrawerProps {
  open: boolean
  onClose: () => void
  onResetDefaults: () => void

  /** All available small widgets (top bar stat chips) */
  smallWidgets: WidgetItem[]
  /** Which small widget IDs are currently shown */
  currentTopBar: string[]
  /** Toggle a small widget on/off */
  onToggleSmall: (id: string) => void

  /** Large widget groups (cards in the main grid) */
  largeGroups: LargeWidgetGroup[]
  /** Which large widget IDs are currently shown */
  currentGrid: string[]
  /** Toggle a large widget on/off */
  onToggleLarge: (id: string) => void
}

// ── Row renderer ──────────────────────────────────────────────────────────────

function WidgetRow({
  item,
  isChecked,
  onToggle,
}: {
  item: WidgetItem
  isChecked: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 w-full px-5 py-2.5 text-left transition-colors cursor-pointer',
        isChecked ? 'hover:bg-sky/60' : 'hover:bg-sky',
      )}
    >
      {/* Checkbox */}
      <span
        className={cn(
          'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
          isChecked ? 'bg-royal border-royal' : 'bg-white border-border',
        )}
      >
        {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
      </span>

      <div className="flex-1 min-w-0">
        <div className={cn('text-xs font-semibold truncate', isChecked ? 'text-blackish' : 'text-muted')}>
          {item.title}
        </div>
        <div className="text-[11px] text-muted/60 mt-0.5 leading-snug line-clamp-1">
          {item.description}
        </div>
      </div>
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddSectionDrawer({
  open,
  onClose,
  onResetDefaults,
  smallWidgets,
  currentTopBar,
  onToggleSmall,
  largeGroups,
  currentGrid,
  onToggleLarge,
}: AddSectionDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const totalSmall = smallWidgets.length
  const totalLarge = largeGroups.reduce((s, g) => s + g.sections.length, 0)
  const activeCount = currentTopBar.length + currentGrid.length

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-blackish/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={cn(
          'fixed right-0 top-0 bottom-0 z-50 w-72 bg-white border-l border-border',
          'flex flex-col shadow-2xl transition-transform duration-250 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-blackish">Manage widgets</h2>
            <p className="text-xs text-muted mt-0.5">
              {activeCount} of {totalSmall + totalLarge} widgets shown
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Small widgets section ── */}
          <div className="pt-4 pb-2">
            <div className="px-5 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Small widgets
              </span>
              <p className="text-[11px] text-muted/60 mt-0.5 leading-snug">
                Shown as stat chips in the top bar
              </p>
            </div>
            <div className="flex flex-col">
              {smallWidgets.map(item => (
                <WidgetRow
                  key={item.id}
                  item={item}
                  isChecked={currentTopBar.includes(item.id)}
                  onToggle={() => onToggleSmall(item.id)}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-border" />

          {/* ── Large widgets section ── */}
          <div className="pt-4 pb-2">
            <div className="px-5 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Large widgets
              </span>
              <p className="text-[11px] text-muted/60 mt-0.5 leading-snug">
                Cards displayed in the main grid
              </p>
            </div>
            {largeGroups.map(group => (
              <div key={group.label} className="mb-4">
                <div className="px-5 pb-1">
                  <span className="text-[10px] font-semibold text-muted/70">
                    {group.label}
                  </span>
                </div>
                <div className="flex flex-col">
                  {group.sections.map(item => (
                    <WidgetRow
                      key={item.id}
                      item={item}
                      isChecked={currentGrid.includes(item.id)}
                      onToggle={() => onToggleLarge(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-sky hover:text-blackish transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset to defaults
          </button>
        </div>
      </div>
    </>
  )
}
