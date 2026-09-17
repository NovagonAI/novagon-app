import { FORMULA_INGREDIENTS } from '@/lib/data'
import { Badge } from '@/components/ui/Badge'

export function FormulationCard() {
  return (
    <div className="rounded-2xl border bg-card p-6" style={{ borderColor: '#D0DCF0' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs mb-1" style={{ color: '#003369', opacity: 0.5 }}>Formulasi FM-2381</p>
          <h2 className="font-serif text-xl font-semibold italic" style={{ color: '#003369' }}>Serum Niacinamide 5% + Centella</h2>
        </div>
        <Badge tone="success">Stabil</Badge>
      </div>
      <p className="text-xs mb-5" style={{ color: '#003369', opacity: 0.5 }}>Diperbarui 10 Sep 2026 oleh tim Riset Formulasi 2</p>

      <div className="space-y-2.5 mb-5">
        {FORMULA_INGREDIENTS.map((ing) => (
          <div key={ing.name}>
            <div className="flex justify-between text-sm mb-1">
              <span style={{ color: '#003369', opacity: 0.8 }}>{ing.name}</span>
              <span className="font-mono text-xs" style={{ color: '#003369', opacity: 0.5 }}>{ing.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EBF4FF' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(ing.pct * 1.5, 100)}%`,
                  backgroundColor: ing.tone === 'ocean' ? '#1A5BA1' : ing.tone === 'sky' ? '#84A0E4' : '#D0DCF0',
                }}
                role="presentation"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t" style={{ borderColor: '#D0DCF0' }}>
        <button
          className="text-sm font-medium border px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none"
          style={{ borderColor: '#AAD3FF', color: '#1A5BA1' }}
        >
          Lihat detail
        </button>
        <button
          className="text-sm px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none"
          style={{ color: '#003369', opacity: 0.6 }}
        >
          Duplikasi
        </button>
      </div>
    </div>
  )
}
