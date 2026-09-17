import type { ReactNode } from 'react'

/**
 * The Figma card: mist fill, 4px gradient stroke, 20px radius, a 20px bold
 * header separated by a 2px #aad3ff rule. `white` swaps the fill.
 */
export function Panel({
  title,
  right,
  children,
  white = false,
  className = '',
  bodyClassName = '',
  titleClassName = '',
}: {
  title?: ReactNode
  right?: ReactNode
  children?: ReactNode
  white?: boolean
  className?: string
  bodyClassName?: string
  titleClassName?: string
}) {
  return (
    <section className={`${white ? 'panel-white' : 'panel'} overflow-hidden ${className}`}>
      {title !== undefined && (
        <header className="flex min-h-[58px] items-center justify-between gap-4 border-b-2 border-line px-[22px] py-3">
          <h2 className={`text-[20px] font-bold leading-tight text-black ${titleClassName}`}>{title}</h2>
          {right}
        </header>
      )}
      <div className={`px-[22px] py-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

/** Plain white box with the 1px navy stroke used for rows inside a panel. */
export function Box({ children, className = '', muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return <div className={`rounded-[10px] border bg-white ${muted ? 'border-line' : 'border-navy'} ${className}`}>{children}</div>
}
