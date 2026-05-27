import { TrendingUp, AlertTriangle, DollarSign } from 'lucide-react'
import { LOST_BILLING } from '../../data/mockData'

export function LostBillingImpact() {
  const { lostHours, avgBillingRate, impact, trend, context } = LOST_BILLING

  return (
    <div className="flex flex-col gap-4">
      {/* Alert banner */}
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
        <AlertTriangle size={12} className="text-red-500 shrink-0" />
        <span className="text-[11px] font-semibold text-red-600">Revenue at risk this week</span>
      </div>

      {/* Big number */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-1">
          <DollarSign size={16} className="text-red-500" />
        </div>
        <div>
          <div
            className="text-3xl font-black text-gray-900 tabular-nums leading-tight"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            ${impact.toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">potential billing revenue lost</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex items-center gap-2 py-3 border-t border-b border-gray-100">
        <div className="flex-1 text-center">
          <div className="text-base font-bold text-gray-900 tabular-nums" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {lostHours}h
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">lost hours</div>
        </div>
        <div className="text-gray-300 text-lg font-light select-none">×</div>
        <div className="flex-1 text-center">
          <div className="text-base font-bold text-gray-900 tabular-nums" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            ${avgBillingRate}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5 font-medium">avg rate /hr</div>
        </div>
      </div>

      {/* Context */}
      <p className="text-[11px] text-gray-500 leading-relaxed">{context}</p>

      {/* Trend indicator */}
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
        <TrendingUp size={12} />
        {trend}% worse than last week
      </div>
    </div>
  )
}
