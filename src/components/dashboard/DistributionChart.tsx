const DIST = [
  { label: 'Stabil',            value: 58, color: '#2F7D52' },
  { label: 'Perlu review',      value: 22, color: '#B4863C' },
  { label: 'Diproses',          value: 14, color: '#1A5BA1' },
  { label: 'Tidak kompatibel',  value: 6,  color: '#B14432' },
]

export function DistributionChart() {
  return (
    <div className="rounded-2xl border bg-card p-5 h-full" style={{ borderColor: '#D0DCF0' }}>
      <p className="text-sm font-semibold mb-5" style={{ color: '#003369' }}>Distribusi status formulasi</p>
      <div className="space-y-3">
        {DIST.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: '#003369', opacity: 0.6 }}>{d.label}</span>
              <span className="font-mono" style={{ color: '#003369', opacity: 0.4 }}>{d.value}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DCF0' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${d.value}%`, backgroundColor: d.color }}
                role="presentation"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
