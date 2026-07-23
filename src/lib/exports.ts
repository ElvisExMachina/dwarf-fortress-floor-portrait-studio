import type { Material } from '../data/materials.generated'
import type { CompactDesign } from '../types'
import { gridIndex } from './grid'
import { compactRuns, projectToCompactDesign, validateDesignJson } from './runs'

export type MaterialLookup = ReadonlyMap<string, Material>

const csvCell = (value: string | number): string => {
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const csvRow = (values: Array<string | number>): string => values.map(csvCell).join(',')

const requireMaterial = (materials: MaterialLookup, id: string): Material => {
  const material = materials.get(id)
  if (!material) throw new Error(`Unknown material ID in project: ${id}`)
  return material
}

export function orderedTilesCsv(
  cells: string[], width: number, height: number, materials: MaterialLookup,
): string {
  if (cells.length !== width * height) throw new Error('Cell count does not match project dimensions.')
  const rows = [csvRow(['order', 'row', 'column', 'x', 'y', 'material_id', 'material_name', 'category', 'color_hex'])]
  let order = 1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const material = requireMaterial(materials, cells[gridIndex(x, y, width)])
      rows.push(csvRow([order, y + 1, x + 1, x, y, material.id, material.name, material.category, material.colorHex]))
      order += 1
    }
  }
  return `${rows.join('\n')}\n`
}

export function buildRunsCsv(
  cells: string[], width: number, height: number, materials: MaterialLookup,
): string {
  if (cells.length !== width * height) throw new Error('Cell count does not match project dimensions.')
  const rows = [csvRow(['row', 'start_column', 'end_column', 'length', 'material_id', 'material_name', 'color_hex'])]
  for (const run of compactRuns(cells, width, height)) {
    const material = requireMaterial(materials, run.material)
    rows.push(csvRow([
      run.y + 1, run.x + 1, run.x + run.length, run.length,
      material.id, material.name, material.colorHex,
    ]))
  }
  return `${rows.join('\n')}\n`
}

export interface MaterialTotal {
  material: Material
  count: number
}

export function materialTotals(cells: string[], materials: MaterialLookup): MaterialTotal[] {
  const counts = new Map<string, number>()
  for (const id of cells) counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts.entries()]
    .map(([id, count]) => ({ material: requireMaterial(materials, id), count }))
    .sort((a, b) => b.count - a.count || a.material.name.localeCompare(b.material.name))
}

const quickfortLabelId = (id: string): string => {
  const normalized = id.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return normalized || 'material'
}

const QUICKFORT_MATERIAL_NOTES = [
  '#notes label(README) MATERIAL FILTER SETUP REQUIRED - this section builds nothing',
  'STOP: Quickfort CSV cells cannot encode floor materials.',
  "Before each filterNN section set buildingplan's floor filter to the exact material named in that section.",
  'Keep the cursor on the same portrait upper-left tile before applying every section.',
  'For Metal floors run buildingplan set bars true once; bars are disabled by default.',
  'Never apply a material section while the floor filter is [any material].',
]

/**
 * Generates an instruction-first Quickfort CSV with one floor blueprint per material.
 * Quickfort's Cf token encodes the floor construction, while the active
 * buildingplan floor filter supplies the material when each section is applied.
 * The first #notes section is deliberately non-building so opening or applying
 * the default blueprint cannot silently use the wrong material filter.
 */
export function quickfortBlueprintCsv(
  cells: string[], width: number, height: number, materials: MaterialLookup,
): string {
  if (cells.length !== width * height) throw new Error('Cell count does not match project dimensions.')

  const totals = materialTotals(cells, materials)
  const labelDigits = Math.max(2, String(totals.length).length)
  const lines = QUICKFORT_MATERIAL_NOTES.map((line) => csvRow([line]))

  totals.forEach(({ material, count }, materialIndex) => {
    const sequence = String(materialIndex + 1).padStart(labelDigits, '0')
    const label = `filter${sequence}_${quickfortLabelId(material.id)}_then_apply`
    const metalSetup = material.category === 'Metal' ? '; run buildingplan set bars true first' : ''
    lines.push(csvRow([
      `#build label(${label}) start(1;1;portrait upper-left) ${count} x ${material.name} `
      + `[${material.id}; ${material.category}; ${material.colorHex}] floors; `
      + `DO NOT APPLY until buildingplan floor filter is ${material.name}${metalSetup}`,
    ]))

    for (let y = 0; y < height; y += 1) {
      const row = Array<string>(width).fill('')
      let x = 0
      while (x < width) {
        if (cells[gridIndex(x, y, width)] !== material.id) {
          x += 1
          continue
        }
        const start = x
        while (x < width && cells[gridIndex(x, y, width)] === material.id) x += 1
        const length = x - start
        row[start] = length === 1 ? 'Cf' : `Cf(${length}x1)`
      }
      lines.push(csvRow(row))
    }
  })

  return `${lines.join('\n')}\n`
}

export function buildPlanText(
  name: string, cells: string[], width: number, height: number, materials: MaterialLookup,
): string {
  if (cells.length !== width * height) throw new Error('Cell count does not match project dimensions.')
  const lines = [
    name,
    `${width} × ${height} floor tiles · ${cells.length} total`,
    '',
    'MATERIAL TOTALS',
    ...materialTotals(cells, materials).map(({ material, count }) => `${String(count).padStart(5)} × ${material.name} [${material.id}]`),
    '',
    'ROW-BY-ROW BUILD RUNS',
  ]
  let currentRow = -1
  for (const run of compactRuns(cells, width, height)) {
    if (run.y !== currentRow) {
      currentRow = run.y
      lines.push('', `Row ${run.y + 1}`)
    }
    const material = requireMaterial(materials, run.material)
    const end = run.x + run.length
    lines.push(`  Col ${run.x + 1}–${end}: ${material.name} × ${run.length} [${material.id}]`)
  }
  return `${lines.join('\n')}\n`
}

export function compactProjectJson(
  name: string, width: number, height: number, background: string, cells: string[],
): string {
  return `${JSON.stringify(projectToCompactDesign(name, width, height, background, cells), null, 2)}\n`
}

export function parseCompactProjectJson(json: string, materialIds: ReadonlySet<string>): CompactDesign {
  const result = validateDesignJson(json, materialIds)
  if (!result.ok || !result.design) {
    throw new Error(`Invalid project JSON: ${result.errors.join(' ')}`)
  }
  return result.design
}
