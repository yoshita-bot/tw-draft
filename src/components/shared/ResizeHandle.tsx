import { useCallback, useRef } from 'react'
import { cn } from '../../lib/cn'

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical'
  onResize: (delta: number) => void
}

export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  // Always keep a ref to the latest onResize so the mousemove closure never goes stale
  const onResizeRef = useRef(onResize)
  onResizeRef.current = onResize

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    let last = direction === 'horizontal' ? e.clientX : e.clientY

    const onMove = (ev: MouseEvent) => {
      const cur = direction === 'horizontal' ? ev.clientX : ev.clientY
      onResizeRef.current(cur - last)
      last = cur
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [direction])

  const isH = direction === 'horizontal'

  return (
    <div
      onMouseDown={onMouseDown}
      className={cn(
        'shrink-0 relative flex items-center justify-center bg-border/60 hover:bg-royal/40 active:bg-royal/60 transition-colors group z-10',
        isH ? 'w-[4px] cursor-col-resize' : 'h-[4px] cursor-row-resize'
      )}
    >
      {/* Subtle indicator pill on hover */}
      <div className={cn(
        'absolute rounded-full bg-transparent group-hover:bg-royal/70 transition-colors',
        isH ? 'w-[3px] h-8' : 'h-[3px] w-8'
      )} />
    </div>
  )
}
