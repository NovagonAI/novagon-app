import type { Node } from '@/lib/insight'
import { fmt, pct } from '@/lib/insight'

const STYLE = {
  ok: 'bg-ok-bg border-ok-border text-ok',
  warn: 'bg-warn-bg border-warn-dark text-warn',
  bad: 'bg-bad-bg border-bad-dark text-bad',
}

const W = 680
const H = 560
const CX = W / 2
const CY = H / 2 + 10
const RX = 265
const RY = 220
const R = 127

const pc = (v: number, of: number) => `${(v / of) * 100}%`

/**
 * The composition map: the main active in a disc at the centre, every other
 * ingredient in a coloured tile on an ellipse around it, dashed spokes between.
 * Every offset is a percentage of the 680×560 stage so it scales with its panel.
 */
export function OrbitalMap({ active, nodes, image = '/figma/molecule-niacinamide.png' }: { active?: Node; nodes: Node[]; image?: string }) {
  const others = nodes.filter((n) => n !== active)
  const n = others.length || 1
  const angle = (i: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI
  return (
    <div className="relative mx-auto w-full max-w-[680px]" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {others.map((_, i) => (
          <line key={i} x1={CX} y1={CY} x2={CX + RX * Math.cos(angle(i))} y2={CY + RY * Math.sin(angle(i))} stroke="#003369" strokeDasharray="4 5" strokeWidth="1" />
        ))}
        <circle cx={CX} cy={CY} r={160} fill="#e2f0ff" stroke="#78b9ff" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx={CX} cy={CY} r={R} fill="#f5f5f5" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ left: pc(CX - R, W), top: pc(CY - R, H), width: pc(2 * R, W), height: pc(2 * R, H) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={image} className="h-[52%] w-auto rounded-full object-contain" />
        <p className={`mt-1 max-w-[94%] truncate font-bold leading-tight text-navy ${(active?.line.inci_name.length ?? 0) > 13 ? 'text-[18px]' : 'text-[24px]'}`} title={active?.line.inci_name}>
          {active?.line.inci_name ?? '—'}
        </p>
        <p className="text-[20px] font-semibold leading-tight text-navy">{active ? `${fmt(pct(active.line))}%` : ''}</p>
      </div>
      {others.map((node, i) => (
        <div
          key={node.line.id}
          title={node.reason}
          className={`absolute flex h-[79px] w-[104px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[10px] border shadow-tile ${STYLE[node.level]}`}
          style={{ left: pc(CX + RX * Math.cos(angle(i)), W), top: pc(CY + RY * Math.sin(angle(i)), H) }}
        >
          <span className="max-w-[92px] truncate text-[11px] font-semibold">{node.line.inci_name}</span>
          <span className="text-[28px] font-bold leading-none">{fmt(pct(node.line))}%</span>
        </div>
      ))}
    </div>
  )
}

export function OrbitalLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[16px] font-semibold text-black">
      <span className="flex items-center gap-[10px]"><span className="size-[23px] rounded-[3px] bg-ok" /> Aman</span>
      <span className="flex items-center gap-[10px]"><span className="size-[23px] rounded-[3px] bg-warn" /> Peringatan</span>
      <span className="flex items-center gap-[10px]"><span className="size-[23px] rounded-[3px] bg-bad" /> Pelanggaran</span>
    </div>
  )
}
