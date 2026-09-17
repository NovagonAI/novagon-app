function FloatingTag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute bg-card rounded-full border border-slate shadow-sm px-3 py-1.5 text-xs font-medium text-ink flex items-center gap-1.5 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-ocean-500" aria-hidden="true" />
      {children}
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="bg-paper pt-16 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="text-center md:text-left">
            <span className="inline-flex items-center rounded-full border border-slate px-3 py-1 text-xs text-ink/60 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-500 mr-2" aria-hidden="true" />
              Riset formulasi berbasis AI
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink leading-tight mb-6">
              Prediksi formulasi,{' '}
              <em className="not-italic font-serif italic text-ocean-600">jauh lebih cepat</em>
            </h1>

            <p className="text-ink/60 text-lg leading-relaxed mb-8 max-w-lg mx-auto md:mx-0">
              Uji kombinasi bahan aktif dan lihat prediksi stabilitas dalam hitungan detik — bukan minggu. Dibangun untuk tim R&D Paragon.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center bg-ocean-600 text-white text-sm font-medium px-6 py-3 rounded-md hover:bg-ocean-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600"
              >
                Mulai Prediksi
              </a>
              <button className="inline-flex items-center justify-center border border-ink/20 text-ink text-sm font-medium px-6 py-3 rounded-md hover:border-ink/40 hover:bg-slate2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600">
                <span className="w-6 h-6 rounded-full border border-ink/20 flex items-center justify-center mr-2 text-xs" aria-hidden="true">▶</span>
                Lihat Cara Kerja
              </button>
            </div>
          </div>

          {/* Right: circle image + floating tags */}
          <div className="relative flex items-center justify-center mt-8 md:mt-0">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Circle image */}
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate2 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://image.idn.media/post/20250724/upload_8e9eb4084385d49e6fd3ba8fae699a0f_d6e8ef7d-0e89-4640-a9cc-ce09d0ec08bb.jpg"
                  alt="Ilustrasi laboratorium riset formulasi"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating tags */}
              <FloatingTag className="-left-8 sm:-left-16 top-8">Stabilitas tinggi</FloatingTag>
              <FloatingTag className="-right-4 sm:-right-10 top-1/2 -translate-y-1/2">Risiko rendah</FloatingTag>
              <FloatingTag className="left-2/3 -translate-x-1/2 -bottom-4">92% keyakinan</FloatingTag>

              {/* Stat bubbles */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-card rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg border border-slate">
                <p className="text-[10px] sm:text-xs text-ink/50">Akurasi model</p>
                <p className="font-serif text-lg sm:text-xl text-ink">92,4%</p>
              </div>

              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-card rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow-lg border border-slate flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-500" aria-hidden="true" />
                <p className="text-[10px] sm:text-xs text-ink">1.248 formulasi diuji</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
