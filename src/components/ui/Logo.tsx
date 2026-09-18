/**
 * Novagon mark from public/logo.svg painted in `currentColor` through
 * `mask-image`, next to the serif wordmark. `size` is the mark height; the
 * wordmark scales with it.
 */
export function Logo({ size = 36, className = '', text = true }: { size?: number; className?: string; text?: boolean }) {
  const url = 'url(/logo.svg)'
  return (
    <span className={`inline-flex items-center gap-[0.3em] ${className}`} style={{ fontSize: size }}>
      <span
        aria-hidden="true"
        className="inline-block shrink-0 bg-current"
        style={{
          width: size * (564 / 656),
          height: size,
          WebkitMaskImage: url,
          maskImage: url,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      />
      {text && <span className="font-serif font-bold italic leading-none">Novagon</span>}
    </span>
  )
}
