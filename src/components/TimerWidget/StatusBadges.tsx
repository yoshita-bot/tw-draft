import { useTimerStore } from '../../store/useTimerStore'
import { formatTimeShort } from '../shared/formatTime'
import { cn } from '../../lib/cn'

export function StatusBadges() {
  const { breakSecondsLeft, breakRunning, startBreak, stopBreak, resetBreak, idleSeconds, isIdle } = useTimerStore()

  const handleBreakClick = () => {
    if (breakRunning) stopBreak()
    else if (breakSecondsLeft === 0) resetBreak()
    else startBreak()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Idle badge — always visible */}
      <div
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-bold transition-colors',
          isIdle
            ? 'border-red-300 bg-red-50 text-red-500'
            : 'border-gray-200 bg-white text-muted'
        )}
        title="Time since last activity"
      >
        IDLE
        <span className="font-mono">{formatTimeShort(idleSeconds)}</span>
      </div>

      {/* Break button — always visible */}
      <button
        onClick={handleBreakClick}
        aria-label={breakRunning ? 'Stop break' : 'Start break'}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs font-bold transition-colors cursor-pointer focus:outline-none',
          breakRunning
            ? 'border-orange bg-orange-light text-orange-600'
            : 'border-orange/40 bg-white text-orange-500 hover:bg-orange-light/50'
        )}
      >
        BREAK
        <span className="font-mono">{formatTimeShort(breakSecondsLeft)}</span>
      </button>
    </div>
  )
}
