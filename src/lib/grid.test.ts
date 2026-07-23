import { describe, expect, it } from 'vitest'
import { createGrid, floodFill, linePoints, paintPoints, rectanglePoints, resizeGrid } from './grid'

describe('grid primitives', () => {
  it('creates and resizes grids while preserving the top-left overlap', () => {
    const cells = ['a', 'b', 'c', 'd']
    expect(createGrid(100, 100, 'stone')).toHaveLength(10_000)
    expect(resizeGrid(cells, 2, 2, 3, 3, 'x')).toEqual([
      'a', 'b', 'x',
      'c', 'd', 'x',
      'x', 'x', 'x',
    ])
    expect(resizeGrid(cells, 2, 2, 1, 2, 'x')).toEqual(['a', 'c'])
  })

  it('flood fills only the connected four-way region without mutating input', () => {
    const cells = [
      'a', 'a', 'b',
      'a', 'b', 'b',
      'c', 'a', 'b',
    ]
    const next = floodFill(cells, 3, 3, { x: 0, y: 0 }, 'z')
    expect(next).toEqual(['z', 'z', 'b', 'z', 'b', 'b', 'c', 'a', 'b'])
    expect(cells[0]).toBe('a')
    expect(floodFill(cells, 3, 3, { x: -1, y: 0 }, 'z')).toBe(cells)
    expect(floodFill(cells, 3, 3, { x: 0, y: 0 }, 'a')).toBe(cells)
  })

  it('rasterizes inclusive lines in either direction', () => {
    expect(linePoints({ x: 0, y: 0 }, { x: 3, y: 2 })).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 2 },
    ])
    expect(linePoints({ x: 2, y: 2 }, { x: 2, y: 0 })).toEqual([
      { x: 2, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 0 },
    ])
  })

  it('rasterizes rectangle outlines and filled rectangles without duplicate points', () => {
    const outline = rectanglePoints({ x: 3, y: 2 }, { x: 1, y: 0 })
    expect(outline).toHaveLength(8)
    expect(new Set(outline.map(({ x, y }) => `${x},${y}`))).toHaveLength(8)
    expect(rectanglePoints({ x: 0, y: 0 }, { x: 1, y: 1 }, true)).toHaveLength(4)
    expect(paintPoints(['a', 'a'], [{ x: 99, y: 99 }], 2, 1, 'b')).toEqual(['a', 'a'])
  })
})
