export function Topbar() {
  return (
    <header className="h-14 bg-card border-b border-slate flex items-center shrink-0 z-10">
      {/* Logo — same width as sidebar (w-48 = 12rem) so search aligns with main content */}
      <div className="hidden md:flex items-center gap-2 w-48 shrink-0 px-5 border-r border-slate h-full">
        <div className="w-6 h-6 rounded-md bg-ocean-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">S</span>
        </div>
        <span className="font-serif text-lg text-ink">Synthera</span>
      </div>

      {/* Mobile logo (visible only when sidebar is hidden) */}
      <div className="flex md:hidden items-center gap-2 px-5">
        <div className="w-6 h-6 rounded-md bg-ocean-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">S</span>
        </div>
        <span className="font-serif text-lg text-ink">Synthera</span>
      </div>

      {/* Search + right actions — fills the rest (aligns with main content) */}
      <div className="flex flex-1 items-center justify-between px-5">
        {/* Search bar */}
        <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-paper px-3 py-1.5 w-64">
          <svg
            className="w-3.5 h-3.5 text-ink/30 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          <span className="text-xs text-ink/40">Cari formulasi, bahan, batch…</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-success-500" aria-label="Status online" />
          <div
            className="w-8 h-8 rounded-full bg-ocean-600 text-white text-xs flex items-center justify-center font-medium"
            aria-label="Avatar pengguna AM"
          >
            AM
          </div>
        </div>
      </div>
    </header>
  )
}
