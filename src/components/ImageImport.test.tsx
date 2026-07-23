import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Material } from '../data/materials.generated'
import { imageFileToContainedRgba } from '../lib/render'
import { quantizeRgba } from '../lib/quantize'
import { ImageImport } from './ImageImport'

vi.mock('../lib/render', () => ({ imageFileToContainedRgba: vi.fn() }))
vi.mock('../lib/quantize', () => ({ quantizeRgba: vi.fn() }))

const material = (id: string, colorHex: string): Material => ({
  id,
  name: id,
  category: 'Stone',
  colorHex,
  swatchUrl: `/materials/${id}.png`,
  width: 48,
  height: 48,
  textureSha256: '0'.repeat(64),
})

const obsidian = material('obsidian', '#22252a')
const gold = material('gold', '#b38a4c')

describe('ImageImport', () => {
  beforeEach(() => {
    vi.mocked(imageFileToContainedRgba).mockReset()
    vi.mocked(quantizeRgba).mockReset()
  })

  it('contains and quantizes an uploaded file with the selected palette and dither option', async () => {
    const rgba = new Uint8ClampedArray([120, 90, 40, 255])
    vi.mocked(imageFileToContainedRgba).mockResolvedValue(rgba)
    vi.mocked(quantizeRgba).mockReturnValue(['gold'])
    const onImport = vi.fn()
    const { container } = render(
      <ImageImport
        width={1}
        height={1}
        background={obsidian}
        allMaterials={[obsidian, gold]}
        visibleMaterials={[gold]}
        onImport={onImport}
      />,
    )

    fireEvent.click(screen.getByLabelText('Floyd–Steinberg dithering'))
    fireEvent.click(screen.getByLabelText(/Use only the palette/))
    const file = new File(['pixel'], 'rune.png', { type: 'image/png' })
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } })

    await waitFor(() => expect(onImport).toHaveBeenCalledWith(['gold']))
    expect(imageFileToContainedRgba).toHaveBeenCalledWith(file, 1, 1, '#22252a')
    expect(quantizeRgba).toHaveBeenCalledWith(rgba, 1, 1, [gold], true)
    expect(screen.getByText(/Imported rune.png with 1 available materials and dithering/)).toBeInTheDocument()
  })
})
