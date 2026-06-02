import { Bell } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>

      <div style={{ flex: 1 }} />

      <div className="topbar-right">
        <span className="date-range">May 26 – Jun 8, 2026</span>
        <div className="icon-btn">
          <Bell width={16} height={16} strokeWidth={2} />
          <span className="badge">3</span>
        </div>
        <div className="avatar" style={{ background: '#EDE9FE', color: '#5B21B6' }}>YK</div>
      </div>
    </header>
  )
}
