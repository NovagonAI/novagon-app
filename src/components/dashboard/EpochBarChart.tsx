import { EPOCH_BARS } from '@/lib/data'

export function EpochBarChart() {
  const max = Math.max(...EPOCH_BARS)
  return (
    <div className="rounded-xl border border-slate bg-card p-5 flex flex-col">
      <p className="text-sm font-medium text-ink mb-1">Akurasi model per iterasi latih</p>
      <p className="text-xs text-ink/50 mb-6">Model v2.5 · 8 epoch terakhir</p>

      <div className="flex items-end gap-2 flex-1" style={{ minHeight: '7rem' }}>
        {EPOCH_BARS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono text-ink/40">{v}%</span>
            <div
              className="w-full rounded-t bg-ocean-500 transition-all"
              style={{ height: `${(v / max) * 100}%`, minHeight: '4px' }}
              role="presentation"
            />
            <span className="text-[10px] font-mono text-ink/30">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
