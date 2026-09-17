const DIST = [
  { label: 'Stabil',            value: 58, color: 'bg-success-500' },
  { label: 'Perlu review',      value: 22, color: 'bg-amber-500' },
  { label: 'Diproses',          value: 14, color: 'bg-ocean-500' },
  { label: 'Tidak kompatibel',  value: 6,  color: 'bg-danger-500' },
]

export function DistributionChart() {
  return (
    <div className="rounded-xl border border-slate bg-card p-5">
      <p className="text-sm font-medium text-ink mb-5">Distribusi status formulasi</p>
      <div className="space-y-3">
        {DIST.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink/60">{d.label}</span>
              <span className="font-mono text-ink/40">{d.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate2 overflow-hidden">
              <div
                className={`h-full rounded-full ${d.color} transition-all`}
                style={{ width: `${d.value}%` }}
                role="presentation"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
