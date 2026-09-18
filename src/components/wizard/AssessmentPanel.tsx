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
      {a.phases.hlb_blend != null && a.phases.hlb_required != null && (
        <p className="mt-3 text-[13px] font-semibold text-grey-text">
          HLB pengemulsi {fmt(a.phases.hlb_blend, 1)} terhadap HLB yang dibutuhkan fase minyak {fmt(a.phases.hlb_required, 1)}
          {a.phases.emulsifiers?.length ? `, sistem: ${a.phases.emulsifiers.join(', ')}` : ''}
        </p>
      )}
      {a.phases.unclassified?.length ? (
        <p className="mt-2 text-[13px] font-semibold text-warn-deep">Belum dikenali kelas fungsinya, tidak dihitung: {a.phases.unclassified.join(', ')}</p>
      ) : null}
    </Panel>
  )
}
