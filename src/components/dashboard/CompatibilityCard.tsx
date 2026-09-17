'use client'

import { useEffect, useState } from 'react'
import { fetchConstraintsCheck, DUMMY_FORMULA_CONSTRAINTS } from '@/lib/api'
import type { ConstraintCheckResponse, Finding } from '@/lib/api'
import { COMPAT_ROWS, COMPAT_STYLE } from '@/lib/data'

// Severity finding → tone mapping
const SEVERITY_STYLE = {
  warn: { dot: 'bg-amber-500', text: 'text-amber-600', label: 'Peringatan' },
  fail: { dot: 'bg-danger-500', text: 'text-danger-600', label: 'Gagal' },
}

// Overall verdict status → UI
const VERDICT_STYLE = {
  pass: { bar: 'bg-success-500', text: 'text-success-700', label: 'Semua constraint lolos' },
  warn: { bar: 'bg-amber-500',   text: 'text-amber-600',   label: 'Ada peringatan' },
  fail: { bar: 'bg-danger-500',  text: 'text-danger-600',  label: 'Ada constraint gagal' },
}

function FindingRow({ finding }: { finding: Finding }) {
  const s = SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE.warn
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-mono text-xs text-ink/50 mr-1.5">[{finding.rule}]</span>
          {finding.inci_name && <span className="font-medium">{finding.inci_name}</span>}
        </p>
        <p className="text-xs text-ink/50 mt-0.5 line-clamp-2">{finding.message}</p>
        {finding.suggestion && (
          <p className="text-xs text-ocean-700 mt-0.5 italic">{finding.suggestion}</p>
        )}
      </div>
      <span className={`text-xs font-medium shrink-0 ${s.text}`}>{s.label}</span>
    </div>
  )
}

export function CompatibilityCard() {
  const [result, setResult] = useState<ConstraintCheckResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConstraintsCheck({
      formula: { lines: DUMMY_FORMULA_CONSTRAINTS },
      product_type: 'face_leave_on',
    })
      .then(setResult)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Gagal memuat data constraint'))
      .finally(() => setLoading(false))
  }, [])

  const verdict = result ? VERDICT_STYLE[result.status] : null

  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: '#D0DCF0' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-serif text-lg font-semibold italic" style={{ color: '#003369' }}>Kompatibilitas bahan aktif</h2>
          <p className="text-xs text-ink/50 mt-0.5">
            {loading
              ? 'Mengecek via /v1/constraints/check…'
              : error
              ? 'Menampilkan data lokal · API tidak tersedia'
              : 'Live dari /v1/constraints/check · face_leave_on'}
          </p>
        </div>

        {/* Status badge */}
        {!loading && verdict && (
          <span className={`text-xs font-medium mt-1 ${verdict.text}`}>
            {verdict.label}
          </span>
        )}
      </div>

      {/* Halal + certifiable flags (kalau ada hasil API) */}
      {!loading && result && (
        <div className="flex gap-3 mt-3 mb-4">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${result.halal_claimable ? 'bg-success-100 text-success-700' : 'bg-slate2 text-ink/50'}`}>
            {result.halal_claimable ? '✓ Halal Claimable' : '✗ Halal Claimable'}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${result.certifiable ? 'bg-success-100 text-success-700' : 'bg-slate2 text-ink/50'}`}>
            {result.certifiable ? '✓ Certifiable' : '✗ Certifiable'}
          </span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate2 animate-pulse mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 rounded bg-slate2 animate-pulse" />
                <div className="h-3 w-full rounded bg-slate2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error fallback — tampilkan data statis dari lib/data */}
      {!loading && error && (
        <>
          <div className="rounded-md border border-amber-100 bg-amber-100/40 px-3 py-2 mb-4">
            <p className="text-xs text-amber-600 font-mono break-all">{error}</p>
          </div>
          <div className="space-y-4">
            {COMPAT_ROWS.map((row) => {
              const s = COMPAT_STYLE[row.level]
              return (
                <div key={row.a + row.b} className="flex items-start gap-3">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{row.a}</span>
                      <span className="text-ink/40"> + </span>
                      <span className="font-medium">{row.b}</span>
                    </p>
                    <p className="text-xs text-ink/50 mt-0.5 truncate">{row.note}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${s.text}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Live findings dari API */}
      {!loading && result && (
        <div className="space-y-4">
          {result.findings.length === 0 ? (
            <div className="flex items-center gap-3 py-2">
              <span className="w-2 h-2 rounded-full bg-success-500 shrink-0" aria-hidden="true" />
              <p className="text-sm text-success-700">Semua bahan lolos constraint check — tidak ada pelanggaran ditemukan.</p>
            </div>
          ) : (
            result.findings.map((f, i) => (
              <FindingRow key={i} finding={f} />
            ))
          )}

          {/* Manufacturing note kalau ada */}
          {result.manufacturing_note && (
            <div className="mt-2 pt-3 border-t border-slate">
              <p className="text-xs text-ink/40 italic">{result.manufacturing_note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
