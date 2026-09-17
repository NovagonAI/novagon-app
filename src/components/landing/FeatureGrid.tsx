import { FEATURES } from '@/lib/data'

// SVG icons keyed by feature title
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  'Prediksi Instan': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  'Validasi BPOM': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  'Analisis Kompatibilitas': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  'Laporan Eksperimen': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
}

export function FeatureGrid() {
  return (
    <section id="fitur" className="py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-medium text-ocean-600 uppercase tracking-widest mb-3 block">Fitur Unggulan</span>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Jelajahi fitur <em className="not-italic italic">unggulan</em> kami
          </h2>
          <p className="text-ink/60 mt-4 max-w-xl mx-auto">
            Semua yang dibutuhkan tim formulator untuk bekerja lebih cepat, lebih akurat, dan lebih percaya diri.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-xl border border-slate p-6 hover:border-ocean-200 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-ocean-50 flex items-center justify-center mb-4">
                {FEATURE_ICONS[f.title]}
              </div>
              <h3 className="font-serif text-lg text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
