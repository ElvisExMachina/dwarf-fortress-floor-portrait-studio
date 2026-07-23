import { useEffect, useState } from 'react'
import { FilePlus2, RefreshCcw, Ruler, Sparkles } from 'lucide-react'
import type { Material } from '../data/materials.generated'
import type { ProjectState } from '../types'

interface ProjectPanelProps {
  project: ProjectState
  materials: Material[]
  onNameChange: (name: string) => void
  onResize: (width: number, height: number) => void
  onCreate: (name: string, width: number, height: number, background: string) => void
  onBackgroundChange: (id: string) => void
  onLoadSample: () => void
  onReset: () => void
}

const validDimension = (value: number) => Number.isInteger(value) && value >= 1 && value <= 100

export function ProjectPanel(props: ProjectPanelProps) {
  const [width, setWidth] = useState(props.project.width)
  const [height, setHeight] = useState(props.project.height)
  const valid = validDimension(width) && validDimension(height)

  useEffect(() => {
    setWidth(props.project.width)
    setHeight(props.project.height)
  }, [props.project.height, props.project.width])

  return (
    <section className="panel control-panel">
      <div className="panel-heading compact-heading">
        <div><span className="eyebrow">Draft specification</span><h2>Project</h2></div>
        <span className="dimension-stamp">{props.project.width}×{props.project.height}</span>
      </div>
      <label className="field-label">
        Portrait name
        <input value={props.project.name} maxLength={80} onChange={(event) => props.onNameChange(event.target.value)} />
      </label>
      <div className="dimension-fields">
        <label className="field-label">Width<input type="number" min="1" max="100" value={width} onChange={(event) => setWidth(event.target.valueAsNumber)} /></label>
        <span aria-hidden="true">×</span>
        <label className="field-label">Height<input type="number" min="1" max="100" value={height} onChange={(event) => setHeight(event.target.valueAsNumber)} /></label>
      </div>
      {!valid && <p className="field-error">Width and height must each be whole numbers from 1 to 100.</p>}
      <div className="button-row">
        <button className="secondary-button" type="button" disabled={!valid} onClick={() => props.onResize(width, height)}><Ruler size={16} />Resize</button>
        <button className="secondary-button" type="button" disabled={!valid} onClick={() => props.onCreate(props.project.name, width, height, props.project.background)}><FilePlus2 size={16} />New blank</button>
      </div>
      <label className="field-label">
        Background / eraser material
        <select value={props.project.background} onChange={(event) => props.onBackgroundChange(event.target.value)}>
          {props.materials.map((material) => <option key={material.id} value={material.id}>{material.name} · {material.category}</option>)}
        </select>
      </label>
      <div className="project-utility-row">
        <button type="button" className="text-button" onClick={props.onLoadSample}><Sparkles size={15} />Load sample design</button>
        <button type="button" className="text-button danger-text" onClick={props.onReset}><RefreshCcw size={15} />Reset local project</button>
      </div>
    </section>
  )
}
