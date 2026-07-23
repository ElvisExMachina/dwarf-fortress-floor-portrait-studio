import {
  Eraser, Grid3X3, Maximize2, PaintBucket, Pencil, Pipette, Redo2,
  Slash, Square, Trash2, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react'
import type { RenderMode, Tool } from '../types'

const toolOptions: Array<{ tool: Tool; label: string; icon: typeof Pencil; shortcut: string }> = [
  { tool: 'pencil', label: 'Pencil', icon: Pencil, shortcut: 'P' },
  { tool: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'E' },
  { tool: 'fill', label: 'Flood fill', icon: PaintBucket, shortcut: 'F' },
  { tool: 'eyedropper', label: 'Eyedropper', icon: Pipette, shortcut: 'I' },
  { tool: 'line', label: 'Line', icon: Slash, shortcut: 'L' },
  { tool: 'rectangle', label: 'Rectangle outline', icon: Square, shortcut: 'R' },
]

interface EditorToolbarProps {
  tool: Tool
  onToolChange: (tool: Tool) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onFit: () => void
  gridVisible: boolean
  onGridChange: (visible: boolean) => void
  renderMode: RenderMode
  onRenderModeChange: (mode: RenderMode) => void
}

export function EditorToolbar(props: EditorToolbarProps) {
  return (
    <div className="editor-toolbar" aria-label="Canvas controls">
      <div className="tool-cluster" role="toolbar" aria-label="Drawing tools">
        {toolOptions.map(({ tool, label, icon: Icon, shortcut }) => (
          <button
            className={`icon-button ${props.tool === tool ? 'is-active' : ''}`}
            key={tool}
            type="button"
            aria-label={`${label} (${shortcut})`}
            aria-pressed={props.tool === tool}
            title={`${label} · ${shortcut}`}
            onClick={() => props.onToolChange(tool)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <span className="toolbar-divider" aria-hidden="true" />
      <div className="tool-cluster compact" role="toolbar" aria-label="History">
        <button className="icon-button square" type="button" onClick={props.onUndo} disabled={!props.canUndo} aria-label="Undo" title="Undo · ⌘/Ctrl Z"><Undo2 size={18} /></button>
        <button className="icon-button square" type="button" onClick={props.onRedo} disabled={!props.canRedo} aria-label="Redo" title="Redo · ⇧⌘/Ctrl Z"><Redo2 size={18} /></button>
        <button className="icon-button square danger" type="button" onClick={props.onClear} aria-label="Clear canvas" title="Clear canvas"><Trash2 size={18} /></button>
      </div>
      <span className="toolbar-spacer" />
      <div className="segmented" aria-label="Render mode">
        {(['color', 'texture'] as RenderMode[]).map((mode) => (
          <button key={mode} type="button" className={props.renderMode === mode ? 'is-active' : ''} onClick={() => props.onRenderModeChange(mode)}>
            {mode === 'color' ? 'Color' : 'Texture'}
          </button>
        ))}
      </div>
      <div className="tool-cluster compact" role="toolbar" aria-label="Canvas view">
        <button className={`icon-button square ${props.gridVisible ? 'is-active' : ''}`} type="button" onClick={() => props.onGridChange(!props.gridVisible)} aria-label="Toggle grid" aria-pressed={props.gridVisible}><Grid3X3 size={18} /></button>
        <button className="icon-button square" type="button" onClick={() => props.onZoomChange(Math.max(4, props.zoom - 2))} aria-label="Zoom out"><ZoomOut size={18} /></button>
        <span className="zoom-readout">{props.zoom}px</span>
        <button className="icon-button square" type="button" onClick={() => props.onZoomChange(Math.min(40, props.zoom + 2))} aria-label="Zoom in"><ZoomIn size={18} /></button>
        <button className="icon-button square" type="button" onClick={props.onFit} aria-label="Fit to view"><Maximize2 size={18} /></button>
      </div>
    </div>
  )
}
