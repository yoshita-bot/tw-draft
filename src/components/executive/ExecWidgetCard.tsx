import { useEffect, useRef, useState } from 'react'
import { GripVertical, MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ExecWidgetCardProps {
  title: string
  children: React.ReactNode
  onRemove: () => void
  isDragging?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}

export function ExecWidgetCard({
  title, children, onRemove, isDragging, onDragStart, onDragEnd,
}: ExecWidgetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className={cn(
      'bg-white rounded-xl border border-black/[0.08] shadow-none h-full',
      'transition-opacity duration-200',
      isDragging && 'opacity-50 ring-2 ring-brand/20',
    )}>
      {/* Header */}
      <div className="group flex items-center gap-2 px-6 py-4 border-b border-black/[0.06]">
        <button
          draggable
          onDragStart={e => {
            // Use transparent ghost image so we can control visual state ourselves
            const ghost = document.createElement('div')
            ghost.style.cssText = 'position:fixed;top:-9999px'
            document.body.appendChild(ghost)
            e.dataTransfer.setDragImage(ghost, 0, 0)
            setTimeout(() => document.body.removeChild(ghost), 0)
            onDragStart?.()
          }}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-ink-tertiary group-hover:text-ink-secondary transition-colors shrink-0 touch-none"
          tabIndex={-1}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <h3 className="text-xs font-medium text-ink-secondary uppercase tracking-widest flex-1 truncate">
          {title}
        </h3>
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={cn(
              'w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer',
              menuOpen
                ? 'bg-surface-hover text-ink'
                : 'text-ink-tertiary hover:bg-surface-hover hover:text-ink',
            )}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-36 bg-white border border-black/[0.08] rounded-xl shadow-lg py-1 overflow-hidden">
              <button
                onClick={() => { onRemove(); setMenuOpen(false) }}
                className="flex items-center w-full px-3 py-2 text-xs text-ink hover:bg-surface-page transition-colors cursor-pointer"
              >
                Remove section
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
