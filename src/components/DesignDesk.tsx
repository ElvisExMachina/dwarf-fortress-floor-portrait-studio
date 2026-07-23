import { useEffect, useMemo, useState } from 'react'
import { ClipboardCheck, ClipboardCopy, WandSparkles } from 'lucide-react'
import type { Material } from '../data/materials.generated'
import type { CompactDesign } from '../types'
import { copyText } from '../lib/browser'
import { validateDesignJson } from '../lib/runs'

interface DesignDeskProps {
  width: number
  height: number
  background: string
  materials: Material[]
  onImport: (design: CompactDesign, cells: string[]) => void
}

export function DesignDesk(props: DesignDeskProps) {
  const [idea, setIdea] = useState('A bold dwarven heraldic mark that reads clearly from a distance')
  const [style, setStyle] = useState('Strong silhouette, limited colors, symmetric where practical')
  const [width, setWidth] = useState(props.width)
  const [height, setHeight] = useState(props.height)
  const [background, setBackground] = useState(props.background)
  const [restrictedPalette, setRestrictedPalette] = useState('native-gold, malachite, obsidian')
  const [json, setJson] = useState('')
  const [status, setStatus] = useState('Copy a request into Hermes, then paste its JSON response below.')
  const ids = useMemo(() => new Set(props.materials.map(({ id }) => id)), [props.materials])

  useEffect(() => { setWidth(props.width); setHeight(props.height); setBackground(props.background) }, [props.background, props.height, props.width])

  const request = () => {
    const requestedIds = restrictedPalette.split(',').map((id) => id.trim()).filter((id) => ids.has(id))
    const paletteRule = requestedIds.length
      ? `Use only these material IDs (including the background): ${[...new Set([...requestedIds, background])].join(', ')}.`
      : `Choose only from these available material IDs: ${props.materials.map(({ id }) => id).join(', ')}.`
    return `Design a Dwarf Fortress constructed-floor portrait for the local Floor Portrait Studio.\n\nIDEA\n${idea.trim()}\n\nSPECIFICATION\n- Width: ${width} cells\n- Height: ${height} cells\n- Background material: ${background}\n- Style notes: ${style.trim() || 'None'}\n- One editor cell equals one constructed floor tile.\n- Keep the silhouette readable and practical to build.\n- ${paletteRule}\n\nReturn ONLY valid JSON—no markdown fence or commentary—using exactly this compact schema:\n{\n  "version": 1,\n  "name": "Design name",\n  "width": ${width},\n  "height": ${height},\n  "background": "${background}",\n  "runs": [\n    { "y": 0, "x": 0, "length": ${width}, "material": "${background}" }\n  ]\n}\n\nCoordinates are zero-based. Every run is horizontal. Runs may overlap and later runs win. Material values must be app material IDs. Cells omitted from runs use the background. Keep all y/x/length values in bounds.`
  }

  const copyRequest = async () => {
    try {
      await copyText(request())
      setStatus('Self-contained Hermes request copied.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not copy the request.')
    }
  }

  const importJson = () => {
    const result = validateDesignJson(json, ids)
    if (!result.ok || !result.design || !result.cells) {
      setStatus(result.errors.join(' '))
      return
    }
    props.onImport(result.design, result.cells)
    setStatus(`Imported “${result.design.name}” — ${result.design.width}×${result.design.height}, ${result.design.runs.length} compact runs.`)
  }

  return (
    <section className="panel design-desk">
      <div className="panel-heading">
        <div><span className="eyebrow">Human ↔ Hermes handoff</span><h2>AI Design Desk</h2></div>
        <WandSparkles size={22} className="heading-icon" />
      </div>
      <p className="helper-copy">No hidden API and no key required. This desk packages a precise request for your Hermes chat and validates the returned plan before changing the canvas.</p>
      <label className="field-label">Design idea<textarea rows={3} value={idea} onChange={(event) => setIdea(event.target.value)} /></label>
      <div className="dimension-fields ai-dimensions">
        <label className="field-label">Width<input type="number" min="1" max="100" value={width} onChange={(event) => setWidth(event.target.valueAsNumber)} /></label>
        <span aria-hidden="true">×</span>
        <label className="field-label">Height<input type="number" min="1" max="100" value={height} onChange={(event) => setHeight(event.target.valueAsNumber)} /></label>
      </div>
      <label className="field-label">Style notes<input value={style} onChange={(event) => setStyle(event.target.value)} /></label>
      <label className="field-label">Background<select value={background} onChange={(event) => setBackground(event.target.value)}>{props.materials.map((material) => <option key={material.id} value={material.id}>{material.name} · {material.id}</option>)}</select></label>
      <label className="field-label">Restricted palette IDs <span>(optional, comma-separated)</span><input value={restrictedPalette} onChange={(event) => setRestrictedPalette(event.target.value)} /></label>
      <button className="primary-button full-button" type="button" disabled={!idea.trim() || width < 1 || width > 100 || height < 1 || height > 100} onClick={() => void copyRequest()}><ClipboardCopy size={17} />Copy request for Hermes</button>
      <div className="desk-divider"><span>paste the returned JSON</span></div>
      <label className="field-label">AI design JSON<textarea className="json-input" rows={9} spellCheck={false} value={json} onChange={(event) => setJson(event.target.value)} placeholder={'{\n  "version": 1,\n  "name": "…",\n  "runs": […]\n}'} /></label>
      <button className="secondary-button full-button" type="button" disabled={!json.trim()} onClick={importJson}><ClipboardCheck size={17} />Import AI design</button>
      <p className={`status-copy ${status.includes('must') || status.includes('Invalid') || status.includes('outside') ? 'is-error' : ''}`} aria-live="polite">{status}</p>
    </section>
  )
}
