import { Sparkline } from './Sparkline'

interface SmallWidgetProps {
  id: string
  label: string
  value: string
  delta: string
  up: boolean
  data: number[]
  visible: boolean
}

export function SmallWidget({ label, value, delta, up, data, visible }: SmallWidgetProps) {
  const color = up ? '#22C55E' : '#EF4444'

  if (!visible) return null

  return (
    <div className="small-widget">
      <div className="sw-left">
        <div className="sw-label">{label}</div>
        <div className="sw-value">{value}</div>
        <div className={`sw-delta ${up ? 'up' : 'down'}`}>{delta}</div>
      </div>
      <div className="sw-chart">
        <Sparkline data={data} color={color} />
      </div>
    </div>
  )
}
