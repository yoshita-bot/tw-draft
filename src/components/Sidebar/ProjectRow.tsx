import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Project } from '../../data/mockProjects'
import { useTimerStore } from '../../store/useTimerStore'
import { TaskRow } from './TaskRow'
import { formatTracked } from '../shared/formatTime'
import { cn } from '../../lib/cn'

interface ProjectRowProps {
  project: Project
}

export function ProjectRow({ project }: ProjectRowProps) {
  const [expanded, setExpanded] = useState(false)
  const { activeProjectId, globalRunning, startProject, pauseGlobal, projects } = useTimerStore()

  const liveProject = projects.find((p) => p.id === project.id)!
  const isActive = activeProjectId === project.id
  const isRunning = isActive && globalRunning
  const hasTasks = project.tasks.length > 0

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    isRunning ? pauseGlobal() : startProject(project.id)
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer group transition-colors relative',
          isActive ? 'bg-royal-light' : 'hover:bg-sky'
        )}
        role="button"
        tabIndex={0}
        aria-expanded={hasTasks ? expanded : undefined}
        aria-label={`${project.name} project`}
        onClick={() => hasTasks && setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hasTasks && setExpanded((v) => !v) }
        }}
      >
        {/* Color accent bar */}
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ backgroundColor: project.color }}
          aria-hidden="true"
        />

        {/* Chevron */}
        <div className="shrink-0 w-4 flex items-center justify-center">
          {hasTasks && (
            <ChevronRight
              size={13}
              className={cn('text-muted transition-transform duration-200', expanded && 'rotate-90')}
            />
          )}
        </div>

        {/* Name + tracked time */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className={cn('text-sm font-semibold truncate', isActive ? 'text-royal' : 'text-blackish')}>
            {project.name}
          </span>
          <span className="text-[11px] text-muted">
            {formatTracked(liveProject.seconds)} tracked
          </span>
        </div>

        {/* Play/pause dot — visible on hover or when active */}
        <button
          onClick={handlePlayPause}
          aria-label={isRunning ? `Pause ${project.name}` : `Start ${project.name}`}
          className={cn(
            'shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-royal cursor-pointer',
            isRunning
              ? 'bg-royal text-white opacity-100'
              : 'bg-royal-light text-royal opacity-0 group-hover:opacity-100'
          )}
        >
          <div className={cn('rounded-full', isRunning ? 'w-2 h-2 bg-white' : 'w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-transparent border-l-royal ml-0.5')} />
        </button>
      </div>

      {/* Task list */}
      {hasTasks && expanded && (
        <div className="ml-8 flex flex-col gap-0.5 mt-0.5 mb-1" role="list">
          {project.tasks.map((task) => (
            <TaskRow key={task.id} projectId={project.id} task={task} projectColor={project.color} />
          ))}
        </div>
      )}
    </div>
  )
}
