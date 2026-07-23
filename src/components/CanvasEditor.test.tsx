import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Material } from '../data/materials.generated'
import type { RenderMode, Tool } from '../types'
import { CanvasEditor } from './CanvasEditor'

const material = (id: string, colorHex: string): Material => ({
  id,
  name: id,
  category: 'Stone',
  colorHex,
  swatchUrl: `/materials/${id}.png`,
  width: 48,
  height: 48,
  textureSha256: '0'.repeat(64),
})

const materials = new Map([
  ['obsidian', material('obsidian', '#22252a')],
  ['gold', material('gold', '#b38a4c')],
])

const fakeContext = {
  imageSmoothingEnabled: false,
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
}

interface RenderEditorOptions {
  tool: Tool
  cells?: string[]
  onCommit?: (cells: string[]) => void
  onSelectMaterial?: (id: string) => void
  renderMode?: RenderMode
}

function renderEditor({
  tool,
  cells = ['obsidian', 'obsidian', 'obsidian', 'obsidian'],
  onCommit = vi.fn(),
  onSelectMaterial = vi.fn(),
  renderMode = 'color',
}: RenderEditorOptions) {
  render(
    <CanvasEditor
      cells={cells}
      width={2}
      height={2}
      background="obsidian"
      selectedMaterial="gold"
      materials={materials}
      tool={tool}
      zoom={16}
      gridVisible
      renderMode={renderMode}
      fitSignal={0}
      onZoomChange={vi.fn()}
      onCommit={onCommit}
      onSelectMaterial={onSelectMaterial}
    />,
  )
  const canvas = screen.getByLabelText('2 by 2 floor portrait canvas') as HTMLCanvasElement
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, right: 32, bottom: 32, width: 32, height: 32,
    toJSON: () => ({}),
  })
  return canvas
}

describe('CanvasEditor pointer tools', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => fakeContext),
    })
    Object.defineProperty(HTMLCanvasElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => vi.restoreAllMocks())

  it('commits a pencil stroke to the addressed cell', () => {
    const onCommit = vi.fn()
    const canvas = renderEditor({ tool: 'pencil', onCommit })
    fireEvent.pointerDown(canvas, { button: 0, pointerId: 1, clientX: 8, clientY: 8 })
    fireEvent.pointerUp(canvas, { button: 0, pointerId: 1, clientX: 8, clientY: 8 })
    expect(onCommit).toHaveBeenCalledWith(['gold', 'obsidian', 'obsidian', 'obsidian'])
  })

  it('flood-fills the connected material region', () => {
    const onCommit = vi.fn()
    const canvas = renderEditor({ tool: 'fill', onCommit })
    fireEvent.pointerDown(canvas, { button: 0, pointerId: 2, clientX: 24, clientY: 24 })
    expect(onCommit).toHaveBeenCalledWith(['gold', 'gold', 'gold', 'gold'])
  })

  it('eyedrops the material under the pointer without changing cells', () => {
    const onCommit = vi.fn()
    const onSelectMaterial = vi.fn()
    const canvas = renderEditor({
      tool: 'eyedropper',
      cells: ['gold', 'obsidian', 'obsidian', 'obsidian'],
      onCommit,
      onSelectMaterial,
    })
    fireEvent.pointerDown(canvas, { button: 0, pointerId: 3, clientX: 8, clientY: 8 })
    expect(onSelectMaterial).toHaveBeenCalledWith('gold')
    expect(onCommit).not.toHaveBeenCalled()
  })
})
