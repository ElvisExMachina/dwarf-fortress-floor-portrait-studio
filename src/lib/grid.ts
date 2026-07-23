export interface Point { x: number; y: number }

export const gridIndex = (x: number, y: number, width: number) => y * width + x

export const createGrid = (width: number, height: number, material: string): string[] =>
  Array.from({ length: width * height }, () => material)

export function resizeGrid(
  cells: string[], oldWidth: number, oldHeight: number,
  width: number, height: number, fill: string,
): string[] {
  const next = createGrid(width, height, fill)
  for (let y = 0; y < Math.min(oldHeight, height); y += 1) {
    for (let x = 0; x < Math.min(oldWidth, width); x += 1) {
      next[gridIndex(x, y, width)] = cells[gridIndex(x, y, oldWidth)]
    }
  }
  return next
}

export function paintPoints(cells: string[], points: Point[], width: number, height: number, material: string): string[] {
  const next = cells.slice()
  for (const { x, y } of points) {
    if (x >= 0 && y >= 0 && x < width && y < height) next[gridIndex(x, y, width)] = material
  }
  return next
}

export function floodFill(cells: string[], width: number, height: number, start: Point, replacement: string): string[] {
  if (start.x < 0 || start.y < 0 || start.x >= width || start.y >= height) return cells
  const target = cells[gridIndex(start.x, start.y, width)]
  if (target === replacement) return cells
  const next = cells.slice()
  const queue: Point[] = [start]
  let cursor = 0
  next[gridIndex(start.x, start.y, width)] = replacement
  while (cursor < queue.length) {
    const point = queue[cursor++]
    const neighbors = [
      { x: point.x - 1, y: point.y }, { x: point.x + 1, y: point.y },
      { x: point.x, y: point.y - 1 }, { x: point.x, y: point.y + 1 },
    ]
    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= width || neighbor.y >= height) continue
      const index = gridIndex(neighbor.x, neighbor.y, width)
      if (next[index] === target) {
        next[index] = replacement
        queue.push(neighbor)
      }
    }
  }
  return next
}

export function linePoints(start: Point, end: Point): Point[] {
  let x0 = start.x; let y0 = start.y
  const x1 = end.x; const y1 = end.y
  const dx = Math.abs(x1 - x0); const sx = x0 < x1 ? 1 : -1
  const dy = -Math.abs(y1 - y0); const sy = y0 < y1 ? 1 : -1
  let error = dx + dy
  const points: Point[] = []
  for (;;) {
    points.push({ x: x0, y: y0 })
    if (x0 === x1 && y0 === y1) break
    const twice = 2 * error
    if (twice >= dy) { error += dy; x0 += sx }
    if (twice <= dx) { error += dx; y0 += sy }
  }
  return points
}

export function rectanglePoints(start: Point, end: Point, filled = false): Point[] {
  const left = Math.min(start.x, end.x); const right = Math.max(start.x, end.x)
  const top = Math.min(start.y, end.y); const bottom = Math.max(start.y, end.y)
  const points: Point[] = []
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      if (filled || x === left || x === right || y === top || y === bottom) points.push({ x, y })
    }
  }
  return points
}
