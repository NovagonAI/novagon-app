import type { HealthResponse } from '@/lib/api'

interface TopbarProps {
  health?: HealthResponse | null
}

export function Topbar({ health }: TopbarProps) {
  const isOnline = health?.status === 'ok'

  return (
    <header className="h-14 bg-card border-b border-slate flex items-center shrink-0 z-10">
      {/* Logo — same width as sidebar (w-52) so search aligns with main content */}
      <div className="hidden md:flex items-center gap-2 w-52 shrink-0 px-5 border-r border-slate h-full">
        <span className="font-serif text-lg text-ink">Novagon</span>
      </div>

      {/* Mobile logo */}
      <div className="flex md:hidden items-center gap-2 px-5">
        <div className="w-6 h-6 rounded-md bg-ocean-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">N</span>
        </div>
        <span className="font-serif text-lg text-ink">Novagon</span>
      </div>

      {/* Search + right actions */}
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

        {/* Right side: API status pill + user avatar */}
        <div className="flex items-center gap-3">
          {/* API server status pill — ditampilkan kalau health tersedia */}
          {health !== undefined && (
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border ${
                isOnline
                  ? 'bg-success-100 text-success-700 border-success-100'
                  : 'bg-danger-100 text-danger-600 border-danger-100'
              }`}
              title={
                isOnline
                  ? `API online · ${health!.artifact_release_tag} · uptime ${Math.floor(health!.uptime_s / 60)} mnt`
                  : 'API tidak tersedia'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-success-500' : 'bg-danger-500'}`}
                aria-hidden="true"
              />
              {isOnline ? (
                <>
                  <span>API Online</span>
                  <span className="text-ink/30 mx-0.5">·</span>
                  <span className="font-mono text-[10px] opacity-70">{health!.artifact_release_tag}</span>
                </>
              ) : (
                <span>API Offline</span>
              )}
            </div>
          )}

          {/* Online dot */}
          <span className="w-2 h-2 rounded-full bg-success-500" aria-label="Status online" />

          {/* User avatar */}
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
