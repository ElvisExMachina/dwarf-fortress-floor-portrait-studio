import { useRef, useState } from 'react'
import { ImagePlus, LoaderCircle } from 'lucide-react'
import type { Material } from '../data/materials.generated'
import { imageFileToContainedRgba } from '../lib/render'
import { quantizeRgba } from '../lib/quantize'

interface ImageImportProps {
  width: number
  height: number
  background: Material
  allMaterials: Material[]
  visibleMaterials: Material[]
  onImport: (cells: string[]) => void
}

export function ImageImport(props: ImageImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dither, setDither] = useState(false)
  const [visibleOnly, setVisibleOnly] = useState(false)
  const [status, setStatus] = useState('Images are contained without cropping, then matched to material colors.')
  const [busy, setBusy] = useState(false)

  const importFile = async (file: File) => {
    setBusy(true)
    setStatus(`Reading ${file.name}…`)
    try {
      const candidates = visibleOnly && props.visibleMaterials.length ? props.visibleMaterials : props.allMaterials
      const rgba = await imageFileToContainedRgba(file, props.width, props.height, props.background.colorHex)
      const cells = quantizeRgba(rgba, props.width, props.height, candidates, dither)
      props.onImport(cells)
      setStatus(`Imported ${file.name} with ${candidates.length} available materials${dither ? ' and dithering' : ''}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image import failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="panel control-panel">
      <div className="panel-heading compact-heading"><div><span className="eyebrow">Color reduction</span><h2>Import image</h2></div></div>
      <p className="helper-copy">Contain an image inside {props.width}×{props.height}, then quantize every pixel to a buildable DF floor material.</p>
      <div className="check-stack">
        <label><input type="checkbox" checked={dither} onChange={(event) => setDither(event.target.checked)} />Floyd–Steinberg dithering</label>
        <label><input type="checkbox" checked={visibleOnly} onChange={(event) => setVisibleOnly(event.target.checked)} />Use only the palette’s current search/filter ({props.visibleMaterials.length || props.allMaterials.length})</label>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file) }}
      />
      <button className="primary-button full-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <LoaderCircle className="spin" size={17} /> : <ImagePlus size={17} />}{busy ? 'Quantizing…' : 'Choose image'}
      </button>
      <p className="status-copy" aria-live="polite">{status}</p>
    </section>
  )
}
