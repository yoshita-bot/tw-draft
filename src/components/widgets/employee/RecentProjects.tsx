import { ArrowRight } from 'lucide-react'
import { EMPLOYEE_MOCK } from '../../../data/employeeMockData'

export function RecentProjects() {
  const { recentProjects } = EMPLOYEE_MOCK
  const maxHours = Math.max(...recentProjects.map(p => p.hoursLogged), 1)

  return (
    <div className="flex flex-col gap-3">
      {recentProjects.map((project, i) => {
        const pct = (project.hoursLogged / maxHours) * 100
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-blackish truncate">{project.name}</div>
                <div className="text-[10px] text-muted">{project.client}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-blackish tabular-nums">{project.hoursLogged}h</div>
                <div className="text-[10px] text-muted">{project.taskCount} tasks</div>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-royal/70 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div className="pt-1">
        <button className="flex items-center gap-1 text-[11px] text-royal font-semibold hover:text-blue-700 transition-colors cursor-pointer group">
          View all projects
          <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
