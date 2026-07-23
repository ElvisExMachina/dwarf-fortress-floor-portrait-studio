import { describe, expect, it } from 'vitest'
import { colorDistance, hexToRgb, nearestMaterial, quantizeRgba } from './quantize'

const palette = [
  { id: 'black', colorHex: '#000000' },
  { id: 'red', colorHex: '#ff0000' },
  { id: 'white', colorHex: '#ffffff' },
]

describe('image quantization', () => {
  it('parses hex, uses perceptual color distance, and finds the nearest material', () => {
    expect(hexToRgb('#12aBef')).toEqual({ r: 18, g: 171, b: 239 })
    expect(() => hexToRgb('#bad')).toThrow(/Invalid hex color/)
    expect(colorDistance({ r: 1, g: 2, b: 3 }, { r: 1, g: 2, b: 3 })).toBe(0)
    expect(nearestMaterial({ r: 245, g: 10, b: 10 }, palette).id).toBe('red')
    expect(() => nearestMaterial({ r: 0, g: 0, b: 0 }, [])).toThrow(/At least one material/)
  })

  it('quantizes RGBA pixels in row-major order and validates dimensions', () => {
    const rgba = new Uint8ClampedArray([
      5, 5, 5, 255,
      250, 20, 20, 255,
      250, 250, 250, 255,
      0, 0, 0, 0,
    ])
    expect(quantizeRgba(rgba, 2, 2, palette)).toEqual(['black', 'red', 'white', 'black'])
    expect(() => quantizeRgba(rgba, 3, 2, palette)).toThrow(/buffer size/)
  })

  it('applies deterministic Floyd–Steinberg dithering', () => {
    const grayscale = new Uint8ClampedArray([
      110, 110, 110, 255, 110, 110, 110, 255,
      110, 110, 110, 255, 110, 110, 110, 255,
    ])
    const bw = [palette[0], palette[2]]
    expect(quantizeRgba(grayscale, 2, 2, bw, true)).toEqual(['black', 'black', 'black', 'white'])
  })
})
