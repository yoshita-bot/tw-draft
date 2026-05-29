import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  EXEC_SECTION_CONFIGS, EXEC_DEFAULT_LAYOUT, EXEC_SECTION_GROUPS,
} from '../../data/executiveMockData'
import { useLayout } from '../../hooks/useLayout'
import { ExecTopBar } from './ExecTopBar'
import { ExecWidgetCard } from './ExecWidgetCard'
import { ExecAddSectionSheet } from './ExecAddSectionSheet'
import { AttendanceKPICard } from './widgets/AttendanceKPICard'
import { WeeklyFinancials } from './widgets/WeeklyFinancials'
import { ExecTrendChart } from './widgets/ExecTrendChart'
import { ExecLostBilling } from './widgets/ExecLostBilling'
import {
  SkeletonKPICard, SkeletonFinancialCard, SkeletonChartCard, SkeletonLostBillingCard,
} from './ExecSkeleton'

// ── Widget content router ─────────────────────────────────────────────────────

function WidgetContent({ id }: { id: string }) {
  switch (id) {
    case 'exec-attendance-kpi':    return <AttendanceKPICard />
    case 'exec-weekly-financials': return <WeeklyFinancials />
    case 'exec-trend-chart':       return <ExecTrendChart />
    case 'exec-lost-billing':      return <ExecLostBilling />
    default:                       return null
  }
}

// ── ExecutivePage ─────────────────────────────────────────────────────────────

export function ExecutivePage() {
  const [isLoaded, setIsLoaded]     = useState(false)
  const [sheetOpen, setSheetOpen]   = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const layout = useLayout({
    storageKey:     'timeworks-exec-layout-v1',
    defaultLayout:  EXEC_DEFAULT_LAYOUT,
    sectionConfigs: EXEC_SECTION_CONFIGS,
  })

  const handleDragStart = (id: string) => {
    draggingRef.current = id
    setDraggingId(id)
  }
  const handleDragEnd = () => {
    draggingRef.current = null
    setDraggingId(null)
    setDragOverId(null)
  }
  const handleDragOver = (id: string) => {
    if (draggingRef.current && draggingRef.current !== id) setDragOverId(id)
  }
  const handleDrop = (id: string) => {
    if (draggingRef.current && draggingRef.current !== id) {
      layout.reorderSections(draggingRef.current, id)
    }
    draggingRef.current = null
    setDraggingId(null)
    setDragOverId(null)
  }

  function handleToggle(id: string) {
    if (layout.currentSections.includes(id)) {
      layout.removeSection(id)
    } else {
      layout.addSection(id)
    }
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden min-w-0"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <ExecTopBar onAddSection={() => setSheetOpen(true)} />

      <div className="flex-1 overflow-y-auto bg-surface-page">
        <div className="px-8 py-6">
          {!isLoaded ? (
            <div className="grid grid-cols-2 gap-4">
              <SkeletonKPICard />
              <SkeletonFinancialCard />
              <SkeletonChartCard />
              <SkeletonLostBillingCard />
            </div>
          ) : layout.currentSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <p className="text-sm text-ink-secondary">No sections shown</p>
              <button
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/[0.08] text-sm font-medium text-ink hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <Plus size={14} />
                Add sections
              </button>
            </div>
          ) : (() => {
            const smallSections = layout.currentSections.filter(id => EXEC_SECTION_CONFIGS[id]?.span === 2 && id === 'exec-attendance-kpi')
            const largeSections = layout.currentSections.filter(id => id !== 'exec-attendance-kpi')

            const renderSection = (id: string) => {
              const config = EXEC_SECTION_CONFIGS[id]
              const span = config?.span ?? 1
              const isBeingDragged = draggingId === id
              const isDragTarget   = dragOverId === id && !isBeingDragged
              return (
                <div
                  key={id}
                  style={{ gridColumn: span === 2 ? 'span 2' : 'span 1' }}
                  className={isDragTarget ? 'rounded-xl ring-2 ring-brand/30' : ''}
                  onDragOver={e => { e.preventDefault(); handleDragOver(id) }}
                  onDrop={e    => { e.preventDefault(); handleDrop(id) }}
                >
                  <ExecWidgetCard
                    title={config?.title ?? id}
                    onRemove={() => layout.removeSection(id)}
                    isDragging={isBeingDragged}
                    onDragStart={() => handleDragStart(id)}
                    onDragEnd={handleDragEnd}
                  >
                    <WidgetContent id={id} />
                  </ExecWidgetCard>
                </div>
              )
            }

            return (
              <div className="flex flex-col gap-4" onDragOver={e => e.preventDefault()}>
                {smallSections.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {smallSections.map(renderSection)}
                  </div>
                )}
                {largeSections.length > 0 && (
                  <div
                    className="grid grid-cols-2 gap-4"
                    style={{ gridAutoRows: '1fr' }}
                  >
                    {largeSections.map(renderSection)}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      <ExecAddSectionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onResetDefaults={() => { layout.resetToDefaults(); setSheetOpen(false) }}
        groups={EXEC_SECTION_GROUPS}
        currentSections={layout.currentSections}
        onToggle={handleToggle}
      />
    </div>
  )
}
