'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/#fitur',      label: 'Service' },
  { href: '/#cara-kerja', label: 'Alur' },
  { href: '/#faq',        label: 'FAQ' },
]

export function Navbar() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function isActive(href: string) {
    if (href.includes('#')) return false
    return pathname.startsWith(href)
  }

  return (
    <header
      className="fixed py-4 inset-x-0 z-50 border-b transition-all duration-300"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        // backgroundColor: scrolled ? 'rgba(235, 244, 255, 0.75)' : 'transparent',
        borderColor: scrolled ? '#D0DCF0' : 'transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2"
        >
          <span
            className="font-serif text-xl font-bold italic"
            style={{ color: '#003369' }}
          >
            Novagon
          </span>
        </Link>

        {/* Nav links */}
        <nav
          className="hidden md:flex items-center gap-2 rounded-full px-3 py-2 transition-colors duration-700"
          style={{
            backgroundColor: scrolled ? '#FFFFFF' : 'rgba(235, 244, 255, 0.3)',
            borderColor: scrolled ? '#AAD3FF' : 'rgba(255,255,255,0.4)',
          }}
          aria-label="Navigasi utama"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={label}
                href={href}
                className="text-sm px-4 py-1.5 rounded-full transition-colors focus-visible:outline-none"
                style={
                  active
                    ? { backgroundColor: '#1A5BA1', color: '#ffffff', fontWeight: 600 }
                    : { color: '#003369' }
                }
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-semibold px-5 py-2 rounded-full border-2 border-[#1A5BA1] text-[#1A5BA1] hover:text-white hover:bg-[#1A5BA1] transition-colors focus-visible:outline-none">
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
