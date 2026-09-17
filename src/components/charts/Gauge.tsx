/** 270° arc gauge: grey track, coloured progress, serif value in the centre. */
export function Gauge({ value, label, color = '#00a120', size = 137 }: { value: number; label?: string; color?: string; size?: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const arc = c * 0.75
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label ?? ''} ${Math.round(v * 100)}%`}>
      <svg width={size} height={size * 0.62} viewBox="0 0 100 62">
        <g transform="translate(50 50) rotate(135)">
          <circle r={r} cx="0" cy="0" fill="none" stroke="#d9d9d9" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
          <circle r={r} cx="0" cy="0" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${arc * v} ${c}`} />
        </g>
        <text x="50" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fontStyle="italic" fill="#003369" fontFamily="var(--font-libre), serif">
          {Math.round(v * 100)}%
        </text>
      </svg>
      {label && <span className="-mt-1 text-[11px] font-semibold text-grey-text">{label}</span>}
    </div>
  )
}
