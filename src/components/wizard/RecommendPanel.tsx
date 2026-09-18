'use client'

import { useState } from 'react'
import { Panel, Box } from '@/components/ui/Panel'
import { Icon } from '@/components/ui/Icon'
import { api, describeError, type RecommendOut } from '@/lib/api'
import { productType } from '@/lib/catalog'
import { fmt, titleCase } from '@/lib/insight'
import { newLine, type Workspace } from '@/lib/store'
import { targetPh, toFormula } from './analysis'

const ACTION: Record<string, string> = { add: 'Tambah', adjust: 'Ubah', remove: 'Hapus' }

/**
 * Structural changes from /v1/recommend: the emulsifier that is missing, the
 * base for the stearic acid, the preservative, then levels. Scored before and
 * after, with the pharmacy findings and the narrative the local model wrote.
 */
export function RecommendPanel({ ws, update }: { ws: Workspace; update: (p: Partial<Workspace>) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const rec = ws.recommendation

  const ask = async () => {
    setBusy(true)
    setErr(null)
    try {
      const out = await api.recommend({ formula: toFormula(ws.formula), product_type: productType(ws.productType).apiType, ph: targetPh(ws), language: 'id', use_llm: true })
      update({ recommendation: out })
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }

  const adopt = () => {
    if (!rec?.candidate) return
    const known = new Map(ws.formula.map((l) => [l.inci_name.toUpperCase(), l]))
    const lines = rec.candidate.formula.lines.map((cl) => {
      const prev = known.get(cl.inci_name.toUpperCase())
      return { ...(prev ?? newLine(titleCase(cl.inci_name))), inci_name: prev?.inci_name ?? titleCase(cl.inci_name), wt_pct: +cl.wt_pct.toFixed(2), ing_id: cl.ing_id ?? prev?.ing_id }
    })
    update({ formula: lines, confirmed: false, step: 3, recommendation: undefined })
  }

  return (
    <Panel title="Rekomendasi Struktural" className="mb-[18px]" bodyClassName="pt-[16px] pb-[22px]">
      <p className="text-[14px] font-semibold text-grey-text">
        Optimiser di bawah hanya menggeser persentase di ruang yang sudah ada. Rekomendasi ini bisa menambah bahan yang hilang: pengemulsi, basa, pengawet, antioksidan, pengental, lalu menilai ulang formula sesudahnya.
      </p>
      {!rec ? (
        <button type="button" onClick={ask} disabled={busy} className="btn-primary mt-4 h-[45px] min-h-0 text-[16px]">
          {busy ? 'Menilai formula' : 'Minta rekomendasi'}
        </button>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Box muted className="px-4 py-3">
              <p className="text-[13px] font-bold text-navy">Peluang stabil sekarang</p>
              <p className="font-serif text-[36px] font-bold italic leading-none text-navy">{Math.round(rec.before.p_stable * 100)}%</p>
            </Box>
            <Box muted className="px-4 py-3">
              <p className="text-[13px] font-bold text-navy">Setelah perubahan</p>
              <p className="font-serif text-[36px] font-bold italic leading-none text-ok-dark">{rec.candidate ? `${Math.round(rec.candidate.assessment.p_stable * 100)}%` : 'tidak ada perubahan'}</p>
            </Box>
          </div>
          {rec.changes.length > 0 && (
            <ul className="mt-3 space-y-2">
              {rec.changes.map((c, i) => (
                <li key={i} className="rounded-[10px] border border-line bg-white px-4 py-3">
                  <p className="text-[15px] font-bold text-navy">
                    {ACTION[c.action] ?? c.action} {titleCase(c.inci_name)} {c.action !== 'remove' ? `${fmt(c.wt_pct)}%` : ''}
                    {c.current_pct != null ? ` (sekarang ${fmt(c.current_pct)}%)` : ''}
                  </p>
                  <p className="text-[14px] font-semibold text-black">{c.reason}</p>
                  <p className="text-[12px] font-medium text-grey-text">Sumber: {c.source}</p>
                </li>
              ))}
            </ul>
          )}
          {rec.pharmacy.length > 0 && (
            <div className="mt-3">
              <p className="text-[15px] font-bold text-navy">Temuan farmasi (aturan R6)</p>
              <ul className="mt-1 space-y-1">
                {rec.pharmacy.map((f, i) => (
                  <li key={i} className={`flex gap-2 text-[14px] font-semibold ${f.severity === 'warn' ? 'text-warn-deep' : f.severity === 'fail' ? 'text-bad' : 'text-navy'}`}>
                    <Icon name="danger" size={18} className="mt-[2px] shrink-0" />
                    <span>
                      {f.message}
                      {f.suggestion ? ` Saran: ${f.suggestion}.` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Box muted className="mt-3 whitespace-pre-line px-[18px] py-[14px] text-[15px] font-semibold text-black">{rec.narrative}</Box>
          <p className="mt-1 text-[12px] font-medium text-grey-text">
            {rec.llm.used ? `Narasi ditulis ${rec.llm.model} dari fakta aturan di atas.` : 'Narasi dari templat, model bahasa tidak menjawab.'}
          </p>
          {rec.candidate && (
            <div className="mt-3">
              <p className="text-[15px] font-bold text-navy">Formula kandidat</p>
              <dl className="mt-1 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {rec.candidate.formula.lines.map((l, j) => (
                  <div key={j} className="flex justify-between text-[15px] font-semibold text-black">
                    <dt>{titleCase(l.inci_name)}</dt>
                    <dd>{fmt(l.wt_pct)}%</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {rec.candidate && (
              <button type="button" onClick={adopt} className="btn-primary h-[45px] min-h-0 text-[16px]">
                Terapkan kandidat ke formula
              </button>
            )}
            <button type="button" onClick={ask} disabled={busy} className="btn-outline h-[45px] min-h-0 text-[16px]">
              {busy ? 'Menilai formula' : 'Nilai ulang'}
            </button>
          </div>
        </>
      )}
      {err && (
        <p role="alert" className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-bad">
          <Icon name="danger" size={18} /> {err}
        </p>
      )}
    </Panel>
  )
}
