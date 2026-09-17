export function Footer() {
  const cols = [
    {
      title: 'Produk',
      links: ['Fitur', 'Cara Kerja', 'Harga', 'Dokumentasi'],
    },
    {
      title: 'Perusahaan',
      links: ['Tentang Kami', 'Blog', 'Karir', 'Pers'],
    },
    {
      title: 'Dukungan',
      links: ['FAQ', 'Kontak', 'Kebijakan Privasi', 'Syarat Penggunaan'],
    },
  ]

  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-serif text-xl">Synthera</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Platform AI untuk riset dan prediksi formulasi produk kosmetik yang lebih cepat dan lebih akurat.
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 rounded"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 Synthera · Paragon Technology &amp; Innovation. Semua hak dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white/70 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white/70 transition-colors">Syarat Penggunaan</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
