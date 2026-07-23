import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Material } from '../data/materials.generated'
import type { ProjectState } from '../types'
import { ExportPanel } from './ExportPanel'

const { downloadText } = vi.hoisted(() => ({ downloadText: vi.fn() }))

vi.mock('../lib/browser', () => ({
  downloadBlob: vi.fn(),
  downloadText,
  safeFilename: (name: string, extension: string) => `${name}.${extension}`,
}))

const material = (id: string, name: string, category: Material['category'], colorHex: string): Material => ({
  id,
  name,
  category,
  colorHex,
  swatchUrl: `/materials/${id}.png`,
  width: 48,
  height: 48,
  textureSha256: '0'.repeat(64),
})

const obsidian = material('obsidian', 'Obsidian', 'Stone', '#2a2e36')
const gold = material('gold', 'Gold', 'Metal', '#897152')
const materials = new Map([[obsidian.id, obsidian], [gold.id, gold]])
const project: ProjectState = {
  version: 1,
  name: 'Metal rune',
  width: 2,
  height: 1,
  background: obsidian.id,
  cells: [obsidian.id, gold.id],
  renderMode: 'color',
  gridVisible: true,
  zoom: 18,
  selectedMaterial: gold.id,
}

describe('ExportPanel', () => {
  beforeEach(() => downloadText.mockReset())

  it('shows material phases and downloads an instruction-first Quickfort CSV', () => {
    render(<ExportPanel project={project} materials={materials} />)

    expect(screen.getByText('2 required material-filter phases')).toBeInTheDocument()
    expect(screen.getByText('Step 1: Gold')).toBeInTheDocument()
    expect(screen.getByText('Enable bars first')).toBeInTheDocument()
    expect(screen.getByText(/Quickfort cannot encode a floor material/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Staged Quickfort CSV/ }))

    expect(downloadText).toHaveBeenCalledOnce()
    const [csv, filename, mime] = downloadText.mock.calls[0] as [string, string, string]
    expect(csv).toMatch(/^#notes label\(README\)/)
    expect(csv).toContain('label(filter01_gold_then_apply)')
    expect(csv).toContain('run buildingplan set bars true first')
    expect(filename).toBe('Metal rune-quickfort.csv')
    expect(mime).toBe('text/csv')
    expect(screen.getByText(/README builds nothing/)).toBeInTheDocument()
  })
})
