'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { WorkspaceWithRelations } from '@/lib/db'
import type { PredictionRow } from '@/lib/database.types'
import type { Ingredient, PredictionResult, CompatibilityResult } from '@/lib/lab-data'
import { COMPAT_STYLE_LAB, STABILITY_COLOR } from '@/lib/lab-data'
import { createPrediction, savePredictionResult, markPredictionFailed } from '@/lib/db'
import { fetchPredict, fetchConstraintsCheck } from '@/lib/api'
import type { FormulaLine } from '@/lib/api'
import {
  IconMagnifyingGlass, IconPlus, IconSparkles, IconArrowPath,
  IconCheckCircle, IconXCircle, IconExclamationTriangle,
  IconLightBulb, IconCodeBracket, IconClock, IconInformationCircle,
} from '@/components/ui/Icons'

interface Props {
  workspace: WorkspaceWithRelations
  onDataChange?: () => void
}

// ---------------------------------------------------------------------------
// Build PredictionResult from API responses
// ---------------------------------------------------------------------------
function buildPredictionResult(
  predictRes: Awaited<ReturnType<typeof fetchPredict>>,
  constraintRes: Awaited<ReturnType<typeof fetchConstraintsCheck>>,
  qtppPhMin: number, qtppPhMax: number,
  qtppViskositasMin: number, qtppViskositasMax: number,
): PredictionResult {
  const val = predictRes.prediction.value
  const lo  = predictRes.prediction.lo
  const hi  = predictRes.prediction.hi
  const level = predictRes.uncertainty.level
  const band  = predictRes.uncertainty.band

  const gateBonus   = predictRes.provenance.gate === 'pass' ? 10 : 0
  const bandPenalty = band === 'high' ? 20 : band === 'medium' ? 10 : 0
  const oodPenalty  = predictRes.uncertainty.ood ? 15 : 0
  const skorStabilitas = Math.max(0, Math.min(100, Math.round(level * 100) + gateBonus - bandPenalty - oodPenalty))

  const ciWidth = hi - lo
  const estimasiShelfLife = ciWidth < 0.5 ? '24+ bulan' : ciWidth < 1.5 ? '18–24 bulan' : '12–18 bulan'

  const findings = constraintRes.findings
  const hasPhFail = findings.some(f => f.rule === 'R5' && (f.inci_name?.toLowerCase().includes('ph') || f.message.toLowerCase().includes('ph')))
  const hasViscFail = val < qtppViskositasMin || val > qtppViskositasMax

  const kompatibilitas: CompatibilityResult[] = findings.slice(0, 5).map(f => ({
    bahanA: f.inci_name ?? 'Formula',
    bahanB: f.rule,
    level: f.severity === 'fail' ? 'hindari' : 'perhatian',
    catatan: f.message,
  }))

  const rekomendasiAI: string[] = [
    ...predictRes.warnings.slice(0, 2),
    ...findings.flatMap(f => f.suggestion ? [f.suggestion] : []).slice(0, 3),
  ].filter(Boolean)

  if (rekomendasiAI.length === 0) {
    rekomendasiAI.push(
      skorStabilitas >= 80
        ? 'Formula menunjukkan profil yang baik. Lanjutkan ke uji stabilitas dipercepat.'
        : 'Pertimbangkan optimasi konsentrasi bahan aktif untuk meningkatkan stabilitas.'
    )
  }

  return {
    skorStabilitas,
    estimasiShelfLife,
    tingkatKepercayaan: Math.round(level * 100),
    kesesuaianQTPP: {
      ph: !hasPhFail && constraintRes.status !== 'fail',
      viskositas: !hasViscFail,
      penampilan: constraintRes.status !== 'fail',
      keamanan: constraintRes.halal_claimable || constraintRes.status !== 'fail',
      stabilitas: skorStabilitas >= 70,
    },
    kompatibilitas: kompatibilitas.length > 0 ? kompatibilitas : [
      { bahanA: 'Formula', bahanB: 'Basis', level: 'aman', catatan: 'Tidak ada konflik kompatibilitas yang terdeteksi.' },
    ],
    rekomendasiAI,
    ringkasan: `Prediksi ${predictRes.target.name}: ${val.toFixed(3)} ${predictRes.prediction.unit} (CI ${lo.toFixed(3)}–${hi.toFixed(3)}). Ketidakpastian: ${band}. ${predictRes.uncertainty.ood ? 'Formula OOD. ' : ''}Verdict: ${constraintRes.status}. ${constraintRes.manufacturing_note ?? ''}`,
  }
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: PredictionRow['status'] }) {
  const map = {
    queue:      { label: 'Menunggu',  bg: '#EBF4FF', text: '#1A5BA1' },
    processing: { label: 'Diproses', bg: '#F7ECD6', text: '#B4863C' },
    done:       { label: 'Selesai',   bg: '#DEEFE2', text: '#2F7D52' },
    failed:     { label: 'Gagal',     bg: '#F6DEDA', text: '#B14432' },
  }
  const s = map[status]
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const c = STABILITY_COLOR(score)
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      <svg width="64" height="64" className="-rotate-90" aria-hidden>
        <circle cx="32" cy="32" r={r} strokeWidth="5" stroke="#EBF4FF" fill="none" />
        <circle cx="32" cy="32" r={r} strokeWidth="5"
          stroke={score >= 80 ? '#2F7D52' : score >= 60 ? '#B4863C' : '#B14432'}
          fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`absolute text-sm font-bold ${c.text}`}>{score}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export function PrediksiTab({ workspace, onDataChange }: Props) {
  const [selectedPredId, setSelectedPredId] = useState<string>(
    workspace.predictions.find(p => p.status === 'done')?.id ?? workspace.predictions.at(0)?.id ?? ''
  )
  const [runningId, setRunningId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(workspace.formulas.at(0)?.id ?? '')
  const [searchQuery, setSearchQuery] = useState('')

  const sorted = useMemo(() =>
    [...workspace.predictions].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [workspace.predictions]
  )

  const filteredPreds = useMemo(() =>
    sorted.filter(p => p.formula_nama.toLowerCase().includes(searchQuery.toLowerCase())),
    [sorted, searchQuery]
  )

  const selected = workspace.predictions.find(p => p.id === selectedPredId)

  async function handleRunPredict(formulaId: string) {
    const formula = workspace.formulas.find(f => f.id === formulaId)
    if (!formula) return

    let predRow: PredictionRow
    try {
      predRow = await createPrediction({
        workspace_id: workspace.id,
        formula_id: formula.id,
        formula_nama: formula.nama,
        status: 'processing',
        raw_response: null,
        result: null,
        finished_at: null,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal membuat prediksi')
      return
    }

    setRunningId(predRow.id)
    setSelectedPredId(predRow.id)
    setShowNewForm(false)
    onDataChange?.()

    const lines: FormulaLine[] = (formula.bahan as Ingredient[])
      .filter(b => b.nama.trim())
      .map(b => ({ inci_name: b.nama, wt_pct: b.persentase }))

    try {
      const [predictRes, constraintRes] = await Promise.all([
        fetchPredict('H1', { formula: { lines }, product_type: (workspace.qtpp as { bentukSediaan?: string }).bentukSediaan ?? 'face_leave_on' }),
        fetchConstraintsCheck({ formula: { lines }, product_type: (workspace.qtpp as { bentukSediaan?: string }).bentukSediaan ?? 'face_leave_on' }),
      ])

      const qtpp = workspace.qtpp as { phMin?: number; phMax?: number; viskositasMin?: number; viskositasMax?: number }
      const result = buildPredictionResult(predictRes, constraintRes,
        qtpp.phMin ?? 4.5, qtpp.phMax ?? 7.0,
        qtpp.viskositasMin ?? 0, qtpp.viskositasMax ?? Infinity)

      await savePredictionResult(predRow.id, { predictRes, constraintRes }, result)
    } catch (e) {
      await markPredictionFailed(predRow.id).catch(() => {})
      console.error('Prediction failed:', e)
    } finally {
      setRunningId(null)
      onDataChange?.()
    }
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* ── Left panel ── */}
      <aside className="w-64 shrink-0 border-r flex flex-col" style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF' }}>
        {/* Search */}
        <div className="p-3 border-b" style={{ borderColor: '#D0DCF0' }}>
          <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style={{ borderColor: '#D0DCF0', backgroundColor: '#fff' }}>
            <IconMagnifyingGlass className="shrink-0" width={13} height={13} style={{ color: 'rgba(0,51,105,0.3)' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari prediksi…"
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: '#003369' }}
            />
          </div>
          {/* Add button tepat di bawah search */}
          <button
            type="button"
            onClick={() => setShowNewForm(true)}
            disabled={workspace.formulas.length === 0 || !!runningId}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-colors disabled:opacity-40 mt-2"
            style={{ borderColor: '#1A5BA1', color: '#1A5BA1', backgroundColor: 'transparent' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#EBF4FF' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <IconPlus width={13} height={13} />
            Prediksi Baru
          </button>
          {workspace.formulas.length === 0 && (
            <p className="text-xs text-center mt-1" style={{ color: '#B14432' }}>Buat formula dulu</p>
          )}
        </div>

        {/* Header */}
        <div className="px-3 py-2 border-b" style={{ borderColor: '#D0DCF0' }}>
          <p className="text-xs font-semibold" style={{ color: '#003369' }}>Riwayat Prediksi</p>
          <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.45 }}>{workspace.predictions.length} total</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPreds.length === 0 ? (
            <p className="text-xs text-center p-6" style={{ color: '#003369', opacity: 0.4 }}>
              {searchQuery ? 'Tidak ditemukan' : 'Belum ada prediksi'}
            </p>
          ) : (
            filteredPreds.map(pred => {
              const isSelected = pred.id === selectedPredId
              const date = new Date(pred.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
              const result = pred.result as PredictionResult | null
              return (
                <button
                  key={pred.id}
                  type="button"
                  onClick={() => { setSelectedPredId(pred.id); setShowNewForm(false) }}
                  className="w-full text-left px-3 py-3 border-b transition-colors"
                  style={{
                    borderColor: '#D0DCF0',
                    backgroundColor: isSelected ? '#EBF4FF' : 'transparent',
                    borderRight: isSelected ? '2px solid #1A5BA1' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold truncate" style={{ color: '#003369', maxWidth: '120px' }}>
                      {pred.formula_nama}
                    </span>
                    {runningId === pred.id
                      ? <IconArrowPath width={12} height={12} className="animate-spin" style={{ color: '#B4863C' }} />
                      : <StatusBadge status={pred.status} />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <IconClock width={10} height={10} style={{ color: 'rgba(0,51,105,0.35)' }} />
                    <p className="text-xs" style={{ color: '#003369', opacity: 0.45 }}>{date}</p>
                  </div>
                  {result && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="h-1.5 rounded-full flex-1" style={{ backgroundColor: '#D0DCF0' }}>
                        <div className="h-1.5 rounded-full" style={{
                          width: `${result.skorStabilitas}%`,
                          backgroundColor: result.skorStabilitas >= 80 ? '#2F7D52' : result.skorStabilitas >= 60 ? '#B4863C' : '#B14432',
                        }} />
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: '#1A5BA1' }}>{result.skorStabilitas}</span>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {showNewForm ? (
          <div className="flex flex-col gap-5 max-w-md">
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Prediksi Baru</h3>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#003369' }}>
                Pilih Formula <span style={{ color: '#B14432' }}>*</span>
              </label>
              <select
                value={selectedFormulaId}
                onChange={e => setSelectedFormulaId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border outline-none"
                style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF', color: '#003369' }}
              >
                {workspace.formulas.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nama} · {(f.bahan as Ingredient[]).length} bahan
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: '#EBF4FF' }}>
              <IconInformationCircle width={14} height={14} className="shrink-0 mt-0.5" style={{ color: '#1A5BA1' }} />
              <p className="text-xs" style={{ color: '#1A5BA1' }}>
                Prediksi menggunakan model H1 (stabilitas emulsi) dan constraint check.
                Waktu estimasi: 10–30 detik.
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNewForm(false)} className="text-sm px-4 py-2 rounded-full border" style={{ borderColor: '#D0DCF0', color: '#1A5BA1' }}>
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleRunPredict(selectedFormulaId)}
                disabled={!selectedFormulaId || !!runningId}
                className="flex items-center gap-2 text-sm font-semibold px-6 py-2 rounded-full text-white disabled:opacity-40"
                style={{ backgroundColor: '#1A5BA1' }}
              >
                <IconSparkles width={14} height={14} />
                Jalankan Prediksi
              </button>
            </div>
          </div>

        ) : runningId && runningId === selectedPredId ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EBF4FF' }}>
              <IconArrowPath width={20} height={20} className="animate-spin" style={{ color: '#1A5BA1' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Sedang Diproses</h3>
            <p className="text-sm mt-2" style={{ color: '#003369', opacity: 0.55 }}>AI sedang menganalisis formula…</p>
            <div className="mt-4 w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DCF0' }}>
              <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: '#1A5BA1', width: '60%' }} />
            </div>
          </div>

        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EBF4FF' }}>
              <IconSparkles width={20} height={20} style={{ color: '#1A5BA1' }} />
            </div>
            <p className="font-medium" style={{ color: '#003369' }}>Pilih prediksi dari panel kiri</p>
            <p className="text-sm mt-1" style={{ color: '#003369', opacity: 0.5 }}>
              Atau klik &quot;Prediksi Baru&quot; untuk menjalankan prediksi.
            </p>
          </div>

        ) : selected.status === 'failed' ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#F6DEDA' }}>
              <IconXCircle width={20} height={20} style={{ color: '#B14432' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Prediksi Gagal</h3>
            <p className="text-sm mt-2 max-w-xs" style={{ color: '#003369', opacity: 0.55 }}>
              Coba jalankan prediksi ulang, atau periksa koneksi ke API server.
            </p>
          </div>

        ) : selected.result ? (
          <ResultDetail pred={selected} workspace={workspace} />

        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#EBF4FF' }}>
              <IconClock width={20} height={20} style={{ color: '#1A5BA1' }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>Menunggu Prediksi</h3>
            <button
              type="button"
              onClick={() => handleRunPredict(selected.formula_id)}
              disabled={!!runningId}
              className="mt-6 flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-full text-white disabled:opacity-40"
              style={{ backgroundColor: '#1A5BA1' }}
            >
              <IconSparkles width={14} height={14} />
              Jalankan Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ResultDetail
// ---------------------------------------------------------------------------
function ResultDetail({ pred, workspace }: { pred: PredictionRow; workspace: WorkspaceWithRelations }) {
  const [showRaw, setShowRaw] = useState(false)
  const r = pred.result as PredictionResult
  const qtpp = workspace.qtpp as {
    phMin?: number; phMax?: number
    viskositasMin?: number; viskositasMax?: number; viskositasUnit?: string
    stabilitasTarget?: string; keamananTarget?: string; penampilan?: string
  }

  // Find the formula used for this prediction
  const formula = workspace.formulas.find(f => f.id === pred.formula_id)
  const bahan: Ingredient[] = formula ? (formula.bahan as Ingredient[]) : []

  const qtppChecks: { label: string; ok: boolean }[] = [
    { label: `pH ${qtpp.phMin ?? '?'}–${qtpp.phMax ?? '?'}`, ok: r.kesesuaianQTPP.ph },
    { label: `Viskositas ${qtpp.viskositasMin ?? '?'}–${qtpp.viskositasMax ?? '?'} ${qtpp.viskositasUnit ?? ''}`, ok: r.kesesuaianQTPP.viskositas },
    { label: qtpp.penampilan ?? 'Penampilan', ok: r.kesesuaianQTPP.penampilan },
    { label: qtpp.keamananTarget ?? 'Keamanan', ok: r.kesesuaianQTPP.keamanan },
    { label: qtpp.stabilitasTarget ?? 'Stabilitas', ok: r.kesesuaianQTPP.stabilitas },
  ]

  // Derive viscosity range from raw_response if available
  const rawResp = pred.raw_response as { predictRes?: { prediction?: { value?: number; lo?: number; hi?: number; unit?: string } } } | null
  const viscValue = rawResp?.predictRes?.prediction?.value ?? null
  const viscLo    = rawResp?.predictRes?.prediction?.lo ?? null
  const viscHi    = rawResp?.predictRes?.prediction?.hi ?? null

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <ScoreRing score={r.skorStabilitas} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base" style={{ color: '#003369' }}>{pred.formula_nama}</h3>
            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: '#EBF4FF', color: '#1A5BA1' }}>
              {new Date(pred.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#003369', opacity: 0.55 }}>
            Estimasi shelf life: <strong style={{ color: '#1A5BA1' }}>{r.estimasiShelfLife}</strong>
            {' '}· Kepercayaan: <strong style={{ color: '#1A5BA1' }}>{r.tingkatKepercayaan}%</strong>
          </p>
        </div>
      </div>

      {/* ── Ringkasan ── */}
      <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ backgroundColor: '#EBF4FF', color: '#003369' }}>
        {r.ringkasan}
      </div>

      {/* ── QTPP ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>Kesesuaian QTPP</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {qtppChecks.map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: ok ? '#DEEFE2' : '#F6DEDA' }}>
              {ok
                ? <IconCheckCircle width={14} height={14} style={{ color: '#2F7D52', flexShrink: 0 }} />
                : <IconXCircle width={14} height={14} style={{ color: '#B14432', flexShrink: 0 }} />}
              <span style={{ color: ok ? '#1E4F33' : '#8F362A' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Kompatibilitas ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>Kompatibilitas Bahan</h4>
        <div className="flex flex-col gap-2">
          {r.kompatibilitas.map((c, i) => {
            const s = COMPAT_STYLE_LAB[c.level]
            return (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{ borderColor: '#D0DCF0' }}>
                <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${s.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: '#003369' }}>{c.bahanA}</span>
                    <span className="text-xs" style={{ color: '#84A0E4' }}>→</span>
                    <span className="text-sm font-medium" style={{ color: '#003369' }}>{c.bahanB}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bgCls} ${s.textCls}`}>{s.label}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#003369', opacity: 0.55 }}>{c.catatan}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── SECTION 1: Kontribusi Per Bahan ── */}
      {bahan.length > 0 && (
        <KontribusiPerBahan bahan={bahan} kompatibilitas={r.kompatibilitas} skorStabilitas={r.skorStabilitas} />
      )}

      {/* ── SECTION 2: Analisis Formulasi (orbital + QTPP panel) ── */}
      {bahan.length > 0 && (
        <AnalisisFormulasi
          bahan={bahan}
          skorStabilitas={r.skorStabilitas}
          estimasiShelfLife={r.estimasiShelfLife}
          viscValue={viscValue}
          viscLo={viscLo}
          viscHi={viscHi}
          qtppViskositasUnit={qtpp.viskositasUnit}
        />
      )}

      {/* ── Rekomendasi AI ── */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#84A0E4' }}>Rekomendasi AI</h4>
        <div className="flex flex-col gap-2">
          {r.rekomendasiAI.map((rec, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border text-sm" style={{ borderColor: '#AAD3FF', backgroundColor: '#EBF4FF' }}>
              <IconLightBulb width={14} height={14} className="shrink-0 mt-0.5" style={{ color: '#1A5BA1' }} />
              <p style={{ color: '#003369' }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Raw JSON toggle ── */}
      <div className="border-t pt-4" style={{ borderColor: '#D0DCF0' }}>
        <button
          type="button"
          onClick={() => setShowRaw(v => !v)}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: '#D0DCF0', color: '#1A5BA1', backgroundColor: showRaw ? '#EBF4FF' : 'transparent' }}
        >
          <IconCodeBracket width={13} height={13} />
          {showRaw ? 'Sembunyikan' : 'Tampilkan'} Raw JSON
        </button>

        {showRaw && (
          <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: '#D0DCF0' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF' }}>
              <span className="text-xs font-semibold font-mono" style={{ color: '#84A0E4' }}>raw_response</span>
              <span className="text-xs font-mono" style={{ color: '#003369', opacity: 0.4 }}>prediction id: {pred.id.slice(0, 8)}</span>
            </div>
            <pre className="p-4 text-[10px] font-mono overflow-x-auto max-h-96 leading-relaxed" style={{ color: '#003369', backgroundColor: '#FAFAFA' }}>
              {JSON.stringify(pred.raw_response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 1 — Kontribusi Per Bahan
// Heuristik: skor kontribusi = (persentase × faktor_kompatibilitas)
// Bahan dengan kompatibilitas 'hindari' → negatif, 'perhatian' → dikurangi
// ---------------------------------------------------------------------------

function computeContributions(
  bahan: Ingredient[],
  kompatibilitas: CompatibilityResult[],
  skorStabilitas: number,
): { nama: string; pct: number; nilai: number; positif: boolean }[] {
  // Build lookup: bahan name → worst compat level
  const compatMap: Record<string, 'aman' | 'perhatian' | 'hindari'> = {}
  for (const k of kompatibilitas) {
    const worst = (cur: string | undefined, next: string): 'aman' | 'perhatian' | 'hindari' => {
      const rank: Record<string, number> = { aman: 0, perhatian: 1, hindari: 2 }
      if (!cur) return next as 'aman' | 'perhatian' | 'hindari'
      return (rank[next] ?? 0) > (rank[cur] ?? 0) ? (next as 'aman' | 'perhatian' | 'hindari') : (cur as 'aman' | 'perhatian' | 'hindari')
    }
    compatMap[k.bahanA] = worst(compatMap[k.bahanA], k.level)
    compatMap[k.bahanB] = worst(compatMap[k.bahanB], k.level)
  }

  // Normalise: base multiplier per compat level
  const factor = (name: string) => {
    const level = compatMap[name]
    if (level === 'hindari')   return -1.2
    if (level === 'perhatian') return -0.5
    return 1.0
  }

  // Scale score amplitude to ±(skorStabilitas * 0.25) spread
  const amplitude = Math.max(skorStabilitas * 0.25, 5)
  const totalPct = bahan.reduce((s, b) => s + b.persentase, 0) || 1

  const raw = bahan.map(b => ({
    nama: b.nama,
    pct: b.persentase,
    raw: (b.persentase / totalPct) * amplitude * factor(b.nama),
  }))

  // Sort by absolute contribution desc
  raw.sort((a, b) => Math.abs(b.raw) - Math.abs(a.raw))

  // Take top 8
  const top8 = raw.slice(0, 8)
  const maxAbs = Math.max(...top8.map(x => Math.abs(x.raw)), 1)

  return top8.map(x => ({
    nama: x.nama,
    pct: x.pct,
    nilai: parseFloat((x.raw / maxAbs * amplitude).toFixed(1)),
    positif: x.raw >= 0,
  }))
}

function KontribusiPerBahan({ bahan, kompatibilitas, skorStabilitas }: {
  bahan: Ingredient[]
  kompatibilitas: CompatibilityResult[]
  skorStabilitas: number
}) {
  const items = computeContributions(bahan, kompatibilitas, skorStabilitas)
  const maxAbs = Math.max(...items.map(x => Math.abs(x.nilai)), 1)

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#D0DCF0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D0DCF0' }}>
        <h4 className="font-semibold text-sm" style={{ color: '#003369' }}>Kontribusi Per Bahan</h4>
        <div className="flex items-center gap-4 text-xs" style={{ color: '#003369', opacity: 0.5 }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#1A5BA1' }} />
            Positif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#84A0E4', opacity: 0.5 }} />
            Negatif
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-5 py-4 space-y-3">
        {items.map((item) => {
          const barPct = Math.abs(item.nilai) / maxAbs * 50 // max 50% of half-width
          return (
            <div key={item.nama} className="flex items-center gap-3 text-xs">
              {/* Label */}
              <div className="w-44 shrink-0 text-right">
                <span className="font-medium truncate block" style={{ color: '#003369' }}>
                  {item.nama} <span style={{ opacity: 0.5 }}>{item.pct.toFixed(1)}%</span>
                </span>
              </div>

              {/* Diverging bar */}
              <div className="flex-1 flex items-center gap-0" style={{ height: 20 }}>
                {/* Left half (negatif meluas ke kiri) */}
                <div className="flex-1 flex justify-end">
                  {!item.positif && (
                    <div
                      className="h-4 rounded-l"
                      style={{ width: `${barPct}%`, backgroundColor: '#AAD3FF' }}
                    />
                  )}
                </div>
                {/* Center axis */}
                <div className="w-px h-5 shrink-0" style={{ backgroundColor: '#D0DCF0' }} />
                {/* Right half (positif meluas ke kanan) */}
                <div className="flex-1 flex justify-start">
                  {item.positif && (
                    <div
                      className="h-4 rounded-r"
                      style={{ width: `${barPct}%`, backgroundColor: '#1A5BA1' }}
                    />
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="w-12 shrink-0 text-right font-mono font-semibold" style={{ color: item.positif ? '#1A5BA1' : '#84A0E4' }}>
                {item.positif ? '+' : ''}{item.nilai}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="px-5 py-3 border-t" style={{ borderColor: '#D0DCF0', backgroundColor: '#EBF4FF' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#003369', opacity: 0.5 }}>
          Nilai positif menandakan kontribusi meningkatkan performa prediksi; nilai negatif menurunkan.
          Dihitung menggunakan metode heuristik SHAP-like berdasarkan persentase dan profil kompatibilitas.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section 2 — Analisis Formulasi
// Orbital canvas: bahan aktif utama di tengah (3D viewer via PubChem)
//                 bahan lain mengelilingi dalam orbit
// Panel kanan: Stabilitas Emulsi ring, Shelf Life, Viskositas bar
// ---------------------------------------------------------------------------

// Compliance level per bahan (dari kompatibilitas)
type CompatLevel = 'aman' | 'perhatian' | 'hindari'

const COMPLIANCE_STYLE: Record<CompatLevel, { border: string; bg: string; text: string; dot: string; label: string }> = {
  aman:      { border: '#2F7D52', bg: '#DEEFE2', text: '#1E4F33', dot: '#2F7D52', label: 'Aman' },
  perhatian: { border: '#B4863C', bg: '#F7ECD6', text: '#8F6A2E', dot: '#B4863C', label: 'Peringatan' },
  hindari:   { border: '#B14432', bg: '#F6DEDA', text: '#8F362A', dot: '#B14432', label: 'Pelanggaran' },
}

function getOrbitalPositions(n: number, rx: number, ry: number, cx: number, cy: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }
  })
}

// Stability half-ring gauge
function StabilityRing({ score }: { score: number }) {
  const deg = Math.round((score / 100) * 180)
  const color = score >= 80 ? '#2F7D52' : score >= 60 ? '#B4863C' : '#B14432'
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="62" viewBox="0 0 110 62" aria-label={`Stabilitas ${score}%`}>
        <path d="M 9 55 A 46 46 0 0 1 101 55" fill="none" stroke="#EBF4FF" strokeWidth="10" strokeLinecap="round" />
        <path d="M 9 55 A 46 46 0 0 1 101 55" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(deg / 180) * 145} 145`} />
        <text x="55" y="55" textAnchor="middle" fontSize="16" fontWeight="700" fill="#003369" fontFamily="var(--font-fraunces)">
          {score}%
        </text>
      </svg>
      <p className="text-[11px] mt-1" style={{ color: '#003369', opacity: 0.5 }}>Probabilitas Stabilitas</p>
    </div>
  )
}

// Viscosity range bar
function ViscosityBar({ value, lo, hi, unit }: { value: number; lo: number; hi: number; unit?: string }) {
  const MAX = Math.max(hi * 1.5, 1)
  const loX  = (lo  / MAX) * 100
  const hiX  = (hi  / MAX) * 100
  const valX = Math.min((value / MAX) * 100, 100)
  return (
    <div>
      <p className="text-[11px] mb-1.5" style={{ color: '#003369', opacity: 0.5 }}>Viskositas pada 10 s⁻¹</p>
      <div className="relative h-4 rounded-full overflow-visible mb-1" style={{ backgroundColor: '#EBF4FF' }}>
        <div className="absolute top-1 h-2 rounded-full" style={{ left: `${loX}%`, width: `${hiX - loX}%`, backgroundColor: '#AAD3FF' }} />
        <div className="absolute top-0 w-1 h-4 rounded-full" style={{ left: `${valX}%`, transform: 'translateX(-50%)', backgroundColor: '#1A5BA1' }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono" style={{ color: '#003369', opacity: 0.5 }}>
        <span>{lo.toLocaleString()} {unit}</span>
        <span className="font-semibold" style={{ color: '#1A5BA1', opacity: 1 }}>{value.toFixed(0)} {unit}</span>
        <span>{hi.toLocaleString()} {unit}</span>
      </div>
    </div>
  )
}

// Mini PubChem 3D viewer (reused pattern from ChemicalViewer)
// $3Dmol type already declared globally in ChemicalViewer.tsx

function MolViewer({ name }: { name: string }) {
  const [cid, setCid] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading-cid' | 'loading-3d' | 'done' | 'error' | 'no-conformer'>('loading-cid')
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus('loading-cid')
      try {
        const cidRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`)
        if (!cidRes.ok || cancelled) return
        const cidJson = await cidRes.json()
        const id: number = cidJson.IdentifierList?.CID?.[0]
        if (!id || cancelled) { setStatus('error'); return }
        if (!cancelled) setCid(id)
        setStatus('loading-3d')

        let attempts = 0
        const interval = setInterval(async () => {
          attempts++
          if (!window.$3Dmol || cancelled) { if (attempts > 50) { clearInterval(interval); setStatus('error') } return }
          clearInterval(interval)
          try {
            const sdfRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${id}/SDF?record_type=3d`)
            if (sdfRes.status === 404) { setStatus('no-conformer'); return }
            if (!sdfRes.ok) throw new Error()
            const sdf = await sdfRes.text()
            if (!containerRef.current || cancelled) return
            const v = window.$3Dmol.createViewer(containerRef.current, { backgroundColor: '#FFFFFF', antialias: true })
            viewerRef.current = v
            v.addModel(sdf, 'sdf')
            v.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.14 }, sphere: { colorscheme: 'Jmol', radius: 0.28 } })
            v.zoomTo()
            v.render()
            setStatus('done')
          } catch { setStatus('error') }
        }, 150)
      } catch { if (!cancelled) setStatus('error') }
    }
    load()
    return () => {
      cancelled = true
      if (viewerRef.current) try { viewerRef.current.clear() } catch { /**/ }
    }
  }, [name])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-white">
      <div ref={containerRef} className="w-full h-full" />
      {status !== 'done' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ backgroundColor: 'rgba(235,244,255,0.9)' }}>
          {(status === 'loading-cid' || status === 'loading-3d') && (
            <>
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#AAD3FF', borderTopColor: '#1A5BA1' }} />
              <p className="text-[10px]" style={{ color: '#1A5BA1' }}>{status === 'loading-cid' ? 'Mencari PubChem…' : 'Memuat 3D…'}</p>
            </>
          )}
          {(status === 'error' || status === 'no-conformer') && (
            <p className="text-[10px] text-center px-3" style={{ color: '#003369', opacity: 0.5 }}>
              {status === 'no-conformer' ? 'Konformer 3D\ntidak tersedia' : 'Gagal memuat\nstruktur 3D'}
            </p>
          )}
        </div>
      )}
      {status === 'done' && cid && (
        <a
          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 text-[8px] px-1.5 py-0.5 rounded font-mono"
          style={{ backgroundColor: 'rgba(0,51,105,0.6)', color: '#fff' }}
        >
          CID {cid}
        </a>
      )}
    </div>
  )
}

const CANVAS_W = 520
const CANVAS_H = 440
const CX = CANVAS_W / 2
const CY = CANVAS_H / 2
const ORB_RX = 190
const ORB_RY = 160
const CARD_W = 110
const CARD_H = 52

function OrbitalCanvas({ activeIngredient, excipients, compatMap, selectedName, onSelect }: {
  activeIngredient: Ingredient
  excipients: Ingredient[]
  compatMap: Record<string, CompatLevel>
  selectedName: string
  onSelect: (nama: string) => void
}) {
  const positions = getOrbitalPositions(excipients.length, ORB_RX, ORB_RY, CX, CY)

  return (
    <div className="relative select-none overflow-hidden" style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}>
      {/* SVG edges + rings */}
      <svg className="absolute inset-0 pointer-events-none" width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} aria-hidden>
        {positions.map((pos, i) => {
          const level = compatMap[excipients[i].nama] ?? 'aman'
          const c = COMPLIANCE_STYLE[level]
          const isSelected = excipients[i].nama === selectedName
          return <line key={i} x1={CX} y1={CY} x2={pos.x} y2={pos.y}
            stroke={c.border} strokeWidth={isSelected ? '2.5' : '1.5'}
            strokeDasharray={isSelected ? 'none' : '4 3'} strokeOpacity={isSelected ? '0.9' : '0.5'} />
        })}
        <circle cx={CX} cy={CY} r="82" fill="none" stroke="#D0DCF0" strokeWidth="1" strokeDasharray="3 4" />
        <circle cx={CX} cy={CY} r="83" fill="#EBF4FF" fillOpacity="0.5" />
      </svg>

      {/* Center: 3D viewer — shows selectedName */}
      <div className="absolute rounded-xl overflow-hidden shadow" style={{ width: 160, height: 160, left: CX - 80, top: CY - 80, border: '2px solid #AAD3FF' }}>
        <MolViewer name={selectedName} />
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-center" style={{ backgroundColor: 'rgba(0,51,105,0.7)' }}>
          <p className="text-[10px] font-semibold text-white truncate">{selectedName}</p>
          {selectedName !== activeIngredient.nama && (
            <button
              type="button"
              onClick={() => onSelect(activeIngredient.nama)}
              className="text-[8px] text-white/60 underline"
            >
              ← kembali ke utama
            </button>
          )}
          {selectedName === activeIngredient.nama && (
            <p className="text-[9px] text-white/60">{activeIngredient.persentase.toFixed(1)}%</p>
          )}
        </div>
      </div>

      {/* Excipient cards — clickable */}
      {positions.map((pos, i) => {
        const exc = excipients[i]
        const level = compatMap[exc.nama] ?? 'aman'
        const c = COMPLIANCE_STYLE[level]
        const isSelected = exc.nama === selectedName
        return (
          <button
            key={exc.nama + i}
            type="button"
            onClick={() => onSelect(exc.nama)}
            aria-pressed={isSelected}
            className="absolute rounded-lg px-2 py-1.5 shadow-sm transition-all text-left"
            style={{
              width: CARD_W, height: CARD_H,
              left: pos.x - CARD_W / 2, top: pos.y - CARD_H / 2,
              border: `${isSelected ? '2.5px' : '1.5px'} solid ${c.border}`,
              backgroundColor: c.bg,
              boxShadow: isSelected ? `0 0 0 3px ${c.border}33` : undefined,
              transform: isSelected ? 'scale(1.07)' : 'scale(1)',
              zIndex: isSelected ? 10 : 1,
            }}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.dot }} aria-hidden />
              <p className="text-[10px] font-semibold truncate" style={{ color: c.text }}>{exc.nama}</p>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] font-semibold" style={{ color: c.text }}>{exc.persentase.toFixed(1)}%</span>
              <span className="text-[9px] font-medium" style={{ color: c.text, opacity: 0.7 }}>{c.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Legend
function CompatLegend() {
  return (
    <div className="flex items-center gap-4 text-[11px]">
      {(['aman', 'perhatian', 'hindari'] as CompatLevel[]).map(k => (
        <span key={k} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COMPLIANCE_STYLE[k].dot }} />
          <span style={{ color: COMPLIANCE_STYLE[k].text }}>{COMPLIANCE_STYLE[k].label}</span>
        </span>
      ))}
    </div>
  )
}

function AnalisisFormulasi({ bahan, skorStabilitas, estimasiShelfLife, viscValue, viscLo, viscHi, qtppViskositasUnit }: {
  bahan: Ingredient[]
  skorStabilitas: number
  estimasiShelfLife: string
  viscValue: number | null
  viscLo: number | null
  viscHi: number | null
  qtppViskositasUnit?: string
}) {
  const sorted = [...bahan].sort((a, b) => b.persentase - a.persentase)
  const activeIngredient = sorted.find(b => !b.nama.toLowerCase().includes('aqua') && !b.nama.toLowerCase().includes('water')) ?? sorted[0]
  const excipients = bahan.filter(b => b !== activeIngredient).slice(0, 9)

  // selectedName: which ingredient's 3D model is shown in center
  const [selectedName, setSelectedName] = useState(activeIngredient.nama)

  // Reset when activeIngredient changes (different formula)
  useEffect(() => { setSelectedName(activeIngredient.nama) }, [activeIngredient.nama])

  const compatMap: Record<string, CompatLevel> = {}
  for (const b of bahan) compatMap[b.nama] = 'aman'

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#D0DCF0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#D0DCF0' }}>
        <h4 className="font-semibold text-sm" style={{ color: '#003369' }}>Analisis Formulasi</h4>
        <CompatLegend />
      </div>

      {/* Body: orbital left, QTPP panel right */}
      <div className="flex flex-col lg:flex-row">
        {/* Orbital canvas */}
        <div className="flex-1 flex items-start justify-center p-4 overflow-x-auto">
          <OrbitalCanvas activeIngredient={activeIngredient} excipients={excipients} compatMap={compatMap} selectedName={selectedName} onSelect={setSelectedName} />
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px self-stretch" style={{ backgroundColor: '#D0DCF0' }} />

        {/* QTPP panel */}
        <div className="w-full lg:w-64 shrink-0 p-5 flex flex-col gap-5">
          {/* Stabilitas Emulsi */}
          <div>
            <p className="text-xs font-semibold mb-3" style={{ color: '#003369' }}>Stabilitas Emulsi</p>
            <div className="rounded-2xl border p-4" style={{ borderColor: '#D0DCF0' }}>
              <StabilityRing score={skorStabilitas} />
            </div>
          </div>

          {/* Shelf Life */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#003369' }}>Estimasi Shelf Life</p>
            <div className="rounded-2xl border p-4" style={{ borderColor: '#D0DCF0' }}>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-semibold italic" style={{ color: '#003369' }}>
                  {estimasiShelfLife.replace(/[^\d+-]/g, '') || '—'}
                </span>
                <span className="text-sm" style={{ color: '#003369', opacity: 0.5 }}>
                  {estimasiShelfLife.replace(/[\d+-]/g, '').trim() || 'bulan'}
                </span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: '#003369', opacity: 0.4 }}>
                Estimasi berdasarkan interval kepercayaan CI
              </p>
            </div>
          </div>

          {/* Viskositas */}
          {viscValue !== null && viscLo !== null && viscHi !== null && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#003369' }}>Viskositas</p>
              <div className="rounded-2xl border p-4" style={{ borderColor: '#D0DCF0' }}>
                <ViscosityBar value={viscValue} lo={viscLo} hi={viscHi} unit={qtppViskositasUnit ?? ''} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
