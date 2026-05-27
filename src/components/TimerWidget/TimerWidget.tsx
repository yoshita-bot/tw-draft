import { Play, Pause, Tag } from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTime } from '../shared/formatTime'
import { StatusBadges } from './StatusBadges'
import { cn } from '../../lib/cn'

export function TimerWidget() {
  const {
    globalSeconds,
    globalRunning,
    activeProjectId,
    activeTaskId,
    startGlobal,
    pauseGlobal,
    projects,
  } = useTimerStore()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeTask = activeProject?.tasks.find((t) => t.id === activeTaskId)
  const toggle = () => (globalRunning ? pauseGlobal() : startGlobal())

  const status = globalRunning ? 'TRACKING' : globalSeconds > 0 ? 'PAUSED' : 'READY'

  return (
    <div className="flex flex-col items-center gap-5 py-6 px-4">
      {/* Status label */}
      <p className="text-xs font-bold tracking-widest text-muted uppercase">{status}</p>

      {/* Timer digits */}
      <div
        className={cn(
          'text-[52px] font-display font-black tabular-nums leading-none transition-colors duration-300 tracking-tight',
          globalRunning ? 'text-blackish' : 'text-blackish/40'
        )}
        style={{ fontFamily: 'Montserrat, sans-serif' }}
        aria-live="polite"
        aria-label={`Work timer: ${formatTime(globalSeconds)}`}
      >
        {formatTime(globalSeconds)}
      </div>

      {/* Sub-label */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Total Work Time</p>
        {(activeProject || activeTask) && (
          <div className="flex items-center gap-1 text-[11px] text-muted/70">
            <Tag size={10} />
            <span className="truncate max-w-[180px]">
              {activeTask ? `${activeProject?.name} · ${activeTask.name}` : activeProject?.name}
            </span>
          </div>
        )}
      </div>

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        aria-label={globalRunning ? 'Pause work timer' : 'Start work timer'}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-royal/30 cursor-pointer',
          globalRunning
            ? 'bg-royal hover:bg-blue-700 shadow-royal/30'
            : 'bg-royal hover:bg-blue-700 shadow-royal/20'
        )}
      >
        {globalRunning
          ? <Pause size={22} fill="white" className="text-white" />
          : <Play size={22} fill="white" className="text-white ml-1" />
        }
      </button>

      {/* Active / Break badges */}
      <StatusBadges />
    </div>
  )
}
