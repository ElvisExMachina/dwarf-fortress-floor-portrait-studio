import type { Material } from '../data/materials.generated'
import type { RenderMode } from '../types'

const loadImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image()
  image.onload = () => resolve(image)
  image.onerror = () => reject(new Error(`Could not load texture: ${url}`))
  image.src = url
})

export async function renderProjectBlob(
  cells: string[], width: number, height: number, materials: ReadonlyMap<string, Material>,
  mode: RenderMode, pixelsPerTile: number,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width * pixelsPerTile
  canvas.height = height * pixelsPerTile
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas rendering is unavailable.')
  context.imageSmoothingEnabled = false

  const images = new Map<string, HTMLImageElement>()
  if (mode === 'texture') {
    const unique = [...new Set(cells)]
    await Promise.all(unique.map(async (id) => {
      const material = materials.get(id)
      if (!material) throw new Error(`Unknown material ID: ${id}`)
      images.set(id, await loadImage(material.swatchUrl))
    }))
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const id = cells[y * width + x]
      const material = materials.get(id)
      if (!material) throw new Error(`Unknown material ID: ${id}`)
      context.fillStyle = material.colorHex
      context.fillRect(x * pixelsPerTile, y * pixelsPerTile, pixelsPerTile, pixelsPerTile)
      const image = images.get(id)
      if (image) context.drawImage(image, x * pixelsPerTile, y * pixelsPerTile, pixelsPerTile, pixelsPerTile)
    }
  }

  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')),
    'image/png',
  ))
}

export async function imageFileToContainedRgba(
  file: File, width: number, height: number, backgroundColor: string,
): Promise<Uint8ClampedArray> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas image import is unavailable.')
    context.fillStyle = backgroundColor
    context.fillRect(0, 0, width, height)
    const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = Math.max(1, Math.round(image.naturalWidth * ratio))
    const drawHeight = Math.max(1, Math.round(image.naturalHeight * ratio))
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, Math.floor((width - drawWidth) / 2), Math.floor((height - drawHeight) / 2), drawWidth, drawHeight)
    return context.getImageData(0, 0, width, height).data
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
