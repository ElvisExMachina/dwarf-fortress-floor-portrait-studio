import type { CompactDesign, CompactRun } from '../types'
import { createGrid, gridIndex } from './grid'

export interface ValidationResult {
  ok: boolean
  errors: string[]
  design?: CompactDesign
  cells?: string[]
}

export function compactRuns(cells: string[], width: number, height: number, omitMaterial?: string): CompactRun[] {
  const runs: CompactRun[] = []
  for (let y = 0; y < height; y += 1) {
    let x = 0
    while (x < width) {
      const material = cells[gridIndex(x, y, width)]
      const start = x
      while (x + 1 < width && cells[gridIndex(x + 1, y, width)] === material) x += 1
      if (material !== omitMaterial) runs.push({ y, x: start, length: x - start + 1, material })
      x += 1
    }
  }
  return runs
}

export function expandRuns(design: CompactDesign): string[] {
  const cells = createGrid(design.width, design.height, design.background)
  for (const run of design.runs) {
    for (let offset = 0; offset < run.length; offset += 1) {
      cells[gridIndex(run.x + offset, run.y, design.width)] = run.material
    }
  }
  return cells
}

export function projectToCompactDesign(
  name: string, width: number, height: number, background: string, cells: string[],
): CompactDesign {
  return { version: 1, name, width, height, background, runs: compactRuns(cells, width, height, background) }
}

const isInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value)

export function validateDesignJson(input: string | unknown, materialIds: ReadonlySet<string>): ValidationResult {
  let raw: unknown = input
  if (typeof input === 'string') {
    try { raw = JSON.parse(input) } catch (error) {
      return { ok: false, errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'parse failed'}`] }
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['Design must be a JSON object.'] }
  const value = raw as Record<string, unknown>
  const errors: string[] = []
  if (value.version !== 1) errors.push('version must be 1.')
  if (typeof value.name !== 'string' || !value.name.trim()) errors.push('name must be a non-empty string.')
  if (!isInteger(value.width) || value.width < 1 || value.width > 100) errors.push('width must be an integer from 1 to 100.')
  if (!isInteger(value.height) || value.height < 1 || value.height > 100) errors.push('height must be an integer from 1 to 100.')
  if (typeof value.background !== 'string' || !materialIds.has(value.background)) errors.push(`background must be a known material ID.`)
  if (!Array.isArray(value.runs)) errors.push('runs must be an array.')
  const width = isInteger(value.width) ? value.width : 0
  const height = isInteger(value.height) ? value.height : 0
  const runs: CompactRun[] = []
  if (Array.isArray(value.runs)) value.runs.forEach((candidate, index) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      errors.push(`runs[${index}] must be an object.`); return
    }
    const run = candidate as Record<string, unknown>
    const validY = isInteger(run.y) && run.y >= 0 && run.y < height
    const validX = isInteger(run.x) && run.x >= 0 && run.x < width
    const validLength = isInteger(run.length) && run.length >= 1
    const validMaterial = typeof run.material === 'string' && materialIds.has(run.material)
    if (!validY) errors.push(`runs[${index}].y is outside the design.`)
    if (!validX) errors.push(`runs[${index}].x is outside the design.`)
    if (!validLength) errors.push(`runs[${index}].length must be a positive integer.`)
    if (!validMaterial) errors.push(`runs[${index}].material must be a known material ID.`)
    if (validX && validLength && (run.x as number) + (run.length as number) > width) errors.push(`runs[${index}] extends past width ${width}.`)
    if (validY && validX && validLength && validMaterial && (run.x as number) + (run.length as number) <= width) {
      runs.push({ y: run.y as number, x: run.x as number, length: run.length as number, material: run.material as string })
    }
  })
  if (errors.length) return { ok: false, errors }
  const design: CompactDesign = {
    version: 1,
    name: (value.name as string).trim(),
    width,
    height,
    background: value.background as string,
    runs,
  }
  return { ok: true, errors: [], design, cells: expandRuns(design) }
}
