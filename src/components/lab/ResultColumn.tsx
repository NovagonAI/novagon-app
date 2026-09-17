'use client'

import { Gauge } from '@/components/charts/Gauge'
import { TsiChart } from '@/components/charts/TsiChart'
import { Box } from '@/components/ui/Panel'
import { fmt, type Level, parseRange, qtppMatches } from '@/lib/insight'
import type { Workspace } from '@/lib/store'

const DOT: Record<Level, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', lab: 'bg-grey-nav', info: 'bg-line' }

/**
 * Right-hand column of the Figma "Revisi" frame: stability gauge with the
 * TSI trajectory, shelf life, viscosity slider, and the QTPP targets. Taller
 * than the panel beside it, so the panel scrolls (see StepContribution).
 */
export function ResultColumn({ ws }: { ws: Workspace }) {
  const a = ws.analysis
  const h1 = a?.heads.H1
  const h2 = a?.heads.H2
  const p = h1 && h1.prediction.kind === 'scalar' ? h1.prediction.value : null
  const traj = Object.values(a?.heads ?? {}).map((r) => r.prediction).find((x) => x.kind === 'trajectory')
  const shelf = parseRange(ws.qtpp.stabilitas)
  const unit = /bulan/i.test(ws.qtpp.stabilitas) ? 'bulan' : /hari/i.test(ws.qtpp.stabilitas) ? 'hari' : 'tahun'
  const visc = h2 && h2.prediction.kind === 'scalar' ? h2.prediction : null
  const target = parseRange(ws.qtpp.viskositas)
  const status = Object.fromEntries(qtppMatches(ws.qtpp, a).map((m) => [m.label, m]))
  const q = ws.qtpp
  const rows: Array<{ label: string; key: string; value: string }> = [
    { label: 'Penampilan:', key: 'Penampilan', value: [q.warna, q.aroma].filter(Boolean).join(', ') },
    { label: 'Keasaman (pH):', key: 'Keasaman (pH)', value: q.ph },
    { label: 'Viskositas:', key: 'Viskositas', value: q.viskositas },
    { label: 'Ukuran Partikel:', key: 'Ukuran Partikel', value: q.ukuranPartikel },
    { label: 'Stabilitas:', key: 'Stabilitas', value: q.stabilitas ? `Stabil ${q.stabilitas}; uji 40°C/75% RH selama 6 bulan` : '' },
    { label: 'Umur Simpan:', key: 'Umur Simpan', value: q.stabilitas },
  ]

  // slider window: the interval plus the QTPP target, so both are visible
  const lo = Math.min(visc?.lo ?? Infinity, target?.[0] ?? Infinity)
  const hi = Math.max(visc?.hi ?? 0, target?.[1] ?? 0)
  const pos = (x: number) => `${Math.max(0, Math.min(100, ((x - lo) / (hi - lo || 1)) * 100))}%`

  return (
    <div className="text-black">
      <h3 className="text-[20px] font-bold">Stabilitas Emulsi</h3>
      <Box className="mt-[10px] px-3 pb-3 pt-[14px]">
        {p != null ? (
          <Gauge value={p} label="Probabilitas Stabilitas" color={p >= 0.7 ? '#009d1f' : p >= 0.5 ? '#f68300' : '#ba0000'} />
        ) : (
          <p className="py-6 text-center text-[13px] font-semibold text-grey-text">{a?.problems.H1 ?? 'Belum diprediksi'}</p>
        )}
        <p className="mt-3 text-[11px] font-semibold text-grey-text">Trajektori TSI</p>
        {traj && traj.kind === 'trajectory' ? (
          <TsiChart t={traj} />
        ) : (
          <TsiPlaceholder />
        )}
      </Box>

      <h3 className="mt-[14px] text-[20px] font-bold">Estimasi Shelf Life</h3>
      <Box className="mt-[10px] h-[97px] px-[22px] pt-[10px]">
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-[40px] font-bold italic leading-none text-navy">{shelf ? fmt(shelf[0]) : '—'}</span>
          <span className="text-[20px] font-semibold text-grey-text">{shelf ? unit : 'target belum diisi'}</span>
        </p>
        <p className="mt-2 text-[11px] font-semibold text-grey-text">
          {traj && traj.kind === 'trajectory' ? `Aman hingga 25 °C sebelum TSI > 3` : p != null ? `Target QTPP · p(stabil) ${Math.round(p * 100)}% · konfirmasi ICH Q1A` : 'Target QTPP · konfirmasi uji dipercepat'}
        </p>
      </Box>

      <h3 className="mt-[14px] text-[20px] font-bold">Viskositas</h3>
      <Box className="mt-[10px] h-[97px] px-[22px] pt-[14px]">
        <p className="text-[11px] font-semibold text-grey-text">Viskositas pada 10 s⁻¹</p>
        {visc ? (
          <>
            <div className="relative mt-[7px] h-[19px] w-full rounded-[25px] border border-line bg-white" role="img" aria-label={`Viskositas ${fmt(visc.value, 0)} cP, interval ${fmt(visc.lo, 0)} sampai ${fmt(visc.hi, 0)} cP`}>
              <span className="absolute top-[3px] h-[11px] rounded-[25px] bg-line" style={{ left: pos(visc.lo), width: `calc(${pos(visc.hi)} - ${pos(visc.lo)})` }} />
              {target && <span className="absolute top-[3px] h-[11px] rounded-[25px] border border-dashed border-navy/40" style={{ left: pos(target[0]), width: `calc(${pos(target[1])} - ${pos(target[0])})` }} title="Target QTPP" />}
              <span className="absolute top-[3px] h-[11px] w-[2px] -translate-x-1/2 bg-navy" style={{ left: pos(visc.value) }} />
            </div>
            <div className="relative mt-[6px] h-[13px] text-[11px] font-semibold text-grey-text">
              <span className="absolute left-0">{fmt(visc.lo, 0)} cP</span>
              <span className="absolute left-1/2 -translate-x-1/2 text-navy">{fmt(visc.value, 0)} cP</span>
              <span className="absolute right-0">{fmt(visc.hi, 0)} cP</span>
            </div>
          </>
        ) : (
          <p className="mt-2 text-[13px] font-semibold text-grey-text">{a?.problems.H2 ?? 'Belum diprediksi'}</p>
        )}
      </Box>

      <h3 className="mt-[14px] text-[20px] font-bold">Akurasi Target QTPP</h3>
      <dl className="mt-[8px] space-y-[10px]">
        {rows.map((r) => {
          const m = status[r.key]
          return (
            <div key={r.key}>
              <dt className="flex items-center gap-[6px] text-[11px] font-bold text-navy">
                {m && <span className={`size-[7px] rounded-full ${DOT[m.level]}`} title={m.predicted} aria-label={m.predicted} />}
                {r.label}
              </dt>
              <dd className="mt-[3px] min-h-[31px] rounded-[10px] border border-navy bg-white px-4 py-[7px] text-justify text-[11px] font-medium leading-[13px] text-black" title={m?.predicted}>
                {r.value || '—'}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/** Empty chart with the TSI = 3 failure line: the head serves a scalar until a time-grid table exists. */
function TsiPlaceholder() {
  return (
    <div className="relative">
      <svg viewBox="0 0 220 74" className="w-full" aria-hidden="true">
        <line x1="5" x2="215" y1="24" y2="24" stroke="#ba0000" strokeDasharray="3 3" strokeWidth="1" />
        <text x="214" y="21" fontSize="7" fill="#ba0000" textAnchor="end">TSI=3</text>
        <line x1="5" x2="215" y1="66" y2="66" stroke="#a1a1a1" strokeWidth="1" />
        <line x1="5" x2="5" y1="8" y2="66" stroke="#a1a1a1" strokeWidth="1" />
      </svg>
      <p className="absolute inset-x-0 top-[30px] text-center text-[10px] font-semibold text-grey-text">Kurva TSI(t) menunggu data time-grid · H1 skalar</p>
    </div>
  )
}
