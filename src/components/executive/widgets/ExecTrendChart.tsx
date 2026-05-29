import { useState } from 'react'
import { cn } from '../../../lib/cn'
import { EXEC_TREND_DATA } from '../../../data/executiveMockData'

type Metric = 'hours' | 'earnings'

function fmtVal(v: number, metric: Metric) {
  if (metric === 'hours') return `${v}h`
  return v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
}

const BRAND = '#2D2B8F'
const PREV  = '#E2E8F0'

export function ExecTrendChart() {
  const [metric, setMetric]   = useState<Metric>('hours')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const data = EXEC_TREND_DATA.map(d => ({
    day:      d.day,
    current:  metric === 'hours' ? d.currentHours  : d.currentEarnings,
    previous: metric === 'hours' ? d.previousHours : d.previousEarnings,
  }))

  // SVG dimensions
  const W = 400, H = 150, padT = 8, padB = 22
  const chartH = H - padT - padB
  const maxVal = Math.max(...data.flatMap(d => [d.current, d.previous]), 1)
  const groupW = W / data.length
  const barW   = Math.floor(groupW * 0.27)
  const gap    = 4

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex items-center bg-surface-hover rounded-lg p-0.5 self-start">
        {(['hours', 'earnings'] as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer capitalize',
              metric === m ? 'bg-white text-ink shadow-sm' : 'text-ink-secondary hover:text-ink',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* SVG bar chart */}
      <div className="relative select-none">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {data.map((d, i) => {
            const cx   = i * groupW + groupW / 2
            const prevH = d.previous > 0 ? (d.previous / maxVal) * chartH : 0
            const currH = d.current  > 0 ? (d.current  / maxVal) * chartH : 0
            const prevX = cx - barW - gap / 2
            const currX = cx + gap / 2
            const isHov = hoverIdx === i
            const tipY  = padT + chartH - Math.max(prevH, currH) - 56

            return (
              <g key={d.day} onMouseEnter={() => setHoverIdx(i)}>
                {isHov && (
                  <rect
                    x={i * groupW + 2} y={padT - 4}
                    width={groupW - 4} height={chartH + 4}
                    rx={4} fill="#F7F7F6"
                  />
                )}
                {prevH > 0 && (
                  <rect x={prevX} y={padT + chartH - prevH} width={barW} height={prevH} rx={3} fill={PREV} />
                )}
                {currH > 0 && (
                  <rect x={currX} y={padT + chartH - currH} width={barW} height={currH} rx={3} fill={BRAND} />
                )}
                <text
                  x={cx} y={H - 5} textAnchor="middle" fontSize="10"
                  fill={isHov ? '#111110' : '#A8A8A5'}
                  fontWeight={isHov ? '600' : '400'}
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {d.day}
                </text>
                {/* hover capture */}
                <rect x={i * groupW} y={padT} width={groupW} height={chartH} fill="transparent" />

                {isHov && (
                  <g>
                    <rect
                      x={cx - 50} y={Math.max(tipY, 2)}
                      width={100} height={52}
                      rx={8} fill="white"
                      stroke="rgba(0,0,0,0.08)" strokeWidth={1}
                    />
                    <text x={cx} y={Math.max(tipY, 2) + 15} textAnchor="middle" fontSize="10" fontWeight="600" fill="#111110" fontFamily="'Plus Jakarta Sans', sans-serif">{d.day}</text>
                    <circle cx={cx - 34} cy={Math.max(tipY, 2) + 29} r={3} fill={BRAND} />
                    <text x={cx - 28} y={Math.max(tipY, 2) + 33} fontSize="9" fill="#6B6B68" fontFamily="'Plus Jakarta Sans', sans-serif">This </text>
                    <text x={cx - 4}  y={Math.max(tipY, 2) + 33} fontSize="9" fontWeight="600" fill="#111110" fontFamily="'Plus Jakarta Sans', sans-serif">{fmtVal(d.current, metric)}</text>
                    <circle cx={cx - 34} cy={Math.max(tipY, 2) + 42} r={3} fill={PREV} stroke="#A8A8A5" strokeWidth={0.5} />
                    <text x={cx - 28} y={Math.max(tipY, 2) + 46} fontSize="9" fill="#6B6B68" fontFamily="'Plus Jakarta Sans', sans-serif">Prev </text>
                    <text x={cx - 4}  y={Math.max(tipY, 2) + 46} fontSize="9" fontWeight="600" fill="#111110" fontFamily="'Plus Jakarta Sans', sans-serif">{fmtVal(d.previous, metric)}</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="w-3 h-2.5 rounded-sm inline-block shrink-0" style={{ background: BRAND }} />
          This week
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <span className="w-3 h-2.5 rounded-sm inline-block shrink-0" style={{ background: PREV }} />
          Last week
        </div>
      </div>
    </div>
  )
}
