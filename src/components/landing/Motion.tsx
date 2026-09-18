'use client'

import { useEffect, useRef } from 'react'

/** Fades and slides children in once they scroll into view. Honors reduced motion. */
export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/**
 * Wave divider between two bands. Sits at the bottom of a section and is
 * filled with the NEXT section's colour, so the current background shows
 * through above the curve.
 */
export function Wave({ fill, className = '' }: { fill: string; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className={`block h-[clamp(36px,6vw,90px)] w-full ${className}`}>
      <path fill={fill} d="M0,52 C240,100 480,4 720,40 C960,76 1200,16 1440,58 L1440,90 L0,90 Z" />
    </svg>
  )
}
