import { ATTENDANCE_KPIS, ATTENDANCE_VALUE_COLORS, ATTENDANCE_CONTRIBUTORS } from '../../data/dashboardData'

export function AttendanceKPIs({ gripNode }: { gripNode?: React.ReactNode } = {}) {
  return (
    <div className="large-widget">
      <div className="widget-header">
        <span className="widget-title">Attendance KPIs</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span className="akpi-period">May 2026</span>{gripNode}</div>
      </div>
      <p className="akpi-sub">Team-wide attendance health at a glance</p>

      <div className="akpi-grid">
        {ATTENDANCE_KPIS.map((k, i) => {
          const arrow = k.trendDir === 'bad' ? '↑' : k.trendDir === 'good' ? '↓' : '→'
          return (
            <div className="akpi-card" key={k.label}>
              <div className="akpi-card-label">{k.label}</div>
              <div className="akpi-card-value" style={{ color: ATTENDANCE_VALUE_COLORS[i] }}>
                {k.value}<span className="akpi-card-unit">{k.unit}</span>
              </div>
              <div className="akpi-card-footer">
                <span className="akpi-card-ctx">{k.ctx}</span>
                <span className={`akpi-trend ${k.trendDir}`}>{arrow} {k.trend}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="akpi-divider"></div>
      <p className="akpi-breakdown-label">Top contributors</p>
      <div className="akpi-breakdown-grid">
        {ATTENDANCE_CONTRIBUTORS.slice(0, 3).map((c) => (
          <div className="akpi-breakdown-item" key={c.name}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, fontWeight: 500, flexShrink: 0, background: c.bg, color: c.fg }}>
              {c.initials}
            </div>
            <div className="akpi-breakdown-info">
              <div className="akpi-breakdown-name">{c.name}</div>
              <div className="akpi-breakdown-detail">{c.detail}</div>
            </div>
            <span className="akpi-breakdown-val" style={{ color: c.valColor }}>{c.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
