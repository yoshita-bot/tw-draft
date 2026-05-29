import { useEffect, useRef, useState } from 'react'
import { useTimerStore } from './store/useTimerStore'
import { NavSidebar, type AppPage } from './components/NavSidebar/NavSidebar'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { EmployeePage } from './components/dashboard/EmployeePage'
import { ExecutivePage } from './components/executive/ExecutivePage'
import { ProjectsPanel } from './components/ProjectsPanel/ProjectsPanel'
import { InfoPanel } from './components/InfoPanel/InfoPanel'
import { ResizeHandle } from './components/shared/ResizeHandle'
import { IDLE_THRESHOLD_S } from './config'

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

export default function App() {
  const { tick, setIdle } = useTimerStore()
  const lastMouseMoveRef = useRef(Date.now())

  // ── Timer tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => tick(), 1000)
    return () => clearInterval(interval)
  }, [tick])

  // ── Idle detection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onActivity = () => { lastMouseMoveRef.current = Date.now() }
    window.addEventListener('mousemove', onActivity)
    window.addEventListener('keydown', onActivity)
    const idle = setInterval(() => {
      const secs = Math.floor((Date.now() - lastMouseMoveRef.current) / 1000)
      setIdle(secs >= IDLE_THRESHOLD_S ? secs : 0)
    }, 5000)
    return () => {
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown', onActivity)
      clearInterval(idle)
    }
  }, [setIdle])

  // ── Page routing ────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<AppPage>('home')

  // ── Me/Team view toggle ─────────────────────────────────────────────────────
  const [view, setView] = useState<'team' | 'me'>('team')

  // ── InfoPanel state (projects page only) ────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null)
  const [infoPanelPos, setInfoPanelPos] = useState<'right' | 'bottom'>('right')
  const [rightPanelWidth,   setRightPanelWidth]   = useState(360)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(360)

  const handleTaskClick = (projectId: string, taskId: string) => {
    setSelectedTask(prev =>
      prev?.projectId === projectId && prev?.taskId === taskId ? null : { projectId, taskId }
    )
  }

  const handleNavigate = (page: AppPage) => {
    if (page !== 'projects') setSelectedTask(null)
    setActivePage(page)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sky">

      {/* ── Collapsible nav sidebar ── */}
      <NavSidebar activePage={activePage} onNavigate={handleNavigate} />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Home page — team view (workforce management dashboard) */}
        {activePage === 'home' && view === 'team' && (
          <DashboardPage view={view} onViewChange={setView} />
        )}

        {/* Home page — me view (employee personal dashboard) */}
        {activePage === 'home' && view === 'me' && (
          <EmployeePage view={view} onViewChange={setView} />
        )}

        {/* Executive homepage — Group 1 (Phil/Rafi) */}
        {activePage === 'exec' && <ExecutivePage />}

        {/* Projects page (preserves full InfoPanel functionality) */}
        {activePage === 'projects' && (
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <div className="flex flex-1 overflow-hidden min-w-0">
              <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                <ProjectsPanel
                  onTaskClick={handleTaskClick}
                  selectedTaskId={selectedTask}
                />
              </main>

              {selectedTask && infoPanelPos === 'right' && (
                <>
                  <ResizeHandle
                    direction="horizontal"
                    onResize={(d) => setRightPanelWidth(w => clamp(w - d, 280, 700))}
                  />
                  <InfoPanel
                    projectId={selectedTask.projectId}
                    taskId={selectedTask.taskId}
                    position="right"
                    width={rightPanelWidth}
                    onClose={() => setSelectedTask(null)}
                    onPositionChange={setInfoPanelPos}
                  />
                </>
              )}
            </div>

            {selectedTask && infoPanelPos === 'bottom' && (
              <>
                <ResizeHandle
                  direction="vertical"
                  onResize={(d) => setBottomPanelHeight(h => clamp(h - d, 200, 600))}
                />
                <InfoPanel
                  projectId={selectedTask.projectId}
                  taskId={selectedTask.taskId}
                  position="bottom"
                  height={bottomPanelHeight}
                  onClose={() => setSelectedTask(null)}
                  onPositionChange={setInfoPanelPos}
                />
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
