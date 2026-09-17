import { FORMULA_INGREDIENTS } from '@/lib/data'
import { Badge } from '@/components/ui/Badge'

export function FormulationCard() {
  return (
    <div className="rounded-xl border border-slate bg-card p-6">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-xs text-ink/50 mb-1">Formulasi FM-2381</p>
          <h2 className="font-serif text-xl text-ink">Serum Niacinamide 5% + Centella</h2>
        </div>
        <Badge tone="success">Stabil</Badge>
      </div>
      <p className="text-xs text-ink/50 mb-5">Diperbarui 10 Sep 2026 oleh tim Riset Formulasi 2</p>

      <div className="space-y-2.5 mb-5">
        {FORMULA_INGREDIENTS.map((ing) => (
          <div key={ing.name}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-ink/80">{ing.name}</span>
              <span className="font-mono text-xs text-ink/50">{ing.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  ing.tone === 'ocean'
                    ? 'bg-ocean-500'
                    : ing.tone === 'sky'
                    ? 'bg-ocean-300'
                    : 'bg-slate'
                }`}
                style={{ width: `${Math.min(ing.pct * 1.5, 100)}%` }}
                role="presentation"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate">
        <button className="text-sm font-medium border border-ink/20 text-ink px-3 py-1.5 rounded-md hover:border-ink/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600">
          Lihat detail
        </button>
        <button className="text-sm text-ink/60 px-3 py-1.5 rounded-md hover:bg-slate2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600">
          Duplikasi
        </button>
      </div>
    </div>
  )
}
