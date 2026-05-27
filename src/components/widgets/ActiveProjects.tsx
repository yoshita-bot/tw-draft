import { cn } from '../../lib/cn'
import { ACTIVE_PROJECTS, getEmployeeById, type ProjectStatus } from '../../data/mockData'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  'on-track':  { label: 'On Track',  dot: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  'at-risk':   { label: 'At Risk',   dot: '#F59E0B', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100'   },
  'blocked':   { label: 'Blocked',   dot: '#EF4444', bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-100'     },
  'completed': { label: 'Done',      dot: '#6B7280', bg: 'bg-gray-100',   text: 'text-gray-500',    border: 'border-gray-200'    },
}

const PREVIEW_LIMIT = 3

export function ActiveProjects() {
  const projects = ACTIVE_PROJECTS.slice(0, PREVIEW_LIMIT)

  return (
    <div className="flex flex-col gap-2">
      {projects.map(project => {
        const cfg = STATUS_CONFIG[project.status]
        const progress = Math.round((project.completedTasks / project.taskCount) * 100)
        const assignees = project.assigneeIds.map(id => getEmployeeById(id)).filter(Boolean)

        return (
          <div key={project.id} className="flex flex-col gap-2.5 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-colors cursor-pointer">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{project.name}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{project.client} · Due {project.dueDate}</div>
              </div>
              <span className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border',
                cfg.bg, cfg.text, cfg.border,
              )}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                {cfg.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: cfg.dot }}
                />
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums shrink-0 w-8 text-right">{progress}%</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-1.5">
                {assignees.slice(0, 3).map(emp => emp && (
                  <div
                    key={emp.id}
                    className="w-5 h-5 rounded-md border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shadow-sm"
                    style={{ backgroundColor: emp.avatarColor }}
                    title={emp.name}
                  >
                    {emp.initials.charAt(0)}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-md border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400 tabular-nums">
                {project.completedTasks}/{project.taskCount} tasks
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
