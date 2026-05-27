import type { Task } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTracked } from '../shared/formatTime'
import { cn } from '../../lib/cn'

interface TaskRowProps {
  projectId: string
  task: Task
  projectColor: string
}

export function TaskRow({ projectId, task, projectColor }: TaskRowProps) {
  const { activeProjectId, activeTaskId, globalRunning, startTask, pauseGlobal } = useTimerStore()

  const isActive = activeProjectId === projectId && activeTaskId === task.id
  const isRunning = isActive && globalRunning

  const handleClick = () => isRunning ? pauseGlobal() : startTask(projectId, task.id)

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 rounded-lg group cursor-pointer transition-colors',
        isActive ? 'bg-royal-light/70' : 'hover:bg-sky'
      )}
      role="button"
      tabIndex={0}
      aria-label={isRunning ? `Pause ${task.name}` : `Start ${task.name}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: isRunning ? projectColor : '#D1D5DB' }}
        />
        <span className={cn('text-xs truncate', isActive ? 'text-royal font-semibold' : 'text-blackish/75')}>
          {task.name}
        </span>
      </div>
      {task.seconds > 0 && (
        <span className="text-[11px] text-muted font-mono shrink-0 ml-2">
          {formatTracked(task.seconds)}
        </span>
      )}
    </div>
  )
}
