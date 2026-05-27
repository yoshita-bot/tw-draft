import { useState } from 'react'
import { ArrowLeft, LayoutList, LayoutGrid as LayoutGridIcon, Plus } from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import { TasksTable } from './TasksTable'
import { TasksGrid } from './TasksGrid'
import { CreateTaskModal } from './CreateTaskModal'
import { cn } from '../../lib/cn'

interface TasksPanelProps {
  projectId: string
  onBack: () => void
  onTaskClick: (taskId: string) => void
  selectedTaskId: string | null
}

export function TasksPanel({ projectId, onBack, onTaskClick, selectedTaskId }: TasksPanelProps) {
  const [view, setView] = useState<'table' | 'card'>('table')
  const [showCreate, setShowCreate] = useState(false)
  const project = useTimerStore((s) => s.projects.find((p) => p.id === projectId))

  if (!project) return null

  const doneCount = project.tasks.filter(t => t.status === 'done').length

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 h-14 border-b border-border shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-blackish cursor-pointer focus:outline-none rounded-lg">
          <ArrowLeft size={15} /><span className="font-medium">Projects</span>
        </button>
        <span className="text-muted/40">/</span>
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        <h1 className="text-base font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>{project.name}</h1>
        <span className="text-xs font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">{doneCount}/{project.tasks.length} done</span>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-royal text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-sm shadow-royal/20">
            <Plus size={13} /> New Task
          </button>
          <div className="flex items-center bg-sky rounded-lg p-1 border border-border">
            <button onClick={() => setView('table')} aria-pressed={view === 'table'}
              className={cn('flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-semibold cursor-pointer',
                view === 'table' ? 'bg-white text-blackish shadow-sm' : 'text-muted hover:text-blackish')}>
              <LayoutList size={13} /> Table
            </button>
            <button onClick={() => setView('card')} aria-pressed={view === 'card'}
              className={cn('flex items-center gap-1.5 h-6 px-2.5 rounded-md text-xs font-semibold cursor-pointer',
                view === 'card' ? 'bg-white text-blackish shadow-sm' : 'text-muted hover:text-blackish')}>
              <LayoutGridIcon size={13} /> Cards
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-sky p-5">
        {view === 'table'
          ? <TasksTable project={project} onTaskClick={onTaskClick} selectedTaskId={selectedTaskId} />
          : <TasksGrid project={project} onTaskClick={onTaskClick} selectedTaskId={selectedTaskId} />
        }
      </div>

      {showCreate && <CreateTaskModal defaultProjectId={projectId} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
