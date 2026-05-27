import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'
import { cn } from '../../../lib/cn'

function fmtH(h: number) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

const STATUS: Record<string, { label: string; cls: string }> = {
  'todo':        { label: 'To Do',    cls: 'bg-gray-100 text-gray-500' },
  'in-progress': { label: 'Active',   cls: 'bg-blue-50 text-[#3B71E8]' },
  'review':      { label: 'Review',   cls: 'bg-amber-50 text-amber-600' },
  'done':        { label: 'Done',     cls: 'bg-emerald-50 text-emerald-600' },
}

export function EmployeeProjectTasks() {
  const { projectTasks } = EMPLOYEE_MOCK
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(projectTasks.map(p => [p.id, true]))
  )

  const totalHours = projectTasks.reduce((sum, p) => sum + p.totalHours, 0)
  const totalTasks = projectTasks.reduce((sum, p) => sum + p.tasks.length, 0)
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="flex flex-col gap-4">

      {/* Summary line */}
      <p className="text-[11px] text-gray-500 leading-none">
        <span className="font-semibold text-gray-800">{projectTasks.length}</span> projects &nbsp;·&nbsp;
        <span className="font-semibold text-gray-800">{totalTasks}</span> tasks &nbsp;·&nbsp;
        <span className="font-semibold text-gray-800">{fmtH(totalHours)}</span> this week
      </p>

      {/* Project list */}
      <div className="flex flex-col">
        {projectTasks.map((project, pi) => {
          const isOpen    = expanded[project.id]
          const doneCount = project.tasks.filter(t => t.status === 'done').length

          return (
            <div
              key={project.id}
              className={cn('flex flex-col', pi > 0 && 'border-t border-gray-100 pt-2.5 mt-2.5')}
            >
              {/* Project header row */}
              <button
                onClick={() => toggle(project.id)}
                className="flex items-center gap-2 w-full text-left hover:bg-gray-50 rounded-lg px-2 py-1.5 -mx-2 transition-colors cursor-pointer group"
              >
                {/* Chevron */}
                <span className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0">
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>

                {/* Color dot */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />

                {/* Name */}
                <span className="text-[12px] font-semibold text-gray-800 flex-1 min-w-0 truncate">
                  {project.name}
                </span>

                {/* Task progress */}
                <span className="text-[10px] text-gray-400 shrink-0 mr-1.5 tabular-nums">
                  {doneCount}/{project.tasks.length}
                </span>

                {/* Hours */}
                <span
                  className="text-[12px] font-bold tabular-nums shrink-0"
                  style={{ color: project.color }}
                >
                  {fmtH(project.totalHours)}
                </span>
              </button>

              {/* Client chip */}
              {isOpen && (
                <p className="text-[10px] text-gray-400 ml-10 -mt-0.5 mb-1">
                  {project.client}
                </p>
              )}

              {/* Task rows */}
              {isOpen && (
                <div className="ml-6 flex flex-col gap-0.5">
                  {project.tasks.map((task, ti) => {
                    const st = STATUS[task.status ?? 'todo']
                    return (
                      <div
                        key={ti}
                        className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Bullet */}
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{ backgroundColor: project.color, opacity: 0.5 }}
                        />

                        {/* Task name */}
                        <span className="text-[11px] text-gray-600 flex-1 min-w-0 truncate">
                          {task.name}
                        </span>

                        {/* Status badge */}
                        <span className={cn('text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0', st.cls)}>
                          {st.label}
                        </span>

                        {/* Hours */}
                        <span className="text-[11px] font-semibold text-gray-500 tabular-nums w-9 text-right shrink-0">
                          {fmtH(task.hours)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
