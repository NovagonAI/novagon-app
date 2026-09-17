import type { TrajectoryPrediction } from '@/lib/api-types'

/** TSI over time with its interval band and the TSI = 3 failure line. */
export function TsiChart({ t }: { t: TrajectoryPrediction }) {
  const W = 220
  const H = 80
  const xs = t.points.map((p) => p.t_day)
  const ys = t.points.flatMap((p) => [p.lo, p.hi, p.value, 3])
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs) || 1
  const y1 = Math.max(...ys) || 1
  const X = (d: number) => ((d - x0) / (x1 - x0 || 1)) * (W - 10) + 5
  const Y = (v: number) => H - 8 - (v / y1) * (H - 16)
  const line = t.points.map((p) => `${X(p.t_day)},${Y(p.value)}`).join(' ')
  const band = [...t.points.map((p) => `${X(p.t_day)},${Y(p.hi)}`), ...[...t.points].reverse().map((p) => `${X(p.t_day)},${Y(p.lo)}`)].join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Trajektori TSI">
      <polygon points={band} fill="#aad3ff" opacity="0.5" />
      <line x1={5} x2={W - 5} y1={Y(3)} y2={Y(3)} stroke="#ba0000" strokeDasharray="3 3" strokeWidth="1" />
      <text x={W - 6} y={Y(3) - 2} fontSize="7" fill="#ba0000" textAnchor="end">TSI=3</text>
      <polyline points={line} fill="none" stroke="#1a5ba1" strokeWidth="1.5" />
      {t.points.map((p) => (
        <circle key={p.t_day} cx={X(p.t_day)} cy={Y(p.value)} r="1.8" fill="#1a5ba1" />
      ))}
    </svg>
  )
}
