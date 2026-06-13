interface DSSmallWidgetProps {
  id: string
  label: string
  value: string
  delta: string
  up: boolean
  data: number[]
  visible: boolean
}

export function DSSmallWidget({ label, value, delta, up, visible }: DSSmallWidgetProps) {
  if (!visible) return null
  return (
    <div className="ds-status-tile">
      <div className="ds-tile-label">{label}</div>
      <div className="ds-tile-value">{value}</div>
      <div className={`ds-tile-delta ${up ? 'up' : 'down'}`}>
        <span className="ds-tile-arrow">{up ? '↑' : '↓'}</span>
        {delta}
      </div>
    </div>
  )
}
