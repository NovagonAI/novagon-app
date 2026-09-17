/**
 * Six flat bars with a label under each, the active one in blue. Clickable
 * only for steps already visited, so a formulator can go back but not skip.
 */
export function Stepper({
  steps,
  current,
  reached = current,
  onSelect,
  className = '',
}: {
  steps: readonly string[]
  current: number
  reached?: number
  onSelect?: (index: number) => void
  className?: string
}) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="grid gap-x-[9px]" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((label, i) => {
          const n = i + 1
          const active = n === current
          const clickable = !!onSelect && n <= reached && !active
          return (
            <li key={label} aria-current={active ? 'step' : undefined} className="min-w-0">
              <button
                type="button"
                onClick={clickable ? () => onSelect?.(n) : undefined}
                disabled={!clickable}
                className={`block w-full text-center ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`block h-[10px] w-full rounded-[20px] ${active ? 'bg-blue' : 'bg-grey-bar'}`} />
                <span className={`mt-[6px] block truncate text-[14px] font-bold ${active ? 'text-blue' : 'text-grey-bar'}`}>{label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
