import type { Contribution } from '@/lib/insight'
import { fmt } from '@/lib/insight'

/** Diverging horizontal bars around a zero axis, the Figma "Peran Bahan" chart. */
export function ContributionBars({ rows, max }: { rows: Contribution[]; max?: number }) {
  const scale = max ?? Math.max(1, ...rows.map((r) => Math.abs(r.effect)))
  return (
    <div>
      <div className="relative">
        {rows.map((r) => {
          const w = (Math.abs(r.effect) / scale) * 100
          const pos = r.effect >= 0
          return (
            <div key={r.name} className="grid h-[53px] grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] items-center gap-2">
              <span className={`truncate text-right text-[16px] font-bold ${r.matched ? 'text-navy' : 'text-grey-bar'}`} title={r.matched ? undefined : 'Tidak dikenali model'}>
                {r.name} {fmt(r.pct)}%
              </span>
              <div className="relative h-[40px]">
                <span className="absolute left-1/2 top-[-6px] h-[52px] w-px bg-navy" aria-hidden="true" />
                {r.effect !== 0 && (
                  <span
                    className={`absolute top-0 h-[40px] rounded-[10px] ${pos ? 'bg-sky' : 'bg-grey-bar'}`}
                    style={pos ? { left: '50%', width: `${w / 2}%` } : { right: '50%', width: `${w / 2}%` }}
                  />
                )}
              </div>
              <span className={`text-right text-[16px] font-bold ${pos && r.effect !== 0 ? 'text-blue' : 'text-grey-bar'}`}>
                {r.effect === 0 ? (r.matched ? '0' : '—') : `${pos ? '+' : ''}${fmt(r.effect)}`}
              </span>
            </div>
          )
        })}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_70px] gap-2">
          <span />
          <div className="relative border-t border-navy pt-1 text-[16px] font-bold text-blue">
            <span className="absolute left-0">(-)</span>
            <span className="absolute left-1/2 -translate-x-1/2">0</span>
            <span className="absolute right-0">(+)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
