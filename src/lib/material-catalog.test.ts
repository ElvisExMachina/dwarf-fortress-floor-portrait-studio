// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { MATERIALS, TEXTURE_GENERATOR } from '../data/materials.generated'

const categoryCounts = {
  Stone: 83,
  Glass: 3,
  Ceramic: 3,
  Metal: 26,
} as const

describe('public procedural material catalog', () => {
  it('preserves the material IDs, names, palette, and category counts without source-sheet metadata', () => {
    expect(TEXTURE_GENERATOR).toEqual({
      kind: 'original-procedural',
      version: 1,
      tileSize: 48,
    })
    expect(MATERIALS).toHaveLength(115)
    expect(Object.fromEntries(
      Object.keys(categoryCounts).map((category) => [
        category,
        MATERIALS.filter((material) => material.category === category).length,
      ]),
    )).toEqual(categoryCounts)

    for (const material of MATERIALS) {
      expect(material.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(material.colorHex).toMatch(/^#[0-9a-f]{6}$/)
      expect(material.swatchUrl).toBe(`/materials/${material.id}.png`)
      expect(material).not.toHaveProperty('x')
      expect(material).not.toHaveProperty('y')
      expect(material).not.toHaveProperty('sourceGroup')
      expect(material).not.toHaveProperty('sourceRow')
      expect(material).not.toHaveProperty('sourceColumn')
    }
  })

  it('generates an opaque, non-flat, unique 48x48 texture for every material', async () => {
    const pixelHashes = new Set<string>()

    for (const material of MATERIALS) {
      const file = resolve(process.cwd(), `public/materials/${material.id}.png`)
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      expect(info).toMatchObject({ width: 48, height: 48, channels: 4 })

      const colors = new Set<string>()
      for (let index = 0; index < data.length; index += info.channels) {
        expect(data[index + 3]).toBe(255)
        colors.add(`${data[index]},${data[index + 1]},${data[index + 2]}`)
      }
      expect(colors.size).toBeGreaterThan(4)
      pixelHashes.add(await sharp(data, { raw: info }).removeAlpha().raw().toBuffer().then((pixels) => pixels.toString('base64')))
    }

    expect(pixelHashes.size).toBe(MATERIALS.length)
  })

  it('keeps the generator and public catalog independent of private source artwork', async () => {
    const generator = await readFile(resolve(process.cwd(), 'scripts/generate-materials.mjs'), 'utf8')
    const catalog = JSON.parse(await readFile(resolve(process.cwd(), 'public/materials/catalog.json'), 'utf8')) as Record<string, unknown>

    expect(generator).not.toMatch(/material-sheet|source.?sheet|\.extract\s*\(/i)
    expect(catalog).not.toHaveProperty('source')
    expect(catalog).toMatchObject({ generator: TEXTURE_GENERATOR })
  })
})