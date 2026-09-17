'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Type declarations
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $3Dmol: any
  }
}

// ---------------------------------------------------------------------------
// Mock data — replace fetch() URLs with real API endpoints when ready
// ---------------------------------------------------------------------------

// Mock: GET /ingredients  →  active compound + excipients list
const MOCK_FORMULA = {
  activeCompound: {
    name: 'Niacinamide',
    cas: '98-92-0',
    concentration: 5.0,
  },
  excipients: [
    { id: 'e1', name: 'Aqua',                  cas: '7732-18-5', concentration: 62.0, compliance: 'safe'    as const },
    { id: 'e2', name: 'Glycerin',              cas: '56-81-5',   concentration: 8.0,  compliance: 'safe'    as const },
    { id: 'e3', name: 'Centella Asiatica Ext.',cas: '84696-21-9',concentration: 3.0,  compliance: 'safe'    as const },
    { id: 'e4', name: 'Sodium Hyaluronate',    cas: '9067-32-7', concentration: 1.2,  compliance: 'warning' as const },
    { id: 'e5', name: 'Phenoxyethanol',        cas: '122-99-6',  concentration: 0.8,  compliance: 'warning' as const },
    { id: 'e6', name: 'Carbomer',              cas: '9003-01-4', concentration: 0.3,  compliance: 'safe'    as const },
    { id: 'e7', name: 'Fragrance Mix',         cas: '—',         concentration: 0.2,  compliance: 'danger'  as const },
    { id: 'e8', name: 'Tocopheryl Acetate',    cas: '58-95-7',   concentration: 0.5,  compliance: 'safe'    as const },
  ],
}

// Mock: POST /predict/H1  →  stability + shelf life
const MOCK_H1 = {
  stabilityProbability: 0.87,          // 0–1
  tsiTrajectory: [                     // {day, tsi} pairs
    { day: 0,   tsi: 0.0 },
    { day: 7,   tsi: 0.4 },
    { day: 14,  tsi: 0.9 },
    { day: 21,  tsi: 1.5 },
    { day: 30,  tsi: 2.1 },
    { day: 45,  tsi: 2.8 },
    { day: 60,  tsi: 3.4 },
    { day: 90,  tsi: 4.2 },
  ],
  shelfLifeDays: 52,                   // days before TSI > 3
  warnings: ['Model H1 belum divalidasi batch terbaru'],
}

// Mock: POST /predict/H2  →  viscosity
const MOCK_H2 = {
  value: 4200,    // cP at 10 s⁻¹
  lo:    3100,
  hi:    5300,
  warnings: [],
}

// Mock: POST /constraints/check  →  safety / irritation
const MOCK_CONSTRAINTS = {
  irritationRisk: 'Rendah' as const,
  phTarget: '5.5 – 6.0',             // user target / lab input
  violations: [
    { rule: 'R5', ingredient: 'Sodium Hyaluronate', message: 'Mendekati batas konsentrasi wajar (1.5%)' },
    { rule: 'R5', ingredient: 'Phenoxyethanol',     message: 'Mendekati batas BPOM (1.0%)' },
    { rule: 'R3', ingredient: 'Fragrance Mix',      message: 'Campuran fragrance tidak teridentifikasi — potensi alergen EU Annex III' },
  ],
}

// ---------------------------------------------------------------------------
// Compliance color helpers
// ---------------------------------------------------------------------------
type Compliance = 'safe' | 'warning' | 'danger'

const COMPLIANCE: Record<Compliance, { edge: string; card: string; dot: string; label: string; labelCls: string }> = {
  safe:    { edge: '#2F7D52', card: 'border-success-500 bg-success-100/60',  dot: 'bg-success-500',  label: 'Aman',       labelCls: 'text-success-700' },
  warning: { edge: '#B4863C', card: 'border-amber-500  bg-amber-100/60',     dot: 'bg-amber-500',    label: 'Peringatan', labelCls: 'text-amber-600' },
  danger:  { edge: '#B14432', card: 'border-danger-500 bg-danger-100/60',    dot: 'bg-danger-500',   label: 'Pelanggaran',labelCls: 'text-danger-600' },
}

// ---------------------------------------------------------------------------
// Orbital layout — place N cards in a circle around center
// The SVG + absolutely-positioned cards share the same coordinate space.
// ---------------------------------------------------------------------------
function getOrbitalPositions(n: number, rx: number, ry: number, cx: number, cy: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    }
  })
}

// ---------------------------------------------------------------------------
// 3D Viewer sub-component (reused from ChemicalViewer logic)
// ---------------------------------------------------------------------------
function MolViewer3D({ cid }: { cid: number | null }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<unknown>(null)
  const [mol3dStatus, setMol3dStatus] = useState<'idle' | 'loading' | 'done' | 'error' | 'no-conformer'>('idle')

  useEffect(() => {
    if (!cid || !containerRef.current) return
    setMol3dStatus('loading')

    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (!window.$3Dmol) {
        if (attempts > 50) { clearInterval(interval); setMol3dStatus('error') }
        return
      }
      clearInterval(interval)

      try {
        const res = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`
        )
        if (res.status === 404) { setMol3dStatus('no-conformer'); return }
        if (!res.ok) throw new Error()
        const sdf = await res.text()

        const v = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#EEF4FA',
          antialias: true,
        })
        viewerRef.current = v
        v.addModel(sdf, 'sdf')
        v.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.14 }, sphere: { colorscheme: 'Jmol', radius: 0.28 } })
        v.zoomTo()
        v.render()
        setMol3dStatus('done')
      } catch { setMol3dStatus('error') }
    }, 100)

    return () => {
      clearInterval(interval)
      if (viewerRef.current) {
        try { (viewerRef.current as { clear: () => void }).clear() } catch { /* ignore */ }
        viewerRef.current = null
      }
    }
  }, [cid])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate2">
      <div ref={containerRef} className="w-full h-full" />

      {mol3dStatus === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate2/90">
          <div className="w-7 h-7 rounded-full border-2 border-ocean-200 border-t-ocean-600 animate-spin" />
          <p className="text-[10px] text-ink/40">Memuat 3D…</p>
        </div>
      )}
      {(mol3dStatus === 'error' || mol3dStatus === 'no-conformer') && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate2/90">
          <p className="text-[10px] text-ink/40 text-center px-2">
            {mol3dStatus === 'no-conformer' ? 'Konformer 3D tidak tersedia' : 'Gagal memuat 3D'}
          </p>
        </div>
      )}
      {mol3dStatus === 'done' && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-ink/30 pointer-events-none">
          drag · scroll
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// QTPP Panel — right side
// ---------------------------------------------------------------------------
function StabilityGauge({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100)
  const deg = Math.round((pct / 100) * 180) // half-circle gauge
  const color = pct >= 80 ? '#2F7D52' : pct >= 60 ? '#B4863C' : '#B14432'

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Half-ring gauge via SVG */}
      <svg width="100" height="58" viewBox="0 0 100 58" aria-label={`Stabilitas ${pct}%`}>
        {/* Track */}
        <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="#EEF4FA" strokeWidth="10" strokeLinecap="round" />
        {/* Fill */}
        <path
          d="M 8 50 A 42 42 0 0 1 92 50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(deg / 180) * 132} 132`}
        />
        <text x="50" y="52" textAnchor="middle" fontSize="14" fontWeight="600" fill="#12263D" fontFamily="var(--font-fraunces)">
          {pct}%
        </text>
      </svg>
      <p className="text-[10px] text-ink/50">Probabilitas Stabilitas</p>
    </div>
  )
}

function TsiChart({ trajectory }: { trajectory: { day: number; tsi: number }[] }) {
  const W = 220; const H = 70
  const maxTsi = 5; const maxDay = trajectory[trajectory.length - 1].day
  const threshold = 3

  const toX = (d: number) => (d / maxDay) * W
  const toY = (t: number) => H - (t / maxTsi) * H

  const points = trajectory.map(p => `${toX(p.day)},${toY(p.tsi)}`).join(' ')
  const thresholdY = toY(threshold)

  return (
    <div className="overflow-hidden">
      <p className="text-[10px] text-ink/50 mb-1">Trajektori TSI</p>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Threshold line TSI=3 */}
        <line x1="0" y1={thresholdY} x2={W} y2={thresholdY} stroke="#B14432" strokeWidth="1" strokeDasharray="3 2" />
        <text x={W - 2} y={thresholdY - 3} fontSize="7" fill="#B14432" textAnchor="end">TSI=3</text>
        {/* Curve */}
        <polyline points={points} fill="none" stroke="#155691" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {trajectory.map(p => (
          <circle key={p.day} cx={toX(p.day)} cy={toY(p.tsi)} r="2" fill="#155691" />
        ))}
        {/* X axis labels */}
        {[0, 30, 60, 90].map(d => (
          <text key={d} x={toX(d)} y={H + 10} fontSize="7" textAnchor="middle" fill="#12263D80">{d}d</text>
        ))}
      </svg>
    </div>
  )
}

function ViscosityBar({ value, lo, hi }: { value: number; lo: number; hi: number }) {
  const MAX = 8000
  const loX  = (lo  / MAX) * 100
  const hiX  = (hi  / MAX) * 100
  const valX = (value / MAX) * 100

  return (
    <div>
      <p className="text-[10px] text-ink/50 mb-1.5">Viskositas pada 10 s⁻¹</p>
      <div className="relative h-4 rounded-full bg-slate2 overflow-visible mb-1">
        {/* Range bar */}
        <div
          className="absolute top-1 h-2 rounded-full bg-ocean-200"
          style={{ left: `${loX}%`, width: `${hiX - loX}%` }}
        />
        {/* Center value marker */}
        <div
          className="absolute top-0 w-1 h-4 rounded-full bg-ocean-600"
          style={{ left: `${valX}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-ink/50 font-mono">
        <span>{lo} cP</span>
        <span className="text-ocean-700 font-medium">{value} cP</span>
        <span>{hi} cP</span>
      </div>
    </div>
  )
}

interface QTPPPanelProps {
  h1: typeof MOCK_H1
  h2: typeof MOCK_H2
  constraints: typeof MOCK_CONSTRAINTS
}

function QTPPPanel({ h1, h2, constraints }: QTPPPanelProps) {
  const hasWarnings = h1.warnings.length > 0 || h2.warnings.length > 0

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Warning gate badge */}
      {hasWarnings && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-100/60 px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-medium text-amber-600">Gate Warning</p>
            {[...h1.warnings, ...h2.warnings].map((w, i) => (
              <p key={i} className="text-[10px] text-amber-600/80 mt-0.5">{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Stability card */}
      <div className="rounded-xl border border-slate bg-card p-4">
        <p className="text-xs font-medium text-ink mb-3">QTPP — Stabilitas Emulsi</p>
        <StabilityGauge probability={h1.stabilityProbability} />
        <div className="mt-3">
          <TsiChart trajectory={h1.tsiTrajectory} />
        </div>
      </div>

      {/* Shelf life card */}
      <div className="rounded-xl border border-slate bg-card p-4">
        <p className="text-xs font-medium text-ink mb-2">QTPP — Estimasi Shelf Life</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-3xl text-ink">{h1.shelfLifeDays}</span>
          <span className="text-sm text-ink/50">hari</span>
        </div>
        <p className="text-[10px] text-ink/40 mt-1">Aman hingga 25°C sebelum TSI &gt; 3</p>
      </div>

      {/* Viscosity card */}
      <div className="rounded-xl border border-slate bg-card p-4">
        <p className="text-xs font-medium text-ink mb-3">QTPP — Viskositas</p>
        <ViscosityBar value={h2.value} lo={h2.lo} hi={h2.hi} />
      </div>

      {/* Safety / irritation + pH */}
      <div className="rounded-xl border border-slate bg-card p-4">
        <p className="text-xs font-medium text-ink mb-3">QTPP — Keamanan & pH</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-[10px] text-ink/50 mb-0.5">Risiko Iritasi</p>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500" aria-hidden="true" />
              {constraints.irritationRisk}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-ink/50 mb-0.5">Target pH</p>
            <span className="font-mono text-xs text-ink">{constraints.phTarget}</span>
            <p className="text-[9px] text-ink/30 mt-0.5">Input acuan lab</p>
          </div>
        </div>

        {/* Violations */}
        {constraints.violations.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate">
            <p className="text-[10px] text-ink/40 mb-1">Pelanggaran / Peringatan</p>
            {constraints.violations.map((v, i) => {
              const isR3 = v.rule === 'R3'
              return (
                <div key={i} className="flex items-start gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 shrink-0 ${isR3 ? 'bg-danger-500' : 'bg-amber-500'}`} aria-hidden="true" />
                  <div>
                    <span className={`text-[10px] font-medium ${isR3 ? 'text-danger-600' : 'text-amber-600'}`}>[{v.rule}] {v.ingredient}</span>
                    <p className="text-[9px] text-ink/50 leading-snug">{v.message}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Orbital Canvas — left side
// Active compound 3D viewer in center, excipient cards surrounding it
// SVG edges connect each excipient card to the center
// ---------------------------------------------------------------------------

const CANVAS_W = 560
const CANVAS_H = 480
const CENTER_X = CANVAS_W / 2
const CENTER_Y = CANVAS_H / 2
const ORBIT_RX = 210
const ORBIT_RY = 175
const CARD_W   = 118
const CARD_H   = 56

function OrbitalCanvas({ formula }: { formula: typeof MOCK_FORMULA }) {
  const [cid, setCid] = useState<number | null>(null)

  // Fetch CID for the active compound on mount
  useEffect(() => {
    async function fetchCid() {
      try {
        const res = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(formula.activeCompound.cas)}/cids/JSON`
        )
        if (!res.ok) return
        const json = await res.json()
        setCid(json.IdentifierList?.CID?.[0] ?? null)
      } catch { /* ignore */ }
    }
    fetchCid()
  }, [formula.activeCompound.cas])

  const positions = getOrbitalPositions(
    formula.excipients.length,
    ORBIT_RX, ORBIT_RY,
    CENTER_X, CENTER_Y
  )

  return (
    <div className="relative select-none" style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}>
      {/* SVG layer — edges behind cards */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        aria-hidden="true"
      >
        {positions.map((pos, i) => {
          const c = COMPLIANCE[formula.excipients[i].compliance]
          return (
            <line
              key={i}
              x1={CENTER_X} y1={CENTER_Y}
              x2={pos.x}    y2={pos.y}
              stroke={c.edge}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              strokeOpacity="0.6"
            />
          )
        })}
        {/* Center ring decoration */}
        <circle cx={CENTER_X} cy={CENTER_Y} r="85" fill="none" stroke="#DCE6F0" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx={CENTER_X} cy={CENTER_Y} r="86" fill="#EEF4FA" fillOpacity="0.6" />
      </svg>

      {/* 3D Viewer — centered */}
      <div
        className="absolute rounded-xl overflow-hidden shadow-md border border-slate"
        style={{
          width:  170,
          height: 170,
          left:   CENTER_X - 85,
          top:    CENTER_Y - 85,
        }}
      >
        <MolViewer3D cid={cid} />
        {/* Active compound label */}
        <div className="absolute bottom-0 left-0 right-0 bg-ink/60 backdrop-blur-sm px-2 py-1 text-center">
          <p className="text-[10px] font-medium text-white leading-tight">{formula.activeCompound.name}</p>
          <p className="text-[9px] text-white/60 font-mono">{formula.activeCompound.concentration}%</p>
        </div>
      </div>

      {/* Excipient cards — absolutely positioned around orbit */}
      {positions.map((pos, i) => {
        const exc = formula.excipients[i]
        const c   = COMPLIANCE[exc.compliance]
        return (
          <div
            key={exc.id}
            className={`absolute rounded-lg border ${c.card} px-2.5 py-2 shadow-sm`}
            style={{
              width:  CARD_W,
              height: CARD_H,
              left:   pos.x - CARD_W / 2,
              top:    pos.y - CARD_H / 2,
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} aria-hidden="true" />
              <p className="text-[10px] font-medium text-ink leading-tight truncate">{exc.name}</p>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] text-ink/70">{exc.concentration}%</span>
              <span className={`text-[9px] font-medium ${c.labelCls}`}>{c.label}</span>
            </div>
            <p className="font-mono text-[8px] text-ink/30 mt-0.5 truncate">CAS {exc.cas}</p>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------
function ComplianceLegend() {
  return (
    <div className="flex items-center gap-4 text-[10px]">
      {(['safe', 'warning', 'danger'] as Compliance[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${COMPLIANCE[k].dot}`} aria-hidden="true" />
          <span className={COMPLIANCE[k].labelCls}>{COMPLIANCE[k].label}</span>
        </span>
      ))}
      <span className="text-ink/30 ml-1">Garis = jalur kompatibilitas</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function FormulaCanvas() {
  return (
    <div className="rounded-xl border border-slate bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate">
        <div>
          <h2 className="font-serif text-lg text-ink">Analisis Formulasi — FM-2381</h2>
          <p className="text-xs text-ink/50 mt-0.5">Visualisasi interaksi molekuler · prediksi QTPP · cek regulasi</p>
        </div>
        {/* <span className="text-[10px] font-medium text-ink/30 font-mono">DATA DUMMY · API PENDING</span> */}
      </div>

      {/* Legend */}
      <div className="px-6 py-2 border-b border-slate bg-paper">
        <ComplianceLegend />
      </div>

      {/* Split view */}
      <div className="flex flex-col lg:flex-row">
        {/* Left — orbital canvas */}
        <div className="flex-1 flex items-start justify-center p-6 overflow-x-auto">
          <OrbitalCanvas formula={MOCK_FORMULA} />
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-slate self-stretch" aria-hidden="true" />
        <div className="block lg:hidden h-px bg-slate mx-6" aria-hidden="true" />

        {/* Right — QTPP panel */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 p-6 overflow-y-auto max-h-[600px]">
          <QTPPPanel h1={MOCK_H1} h2={MOCK_H2} constraints={MOCK_CONSTRAINTS} />
        </div>
      </div>
    </div>
  )
}
