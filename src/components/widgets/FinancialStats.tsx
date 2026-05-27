import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { FINANCIAL_STATS } from '../../data/mockData'

function fmt(n: number): string {
  return '$' + n.toLocaleString()
}

export function FinancialStats() {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
        Week of May 19 – 25, 2026
      </div>
      {FINANCIAL_STATS.map((stat, i) => {
        const isUp = stat.trend > 0
        const isGood = stat.higherIsBetter ? isUp : !isUp
        const TrendIcon = isUp ? TrendingUp : TrendingDown

        return (
          <div key={stat.label}>
            {i > 0 && <div className="h-px bg-gray-100 my-3" />}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-500 font-medium mb-1">{stat.label}</div>
                <div
                  className="text-xl font-bold text-gray-900 tabular-nums"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {fmt(stat.value)}
                </div>
              </div>
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold shrink-0',
                isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500',
              )}>
                <TrendIcon size={11} />
                {Math.abs(stat.trend)}%
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
