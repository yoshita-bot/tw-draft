import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SCREENSHOTS_PEOPLE } from '../../data/dashboardData'
import { avatarStyle } from '../../utils/avatar'
import { ROUTES } from '../../lib/routes'
import { ScreenshotImage } from '../../pages/ActivityPage'

function ShotCard({ sh }: { sh: { time: string; pct: number; level: string; seed: number } }) {
  const [hovered, setHovered] = useState(false)
  const badgeBg   = sh.level === 'high' ? '#DCFCE7' : sh.level === 'medium' ? '#FEF3C7' : '#FEE2E2'
  const badgeFg   = sh.level === 'high' ? '#15803D' : sh.level === 'medium' ? '#92400E' : '#B91C1C'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#C7C3FF' : '#E8E8E8'}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hovered ? '0 4px 16px rgba(108,99,255,0.10)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden' }}>
        <ScreenshotImage seed={sh.seed} width={300} height={188} style={{ width: '100%', height: '100%', display: 'block' }} />
        {hovered && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(108,99,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: 'rgba(108,99,255,0.85)', color: '#fff', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600 }}>
              View
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: '3px 6px 5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#6B7280' }}>{sh.time}</span>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 99, background: badgeBg, color: badgeFg }}>{sh.pct}%</span>
      </div>
    </div>
  )
}

export function RecentActivity({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Recent activity</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Link to={ROUTES.activityScreenshots} className="widget-link">View all →</Link>{gripNode}</div>
      </div>
      <div>
        {SCREENSHOTS_PEOPLE.slice(0, 2).map((p) => {
          const s = avatarStyle(p.name)
          const inits = p.name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div className="ss-person" key={p.name}>
              <div className="ss-person-header">
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, background: s.bg, color: s.color }}>{inits}</div>
                <div className="ss-person-info">
                  <div className="ss-person-name">{p.name}</div>
                  <div className="ss-person-meta">{p.project} · {p.client}</div>
                </div>
                <Link to={`${ROUTES.activityScreenshots}?worker=${encodeURIComponent(p.name)}&date=today`} className="ss-view-link">View all ›</Link>
              </div>
              <div className="ss-thumbs">
                {p.shots.map((sh) => (
                  <ShotCard key={sh.time} sh={sh} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
