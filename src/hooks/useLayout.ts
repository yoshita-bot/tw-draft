import { useState, useCallback, useEffect } from 'react'
import { DEFAULT_LAYOUT, SECTION_CONFIGS } from '../data/mockData'

// ── Local array-move util (avoids @dnd-kit/sortable dep in bundle) ──────────
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  result.splice(to, 0, result.splice(from, 1)[0])
  return result
}

interface UseLayoutOptions {
  storageKey?: string
  defaultLayout?: string[]
  sectionConfigs?: Record<string, { id: string }>
}

function loadLayout(key: string, defaults: string[], configs: Record<string, { id: string }>): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(id => id in configs)
        // Fall back to defaults if nothing survived the filter (e.g. after a layout migration)
        if (valid.length > 0) return valid
      }
    }
  } catch {
    // ignore parse errors
  }
  return [...defaults]
}

function saveLayout(key: string, sections: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(sections))
  } catch {
    // ignore storage errors
  }
}

export function useLayout(options?: UseLayoutOptions) {
  const key     = options?.storageKey    ?? 'timeworks-dashboard-layout-v3'
  const defaults = options?.defaultLayout ?? DEFAULT_LAYOUT
  const configs  = options?.sectionConfigs ?? SECTION_CONFIGS

  const [sections, setSections] = useState<string[]>(() => loadLayout(key, defaults, configs))

  useEffect(() => {
    saveLayout(key, sections)
  }, [key, sections])

  const addSection = useCallback((sectionId: string) => {
    setSections(prev => [...prev, sectionId])
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(id => id !== sectionId))
  }, [])

  const reorderSections = useCallback((activeId: string, overId: string) => {
    setSections(prev => {
      const oldIndex = prev.indexOf(activeId)
      const newIndex = prev.indexOf(overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const moveUp = useCallback((sectionId: string) => {
    setSections(prev => {
      const index = prev.indexOf(sectionId)
      if (index <= 0) return prev
      return arrayMove(prev, index, index - 1)
    })
  }, [])

  const moveDown = useCallback((sectionId: string) => {
    setSections(prev => {
      const index = prev.indexOf(sectionId)
      if (index >= prev.length - 1) return prev
      return arrayMove(prev, index, index + 1)
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    setSections([...defaults])
  }, [defaults])

  return {
    currentSections: sections,
    addSection,
    removeSection,
    reorderSections,
    moveUp,
    moveDown,
    resetToDefaults,
  }
}
