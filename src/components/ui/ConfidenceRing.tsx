export function ConfidenceRing({ value }: { value: number }) {
  const deg = Math.round((value / 100) * 360)
  return (
    <div
      className="relative w-20 h-20 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `conic-gradient(#155691 ${deg}deg, #D2E7F7 0deg)` }}
      role="img"
      aria-label={`Tingkat keyakinan ${value}%`}
    >
      <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center">
        <span className="font-mono text-sm text-ocean-700">{value}%</span>
      </div>
    </div>
  )
}
