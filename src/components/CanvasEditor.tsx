import { useEffect, useReducer, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Material } from '../data/materials.generated'
import type { RenderMode, Tool } from '../types'
import { floodFill, linePoints, paintPoints, rectanglePoints } from '../lib/grid'
import type { Point } from '../lib/grid'

const textureCache = new Map<string, HTMLImageElement>()

interface ActiveGesture {
  start: Point
  last: Point
  base: string[]
  working: string[]
}

interface CanvasEditorProps {
  cells: string[]
  width: number
  height: number
  background: string
  selectedMaterial: string
  materials: ReadonlyMap<string, Material>
  tool: Tool
  zoom: number
  gridVisible: boolean
  renderMode: RenderMode
  fitSignal: number
  onZoomChange: (zoom: number) => void
  onCommit: (cells: string[]) => void
  onSelectMaterial: (id: string) => void
}

export function CanvasEditor(props: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<ActiveGesture | null>(null)
  const [workingCells, setWorkingCells] = useState<string[] | null>(null)
  const [hover, setHover] = useState<Point | null>(null)
  const [textureVersion, bumpTextures] = useReducer((value: number) => value + 1, 0)
  const displayCells = workingCells ?? props.cells

  useEffect(() => {
    if (props.renderMode !== 'texture') return
    let cancelled = false
    for (const id of new Set(displayCells)) {
      if (textureCache.has(id)) continue
      const material = props.materials.get(id)
      if (!material) continue
      const image = new Image()
      textureCache.set(id, image)
      image.onload = () => { if (!cancelled) bumpTextures() }
      image.onerror = () => { textureCache.delete(id) }
      image.src = material.swatchUrl
    }
    return () => { cancelled = true }
  }, [displayCells, props.materials, props.renderMode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = props.width * props.zoom
    canvas.height = props.height * props.zoom
    const context = canvas.getContext('2d')
    if (!context) return
    context.imageSmoothingEnabled = false
    for (let y = 0; y < props.height; y += 1) {
      for (let x = 0; x < props.width; x += 1) {
        const id = displayCells[y * props.width + x]
        const material = props.materials.get(id)
        context.fillStyle = material?.colorHex ?? '#ff00ff'
        context.fillRect(x * props.zoom, y * props.zoom, props.zoom, props.zoom)
        if (props.renderMode === 'texture') {
          const image = textureCache.get(id)
          if (image?.complete && image.naturalWidth) {
            context.drawImage(image, x * props.zoom, y * props.zoom, props.zoom, props.zoom)
          }
        }
      }
    }
    if (props.gridVisible && props.zoom >= 7) {
      context.beginPath()
      context.strokeStyle = 'rgba(7, 12, 14, 0.58)'
      context.lineWidth = 1
      for (let x = 0; x <= props.width; x += 1) {
        const position = x * props.zoom + 0.5
        context.moveTo(position, 0)
        context.lineTo(position, canvas.height)
      }
      for (let y = 0; y <= props.height; y += 1) {
        const position = y * props.zoom + 0.5
        context.moveTo(0, position)
        context.lineTo(canvas.width, position)
      }
      context.stroke()
    }
  }, [displayCells, props.gridVisible, props.height, props.materials, props.renderMode, props.width, props.zoom, textureVersion])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const availableWidth = Math.max(120, viewport.clientWidth - 36)
    const availableHeight = Math.max(120, viewport.clientHeight - 36)
    const fitted = Math.floor(Math.min(availableWidth / props.width, availableHeight / props.height))
    props.onZoomChange(Math.max(4, Math.min(32, fitted)))
  // fitSignal deliberately triggers a fresh measurement.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fitSignal, props.width, props.height])

  useEffect(() => {
    gestureRef.current = null
    setWorkingCells(null)
  }, [props.width, props.height])

  const eventPoint = (event: ReactPointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((event.clientX - rect.left) * canvas.width / rect.width / props.zoom)
    const y = Math.floor((event.clientY - rect.top) * canvas.height / rect.height / props.zoom)
    if (x < 0 || y < 0 || x >= props.width || y >= props.height) return null
    return { x, y }
  }

  const brushMaterial = props.tool === 'eraser' ? props.background : props.selectedMaterial

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return
    const point = eventPoint(event)
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setHover(point)
    if (props.tool === 'eyedropper') {
      props.onSelectMaterial(props.cells[point.y * props.width + point.x])
      return
    }
    if (props.tool === 'fill') {
      props.onCommit(floodFill(props.cells, props.width, props.height, point, brushMaterial))
      return
    }
    const points = props.tool === 'rectangle' ? rectanglePoints(point, point) : [point]
    const working = paintPoints(props.cells, points, props.width, props.height, brushMaterial)
    gestureRef.current = { start: point, last: point, base: props.cells, working }
    setWorkingCells(working)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = eventPoint(event)
    setHover(point)
    const active = gestureRef.current
    if (!point || !active || (point.x === active.last.x && point.y === active.last.y)) return
    let points: Point[]
    let source: string[]
    if (props.tool === 'line') {
      points = linePoints(active.start, point)
      source = active.base
    } else if (props.tool === 'rectangle') {
      points = rectanglePoints(active.start, point)
      source = active.base
    } else {
      points = linePoints(active.last, point)
      source = active.working
    }
    const working = paintPoints(source, points, props.width, props.height, brushMaterial)
    gestureRef.current = { ...active, last: point, working }
    setWorkingCells(working)
  }

  const finishGesture = () => {
    const active = gestureRef.current
    if (!active) return
    gestureRef.current = null
    setWorkingCells(null)
    props.onCommit(active.working)
  }

  const hoverMaterial = hover ? props.materials.get(displayCells[hover.y * props.width + hover.x]) : null

  return (
    <div className="canvas-viewport" ref={viewportRef}>
      <div className="canvas-stage">
        <canvas
          ref={canvasRef}
          className={`portrait-canvas tool-${props.tool}`}
          aria-label={`${props.width} by ${props.height} floor portrait canvas`}
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishGesture}
          onPointerCancel={finishGesture}
          onPointerLeave={() => setHover(null)}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
      <div className="canvas-status" aria-live="polite">
        {hover && hoverMaterial
          ? <><strong>x {hover.x} · y {hover.y}</strong><span>{hoverMaterial.name}</span></>
          : <><strong>{props.width} × {props.height}</strong><span>{props.cells.length.toLocaleString()} constructed floor tiles</span></>}
      </div>
    </div>
  )
}
