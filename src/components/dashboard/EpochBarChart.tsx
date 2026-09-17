import { EPOCH_BARS } from '@/lib/data'

export function EpochBarChart() {
  const max = Math.max(...EPOCH_BARS)
  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col h-full" style={{ borderColor: '#D0DCF0' }}>
      <p className="text-sm font-semibold" style={{ color: '#003369' }}>Akurasi model per iterasi latih</p>
      <p className="text-xs mt-0.5 mb-6" style={{ color: '#003369', opacity: 0.5 }}>Model v2.5 · 8 epoch terakhir</p>

      <div className="flex items-end gap-2 flex-1" style={{ minHeight: '7rem' }}>
        {EPOCH_BARS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono" style={{ color: '#003369', opacity: 0.4 }}>{v}%</span>
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${(v / max) * 100}%`, minHeight: '4px', backgroundColor: '#1A5BA1' }}
              role="presentation"
            />
            <span className="text-[10px] font-mono" style={{ color: '#003369', opacity: 0.3 }}>{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
