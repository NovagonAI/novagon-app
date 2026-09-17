'use client'

import { useState } from 'react'
import { ContributionBars } from '@/components/charts/ContributionBars'
import { OrbitalLegend, OrbitalMap } from '@/components/charts/OrbitalMap'
import { ResultColumn } from '@/components/lab/ResultColumn'
import { SummaryPanel } from '@/components/lab/SummaryPanel'
import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { describeError } from '@/lib/api'
import { compositionNodes, contributions, pickActive } from '@/lib/insight'
import type { StepProps } from './Wizard'
import { runOptimiser } from './optimise'

/** Step 5: contribution bars, composition map with the result column, summary. */
export function StepContribution({ ws, update, next, back }: StepProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lines = ws.formula.filter((l) => l.inci_name)
  const rows = contributions(ws.analysis?.explain)
  const nodes = compositionNodes(lines, ws.analysis)
  const activeLine = pickActive(lines)
  const active = nodes.find((n) => n.line === activeLine)

  const propose = async () => {
    if (ws.candidates?.length) return next()
    setBusy(true)
    setError(null)
    try {
      const out = await runOptimiser(ws)
      update(out)
      next()
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Panel
        title="Peran Bahan Terhadap Stabilitas Formulasi"
        right={
          <span className="flex items-center gap-[10px] text-[16px] font-semibold text-black">
            <span className="size-[23px] rounded-[3px] bg-sky" /> Positif <span className="ml-3 size-[23px] rounded-[3px] bg-grey-bar" /> Negatif
          </span>
        }
        bodyClassName="pt-[10px] pb-[26px]"
      >
        {rows.length ? (
          <ContributionBars rows={rows} />
        ) : (
          <p className="py-6 text-[16px] font-semibold text-grey-text">{ws.analysis?.problems.explain ?? 'Kontribusi belum dihitung; jalankan prediksi terlebih dahulu.'}</p>
        )}
        <Box muted className="mt-[24px] px-[17px] py-[13px] text-[16px] font-semibold text-grey-text">
          Nilai positif menandakan kontribusi meningkatkan stabilitas dari sediaan; nilai negatif menurunkan. Dihitung dengan permutation importance (efek menghilangkan satu bahan) pada model {ws.analysis?.explain?.head ?? 'H1'}; bahan abu-abu tidak dikenali model.
        </Box>
        {ws.analysis?.explain?.substitutions?.length ? (
          <ul className="mt-3 space-y-2">
            {ws.analysis.explain.substitutions.map((s) => (
              <li key={s.with_ing_id} className="rounded-[10px] border border-line bg-white px-4 py-3 text-[14px] font-semibold text-navy">
                Ganti {s.replace_ing_id} dengan {s.with_inci_name}: Δ {s.predicted_delta > 0 ? '+' : ''}{s.predicted_delta.toFixed(3)} — {s.rationale}
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>

      <div className="mt-[18px] grid gap-[21px] lg:grid-cols-[minmax(0,734px)_295px]">
        <Panel title="Analisis Keamanan Komposisi Formulasi" right={<OrbitalLegend />} bodyClassName="py-6">
          <OrbitalMap active={active} nodes={nodes} />
        </Panel>
        <Panel bodyClassName="px-[18px] py-[18px]">
          <ResultColumn ws={ws} />
        </Panel>
      </div>

      <SummaryPanel ws={ws} />

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-[16px] font-semibold text-bad">
          <Icon name="danger" size={20} /> {error}
        </p>
      )}
      <div className="mt-[18px] flex justify-between">
        <button type="button" onClick={back} className="btn-outline" enterKeyHint="previous">
          Kembali
        </button>
        <button type="button" onClick={propose} disabled={busy} className="btn-primary min-w-[264px]" enterKeyHint="next">
          {busy ? 'Mengusulkan…' : 'Usulkan Perbaikan'}
        </button>
      </div>
    </div>
  )
}
