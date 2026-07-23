import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Material } from '../data/materials.generated'
import { copyText } from '../lib/browser'
import { DesignDesk } from './DesignDesk'

vi.mock('../lib/browser', () => ({ copyText: vi.fn() }))

const material = (id: string, name: string, category: Material['category']): Material => ({
  id,
  name,
  category,
  swatchUrl: `/materials/${id}.png`,
  width: 48,
  height: 48,
  colorHex: '#222222',
  textureSha256: '0'.repeat(64),
})

const materials: Material[] = [
  material('obsidian', 'Obsidian', 'Stone'),
  material('native-gold', 'Native Gold', 'Stone'),
  material('malachite', 'Malachite', 'Stone'),
]

const renderDesk = (onImport = vi.fn()) => render(
  <DesignDesk
    width={2}
    height={2}
    background="obsidian"
    materials={materials}
    onImport={onImport}
  />,
)

describe('DesignDesk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('provides a vendor-neutral copy and correction workflow', async () => {
    const { container } = renderDesk()

    expect(container).not.toHaveTextContent(/Hermes/i)
    expect(screen.getByText('How to use this with any AI chatbot')).toBeInTheDocument()
    expect(screen.getByText(/cloud or local AI chatbot/)).toBeInTheDocument()
    expect(screen.getByText(/give the chatbot the exact error/)).toBeInTheDocument()
    expect(screen.getByText(/privacy terms apply/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Copy AI chatbot request' }))

    await waitFor(() => expect(copyText).toHaveBeenCalledOnce())
    const prompt = vi.mocked(copyText).mock.calls[0][0]
    expect(prompt).toContain('Return exactly one valid JSON object')
    expect(prompt).toContain('do not invent IDs')
    expect(prompt).toContain('verify every y, x, and length is an integer in bounds')
    expect(prompt).not.toMatch(/Hermes/i)
    expect(screen.getByText('Self-contained AI chatbot request copied.')).toBeInTheDocument()
  })

  it('validates and imports a chatbot JSON response', () => {
    const onImport = vi.fn()
    renderDesk(onImport)
    const design = {
      version: 1,
      name: 'Small mark',
      width: 2,
      height: 2,
      background: 'obsidian',
      runs: [{ y: 0, x: 1, length: 1, material: 'native-gold' }],
    }

    fireEvent.change(screen.getByLabelText('Chatbot design JSON'), {
      target: { value: JSON.stringify(design) },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Validate and import design' }))

    expect(onImport).toHaveBeenCalledWith(
      design,
      ['obsidian', 'native-gold', 'obsidian', 'obsidian'],
    )
    expect(screen.getByText(/Imported “Small mark”/)).toBeInTheDocument()
  })
})
