'use client'

import { Gauge } from '@/components/charts/Gauge'
import { RangeBar } from '@/components/charts/RangeBar'
import { TsiChart } from '@/components/charts/TsiChart'
import { Box } from '@/components/ui/Panel'
import { fmt, type Level, parseRange, qtppMatches } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

const DOT: Record<Level, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', lab: 'bg-grey-nav', info: 'bg-line' }

/** Right-hand column: stability gauge, shelf life, viscosity, QTPP accuracy. */
export function ResultColumn({ ws }: { ws: Workspace }) {
  const a = ws.analysis
  const h1 = a?.heads.H1
  const h2 = a?.heads.H2
  const p = h1 && h1.prediction.kind === 'scalar' ? h1.prediction.value : null
  const traj = Object.values(a?.heads ?? {}).map((r) => r.prediction).find((x) => x.kind === 'trajectory')
  const shelf = parseRange(ws.qtpp.stabilitas)
  const visc = h2 && h2.prediction.kind === 'scalar' ? h2.prediction : null
  const target = parseRange(ws.qtpp.viskositas)
  const matches = qtppMatches(ws.qtpp, a)

  return (
    <div className="space-y-[14px]">
      <h3 className="text-[20px] font-bold text-black">Stabilitas Emulsi</h3>
      <Box className="px-3 py-4">
        {p != null ? (
          <Gauge value={p} label="Probabilitas Stabilitas" color={p >= 0.7 ? '#00a120' : p >= 0.5 ? '#f68300' : '#ba0000'} />
        ) : (
          <p className="text-[13px] font-semibold text-grey-text">{a?.problems.H1 ?? 'Belum diprediksi'}</p>
        )}
        {traj && traj.kind === 'trajectory' ? (
          <>
            <p className="mt-2 text-[11px] font-semibold text-grey-text">Trajektori TSI</p>
            <TsiChart t={traj} />
          </>
        ) : (
          <p className="mt-2 text-[11px] font-semibold text-grey-text">Trajektori TSI: head trajektori belum tersedia; probabilitas dari H1 (skalar).</p>
        )}
      </Box>

      <h3 className="text-[20px] font-bold text-black">Estimasi Shelf Life</h3>
      <Box className="px-[22px] py-[14px]">
        {shelf ? (
          <p>
            <span className="font-serif text-[40px] font-bold italic leading-none text-navy">{fmt(shelf[0])}</span>
            <span className="ml-2 text-[20px] font-semibold text-grey-text">{/bulan/i.test(ws.qtpp.stabilitas) ? 'bulan' : /hari/i.test(ws.qtpp.stabilitas) ? 'hari' : 'tahun'}</span>
          </p>
        ) : (
          <p className="text-[20px] font-semibold text-grey-text">Target belum diisi</p>
        )}
        <p className="mt-1 text-[11px] font-semibold text-grey-text">
          {p != null ? `Target QTPP; p(stabil) ${Math.round(p * 100)}% · konfirmasi 40 °C/75% RH (ICH Q1A)` : 'Target QTPP; konfirmasi uji dipercepat 40 °C/75% RH'}
        </p>
      </Box>

      <h3 className="text-[20px] font-bold text-black">Viskositas</h3>
      <Box className="px-[22px] py-[14px]">
        <p className="text-[11px] font-semibold text-grey-text">Viskositas pada 10 s⁻¹</p>
        {visc ? (
          <>
            <div className="mt-2">
              <RangeBar value={visc.value} lo={visc.lo} hi={visc.hi} min={Math.min(visc.lo, target?.[0] ?? visc.lo) * 0.8} max={Math.max(visc.hi, target?.[1] ?? visc.hi) * 1.1} height={19} labels={false} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] font-semibold text-grey-text">
              <span>{fmt(visc.lo, 0)} cP</span>
              <span className="text-navy">{fmt(visc.value, 0)} cP</span>
              <span>{fmt(visc.hi, 0)} cP</span>
            </div>
            {target && <p className="mt-1 text-[11px] font-semibold text-grey-text">Target QTPP {ws.qtpp.viskositas}</p>}
          </>
        ) : (
          <p className="mt-1 text-[13px] font-semibold text-grey-text">{a?.problems.H2 ?? 'Belum diprediksi'}</p>
        )}
      </Box>

      <h3 className="text-[20px] font-bold text-black">Akurasi Target QTPP</h3>
      <dl className="space-y-[10px]">
        {matches.map((m) => (
          <div key={m.label}>
            <dt className="flex items-center gap-2 text-[11px] font-bold text-navy">
              <span className={`size-2 rounded-full ${DOT[m.level]}`} aria-hidden="true" /> {m.label}: <span className="font-medium text-grey-text">{m.target}</span>
            </dt>
            <dd className="mt-[3px] rounded-[10px] border border-navy bg-white px-3 py-2 text-justify text-[11px] font-medium text-black">{m.predicted}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
