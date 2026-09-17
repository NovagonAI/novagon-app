'use client'

import { useEffect, useState } from 'react'
import { fetchHeads } from '@/lib/api'
import type { HeadInfo } from '@/lib/api'

const GATE_STYLE = {
  pass:         { dot: 'bg-success-500', text: 'text-success-700', label: 'Pass' },
  fail:         { dot: 'bg-danger-500',  text: 'text-danger-600',  label: 'Fail' },
  not_measured: { dot: 'bg-amber-500',   text: 'text-amber-600',   label: 'N/A'  },
}

function GateBadge({ gate }: { gate: HeadInfo['gate'] }) {
  const s = GATE_STYLE[gate] ?? GATE_STYLE.not_measured
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function ApiHeadsCard() {
  const [heads, setHeads] = useState<HeadInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeads()
      .then((res) => setHeads(res.heads))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Gagal memuat data head'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: '#D0DCF0' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-serif text-lg font-semibold italic" style={{ color: '#003369' }}>Status Model Head</h2>
          <p className="text-xs text-ink/50 mt-0.5">
            Live dari <span className="font-mono">/v1/heads</span> · 13 head tersedia
          </p>
        </div>
        {/* Live indicator */}
        <span className="flex items-center gap-1.5 text-xs text-ink/40 mt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${
            loading ? 'bg-amber-500 animate-pulse' :
            error   ? 'bg-danger-500' :
                      'bg-success-500'
          }`} aria-hidden="true" />
          {loading ? 'Memuat…' : error ? 'Error' : 'Live'}
        </span>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-slate2 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="mt-4 rounded-lg border border-danger-100 bg-danger-100/50 px-4 py-3">
          <p className="text-sm text-danger-600 font-medium">Tidak dapat memuat data head</p>
          <p className="text-xs text-danger-600/70 mt-1 font-mono break-all">{error}</p>
          <p className="text-xs text-ink/40 mt-2">
            Pastikan URL API di <span className="font-mono">NEXT_PUBLIC_API_BASE_URL</span> sudah benar dan server sedang berjalan.
          </p>
        </div>
      )}

      {/* Heads table */}
      {!loading && heads && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#D0DCF0' }}>
                <th className="text-left pb-2 text-xs font-medium text-ink/40 pr-4">Head</th>
                <th className="text-left pb-2 text-xs font-medium text-ink/40 pr-4">Target</th>
                <th className="text-center pb-2 text-xs font-medium text-ink/40 pr-4">Gate</th>
                <th className="text-right pb-2 text-xs font-medium text-ink/40 pr-4">Metrik</th>
                <th className="text-center pb-2 text-xs font-medium text-ink/40">Aktif</th>
              </tr>
            </thead>
            <tbody>
              {heads.map((h, i) => (
                <tr
                  key={h.head}
                  className={`${i < heads.length - 1 ? 'border-b' : ''} ${
                    !h.available || !h.served ? 'opacity-50' : ''
                  }`}
                  style={{ borderColor: '#D0DCF0' }}
                >
                  {/* Head ID */}
                  <td className="py-2.5 pr-4">
                    <span className="font-mono text-xs font-medium text-ocean-700 bg-ocean-50 rounded px-1.5 py-0.5">
                      {h.head}
                    </span>
                  </td>

                  {/* Target name */}
                  <td className="py-2.5 pr-4 text-ink/70 text-xs max-w-[160px] truncate" title={h.name}>
                    {h.name}
                  </td>

                  {/* Gate badge */}
                  <td className="py-2.5 pr-4 text-center">
                    <GateBadge gate={h.gate} />
                  </td>

                  {/* Metric value */}
                  <td className="py-2.5 pr-4 text-right">
                    <span className="font-mono text-xs text-ink/60">
                      {h.value != null ? h.value.toFixed(4) : '—'}
                    </span>
                    <span className="block text-[10px] text-ink/30 font-mono">{h.metric}</span>
                  </td>

                  {/* Available + served dot */}
                  <td className="py-2.5 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        h.available && h.served ? 'bg-success-500' : 'bg-slate'
                      }`}
                      aria-label={h.available && h.served ? 'Aktif' : 'Tidak aktif'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bug note */}
          <p className="mt-3 text-[11px] text-ink/30 leading-relaxed">
            ⚠ Kolom &quot;Metrik&quot; menampilkan nilai <em>headline</em>, bukan <em>served</em> (bug diketahui di /v1/heads).
            H1, H3, H6, H11 memiliki gap headline ≠ served.
          </p>
        </div>
      )}
    </div>
  )
}
