import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, Users } from 'lucide-react'
import { TEAMS, CLIENTS } from '../../data/mockData'
import { cn } from '../../lib/cn'

interface FilterBarProps {
  selectedGroup: string
  onGroupChange: (group: string) => void
}

const ALL_OPTION = { id: 'All', label: 'All employees', color: '#94A3B8', section: null as string | null }
const DEPT_OPTIONS = TEAMS.map(t => ({ id: t.name, label: t.name, color: t.color, section: 'Departments' as string | null }))
const CLIENT_OPTIONS = CLIENTS.map(c => ({ id: c.name, label: c.name, color: c.color, section: 'Client portfolios' as string | null }))
const ALL_OPTIONS = [ALL_OPTION, ...DEPT_OPTIONS, ...CLIENT_OPTIONS]

export function FilterBar({ selectedGroup, onGroupChange }: FilterBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const openDropdown = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropdownPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      const dd = document.getElementById('filter-dropdown')
      if (btnRef.current?.contains(target) || dd?.contains(target)) return
      setOpen(false)
      setQuery('')
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const current = ALL_OPTIONS.find(o => o.id === selectedGroup) ?? ALL_OPTION

  const filtered = query.trim()
    ? ALL_OPTIONS.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : ALL_OPTIONS

  const sections: { label: string | null; items: typeof ALL_OPTIONS }[] = []
  const noSection = filtered.filter(o => !o.section)
  if (noSection.length) sections.push({ label: null, items: noSection })
  for (const sec of ['Departments', 'Client portfolios']) {
    const items = filtered.filter(o => o.section === sec)
    if (items.length) sections.push({ label: sec, items })
  }

  const select = (id: string) => {
    onGroupChange(id)
    setOpen(false)
    setQuery('')
  }

  const isFiltered = selectedGroup !== 'All'

  return (
    <div className="bg-white border-b border-gray-200/80 px-5 py-2 flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 shrink-0 uppercase tracking-wider">
        <Users size={12} />
        <span>Filter</span>
      </div>

      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={open ? () => { setOpen(false); setQuery('') } : openDropdown}
        className={cn(
          'flex items-center gap-2 h-7 pl-2.5 pr-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
          open
            ? 'bg-white border-royal/50 text-gray-800 ring-2 ring-royal/10'
            : isFiltered
              ? 'bg-royal/5 border-royal/20 text-royal hover:border-royal/40'
              : 'bg-[#F8FAFC] border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-sky',
        )}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
        {current.label}
        <ChevronDown size={11} className={cn('text-gray-400 transition-transform duration-150 shrink-0', open && 'rotate-180')} />
      </button>

      {/* Active filter tag */}
      {isFiltered && !open && (
        <button
          onClick={() => onGroupChange('All')}
          className="flex items-center gap-1 text-[10px] text-muted hover:text-red-500 transition-colors cursor-pointer"
          title="Clear filter"
        >
          <span className="font-medium">Clear</span>
          <span className="text-gray-300">×</span>
        </button>
      )}

      {/* Fixed-position dropdown */}
      {open && (
        <div
          id="filter-dropdown"
          className="fixed z-[9999] w-60 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search groups…"
                className="w-full h-7 pl-7 pr-3 rounded-lg bg-[#F8FAFC] border border-gray-100 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-royal/20"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-y-auto py-1">
            {sections.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No matches for "{query}"</p>
            ) : (
              sections.map((sec, si) => (
                <div key={si}>
                  {sec.label && (
                    <div className="px-3 pt-2 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {sec.label}
                      </span>
                    </div>
                  )}
                  {sec.items.map(opt => {
                    const isSelected = selectedGroup === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => select(opt.id)}
                        className={cn(
                          'flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-royal/5 text-royal font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 font-medium',
                        )}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                        <span className="flex-1">{opt.label}</span>
                        {isSelected && <Check size={11} className="text-royal shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
