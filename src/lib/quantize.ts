import type { QuantizeMaterial } from '../types'

export interface Rgb { r: number; g: number; b: number }

export function hexToRgb(hex: string): Rgb {
  const normalized = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(normalized)) throw new Error(`Invalid hex color: ${hex}`)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

const srgbToLinear = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function colorDistance(a: Rgb, b: Rgb): number {
  const dr = srgbToLinear(a.r) - srgbToLinear(b.r)
  const dg = srgbToLinear(a.g) - srgbToLinear(b.g)
  const db = srgbToLinear(a.b) - srgbToLinear(b.b)
  return dr * dr * 0.2126 + dg * dg * 0.7152 + db * db * 0.0722
}

export function nearestMaterial(color: Rgb, materials: readonly QuantizeMaterial[]): QuantizeMaterial {
  if (!materials.length) throw new Error('At least one material is required for quantization.')
  let best = materials[0]
  let bestDistance = colorDistance(color, hexToRgb(best.colorHex))
  for (let i = 1; i < materials.length; i += 1) {
    const distance = colorDistance(color, hexToRgb(materials[i].colorHex))
    if (distance < bestDistance) { best = materials[i]; bestDistance = distance }
  }
  return best
}

export function quantizeRgba(
  rgba: Uint8ClampedArray, width: number, height: number,
  materials: readonly QuantizeMaterial[], dither = false,
): string[] {
  if (rgba.length !== width * height * 4) throw new Error('RGBA buffer size does not match dimensions.')
  const working = new Float32Array(width * height * 3)
  for (let index = 0; index < width * height; index += 1) {
    working[index * 3] = rgba[index * 4]
    working[index * 3 + 1] = rgba[index * 4 + 1]
    working[index * 3 + 2] = rgba[index * 4 + 2]
  }
  const output: string[] = []
  const addError = (x: number, y: number, error: Rgb, weight: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = (y * width + x) * 3
    working[index] += error.r * weight
    working[index + 1] += error.g * weight
    working[index + 2] += error.b * weight
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3
      const color = {
        r: Math.max(0, Math.min(255, working[index])),
        g: Math.max(0, Math.min(255, working[index + 1])),
        b: Math.max(0, Math.min(255, working[index + 2])),
      }
      const match = nearestMaterial(color, materials)
      output.push(match.id)
      if (dither) {
        const matched = hexToRgb(match.colorHex)
        const error = { r: color.r - matched.r, g: color.g - matched.g, b: color.b - matched.b }
        addError(x + 1, y, error, 7 / 16)
        addError(x - 1, y + 1, error, 3 / 16)
        addError(x, y + 1, error, 5 / 16)
        addError(x + 1, y + 1, error, 1 / 16)
      }
    }
  }
  return output
}
