import { create } from 'zustand'
import { initialProjects } from '../data/mockProjects'
import { richProjects } from '../data/mockProjectsRich'
import type { Project, Task, TaskStatus } from '../data/mockProjects'
import { BREAK_DURATION_S } from '../config'

interface TimerStore {
  globalSeconds: number
  globalRunning: boolean
  activeProjectId: string | null
  activeTaskId: string | null

  idleSeconds: number
  isIdle: boolean

  breakSecondsLeft: number
  breakRunning: boolean

  projects: Project[]

  startGlobal: () => void
  pauseGlobal: () => void
  stopGlobal: () => void
  startProject: (projectId: string) => void
  startTask: (projectId: string, taskId: string) => void
  tick: () => void
  setIdle: (seconds: number) => void
  startBreak: () => void
  stopBreak: () => void
  resetBreak: () => void
  updateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void
  updateTaskUrgent: (projectId: string, taskId: string, urgent: boolean) => void
  addTask: (projectId: string, task: Task) => void
  updateTask: (projectId: string, taskId: string, patch: Partial<Task>) => void
  toggleProjectPin: (projectId: string) => void
  sortProjects: (by: 'name' | 'hoursThisWeek' | 'lastWorked') => void
  reorderPinnedProjects: (fromIndex: number, toIndex: number) => void
  repositionProject: (projectId: string, beforeProjectId: string | null, pin: boolean) => void
}

export const useTimerStore = create<TimerStore>((set) => ({
  globalSeconds: 0,
  globalRunning: false,
  activeProjectId: null,
  activeTaskId: null,

  idleSeconds: 0,
  isIdle: false,

  breakSecondsLeft: BREAK_DURATION_S,
  breakRunning: false,

  projects: (() => {
    const p = new URLSearchParams(window.location.search)
    if (p.has('empty')) return []
    if (p.has('rich'))  return richProjects
    return initialProjects
  })(),

  startGlobal: () => set({ globalRunning: true }),

  pauseGlobal: () => set({ globalRunning: false }),

  stopGlobal: () =>
    set({
      globalRunning: false,
      globalSeconds: 0,
      activeProjectId: null,
      activeTaskId: null,
    }),

  startProject: (projectId) => {
    set({
      globalRunning: true,
      activeProjectId: projectId,
      activeTaskId: null,
    })
  },

  startTask: (projectId, taskId) => {
    set({
      globalRunning: true,
      activeProjectId: projectId,
      activeTaskId: taskId,
    })
  },

  tick: () => {
    set((state) => {
      const updates: Partial<TimerStore> = {}

      if (state.globalRunning) {
        updates.globalSeconds = state.globalSeconds + 1

        if (state.activeProjectId) {
          updates.projects = state.projects.map((p) => {
            if (p.id !== state.activeProjectId) return p
            return {
              ...p,
              seconds: p.seconds + 1,
              secondsToday: p.secondsToday + 1,
              secondsThisWeek: p.secondsThisWeek + 1,
              tasks: state.activeTaskId
                ? p.tasks.map((t) =>
                    t.id === state.activeTaskId
                      ? { ...t, seconds: t.seconds + 1, secondsToday: t.secondsToday + 1, secondsThisWeek: t.secondsThisWeek + 1 }
                      : t
                  )
                : p.tasks,
            }
          })
        }
      }

      if (state.breakRunning) {
        if (state.breakSecondsLeft > 0) {
          updates.breakSecondsLeft = state.breakSecondsLeft - 1
        } else {
          updates.breakRunning = false
        }
      }

      return updates
    })
  },

  setIdle: (seconds) =>
    set({
      idleSeconds: seconds,
      isIdle: seconds >= 120,
    }),

  startBreak: () => set({ breakRunning: true }),

  stopBreak: () => set({ breakRunning: false }),

  resetBreak: () => set({ breakSecondsLeft: BREAK_DURATION_S, breakRunning: false }),

  updateTaskStatus: (projectId, taskId, status) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : {
          ...p,
          tasks: p.tasks.map((t) => t.id !== taskId ? t : { ...t, status }),
        }
      ),
    })),

  updateTaskUrgent: (projectId, taskId, urgent) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : {
          ...p,
          tasks: p.tasks.map((t) =>
            t.id !== taskId ? t : { ...t, priority: urgent ? 'urgent' : 'medium' }
          ),
        }
      ),
    })),

  addTask: (projectId, task) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : { ...p, tasks: [...p.tasks, task], totalTasks: p.totalTasks + 1 }
      ),
    })),

  updateTask: (projectId, taskId, patch) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id !== projectId ? p : {
          ...p,
          tasks: p.tasks.map((t) => t.id !== taskId ? t : { ...t, ...patch }),
        }
      ),
    })),

  toggleProjectPin: (projectId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, pinned: !p.pinned } : p
      ),
    })),

  sortProjects: (by) =>
    set((state) => {
      const sorted = [...state.projects].sort((a, b) => {
        if (by === 'name') return a.name.localeCompare(b.name)
        if (by === 'hoursThisWeek') return b.secondsThisWeek - a.secondsThisWeek
        if (by === 'lastWorked') return (b.lastWorkedAt ?? '').localeCompare(a.lastWorkedAt ?? '')
        return 0
      })
      return { projects: sorted }
    }),

  reorderPinnedProjects: (fromIndex, toIndex) =>
    set((state) => {
      const pinned = state.projects.filter((p) => p.pinned)
      const unpinned = state.projects.filter((p) => !p.pinned)
      const reordered = [...pinned]
      const [moved] = reordered.splice(fromIndex, 1)
      reordered.splice(toIndex, 0, moved)
      return { projects: [...reordered, ...unpinned] }
    }),

  repositionProject: (projectId, beforeProjectId, pin) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId)
      if (!project) return {}
      const updated = { ...project, pinned: pin }
      const rest = state.projects.filter((p) => p.id !== projectId)
      if (beforeProjectId === null) {
        const pinnedList   = rest.filter((p) => p.pinned)
        const unpinnedList = rest.filter((p) => !p.pinned)
        return { projects: pin ? [...pinnedList, updated, ...unpinnedList] : [...pinnedList, ...unpinnedList, updated] }
      }
      const idx = rest.findIndex((p) => p.id === beforeProjectId)
      if (idx === -1) return {}
      const newList = [...rest]
      newList.splice(idx, 0, updated)
      return { projects: newList }
    }),
}))
