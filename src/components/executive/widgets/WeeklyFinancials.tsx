import { EXEC_FINANCIAL_STATS } from '../../../data/executiveMockData'
import { TrendBadge, type TrendDirection } from '../TrendBadge'

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

export function WeeklyFinancials() {
  return (
    <div className="p-6">
      {EXEC_FINANCIAL_STATS.map((stat, i) => {
        const direction: TrendDirection = stat.higherIsBetter
          ? (stat.trend > 0 ? 'better' : 'worse')
          : (stat.trend > 0 ? 'worse' : 'better')

        return (
          <div key={stat.label}>
            {i > 0 && <div className="h-px bg-black/[0.06] my-5" />}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-ink-secondary uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="text-[32px] font-semibold leading-none text-ink tabular-nums">
                {fmt(stat.value)}
              </span>
              <TrendBadge delta={stat.trend} direction={direction} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
