import { cn } from '../../lib/cn'

function Sk({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-black/[0.08] rounded-md', className)} />
}

export function SkeletonKPICard() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.08]" style={{ gridColumn: 'span 2' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-black/[0.06]">
        <Sk className="h-3 w-24" />
      </div>
      <div className="grid grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`px-8 py-6 flex flex-col gap-3 ${i < 3 ? 'border-r border-black/[0.06]' : ''}`}>
            <Sk className="h-3 w-20" />
            <Sk className="h-8 w-20" />
            <Sk className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonFinancialCard() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.08]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-black/[0.06]">
        <Sk className="h-3 w-28" />
      </div>
      <div className="p-6 flex flex-col gap-5">
        {[0, 1, 2].map(i => (
          <div key={i}>
            {i > 0 && <div className="h-px bg-black/[0.06] mb-5" />}
            <div className="flex flex-col gap-2">
              <Sk className="h-3 w-28" />
              <Sk className="h-8 w-32" />
              <Sk className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChartCard() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.08]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-black/[0.06]">
        <Sk className="h-3 w-36" />
      </div>
      <div className="p-6 flex flex-col gap-4">
        <Sk className="h-7 w-32" />
        <Sk className="h-40 w-full" />
        <div className="flex gap-4">
          <Sk className="h-3 w-16" />
          <Sk className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonLostBillingCard() {
  return (
    <div className="bg-white rounded-xl border border-black/[0.08]" style={{ gridColumn: 'span 2' }}>
      <div className="flex items-center gap-2 px-6 py-4 border-b border-black/[0.06]">
        <Sk className="h-3 w-28" />
      </div>
      <div className="p-8 grid grid-cols-3 gap-8">
        <div className="flex flex-col gap-3">
          <Sk className="h-3 w-32" />
          <Sk className="h-10 w-28" />
          <Sk className="h-4 w-32" />
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Sk className="h-8 w-16" />
            <Sk className="h-3 w-16" />
          </div>
          <Sk className="h-6 w-4" />
          <div className="flex flex-col items-center gap-2">
            <Sk className="h-8 w-16" />
            <Sk className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Sk className="h-3 w-full" />
          <Sk className="h-3 w-full" />
          <Sk className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}
