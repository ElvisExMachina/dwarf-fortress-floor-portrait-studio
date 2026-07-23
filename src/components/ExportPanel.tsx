import { useMemo, useState } from 'react'
import { Braces, Download, FileSpreadsheet, FileText, Hammer, ImageDown, LoaderCircle } from 'lucide-react'
import type { Material } from '../data/materials.generated'
import type { ProjectState } from '../types'
import { downloadBlob, downloadText, safeFilename } from '../lib/browser'
import {
  buildPlanText,
  buildRunsCsv,
  compactProjectJson,
  materialTotals,
  orderedTilesCsv,
  quickfortBlueprintCsv,
} from '../lib/exports'
import { renderProjectBlob } from '../lib/render'

interface ExportPanelProps {
  project: ProjectState
  materials: ReadonlyMap<string, Material>
}

export function ExportPanel({ project, materials }: ExportPanelProps) {
  const [scale, setScale] = useState(16)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Exports use the current canvas and procedural material catalog.')
  const quickfortSteps = useMemo(() => materialTotals(project.cells, materials), [project.cells, materials])

  const exportPng = async () => {
    setBusy(true)
    setStatus('Rendering PNG…')
    try {
      const blob = await renderProjectBlob(project.cells, project.width, project.height, materials, project.renderMode, scale)
      downloadBlob(blob, safeFilename(project.name, 'png'))
      setStatus(`Downloaded ${project.width * scale}×${project.height * scale} PNG with no interpolation.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PNG export failed.')
    } finally {
      setBusy(false)
    }
  }

  const saveText = (kind: 'json' | 'tiles' | 'runs' | 'plan' | 'quickfort') => {
    if (kind === 'json') downloadText(compactProjectJson(project.name, project.width, project.height, project.background, project.cells), safeFilename(project.name, 'json'), 'application/json')
    if (kind === 'tiles') downloadText(orderedTilesCsv(project.cells, project.width, project.height, materials), safeFilename(`${project.name}-ordered-tiles`, 'csv'), 'text/csv')
    if (kind === 'runs') downloadText(buildRunsCsv(project.cells, project.width, project.height, materials), safeFilename(`${project.name}-build-runs`, 'csv'), 'text/csv')
    if (kind === 'plan') downloadText(buildPlanText(project.name, project.cells, project.width, project.height, materials), safeFilename(`${project.name}-build-plan`, 'txt'), 'text/plain')
    if (kind === 'quickfort') downloadText(quickfortBlueprintCsv(project.cells, project.width, project.height, materials), safeFilename(`${project.name}-quickfort`, 'csv'), 'text/csv')
    if (kind === 'quickfort') {
      setStatus(`Instruction-first Quickfort CSV downloaded. README builds nothing; set the exact floor filter before each of ${quickfortSteps.length} material phases.`)
      return
    }
    setStatus(`${kind === 'tiles' ? 'Ordered tile CSV' : kind === 'runs' ? 'Build-run CSV' : kind === 'plan' ? 'Plain-text plan' : 'Compact project JSON'} downloaded.`)
  }

  return (
    <section className="panel export-panel">
      <div className="panel-heading"><div><span className="eyebrow">Take it to the fortress</span><h2>Downloads</h2></div><Download size={21} className="heading-icon" /></div>
      <div className="png-export-row">
        <label className="field-label">PNG pixels per tile<select value={scale} onChange={(event) => setScale(Number(event.target.value))}>{[4, 8, 16, 24, 32, 48].map((value) => <option key={value} value={value}>{value}px · {project.width * value}×{project.height * value}</option>)}</select></label>
        <button className="primary-button" type="button" disabled={busy} onClick={() => void exportPng()}>{busy ? <LoaderCircle className="spin" size={17} /> : <ImageDown size={17} />}PNG preview</button>
      </div>
      <div className="download-grid">
        <button type="button" onClick={() => saveText('json')}><Braces size={19} /><span><strong>Compact JSON</strong><small>Re-importable horizontal runs</small></span></button>
        <button type="button" onClick={() => saveText('tiles')}><FileSpreadsheet size={19} /><span><strong>Ordered tile CSV</strong><small>Every cell, row-major</small></span></button>
        <button type="button" onClick={() => saveText('runs')}><FileSpreadsheet size={19} /><span><strong>Build-runs CSV</strong><small>Adjacent horizontal tiles</small></span></button>
        <button type="button" onClick={() => saveText('plan')}><FileText size={19} /><span><strong>Build plan text</strong><small>Totals and row instructions</small></span></button>
        <button className="quickfort-download" type="button" onClick={() => saveText('quickfort')}><Hammer size={19} /><span><strong>Staged Quickfort CSV</strong><small>README first · manual material filters</small></span></button>
      </div>
      <p className="quickfort-note"><strong>Materials are manual.</strong> Quickfort cannot encode a floor material in `Cf`. The file opens on a harmless README; set buildingplan's exact floor filter before each filter…then_apply section.</p>
      <details className="quickfort-steps">
        <summary>{quickfortSteps.length} required material-filter {quickfortSteps.length === 1 ? 'phase' : 'phases'}</summary>
        <ol>
          {quickfortSteps.map(({ material, count }, index) => (
            <li key={material.id}>
              <span><b>Step {index + 1}: {material.name}</b><small>{count} floors · {material.category}</small></span>
              {material.category === 'Metal' && <em>Enable bars first</em>}
            </li>
          ))}
        </ol>
      </details>
      <p className="status-copy" aria-live="polite">{status}</p>
    </section>
  )
}
