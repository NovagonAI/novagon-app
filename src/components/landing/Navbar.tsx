import Link from 'next/link'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b border-slate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 rounded">
          <span className="font-serif text-xl text-ink">Synthera</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Navigasi utama">
          {[
            { href: '#fitur', label: 'Fitur' },
            { href: '#cara-kerja', label: 'Cara Kerja' },
            { href: '#testimoni', label: 'Testimoni' },
            { href: '#faq', label: 'FAQ' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-ink/60 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 rounded"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex text-sm text-ink/70 hover:text-ink px-3 py-2 rounded-md hover:bg-slate2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600"
          >
            Masuk
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex text-sm font-medium bg-ocean-600 text-white px-4 py-2 rounded-md hover:bg-ocean-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
