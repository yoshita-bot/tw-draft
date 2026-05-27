import { useState } from 'react'
import { Clock, Search, MessageCircle } from 'lucide-react'
import { useTimerStore } from '../../store/useTimerStore'
import { ProjectRow } from './ProjectRow'
import { EXTERNAL_LINKS } from '../../config'
import { TimerWidget } from '../TimerWidget/TimerWidget'

export function Sidebar() {
  const [search, setSearch] = useState('')
  const { projects } = useTimerStore()

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.tasks.some((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo header */}
      <div className="flex items-center px-4 h-14 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-royal flex items-center justify-center shrink-0">
          <Clock size={16} className="text-white" />
        </div>
        <div className="ml-2.5 flex flex-col leading-tight">
          <span className="text-sm font-bold text-blackish whitespace-nowrap" style={{ fontFamily: 'Montserrat, sans-serif' }}>TimeWorks</span>
          <span className="text-[10px] text-muted font-medium whitespace-nowrap">by AbroadWorks</span>
        </div>
        <div className="ml-auto flex items-center">
          <button
            onClick={() => window.open(EXTERNAL_LINKS.chat, '_blank', 'noopener,noreferrer')}
            aria-label="Open chat"
            title="Chat"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted hover:text-blackish hover:bg-sky transition-colors focus:outline-none cursor-pointer"
          >
            <MessageCircle size={16} />
          </button>
        </div>
      </div>

      {/* Timer */}
      <div className="border-b border-border shrink-0">
        <TimerWidget />
      </div>

      {/* Projects section */}
      <div className="flex flex-col flex-1 overflow-hidden px-4 py-4">
        {/* Section heading */}
        <div className="flex items-center justify-between px-1 mb-3">
          <span className="text-xs font-bold text-muted uppercase tracking-widest">Projects</span>
          <span className="text-xs font-bold text-white bg-royal rounded-full w-5 h-5 flex items-center justify-center">
            {projects.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects & tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects and tasks"
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-border bg-sky text-sm text-blackish placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-royal/25 focus:border-royal/50 transition-colors"
          />
        </div>

        {/* Project list */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1 -mr-1 pr-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">No projects found</p>
          ) : (
            filtered.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
