import { useMemo, useState } from 'react'
import { Check, ClipboardList } from 'lucide-react'
import type { Material } from '../data/materials.generated'
import { copyText } from '../lib/browser'
import { buildPlanText, materialTotals } from '../lib/exports'
import { compactRuns } from '../lib/runs'

interface BuildPlanProps {
  name: string
  width: number
  height: number
  cells: string[]
  materials: ReadonlyMap<string, Material>
}

export function BuildPlan(props: BuildPlanProps) {
  const [copied, setCopied] = useState(false)
  const totals = useMemo(() => materialTotals(props.cells, props.materials), [props.cells, props.materials])
  const runs = useMemo(() => compactRuns(props.cells, props.width, props.height), [props.cells, props.height, props.width])
  const rows = useMemo(() => {
    const grouped = new Map<number, typeof runs>()
    for (const run of runs) grouped.set(run.y, [...(grouped.get(run.y) ?? []), run])
    return grouped
  }, [runs])

  const copyPlan = async () => {
    await copyText(buildPlanText(props.name, props.cells, props.width, props.height, props.materials))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <section className="panel build-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Construction ledger</span><h2>Build summary</h2></div>
        <button className="secondary-button small-button" type="button" onClick={() => void copyPlan()}>{copied ? <Check size={16} /> : <ClipboardList size={16} />}{copied ? 'Copied' : 'Copy plan'}</button>
      </div>
      <div className="ledger-stats">
        <div><strong>{props.cells.length.toLocaleString()}</strong><span>floor tiles</span></div>
        <div><strong>{totals.length}</strong><span>materials</span></div>
        <div><strong>{runs.length.toLocaleString()}</strong><span>horizontal runs</span></div>
      </div>
      <h3>Material totals</h3>
      <div className="totals-list">
        {totals.map(({ material, count }) => (
          <div key={material.id} className="total-row">
            <img src={material.swatchUrl} alt="" width="28" height="28" />
            <span><strong>{material.name}</strong><code>{material.id}</code></span>
            <b>{count.toLocaleString()}</b>
          </div>
        ))}
      </div>
      <details className="runs-details">
        <summary>Row-by-row runs <span>{runs.length.toLocaleString()}</span></summary>
        <div className="runs-list">
          {[...rows.entries()].map(([y, rowRuns]) => (
            <div className="build-row" key={y}>
              <strong>Row {y + 1}</strong>
              <div>{rowRuns.map((run, index) => {
                const material = props.materials.get(run.material)
                return <span key={`${run.x}-${index}`}><code>{run.x + 1}–{run.x + run.length}</code> {material?.name ?? run.material} × {run.length}</span>
              })}</div>
            </div>
          ))}
        </div>
      </details>
    </section>
  )
}
