import { fmt } from '@/lib/insight'

/** The "Nilai Prediksi" track: interval band in light blue, navy tick at the value. */
export function RangeBar({ value, lo, hi, min, max, height = 49, labels = true }: { value: number; lo: number; hi: number; min: number; max: number; height?: number; labels?: boolean }) {
  const span = max - min || 1
  const p = (x: number) => `${Math.max(0, Math.min(100, ((x - min) / span) * 100))}%`
  return (
    <div>
      <div className="relative w-full rounded-[25px] border border-line bg-white" style={{ height }} role="img" aria-label={`Nilai ${fmt(value)}, interval ${fmt(lo)} sampai ${fmt(hi)}`}>
        <span className="absolute top-0 h-full rounded-[25px] bg-line" style={{ left: p(lo), width: `calc(${p(hi)} - ${p(lo)})` }} />
        <span className="absolute top-1/2 h-[60%] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded bg-navy" style={{ left: p(value) }} />
      </div>
      {labels && (
        <div className="mt-2 flex justify-between text-[20px] font-semibold text-grey-text">
          <span>{fmt(min)}</span>
          <span>{fmt((min + max) / 2)}</span>
          <span>{fmt(max)}</span>
        </div>
      )}
    </div>
  )
}
