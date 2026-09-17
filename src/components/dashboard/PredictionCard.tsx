'use client'

import { useEffect, useState } from 'react'
import { ConfidenceRing } from '@/components/ui/ConfidenceRing'
import { Badge } from '@/components/ui/Badge'
import { fetchPredict, DUMMY_FORMULA_H1, DUMMY_FORMULA_H2 } from '@/lib/api'
import type { PredictionResult } from '@/lib/api'

// ---------------------------------------------------------------------------
// Switch antara H1 dan H2 di sini
// H1 = prediksi viskositas shampoo
// H2 = prediksi rheologi/yield stress surfaktan
// ---------------------------------------------------------------------------
const ACTIVE_HEAD: 'H1' | 'H2' = 'H1'
const FORMULA = ACTIVE_HEAD === 'H1' ? DUMMY_FORMULA_H1 : DUMMY_FORMULA_H2
// ---------------------------------------------------------------------------

function bandLabel(band: string): string {
  return band === 'low' ? 'Rendah' : band === 'medium' ? 'Sedang' : 'Tinggi'
}

function verdictTone(status: string): 'success' | 'amber' | 'danger' | 'neutral' {
  if (status === 'pass') return 'success'
  if (status === 'warn') return 'amber'
  if (status === 'fail') return 'danger'
  return 'neutral'
}

export function PredictionCard() {
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredict(ACTIVE_HEAD, { formula: { lines: FORMULA } })
      .then(setResult)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Gagal memuat prediksi'))
      .finally(() => setLoading(false))
  }, [])

  // Derived display values
  const confidencePct = result
    ? Math.round(result.uncertainty.level * 100)
    : 92

  const matched = result?.prediction.extras.matched_ingredients ?? null
  const ood = result?.uncertainty.ood

  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: '#D0DCF0' }}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs text-ink/50">
          Prediksi model · <span className="font-mono">{ACTIVE_HEAD}</span>
          {result && (
            <> · <span className="font-mono">{result.provenance.model_version}</span></>
          )}
        </p>
        {loading ? (
          <span className="h-5 w-14 rounded-full bg-slate2 animate-pulse block" />
        ) : error ? (
          <Badge tone="danger">Error</Badge>
        ) : result ? (
          <Badge tone={verdictTone(result.verdict.status)}>
            {result.verdict.status === 'pass' ? 'Pass' : result.verdict.status === 'warn' ? 'Peringatan' : 'Gagal'}
          </Badge>
        ) : null}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate2 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/3 rounded bg-slate2 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-slate2 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-1/2 rounded bg-slate2 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <>
          {/* Tampilkan fallback UI statis kalau API error */}
          <div className="flex items-center gap-4 mt-4 mb-4">
            <ConfidenceRing value={92} />
            <div>
              <h2 className="font-serif text-xl font-semibold italic leading-tight" style={{ color: '#003369' }}>Stabilitas emulsi tinggi</h2>
              <p className="text-sm text-ink/50 mt-1">Data lokal · API tidak tersedia</p>
            </div>
          </div>
          <div className="rounded-md border border-danger-100 bg-danger-100/40 px-3 py-2 mb-4">
            <p className="text-xs text-danger-600 font-mono break-all">{error}</p>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate">
            <div><dt className="text-ink/50 mb-1 text-xs">Risiko iritasi</dt><dd className="font-medium text-success-600">Rendah</dd></div>
            <div><dt className="text-ink/50 mb-1 text-xs">Estimasi shelf life</dt><dd className="font-medium">18–24 bulan</dd></div>
            <div><dt className="text-ink/50 mb-1 text-xs">pH proyeksi</dt><dd className="font-mono font-medium">5.4 – 5.8</dd></div>
            <div><dt className="text-ink/50 mb-1 text-xs">Head aktif</dt><dd className="font-mono font-medium">{ACTIVE_HEAD}</dd></div>
          </dl>
        </>
      )}

      {/* Live result */}
      {!loading && result && (
        <>
          <div className="flex items-center gap-4 mt-4 mb-6">
            <ConfidenceRing value={confidencePct} />
            <div>
      <h2 className="font-serif text-xl font-semibold italic" style={{ color: '#003369' }}>
                {result.prediction.value.toFixed(2)}
                {result.prediction.unit ? ` ${result.prediction.unit}` : ''}
              </h2>
              <p className="text-sm text-ink/50 mt-0.5">
                {result.target.name}
                {ood && <span className="ml-2 text-amber-600 text-xs font-medium">⚠ OOD</span>}
              </p>
              <p className="text-xs text-ink/40 mt-1">
                CI: [{result.prediction.lo.toFixed(2)}, {result.prediction.hi.toFixed(2)}]
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-slate">
            <div>
              <dt className="text-ink/50 mb-1 text-xs">Ketidakpastian</dt>
              <dd className="font-medium">{bandLabel(result.uncertainty.band)}</dd>
            </div>
            <div>
              <dt className="text-ink/50 mb-1 text-xs">Ingredient match</dt>
              <dd className="font-mono font-medium">
                {matched != null ? `${(matched * 100).toFixed(0)}%` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-ink/50 mb-1 text-xs">Gate model</dt>
              <dd className={`font-medium ${result.provenance.gate === 'pass' ? 'text-success-600' : result.provenance.gate === 'fail' ? 'text-danger-600' : 'text-amber-600'}`}>
                {result.provenance.gate}
              </dd>
            </div>
            <div>
              <dt className="text-ink/50 mb-1 text-xs">Metode CI</dt>
              <dd className="font-mono font-medium text-xs">{result.uncertainty.method}</dd>
            </div>
          </dl>

          {/* Findings singkat */}
          {result.verdict.findings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate space-y-1.5">
              <p className="text-xs font-medium text-ink/50 mb-2">Findings constraint check</p>
              {result.verdict.findings.slice(0, 3).map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${f.severity === 'fail' ? 'bg-danger-500' : 'bg-amber-500'}`} aria-hidden="true" />
                  <p className="text-xs text-ink/60 leading-relaxed">[{f.rule}] {f.message}</p>
                </div>
              ))}
              {result.verdict.findings.length > 3 && (
                <p className="text-xs text-ink/30 pl-3.5">+{result.verdict.findings.length - 3} lainnya</p>
              )}
            </div>
          )}

          {/* Warnings dari server */}
          {result.warnings.length > 0 && (
            <div className="mt-3 rounded-md bg-amber-100/60 border border-amber-100 px-3 py-2">
              {result.warnings.slice(0, 2).map((w, i) => (
                <p key={i} className="text-xs text-amber-600">{w}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
