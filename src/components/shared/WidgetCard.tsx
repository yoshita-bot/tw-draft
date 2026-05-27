import { useState, useRef, useEffect } from 'react'
import { GripVertical, MoreHorizontal, ArrowUp, ArrowDown, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

interface WidgetCardProps {
  title: string
  onDragStart?: () => void
  onDragEnd?: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  isDragging?: boolean
}

export function WidgetCard({
  title,
  onDragStart,
  onDragEnd,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
  footer,
  isDragging,
}: WidgetCardProps) {
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
    <div
      className={cn(
        'bg-white rounded-xl flex flex-col h-full',
        'border border-gray-200/70',
        'transition-all duration-200',
        isDragging
          ? 'shadow-2xl ring-2 ring-royal/30 opacity-50 scale-[0.98]'
          : 'shadow-sm hover:shadow-md hover:border-gray-200',
      )}
    >
      {/* ── Header ── */}
      <div className="group flex items-center gap-2.5 px-4 py-3 bg-[#F8FAFC] rounded-t-xl border-b border-gray-100">
        {/* Drag handle — visible on hover */}
        <button
          draggable
          onDragStart={(e) => {
            const ghost = document.createElement('div')
            ghost.style.position = 'fixed'
            ghost.style.top = '-9999px'
            document.body.appendChild(ghost)
            e.dataTransfer.setDragImage(ghost, 0, 0)
            setTimeout(() => document.body.removeChild(ghost), 0)
            onDragStart?.()
          }}
          onDragEnd={onDragEnd}
          className="cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-gray-400 transition-colors shrink-0 touch-none"
          title="Drag to reorder"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>

        <h3 className="text-[11px] font-bold text-gray-400 flex-1 truncate uppercase tracking-widest">
          {title}
        </h3>

        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={cn(
              'w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer',
              menuOpen
                ? 'bg-gray-200 text-gray-600'
                : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500',
            )}
            title="Widget options"
          >
            <MoreHorizontal size={13} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 z-50 w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
              <button
                onClick={() => { onMoveUp(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowUp size={12} />
                Move up
              </button>
              <button
                onClick={() => { onMoveDown(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowDown size={12} />
                Move down
              </button>
              <div className="h-px bg-gray-100 my-1 mx-2" />
              <button
                onClick={() => { onRemove(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <EyeOff size={12} />
                Hide widget
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4 overflow-hidden">
        {children}
      </div>

      {/* ── Footer ── */}
      {footer && (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  )
}
