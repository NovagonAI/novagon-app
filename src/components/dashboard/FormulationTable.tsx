import { TABLE_ROWS, STATUS_STYLE } from '@/lib/data'

export function FormulationTable() {
  return (
    <div className="rounded-2xl border overflow-hidden bg-card" style={{ borderColor: '#D0DCF0' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: '#D0DCF0' }}>
        <h2 className="font-serif text-lg font-semibold italic" style={{ color: '#003369' }}>Riwayat Formulasi</h2>
        <p className="text-xs mt-0.5" style={{ color: '#003369', opacity: 0.5 }}>5 entri terbaru</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#EBF4FF' }}>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#003369', opacity: 0.5 }}>ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#003369', opacity: 0.5 }}>Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#003369', opacity: 0.5 }}>Bahan Utama</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#003369', opacity: 0.5 }}>Stabilitas</th>
              <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#003369', opacity: 0.5 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((r, i) => (
              <tr key={r.id} className={i < TABLE_ROWS.length - 1 ? 'border-b' : ''} style={{ borderColor: '#D0DCF0' }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#003369', opacity: 0.7 }}>{r.id}</td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#003369', opacity: 0.7 }}>{r.tanggal}</td>
                <td className="px-4 py-3" style={{ color: '#003369' }}>{r.bahan}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EBF4FF' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.stabilitas}%`, backgroundColor: '#1A5BA1' }}
                        role="presentation"
                      />
                    </div>
                    <span className="font-mono text-xs" style={{ color: '#003369', opacity: 0.5 }}>{r.stabilitas}%</span>
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
