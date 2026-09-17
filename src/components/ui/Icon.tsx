/**
 * Figma-exported vuesax icons drawn through `mask-image`, so one SVG file
 * serves every colour: the box is painted in `currentColor` and the icon's
 * alpha cuts it out. Gradient-filled icons keep their own paint via <img>.
 */
export function Icon({ name, size = 24, className = '', title }: { name: string; size?: number; className?: string; title?: string }) {
  const url = `url(/figma/icon-${name}.svg)`
  return (
    <span
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  )
}

/** Gradient-painted export used as-is (report format tiles, scanner buttons). */
export function ArtIcon({ name, size = 51, className = '', alt = '' }: { name: string; size?: number; className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/figma/icon-${name}.svg`} width={size} height={size} alt={alt} className={`shrink-0 ${className}`} />
}
