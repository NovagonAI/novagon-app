import { COMPAT_ROWS, COMPAT_STYLE } from '@/lib/data'

export function CompatibilityCard() {
  return (
    <div className="rounded-xl border border-slate bg-card p-6">
      <h2 className="font-serif text-lg text-ink mb-1">Kompatibilitas bahan aktif</h2>
      <p className="text-xs text-ink/50 mb-5">Dihitung otomatis saat bahan ditambahkan ke formulasi</p>

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
    </div>
  )
}
