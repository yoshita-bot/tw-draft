import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface Crumb {
  label: string
  path?: string   // omit for the current (last) crumb
}

interface TopBarProps {
  crumbs: Crumb[]
}

export function TopBar({ crumbs }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="topbar">
      <div className="topbar-left">
        <nav style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span style={{ margin: '0 6px', color: '#D1D5DB', fontSize: 14, userSelect: 'none' }}>/</span>
                )}
                {isLast || !crumb.path ? (
                  <span style={{ fontSize: 14, fontWeight: isLast ? 600 : 400, color: isLast ? '#111827' : '#9CA3AF' }}>
                    {crumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => crumb.path && navigate(crumb.path)}
                    style={{
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontSize: 14, fontWeight: 400, color: '#9CA3AF', fontFamily: 'inherit',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
                  >
                    {crumb.label}
                  </button>
                )}
              </span>
            )
          })}
        </nav>
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
