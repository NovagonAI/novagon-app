'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReportBuilder } from '@/components/lab/ReportBuilder'
import { PrintReport } from '@/components/lab/PrintReport'
import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { describeError } from '@/lib/api'
import { candidateScore, confidence, fmt, headline } from '@/lib/insight'
import { newLine } from '@/lib/store'
import type { StepProps } from './Wizard'
import { runOptimiser } from './optimise'

/** Step 6: two candidate cards, their narrative, the report builder. */
export function StepOptimise({ ws, update, back }: StepProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const h = headline(ws.analysis, ws.productType)
  const scale = h?.unit === 'skor 0–100' ? 100 : 1
  const cands = ws.candidates ?? []

  const iterate = async () => {
    setBusy(true)
    setError(null)
    try {
      update(await runOptimiser(ws))
    } catch (e) {
      setError(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const adopt = (i: number) => {
    const c = cands[i]
    const known = new Map(ws.formula.map((l) => [l.inci_name.toUpperCase(), l]))
    const lines = c.formula.lines.map((cl) => {
      const prev = known.get((cl.inci_name ?? '').toUpperCase())
      return { ...(prev ?? newLine(cl.inci_name ?? '')), inci_name: prev?.inci_name ?? cl.inci_name ?? '', wt_pct: +cl.wt_pct.toFixed(2), ing_id: cl.ing_id ?? prev?.ing_id }
    })
    update({ formula: lines, confirmed: false, step: 3 })
  }

  return (
    <div>
      {cands.length === 0 ? (
        <Panel bodyClassName="py-6">
          <p className="text-[16px] font-semibold text-grey-text">{error ?? 'Belum ada kandidat. Jalankan optimiser untuk mendapatkan usulan formula.'}</p>
          <button type="button" onClick={iterate} disabled={busy} className="btn-primary mt-4">
            {busy ? 'Mengusulkan…' : 'Jalankan optimiser'}
          </button>
        </Panel>
      ) : (
        <div className="grid gap-[13px] md:grid-cols-2">
          {cands.map((c, i) => {
            const s = h ? candidateScore(c, h.head) : null
            const conf = confidence(s ?? undefined, scale === 100 ? 1 : h?.scale[1] ?? 1)
            return (
              <Panel key={i} bodyClassName="pt-[18px] pb-[22px]" className={c.highlighted ? 'ring-2 ring-blue ring-offset-2' : ''}>
                <div className="flex items-start justify-between">
                  <p className="flex items-center gap-[9px] text-[20px] font-bold text-black">
                    <span className="size-[14px] rounded-full bg-blue" aria-hidden="true" /> C{i + 1}
                    {c.highlighted && <span className="ml-2 rounded-[24px] bg-blue px-3 text-[13px] text-white">disarankan</span>}
                  </p>
                  <p className="text-right">
                    <span className="block text-[13px] font-bold text-black">Prediksi</span>
                    <span className="block font-serif text-[32px] font-bold italic leading-none text-navy">{s ? fmt(s.value * scale) : '—'}</span>
                  </p>
                </div>
                <dl className="mt-[22px] space-y-[12px]">
                  {c.formula.lines.map((l, j) => (
                    <div key={j} className="flex justify-between text-[16px] font-bold text-navy">
                      <dt>{l.inci_name}</dt>
                      <dd>{fmt(l.wt_pct)}%</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-[22px] flex items-center gap-4">
                  <div className="h-[10px] flex-1 overflow-hidden rounded-[20px] bg-grey-track" role="progressbar" aria-valuenow={conf ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Confidence">
                    <div className="h-full rounded-[20px] bg-ok" style={{ width: `${conf ?? 0}%` }} />
                  </div>
                  <span className="w-[130px] text-right text-[14px] font-bold text-black">{conf != null ? `${conf}% confidence` : 'tanpa interval'}</span>
                </div>
                {c.verdict && c.verdict.status !== 'pass' && (
                  <p className={`mt-3 text-[13px] font-semibold ${c.verdict.status === 'fail' ? 'text-bad' : 'text-warn-dark'}`}>
                    {c.verdict.findings.length} temuan aturan ({c.verdict.status})
                  </p>
                )}
                <button type="button" onClick={() => adopt(i)} className="btn-outline mt-4 h-[45px] min-h-0 text-[16px]">
                  Terapkan sebagai formula baru
                </button>
              </Panel>
            )
          })}
        </div>
      )}

      {cands.length > 0 && (
        <Panel title="Ringkasan" className="mt-[18px]" bodyClassName="pt-[18px] pb-[26px]">
          {cands.map((_, i) => (
            <div key={i} className={i ? 'mt-[18px]' : ''}>
              <h3 className="text-[16px] font-bold text-navy">Formulasi C{i + 1}</h3>
              <Box muted className="mt-2 px-[18px] py-[14px] text-justify text-[16px] font-semibold text-black">
                {ws.candidateSummary?.[i]}
              </Box>
            </div>
          ))}
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={iterate} disabled={busy} className="btn-outline h-[45px] min-h-0 text-[16px]">
              {busy ? 'Mengusulkan…' : 'Iterasi lagi (batch berikutnya)'}
            </button>
            <button type="button" onClick={() => router.push(`/laboratorium/${ws.id}`)} className="btn-outline h-[45px] min-h-0 text-[16px]">
              Buka di Laboratorium
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-bad">
              <Icon name="danger" size={18} /> {error}
            </p>
          )}
        </Panel>
      )}

      <ReportBuilder ws={ws} />
      <PrintReport ws={ws} />

      <div className="mt-[18px] flex justify-between print:hidden">
        <button type="button" onClick={back} className="btn-outline" enterKeyHint="previous">
          Kembali
        </button>
      </div>
    </div>
  )
}
