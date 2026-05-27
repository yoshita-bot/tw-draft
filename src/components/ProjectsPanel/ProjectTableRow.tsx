import type { Project } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTracked } from '../shared/formatTime'
import { cn } from '../../lib/cn'

interface StatCellProps {
  value: number
  color: 'yellow' | 'blue' | 'green' | 'red' | 'muted'
}

function StatCell({ value, color }: StatCellProps) {
  const colorMap = {
    yellow: 'bg-yellow-50 text-yellow-700',
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-700',
    red:    'bg-red-50 text-red-600',
    muted:  'bg-gray-50 text-muted',
  }
  return (
    <td className="py-3 px-4 text-center">
      <span className={cn('inline-flex items-center justify-center w-8 h-7 rounded-lg text-sm font-bold', colorMap[color])}>
        {value}
      </span>
    </td>
  )
}

interface ProjectTableRowProps {
  project: Project
  onProjectClick: (projectId: string) => void
}

export function ProjectTableRow({ project, onProjectClick }: ProjectTableRowProps) {
  const { activeProjectId, projects } = useTimerStore()
  const isActive = activeProjectId === project.id
  const liveProject = projects.find((p) => p.id === project.id)!

  return (
    <tr
      className={cn('border-b border-border/60 transition-colors cursor-pointer', isActive ? 'bg-royal-light/30' : 'hover:bg-sky/60')}
      onClick={() => onProjectClick(project.id)}
      role="button"
      aria-label={`View tasks for ${project.name}`}
    >
      {/* Project name + accent */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-9 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          <div className="flex flex-col min-w-0">
            <span className={cn('text-sm font-semibold', isActive ? 'text-royal' : 'text-blackish')}>
              {project.name}
            </span>
            <span className="text-[11px] text-muted">
              {project.totalTasks > 0 ? `${project.totalTasks} tasks` : 'No subtasks'}
            </span>
          </div>
        </div>
      </td>

      {/* Tasks count */}
      <td className="py-3 px-4 text-center">
        <span className="text-sm font-semibold text-blackish/70">
          {project.totalTasks || '—'}
        </span>
      </td>

      <StatCell value={project.pendingTasks}    color="yellow" />
      <StatCell value={project.waitingTasks}    color="blue"   />
      <StatCell value={project.inProgressTasks} color="green"  />
      <StatCell value={project.overdueTasks}    color="red"    />

      {/* Time tracked */}
      <td className="py-3 px-5 text-right">
        <span className={cn('text-sm font-bold', liveProject.seconds > 0 ? 'text-blackish' : 'text-muted')}>
          {formatTracked(liveProject.seconds)}
        </span>
      </td>
    </tr>
  )
}
