import { BENEFITS } from '@/lib/data'

// SVG icons keyed by benefit title
const BENEFIT_ICONS: Record<string, React.ReactNode> = {
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
  'Manajemen Batch': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  ),
  'Insight AI': (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-ocean-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
}

export function BenefitsSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left text */}
          <div className="sticky top-24">
            <span className="text-xs font-medium text-ocean-600 uppercase tracking-widest mb-3 block">Manfaat</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight mb-6">
              Rasakan manfaatnya sejak{' '}
              <em className="not-italic italic text-ocean-600">hari pertama</em>
            </h2>
            <p className="text-ink/60 leading-relaxed mb-8 max-w-md">
              Dirancang untuk mempercepat proses riset tanpa mengorbankan presisi — dari input bahan pertama hingga laporan akhir.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium bg-ocean-600 text-white px-5 py-2.5 rounded-md hover:bg-ocean-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600"
            >
              Mulai sekarang →
            </a>
          </div>

          {/* Right: 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-slate2 rounded-xl border border-slate p-5">
                <div className="w-10 h-10 rounded-full bg-white border border-slate flex items-center justify-center mb-3">
                  {BENEFIT_ICONS[b.title]}
                </div>
                <h3 className="font-serif text-lg text-ink mb-1">{b.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
