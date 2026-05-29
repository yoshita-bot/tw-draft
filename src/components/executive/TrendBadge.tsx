export type TrendDirection = 'better' | 'worse' | 'neutral'

interface TrendBadgeProps {
  /** Raw signed delta value (positive = went up, negative = went down) */
  delta: number
  direction: TrendDirection
}

const STYLES: Record<TrendDirection, string> = {
  better:  'bg-success-light text-success',
  worse:   'bg-danger-light text-danger',
  neutral: 'bg-surface-hover text-ink-tertiary',
}

export function TrendBadge({ delta, direction }: TrendBadgeProps) {
  // Arrow reflects actual direction of change; color reflects whether that's good or bad
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '→'
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${STYLES[direction]}`}>
      {arrow} {Math.abs(delta)}% vs last week
    </span>
  )
}
