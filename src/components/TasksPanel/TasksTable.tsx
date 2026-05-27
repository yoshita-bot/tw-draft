import type { Project } from '../../data/mockProjects'
import { TaskTableRow } from './TaskTableRow'

const COLS = [
  { label: 'Task Name',  align: 'left'  },
  { label: 'Status',     align: 'left'  },
  { label: 'Priority',   align: 'left'  },
  { label: 'Deadline',   align: 'left'  },
  { label: 'Time Spent', align: 'right' },
]

interface TasksTableProps {
  project: Project
  onTaskClick: (taskId: string) => void
  selectedTaskId: string | null
}

export function TasksTable({ project, onTaskClick, selectedTaskId }: TasksTableProps) {
  return (
    <div className="overflow-auto rounded-2xl border border-border bg-white shadow-sm h-full">
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-border">
            {COLS.map(({ label, align }) => (
              <th key={label} scope="col"
                className={`py-3 px-4 text-[11px] font-bold text-muted uppercase tracking-wider whitespace-nowrap text-${align}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {project.tasks.length === 0 ? (
            <tr><td colSpan={5} className="py-16 text-center text-sm text-muted">No tasks yet</td></tr>
          ) : (
            project.tasks.map(task => (
              <TaskTableRow key={task.id} task={task} projectId={project.id} onTaskClick={onTaskClick} isSelected={task.id === selectedTaskId} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
