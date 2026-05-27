import { Clock } from 'lucide-react'

export function TitleBar() {
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-5 shrink-0 select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-royal flex items-center justify-center shrink-0">
          <Clock size={16} className="text-white" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-blackish" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            TimeWorks
          </span>
          <span className="text-[10px] text-muted font-medium">by AbroadWorks</span>
        </div>
      </div>
    </header>
  )
}
