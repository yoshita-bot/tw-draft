import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../lib/cn'

type Trend = 'up-good' | 'up-bad' | 'down-good' | 'down-bad'

export interface SmallStatChip {
  id: string
  label: string
  value: string
  sub?: string
  trend?: Trend
  valueColor?: string
  /** When present, the chip shows a Today / Week toggle */
  weekData?: {
    value: string
    sub?: string
    trend?: Trend
  }
  /** Consecutive chips sharing the same group string get a unified visual container */
  group?: string
}

// ── Chip content ──────────────────────────────────────────────────────────────

function TrendLine({ sub, trend }: { sub?: string; trend?: Trend }) {
  if (!sub) return null
  const isUp   = trend?.startsWith('up')
  const isGood = trend?.endsWith('good')
  const color  = trend ? (isGood ? 'text-emerald-600' : 'text-red-500') : 'text-gray-400'
  return (
    <div className="flex items-center gap-1">
      {trend && (isUp
        ? <TrendingUp  size={10} className={cn('shrink-0', color)} />
        : <TrendingDown size={10} className={cn('shrink-0', color)} />
      )}
      <span className={cn('text-[11px] truncate', color)}>{sub}</span>
    </div>
  )
}

function ChipContent({ chip }: { chip: SmallStatChip }) {
  const [showWeek, setShowWeek] = useState(false)
  const active = showWeek && chip.weekData ? chip.weekData : chip

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none truncate">
          {chip.label}
        </span>
        {chip.weekData && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setShowWeek(false)}
              className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                !showWeek ? 'bg-white/70 text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              Today
            </button>
            <button
              onClick={() => setShowWeek(true)}
              className={cn(
                'text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors cursor-pointer',
                showWeek ? 'bg-white/70 text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600',
              )}
            >
              Week
            </button>
          </div>
        )}
      </div>

      <span
        className="text-[22px] font-bold tabular-nums leading-tight text-gray-900"
        style={'valueColor' in active && (active as SmallStatChip).valueColor
          ? { color: (active as SmallStatChip).valueColor }
          : undefined}
      >
        {active.value}
      </span>

      <TrendLine sub={active.sub} trend={active.trend} />
    </div>
  )
}

// ── Flat item pre-processor ───────────────────────────────────────────────────

type GroupPos = 'none' | 'first' | 'middle' | 'last' | 'only'

interface FlatItem {
  chip: SmallStatChip
  groupPos: GroupPos
  isFirstInBar: boolean
}

function toFlatItems(chips: SmallStatChip[]): FlatItem[] {
  const result: FlatItem[] = []
  let barIndex = 0

  let i = 0
  while (i < chips.length) {
    const chip = chips[i]

    if (chip.group) {
      // Collect the full consecutive run for this group
      const run: SmallStatChip[] = []
      while (i < chips.length && chips[i].group === chip.group) {
        run.push(chips[i++])
      }
      run.forEach((c, j) => {
        const pos: GroupPos =
          run.length === 1 ? 'only' :
          j === 0            ? 'first' :
          j === run.length - 1 ? 'last' : 'middle'
        result.push({ chip: c, groupPos: pos, isFirstInBar: barIndex++ === 0 })
      })
    } else {
      result.push({ chip, groupPos: 'none', isFirstInBar: barIndex++ === 0 })
      i++
    }
  }

  return result
}

// ── Bar ───────────────────────────────────────────────────────────────────────

export function SmallWidgetBar({ chips }: { chips: SmallStatChip[] }) {
  if (chips.length === 0) return null

  const items = toFlatItems(chips)

  return (
    <div className="bg-white border-b border-gray-200/80 px-6 shrink-0">
      <div className="flex items-stretch">
        {items.map(({ chip, groupPos, isFirstInBar }) => {
          const inGroup     = groupPos !== 'none'
          const isGrpFirst  = groupPos === 'first' || groupPos === 'only'
          const isGrpLast   = groupPos === 'last'  || groupPos === 'only'
          const isGrpInner  = groupPos === 'middle' || groupPos === 'last'

          return (
            <div
              key={chip.id}
              className={cn(
                'flex items-stretch flex-1 min-w-0',
                // Group background spans all group chips
                inGroup && 'bg-indigo-50/60',
                // Outer border wraps the group
                inGroup && 'border-y border-indigo-100',
                isGrpFirst && 'rounded-l-2xl border-l pl-5',
                isGrpLast  && 'rounded-r-2xl border-r pr-5',
              )}
            >
              {/* Divider — slim internal line between group chips, wider gap elsewhere */}
              {!isFirstInBar && (
                <div
                  className={cn(
                    'w-px shrink-0 self-stretch',
                    isGrpInner ? 'bg-indigo-200/50 mx-5' : 'bg-gray-100 mx-6',
                  )}
                />
              )}

              {/* Content */}
              <div className="py-3.5 min-w-0">
                <ChipContent chip={chip} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
