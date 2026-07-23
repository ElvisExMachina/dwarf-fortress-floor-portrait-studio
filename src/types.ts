import type { Material } from './data/materials.generated'

export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'line' | 'rectangle'
export type RenderMode = 'color' | 'texture'

export interface CompactRun {
  y: number
  x: number
  length: number
  material: string
}

export interface CompactDesign {
  version: 1
  name: string
  width: number
  height: number
  background: string
  runs: CompactRun[]
}

export interface ProjectState {
  version: 1
  name: string
  width: number
  height: number
  background: string
  cells: string[]
  renderMode: RenderMode
  gridVisible: boolean
  zoom: number
  selectedMaterial: string
}

export type QuantizeMaterial = Pick<Material, 'id' | 'colorHex'>
