import { useState } from 'react'
import { cn } from '../../lib/cn'
import { TREND_DATA } from '../../data/mockData'

type Metric = 'hours' | 'earnings'

function fmt(v: number, metric: Metric): string {
  if (metric === 'hours') return `${v}h`
  return v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
}

const ROYAL = '#3B71E8'
const GRAY_BAR = '#E2E8F0'

export function TrendChart() {
  const [metric, setMetric] = useState<Metric>('hours')
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null)

  const data = TREND_DATA.map(d => ({
    day: d.day,
    current:  metric === 'hours' ? d.currentHours  : d.currentEarnings,
    previous: metric === 'hours' ? d.previousHours : d.previousEarnings,
  }))

  // SVG dimensions
  const W = 380
  const H = 140
  const padL = 0
  const padR = 0
  const padT = 8
  const padB = 22
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const maxVal = Math.max(...data.flatMap(d => [d.current, d.previous]), 1)

  const barCount = data.length
  const groupW = chartW / barCount
  const barW = Math.floor(groupW * 0.28)
  const gap = 3

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle */}
      <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5 self-start">
        {(['hours', 'earnings'] as Metric[]).map(m => (
          <button
            key={m}
            onClick={() => { setMetric(m); setTooltip(null) }}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer capitalize',
              metric === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="relative select-none">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.06" />
            </filter>
          </defs>

          {data.map((d, i) => {
            const cx = padL + i * groupW + groupW / 2
            const prevH  = d.previous > 0 ? (d.previous / maxVal) * chartH : 0
            const currH  = d.current  > 0 ? (d.current  / maxVal) * chartH : 0
            const prevX  = cx - barW - gap / 2
            const currX  = cx + gap / 2
            const isHov  = tooltip?.idx === i
            const tipTop = padT + chartH - Math.max(prevH, currH) - 56

            return (
              <g
                key={d.day}
                onMouseEnter={() => setTooltip({ idx: i })}
              >
                {/* Hover bg */}
                {isHov && (
                  <rect
                    x={padL + i * groupW + 2}
                    y={padT - 4}
                    width={groupW - 4}
                    height={chartH + 4}
                    rx={4}
                    fill="#F1F5F9"
                  />
                )}

                {/* Previous week bar */}
                {prevH > 0 && (
                  <rect
                    x={prevX}
                    y={padT + chartH - prevH}
                    width={barW}
                    height={prevH}
                    rx={3}
                    fill={GRAY_BAR}
                  />
                )}
                {/* Current week bar */}
                {currH > 0 && (
                  <rect
                    x={currX}
                    y={padT + chartH - currH}
                    width={barW}
                    height={currH}
                    rx={3}
                    fill={ROYAL}
                  />
                )}

                {/* Day label */}
                <text
                  x={cx}
                  y={H - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHov ? '#0F172A' : '#94A3B8'}
                  fontWeight={isHov ? '700' : '500'}
                  fontFamily="Karla, sans-serif"
                >
                  {d.day}
                </text>

                {/* Hover capture target */}
                <rect
                  x={padL + i * groupW}
                  y={padT}
                  width={groupW}
                  height={chartH}
                  fill="transparent"
                  className="cursor-default"
                />

                {/* Tooltip */}
                {isHov && (
                  <g>
                    <rect
                      x={cx - 48}
                      y={Math.max(tipTop, 2)}
                      width={96}
                      height={50}
                      rx={8}
                      fill="white"
                      stroke="#E2E8F0"
                      strokeWidth={1}
                      filter="url(#card-shadow)"
                    />
                    {/* Day */}
                    <text x={cx} y={Math.max(tipTop, 2) + 15} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A" fontFamily="Karla, sans-serif">{d.day}</text>
                    {/* This week */}
                    <circle cx={cx - 32} cy={Math.max(tipTop, 2) + 28} r={3} fill={ROYAL} />
                    <text x={cx - 26} y={Math.max(tipTop, 2) + 32} fontSize="9" fill="#64748B" fontFamily="Karla, sans-serif">This </text>
                    <text x={cx - 3}  y={Math.max(tipTop, 2) + 32} fontSize="9" fontWeight="700" fill="#0F172A" fontFamily="Karla, sans-serif">{fmt(d.current, metric)}</text>
                    {/* Prev week */}
                    <circle cx={cx - 32} cy={Math.max(tipTop, 2) + 42} r={3} fill={GRAY_BAR} stroke="#94A3B8" strokeWidth={0.5} />
                    <text x={cx - 26} y={Math.max(tipTop, 2) + 46} fontSize="9" fill="#64748B" fontFamily="Karla, sans-serif">Prev </text>
                    <text x={cx - 3}  y={Math.max(tipTop, 2) + 46} fontSize="9" fontWeight="700" fill="#0F172A" fontFamily="Karla, sans-serif">{fmt(d.previous, metric)}</text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ backgroundColor: ROYAL }} />
          This week
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-3 h-2.5 rounded-sm inline-block" style={{ backgroundColor: GRAY_BAR }} />
          Last week
        </div>
      </div>
    </div>
  )
}
