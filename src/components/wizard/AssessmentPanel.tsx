'use client'

import { Panel, Box } from '@/components/ui/Panel'
import type { EmulsionAssessment } from '@/lib/api-types'
import { fmt } from '@/lib/insight'

const MISSING: Record<string, string> = {
  emulsifier: 'pengemulsi',
  co_emulsifier: 'ko-emulsifier (fatty alcohol)',
  thickener: 'pengental fase air',
  base: 'basa penetral asam stearat',
}

/**
 * The emulsion rule set behind a cream's stability number: six scored
 * factors with their sources, what is missing, and the viscosity class.
 * Shown only when the endpoint answered with an assessment.
 */
export function AssessmentPanel({ a }: { a: EmulsionAssessment }) {
  const tone = (s: number) => (s >= 0.7 ? 'bg-ok' : s >= 0.3 ? 'bg-warn' : 'bg-bad')
  return (
    <Panel title="Penilaian Sistem Emulsi" className="mt-[22px]" bodyClassName="pt-[16px] pb-[22px]">
      <p className="text-[14px] font-semibold text-grey-text">
        Dinilai oleh aturan formulasi (HLB Griffin, rasio pengemulsi terhadap fase minyak, jaringan gel lamelar, beban minyak), bukan model terlatih. Setiap faktor membawa sumbernya.
      </p>
      <ul className="mt-3 space-y-3">
        {a.factors.map((f) => (
          <li key={f.key} className="rounded-[10px] border border-line bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-[15px] font-bold text-navy">
              <span>{f.label}</span>
              <span>{Math.round(f.score * 100)}%</span>
            </div>
            <div className="mt-1 h-[8px] overflow-hidden rounded-full bg-mist">
              <div className={`h-full rounded-full ${tone(f.score)}`} style={{ width: `${Math.max(3, f.score * 100)}%` }} />
            </div>
            <p className="mt-1 text-[14px] font-semibold text-black">{f.message}</p>
            <p className="mt-[2px] text-[12px] font-medium text-grey-text">Sumber: {f.source}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Box muted className="px-4 py-3">
          <p className="text-[13px] font-bold text-navy">Yang belum ada</p>
          <p className="text-[15px] font-semibold text-black">{a.missing.length ? a.missing.map((m) => MISSING[m] ?? m).join(', ') : 'Sistem emulsi lengkap'}</p>
        </Box>
        <Box muted className="px-4 py-3">
          <p className="text-[13px] font-bold text-navy">Kelas viskositas</p>
          <p className="text-[15px] font-semibold text-black">
            {a.viscosity_class}, sekitar {fmt(a.viscosity_cp.value, 0)} cP ({fmt(a.viscosity_cp.lo, 0)} sampai {fmt(a.viscosity_cp.hi, 0)}). {a.viscosity_note}
          </p>
        </Box>
      </div>
      {a.phases.hlb_rows && a.phases.hlb_rows.length > 0 && <HlbTable rows={a.phases.hlb_rows} blend={a.phases.hlb_blend ?? null} required={a.phases.hlb_required ?? null} source={a.phases.hlb_source} />}
      <p className="mt-2 text-[12px] font-medium text-grey-text">Viskositas: {a.phases.viscosity_source}</p>
      {a.phases.unclassified?.length ? (
        <p className="mt-2 text-[13px] font-semibold text-warn-deep">Belum dikenali kelas fungsinya, tidak dihitung: {a.phases.unclassified.join(', ')}</p>
      ) : null}
    </Panel>
  )
}

type HlbRow = NonNullable<EmulsionAssessment['phases']['hlb_rows']>[number]

/**
 * The HLB arithmetic shown, not asserted: every emulsifier with its HLB and
 * every oil with its required HLB, weighted by concentration.
 * HLB_campuran = sum(w_i x HLB_i) / sum(w_i), HLB_dibutuhkan = sum(w_j x rHLB_j) / sum(w_j).
 */
function HlbTable({ rows, blend, required, source }: { rows: HlbRow[]; blend: number | null; required: number | null; source?: string }) {
  const em = rows.filter((r) => r.role === 'emulsifier')
  const oil = rows.filter((r) => r.role === 'oil')
  const sum = (xs: HlbRow[], k: 'hlb' | 'required_hlb') => xs.reduce((t, r) => t + r.wt_pct * (r[k] ?? 0), 0)
  const w = (xs: HlbRow[]) => xs.reduce((t, r) => t + r.wt_pct, 0)
  const Row = ({ r, k }: { r: HlbRow; k: 'hlb' | 'required_hlb' }) => (
    <tr className="border-t border-line">
      <td className="py-1 pr-2">{r.name}</td>
      <td className="py-1 pr-2 text-right">{fmt(r.wt_pct)}%</td>
      <td className="py-1 pr-2 text-right">{r[k] != null ? fmt(r[k] as number, 1) : 'tidak ada data'}</td>
      <td className="py-1 text-right">{r[k] != null ? fmt(r.wt_pct * (r[k] as number), 1) : '-'}</td>
    </tr>
  )
  return (
    <div className="mt-3 overflow-x-auto rounded-[10px] border border-line bg-white px-4 py-3 text-[13px] text-black">
      <p className="text-[14px] font-bold text-navy">Perhitungan HLB (Griffin, tertimbang konsentrasi)</p>
      <table className="mt-1 w-full">
        <thead>
          <tr className="text-left text-[12px] font-bold text-grey-text">
            <th className="pr-2">Pengemulsi</th>
            <th className="pr-2 text-right">w (%)</th>
            <th className="pr-2 text-right">HLB</th>
            <th className="text-right">w x HLB</th>
          </tr>
        </thead>
        <tbody>
          {em.map((r, i) => <Row key={i} r={r} k="hlb" />)}
          <tr className="border-t border-navy font-bold">
            <td className="py-1 pr-2">HLB campuran</td>
            <td className="py-1 pr-2 text-right">{fmt(w(em))}%</td>
            <td className="py-1 pr-2 text-right">{blend != null ? fmt(blend, 1) : '-'}</td>
            <td className="py-1 text-right">{fmt(sum(em, 'hlb'), 1)} / {fmt(w(em))}</td>
          </tr>
        </tbody>
        <thead>
          <tr className="text-left text-[12px] font-bold text-grey-text">
            <th className="pr-2 pt-2">Fase minyak</th>
            <th className="pr-2 pt-2 text-right">w (%)</th>
            <th className="pr-2 pt-2 text-right">HLB dibutuhkan</th>
            <th className="pt-2 text-right">w x rHLB</th>
          </tr>
        </thead>
        <tbody>
          {oil.map((r, i) => <Row key={i} r={r} k="required_hlb" />)}
          <tr className="border-t border-navy font-bold">
            <td className="py-1 pr-2">HLB dibutuhkan fase minyak</td>
            <td className="py-1 pr-2 text-right">{fmt(w(oil))}%</td>
            <td className="py-1 pr-2 text-right">{required != null ? fmt(required, 1) : '-'}</td>
            <td className="py-1 text-right">{fmt(sum(oil, 'required_hlb'), 1)} / {fmt(w(oil))}</td>
          </tr>
        </tbody>
      </table>
      {blend != null && required != null && (
        <p className="mt-2 text-[13px] font-semibold text-navy">
          Selisih {fmt(Math.abs(blend - required), 1)}. Di bawah 1.5 dianggap seimbang, di atas 3 emulsi cenderung pecah.
        </p>
      )}
      {source && <p className="mt-1 text-[11px] font-medium text-grey-text">Sumber nilai: tabel data/regulatory/hlb.csv, tiap baris bersumber ({source}).</p>}
    </div>
  )
}
