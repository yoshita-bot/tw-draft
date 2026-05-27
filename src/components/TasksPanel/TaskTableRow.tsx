import type { Task } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTimeShort } from '../shared/formatTime'
import { cn } from '../../lib/cn'

const statusConfig = {
  'todo':        { label: 'To Do',       cls: 'bg-gray-100 text-gray-600' },
  'in-progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-600' },
  'review':      { label: 'Review',      cls: 'bg-yellow-50 text-yellow-700' },
  'done':        { label: 'Done',        cls: 'bg-green-50 text-green-700' },
  'blocked':     { label: 'Blocked',     cls: 'bg-red-50 text-red-600' },
}

const priorityConfig: Record<Task['priority'], { label: string; cls: string }> = {
  low:    { label: 'Low',    cls: 'text-gray-400 bg-gray-50'  },
  medium: { label: 'Medium', cls: 'text-amber-600 bg-amber-50' },
  high:   { label: 'High',   cls: 'text-orange-600 bg-orange-50' },
  urgent: { label: 'Urgent', cls: 'text-red-600 bg-red-50'    },
}

interface TaskTableRowProps {
  task: Task
  projectId: string
  onTaskClick: (taskId: string) => void
  isSelected: boolean
}

export function TaskTableRow({ task, projectId, onTaskClick, isSelected }: TaskTableRowProps) {
  const { activeProjectId, activeTaskId, globalRunning, startTask, pauseGlobal, projects, updateTaskStatus } = useTimerStore()

  const liveSeconds = projects.find(p => p.id === projectId)?.tasks.find(t => t.id === task.id)?.seconds ?? task.seconds
  const isActive  = activeProjectId === projectId && activeTaskId === task.id
  const isRunning = isActive && globalRunning

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    isRunning ? pauseGlobal() : startTask(projectId, task.id)
  }

  const today = new Date().toISOString().slice(0, 10)
  const isPastDeadline = task.deadline ? task.deadline < today && task.status !== 'done' : false
  const st = statusConfig[task.status]
  const pr = priorityConfig[task.priority]

  return (
    <tr
      className={cn('border-b border-border/50 group transition-colors cursor-pointer',
        isSelected ? 'bg-royal/5 border-l-2 border-l-royal' : isActive ? 'bg-sky/80' : 'hover:bg-sky/50'
      )}
      onClick={() => onTaskClick(task.id)}
    >
      {/* Task name + play */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <button onClick={handlePlay}
            className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer focus:outline-none',
              isRunning ? 'bg-teal text-white' : 'bg-royal/10 text-royal hover:bg-royal hover:text-white')}>
            {isRunning
              ? <span className="flex gap-0.5"><span className="w-1 h-2.5 rounded-sm bg-white"/><span className="w-1 h-2.5 rounded-sm bg-white"/></span>
              : <span className="w-0 h-0 border-t-[3px] border-b-[3px] border-l-[5px] border-transparent border-l-current ml-0.5" />}
          </button>
          <span className={cn('text-sm font-medium', isSelected || isActive ? 'text-royal font-semibold' : 'text-blackish')}>
            {task.name}
          </span>
          {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse shrink-0" />}
        </div>
      </td>

      {/* Status */}
      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
        <div className="relative inline-flex items-center">
          <select value={task.status} onChange={e => updateTaskStatus(projectId, task.id, e.target.value as Task['status'])}
            className={cn('text-[11px] font-semibold pl-2.5 pr-6 py-1 rounded-lg cursor-pointer appearance-none border-0 focus:outline-none focus:ring-2 focus:ring-royal/20', st.cls)}>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </td>

      {/* Priority */}
      <td className="py-3 px-4">
        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md', pr.cls)}>{pr.label}</span>
      </td>

      {/* Deadline */}
      <td className="py-3 px-4 whitespace-nowrap">
        {task.deadline ? (
          <span className={cn('text-xs font-medium', isPastDeadline ? 'text-red-500 font-semibold' : 'text-muted')}>
            {isPastDeadline && '⚠ '}
            {new Date(task.deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        ) : <span className="text-xs text-muted/30">—</span>}
      </td>

      {/* Time spent */}
      <td className="py-3 px-4 text-right whitespace-nowrap">
        <span className={cn('text-sm font-semibold tabular-nums', isRunning ? 'text-teal' : 'text-blackish/70')}>
          {formatTimeShort(liveSeconds)}
        </span>
      </td>
    </tr>
  )
}
