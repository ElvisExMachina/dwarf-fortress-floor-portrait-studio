import { describe, expect, it } from 'vitest'
import { compactRuns, expandRuns, projectToCompactDesign, validateDesignJson } from './runs'

const ids = new Set(['obsidian', 'native-gold', 'malachite'])

describe('compact design runs', () => {
  it('compacts adjacent horizontal cells only and round-trips a grid', () => {
    const cells = ['a', 'a', 'b', 'a', 'b', 'b']
    expect(compactRuns(cells, 3, 2)).toEqual([
      { y: 0, x: 0, length: 2, material: 'a' },
      { y: 0, x: 2, length: 1, material: 'b' },
      { y: 1, x: 0, length: 1, material: 'a' },
      { y: 1, x: 1, length: 2, material: 'b' },
    ])
    const design = projectToCompactDesign('Test', 3, 2, 'a', cells)
    expect(design.runs).toEqual([
      { y: 0, x: 2, length: 1, material: 'b' },
      { y: 1, x: 1, length: 2, material: 'b' },
    ])
    expect(expandRuns(design)).toEqual(cells)
  })

  it('accepts overlapping zero-based runs with later runs winning', () => {
    const result = validateDesignJson({
      version: 1, name: 'Overlap', width: 4, height: 2, background: 'obsidian',
      runs: [
        { y: 0, x: 0, length: 4, material: 'native-gold' },
        { y: 0, x: 1, length: 2, material: 'malachite' },
      ],
    }, ids)
    expect(result.ok).toBe(true)
    expect(result.cells).toEqual(['native-gold', 'malachite', 'malachite', 'native-gold', ...Array(4).fill('obsidian')])
  })

  it('rejects invalid JSON, dimensions, unknown materials, and out-of-bounds runs', () => {
    expect(validateDesignJson('{ nope', ids).errors[0]).toMatch(/Invalid JSON/)
    expect(validateDesignJson({ version: 1, name: 'Too wide', width: 101, height: 2, background: 'obsidian', runs: [] }, ids).errors.join(' '))
      .toMatch(/width must be an integer from 1 to 100/)
    const result = validateDesignJson({
      version: 1, name: 'Bad', width: 2, height: 2, background: 'unknown',
      runs: [
        { y: 0, x: 0, length: 1, material: 'unknown' },
        { y: 0, x: 1, length: 4, material: 'native-gold' },
      ],
    }, ids)
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/background must be a known material ID/)
    expect(result.errors.join(' ')).toMatch(/known material ID/)
    expect(result.errors.join(' ')).toMatch(/extends past width/)
    expect(result.cells).toBeUndefined()
  })
})
