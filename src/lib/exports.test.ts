import { describe, expect, it } from 'vitest'
import qaGoldRune from '../../qa/qa-gold-rune.json'
import { MATERIALS, type Material } from '../data/materials.generated'
import { expandRuns, validateDesignJson } from './runs'
import {
  buildPlanText,
  buildRunsCsv,
  compactProjectJson,
  materialTotals,
  orderedTilesCsv,
  quickfortBlueprintCsv,
} from './exports'

const material = (id: string, name: string, colorHex: string, category: Material['category'] = 'Stone'): Material => ({
  id, name, colorHex, category, swatchUrl: `/materials/${id}.png`,
  width: 48, height: 48, textureSha256: '0'.repeat(64),
})
const materials = new Map([
  ['a', material('a', 'Stone, "Alpha"', '#111111')],
  ['b', material('b', 'Beta', '#222222')],
])
const cells = ['a', 'a', 'b', 'b', 'a', 'a']

describe('project exports', () => {
  it('writes ordered row-major CSV with 1-based human fields, zero-based coordinates, and escaping', () => {
    const csv = orderedTilesCsv(cells, 3, 2, materials)
    const rows = csv.trimEnd().split('\n')
    expect(rows).toHaveLength(7)
    expect(rows[0]).toBe('order,row,column,x,y,material_id,material_name,category,color_hex')
    expect(rows[1]).toBe('1,1,1,0,0,a,"Stone, ""Alpha""",Stone,#111111')
    expect(rows[3]).toBe('3,1,3,2,0,b,Beta,Stone,#222222')
    expect(rows[6]).toBe('6,2,3,2,1,a,"Stone, ""Alpha""",Stone,#111111')
  })

  it('writes compact build-run CSV using 1-based row and columns', () => {
    expect(buildRunsCsv(cells, 3, 2, materials).trimEnd().split('\n')).toEqual([
      'row,start_column,end_column,length,material_id,material_name,color_hex',
      '1,1,2,2,a,"Stone, ""Alpha""",#111111',
      '1,3,3,1,b,Beta,#222222',
      '2,1,1,1,b,Beta,#222222',
      '2,2,3,2,a,"Stone, ""Alpha""",#111111',
    ])
  })

  it('writes instruction-first aligned Quickfort floor blueprints per material', () => {
    expect(quickfortBlueprintCsv(cells, 3, 2, materials).trimEnd().split('\n')).toEqual([
      '#notes label(README) MATERIAL FILTER SETUP REQUIRED - this section builds nothing',
      'STOP: Quickfort CSV cells cannot encode floor materials.',
      "Before each filterNN section set buildingplan's floor filter to the exact material named in that section.",
      'Keep the cursor on the same portrait upper-left tile before applying every section.',
      'For Metal floors run buildingplan set bars true once; bars are disabled by default.',
      'Never apply a material section while the floor filter is [any material].',
      '"#build label(filter01_a_then_apply) start(1;1;portrait upper-left) 4 x Stone, ""Alpha"" [a; Stone; #111111] floors; DO NOT APPLY until buildingplan floor filter is Stone, ""Alpha"""',
      'Cf(2x1),,',
      ',Cf(2x1),',
      '#build label(filter02_b_then_apply) start(1;1;portrait upper-left) 2 x Beta [b; Stone; #222222] floors; DO NOT APPLY until buildingplan floor filter is Beta',
      ',,Cf',
      'Cf,,',
    ])
  })

  it('warns that metal Quickfort sections require buildingplan bars', () => {
    const metal = material('gold', 'Gold', '#897152', 'Metal')
    const csv = quickfortBlueprintCsv(['gold'], 1, 1, new Map([['gold', metal]]))
    expect(csv).toContain('label(filter01_gold_then_apply)')
    expect(csv).toContain('DO NOT APPLY until buildingplan floor filter is Gold; run buildingplan set bars true first')
  })

  it('maps the 8x8 QA rune to three complete Quickfort material sections', () => {
    const catalog = new Map(MATERIALS.map((entry) => [entry.id, entry]))
    const validation = validateDesignJson(qaGoldRune, new Set(catalog.keys()))
    expect(validation.ok).toBe(true)

    const lines = quickfortBlueprintCsv(validation.cells!, 8, 8, catalog).trimEnd().split('\n')
    expect(lines).toHaveLength(33)
    const sectionCounts: number[] = []
    for (const line of lines.slice(6)) {
      if (line.startsWith('#build')) {
        sectionCounts.push(0)
        continue
      }
      for (const cell of line.split(',')) {
        const expansion = /^Cf\((\d+)x1\)$/.exec(cell)
        sectionCounts[sectionCounts.length - 1] += expansion ? Number(expansion[1]) : cell === 'Cf' ? 1 : 0
      }
    }
    expect(lines.filter((line) => line.startsWith('#build'))).toEqual([
      expect.stringContaining('label(filter01_obsidian_then_apply)'),
      expect.stringContaining('label(filter02_native_gold_then_apply)'),
      expect.stringContaining('label(filter03_malachite_then_apply)'),
    ])
    expect(sectionCounts).toEqual([46, 16, 2])
  })

  it('compresses a 100x100 single-material portrait into 100 Quickfort floor runs', () => {
    const maxCells = Array<string>(10_000).fill('a')
    const lines = quickfortBlueprintCsv(maxCells, 100, 100, materials).trimEnd().split('\n')
    expect(lines).toHaveLength(107)
    expect(lines[6]).toContain('10000 x Stone, ""Alpha""')
    expect(lines.slice(7)).toHaveLength(100)
    expect(lines.slice(7).every((line) => line.startsWith('Cf(100x1),'))).toBe(true)
  })

  it('writes a compact JSON design that round-trips exactly', () => {
    const json = compactProjectJson('Forge mark', 3, 2, 'a', cells)
    const design = JSON.parse(json)
    expect(design.runs).toEqual([
      { y: 0, x: 2, length: 1, material: 'b' },
      { y: 1, x: 0, length: 1, material: 'b' },
    ])
    expect(expandRuns(design)).toEqual(cells)
  })

  it('summarizes material totals and row runs as construction-ready text', () => {
    expect(materialTotals(cells, materials).map(({ material: entry, count }) => [entry.id, count])).toEqual([['a', 4], ['b', 2]])
    const text = buildPlanText('Forge mark', cells, 3, 2, materials)
    expect(text).toContain('3 × 2 floor tiles · 6 total')
    expect(text).toContain('Row 1')
    expect(text).toContain('Col 1–2: Stone, "Alpha" × 2 [a]')
  })

  it('refuses dimension mismatches and unknown project materials', () => {
    expect(() => orderedTilesCsv(cells, 2, 2, materials)).toThrow(/Cell count/)
    expect(() => buildRunsCsv(['missing'], 1, 1, materials)).toThrow(/Unknown material/)
    expect(() => quickfortBlueprintCsv(cells, 2, 2, materials)).toThrow(/Cell count/)
    expect(() => quickfortBlueprintCsv(['missing'], 1, 1, materials)).toThrow(/Unknown material/)
  })
})
