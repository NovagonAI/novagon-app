/** Profile photo, or the name's initials on the grey track when there is none. */
export function Avatar({ src, name, size = 48, className = '' }: { src?: string | null; name: string; size?: number; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-full bg-grey-track font-bold text-navy ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </span>
  )
}
