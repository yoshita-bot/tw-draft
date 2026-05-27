import { Play, Pause, Square } from 'lucide-react'
import { cn } from '../../lib/cn'

interface PlayButtonProps {
  isRunning: boolean
  onPlay: () => void
  onPause: () => void
  onStop?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'teal' | 'ghost'
  showStop?: boolean
  className?: string
  ariaLabel?: string
}

export function PlayButton({
  isRunning,
  onPlay,
  onPause,
  onStop,
  size = 'md',
  variant = 'primary',
  showStop = false,
  className,
  ariaLabel,
}: PlayButtonProps) {
  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  }

  const iconSize = { sm: 12, md: 16, lg: 20 }

  const variantClasses = {
    primary: isRunning
      ? 'bg-royal text-white hover:bg-blue-700'
      : 'bg-royal text-white hover:bg-blue-700',
    teal: isRunning
      ? 'bg-teal text-white hover:bg-teal/90'
      : 'bg-teal text-white hover:bg-teal/90',
    ghost: isRunning
      ? 'bg-royal-light text-royal hover:bg-royal hover:text-white'
      : 'bg-royal-light text-royal hover:bg-royal hover:text-white',
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        onClick={isRunning ? onPause : onPlay}
        aria-label={ariaLabel ?? (isRunning ? 'Pause timer' : 'Start timer')}
        className={cn(
          'rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 cursor-pointer',
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        {isRunning ? (
          <Pause size={iconSize[size]} fill="currentColor" />
        ) : (
          <Play size={iconSize[size]} fill="currentColor" />
        )}
      </button>

      {showStop && onStop && (
        <button
          onClick={onStop}
          aria-label="Stop and reset timer"
          className={cn(
            'rounded-full flex items-center justify-center transition-colors bg-red-100 text-red-500 hover:bg-red-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 cursor-pointer',
            sizeClasses[size]
          )}
        >
          <Square size={iconSize[size]} fill="currentColor" />
        </button>
      )}
    </div>
  )
}
