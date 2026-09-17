import { TABLE_ROWS, STATUS_STYLE } from '@/lib/data'

export function FormulationTable() {
  return (
    <div className="rounded-xl border border-slate overflow-hidden bg-card">
      <div className="px-5 py-4 border-b border-slate">
        <h2 className="font-serif text-lg text-ink">Riwayat Formulasi</h2>
        <p className="text-xs text-ink/50 mt-0.5">5 entri terbaru</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate2 text-left">
              <th className="px-4 py-3 text-xs font-medium text-ink/50">ID</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Tanggal</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Bahan Utama</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Stabilitas</th>
              <th className="px-4 py-3 text-xs font-medium text-ink/50">Status</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((r, i) => (
              <tr key={r.id} className={i < TABLE_ROWS.length - 1 ? 'border-b border-slate' : ''}>
                <td className="px-4 py-3 font-mono text-xs text-ink/70">{r.id}</td>
                <td className="px-4 py-3 text-ink/70 whitespace-nowrap">{r.tanggal}</td>
                <td className="px-4 py-3 text-ink">{r.bahan}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-slate2 overflow-hidden">
                      <div
                        className="h-full bg-ocean-500 rounded-full"
                        style={{ width: `${r.stabilitas}%` }}
                        role="presentation"
                      />
                    </div>
                    <span className="font-mono text-xs text-ink/50">{r.stabilitas}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[r.status].cls}`}>
                    {STATUS_STYLE[r.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
