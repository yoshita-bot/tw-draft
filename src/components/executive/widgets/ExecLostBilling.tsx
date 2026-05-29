import { EXEC_LOST_BILLING } from '../../../data/executiveMockData'
import { TrendBadge } from '../TrendBadge'

export function ExecLostBilling() {
  const { lostHours, avgBillingRate, impact, trend, context } = EXEC_LOST_BILLING

  return (
    <div className="p-8 grid grid-cols-3 gap-8 items-center">
      {/* Big number */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-ink-secondary uppercase tracking-wide">
          Potential Billing Revenue Lost
        </span>
        <span className="text-[40px] font-semibold leading-none text-danger tabular-nums">
          ${impact.toLocaleString()}
        </span>
        <TrendBadge delta={trend} direction="worse" />
      </div>

      {/* Formula */}
      <div className="flex items-center justify-center gap-5">
        <div className="text-center">
          <div className="text-[28px] font-semibold text-ink tabular-nums leading-none">{lostHours}h</div>
          <div className="text-xs text-ink-secondary mt-1.5">lost hours</div>
        </div>
        <span className="text-2xl text-ink-tertiary font-light select-none">×</span>
        <div className="text-center">
          <div className="text-[28px] font-semibold text-ink tabular-nums leading-none">${avgBillingRate}</div>
          <div className="text-xs text-ink-secondary mt-1.5">avg rate / hr</div>
        </div>
      </div>

      {/* Context */}
      <p className="text-sm text-ink-secondary leading-relaxed">{context}</p>
    </div>
  )
}
