import { useEffect, useMemo, useState } from 'react'
import { Blocks, Gem, Hammer, Mountain, ShieldCheck } from 'lucide-react'
import { MATERIALS, TEXTURE_GENERATOR } from './data/materials.generated'
import type { Tool } from './types'
import { useProject } from './hooks/useProject'
import { PalettePanel } from './components/PalettePanel'
import type { CategoryFilter } from './components/PalettePanel'
import { CanvasEditor } from './components/CanvasEditor'
import { EditorToolbar } from './components/EditorToolbar'
import { ProjectPanel } from './components/ProjectPanel'
import { ImageImport } from './components/ImageImport'
import { DesignDesk } from './components/DesignDesk'
import { BuildPlan } from './components/BuildPlan'
import { ExportPanel } from './components/ExportPanel'

const categoryCounts = MATERIALS.reduce<Record<string, number>>((counts, material) => {
  counts[material.category] = (counts[material.category] ?? 0) + 1
  return counts
}, {})

export default function App() {
  const {
    project, commitCells, setView, createProject, resize, setBackground, importDesign,
    loadSample, clear, resetLocalProject, undo, redo, canUndo, canRedo,
  } = useProject()
  const [tool, setTool] = useState<Tool>('pencil')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [fitSignal, setFitSignal] = useState(1)

  const materialMap = useMemo(() => new Map(MATERIALS.map((material) => [material.id, material])), [])
  const visibleMaterials = useMemo(() => {
    const query = search.trim().toLowerCase()
    return MATERIALS.filter((material) =>
      (category === 'All' || material.category === category)
      && `${material.name} ${material.id} ${material.colorHex}`.toLowerCase().includes(query),
    )
  }, [category, search])
  const backgroundMaterial = materialMap.get(project.background) ?? MATERIALS[0]

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      const shortcuts: Partial<Record<string, Tool>> = {
        p: 'pencil', e: 'eraser', f: 'fill', i: 'eyedropper', l: 'line', r: 'rectangle',
      }
      const nextTool = shortcuts[key]
      if (nextTool) {
        event.preventDefault()
        setTool(nextTool)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [redo, undo])

  const reset = () => {
    if (window.confirm('Reset the saved local project and restore the bundled sample?')) resetLocalProject()
  }

  return (
    <div className="app-shell">
      <header className="masthead">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><Mountain /><Hammer /></div>
          <div>
            <span className="kicker">Dwarf Fortress construction atelier</span>
            <h1>Floor Portrait Studio</h1>
            <p>Turn one idea into one buildable floor tile at a time.</p>
          </div>
        </div>
        <div className="source-register" aria-label="Procedural texture atlas summary">
          <span><ShieldCheck size={16} />Original texture atlas</span>
          <strong>{MATERIALS.length} materials</strong>
          <code>{TEXTURE_GENERATOR.tileSize}×{TEXTURE_GENERATOR.tileSize} procedural tiles</code>
        </div>
      </header>

      <div className="material-tally" aria-label="Material category counts">
        <span><Blocks size={15} />{categoryCounts.Stone} stone</span>
        <span><Gem size={15} />{categoryCounts.Glass} glass</span>
        <span>{categoryCounts.Ceramic} ceramic</span>
        <span>{categoryCounts.Metal} metal bars</span>
        <b>1 canvas cell = 1 constructed floor tile</b>
      </div>

      <div className="studio-grid">
        <PalettePanel
          materials={MATERIALS}
          selectedId={project.selectedMaterial}
          search={search}
          category={category}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onSelect={(selectedMaterial) => setView({ selectedMaterial })}
        />

        <main className="drafting-column">
          <section className="drafting-header">
            <div>
              <span className="eyebrow">Active floor plan</span>
              <h2>{project.name}</h2>
            </div>
            <div className="draft-metrics">
              <span><strong>{project.width}×{project.height}</strong> footprint</span>
              <span><strong>{project.cells.length.toLocaleString()}</strong> placements</span>
            </div>
          </section>
          <EditorToolbar
            tool={tool}
            onToolChange={setTool}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onClear={clear}
            zoom={project.zoom}
            onZoomChange={(zoom) => setView({ zoom })}
            onFit={() => setFitSignal((signal) => signal + 1)}
            gridVisible={project.gridVisible}
            onGridChange={(gridVisible) => setView({ gridVisible })}
            renderMode={project.renderMode}
            onRenderModeChange={(renderMode) => setView({ renderMode })}
          />
          <CanvasEditor
            cells={project.cells}
            width={project.width}
            height={project.height}
            background={project.background}
            selectedMaterial={project.selectedMaterial}
            materials={materialMap}
            tool={tool}
            zoom={project.zoom}
            gridVisible={project.gridVisible}
            renderMode={project.renderMode}
            fitSignal={fitSignal}
            onZoomChange={(zoom) => setView({ zoom })}
            onCommit={commitCells}
            onSelectMaterial={(selectedMaterial) => setView({ selectedMaterial })}
          />
          <div className="drafting-note">
            <span>Shortcuts</span>
            <code>P</code> pencil <code>E</code> eraser <code>F</code> fill <code>I</code> pick
            <code>L</code> line <code>R</code> rectangle <code>⌘Z</code> undo
          </div>
        </main>

        <aside className="operations-rail" aria-label="Project and export controls">
          <ProjectPanel
            project={project}
            materials={MATERIALS}
            onNameChange={(name) => setView({ name })}
            onResize={resize}
            onCreate={createProject}
            onBackgroundChange={setBackground}
            onLoadSample={loadSample}
            onReset={reset}
          />
          <ImageImport
            width={project.width}
            height={project.height}
            background={backgroundMaterial}
            allMaterials={MATERIALS}
            visibleMaterials={visibleMaterials}
            onImport={commitCells}
          />
          <ExportPanel project={project} materials={materialMap} />
        </aside>
      </div>

      <section className="planning-grid" aria-label="AI design and construction planning">
        <DesignDesk
          width={project.width}
          height={project.height}
          background={project.background}
          materials={MATERIALS}
          onImport={importDesign}
        />
        <BuildPlan
          name={project.name}
          width={project.width}
          height={project.height}
          cells={project.cells}
          materials={materialMap}
        />
      </section>

      <footer className="app-footer">
        <span>Local-first. Your project stays in this browser.</span>
        <span>Texture previews are generated by original procedural artwork.</span>
        <code>generator v{TEXTURE_GENERATOR.version}</code>
      </footer>
    </div>
  )
}
