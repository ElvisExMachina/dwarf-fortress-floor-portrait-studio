import { Search, SlidersHorizontal } from 'lucide-react'
import type { Material, MaterialCategory } from '../data/materials.generated'

export type CategoryFilter = 'All' | MaterialCategory
const categories: CategoryFilter[] = ['All', 'Stone', 'Glass', 'Ceramic', 'Metal']

interface PalettePanelProps {
  materials: Material[]
  selectedId: string
  search: string
  category: CategoryFilter
  onSearchChange: (value: string) => void
  onCategoryChange: (value: CategoryFilter) => void
  onSelect: (id: string) => void
}

export function PalettePanel(props: PalettePanelProps) {
  const selected = props.materials.find(({ id }) => id === props.selectedId)
  const visible = props.materials.filter((material) =>
    (props.category === 'All' || material.category === props.category)
    && `${material.name} ${material.id} ${material.colorHex}`.toLowerCase().includes(props.search.trim().toLowerCase()),
  )

  return (
    <aside className="panel palette-panel" aria-label="Dwarf Fortress material library">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Procedural texture rail</span>
          <h2>Material library</h2>
        </div>
        <span className="count-badge">{visible.length} / {props.materials.length}</span>
      </div>
      {selected && (
        <div className="selected-material">
          <img src={selected.swatchUrl} alt="" width="48" height="48" />
          <div><span>Drawing with</span><strong>{selected.name}</strong><code>{selected.id} · {selected.colorHex}</code></div>
        </div>
      )}
      <label className="search-control">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search materials</span>
        <input value={props.search} onChange={(event) => props.onSearchChange(event.target.value)} placeholder="Search name, ID, or hex…" />
      </label>
      <div className="category-filter" aria-label="Filter materials by category">
        <SlidersHorizontal size={15} aria-hidden="true" />
        {categories.map((category) => (
          <button key={category} type="button" className={props.category === category ? 'is-active' : ''} onClick={() => props.onCategoryChange(category)}>
            {category}
          </button>
        ))}
      </div>
      <div className="material-list" role="listbox" aria-label="Materials">
        {visible.map((material) => (
          <button
            key={material.id}
            type="button"
            role="option"
            aria-selected={material.id === props.selectedId}
            className={`material-card ${material.id === props.selectedId ? 'is-selected' : ''}`}
            onClick={() => props.onSelect(material.id)}
          >
            <img src={material.swatchUrl} alt="" loading="lazy" width="48" height="48" />
            <span className="material-copy">
              <strong>{material.name}</strong>
              <small>{material.category} · {material.colorHex}</small>
              <code>{material.id}</code>
            </span>
            <span className="material-color" style={{ backgroundColor: material.colorHex }} aria-hidden="true" />
          </button>
        ))}
        {!visible.length && <p className="empty-state">No materials match this filter.</p>}
      </div>
    </aside>
  )
}
