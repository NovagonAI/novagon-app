'use client'

import { fmt } from '@/lib/insight'

/**
 * The Figma slider: white track, a light-blue pill thumb with a navy line
 * through its centre. A native range input underneath, so it drags, takes
 * keyboard arrows and reads to screen readers. Read-only when no onChange.
 */
export function RangeBar({
  value,
  min,
  max,
  onChange,
  height = 49,
  thumb = 210,
  labels = true,
  ariaLabel = 'Nilai',
  className = '',
}: {
  value: number
  min: number
  max: number
  onChange?: (v: number) => void
  height?: number
  thumb?: number
  labels?: boolean
  ariaLabel?: string
  className?: string
}) {
  const step = max - min > 10 ? 0.1 : 0.01
  return (
    <div className={className}>
      <input
        type="range"
        className="range-pill"
        style={{ height, ['--thumb-w' as string]: `${thumb}px`, ['--track-h' as string]: `${height}px`, ['--thumb-h' as string]: `${Math.round(height * 0.6)}px` }}
        min={min}
        max={max}
        step={step}
        value={Math.max(min, Math.min(max, value))}
        aria-label={ariaLabel}
        aria-valuetext={fmt(value)}
        readOnly={!onChange}
        onChange={(e) => onChange?.(Number(e.target.value))}
        onPointerDown={onChange ? undefined : (e) => e.preventDefault()}
      />
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
