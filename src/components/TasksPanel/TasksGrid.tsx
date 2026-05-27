import { Timer, CalendarClock } from 'lucide-react'
import type { Task, Project } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTimeShort } from '../shared/formatTime'
import { cn } from '../../lib/cn'

const statusConfig = {
  'todo':        { label: 'To Do',       cls: 'bg-gray-100 text-gray-500' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-600' },
  'review':      { label: 'Review',      cls: 'bg-yellow-50 text-yellow-700' },
  'done':        { label: 'Done',        cls: 'bg-green-50 text-green-700' },
  'blocked':     { label: 'Blocked',     cls: 'bg-red-50 text-red-600' },
}

const statusBorderColor: Record<string, string> = {
  'todo':        '#d1d5db',
  'in-progress': '#60a5fa',
  'review':      '#fbbf24',
  'done':        '#34d399',
  'blocked':     '#f87171',
}

function TaskCard({ task, projectId, onTaskClick, isSelected }: { task: Task; projectId: string; onTaskClick: (id: string) => void; isSelected: boolean }) {
  const {
    activeProjectId, activeTaskId, globalRunning,
    startTask, pauseGlobal, projects,
    updateTaskStatus, updateTaskUrgent,
  } = useTimerStore()

  const liveSeconds = projects.find(p => p.id === projectId)?.tasks.find(t => t.id === task.id)?.seconds ?? task.seconds
  const isActive  = activeProjectId === projectId && activeTaskId === task.id
  const isRunning = isActive && globalRunning
  const isUrgent  = task.priority === 'urgent'
  const today = new Date().toISOString().slice(0, 10)
  const isPastDeadline = task.deadline ? task.deadline < today && task.status !== 'done' : false

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    isRunning ? pauseGlobal() : startTask(projectId, task.id)
  }

  const borderColor = isActive ? '#0863C9' : isUrgent ? '#f87171' : statusBorderColor[task.status]

  return (
    <div
      className={cn(
        'bg-white rounded-2xl flex flex-col cursor-pointer transition-all group overflow-hidden border hover:shadow-lg hover:shadow-gray-200/70',
        isSelected ? 'border-royal/40 bg-royal/5' : isActive ? 'shadow-sm shadow-royal/10' : ''
      )}
      style={{ borderColor: isSelected ? undefined : (isActive ? '#0863C920' : '#e5e7eb'), borderLeftWidth: 3, borderLeftColor: borderColor }}
      onClick={() => onTaskClick(task.id)}
      role="button"
      aria-label={`View task: ${task.name}`}
    >
      <div className="p-4 flex flex-col gap-3">

        {/* Row 1: Task name + play button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full bg-teal shrink-0 mt-0.5 transition-opacity',
              isRunning ? 'opacity-100 animate-pulse' : 'opacity-0'
            )} />
            <p className={cn('text-sm font-bold leading-snug', isActive || isSelected ? 'text-royal' : 'text-blackish')}>
              {task.name}
            </p>
          </div>

          <button
            onClick={handlePlay}
            aria-label={isRunning ? `Pause ${task.name}` : `Track ${task.name}`}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer focus:outline-none',
              isRunning
                ? 'bg-teal text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-royal hover:text-white'
            )}
          >
            {isRunning
              ? <span className="w-2 h-2 rounded-sm bg-white" />
              : <span className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-current ml-0.5" />
            }
          </button>
        </div>

        {/* Row 2: Status dropdown + urgent toggle */}
        <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={e => updateTaskStatus(projectId, task.id, e.target.value as Task['status'])}
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer appearance-none border-0 focus:outline-none focus:ring-1 focus:ring-royal/30',
              statusConfig[task.status].cls
            )}
          >
            {Object.entries(statusConfig).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>

          <button
            onClick={() => updateTaskUrgent(projectId, task.id, !isUrgent)}
            className={cn(
              'text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer focus:outline-none',
              isUrgent
                ? 'bg-red-100 text-red-600 border-red-200'
                : 'border-transparent text-gray-300 hover:text-red-400 hover:border-red-200 hover:bg-red-50'
            )}
            aria-pressed={isUrgent}
          >
            ● Urgent
          </button>
        </div>

        {/* Row 3: Time + Deadline */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Timer size={11} className="text-muted shrink-0" />
            <span className={cn('text-xs font-semibold tabular-nums', isRunning ? 'text-teal' : 'text-blackish')}>
              {formatTimeShort(liveSeconds)}
            </span>
          </div>
          {task.deadline && (
            <div className="flex items-center gap-1">
              <CalendarClock size={11} className={cn('shrink-0', isPastDeadline ? 'text-red-400' : 'text-muted')} />
              <span className={cn('text-[11px] font-medium', isPastDeadline ? 'text-red-500' : 'text-muted')}>
                {new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export function TasksGrid({ project, onTaskClick, selectedTaskId }: { project: Project; onTaskClick: (taskId: string) => void; selectedTaskId: string | null }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto pb-2">
      {project.tasks.length === 0 ? (
        <p className="col-span-3 py-16 text-center text-sm text-muted">No tasks in this project</p>
      ) : (
        project.tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectId={project.id} onTaskClick={onTaskClick} isSelected={task.id === selectedTaskId} />
        ))
      )}
    </div>
  )
}
