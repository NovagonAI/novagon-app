'use client'

import { RangeBar } from '@/components/charts/RangeBar'
import { Icon } from '@/components/ui/Icon'
import { Panel, Box } from '@/components/ui/Panel'
import { HEAD_LABEL } from '@/lib/catalog'
import type { HeadId } from '@/lib/api-types'
import { complianceRisks, fmt, headline, provenanceLine, type Risk, safetyRisks, stabilityRisks } from '@/lib/insight'
import type { StepProps } from './Wizard'
import { useState } from 'react'
import { runAnalysis } from './analysis'
import { describeError } from '@/lib/api'

/** Step 4: the headline number with its interval, then the three risk cards. */
export function StepPrediction({ ws, update, next, back }: StepProps) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const rerun = async () => {
    setBusy(true)
    setErr(null)
    try {
      update({ analysis: await runAnalysis(ws), candidates: undefined, candidateSummary: undefined, optimiserState: null })
    } catch (e) {
      setErr(describeError(e))
    } finally {
      setBusy(false)
    }
  }
  const a = ws.analysis
  const h = headline(a, ws.productType)
  const lines = ws.formula.filter((l) => l.inci_name)
  const stability = stabilityRisks(lines, a, ws.qtpp)
  const safety = safetyRisks(lines, a)
  const compliance = complianceRisks(lines, a)
  const others = Object.entries(a?.heads ?? {}).filter(([k]) => k !== h?.head)

  return (
    <div>
      <Panel title="Hasil Prediksi" bodyClassName="pt-[16px] pb-[26px]">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[20px] font-bold text-navy">Nilai Prediksi{h ? ` · ${h.label}` : ''}</p>
          <button type="button" onClick={rerun} disabled={busy} className="btn-primary h-[45px] min-h-0 min-w-[190px] text-[18px]">
            {busy ? 'Memprediksi…' : 'Prediksi Ulang'}
          </button>
        </div>
        {err && <p role="alert" className="mt-2 text-[14px] font-semibold text-bad">{err}</p>}
        {h ? (
          <>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-6">
              <span className="font-serif text-[70px] font-bold italic leading-none text-navy">{fmt(h.value)}</span>
              <span className="text-[20px] font-semibold text-grey-text">
                CI {Math.round(h.raw.uncertainty.level * 100)}%: [{fmt(h.lo)} – {fmt(h.hi)}] {h.unit !== 'skor 0–100' ? h.unit : ''}
              </span>
            </p>
            <div className="mt-[14px]">
              <RangeBar value={h.value} lo={h.lo} hi={h.hi} min={h.scale[0]} max={h.scale[1]} />
            </div>
            <Box muted className="mt-[18px] px-4 py-4 text-[16px] font-semibold text-grey-text">
              {provenanceLine(h.raw)}
              {h.raw.provenance.attribution && <span className="block text-[13px]">{h.raw.provenance.attribution}</span>}
            </Box>
            {h.raw.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-[14px] font-semibold text-warn-deep">
                {h.raw.warnings.map((w) => (
                  <li key={w} className="flex gap-2">
                    <Icon name="danger" size={18} className="mt-[2px]" /> {w}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Box muted className="mt-3 px-4 py-4 text-[16px] font-semibold text-warn-deep">
            {a ? Object.entries(a.problems).map(([k, v]) => `${k}: ${v}`).join(' · ') || 'Model tidak mengembalikan nilai.' : 'Belum ada prediksi. Kembali ke Input Formulasi dan tekan Prediksi.'}
          </Box>
        )}
        {others.length > 0 && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {others.map(([k, r]) => {
              const p = r.prediction
              const text =
                p.kind === 'scalar' ? `${fmt(p.value)} ${p.unit} (${fmt(p.lo)}–${fmt(p.hi)})` : p.kind === 'class' ? `${p.label} · p=${Math.round(p.p * 100)}%` : p.kind
              return (
                <Box key={k} muted className="px-4 py-3">
                  <dt className="text-[14px] font-bold text-navy">{HEAD_LABEL[k as HeadId]}</dt>
                  <dd className="text-[16px] font-semibold text-black">{text}</dd>
                </Box>
              )
            })}
          </dl>
        )}
        {a && Object.entries(a.problems).filter(([k]) => k !== h?.head).length > 0 && (
          <ul className="mt-3 space-y-1 text-[13px] font-medium text-grey-text">
            {Object.entries(a.problems).map(([k, v]) => (
              <li key={k}>
                {HEAD_LABEL[k as HeadId] ?? k}: {v}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <RiskPanel title="Berisiko Mengganggu Stabilitas Produk" color="text-warn-deep" risks={stability} empty="Tidak ada risiko stabilitas yang terdeteksi dari pasangan bahan maupun aturan R5/R6." />
      <RiskPanel title="Berpotensi Membahayakan Keamanan Konsumen" color="text-warn" risks={safety} empty="Tidak ada bahan yang melampaui batas regulasi atau penanda iritan." />
      <RiskPanel title="Kepatuhan Regulasi & Halal" color="text-navy" risks={compliance} empty="Semua bahan dikenali registry; tidak ada catatan halal atau aturan brand." />

      <div className="mt-[18px] flex justify-between">
        <button type="button" onClick={back} className="btn-outline" enterKeyHint="previous">
          Kembali
        </button>
        <button type="button" onClick={next} className="btn-primary min-w-[303px]" enterKeyHint="next">
          Mengapa Bisa Begitu?
        </button>
      </div>
    </div>
  )
}

function RiskPanel({ title, color, risks, empty }: { title: string; color: string; risks: Risk[]; empty: string }) {
  return (
    <Panel className="mt-[22px]" bodyClassName="pt-[18px] pb-[22px]">
      <h2 className={`text-[20px] font-bold ${color}`}>
        {title} ({risks.length})
      </h2>
      <ul className="mt-[14px] space-y-3">
        {risks.length === 0 && <li className="rounded-[10px] border border-line bg-white px-4 py-3 text-[16px] font-semibold text-ok-dark">{empty}</li>}
        {risks.map((r, i) => (
          <li key={i} className={`flex gap-3 rounded-[10px] border border-line bg-white px-[14px] py-[15px] ${r.level === 'bad' ? 'text-bad' : r.level === 'warn' ? 'text-warn' : 'text-navy'}`}>
            <Icon name="danger" size={24} className="mt-[1px] shrink-0" />
            <div className="min-w-0">
              <p className="text-[16px] font-bold">{r.title}</p>
              {r.detail && <p className="text-[16px] font-semibold">{r.detail}</p>}
              {r.suggestion && <p className="mt-1 text-[14px] font-semibold text-navy">Saran: {r.suggestion}</p>}
              {r.source && <p className="mt-1 text-[12px] font-medium text-grey-text">Sumber: {r.source}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
