/** Half-ring gauge as in the Figma "Stabilitas Emulsi" card: grey track, coloured progress, serif value inside. */
export function Gauge({ value, label, color = '#009d1f', width = 146 }: { value: number; label?: string; color?: string; width?: number }) {
  const r = 68
  const cx = 73
  const cy = 77
  const half = Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label ?? ''} ${Math.round(v * 100)}%`}>
      <svg width={width} height={width * 0.6} viewBox="0 0 146 88">
        <path d={arc} fill="none" stroke="#a1a1a1" strokeWidth="9" strokeLinecap="round" />
        <path d={arc} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${half * v} ${half}`} />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="32" fontWeight="700" fontStyle="italic" fill="#003369" fontFamily="var(--font-libre), serif">
          {Math.round(v * 100)}%
        </text>
      </svg>
      {label && <span className="-mt-1 text-[11px] font-semibold text-grey-text">{label}</span>}
    </div>
  )
}
