import { useCallback, useEffect, useState } from 'react'
import { MATERIALS } from '../data/materials.generated'
import type { CompactDesign, ProjectState } from '../types'
import { createGrid, resizeGrid } from '../lib/grid'
import { expandRuns } from '../lib/runs'
import { sampleProject } from '../lib/sample'

const STORAGE_KEY = 'df-floor-portrait-studio:v1'
const materialIds = new Set(MATERIALS.map(({ id }) => id))

const isStoredProject = (value: unknown): value is ProjectState => {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<ProjectState>
  return project.version === 1
    && typeof project.name === 'string'
    && Number.isInteger(project.width) && (project.width ?? 0) >= 1 && (project.width ?? 0) <= 100
    && Number.isInteger(project.height) && (project.height ?? 0) >= 1 && (project.height ?? 0) <= 100
    && typeof project.background === 'string' && materialIds.has(project.background)
    && Array.isArray(project.cells) && project.cells.length === (project.width ?? 0) * (project.height ?? 0)
    && project.cells.every((id) => typeof id === 'string' && materialIds.has(id))
    && (project.renderMode === 'color' || project.renderMode === 'texture')
    && typeof project.gridVisible === 'boolean'
    && typeof project.zoom === 'number'
    && typeof project.selectedMaterial === 'string' && materialIds.has(project.selectedMaterial)
}

const initialProject = (): ProjectState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (isStoredProject(parsed)) return { ...parsed, zoom: Math.max(4, Math.min(40, parsed.zoom)) }
    }
  } catch {
    // A damaged local project falls back to the bundled sample without breaking startup.
  }
  return sampleProject()
}

const sameProject = (a: ProjectState, b: ProjectState) =>
  a.width === b.width && a.height === b.height && a.background === b.background
  && a.name === b.name && a.cells.length === b.cells.length
  && a.cells.every((cell, index) => cell === b.cells[index])

export function useProject() {
  const [project, setProject] = useState<ProjectState>(initialProject)
  const [past, setPast] = useState<ProjectState[]>([])
  const [future, setFuture] = useState<ProjectState[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
  }, [project])

  const commitProject = useCallback((next: ProjectState) => {
    setProject((current) => {
      if (sameProject(current, next)) return current
      setPast((history) => [...history.slice(-39), current])
      setFuture([])
      return next
    })
  }, [])

  const commitCells = useCallback((cells: string[]) => {
    setProject((current) => {
      if (cells.length !== current.width * current.height || cells.every((cell, index) => cell === current.cells[index])) return current
      setPast((history) => [...history.slice(-39), current])
      setFuture([])
      return { ...current, cells }
    })
  }, [])

  const setView = useCallback((patch: Partial<Pick<ProjectState, 'renderMode' | 'gridVisible' | 'zoom' | 'selectedMaterial' | 'name'>>) => {
    setProject((current) => ({ ...current, ...patch }))
  }, [])

  const undo = useCallback(() => {
    setPast((history) => {
      const previous = history.at(-1)
      if (!previous) return history
      setProject((current) => {
        setFuture((redoHistory) => [current, ...redoHistory].slice(0, 40))
        return previous
      })
      return history.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((history) => {
      const next = history[0]
      if (!next) return history
      setProject((current) => {
        setPast((undoHistory) => [...undoHistory.slice(-39), current])
        return next
      })
      return history.slice(1)
    })
  }, [])

  const createProject = useCallback((name: string, width: number, height: number, background: string) => {
    const current = project
    commitProject({
      ...current,
      name: name.trim() || 'Untitled Floor Portrait',
      width,
      height,
      background,
      cells: createGrid(width, height, background),
    })
  }, [commitProject, project])

  const resize = useCallback((width: number, height: number) => {
    commitProject({
      ...project,
      width,
      height,
      cells: resizeGrid(project.cells, project.width, project.height, width, height, project.background),
    })
  }, [commitProject, project])

  const setBackground = useCallback((background: string) => {
    commitProject({
      ...project,
      background,
      cells: project.cells.map((cell) => cell === project.background ? background : cell),
    })
  }, [commitProject, project])

  const importDesign = useCallback((design: CompactDesign, cells = expandRuns(design)) => {
    commitProject({
      ...project,
      name: design.name,
      width: design.width,
      height: design.height,
      background: design.background,
      cells,
      selectedMaterial: design.runs.at(-1)?.material ?? design.background,
    })
  }, [commitProject, project])

  const loadSample = useCallback(() => commitProject({ ...sampleProject(), renderMode: project.renderMode }), [commitProject, project.renderMode])
  const clear = useCallback(() => commitCells(createGrid(project.width, project.height, project.background)), [commitCells, project])
  const resetLocalProject = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPast([])
    setFuture([])
    setProject(sampleProject())
  }, [])

  return {
    project, commitCells, setView, createProject, resize, setBackground, importDesign,
    loadSample, clear, resetLocalProject, undo, redo,
    canUndo: past.length > 0, canRedo: future.length > 0,
  }
}
