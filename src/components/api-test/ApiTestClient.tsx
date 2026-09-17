'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  fetchHealth,
  fetchHeads,
  fetchPredict,
  DUMMY_FORMULA_BY_HEAD,
  HEAD_META,
  API_BASE_URL,
} from '@/lib/api'
import type { HealthResponse, HeadsResponse, PredictionResult } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeadId = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7' | 'H8' | 'H9' | 'H10' | 'H11' | 'H12' | 'H13'

const ALL_HEADS: HeadId[] = ['H1','H2','H3','H4','H5','H6','H7','H8','H9','H10','H11','H12','H13']

type Status = 'idle' | 'loading' | 'success' | 'error' | 'skipped'

interface HeadResult {
  headId: HeadId
  status: Status
  data: PredictionResult | null
  error: string | null
  durationMs: number | null
}

// ---------------------------------------------------------------------------
// Small UI helpers
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: Status }) {
  const cls =
    status === 'success' ? 'bg-success-500' :
    status === 'error'   ? 'bg-danger-500'  :
    status === 'skipped' ? 'bg-slate'       :
    status === 'loading' ? 'bg-amber-500 animate-pulse' :
                           'bg-slate'
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${cls}`} aria-hidden="true" />
}

function StatusLabel({ status }: { status: Status }) {
  const map: Record<Status, { text: string; cls: string }> = {
    idle:    { text: 'Menunggu',  cls: 'text-ink/30' },
    loading: { text: 'Loading…', cls: 'text-amber-600' },
    success: { text: 'OK',       cls: 'text-success-700' },
    error:   { text: 'Error',    cls: 'text-danger-600' },
    skipped: { text: 'Dilewati', cls: 'text-ink/40' },
  }
  const s = map[status]
  return <span className={`text-xs font-medium ${s.cls}`}>{s.text}</span>
}

function GatePill({ gate }: { gate: 'pass' | 'fail' | 'not_measured' | undefined }) {
  if (!gate) return null
  const style =
    gate === 'pass'         ? 'bg-success-100 text-success-700' :
    gate === 'fail'         ? 'bg-danger-100 text-danger-600'   :
                              'bg-amber-100 text-amber-600'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {gate}
    </span>
  )
}

function VerdictPill({ status }: { status: 'pass' | 'warn' | 'fail' | undefined }) {
  if (!status) return null
  const style =
    status === 'pass' ? 'bg-success-100 text-success-700' :
    status === 'warn' ? 'bg-amber-100 text-amber-600'     :
                        'bg-danger-100 text-danger-600'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      verdict: {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Single head result panel
// ---------------------------------------------------------------------------

function HeadPanel({ result, isExpanded, onToggle }: {
  result: HeadResult
  isExpanded: boolean
  onToggle: () => void
}) {
  const meta = HEAD_META[result.headId]
  const formula = DUMMY_FORMULA_BY_HEAD[result.headId]
  const d = result.data

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all ${
      result.status === 'error'   ? 'border-danger-100' :
      result.status === 'success' ? 'border-success-100' :
      result.status === 'skipped' ? 'border-slate opacity-60' :
                                    'border-slate'
    }`}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate2/50 transition-colors"
        aria-expanded={isExpanded}
      >
        {/* Status dot */}
        <StatusDot status={result.status} />

        {/* Head ID badge */}
        <span className="font-mono text-xs font-semibold text-ocean-700 bg-ocean-50 rounded px-2 py-0.5 shrink-0">
          {result.headId}
        </span>

        {/* Label */}
        <span className="flex-1 text-sm text-ink/80 font-medium truncate">{meta?.label ?? result.headId}</span>

        {/* Right: status + gate + duration */}
        <div className="flex items-center gap-2 shrink-0">
          {d && <GatePill gate={d.provenance.gate} />}
          {d && <VerdictPill status={d.verdict.status} />}
          <StatusLabel status={result.status} />
          {result.durationMs != null && (
            <span className="font-mono text-[11px] text-ink/30">{result.durationMs}ms</span>
          )}
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-ink/30 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate px-5 py-4 space-y-4 text-sm">
          {/* Meta description */}
          <p className="text-xs text-ink/50">{meta?.description}</p>

          {/* Skipped */}
          {result.status === 'skipped' && meta?.reason && (
            <div className="rounded-md bg-slate2 px-3 py-2">
              <p className="text-xs text-ink/50 font-medium mb-0.5">Kenapa dilewati?</p>
              <p className="text-xs text-ink/60">{meta.reason}</p>
            </div>
          )}

          {/* Error */}
          {result.status === 'error' && result.error && (
            <div className="rounded-md border border-danger-100 bg-danger-100/40 px-3 py-2">
              <p className="text-xs font-medium text-danger-600 mb-1">Error response</p>
              <p className="font-mono text-xs text-danger-600 break-all">{result.error}</p>
            </div>
          )}

          {/* Formula dummy yang dikirim */}
          {formula && (
            <details className="group">
              <summary className="text-xs font-medium text-ink/50 cursor-pointer select-none list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Formula dummy yang dikirim ({formula.length} bahan)
              </summary>
              <div className="mt-2 rounded-md bg-slate2/60 px-3 py-2 max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ink/40">
                      <th className="text-left pb-1 font-medium">Bahan</th>
                      <th className="text-right pb-1 font-medium">wt%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formula.map((line, i) => (
                      <tr key={i} className="border-t border-slate/50">
                        <td className="py-0.5 text-ink/70">{line.inci_name}</td>
                        <td className="py-0.5 text-right font-mono text-ink/50">{line.wt_pct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}

          {/* Prediction result */}
          {d && (
            <div className="space-y-3">
              {/* Main prediction */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-ocean-50 px-3 py-2.5">
                  <p className="text-[11px] text-ink/50 mb-1">Prediksi</p>
                  <p className="font-mono font-semibold text-ocean-700 text-lg leading-tight">
                    {d.prediction.value.toFixed(4)}
                    {d.prediction.unit && <span className="text-sm font-normal ml-1 text-ocean-700/60">{d.prediction.unit}</span>}
                  </p>
                  <p className="text-[11px] text-ink/40 mt-0.5">CI [{d.prediction.lo.toFixed(3)}, {d.prediction.hi.toFixed(3)}]</p>
                </div>
                <div className="rounded-lg bg-slate2/60 px-3 py-2.5 space-y-1.5">
                  <p className="text-[11px] text-ink/50 mb-1">Metrik lain</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">Target</span>
                    <span className="font-medium text-ink/70">{d.target.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">Uncertainty</span>
                    <span className="font-medium text-ink/70">{d.uncertainty.band} {d.uncertainty.ood ? '· OOD ⚠' : ''}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">Metode CI</span>
                    <span className="font-mono text-ink/50 text-[11px]">{d.uncertainty.method}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink/50">Ingredient match</span>
                    <span className="font-mono text-ink/70">
                      {d.prediction.extras.matched_ingredients != null
                        ? `${(d.prediction.extras.matched_ingredients * 100).toFixed(0)}%`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provenance */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-ink/40 mb-0.5">Model version</p>
                  <p className="font-mono text-ink/60">{d.provenance.model_version}</p>
                </div>
                <div>
                  <p className="text-ink/40 mb-0.5">Train rows</p>
                  <p className="font-mono text-ink/60">{d.provenance.train_rows.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-ink/40 mb-0.5">Registry</p>
                  <p className="font-mono text-ink/60 truncate">{d.provenance.registry_version}</p>
                </div>
              </div>

              {/* Findings */}
              {d.verdict.findings.length > 0 && (
                <details className="group">
                  <summary className="text-xs font-medium text-ink/50 cursor-pointer select-none list-none flex items-center gap-1">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Findings ({d.verdict.findings.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {d.verdict.findings.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${f.severity === 'fail' ? 'bg-danger-500' : 'bg-amber-500'}`} aria-hidden="true" />
                        <div className="flex-1">
                          <span className="font-mono text-ink/40 mr-1">[{f.rule}]</span>
                          {f.inci_name && <span className="font-medium text-ink/70 mr-1">{f.inci_name}</span>}
                          <span className="text-ink/50">{f.message}</span>
                          {f.suggestion && <p className="text-ocean-700 italic mt-0.5">{f.suggestion}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Warnings */}
              {d.warnings.length > 0 && (
                <div className="rounded-md bg-amber-100/50 border border-amber-100 px-3 py-2 space-y-1">
                  {d.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-600">{w}</p>
                  ))}
                </div>
              )}

              {/* Raw JSON toggle */}
              <details className="group">
                <summary className="text-xs font-medium text-ink/30 cursor-pointer select-none list-none flex items-center gap-1">
                  <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Raw JSON response
                </summary>
                <pre className="mt-2 text-[10px] font-mono bg-ink/5 rounded-md p-3 overflow-x-auto max-h-64 text-ink/60 leading-relaxed">
                  {JSON.stringify(d, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary table (mode ALL)
// ---------------------------------------------------------------------------

function SummaryTable({ results }: { results: HeadResult[] }) {
  return (
    <div className="rounded-xl border border-slate bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate">
        <h2 className="font-serif text-lg text-ink">Ringkasan Semua Head</h2>
        <p className="text-xs text-ink/50 mt-0.5">Hasil request ke semua H1–H13 sekaligus</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate2 text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Head</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Status</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Nilai</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Unit</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Gate</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Verdict</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50 text-right">Durasi</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={r.headId} className={i < results.length - 1 ? 'border-b border-slate' : ''}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-ocean-700 bg-ocean-50 rounded px-1.5 py-0.5">
                    {r.headId}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot status={r.status} />
                    <StatusLabel status={r.status} />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink/70">
                  {r.data ? r.data.prediction.value.toFixed(4) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-ink/50">
                  {r.data?.prediction.unit ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <GatePill gate={r.data?.provenance.gate} />
                </td>
                <td className="px-4 py-3">
                  <VerdictPill status={r.data?.verdict.status} />
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-ink/30">
                  {r.durationMs != null ? `${r.durationMs}ms` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

interface Props {
  activeHead: HeadId | 'ALL'
}

export function ApiTestClient({ activeHead }: Props) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [healthStatus, setHealthStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [heads, setHeads] = useState<HeadsResponse | null>(null)

  const targetHeads: HeadId[] = activeHead === 'ALL' ? ALL_HEADS : [activeHead]

  const [results, setResults] = useState<HeadResult[]>(() =>
    targetHeads.map((id) => ({
      headId: id,
      status: 'idle' as Status,
      data: null,
      error: null,
      durationMs: null,
    }))
  )

  const [expanded, setExpanded] = useState<Set<HeadId>>(() => new Set(
    // Auto-expand single head, auto-collapse in ALL mode
    activeHead !== 'ALL' ? [activeHead as HeadId] : []
  ))

  const [hasRun, setHasRun] = useState(false)

  const toggleExpand = useCallback((id: HeadId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Fetch health + heads on mount
  useEffect(() => {
    fetchHealth()
      .then((h) => { setHealth(h); setHealthStatus('ok') })
      .catch(() => setHealthStatus('error'))

    fetchHeads()
      .then(setHeads)
      .catch(() => {/* no-op, heads info is cosmetic here */})
  }, [])

  // Run all target heads
  const runAll = useCallback(async () => {
    setHasRun(true)

    // Reset semua ke loading
    setResults(targetHeads.map((id) => ({
      headId: id,
      status: 'loading' as Status,
      data: null,
      error: null,
      durationMs: null,
    })))

    // Fire semua request secara paralel
    await Promise.all(
      targetHeads.map(async (headId) => {
        const meta = HEAD_META[headId]
        const formula = DUMMY_FORMULA_BY_HEAD[headId]

        // Skip head yang memang tidak bisa di-serve
        if (!meta?.canServe || formula === null) {
          setResults((prev) =>
            prev.map((r) =>
              r.headId === headId
                ? { ...r, status: 'skipped', error: meta?.reason ?? 'Tidak tersedia' }
                : r
            )
          )
          return
        }

        const t0 = Date.now()
        try {
          const data = await fetchPredict(headId, { formula: { lines: formula } })
          setResults((prev) =>
            prev.map((r) =>
              r.headId === headId
                ? { ...r, status: 'success', data, durationMs: Date.now() - t0 }
                : r
            )
          )
          // Auto-expand kalau mode ALL dan berhasil
          if (activeHead === 'ALL') {
            setExpanded((prev) => {
              const next = new Set(prev)
              next.add(headId)
              return next
            })
          }
        } catch (e) {
          setResults((prev) =>
            prev.map((r) =>
              r.headId === headId
                ? {
                    ...r,
                    status: 'error',
                    error: e instanceof Error ? e.message : String(e),
                    durationMs: Date.now() - t0,
                  }
                : r
            )
          )
        }
      })
    )
  }, [targetHeads, activeHead])

  // Stats dari /v1/heads untuk head yang sedang aktif
  const headList = heads?.heads ?? []
  const headInfo = headList.find((h) => h.head === activeHead)

  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount   = results.filter((r) => r.status === 'error').length
  const skippedCount = results.filter((r) => r.status === 'skipped').length
  const loadingCount = results.filter((r) => r.status === 'loading').length

  return (
    <div className="min-h-screen bg-paper">
      {/* Top nav */}
      <header className="h-14 bg-card border-b border-slate flex items-center px-6 gap-4 sticky top-0 z-10">
        <span className="font-serif text-lg text-ink">Novagon</span>
        <span className="text-ink/20">/</span>
        <span className="text-sm text-ink/60">API Test</span>
        <div className="flex-1" />

        {/* Health pill */}
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
          healthStatus === 'ok'      ? 'bg-success-100 text-success-700 border-success-100' :
          healthStatus === 'error'   ? 'bg-danger-100 text-danger-600 border-danger-100'   :
                                       'bg-slate2 text-ink/40 border-slate animate-pulse'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            healthStatus === 'ok'    ? 'bg-success-500' :
            healthStatus === 'error' ? 'bg-danger-500'  :
                                       'bg-slate animate-pulse'
          }`} aria-hidden="true" />
          {healthStatus === 'ok'    ? 'API Online' :
           healthStatus === 'error' ? 'API Offline' :
                                      'Cek API…'}
        </div>

        {/* Back to dashboard */}
        <a
          href="/dashboard"
          className="text-xs text-ink/50 hover:text-ink transition-colors px-3 py-1.5 rounded-md hover:bg-slate2"
        >
          ← Dashboard
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="font-serif text-2xl text-ink">
            API Test {activeHead !== 'ALL' ? `— ${activeHead}` : '— Semua Head'}
          </h1>
          <p className="text-sm text-ink/50 mt-1">
            Base URL: <span className="font-mono text-xs">{API_BASE_URL}</span>
          </p>
        </div>

        {/* Config box — instruksi ganti head */}
        <div className="rounded-xl border border-ocean-200 bg-ocean-50 p-5 space-y-2">
          <p className="text-sm font-medium text-ink">Cara ganti head yang dites</p>
          <p className="text-xs text-ink/60">
            Buka <span className="font-mono bg-white/70 rounded px-1 py-0.5">src/app/api-test/page.tsx</span> dan ubah variabel <span className="font-mono bg-white/70 rounded px-1 py-0.5">ACTIVE_HEAD</span>:
          </p>
          <pre className="text-xs font-mono bg-white/60 rounded-lg px-4 py-3 text-ocean-800 leading-relaxed overflow-x-auto">{`// Pilihan: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6'
//          'H7' | 'H8' | 'H9' | 'H10'| 'H11'| 'H12'| 'H13'
//          'ALL' = tampilkan semua sekaligus
const ACTIVE_HEAD: HeadId | 'ALL' = '${activeHead}'`}</pre>
          <p className="text-xs text-ink/40">
            Saat ini aktif: <span className="font-mono font-semibold text-ocean-700">{activeHead}</span>
            {activeHead !== 'ALL' && HEAD_META[activeHead] && (
              <> — {HEAD_META[activeHead].description}</>
            )}
          </p>
        </div>

        {/* Health detail */}
        {health && (
          <div className="rounded-xl border border-slate bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-base text-ink">Server Health</h2>
              <span className="font-mono text-[11px] text-ink/40">GET /v1/health</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <p className="text-ink/40 mb-0.5">Status</p>
                <p className="font-medium text-success-700">{health.status}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Artifact</p>
                <p className="font-mono text-ink/70 truncate" title={health.artifact_release_tag}>{health.artifact_release_tag}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Core tag</p>
                <p className="font-mono text-ink/70">{health.core_tag}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Uptime</p>
                <p className="font-mono text-ink/70">
                  {health.uptime_s < 3600
                    ? `${Math.floor(health.uptime_s / 60)} mnt`
                    : `${(health.uptime_s / 3600).toFixed(1)} jam`}
                </p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Resident head</p>
                <p className="font-mono text-ink/70">{health.resident_head ?? '—'}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Auth</p>
                <p className="font-mono text-ink/70">{health.auth}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">CORS</p>
                <p className="font-mono text-ink/70">{health.cors}</p>
              </div>
              <div>
                <p className="text-ink/40 mb-0.5">Registry</p>
                <p className="font-mono text-ink/70 truncate" title={health.registry_version}>{health.registry_version}</p>
              </div>
            </div>
          </div>
        )}

        {/* Head info dari /v1/heads (single mode) */}
        {activeHead !== 'ALL' && headInfo && (
          <div className="rounded-xl border border-slate bg-card px-5 py-4 flex flex-wrap gap-4 text-xs">
            <div>
              <p className="text-ink/40 mb-0.5">Head ID</p>
              <p className="font-mono font-semibold text-ocean-700">{headInfo.head}</p>
            </div>
            <div>
              <p className="text-ink/40 mb-0.5">Target</p>
              <p className="font-medium text-ink/70">{headInfo.name}</p>
            </div>
            <div>
              <p className="text-ink/40 mb-0.5">Gate (/v1/heads)</p>
              <GatePill gate={headInfo.gate} />
            </div>
            <div>
              <p className="text-ink/40 mb-0.5">Metrik (headline)</p>
              <p className="font-mono text-ink/70">{headInfo.value != null ? headInfo.value.toFixed(4) : '—'}</p>
            </div>
            <div>
              <p className="text-ink/40 mb-0.5">Available</p>
              <p className={headInfo.available ? 'text-success-700 font-medium' : 'text-ink/40'}>{headInfo.available ? 'Ya' : 'Tidak'}</p>
            </div>
            <div>
              <p className="text-ink/40 mb-0.5">Served</p>
              <p className={headInfo.served ? 'text-success-700 font-medium' : 'text-ink/40'}>{headInfo.served ? 'Ya' : 'Tidak'}</p>
            </div>
          </div>
        )}

        {/* Run button + stats */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={runAll}
            disabled={loadingCount > 0}
            className="inline-flex items-center gap-2 rounded-lg bg-ocean-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-ocean-700 active:bg-ocean-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 focus-visible:ring-offset-2"
          >
            {loadingCount > 0 ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8V4" />
                </svg>
                Mengirim request…
              </>
            ) : hasRun ? (
              <>Jalankan ulang ({activeHead})</>
            ) : (
              <>Jalankan request ({activeHead})</>
            )}
          </button>

          {/* Stats badges */}
          {hasRun && loadingCount === 0 && (
            <div className="flex items-center gap-2 text-xs">
              {successCount > 0 && (
                <span className="flex items-center gap-1.5 bg-success-100 text-success-700 rounded-full px-2.5 py-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500" aria-hidden="true" />
                  {successCount} OK
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 bg-danger-100 text-danger-600 rounded-full px-2.5 py-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger-500" aria-hidden="true" />
                  {errorCount} Error
                </span>
              )}
              {skippedCount > 0 && (
                <span className="flex items-center gap-1.5 bg-slate2 text-ink/50 rounded-full px-2.5 py-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate" aria-hidden="true" />
                  {skippedCount} Dilewati
                </span>
              )}
            </div>
          )}
        </div>

        {/* Summary table — mode ALL dan sudah run */}
        {activeHead === 'ALL' && hasRun && loadingCount === 0 && (
          <SummaryTable results={results} />
        )}

        {/* Head panels */}
        <div className="space-y-3">
          {results.map((r) => (
            <HeadPanel
              key={r.headId}
              result={r}
              isExpanded={expanded.has(r.headId)}
              onToggle={() => toggleExpand(r.headId)}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="text-[11px] text-ink/30 leading-relaxed pb-8">
          <p>H6 (CMC/SMILES), H7 (transkriptomik), H8 (dataset partial), H11 (butuh image), H12 (laptop only) akan selalu dilewati karena tidak ada jalur serving lewat formula biasa.</p>
          <p className="mt-1">Metrik dari /v1/heads menunjukkan nilai <em>headline</em>, bukan <em>served</em> — ada gap untuk H1, H3, H6, H11.</p>
        </div>
      </main>
    </div>
  )
}
